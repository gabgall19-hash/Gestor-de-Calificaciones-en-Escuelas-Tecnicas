import { 
  validateUser, 
  json, 
  logHistory, 
  toNumber, 
  sanitizeTecMaterias, 
  getDuplicateCurricularNames, 
  normalizeCurricularName 
} from "../_helpers.js";

// ─── Academic Internal Helpers ───────────────────────────────────────────────

function removeSubjectPairsFromAssignments(currentValue, deletedIdsSet) {
  return String(currentValue || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((pair) => {
      const [, subjectId] = pair.split('-');
      return !deletedIdsSet.has(Number(subjectId));
    })
    .join(',');
}

function sanitizeSchedulePayload(gridData, deletedIdsSet, deletedNamesSet) {
  let parsed;
  try {
    parsed = JSON.parse(gridData || '[]');
  } catch {
    return { changed: false, serialized: gridData || '[]' };
  }
  const payload = Array.isArray(parsed)
    ? { meta: {}, grid: parsed }
    : { meta: parsed?.meta || {}, grid: Array.isArray(parsed?.grid) ? parsed.grid : [] };
  let changed = false;
  const nextGrid = payload.grid.map((row) => {
    if (row?.type === 'break' || !row?.days) return row;
    let rowChanged = false;
    const nextDays = { ...row.days };
    Object.keys(nextDays).forEach((day) => {
      const cell = nextDays[day];
      const subjectId = Number(cell?.subject_id);
      const subjectName = normalizeCurricularName(cell?.subject);
      const shouldClear = deletedIdsSet.has(subjectId) || (!!subjectName && deletedNamesSet.has(subjectName));
      if (!shouldClear) return;
      rowChanged = true;
      changed = true;
      nextDays[day] = { ...cell, subject: '', teacher: '', subject_id: null, teacher_id: null };
    });
    return rowChanged ? { ...row, days: nextDays } : row;
  });
  const nextAssignments = {};
  const currentAssignments = payload.meta?.subjectAssignments && typeof payload.meta.subjectAssignments === 'object' ? payload.meta.subjectAssignments : {};
  Object.entries(currentAssignments).forEach(([key, value]) => {
    const matchesDeletedId = /^subject-(\d+)$/.test(key) && deletedIdsSet.has(Number(key.replace('subject-', '')));
    const matchesDeletedName = key.startsWith('subject-name-') && deletedNamesSet.has(key.replace('subject-name-', ''));
    if (matchesDeletedId || matchesDeletedName) {
      changed = true;
      return;
    }
    nextAssignments[key] = value;
  });
  const nextMeta = Object.keys(nextAssignments).length > 0 ? { ...payload.meta, subjectAssignments: nextAssignments } : Object.prototype.hasOwnProperty.call(payload.meta || {}, 'subjectAssignments') ? (() => { changed = true; const { subjectAssignments, ...restMeta } = payload.meta || {}; return restMeta; })() : payload.meta;
  return { changed, serialized: JSON.stringify({ meta: nextMeta || {}, grid: nextGrid }) };
}

async function syncProfessorAssignmentsForCourse(env, courseId, gridData) {
  const parsed = JSON.parse(gridData || '[]');
  const grid = Array.isArray(parsed) ? parsed : (parsed.grid || []);
  const newAssignmentsByTeacher = {};
  grid.forEach((row) => {
    if (row?.type === 'break' || !row?.days) return;
    Object.values(row.days).forEach((cell) => {
      if (cell?.teacher_id && cell?.subject_id) {
        const teacherId = Number(cell.teacher_id);
        const subjectId = Number(cell.subject_id);
        if (!newAssignmentsByTeacher[teacherId]) newAssignmentsByTeacher[teacherId] = new Set();
        newAssignmentsByTeacher[teacherId].add(subjectId);
      }
    });
  });
  const teacherIds = Object.keys(newAssignmentsByTeacher).map(Number);
  const [validSubjects, professorsRes] = await Promise.all([
    env.DB.prepare('SELECT id FROM materias WHERE tecnicatura_id = (SELECT tecnicatura_id FROM cursos WHERE id = ?)').bind(courseId).all(),
    env.DB.prepare(`SELECT id, rol, professor_subject_ids, is_professor_hybrid FROM usuarios WHERE (rol = 'profesor' OR rol = 'preceptor' OR rol = 'preceptor_taller' OR rol = 'preceptor_ef' OR is_professor_hybrid = 1) AND (id IN (${teacherIds.length ? teacherIds.map(() => '?').join(',') : 'NULL'}) OR professor_subject_ids LIKE ?)`).bind(...(teacherIds.length ? teacherIds : []), `%${courseId}-%`).all()
  ]);
  const validSubjectIds = new Set(validSubjects.results.map((subject) => subject.id));
  const verifiedAssignmentsByTeacher = {};
  teacherIds.forEach((teacherId) => {
    newAssignmentsByTeacher[teacherId].forEach((subjectId) => {
      if (!validSubjectIds.has(subjectId)) return;
      if (!verifiedAssignmentsByTeacher[teacherId]) verifiedAssignmentsByTeacher[teacherId] = new Set();
      verifiedAssignmentsByTeacher[teacherId].add(subjectId);
    });
  });
  const updateStatements = [];
  for (const professor of professorsRes.results) {
    const currentIds = String(professor.professor_subject_ids || '').split(',').filter(Boolean);
    const filteredIds = currentIds.filter((pair) => !pair.startsWith(`${courseId}-`));
    const newForThisCourse = verifiedAssignmentsByTeacher[professor.id];
    if (newForThisCourse) newForThisCourse.forEach((subjectId) => { filteredIds.push(`${courseId}-${subjectId}`); });
    const finalIds = [...new Set(filteredIds)].join(',');
    const shouldActivateHybrid = !!newForThisCourse && ['preceptor', 'preceptor_taller', 'preceptor_ef'].includes(professor.rol) && !professor.is_professor_hybrid;
    if (finalIds !== (professor.professor_subject_ids || '') || shouldActivateHybrid) {
      updateStatements.push(env.DB.prepare('UPDATE usuarios SET professor_subject_ids = ?, is_professor_hybrid = ? WHERE id = ?').bind(finalIds, shouldActivateHybrid ? 1 : (professor.is_professor_hybrid ? 1 : 0), professor.id));
    }
  }
  if (updateStatements.length > 0) await env.DB.batch(updateStatements);
}

// ─── Handlers ────────────────────────────────────────────────────────────────

export async function handleCourses(env, request, userId, body) {
  await validateUser(env, request, userId, 'admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector', 'regente_profesores');
  const { action, ano, division, turno, tecnicatura_id, year_id } = body;
  if (action === 'create') {
    const r = await env.DB.prepare('INSERT INTO cursos (ano, division, turno, tecnicatura_id, year_id, detalle) VALUES (?, ?, ?, ?, ?, ?) RETURNING *').bind(ano, division, turno, tecnicatura_id, year_id, body.detalle || '').first();
    await logHistory(env, userId, r.id, 'gestion_cursos', `Curso creado: ${ano} ${division} ${turno}`);
    return json({ success: true, course: r });
  }
  if (action === 'toggle_active') {
    const { courseId, activo } = body;
    await env.DB.prepare('UPDATE cursos SET activo = ? WHERE id = ?').bind(activo ? 1 : 0, courseId).run();
    return json({ success: true });
  }
  if (action === 'delete') {
    await validateUser(env, request, userId, 'admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares');
    const { courseId } = body;
    await env.DB.prepare('DELETE FROM cursos WHERE id = ?').bind(courseId).run();
    return json({ success: true });
  }
  if (action === 'update') {
    const { courseId, ano, division, turno, tecnicatura_id, year_id, detalle } = body;
    await env.DB.prepare('UPDATE cursos SET ano = ?, division = ?, turno = ?, tecnicatura_id = ?, year_id = ?, detalle = ? WHERE id = ?').bind(ano, division, turno, tecnicatura_id, year_id, detalle || '', courseId).run();
    return json({ success: true });
  }
  return json({ error: 'Acción no soportada' }, 400);
}

export async function handleYears(env, request, userId, body) {
  await validateUser(env, request, userId, 'admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector', 'regente_profesores');
  const { action, nombre, yearId } = body;
  if (action === 'delete') {
    await validateUser(env, request, userId, 'admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares');
    await env.DB.prepare('DELETE FROM años_lectivos WHERE id = ?').bind(yearId).run();
    return json({ success: true });
  }
  if (action === 'update') {
    await env.DB.prepare('UPDATE años_lectivos SET nombre = ? WHERE id = ?').bind(nombre, yearId).run();
    return json({ success: true });
  }
  if (action === 'set_current') {
    await env.DB.batch([env.DB.prepare('UPDATE años_lectivos SET es_actual = 0'), env.DB.prepare('UPDATE años_lectivos SET es_actual = 1 WHERE id = ?').bind(yearId)]);
    return json({ success: true });
  }
  if (action === 'copy_roles') {
    const { fromYearId, toYearId, targetUserId } = body;
    const fromCourses = await env.DB.prepare('SELECT * FROM cursos WHERE year_id = ?').bind(fromYearId).all();
    const toCourses = await env.DB.prepare('SELECT * FROM cursos WHERE year_id = ?').bind(toYearId).all();
    const courseMap = {};
    toCourses.results.forEach(c => { courseMap[`${c.ano}-${c.division}-${c.turno}`] = c.id; });
    const users = targetUserId ? await env.DB.prepare('SELECT * FROM usuarios WHERE id = ?').bind(targetUserId).all() : await env.DB.prepare('SELECT * FROM usuarios').all();
    const statements = [];
    for (const u of users.results) {
      let newPreceptorCourse = u.preceptor_course_id;
      let newProfCourses = (u.professor_course_ids || '').split(',').filter(Boolean);
      if (u.preceptor_course_id) {
        const c = fromCourses.results.find(xc => xc.id === u.preceptor_course_id);
        if (c) newPreceptorCourse = courseMap[`${c.ano}-${c.division}-${c.turno}`] || null;
      }
      const mappedCourses = [];
      newProfCourses.forEach(cid => {
        const c = fromCourses.results.find(xc => xc.id === Number(cid));
        if (c) { const targetId = courseMap[`${c.ano}-${c.division}-${c.turno}`]; if (targetId) mappedCourses.push(targetId); }
      });
      statements.push(env.DB.prepare('UPDATE usuarios SET preceptor_course_id = ?, professor_course_ids = ? WHERE id = ?').bind(newPreceptorCourse, mappedCourses.join(','), u.id));
    }
    if (statements.length) await env.DB.batch(statements);
    return json({ success: true });
  }
  const r = await env.DB.prepare('INSERT INTO años_lectivos (nombre, es_actual) VALUES (?, 0) RETURNING *').bind(nombre || body).first(); 
  return json({ success: true, year: r });
}

export async function handleTecnicaturas(env, request, userId, body) {
  await validateUser(env, request, userId, 'admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector', 'regente_profesores');
  const { action, nombre, materias = [], tecnicaturaId } = body;
  const sanitizedNombre = String(nombre || '').trim();
  const sanitizedMaterias = sanitizeTecMaterias(materias);
  const duplicateNames = getDuplicateCurricularNames(sanitizedMaterias);
  if ((action === 'create' || action === 'update') && !sanitizedNombre) return json({ error: 'La tecnicatura debe tener un nombre.' }, 400);
  if ((action === 'create' || action === 'update') && sanitizedMaterias.length === 0) return json({ error: 'La tecnicatura debe tener al menos una materia.' }, 400);
  if ((action === 'create' || action === 'update') && duplicateNames.length > 0) return json({ error: `Hay materias duplicadas o casi iguales: ${duplicateNames.join(', ')}` }, 400);
  if (action === 'create') {
    const tec = await env.DB.prepare('INSERT INTO tecnicaturas (nombre, detalle) VALUES (?, ?) RETURNING *').bind(sanitizedNombre, body.detalle || '').first();
    const statements = sanitizedMaterias.map((m, i) => env.DB.prepare('INSERT INTO materias (nombre, tipo, es_taller, tecnicatura_id, num_rotacion, orden) VALUES (?, ?, ?, ?, ?, ?)').bind(m.nombre, m.tipo ?? 'comun', m.es_taller ? 1 : 0, tec.id, m.num_rotacion ?? null, i));
    if (statements.length) await env.DB.batch(statements);
    return json({ success: true, tecnicatura: tec });
  }
  if (action === 'update') {
    await env.DB.prepare('UPDATE tecnicaturas SET nombre = ?, detalle = ? WHERE id = ?').bind(sanitizedNombre, body.detalle || '', tecnicaturaId).run();
    const currentSubjects = await env.DB.prepare('SELECT id, nombre FROM materias WHERE tecnicatura_id = ?').bind(tecnicaturaId).all();
    const currentIds = currentSubjects.results.map((subject) => subject.id);
    const incomingIds = sanitizedMaterias.filter((materia) => typeof materia.id !== 'string' || !materia.id.startsWith('draft-')).map((materia) => Number(materia.id));
    const idsToDelete = currentIds.filter(id => !incomingIds.includes(id));
    const deletedIdsSet = new Set(idsToDelete.map(Number));
    const deletedNamesSet = new Set(currentSubjects.results.filter((s) => deletedIdsSet.has(Number(s.id))).map((s) => normalizeCurricularName(s.nombre)).filter(Boolean));
    if (idsToDelete.length) {
      const userRows = await env.DB.prepare("SELECT id, professor_subject_ids FROM usuarios WHERE professor_subject_ids IS NOT NULL AND professor_subject_ids != ''").all();
      const userStatements = [];
      userRows.results.forEach((ur) => {
        const next = removeSubjectPairsFromAssignments(ur.professor_subject_ids, deletedIdsSet);
        if (next !== (ur.professor_subject_ids || '')) userStatements.push(env.DB.prepare('UPDATE usuarios SET professor_subject_ids = ? WHERE id = ?').bind(next, ur.id));
      });
      if (userStatements.length) await env.DB.batch(userStatements);
      const placeholders = idsToDelete.map(() => '?').join(',');
      await env.DB.batch([env.DB.prepare(`DELETE FROM bloqueos_materias WHERE materia_id IN (${placeholders})`).bind(...idsToDelete), env.DB.prepare(`DELETE FROM calificaciones WHERE materia_id IN (${placeholders})`).bind(...idsToDelete), env.DB.prepare(`DELETE FROM previas WHERE materia_id IN (${placeholders})`).bind(...idsToDelete)]);
      const scheduleRows = await env.DB.prepare('SELECT cs.course_id, cs.grid_data FROM course_schedules cs JOIN cursos c ON c.id = cs.course_id WHERE c.tecnicatura_id = ?').bind(tecnicaturaId).all();
      for (const sr of scheduleRows.results) {
        const sanitized = sanitizeSchedulePayload(sr.grid_data, deletedIdsSet, deletedNamesSet);
        if (sanitized.changed) {
          await env.DB.prepare('UPDATE course_schedules SET grid_data = ? WHERE course_id = ?').bind(sanitized.serialized, sr.course_id).run();
          await syncProfessorAssignmentsForCourse(env, sr.course_id, sanitized.serialized);
        }
      }
    }
    const statements = idsToDelete.length ? [env.DB.prepare(`DELETE FROM materias WHERE id IN (${idsToDelete.map(() => '?').join(',')})`).bind(...idsToDelete)] : [];
    sanitizedMaterias.forEach((m, i) => {
      if (typeof m.id === 'string' && m.id.startsWith('draft-')) statements.push(env.DB.prepare('INSERT INTO materias (nombre, tipo, es_taller, tecnicatura_id, num_rotacion, orden) VALUES (?, ?, ?, ?, ?, ?)').bind(m.nombre, m.tipo ?? 'comun', m.es_taller ? 1 : 0, tecnicaturaId, m.num_rotacion ?? null, i));
      else statements.push(env.DB.prepare('UPDATE materias SET nombre = ?, tipo = ?, es_taller = ?, num_rotacion = ?, orden = ? WHERE id = ?').bind(m.nombre, m.tipo ?? 'comun', m.es_taller ? 1 : 0, m.num_rotacion ?? null, i, m.id));
    });
    if (statements.length) await env.DB.batch(statements);
    return json({ success: true });
  }
  if (action === 'duplicate') {
    const originalTec = await env.DB.prepare('SELECT nombre FROM tecnicaturas WHERE id = ?').bind(tecnicaturaId).first();
    const newName = `${String(originalTec.nombre || '').trim()} (Copia)`;
    const tec = await env.DB.prepare('INSERT INTO tecnicaturas (nombre) VALUES (?) RETURNING *').bind(newName).first();
    const subjects = await env.DB.prepare('SELECT * FROM materias WHERE tecnicatura_id = ? ORDER BY orden, id').bind(tecnicaturaId).all();
    const statements = subjects.results.map((m, i) => env.DB.prepare('INSERT INTO materias (nombre, tipo, es_taller, tecnicatura_id, num_rotacion, orden) VALUES (?, ?, ?, ?, ?, ?)').bind(m.nombre, m.tipo, m.es_taller, tec.id, m.num_rotacion ?? null, i));
    if (statements.length) await env.DB.batch(statements);
    return json({ success: true, tecnicatura: tec });
  }
  if (action === 'delete') {
    await validateUser(env, request, userId, 'admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares');
    const courseCount = await env.DB.prepare('SELECT COUNT(*) as count FROM cursos WHERE tecnicatura_id = ?').bind(tecnicaturaId).first('count');
    if (courseCount > 0) return json({ error: 'No se puede eliminar: Esta tecnicatura tiene cursos asignados.' }, 400);
    await env.DB.prepare('DELETE FROM materias WHERE tecnicatura_id = ?').bind(tecnicaturaId).run();
    await env.DB.prepare('DELETE FROM tecnicaturas WHERE id = ?').bind(tecnicaturaId).run();
    return json({ success: true });
  }
  return json({ error: 'Acción no soportada' }, 400);
}

export async function handleLocks(env, request, userId, body) {
  const currentUser = await validateUser(env, request, userId);
  
  // Fetch up-to-date user record from DB
  const user = (await env.DB.prepare('SELECT * FROM usuarios WHERE id = ?').bind(userId).first()) || currentUser;

  if (user.rol === 'profesor' && !user.is_professor_hybrid) return json({ error: 'No autorizado' }, 403);
  const { action, courseId, materiaId, periodoId, bloqueado, all = false } = body;

  // Security: Check if preceptor has access to this course
  const highRoles = ['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector', 'regente_profesores'];
  if (!highRoles.includes(user.rol)) {
    const ids = (user.professor_course_ids ?? '').split(',').map(Number).filter(Boolean);
    if (user.preceptor_course_id) ids.push(Number(user.preceptor_course_id));
    if (!ids.includes(Number(courseId))) {
      return json({ error: 'No tienes permiso para gestionar bloqueos en este curso.' }, 403);
    }
  }
  if (action === 'toggle') {
    if (all) {
      if (bloqueado) {
        let q = 'SELECT id FROM materias WHERE tecnicatura_id = (SELECT tecnicatura_id FROM cursos WHERE id = ?)';
        if (user.rol === 'preceptor') q += ' AND (es_taller = 0 OR (es_taller = 1 AND tipo LIKE "%modular%"))';
        if (user.rol === 'preceptor_taller') q += ' AND es_taller = 1';
        if (user.rol === 'preceptor_ef') q += ' AND nombre LIKE "%EDUCACION FISICA%"';
        const subjs = await env.DB.prepare(q).bind(courseId).all();
        const statements = [];
        subjs.results.forEach(s => { for (let p = 1; p <= 10; p++) statements.push(env.DB.prepare('INSERT OR REPLACE INTO bloqueos_materias (course_id, materia_id, periodo_id, bloqueado) VALUES (?, ?, ?, 1)').bind(courseId, s.id, p)); });
        await env.DB.batch(statements);
      } else {
        if (user.rol === 'admin' || user.rol === 'jefe_de_auxiliares') await env.DB.prepare('DELETE FROM bloqueos_materias WHERE course_id = ?').bind(courseId).run();
        else {
          let q = 'SELECT id FROM materias WHERE tecnicatura_id = (SELECT tecnicatura_id FROM cursos WHERE id = ?)';
          if (user.rol === 'preceptor') q += ' AND es_taller = 0';
          if (user.rol === 'preceptor_taller') q += ' AND es_taller = 1';
          if (user.rol === 'preceptor_ef') q += ' AND nombre LIKE "%EDUCACION FISICA%"';
          const subjs = await env.DB.prepare(q).bind(courseId).all();
          const sids = subjs.results.map(s => s.id);
          if (sids.length) await env.DB.prepare(`DELETE FROM bloqueos_materias WHERE course_id = ? AND materia_id IN (${sids.join(',')})`).bind(courseId).run();
        }
      }
    } else if (periodoId && !materiaId) {
      const pids = Array.isArray(periodoId) ? periodoId : [periodoId];
      let q = 'SELECT id FROM materias WHERE tecnicatura_id = (SELECT tecnicatura_id FROM cursos WHERE id = ?)';
      if (user.rol === 'preceptor') q += ' AND es_taller = 0';
      if (user.rol === 'preceptor_taller') q += ' AND es_taller = 1';
      if (user.rol === 'preceptor_ef') q += ' AND nombre LIKE "%EDUCACION FISICA%"';
      const subjs = await env.DB.prepare(q).bind(courseId).all();
      if (bloqueado) {
        const sts = [];
        subjs.results.forEach(s => pids.forEach(pid => sts.push(env.DB.prepare('INSERT OR REPLACE INTO bloqueos_materias (course_id, materia_id, periodo_id, bloqueado) VALUES (?, ?, ?, 1)').bind(courseId, s.id, pid))));
        await env.DB.batch(sts);
      } else {
        const sids = subjs.results.map(s => s.id);
        if (sids.length) {
          const sts = pids.map(pid => env.DB.prepare(`DELETE FROM bloqueos_materias WHERE course_id = ? AND periodo_id = ? AND materia_id IN (${sids.join(',')})`).bind(courseId, pid));
          await env.DB.batch(sts);
        }
      }
    } else {
      const pids = Array.isArray(periodoId) ? periodoId : [periodoId];
      if (materiaId && (user.rol === 'preceptor' || user.rol === 'preceptor_taller' || user.rol === 'preceptor_ef')) {
        const sub = await env.DB.prepare('SELECT es_taller, nombre FROM materias WHERE id = ?').bind(materiaId).first();
        if (user.rol === 'preceptor' && sub?.es_taller === 1) throw new Error('No puedes bloquear materias de taller.');
        if (user.rol === 'preceptor_taller' && sub?.es_taller !== 1) throw new Error('Solo puedes bloquear materias de taller.');
        if (user.rol === 'preceptor_ef' && !sub?.nombre?.includes('EDUCACION FISICA')) throw new Error('Solo puedes bloquear materias de Educación Física.');
      }
      const sts = pids.map(pid => bloqueado ? env.DB.prepare('INSERT OR REPLACE INTO bloqueos_materias (course_id, materia_id, periodo_id, bloqueado) VALUES (?, ?, ?, 1)').bind(courseId, materiaId, pid) : env.DB.prepare('DELETE FROM bloqueos_materias WHERE course_id = ? AND materia_id = ? AND periodo_id = ?').bind(courseId, materiaId, pid));
      await env.DB.batch(sts);
    }
    return json({ success: true });
  }
  return json({ error: 'Accion no soportada' }, 400);
}

export async function handleSchedules(env, request, userId, body) {
  const { action, course_id, grid_data } = body;
  const currentUser = await validateUser(env, request, userId, 'admin', 'secretaria_de_alumnos', 'preceptor', 'jefe_de_auxiliares', 'director', 'vicedirector', 'preceptor_ef', 'preceptor_taller', 'regente_profesores');
  
  // Fetch up-to-date user record from DB
  const user = (await env.DB.prepare('SELECT * FROM usuarios WHERE id = ?').bind(userId).first()) || currentUser;

  if (action === 'save' || action === 'delete' || action === 'import_batch') {
    const edRoles = ['admin', 'secretaria_de_alumnos', 'director', 'vicedirector', 'regente_profesores'];
    if (!edRoles.includes(user.rol)) {
      throw new Error('No tienes permiso para modificar horarios (Acceso de solo lectura).');
    }
  }

  if (action === 'save') {
    if (!course_id) throw new Error('ID de curso requerido');

    // Security check for preceptors
    const highRoles = ['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'];
    if (!highRoles.includes(user.rol)) {
      const ids = (user.professor_course_ids ?? '').split(',').map(Number).filter(Boolean);
      if (user.preceptor_course_id) ids.push(Number(user.preceptor_course_id));
      if (!ids.includes(Number(course_id))) {
        throw new Error('No tienes permiso para modificar el horario de este curso.');
      }
    }
    await env.DB.prepare('INSERT INTO course_schedules (course_id, grid_data) VALUES (?, ?) ON CONFLICT(course_id) DO UPDATE SET grid_data = excluded.grid_data').bind(course_id, grid_data).run();
    try { await syncProfessorAssignmentsForCourse(env, course_id, grid_data); } catch (e) { console.error('Permission sync error:', e); }
    await logHistory(env, userId, course_id, 'horarios_save', `Se actualizó el horario del curso.`);
    return json({ success: true });
  }
  if (action === 'delete') {
    await env.DB.prepare('DELETE FROM course_schedules WHERE course_id = ?').bind(course_id).run();
    await logHistory(env, userId, course_id, 'horarios_delete', `Se eliminó el horario del curso.`);
    return json({ success: true });
  }
  if (action === 'import_batch') {
    const { schedules } = body;
    const sts = schedules.map(s => env.DB.prepare('INSERT INTO course_schedules (course_id, grid_data) VALUES (?, ?) ON CONFLICT(course_id) DO UPDATE SET grid_data = excluded.grid_data, last_updated = CURRENT_TIMESTAMP').bind(s.course_id, s.grid_data));
    await env.DB.batch(sts);
    await logHistory(env, userId, null, 'horarios_import', `Se importaron ${schedules.length} horarios.`);
    return json({ success: true });
  }
  return json({ error: 'Acción no soportada' }, 400);
}
