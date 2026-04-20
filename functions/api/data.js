// ─── Helpers ────────────────────────────────────────────────────────────────

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toTitleCase(str) {
  if (!str) return '';
  return str.trim().toLowerCase().split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function logHistory(env, userId, courseId, type, detail, alumnoId = null) {
  try {
    await env.DB.prepare(
      'INSERT INTO historial (usuario_id, course_id, tipo_evento, detalle, alumno_id) VALUES (?, ?, ?, ?, ?)'
    ).bind(userId, courseId, type, detail, alumnoId).run();
  } catch (err) {
    console.error('History logging failed:', err);
  }
}

async function validateUser(env, request, userId, ...requiredRoles) {
  if (!userId) throw new Error('Usuario no identificado');

  // Basic Token Verification (Hardening)
  const authHeader = request?.headers?.get('Authorization') || '';
  const expectedToken = `Bearer auth-token-${userId}`;

  if (!authHeader || authHeader !== expectedToken) {
    throw new Error('Sesión inválida o expirada. Por favor, inicie sesión nuevamente.');
  }

  const user = await env.DB.prepare('SELECT id, nombre, username, rol, preceptor_course_id, professor_course_ids, professor_subject_ids, is_professor_hybrid FROM usuarios WHERE id = ?').bind(userId).first();
  if (!user) throw new Error('Usuario no encontrado');

  if (requiredRoles.length > 0 && !requiredRoles.includes(user.rol)) {
    throw new Error(`Permiso denegado: tu rol (${user.rol}) no tiene autorización.`);
  }
  return user;
}

// ─── GET /api/data?type=grid ─────────────────────────────────────────────────

async function handleGrid(env, request, url) {
  const userId = toNumber(url.searchParams.get('userId'));
  let courseId = toNumber(url.searchParams.get('courseId'));
  let yearId = toNumber(url.searchParams.get('yearId'));
  const includeAllStudents = url.searchParams.get('includeAllStudents') === 'true';

  const currentUser = await validateUser(env, request, userId);

  const statements = [
    env.DB.prepare(`
      SELECT y.*, COALESCE(stats.total, 0) as student_count
      FROM años_lectivos y
      LEFT JOIN (
        SELECT c.year_id, COUNT(*) as total
        FROM alumnos a
        JOIN cursos c ON a.course_id = c.id
        GROUP BY c.year_id
      ) stats ON stats.year_id = y.id
      ORDER BY y.nombre DESC
    `),
    env.DB.prepare('SELECT * FROM tecnicaturas ORDER BY nombre'),
    env.DB.prepare('SELECT id, nombre, tipo, es_taller, tecnicatura_id, num_rotacion, orden FROM materias ORDER BY orden, id'),
    env.DB.prepare('SELECT * FROM periodos ORDER BY id'),
    env.DB.prepare('SELECT * FROM ajustes'),
    env.DB.prepare(`
      SELECT c.*, t.nombre AS tecnicatura_nombre, t.detalle AS tecnicatura_detalle, y.nombre AS year_nombre,
               COALESCE(stats.total, 0) as student_count,
               COALESCE(stats.female, 0) as female_count,
               COALESCE(stats.male, 0) as male_count
        FROM cursos c
        JOIN tecnicaturas t ON t.id = c.tecnicatura_id
        JOIN años_lectivos y ON y.id = c.year_id
        LEFT JOIN (
          SELECT course_id,
                 COUNT(*) as total,
                 SUM(CASE WHEN UPPER(genero) = 'FEMENINO' THEN 1 ELSE 0 END) as female,
                 SUM(CASE WHEN UPPER(genero) = 'MASCULINO' THEN 1 ELSE 0 END) as male
          FROM alumnos
          WHERE estado = 1
          GROUP BY course_id
        ) stats ON stats.course_id = c.id
        ORDER BY c.ano, c.division
    `)
  ];

  const idx = {
    years: 0,
    tecs: 1,
    subjects: 2,
    periods: 3,
    config: 4,
    allCourses: 5,
    pases: -1,
    users: -1,
    reportUsers: -1,
    students: -1,
    allStudents: -1,
    locks: -1,
    grades: -1,
    previas: -1,
    historial: -1,
    anuncios: -1
  };

  if (currentUser.rol === 'admin' || currentUser.rol === 'secretaria_de_alumnos' || currentUser.rol === 'jefe_de_auxiliares' || currentUser.rol === 'director' || currentUser.rol === 'vicedirector') {
    idx.pases = statements.length;
    statements.push(env.DB.prepare(`
      SELECT p.*, (c.ano || ' ' || c.division || ' · ' || c.turno) as course_label
      FROM pases p
      LEFT JOIN cursos c ON c.id = p.course_id_origen
      ORDER BY p.id DESC
    `));
    idx.users = statements.length;
    statements.push(env.DB.prepare('SELECT id, nombre, username, rol, preceptor_course_id, professor_course_ids, professor_subject_ids, is_professor_hybrid FROM usuarios ORDER BY nombre'));

    if (includeAllStudents) {
      idx.allStudents = statements.length;
      statements.push(env.DB.prepare(`
        SELECT a.id, a.nombre, a.apellido, a.dni, a.course_id, a.observaciones, a.estado, a.genero, a.password,
               (c.ano || ' ' || c.division || ' · ' || c.turno) as course_label
        FROM alumnos a
        JOIN cursos c ON a.course_id = c.id
        WHERE a.course_id IS NOT NULL
        AND a.estado = 1
        ORDER BY a.apellido, a.nombre
      `));
    }
  } else {
    idx.reportUsers = statements.length;
    statements.push(env.DB.prepare("SELECT id, nombre, rol, professor_subject_ids, is_professor_hybrid FROM usuarios WHERE (rol = 'profesor' OR is_professor_hybrid = 1)"));
  }

  // Anuncios (Visible for everyone)
  idx.anuncios = statements.length;
  statements.push(env.DB.prepare('SELECT * FROM anuncios ORDER BY id DESC'));

  // Si ya tenemos courseId, adelantamos su carga en el primer batch
  if (courseId) {
    idx.students = statements.length;
    statements.push(env.DB.prepare(`
      SELECT a.*, c.ano, c.division, c.turno, c.year_id, c.tecnicatura_id, y.nombre AS year_nombre, t.nombre AS tecnicatura_nombre, (c.ano || ' ' || c.division || ' · ' || c.turno) AS course_label, rotacion
       FROM alumnos a JOIN cursos c ON c.id = a.course_id JOIN años_lectivos y ON y.id = c.year_id JOIN tecnicaturas t ON t.id = c.tecnicatura_id
       WHERE a.course_id = ? AND a.estado = 1 ORDER BY a.apellido, a.nombre
    `).bind(courseId));
    idx.locks = statements.length;
    statements.push(env.DB.prepare('SELECT * FROM bloqueos_materias WHERE course_id = ?').bind(courseId));
    idx.grades = statements.length;
    statements.push(env.DB.prepare('SELECT * FROM calificaciones WHERE alumno_id IN (SELECT id FROM alumnos WHERE course_id = ?)').bind(courseId));
    idx.previas = statements.length;
    statements.push(env.DB.prepare(`
      SELECT p.*, m.nombre as materia_nombre 
      FROM previas p
      LEFT JOIN materias m ON m.id = p.materia_id
      WHERE p.alumno_id IN (SELECT id FROM alumnos WHERE course_id = ?)
    `).bind(courseId));

    idx.historial = statements.length;
    statements.push(env.DB.prepare(`
      SELECT h.*, u.nombre as usuario_nombre, u.rol as usuario_rol, a.apellido as alumno_apellido, a.nombre as alumno_nombre
      FROM historial h
      LEFT JOIN usuarios u ON u.id = h.usuario_id
      LEFT JOIN alumnos a ON a.id = h.alumno_id
      WHERE h.course_id = ?
      ORDER BY h.fecha DESC
      LIMIT 100
    `).bind(courseId));
  }

  const results = await env.DB.batch(statements);

  let years = results[idx.years].results;
  const currentYear = years.find(y => y.es_actual === 1) ?? years[0];

  // Restriction: Teachers and Preceptors ONLY see the current year
  if (!['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'].includes(currentUser.rol)) {
    years = years.filter(y => y.es_actual === 1);
    // If no year is marked as actual, they see nothing or just the first one. 
    // Usually one is marked. If not, they see years[0] from the filter if any.
    if (years.length === 0 && results[idx.years].results.length > 0) {
      years = [results[idx.years].results[0]];
    }
  }
  const tecs = results[idx.tecs].results;
  const subjects = results[idx.subjects].results;
  const periods = results[idx.periods].results;
  const config = results[idx.config].results.reduce((acc, curr) => ({ ...acc, [curr.clave]: curr.valor }), {});
  const allCoursesRaw = results[idx.allCourses].results;
  const pases = idx.pases !== -1 ? results[idx.pases].results : [];
  const reportUsers = idx.reportUsers !== -1 ? results[idx.reportUsers].results : (idx.users !== -1 ? results[idx.users].results : []);
  const anuncios = idx.anuncios !== -1 ? results[idx.anuncios].results : [];

  // Lógica de selección de año y curso
  const selectedYear = years.find(y => y.id === yearId) ?? years[0] ?? null;
  const finalYearId = selectedYear?.id ?? null;

  const allCourses = allCoursesRaw.filter(c => c.year_id === finalYearId).map(c => ({ ...c, label: `${c.ano} ${c.division} · ${c.turno}` }));
  let accessibleCourses = allCourses;
  if (currentUser?.rol !== 'admin' && currentUser?.rol !== 'secretaria_de_alumnos' && currentUser?.rol !== 'jefe_de_auxiliares' && currentUser?.rol !== 'director' && currentUser?.rol !== 'vicedirector') {
    const ids = (currentUser.professor_course_ids ?? '').split(',').map(Number).filter(Boolean);
    
    // Si es profesor, extraer IDs de cursos desde sus materias asignadas (formato "cursoId-materiaId")
    if (currentUser.rol === 'profesor' && currentUser.professor_subject_ids) {
      const subjectPairs = currentUser.professor_subject_ids.split(',').filter(Boolean);
      subjectPairs.forEach(pair => {
        const cId = Number(pair.split('-')[0]);
        if (!isNaN(cId)) ids.push(cId);
      });
    }

    if (currentUser.preceptor_course_id) ids.push(Number(currentUser.preceptor_course_id));
    const uniqueIds = [...new Set(ids)];
    accessibleCourses = allCourses.filter((c) => uniqueIds.includes(c.id));
  }

  const selectedCourse = accessibleCourses.find((c) => c.id === courseId) ?? accessibleCourses[0] ?? null;
  const finalCourseId = selectedCourse?.id ?? null;
  const selectedTecnicaturaId = selectedCourse?.tecnicatura_id ?? null;

  // Si el curso final es distinto al solicitado (o no se solicitó), hacemos un SEGUNDO batch para los datos específicos
  let courseStudents = idx.students !== -1 && finalCourseId === courseId ? results[idx.students].results : [];
  let locks = idx.locks !== -1 && finalCourseId === courseId ? results[idx.locks].results : [];
  let grades = idx.grades !== -1 && finalCourseId === courseId ? results[idx.grades].results : [];
  let previas = idx.previas !== -1 && finalCourseId === courseId ? results[idx.previas].results : [];
  let historial = idx.historial !== -1 && finalCourseId === courseId ? results[idx.historial].results : [];

  if (finalCourseId && finalCourseId !== courseId) {
    const secondBatch = await env.DB.batch([
      env.DB.prepare(`
        SELECT a.*, c.ano, c.division, c.turno, c.year_id, c.tecnicatura_id, y.nombre AS year_nombre, t.nombre AS tecnicatura_nombre, (c.ano || ' ' || c.division || ' · ' || c.turno) AS course_label, rotacion
         FROM alumnos a JOIN cursos c ON c.id = a.course_id JOIN años_lectivos y ON y.id = c.year_id JOIN tecnicaturas t ON t.id = c.tecnicatura_id
         WHERE a.course_id = ? AND a.estado = 1 ORDER BY a.apellido, a.nombre
      `).bind(finalCourseId),
      env.DB.prepare('SELECT * FROM bloqueos_materias WHERE course_id = ?').bind(finalCourseId),
      env.DB.prepare('SELECT * FROM calificaciones WHERE alumno_id IN (SELECT id FROM alumnos WHERE course_id = ?)').bind(finalCourseId),
      env.DB.prepare('SELECT p.*, m.nombre as materia_nombre FROM previas p LEFT JOIN materias m ON m.id = p.materia_id WHERE p.alumno_id IN (SELECT id FROM alumnos WHERE course_id = ?)').bind(finalCourseId),
      env.DB.prepare(`
        SELECT h.*, u.nombre as usuario_nombre, u.rol as usuario_rol, a.apellido as alumno_apellido, a.nombre as alumno_nombre
        FROM historial h
        LEFT JOIN usuarios u ON u.id = h.usuario_id
        LEFT JOIN alumnos a ON a.id = h.alumno_id
        WHERE h.course_id = ?
        ORDER BY h.fecha DESC
        LIMIT 100
      `).bind(finalCourseId)
    ]);
    courseStudents = secondBatch[0].results;
    locks = secondBatch[1].results;
    grades = secondBatch[2].results;
    previas = secondBatch[3].results;
    historial = secondBatch[4].results;
  }

  let visibleSubjects = subjects.filter((s) => s.tecnicatura_id === selectedTecnicaturaId);
  if (currentUser?.rol === 'profesor') {
    const assignments = (currentUser.professor_subject_ids ?? '').split(',').filter(Boolean);
    const allowedSubjectIds = assignments.filter(pair => pair.startsWith(`${finalCourseId}-`)).map(pair => Number(pair.split('-')[1]));
    visibleSubjects = visibleSubjects.filter((s) => allowedSubjectIds.includes(s.id));
  }

  return json({
    academicYears: years,
    selectedYearId: finalYearId,
    tecnicaturas: tecs,
    courses: accessibleCourses,
    allCourses,
    selectedCourseId: finalCourseId,
    selectedTecnicaturaId,
    selectedCourse,
    anuncios,
    students: courseStudents,
    allStudents: idx.allStudents !== -1 ? results[idx.allStudents].results : [],
    allSubjects: subjects,
    subjects: visibleSubjects,
    periodos: periods,
    grades,
    previas,
    historial,
    users: reportUsers,
    config,
    locks,
    pases,
  });
}
// ─── POST /api/data?type=config ─────────────────────────────────────────────

async function handleConfig(env, request, userId, body) {
  await validateUser(env, request, userId, 'admin');
  const { action, valor, periodos = [] } = body;

  if (action === 'update_mode') {
    await env.DB.prepare('INSERT OR REPLACE INTO ajustes (clave, valor) VALUES (?, ?)')
      .bind('period_view_mode', valor)
      .run();
    return json({ success: true });
  }

  if (action === 'update_periods') {
    const statements = periodos.map(p =>
      env.DB.prepare('UPDATE periodos SET activo = ? WHERE id = ?').bind(p.activo ? 1 : 0, p.id)
    );
    await env.DB.batch(statements);
    return json({ success: true });
  }

  if (action === 'update_mobile') {
    await env.DB.prepare('INSERT OR REPLACE INTO ajustes (clave, valor) VALUES (?, ?)')
      .bind('mobile_login_enabled', valor)
      .run();
    return json({ success: true });
  }

  return json({ error: 'Accion no soportada' }, 400);
}

// ─── POST /api/data?type=bloqueos ──────────────────────────────────────────

async function handleLocks(env, request, userId, body) {
  const user = await validateUser(env, request, userId);
  if (user.rol === 'profesor') return json({ error: 'No autorizado' }, 403);

  const { action, courseId, materiaId, periodoId, bloqueado, all = false } = body;

  if (action === 'toggle') {
    if (all) {
      // Bloquear/Desbloquear TODO el curso
      if (bloqueado) {
        // Bloquear todos los periodos (1-10) de materias permitidas
        let subjs_query = 'SELECT id FROM materias WHERE tecnicatura_id = (SELECT tecnicatura_id FROM cursos WHERE id = ?)';
        if (user.rol === 'preceptor') subjs_query += ' AND (es_taller = 0 OR (es_taller = 1 AND tipo LIKE "%modular%"))';
        if (user.rol === 'preceptor_taller') subjs_query += ' AND es_taller = 1';

        const subjs = await env.DB.prepare(subjs_query).bind(courseId).all();
        const statements = [];
        for (const s of subjs.results) {
          for (let p = 1; p <= 10; p++) {
            statements.push(env.DB.prepare('INSERT OR REPLACE INTO bloqueos_materias (course_id, materia_id, periodo_id, bloqueado) VALUES (?, ?, ?, 1)').bind(courseId, s.id, p));
          }
        }
        await env.DB.batch(statements);
      } else {
        // Desbloquear materias permitidas
        if (user.rol === 'admin' || user.rol === 'jefe_de_auxiliares') {
          await env.DB.prepare('DELETE FROM bloqueos_materias WHERE course_id = ?').bind(courseId).run();
        } else {
          let subjs_query = 'SELECT id FROM materias WHERE tecnicatura_id = (SELECT tecnicatura_id FROM cursos WHERE id = ?)';
          if (user.rol === 'preceptor') subjs_query += ' AND es_taller = 0';
          if (user.rol === 'preceptor_taller') subjs_query += ' AND es_taller = 1';
          const subjs = await env.DB.prepare(subjs_query).bind(courseId).all();
          const sids = subjs.results.map(s => s.id);
          if (sids.length) {
            await env.DB.prepare(`DELETE FROM bloqueos_materias WHERE course_id = ? AND materia_id IN (${sids.join(',')})`).bind(courseId).run();
          }
        }
      }
    } else if (periodoId && !materiaId) {
      // Bloquear TODO un periodo para todas las materias
      const pids = Array.isArray(periodoId) ? periodoId : [periodoId];
      let subjs_query = 'SELECT id FROM materias WHERE tecnicatura_id = (SELECT tecnicatura_id FROM cursos WHERE id = ?)';
      if (user.rol === 'preceptor') subjs_query += ' AND es_taller = 0';
      if (user.rol === 'preceptor_taller') subjs_query += ' AND es_taller = 1';
      const subjs = await env.DB.prepare(subjs_query).bind(courseId).all();

      if (bloqueado) {
        const statements = [];
        for (const s of subjs.results) {
          for (const pid of pids) {
            statements.push(env.DB.prepare('INSERT OR REPLACE INTO bloqueos_materias (course_id, materia_id, periodo_id, bloqueado) VALUES (?, ?, ?, 1)').bind(courseId, s.id, pid));
          }
        }
        await env.DB.batch(statements);
      } else {
        const sids = subjs.results.map(s => s.id);
        if (sids.length) {
          const statements = pids.map(pid =>
            env.DB.prepare(`DELETE FROM bloqueos_materias WHERE course_id = ? AND periodo_id = ? AND materia_id IN (${sids.join(',')})`).bind(courseId, pid)
          );
          await env.DB.batch(statements);
        }
      }
    } else {
      // Individual o Grupo de periodos
      const pids = Array.isArray(periodoId) ? periodoId : [periodoId];

      // Validar permiso de materia
      if (materiaId && (user.rol === 'preceptor' || user.rol === 'preceptor_taller')) {
        const sub = await env.DB.prepare('SELECT es_taller FROM materias WHERE id = ?').bind(materiaId).first();
        if (user.rol === 'preceptor' && sub?.es_taller === 1) throw new Error('No puedes bloquear materias de taller.');
        if (user.rol === 'preceptor_taller' && sub?.es_taller !== 1) throw new Error('Solo puedes bloquear materias de taller.');
      }

      if (bloqueado) {
        const statements = pids.map(pid =>
          env.DB.prepare('INSERT OR REPLACE INTO bloqueos_materias (course_id, materia_id, periodo_id, bloqueado) VALUES (?, ?, ?, 1)').bind(courseId, materiaId, pid)
        );
        await env.DB.batch(statements);
      } else {
        const statements = pids.map(pid =>
          env.DB.prepare('DELETE FROM bloqueos_materias WHERE course_id = ? AND materia_id = ? AND periodo_id = ?').bind(courseId, materiaId, pid)
        );
        await env.DB.batch(statements);
      }
    }
    return json({ success: true });
  }

  return json({ error: 'Accion no soportada' }, 400);
}

// ─── POST /api/data?type=grades ──────────────────────────────────────────────

async function handleGradeUpdates(env, request, userId, body) {
  const user = await validateUser(env, request, userId);
  const { updates = [] } = body;
  if (!updates.length) return json({ success: true });

  const studentIds = [...new Set(updates.map(u => u.alumno_id))];
  const materiaIds = [...new Set(updates.map(u => u.materia_id))];
  const periodIds = [...new Set(updates.map(u => u.periodo_id))];

  // 1. Cargar toda la información necesaria en batch
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

  // 1.5 Restriction: Check if year is current
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

  // 2. Validaciones masivas
  for (const u of updates) {
    const student = studentMap[u.alumno_id];
    const materia = materiaMap[u.materia_id];
    if (!student) throw new Error(`Alumno ${u.alumno_id} no existe`);
    if (!materia) throw new Error(`Materia ${u.materia_id} no existe`);

    if (user.rol !== 'admin' && user.rol !== 'jefe_de_auxiliares' && user.rol !== 'director' && user.rol !== 'vicedirector') {
      const pair = `${student.course_id}-${u.materia_id}`;
      const isAssignedAsProfessor = p_subjects.includes(pair);

      if (user.rol === 'preceptor' || user.rol === 'preceptor_taller') {
        if (!isAssignedAsProfessor) {
          throw new Error(`Permiso denegado: los preceptores no pueden modificar calificaciones de forma directa.`);
        }
      } else if (user.rol === 'profesor' && !isAssignedAsProfessor) {
        throw new Error(`No tienes asignada la materia ${materia.nombre} en este curso.`);
      }
    }
  }

  // 3. Preparar statements y recolectar info para el log
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

    // AUTO-DEFINTIVA LOGIC (Backend Side validation/sync)
    // Period 10 = Definitiva, 11 = Otras Instancias, 9 = Mar, 8 = Feb, 7 = Dic, 6 = Trim3
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

  // 4. Auditoría optimizada
  const firstMateria = materiaMap[updates[0].materia_id];
  const auditoriaStudent = studentMap[updates[0].alumno_id];
  
  let actionLabel = (hasDelete && !hasAdd && !hasEdit) ? 'Eliminación' : ((hasAdd && !hasEdit && !hasDelete) ? 'Carga' : 'Modificación');
  if (updates.length > 1) actionLabel += ' Masiva';
  
  const eventType = (hasDelete && !hasAdd && !hasEdit) ? 'notas_delete' : ((hasAdd && !hasEdit && !hasDelete) ? 'notas_add' : 'notas_edit');

  const list = Object.keys(updatesByStudent).map(sId => {
    const sUpdates = updatesByStudent[sId];
    const name = studentMap[sId] ? `${studentMap[sId].apellido}, ${studentMap[sId].nombre}` : 'Desconocido';
    const desc = sUpdates.map(u => `${periodMap[u.periodo_id] || '?'}: ${u.valor_pond || u.valor_p || u.valor_t || '-'}`).join(', ');
    return `${name} (${desc})`;
  }).join(' | ');

  const detailString = `[DETALLE] ${actionLabel} de ${updates.length} notas en ${firstMateria.nombre}. Desglose: ${list}`;
  await logHistory(env, userId, firstStudent.course_id, eventType, detailString);

  await env.DB.batch(statements);
  return json({ success: true });
}


// ─── POST /api/data?type=students ────────────────────────────────────────────

async function handleStudents(env, request, userId, body) {
  const user = await validateUser(env, request, userId, 'admin', 'preceptor', 'preceptor_taller');
  const { action, nombre, apellido, dni, course_id, studentId } = body;

  // Para preceptores, validamos que sean dueños del curso del alumno (o del curso destino si es creación)
  if (user.rol === 'preceptor' || user.rol === 'preceptor_taller') {
    const ids = (user.professor_course_ids ?? '').split(',').map(Number).filter(Boolean);
    if (user.preceptor_course_id) ids.push(Number(user.preceptor_course_id));

    let courseToCheck = null;
    if (action === 'create') {
      courseToCheck = Number(course_id);
    } else if (studentId) {
      // Para transferencias, borrado o edición, validamos el curso ACTUAL del alumno
      const current = await env.DB.prepare('SELECT course_id FROM alumnos WHERE id = ?').bind(studentId).first();
      courseToCheck = current?.course_id;
    }

    if (courseToCheck && !ids.includes(courseToCheck)) {
      throw new Error('No tienes permisos para gestionar alumnos fuera de tu(s) curso(s) asignado(s).');
    }
  }

  const validateDNI = (val) => val && /^\d{7,8}$/.test(val);
  const validateCUIL = (val) => val && /^\d{11}$/.test(val);
  const validateEmail = (val) => val && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  if (action === 'create') {
    const finalDni = (dni && dni.trim() !== '') ? dni : null;
    
    if (finalDni && !validateDNI(finalDni)) {
      throw new Error('El DNI debe tener 7 u 8 dígitos numéricos.');
    }
    if (body.cuil && !validateCUIL(body.cuil)) throw new Error('El CUIL debe tener 11 dígitos numéricos.');
    if (body.tutor_dni && !validateDNI(body.tutor_dni)) throw new Error('El DNI del tutor debe tener 7 u 8 dígitos numéricos.');
    if (body.tutor_mail && !validateEmail(body.tutor_mail)) throw new Error('El Email del tutor no tiene un formato válido.');

    if (finalDni) {
      const existing = await env.DB.prepare(`
        SELECT a.id, a.course_id, a.observaciones, c.ano, c.division, c.turno 
        FROM alumnos a 
        LEFT JOIN cursos c ON a.course_id = c.id 
        WHERE a.dni = ?
      `).bind(finalDni).first();

      if (existing) {
        if (existing.course_id) {
          const courseLabel = `${existing.ano} ${existing.division} (${existing.turno})`;
          throw new Error(`El DNI ${finalDni} ya está registrado en el curso ${courseLabel}`);
        }
        // Re-incorporación
        const finalNombre = toTitleCase(nombre);
        const finalApellido = toTitleCase(apellido);
        const newObs = (existing.observaciones ? existing.observaciones + "\n" : "") + "🚩 [SISTEMA]: Alumno re-incorporado al curso.";
        await env.DB.prepare(
          'UPDATE alumnos SET nombre = ?, apellido = ?, course_id = ?, estado = 1, genero = ?, observaciones = ? WHERE id = ?'
        ).bind(finalNombre, finalApellido, course_id, body.genero, newObs, existing.id).run();
        
        await logHistory(env, userId, course_id, 'alta_alumno', `Re-incorporación de alumno: ${finalApellido}, ${finalNombre}`, existing.id);
        return json({ success: true, reincorporated: true });
      }
    }

    const finalNombre = toTitleCase(nombre);
    const finalApellido = toTitleCase(apellido);
    const { cuil, fecha_nacimiento, edad, tutor_nombre, tutor_parentesco, tutor_dni, tutor_contacto, tutor_mail, domicilio, libro, folio, legajo, matricula, observaciones } = body;

    await env.DB.prepare(
      `INSERT INTO alumnos (
        nombre, apellido, dni, course_id, estado, genero, 
        cuil, fecha_nacimiento, edad, tutor_nombre, tutor_parentesco, 
        tutor_dni, tutor_contacto, tutor_mail, domicilio, 
        libro, folio, legajo, matricula, observaciones
      ) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      finalNombre, finalApellido, finalDni, course_id, body.genero,
      cuil || null, fecha_nacimiento || null, edad || null, tutor_nombre || null, tutor_parentesco || null,
      tutor_dni || null, tutor_contacto || null, tutor_mail || null, domicilio || null,
      libro || null, folio || null, legajo || null, matricula || null, observaciones || ''
    ).run();

    // Log creation
    await logHistory(env, userId, course_id, 'alta_alumno', `Alta de nuevo alumno: ${finalApellido}, ${finalNombre}`);

    return json({ success: true });
  }

  if (action === 'delete') {
    if (user.rol !== 'admin' && user.rol !== 'jefe_de_auxiliares' && user.rol !== 'director' && user.rol !== 'vicedirector') {
      throw new Error('Solo los administradores pueden eliminar alumnos de forma permanente.');
    }
    const student = await env.DB.prepare('SELECT apellido, nombre, course_id FROM alumnos WHERE id = ?').bind(studentId).first();

    // Cascading deletes
    await env.DB.prepare('DELETE FROM calificaciones WHERE alumno_id = ?').bind(studentId).run();
    await env.DB.prepare('DELETE FROM pases WHERE alumno_id = ?').bind(studentId).run();
    await env.DB.prepare('DELETE FROM previas WHERE alumno_id = ?').bind(studentId).run();
    await env.DB.prepare('DELETE FROM historial WHERE alumno_id = ?').bind(studentId).run();

    // Finally delete the student
    await env.DB.prepare('DELETE FROM alumnos WHERE id = ?').bind(studentId).run();

    if (student) {
      await logHistory(env, userId, student.course_id, 'baja_alumno', `Eliminación permanente del alumno: ${student.apellido}, ${student.nombre}`);
    }
    return json({ success: true });
  }

  if (action === 'updateRotation') {
    const { rotations } = body; // Array of { id, rotacion }
    const statements = rotations.map(r =>
      env.DB.prepare('UPDATE alumnos SET rotacion = ? WHERE id = ?').bind(r.rotacion, r.id)
    );
    await env.DB.batch(statements);
    return json({ success: true });
  }

  if (action === 'updateObservation') {
    const student = await env.DB.prepare('SELECT apellido, nombre, course_id FROM alumnos WHERE id = ?').bind(studentId).first();
    await env.DB.prepare('UPDATE alumnos SET observaciones = ? WHERE id = ?').bind(body.observaciones, studentId).run();
    if (student) {
      const detail = `Observación agregada: ${body.observaciones.length > 50 ? body.observaciones.slice(0, 50) + '...' : body.observaciones}`;
      await logHistory(env, userId, student.course_id, 'observacion', detail, studentId);
    }
    return json({ success: true });
  }

  if (action === 'update') {
    // Validar permisos de curso para preceptores
    const student = await env.DB.prepare('SELECT course_id FROM alumnos WHERE id = ?').bind(studentId).first();
    if (!student) throw new Error('Alumno no encontrado');

    if (user.rol !== 'admin' && user.rol !== 'secretaria_de_alumnos' && user.rol !== 'jefe_de_auxiliares') {
      if (Number(user.preceptor_course_id) !== student.course_id) {
        throw new Error('Permiso denegado: Solo puedes editar la ficha de alumnos de tu curso asignado.');
      }
    }

    const { 
      nombre, apellido, dni, genero, matricula, libro, folio, legajo, estado, observaciones,
      cuil, fecha_nacimiento, edad, tutor_nombre, tutor_parentesco, tutor_dni, tutor_contacto, tutor_mail, domicilio
    } = body;

    const finalDni = (dni && dni.trim() !== '') ? dni : null;
    if (finalDni && !validateDNI(finalDni)) throw new Error('El DNI debe tener 7 u 8 dígitos numéricos.');
    if (cuil && !validateCUIL(cuil)) throw new Error('El CUIL debe tener 11 dígitos numéricos.');
    if (tutor_dni && !validateDNI(tutor_dni)) throw new Error('El DNI del tutor debe tener 7 u 8 dígitos numéricos.');
    if (tutor_mail && !validateEmail(tutor_mail)) throw new Error('El Email del tutor no tiene un formato válido.');

    const finalNombre = toTitleCase(nombre);
    const finalApellido = toTitleCase(apellido);
    await env.DB.prepare(
      `UPDATE alumnos SET 
        nombre = ?, apellido = ?, dni = ?, genero = ?, matricula = ?, 
        libro = ?, folio = ?, legajo = ?, estado = ?, observaciones = ?,
        cuil = ?, fecha_nacimiento = ?, edad = ?, tutor_nombre = ?, 
        tutor_parentesco = ?, tutor_dni = ?, tutor_contacto = ?, 
        tutor_mail = ?, domicilio = ?
      WHERE id = ?`
    ).bind(
      finalNombre, finalApellido, finalDni, genero, matricula, 
      libro, folio, legajo, estado !== undefined ? estado : 1, observaciones || '',
      cuil || null, fecha_nacimiento || null, edad || null, tutor_nombre || null,
      tutor_parentesco || null, tutor_dni || null, tutor_contacto || null,
      tutor_mail || null, domicilio || null, studentId
    ).run();

    await logHistory(env, userId, student.course_id, 'ficha_edit', `Actualización de ficha de alumno: ${finalApellido}, ${finalNombre}`, studentId);

    return json({ success: true });
  }

  if (action === 'update_password') {
    const { studentId, password: newPassword } = body;
    if (!studentId) throw new Error('ID de alumno requerido');
    
    const student = await env.DB.prepare('SELECT apellido, nombre, course_id FROM alumnos WHERE id = ?').bind(studentId).first();
    await env.DB.prepare('UPDATE alumnos SET password = ? WHERE id = ?').bind(newPassword || null, studentId).run();
    
    if (student) {
      await logHistory(env, userId, student.course_id, 'password_edit', `Cambio de contraseña para: ${student.apellido}, ${student.nombre}`, studentId);
    }
    return json({ success: true });
  }

  if (action === 'dar_de_pase') {
    const student = await env.DB.prepare('SELECT * FROM alumnos WHERE id = ?').bind(studentId).first();
    if (!student) throw new Error('Alumno no encontrado');

    // 1. Insert into pases with course_id_origen
    const finalMotivo = body.motivo?.trim() || '...';
    await env.DB.prepare(
      `INSERT INTO pases (alumno_id, nombre_apellido, dni, institucion_destino, fecha_pase, motivo, course_id_origen, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(studentId, `${student.apellido}, ${student.nombre}`, student.dni, body.institucion, body.fecha, finalMotivo, student.course_id, 'De pase').run();

    // 2. Update student: Set estado = 0, course_id = NULL, and add marker to observations
    const marker = "**DADO DE PASE**";
    const lines = (student.observaciones || "").split("\n").filter(l => !l.startsWith(marker));
    lines.push(`${marker} en ${body.institucion} en la Fecha: ${body.fecha}. Motivo: ${finalMotivo}`);

    await env.DB.prepare('UPDATE alumnos SET course_id = NULL, estado = 0, observaciones = ? WHERE id = ?').bind(lines.join("\n").trim(), studentId).run();

    // Audit Log for Pass
    await logHistory(env, userId, student.course_id, 'pase_alumno', `${student.apellido}, ${student.nombre} ha sido dado de pase.`, studentId);

    return json({ success: true });
  }

  if (action === 'transfer') {
    if (user.rol !== 'admin' && user.rol !== 'secretaria_de_alumnos' && user.rol !== 'preceptor' && user.rol !== 'preceptor_taller' && user.rol !== 'jefe_de_auxiliares') {
      throw new Error('No tienes permisos para realizar transferencias.');
    }

    const student = await env.DB.prepare(
      `SELECT a.*, (c.ano || ' ' || c.division || ' ' || c.turno) as old_course_label 
       FROM alumnos a JOIN cursos c ON c.id = a.course_id WHERE a.id = ?`
    ).bind(studentId).first();

    const targetCourse = await env.DB.prepare(
      `SELECT (ano || ' ' || division || ' ' || turno) as new_course_label FROM cursos WHERE id = ?`
    ).bind(body.course_id).first();

    if (!student || !targetCourse) throw new Error('Datos de transferencia invalidos');

    // Remove grades as per existing logic
    await env.DB.prepare('DELETE FROM calificaciones WHERE alumno_id = ?').bind(studentId).run();

    // Update course
    await env.DB.prepare('UPDATE alumnos SET course_id = ? WHERE id = ?').bind(body.course_id, studentId).run();

    // Add observation
    const finalMotivo = body.motivo?.trim() || '...';
    const log = `Alumno transferido de (${student.old_course_label}) a (${targetCourse.new_course_label}) debido a: ${finalMotivo}`;
    const newObs = (student.observaciones ? student.observaciones + "\n" : "") + log;
    await env.DB.prepare('UPDATE alumnos SET observaciones = ? WHERE id = ?').bind(newObs, studentId).run();

    // Audit Log for Source Course
    await logHistory(env, userId, student.course_id, 'transferencia_salida', `${student.apellido}, ${student.nombre} ha sido transferido a ${targetCourse.new_course_label}.`, studentId);

    // Audit Log for Destination Course
    await logHistory(env, userId, body.course_id, 'transferencia_entrada', `${student.apellido}, ${student.nombre} ha ingresado al curso debido a ${finalMotivo}.`, studentId);

    return json({ success: true });
  }

  if (action === 'update_pase') {
    if (user.rol !== 'admin' && user.rol !== 'secretaria_de_alumnos' && user.rol !== 'jefe_de_auxiliares' && user.rol !== 'director' && user.rol !== 'vicedirector') throw new Error('Permiso denegado.');
    const { id, course_id_origen, institucion_destino, fecha_pase, motivo, estado } = body;
    await env.DB.prepare(
      `UPDATE pases SET course_id_origen = ?, institucion_destino = ?, fecha_pase = ?, motivo = ?, estado = ? WHERE id = ?`
    ).bind(
      course_id_origen ?? null,
      institucion_destino ?? '',
      fecha_pase ?? '',
      motivo?.trim() || '...',
      estado ?? 'De pase',
      id
    ).run();
    return json({ success: true });
  }

  if (action === 'undo_pase') {
    if (user.rol !== 'admin' && user.rol !== 'secretaria_de_alumnos' && user.rol !== 'jefe_de_auxiliares') throw new Error('Solo el administrador o jefe puede deshacer pases.');
    const { paseId } = body;
    if (!paseId) throw new Error('ID de pase requerido');

    const pase = await env.DB.prepare('SELECT alumno_id, course_id_origen FROM pases WHERE id = ?').bind(paseId).first();
    if (pase) {
      const student = await env.DB.prepare('SELECT observaciones FROM alumnos WHERE id = ?').bind(pase.alumno_id).first();
      if (student) {
        const marker = "**DADO DE PASE**";
        const newObs = (student.observaciones || "").split("\n").filter(l => !l.startsWith(marker)).join("\n").trim();
        // Restaurar curso y estado activo
        await env.DB.prepare('UPDATE alumnos SET course_id = ?, estado = 1, observaciones = ? WHERE id = ?').bind(pase.course_id_origen, newObs, pase.alumno_id).run();
        
        const studentData = await env.DB.prepare('SELECT apellido, nombre FROM alumnos WHERE id = ?').bind(pase.alumno_id).first();
        if (studentData) {
          await logHistory(env, userId, pase.course_id_origen, 'pase_undo', `Se deshizo el pase de: ${studentData.apellido}, ${studentData.nombre}`, pase.alumno_id);
        }
      }
      await env.DB.prepare('DELETE FROM pases WHERE id = ?').bind(paseId).run();
    }
    return json({ success: true });
  }

  return json({ error: 'Acción no soportada' }, 400);
}

// ─── POST /api/data?type=courses ─────────────────────────────────────────────

async function handleCourses(env, request, userId, body) {
  await validateUser(env, request, userId, 'admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector');
  const { action, ano, division, turno, tecnicatura_id, year_id, studentId } = body;
  if (action === 'create') {
    const r = await env.DB.prepare(
      'INSERT INTO cursos (ano, division, turno, tecnicatura_id, year_id, detalle) VALUES (?, ?, ?, ?, ?, ?) RETURNING *'
    ).bind(ano, division, turno, tecnicatura_id, year_id, body.detalle || '').first();

    await logHistory(env, userId, r.id, 'gestion_cursos', `Curso creado: ${ano} ${division} ${turno}`);
    return json({ success: true, course: r });
  }

  if (action === 'toggle_active') {
    const { courseId, activo } = body;
    if (!courseId) throw new Error('ID de curso requerido');
    await env.DB.prepare('UPDATE cursos SET activo = ? WHERE id = ?').bind(activo ? 1 : 0, courseId).run();
    return json({ success: true });
  }

  if (action === 'delete') {
    await validateUser(env, request, userId, 'admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares');
    const { courseId } = body;
    if (!courseId) throw new Error('ID de curso requerido');
    // We keep delete for absolute emergency but it won't be in the UI
    await env.DB.prepare('DELETE FROM cursos WHERE id = ?').bind(courseId).run();
    return json({ success: true });
  }

  if (action === 'update') {
    const { courseId, ano, division, turno, tecnicatura_id, year_id, detalle } = body;
    await env.DB.prepare(
      'UPDATE cursos SET ano = ?, division = ?, turno = ?, tecnicatura_id = ?, year_id = ?, detalle = ? WHERE id = ?'
    ).bind(ano, division, turno, tecnicatura_id, year_id, detalle || '', courseId).run();
    return json({ success: true });
  }

  return json({ error: 'Acción no soportada' }, 400);
}

// ─── POST /api/data?type=years ───────────────────────────────────────────────

async function handleYears(env, request, userId, body) {
  await validateUser(env, request, userId, 'admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector');
  const { action, nombre, yearId } = body;

  if (action === 'delete') {
    await validateUser(env, request, userId, 'admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares');
    if (!yearId) throw new Error('ID de año requerido');
    await env.DB.prepare('DELETE FROM años_lectivos WHERE id = ?').bind(yearId).run();
    return json({ success: true });
  }

  if (action === 'update') {
    if (!yearId) throw new Error('ID de año requerido');
    await env.DB.prepare('UPDATE años_lectivos SET nombre = ? WHERE id = ?').bind(nombre, yearId).run();
    return json({ success: true });
  }

  if (action === 'set_current') {
    await env.DB.batch([
      env.DB.prepare('UPDATE años_lectivos SET es_actual = 0'),
      env.DB.prepare('UPDATE años_lectivos SET es_actual = 1 WHERE id = ?').bind(yearId)
    ]);
    return json({ success: true });
  }

  if (action === 'copy_roles') {
    const { fromYearId, toYearId, targetUserId } = body;
    // This is a complex operation: we need to find roles assigned to courses of fromYearId
    // and apply them to courses with SAME ano, division, turno in toYearId.
    const fromCourses = await env.DB.prepare('SELECT * FROM cursos WHERE year_id = ?').bind(fromYearId).all();
    const toCourses = await env.DB.prepare('SELECT * FROM cursos WHERE year_id = ?').bind(toYearId).all();
    
    const courseMap = {}; // "ano-division-turno" -> id
    toCourses.results.forEach(c => {
      courseMap[`${c.ano}-${c.division}-${c.turno}`] = c.id;
    });

    const users = targetUserId 
      ? await env.DB.prepare('SELECT * FROM usuarios WHERE id = ?').bind(targetUserId).all()
      : await env.DB.prepare('SELECT * FROM usuarios').all();
    const statements = [];

    for (const u of users.results) {
      let newPreceptorCourse = u.preceptor_course_id;
      let newProfCourses = (u.professor_course_ids || '').split(',').filter(Boolean);
      let newProfSubjects = (u.professor_subject_ids || '').split(',').filter(Boolean);

      // Map preceptor course
      if (u.preceptor_course_id) {
        const c = fromCourses.results.find(xc => xc.id === u.preceptor_course_id);
        if (c) newPreceptorCourse = courseMap[`${c.ano}-${c.division}-${c.turno}`] || null;
      }

      // Map professor courses/subjects
      const mappedCourses = [];
      newProfCourses.forEach(cid => {
        const c = fromCourses.results.find(xc => xc.id === Number(cid));
        if (c) {
          const targetId = courseMap[`${c.ano}-${c.division}-${c.turno}`];
          if (targetId) mappedCourses.push(targetId);
        }
      });

      const mappedSubjects = [];
      newProfSubjects.forEach(pair => {
        const [cid, mid] = pair.split('-').map(Number);
        const c = fromCourses.results.find(xc => xc.id === cid);
        if (c) {
          const targetId = courseMap[`${c.ano}-${c.division}-${c.turno}`];
          if (targetId) mappedSubjects.push(`${targetId}-${mid}`);
        }
      });

      statements.push(env.DB.prepare(`
        UPDATE usuarios SET preceptor_course_id = ?, professor_course_ids = ?, professor_subject_ids = ? WHERE id = ?
      `).bind(newPreceptorCourse, mappedCourses.join(','), mappedSubjects.join(','), u.id));
    }
    
    if (statements.length) await env.DB.batch(statements);
    return json({ success: true });
  }

  const r = await env.DB.prepare(
    'INSERT INTO años_lectivos (nombre, es_actual) VALUES (?, 0) RETURNING *'
  ).bind(nombre || body).first(); 
  return json({ success: true, year: r });
}

// ─── POST /api/data?type=end_cycle ───────────────────────────────────────────

async function handleEndCycle(env, request, userId, body) {
  const user = await validateUser(env, request, userId, 'admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares');
  const { students = [], isRepeater, targetCourseId, cycleName } = body;

  const statements = [];
  for (const s of students) {
    // 1. Get current data for history
    const data = await env.DB.prepare(`
      SELECT a.*, c.ano, c.division, c.turno, t.nombre as tec_nombre
      FROM alumnos a
      JOIN cursos c ON c.id = a.course_id
      JOIN tecnicaturas t ON t.id = c.tecnicatura_id
      WHERE a.id = ?
    `).bind(s.id).first();

    if (!data) continue;

    // 2. Get grades for the bulletin snapshot
    const grades = await env.DB.prepare(`
      SELECT m.id as materia_id, m.nombre as materia, g.valor_t as definitiva
      FROM calificaciones g
      JOIN materias m ON m.id = g.materia_id
      WHERE g.alumno_id = ? AND g.periodo_id = 10
    `).bind(s.id).all();

    const historyData = {
      curso: `${data.ano} ${data.division}`,
      tecnicatura: data.tec_nombre,
      ciclo: cycleName,
      boletin: grades.results
    };

    statements.push(env.DB.prepare(`
      INSERT INTO historial_escolar (alumno_id, curso_label, tecnicatura_nombre, ciclo_lectivo_nombre, boletin_data)
      VALUES (?, ?, ?, ?, ?)
    `).bind(s.id, historyData.curso, historyData.tecnicatura, historyData.ciclo, JSON.stringify(historyData.boletin)));

    // 3. Detect failures and move to 'previas' table before deleting
    for (const g of grades.results) {
      const val = g.definitiva ? Number(String(g.definitiva).replace(',', '.')) : 0;
      if (val < 7) {
        statements.push(env.DB.prepare(`
          INSERT INTO previas (alumno_id, materia_id, materia_nombre_custom, curso_ano, estado)
          VALUES (?, ?, ?, ?, 'pendiente')
        `).bind(s.id, g.materia_id, null, `${data.ano} ${data.division} (${cycleName})`));
      }
    }

    if (isRepeater) {
      const obs = (data.observaciones ? data.observaciones + "\n" : "") + `REPITENTE ${cycleName} del curso ${data.ano} ${data.division}`;
      statements.push(env.DB.prepare('UPDATE alumnos SET observaciones = ?, course_id = ? WHERE id = ?').bind(obs, targetCourseId, s.id));
    } else {
      statements.push(env.DB.prepare('UPDATE alumnos SET course_id = ? WHERE id = ?').bind(targetCourseId, s.id));
    }
    
    // Clear grades for next year (since they moved)
    statements.push(env.DB.prepare('DELETE FROM calificaciones WHERE alumno_id = ?').bind(s.id));
  }

  if (statements.length) await env.DB.batch(statements);
  return json({ success: true });
}


// ─── POST /api/data?type=tecnicaturas ────────────────────────────────────────

async function handleTecnicaturas(env, request, userId, body) {
  await validateUser(env, request, userId, 'admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector');
  const { action, nombre, materias = [], tecnicaturaId } = body;

  if (action === 'create') {
    const tec = await env.DB.prepare(
      'INSERT INTO tecnicaturas (nombre, detalle) VALUES (?, ?) RETURNING *'
    ).bind(nombre, body.detalle || '').first();

    const statements = [];
    for (let i = 0; i < materias.length; i++) {
      const m = materias[i];
      if (!m.nombre?.trim()) continue;
      statements.push(env.DB.prepare(
        'INSERT INTO materias (nombre, tipo, es_taller, tecnicatura_id, num_rotacion, orden) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(m.nombre.trim(), m.tipo ?? 'comun', m.es_taller ? 1 : 0, tec.id, m.num_rotacion ?? null, i));
    }
    if (statements.length) await env.DB.batch(statements);
    return json({ success: true, tecnicatura: tec });
  }

  if (action === 'update') {
    await env.DB.prepare('UPDATE tecnicaturas SET nombre = ?, detalle = ? WHERE id = ?').bind(nombre, body.detalle || '', tecnicaturaId).run();

    // Get current subject IDs to delete those removed from form
    const currentSubjects = await env.DB.prepare('SELECT id FROM materias WHERE tecnicatura_id = ?').bind(tecnicaturaId).all();
    const currentIds = currentSubjects.results.map(s => s.id);
    const incomingIds = materias.filter(m => typeof m.id !== 'string' || !m.id.startsWith('draft-')).map(m => Number(m.id));
    const idsToDelete = currentIds.filter(id => !incomingIds.includes(id));

    const statements = [];
    if (idsToDelete.length) {
      const placeholders = idsToDelete.map(() => '?').join(',');
      statements.push(env.DB.prepare(`DELETE FROM materias WHERE id IN (${placeholders})`).bind(...idsToDelete));
    }

    for (let i = 0; i < materias.length; i++) {
      const m = materias[i];
      if (!m.nombre?.trim()) continue;
      if (typeof m.id === 'string' && m.id.startsWith('draft-')) {
        statements.push(env.DB.prepare(
          'INSERT INTO materias (nombre, tipo, es_taller, tecnicatura_id, num_rotacion, orden) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(m.nombre.trim(), m.tipo ?? 'comun', m.es_taller ? 1 : 0, tecnicaturaId, m.num_rotacion ?? null, i));
      } else {
        statements.push(env.DB.prepare(
          'UPDATE materias SET nombre = ?, tipo = ?, es_taller = ?, num_rotacion = ?, orden = ? WHERE id = ?'
        ).bind(m.nombre.trim(), m.tipo ?? 'comun', m.es_taller ? 1 : 0, m.num_rotacion ?? null, i, m.id));
      }
    }
    if (statements.length) await env.DB.batch(statements);
    return json({ success: true });
  }

  if (action === 'duplicate') {
    const originalTec = await env.DB.prepare('SELECT nombre FROM tecnicaturas WHERE id = ?').bind(tecnicaturaId).first();
    if (!originalTec) throw new Error('Tecnicatura original no encontrada');

    const newName = `${originalTec.nombre} (Copia)`;
    const tec = await env.DB.prepare('INSERT INTO tecnicaturas (nombre) VALUES (?) RETURNING *').bind(newName).first();

    const subjects = await env.DB.prepare('SELECT * FROM materias WHERE tecnicatura_id = ? ORDER BY orden, id').bind(tecnicaturaId).all();
    const statements = [];
    for (let i = 0; i < subjects.results.length; i++) {
      const m = subjects.results[i];
      statements.push(env.DB.prepare(
        'INSERT INTO materias (nombre, tipo, es_taller, tecnicatura_id, num_rotacion, orden) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(m.nombre, m.tipo, m.es_taller, tec.id, m.num_rotacion ?? null, i));
    }
    if (statements.length) await env.DB.batch(statements);
    return json({ success: true, tecnicatura: tec });
  }

  if (action === 'delete') {
    await validateUser(env, request, userId, 'admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares');
    // Check if there are courses using this tec
    const courseCount = await env.DB.prepare('SELECT COUNT(*) as count FROM cursos WHERE tecnicatura_id = ?').bind(tecnicaturaId).first('count');
    if (courseCount > 0) {
      return json({ error: 'No se puede eliminar: Esta tecnicatura tiene cursos asignados. Elimina los cursos primero.' }, 400);
    }

    // Delete children first
    await env.DB.prepare('DELETE FROM materias WHERE tecnicatura_id = ?').bind(tecnicaturaId).run();
    // Delete parent
    await env.DB.prepare('DELETE FROM tecnicaturas WHERE id = ?').bind(tecnicaturaId).run();
    return json({ success: true });
  }

  return json({ error: 'Acción no soportada' }, 400);
}

// ─── POST /api/data?type=users ───────────────────────────────────────────────

async function handleUsers(env, request, userId, body) {
  await validateUser(env, request, userId, 'admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector');
  const { action, targetUserId, nombre, username, password, rol, preceptor_course_id, professor_course_ids = [], professor_subject_ids = [], is_professor_hybrid = 0 } = body;

  if (action === 'delete') {
    await validateUser(env, request, userId, 'admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares');
    if (!targetUserId) throw new Error('ID de usuario requerido');
    if (userId === Number(targetUserId)) throw new Error('No puedes eliminarte a ti mismo.');
    await env.DB.prepare('DELETE FROM usuarios WHERE id = ?').bind(targetUserId).run();
    return json({ success: true });
  }

  if (action === 'update') {
    const { targetUserId: tid } = body;
    await env.DB.prepare(
      `UPDATE usuarios SET nombre = ?, username = ?, rol = ?, preceptor_course_id = ?, 
       professor_course_ids = ?, professor_subject_ids = ?, is_professor_hybrid = ?
       WHERE id = ?`
    ).bind(
      nombre, username, rol, preceptor_course_id || null,
      Array.isArray(professor_course_ids) ? professor_course_ids.join(',') : professor_course_ids || '',
      Array.isArray(professor_subject_ids) ? professor_subject_ids.join(',') : professor_subject_ids || '',
      is_professor_hybrid ? 1 : 0,
      tid
    ).run();
    await logHistory(env, userId, null, 'gestion_usuarios', `Usuario actualizado: ${nombre}`);
    return json({ success: true });
  }

  if (action === 'reset_password') {
    const { targetUserId: tid, newPassword } = body;
    if (!newPassword) throw new Error('Nueva contraseña requerida');
    await env.DB.prepare('UPDATE usuarios SET password = ? WHERE id = ?').bind(newPassword, tid).run();
    await logHistory(env, userId, null, 'gestion_usuarios', `Contraseña reseteada para usuario ID: ${tid}`);
    return json({ success: true });
  }

  await env.DB.prepare(
    `INSERT INTO usuarios (nombre, username, password, rol, preceptor_course_id, professor_course_ids, professor_subject_ids, is_professor_hybrid)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    nombre, username, password, rol, preceptor_course_id || null,
    Array.isArray(professor_course_ids) ? professor_course_ids.join(',') : professor_course_ids || '',
    Array.isArray(professor_subject_ids) ? professor_subject_ids.join(',') : professor_subject_ids || '',
    is_professor_hybrid ? 1 : 0,
  ).run();

  await logHistory(env, userId, null, 'gestion_usuarios', `Usuario creado: ${nombre} (${username}) con rol ${rol}`);
  return json({ success: true });
}

// ─── POST /api/data?type=previas ──────────────────────────────────────────────

async function handlePrevias(env, request, userId, body) {
  await validateUser(env, request, userId, 'admin', 'secretaria_de_alumnos', 'preceptor', 'jefe_de_auxiliares', 'director', 'vicedirector');
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

// ─── POST /api/data?type=historial_delete ────────────────────────────────────

async function handleHistorialDelete(env, request, userId, body) {
  await validateUser(env, request, userId, 'admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares');
  const { action, logId, courseId } = body;

  if (action === 'delete_all') {
    if (!courseId) throw new Error('ID de curso requerido');
    await env.DB.prepare('DELETE FROM historial WHERE course_id = ?').bind(courseId).run();
    await logHistory(env, userId, courseId, 'historial_clear', 'El administrador vació todo el historial de este curso.');
    return json({ success: true });
  }

  if (action === 'delete_one') {
    if (!logId) throw new Error('ID de registro requerido');
    await env.DB.prepare('DELETE FROM historial WHERE id = ?').bind(logId).run();
    return json({ success: true });
  }

  return json({ error: 'Acción no soportada' }, 400);
}

async function handleAnuncios(env, request, userId, body) {
  await validateUser(env, request, userId, 'admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector');
  const { action, id, titulo, contenido, tipo, activo } = body;

  if (action === 'create') {
    await env.DB.prepare('INSERT INTO anuncios (titulo, contenido, tipo, activo) VALUES (?, ?, ?, ?)')
      .bind(titulo || '', contenido || '', tipo || 'texto', activo ?? 1).run();
  } else if (action === 'update') {
    await env.DB.prepare('UPDATE anuncios SET titulo = ?, contenido = ?, tipo = ?, activo = ? WHERE id = ?')
      .bind(titulo || '', contenido || '', tipo || 'texto', activo ?? 1, id || 0).run();
  } else if (action === 'delete') {
    await env.DB.prepare('DELETE FROM anuncios WHERE id = ?').bind(id || 0).run();
  }
  return json({ success: true });
}

// ─── Router ──────────────────────────────────────────────────────────────────

export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type');
  try {
    if (type === 'grid') return await handleGrid(env, request, url);
    if (type === 'public_anuncios') {
      const { results } = await env.DB.prepare('SELECT * FROM anuncios WHERE activo = 1 ORDER BY id DESC').all();
      return json(results);
    }
    if (type === 'historial_escolar') {
      const studentId = url.searchParams.get('studentId');
      const res = await env.DB.prepare('SELECT * FROM historial_escolar WHERE alumno_id = ? ORDER BY id DESC').bind(studentId).all();
      return json(res.results);
    }
    return json({ error: 'Tipo no especificado' }, 400);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}

export async function onRequestPost({ env, request }) {
  const url = new URL(request.url);
  const type = url.searchParams.get('type') ?? 'grades';
  const userId = toNumber(url.searchParams.get('userId'));

  try {
    const body = await request.json();
    if (type === 'grades') return await handleGradeUpdates(env, request, userId, body);
    if (type === 'students') return await handleStudents(env, request, userId, body);
    if (type === 'courses') return await handleCourses(env, request, userId, body);
    if (type === 'years') return await handleYears(env, request, userId, body);
    if (type === 'tecnicaturas') return await handleTecnicaturas(env, request, userId, body);
    if (type === 'users') return await handleUsers(env, request, userId, body);
    if (type === 'config') return await handleConfig(env, request, userId, body);
    if (type === 'bloqueos') return await handleLocks(env, request, userId, body);
    if (type === 'previas') return await handlePrevias(env, request, userId, body);
    if (type === 'historial_delete') return await handleHistorialDelete(env, request, userId, body);
    if (type === 'anuncios') return await handleAnuncios(env, request, userId, body);
    if (type === 'end_cycle') return await handleEndCycle(env, request, userId, body);
    return json({ error: 'Tipo no soportado' }, 400);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
