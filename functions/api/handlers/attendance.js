import { toNumber, validateUser, logHistory, json } from "../_helpers.js";

export async function handleAttendanceLoad(env, request, url) {
  const currentUser = await validateUser(env, request);
  const courseId = toNumber(url.searchParams.get('courseId'));
  const month = url.searchParams.get('month');
  let sector = url.searchParams.get('sector') || 'teoria';

  if (!courseId || !month) return json({ error: 'Faltan parámetros' }, 400);

  // Fetch up-to-date user record from DB
  const user = (await env.DB.prepare('SELECT * FROM usuarios WHERE id = ?').bind(currentUser.id).first()) || currentUser;

  // Security: Check if preceptor has access to this course
  const highRoles = ['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'];
  if (!highRoles.includes(user.rol)) {
    if (user.rol.startsWith('preceptor') && Number(user.preceptor_course_id) !== courseId) {
      return json({ error: 'No tienes permiso para acceder a la asistencia de este curso.' }, 403);
    }
  }

  // Forzar sector según rol
  const restrictedRoles = {
    'preceptor': 'teoria',
    'preceptor_taller': 'taller',
    'preceptor_ef': 'ed_fisica'
  };

  if (restrictedRoles[user.rol]) {
    sector = restrictedRoles[user.rol];
  }

  const { results } = await env.DB.prepare(`
    SELECT * FROM asistencia 
    WHERE alumno_id IN (SELECT id FROM alumnos WHERE course_id = ?) 
    AND fecha LIKE ?
    AND sector = ?
  `).bind(courseId, `${month}-%`, sector).all();
  return json(results);
}

export async function handleAttendanceSave(env, request, userId, body) {
  const currentUser = await validateUser(env, request, userId);
  const { updates = [] } = body;
  let sector = body.sector || 'teoria';

  if (!updates.length) return json({ success: true });

  // Fetch up-to-date user record from DB
  const user = (await env.DB.prepare('SELECT * FROM usuarios WHERE id = ?').bind(userId).first()) || currentUser;

  const allowedRoles = ['admin', 'preceptor', 'preceptor_taller', 'preceptor_ef', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'];
  if (!allowedRoles.includes(user.rol)) {
    throw new Error('No tienes permiso para guardar asistencias.');
  }

  // Security: Check course assignment for preceptors
  const highRoles = ['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'];
  if (!highRoles.includes(user.rol) && user.rol.startsWith('preceptor')) {
    // Get courseId from the first student in updates (they should all be from the same course in a batch save)
    const firstStudent = await env.DB.prepare('SELECT course_id FROM alumnos WHERE id = ?').bind(updates[0].alumno_id).first();
    if (firstStudent && Number(user.preceptor_course_id) !== Number(firstStudent.course_id)) {
      throw new Error('No tienes permiso para modificar la asistencia de este curso.');
    }
  }

  // Forzar sector según rol
  const restrictedRoles = {
    'preceptor': 'teoria',
    'preceptor_taller': 'taller',
    'preceptor_ef': 'ed_fisica'
  };

  if (restrictedRoles[user.rol]) {
    sector = restrictedRoles[user.rol];
  }

  const statements = updates.map(u => {
    if (!u.valor || u.valor.trim() === '') {
      return env.DB.prepare('DELETE FROM asistencia WHERE alumno_id = ? AND fecha = ? AND sector = ?').bind(u.alumno_id, u.fecha, sector);
    }
    return env.DB.prepare(`
      INSERT INTO asistencia (alumno_id, fecha, valor, sector) 
      VALUES (?, ?, ?, ?) 
      ON CONFLICT(alumno_id, fecha, sector) 
      DO UPDATE SET valor = excluded.valor
    `).bind(u.alumno_id, u.fecha, u.valor.toUpperCase(), sector);
  });

  await env.DB.batch(statements);

  // Auditoría de Asistencia
  try {
    const firstUpdate = updates[0];
    const student = await env.DB.prepare('SELECT id, course_id, apellido, nombre FROM alumnos WHERE id = ?').bind(firstUpdate.alumno_id).first();
    if (student) {
      const detail = `[DETALLE] Registro de asistencia: ${updates.length} cambios aplicados en la grilla mensual.`;
      await logHistory(env, userId, student.course_id, 'asistencia_edit', detail);
    }
  } catch (logErr) {
    console.error('Error logging attendance history:', logErr);
  }

  return json({ success: true });
}
