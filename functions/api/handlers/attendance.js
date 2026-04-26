import { toNumber, validateUser, logHistory, json } from "../_helpers.js";

export async function handleAttendanceLoad(env, request, url) {
  const courseId = toNumber(url.searchParams.get('courseId'));
  const month = url.searchParams.get('month');
  if (!courseId || !month) return json({ error: 'Faltan parámetros' }, 400);

  const { results } = await env.DB.prepare(`
    SELECT * FROM asistencia 
    WHERE alumno_id IN (SELECT id FROM alumnos WHERE course_id = ?) 
    AND fecha LIKE ?
  `).bind(courseId, `${month}-%`).all();
  return json(results);
}

export async function handleAttendanceSave(env, request, userId, body) {
  const user = await validateUser(env, request, userId);
  const { updates = [] } = body;
  if (!updates.length) return json({ success: true });

  const allowedRoles = ['admin', 'preceptor', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'];
  if (!allowedRoles.includes(user.rol)) {
    throw new Error('No tienes permiso para guardar asistencias.');
  }

  const statements = updates.map(u => {
    if (!u.valor || u.valor.trim() === '') {
      return env.DB.prepare('DELETE FROM asistencia WHERE alumno_id = ? AND fecha = ?').bind(u.alumno_id, u.fecha);
    }
    return env.DB.prepare(`
      INSERT INTO asistencia (alumno_id, fecha, valor) 
      VALUES (?, ?, ?) 
      ON CONFLICT(alumno_id, fecha) 
      DO UPDATE SET valor = excluded.valor
    `).bind(u.alumno_id, u.fecha, u.valor.toUpperCase());
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
