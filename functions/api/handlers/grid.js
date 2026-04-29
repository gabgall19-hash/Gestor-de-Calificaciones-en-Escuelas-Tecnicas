import { toNumber, validateUser, json, SYSTEM_VERSION, HIGH_ROLES } from "../_helpers.js";


function simplifyTecName(name) {
  if (!name) return "";
  return name.replace("TECNICATURA EN", "TEC.").replace("TECNICO EN", "TEC.");
}

export async function handleGrid(env, request, url) {
  const userId = toNumber(url.searchParams.get('userId'));
  let courseId = toNumber(url.searchParams.get('courseId'));
  let yearId = toNumber(url.searchParams.get('yearId'));
  const includeAllStudents = url.searchParams.get('includeAllStudents') === 'true';

  const currentUser = await validateUser(env, request, userId);
  let userRecord = currentUser;
  
  if (!HIGH_ROLES.includes(currentUser.rol)) {
    const fromDb = await env.DB.prepare('SELECT * FROM usuarios WHERE id = ?').bind(userId).first();
    if (fromDb) userRecord = fromDb;
  }

  // 1. Fetch metadata needed to determine the final course and year
  const [yearsRes, allCoursesRes] = await Promise.all([
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
    `).all(),
    env.DB.prepare(`
      SELECT c.*, t.nombre AS tecnicatura_nombre, t.detalle AS tecnicatura_detalle, y.nombre AS year_nombre,
               COALESCE(u.nombre, '---') AS preceptor_nombre,
               COALESCE(stats.total, 0) as student_count,
               COALESCE(stats.female, 0) as female_count,
               COALESCE(stats.male, 0) as male_count
        FROM cursos c
        JOIN tecnicaturas t ON t.id = c.tecnicatura_id
        JOIN años_lectivos y ON y.id = c.year_id
        LEFT JOIN usuarios u ON u.preceptor_course_id = c.id AND u.rol = 'preceptor'
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
    `).all()
  ]);

  let years = yearsRes.results;
  if (!HIGH_ROLES.includes(userRecord.rol)) {
    years = years.filter(y => y.es_actual === 1);
    if (years.length === 0 && yearsRes.results.length > 0) years = [yearsRes.results[0]];
  }

  const selectedYear = years.find(y => y.id === yearId) ?? years.find(y => y.es_actual === 1) ?? years[0] ?? null;
  const finalYearId = selectedYear?.id ?? null;

  const allCoursesRaw = allCoursesRes.results;
  const allCoursesForYear = allCoursesRaw.filter(c => c.year_id === finalYearId).map(c => ({ ...c, label: `${c.ano} ${c.division} · ${c.turno}` }));
  
  let accessibleCourses = allCoursesForYear;
  if (!HIGH_ROLES.includes(userRecord.rol)) {
    const ids = (userRecord.professor_course_ids ?? '').split(',').map(Number).filter(Boolean);
    if (userRecord.professor_subject_ids) {
      userRecord.professor_subject_ids.split(',').filter(Boolean).forEach(pair => { const cId = Number(pair.split('-')[0]); if (!isNaN(cId)) ids.push(cId); });
    }
    if (userRecord.preceptor_course_id) ids.push(Number(userRecord.preceptor_course_id));
    const uniqueIds = [...new Set(ids)];
    accessibleCourses = allCoursesForYear.filter((c) => uniqueIds.includes(c.id));
  }

  const selectedCourse = accessibleCourses.find((c) => c.id === courseId) ?? accessibleCourses[0] ?? null;
  const finalCourseId = selectedCourse?.id ?? null;
  const selectedTecnicaturaId = selectedCourse?.tecnicatura_id ?? null;

  // 2. Now fetch all specific data for the determined year and course
  const statements = [
    env.DB.prepare('SELECT * FROM tecnicaturas ORDER BY nombre'),
    env.DB.prepare('SELECT id, nombre, tipo, es_taller, tecnicatura_id, num_rotacion, orden FROM materias ORDER BY orden, id'),
    env.DB.prepare('SELECT * FROM periodos ORDER BY id'),
    env.DB.prepare('SELECT * FROM ajustes'),
    env.DB.prepare('SELECT * FROM anuncios ORDER BY id DESC')
  ];

  const idx = {
    tecs: 0, subjects: 1, periods: 2, config: 3, anuncios: 4,
    pases: -1, users: -1, reportUsers: -1, students: -1, allStudents: -1, 
    locks: -1, grades: -1, previas: -1, historial: -1, graduates: -1
  };

  if (HIGH_ROLES.includes(userRecord.rol)) {
    idx.pases = statements.length;
    statements.push(env.DB.prepare(`SELECT p.*, (c.ano || ' ' || c.division || ' · ' || c.turno) as course_label, y.nombre as year_nombre FROM pases p LEFT JOIN cursos c ON c.id = p.course_id_origen LEFT JOIN años_lectivos y ON y.id = c.year_id ORDER BY p.id DESC`));
    idx.users = statements.length;
    statements.push(env.DB.prepare('SELECT id, nombre, username, rol, preceptor_course_id, professor_course_ids, professor_subject_ids, is_professor_hybrid FROM usuarios ORDER BY nombre'));
    if (includeAllStudents) {
      idx.allStudents = statements.length;
      statements.push(env.DB.prepare(`SELECT a.id, a.nombre, a.apellido, a.dni, a.course_id, a.observaciones, a.estado, a.genero, a.password, COALESCE(c.ano || ' ' || c.division || ' · ' || c.turno, 'Sin Curso') as course_label FROM alumnos a LEFT JOIN cursos c ON a.course_id = c.id ORDER BY a.apellido, a.nombre`));
    }
    // Fetch graduates for high roles
    if (['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'].includes(userRecord.rol)) {
      idx.graduates = statements.length;
      statements.push(env.DB.prepare(`SELECT id, nombre, apellido, dni, estado, egresado_tipo, ciclo_egreso, observaciones FROM alumnos WHERE estado = 2 ORDER BY ciclo_egreso DESC, apellido, nombre`));
    }
  } else {
    idx.reportUsers = statements.length;
    statements.push(env.DB.prepare("SELECT id, nombre, rol, professor_subject_ids, is_professor_hybrid FROM usuarios WHERE (rol = 'profesor' OR is_professor_hybrid = 1)"));
  }

  if (finalCourseId) {
    idx.students = statements.length;
    statements.push(env.DB.prepare(`SELECT a.*, c.ano, c.division, c.turno, c.year_id, c.tecnicatura_id, y.nombre AS year_nombre, t.nombre AS tecnicatura_nombre, (c.ano || ' ' || c.division || ' · ' || c.turno) AS course_label, rotacion FROM alumnos a JOIN cursos c ON c.id = a.course_id JOIN años_lectivos y ON y.id = c.year_id JOIN tecnicaturas t ON t.id = c.tecnicatura_id WHERE a.course_id = ? AND a.estado = 1 ORDER BY a.apellido, a.nombre`).bind(finalCourseId));
    idx.locks = statements.length;
    statements.push(env.DB.prepare('SELECT * FROM bloqueos_materias WHERE course_id = ?').bind(finalCourseId));
    idx.grades = statements.length;
    statements.push(env.DB.prepare('SELECT * FROM calificaciones WHERE alumno_id IN (SELECT id FROM alumnos WHERE course_id = ?)').bind(finalCourseId));
    idx.previas = statements.length;
    statements.push(env.DB.prepare(`SELECT p.*, m.nombre as materia_nombre FROM previas p LEFT JOIN materias m ON m.id = p.materia_id WHERE p.alumno_id IN (SELECT id FROM alumnos WHERE course_id = ?)`).bind(finalCourseId));
    idx.historial = statements.length;
    statements.push(env.DB.prepare(`SELECT h.*, u.nombre as usuario_nombre, u.rol as usuario_rol, a.apellido as alumno_apellido, a.nombre as alumno_nombre FROM historial h LEFT JOIN usuarios u ON u.id = h.usuario_id LEFT JOIN alumnos a ON a.id = h.alumno_id WHERE h.course_id = ? OR h.course_id IS NULL ORDER BY h.fecha DESC LIMIT 100`).bind(finalCourseId));
  }

  const results = await env.DB.batch(statements);

  const tecs = results[idx.tecs].results;
  const subjects = results[idx.subjects].results;
  const periods = results[idx.periods].results;
  const config = results[idx.config].results.reduce((acc, curr) => ({ ...acc, [curr.clave]: curr.valor }), {});
  const pases = idx.pases !== -1 ? results[idx.pases].results : [];
  const reportUsers = idx.reportUsers !== -1 ? results[idx.reportUsers].results : (idx.users !== -1 ? results[idx.users].results : []);
  const anuncios = results[idx.anuncios].results;

  const courseStudents = idx.students !== -1 ? results[idx.students].results : [];
  const locks = idx.locks !== -1 ? results[idx.locks].results : [];
  const grades = idx.grades !== -1 ? results[idx.grades].results : [];
  const previas = idx.previas !== -1 ? results[idx.previas].results : [];
  const historial = idx.historial !== -1 ? results[idx.historial].results : [];

  const visibleSubjects = subjects.filter(s => s.tecnicatura_id === selectedTecnicaturaId);

  return json({
    academicYears: years,
    tecnicaturas: tecs,
    allCourses: allCoursesForYear,
    courses: accessibleCourses,
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
    anuncios,
    graduates: idx.graduates !== -1 ? results[idx.graduates].results : [],
    selectedYearId: finalYearId,
    selectedCourseId: finalCourseId,
    selectedTecnicaturaId: selectedTecnicaturaId,
    selectedCourse: selectedCourse,
    version: SYSTEM_VERSION
  });

}
