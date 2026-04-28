import { validateUser, logHistory, json } from "../_helpers.js";

export async function handleGradeUpdates(env, request, userId, body) {
  const currentUser = await validateUser(env, request, userId);
  const { updates = [] } = body;
  if (!updates.length) return json({ success: true });

  // Fetch up-to-date user record from DB
  const user = (await env.DB.prepare('SELECT * FROM usuarios WHERE id = ?').bind(userId).first()) || currentUser;

  const studentIds = [...new Set(updates.map(u => u.alumno_id))];
  const materiaIds = [...new Set(updates.map(u => u.materia_id))];
  const periodIds = [...new Set(updates.map(u => u.periodo_id))];

  const [studentsRes, materiasRes, periodsRes, existingGradesRes] = await Promise.all([
    env.DB.prepare(`SELECT id, course_id, apellido, nombre FROM alumnos WHERE id IN (${studentIds.map(() => '?').join(',')})`).bind(...studentIds).all(),
    env.DB.prepare(`SELECT id, nombre, es_taller FROM materias WHERE id IN (${materiaIds.map(() => '?').join(',')})`).bind(...materiaIds).all(),
    env.DB.prepare(`SELECT id, nombre FROM periodos WHERE id IN (${periodIds.map(() => '?').join(',')})`).bind(...periodIds).all(),
    env.DB.prepare(`SELECT * FROM calificaciones WHERE alumno_id IN (${studentIds.map(() => '?').join(',')}) AND materia_id IN (${materiaIds.map(() => '?').join(',')})`).bind(...studentIds, ...materiaIds).all()
  ]);

  const studentMap = studentsRes.results.reduce((acc, s) => ({ ...acc, [s.id]: s }), {});
  const materiaMap = materiasRes.results.reduce((acc, m) => ({ ...acc, [m.id]: m }), {});
  const periodMap = periodsRes.results.reduce((acc, p) => ({ ...acc, [p.id]: p.nombre }), {});
  const gradeMap = existingGradesRes.results.reduce((acc, g) => ({ ...acc, [`${g.alumno_id}-${g.materia_id}-${g.periodo_id}`]: g }), {});

  const p_subjects = (user.professor_subject_ids ?? '').split(',');

  let canEditRoleMode = false;
  const highRoles = ['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'];
  
  if (['preceptor', 'preceptor_taller', 'preceptor_ef'].includes(user.rol)) {
    const ajustes = await env.DB.prepare('SELECT valor FROM ajustes WHERE clave = ?').bind(`${user.rol}_mode`).first();
    canEditRoleMode = ajustes ? ajustes.valor === 'edit' : false;
  }

  const firstStudent = studentsRes.results[0];
  if (firstStudent) {
    const yearRes = await env.DB.prepare(`
      SELECT y.es_actual 
      FROM años_lectivos y 
      JOIN cursos c ON c.year_id = y.id 
      WHERE c.id = ?
    `).bind(firstStudent.course_id).first();
    
    if (yearRes && !yearRes.es_actual && !['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'].includes(user.rol)) {
      throw new Error('No se pueden editar calificaciones de un ciclo lectivo que no es el actual.');
    }
  }

  for (const u of updates) {
    const student = studentMap[u.alumno_id];
    const materia = materiaMap[u.materia_id];
    if (!student) throw new Error(`Alumno ${u.alumno_id} no existe`);
    if (!materia) throw new Error(`Materia ${u.materia_id} no existe`);

    if (user.rol === 'regente_profesores') {
      throw new Error('No tienes permiso para modificar calificaciones (Acceso de solo lectura).');
    }

    if (user.rol !== 'admin' && user.rol !== 'secretaria_de_alumnos' && user.rol !== 'jefe_de_auxiliares' && user.rol !== 'director' && user.rol !== 'vicedirector') {
      const pair = `${student.course_id}-${u.materia_id}`;
      const isAssignedAsProfessor = p_subjects.includes(pair);

      if (['preceptor', 'preceptor_taller', 'preceptor_ef'].includes(user.rol) || (user.rol === 'profesor' && user.is_professor_hybrid)) {
        if (!isAssignedAsProfessor) {
          if (!canEditRoleMode) {
            throw new Error(`Permiso denegado: el modo de edición para tu rol está deshabilitado.`);
          }
          if (user.rol === 'preceptor_ef' && !materia.nombre.includes('EDUCACION FISICA')) {
            throw new Error(`Permiso denegado: solo puedes modificar calificaciones de Educación Física.`);
          }
          if (user.rol === 'preceptor_taller' && !materia.es_taller) {
            throw new Error(`Permiso denegado: solo puedes modificar calificaciones de Taller.`);
          }
        }
      } else if (user.rol === 'profesor' && !isAssignedAsProfessor) {
        throw new Error(`No tienes asignada la materia ${materia.nombre} en este curso.`);
      }
    }
  }

  const statements = [];
  let hasAdd = false;
  let hasEdit = false;
  let hasDelete = false;
  const updatesByStudent = {};

  for (const u of updates) {
    const key = `${u.alumno_id}-${u.materia_id}-${u.periodo_id}`;
    const current = gradeMap[key] || {};
    const finalT = (u.valor_t !== undefined ? u.valor_t : (current.valor_t || '')).trim();
    const finalP = (u.valor_p !== undefined ? u.valor_p : (current.valor_p || '')).trim();
    const finalPond = (u.valor_pond !== undefined ? u.valor_pond : (current.valor_pond || '')).trim();
    const finalLetras = u.valor_letras !== undefined ? u.valor_letras : current.valor_letras;

    if (!finalT && !finalP && !finalPond) {
      statements.push(env.DB.prepare('DELETE FROM calificaciones WHERE alumno_id = ? AND materia_id = ? AND periodo_id = ?').bind(u.alumno_id, u.materia_id, u.periodo_id));
      hasDelete = true;
    } else {
      statements.push(env.DB.prepare(`
        INSERT INTO calificaciones (alumno_id, materia_id, periodo_id, valor_t, valor_p, valor_pond, valor_letras) 
        VALUES (?, ?, ?, ?, ?, ?, ?) 
        ON CONFLICT(alumno_id, materia_id, periodo_id) 
        DO UPDATE SET valor_t=excluded.valor_t, valor_p=excluded.valor_p, valor_pond=excluded.valor_pond, valor_letras=excluded.valor_letras
      `).bind(u.alumno_id, u.materia_id, u.periodo_id, finalT || null, finalP || null, finalPond || null, finalLetras || null));
      const hasActualValue = (current.valor_t || '').trim() || (current.valor_p || '').trim() || (current.valor_pond || '').trim();
      if (hasActualValue) hasEdit = true; else hasAdd = true;
    }

    if (!updatesByStudent[u.alumno_id]) updatesByStudent[u.alumno_id] = [];
    updatesByStudent[u.alumno_id].push(u);

    if ([6, 7, 8, 9, 11].includes(u.periodo_id)) {
      const getV = (pid) => {
        const k = `${u.alumno_id}-${u.materia_id}-${pid}`;
        const g = pid === u.periodo_id ? { valor_t: finalT, valor_pond: finalPond } : (gradeMap[k] || {});
        const val = [7, 8, 9, 10, 11].includes(pid) ? g.valor_t : g.valor_pond;
        return val ? Number(String(val).replace(',', '.')) : null;
      };
      const trim3 = getV(6);
      const dic = getV(7);
      const feb = getV(8);
      const mar = getV(9);
      const otras = getV(11);
      let finalVal = null;
      if (otras !== null) finalVal = otras;
      else if (mar !== null) finalVal = mar;
      else if (feb >= 7) finalVal = feb;
      else if (dic >= 7) finalVal = dic;
      else if (trim3 >= 7) finalVal = trim3;
      statements.push(env.DB.prepare(`
        INSERT INTO calificaciones (alumno_id, materia_id, periodo_id, valor_t) 
        VALUES (?, ?, 10, ?) 
        ON CONFLICT(alumno_id, materia_id, periodo_id) 
        DO UPDATE SET valor_t = excluded.valor_t
      `).bind(u.alumno_id, u.materia_id, finalVal !== null ? String(finalVal).replace('.', ',') : ''));
    }
  }

  const firstMateria = materiaMap[updates[0].materia_id];
  const auditoriaStudent = studentMap[updates[0].alumno_id];
  let actionLabel = (hasDelete && !hasAdd && !hasEdit) ? 'Eliminación' : ((hasAdd && !hasEdit && !hasDelete) ? 'Carga de Nota' : 'Edición');
  if (updates.length > 1) actionLabel += ' Masiva';
  const eventType = (hasDelete && !hasAdd && !hasEdit) ? 'notas_delete' : ((hasAdd && !hasEdit && !hasDelete) ? 'notas_add' : 'notas_edit');
  const list = Object.keys(updatesByStudent).map(sId => {
    const sUpdates = updatesByStudent[sId];
    const name = studentMap[sId] ? `${studentMap[sId].apellido}, ${studentMap[sId].nombre}` : 'Desconocido';
    const desc = sUpdates.map(u => `${periodMap[u.periodo_id] || '?'}: ${u.valor_pond || u.valor_p || u.valor_t || '-'}`).join(', ');
    return `${name} (${desc})`;
  }).join(' | ');
  const detailString = `[DETALLE] ${actionLabel} de ${updates.length} notas en ${firstMateria.nombre}. Desglose: ${list}`;
  const courseIdToLog = auditoriaStudent?.course_id || firstStudent?.course_id;

  await env.DB.batch(statements);
  await logHistory(env, userId, courseIdToLog || null, eventType, detailString);
  return json({ success: true });
}

