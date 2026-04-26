import { json, toNumber } from "./_helpers.js";
import { handleGrid } from "./handlers/grid.js";
import { handleAttendanceLoad, handleAttendanceSave } from "./handlers/attendance.js";
import { handleStudents, handleStudentImages } from "./handlers/students.js";
import { handleGradeUpdates, handlePrevias } from "./handlers/grades.js";
import { 
  handleCourses, 
  handleYears, 
  handleTecnicaturas, 
  handleLocks, 
  handleSchedules 
} from "./handlers/academic.js";
import { 
  handleUsers, 
  handleConfig, 
  handleAnuncios, 
  handleEndCycle, 
  handleHistorialDelete 
} from "./handlers/admin.js";

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
    
    if (type === 'horarios') {
      const courseId = url.searchParams.get('courseId');
      if (courseId) {
        const schedule = await env.DB.prepare('SELECT * FROM course_schedules WHERE course_id = ?').bind(courseId).first();
        return json(schedule || { course_id: courseId, grid_data: '[]' });
      }
      const { results } = await env.DB.prepare('SELECT * FROM course_schedules').all();
      return json(results);
    }
    
    if (type === 'asistencia') return await handleAttendanceLoad(env, request, url);
    
    if (type === 'student_images') {
      const studentId = url.searchParams.get('studentId');
      if (!studentId) throw new Error('ID de alumno requerido');
      const { results } = await env.DB.prepare('SELECT * FROM alumno_imagenes WHERE alumno_id = ? ORDER BY id DESC').bind(studentId).all();
      return json(results);
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
    if (type === 'horarios') return await handleSchedules(env, request, userId, body);
    if (type === 'asistencia') return await handleAttendanceSave(env, request, userId, body);
    if (type === 'student_images') return await handleStudentImages(env, request, userId, body);
    
    return json({ error: 'Tipo no soportado' }, 400);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
