import { toNumber, validateUser, logHistory, json } from "../_helpers.js";

export async function handleAttendanceLoad(env, request, url) {
  const user = await validateUser(env, request);
  const courseId = toNumber(url.searchParams.get('courseId'));
  const month = url.searchParams.get('month');
  let sector = url.searchParams.get('sector') || 'teoria';

  if (!courseId || !month) return json({ error: 'Faltan parámetros' }, 400);

  // Forzar sector según rol si no es admin/secretaria/jefe/director
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
  const user = await validateUser(env, request, userId);
  const { updates = [] } = body;
  let sector = body.sector || 'teoria';

  if (!updates.length) return json({ success: true });

  const allowedRoles = ['admin', 'preceptor', 'preceptor_taller', 'preceptor_ef', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'];
  if (!allowedRoles.includes(user.rol)) {
    throw new Error('No tienes permiso para guardar asistencias.');
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