export async function handlePrevias(env, request, userId, body) {
  const currentUser = await validateUser(env, request, userId, 'admin', 'secretaria_de_alumnos', 'preceptor', 'preceptor_taller', 'preceptor_ef', 'profesor', 'jefe_de_auxiliares', 'director', 'vicedirector');
  
  // Fetch up-to-date user record from DB
  const user = (await env.DB.prepare('SELECT * FROM usuarios WHERE id = ?').bind(userId).first()) || currentUser;

  if (user.rol === 'profesor' && !user.is_professor_hybrid) {
     throw new Error('No tienes permiso para gestionar materias previas.');
  }
  const { action, id, alumno_id, materia_id, materia_nombre_custom, curso_ano, libro, folio, calificacion, fecha, estado } = body;
  if (action === 'delete') {
    await env.DB.prepare('DELETE FROM previas WHERE id = ?').bind(id).run();
    return json({ success: true });
  }
  if (action === 'update' || id) {
    await env.DB.prepare(
      `UPDATE previas SET 
       materia_id = ?, materia_nombre_custom = ?, curso_ano = ?, libro = ?, folio = ?, 
       calificacion = ?, fecha = ?, estado = ?
       WHERE id = ?`
    ).bind(materia_id || null, materia_nombre_custom || null, curso_ano || null, libro || null, folio || null, calificacion || null, fecha || null, estado, id).run();
    return json({ success: true });
  }
  await env.DB.prepare(
    `INSERT INTO previas (alumno_id, materia_id, materia_nombre_custom, curso_ano, libro, folio, calificacion, fecha, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(alumno_id, materia_id || null, materia_nombre_custom || null, curso_ano || null, libro || null, folio || null, calificacion || null, fecha || null, estado || 'pendiente').run();
  return json({ success: true });
}
