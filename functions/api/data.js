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
  handleHistorialDelete,
  handleSelfPasswordChange,
  handleAcknowledgeSecurity 
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
      const studentId = url.searchParams.get('studentId') || url.searchParams.get('student_id');
      const res = await env.DB.prepare(`
        SELECT h.*, 
               COALESCE(t.nombre, NULLIF(h.tecnicatura_nombre, 'Tecnicatura'), 'Sin Carrera') as tecnicatura_nombre
        FROM historial_escolar h
        LEFT JOIN cursos c ON c.id = h.course_id
        LEFT JOIN tecnicaturas t ON t.id = c.tecnicatura_id
        WHERE h.alumno_id = ? 
        ORDER BY h.id DESC
      `).bind(Number(studentId)).all();
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
    
    if (type === 'year_summary') {
      const yearId = toNumber(url.searchParams.get('yearId'));
      
      // Totales generales del año
      const totals = await env.DB.prepare(`
        SELECT 
          (
            SELECT COUNT(DISTINCT id) FROM (
              SELECT a.id FROM alumnos a WHERE a.estado = 1 AND a.course_id IN (SELECT id FROM cursos WHERE year_id = ?)
              UNION
              SELECT h.alumno_id FROM historial_escolar h WHERE h.course_id IN (SELECT id FROM cursos WHERE year_id = ?)
            )
          ) as active,
          (SELECT COUNT(*) FROM pases WHERE course_id_origen IN (SELECT id FROM cursos WHERE year_id = ?)) as pases,
          (SELECT COUNT(*) FROM historial_escolar WHERE course_id IN (SELECT id FROM cursos WHERE year_id = ?) AND UPPER(estado_final) LIKE '%REPITENTE%') as repeaters,
          (SELECT COUNT(*) FROM historial_escolar WHERE course_id IN (SELECT id FROM cursos WHERE year_id = ?) AND UPPER(estado_final) LIKE '%PROMOVIDO%') as promoted,
          (SELECT COUNT(*) FROM historial_escolar WHERE course_id IN (SELECT id FROM cursos WHERE year_id = ?) AND UPPER(estado_final) LIKE '%PROMOCIONADO%') as promoted_with_debt,
          (SELECT COUNT(*) FROM historial_escolar WHERE course_id IN (SELECT id FROM cursos WHERE year_id = ?) AND UPPER(estado_final) LIKE '%RECIBIDO%') as graduated_ok,
          (SELECT COUNT(*) FROM historial_escolar WHERE course_id IN (SELECT id FROM cursos WHERE year_id = ?) AND UPPER(estado_final) LIKE '%EGRESADO%' AND UPPER(estado_final) NOT LIKE '%RECIBIDO%') as graduated_debt
      `).bind(yearId, yearId, yearId, yearId, yearId, yearId, yearId, yearId).first();

      // Detalles por curso
      const courses = await env.DB.prepare(`
        SELECT 
          c.id,
          (c.ano || ' ' || c.division || ' ' || c.turno) as label,
          t.nombre as tecnicatura,
          (
            SELECT COUNT(DISTINCT al.id) 
            FROM alumnos al 
            WHERE al.course_id = c.id AND al.estado = 1 AND UPPER(COALESCE(al.genero, '')) = 'MASCULINO'
          ) + (
            SELECT COUNT(DISTINCT h.alumno_id) 
            FROM historial_escolar h 
            JOIN alumnos al ON h.alumno_id = al.id
            WHERE h.course_id = c.id AND UPPER(COALESCE(al.genero, '')) = 'MASCULINO'
          ) as males,
          (
            SELECT COUNT(DISTINCT al.id) 
            FROM alumnos al 
            WHERE al.course_id = c.id AND al.estado = 1 AND UPPER(COALESCE(al.genero, '')) = 'FEMENINO'
          ) + (
            SELECT COUNT(DISTINCT h.alumno_id) 
            FROM historial_escolar h 
            JOIN alumnos al ON h.alumno_id = al.id
            WHERE h.course_id = c.id AND UPPER(COALESCE(al.genero, '')) = 'FEMENINO'
          ) as females,
          (
            SELECT COUNT(DISTINCT id) FROM (
              SELECT al.id FROM alumnos al WHERE al.course_id = c.id AND al.estado = 1
              UNION
              SELECT h.alumno_id FROM historial_escolar h WHERE h.course_id = c.id
            )
          ) as total_students,
          (
            SELECT COUNT(DISTINCT h.alumno_id) 
            FROM historial_escolar h 
            WHERE h.course_id = c.id
            AND UPPER(h.estado_final) LIKE '%REPITENTE%'
          ) as repeaters,
          (
            SELECT COUNT(DISTINCT h.alumno_id) 
            FROM historial_escolar h 
            WHERE h.course_id = c.id
            AND UPPER(h.estado_final) LIKE '%PROMOVIDO%'
          ) as promoted,
          (
            SELECT COUNT(DISTINCT h.alumno_id) 
            FROM historial_escolar h 
            WHERE h.course_id = c.id
            AND UPPER(h.estado_final) LIKE '%PROMOCIONADO%'
          ) as promoted_with_debt,
          (
            SELECT COUNT(DISTINCT h.alumno_id) 
            FROM historial_escolar h 
            WHERE h.course_id = c.id
            AND UPPER(h.estado_final) LIKE '%RECIBIDO%'
          ) as graduated_ok,
          (
            SELECT COUNT(DISTINCT h.alumno_id) 
            FROM historial_escolar h 
            WHERE h.course_id = c.id
            AND UPPER(h.estado_final) LIKE '%EGRESADO%' 
            AND UPPER(h.estado_final) NOT LIKE '%RECIBIDO%'
          ) as graduated_debt
        FROM cursos c
        JOIN tecnicaturas t ON c.tecnicatura_id = t.id
        WHERE c.year_id = ?
        GROUP BY c.id, c.ano, c.division, c.turno, t.nombre
        ORDER BY c.ano, c.division
      `).bind(yearId).all();

      return json({ totals, courses: courses.results });
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
    if (type === 'self_password') return await handleSelfPasswordChange(env, request, userId, body);
    if (type === 'acknowledge_security') return await handleAcknowledgeSecurity(env, request, userId);
    
    return json({ error: 'Tipo no soportado' }, 400);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
}
