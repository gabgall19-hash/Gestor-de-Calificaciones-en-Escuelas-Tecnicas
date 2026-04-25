import { verifyJWT } from "./_utils.js";

export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const dni = url.searchParams.get("dni");

  if (!dni) {
    return new Response(JSON.stringify({ error: "DNI requerido" }), { status: 400 });
  }

  try {
    // Buscar alumno con detalles del curso
    // Nota: Seleccionamos c.tecnicatura_id explícitamente porque no está en la tabla alumnos
    const alumno = await env.DB.prepare(`
      SELECT 
        a.id, a.nombre, a.apellido, a.dni, a.observaciones, a.estado, a.password,
        COALESCE(c.ano, hc.ano) as ano,
        COALESCE(c.division, hc.division) as division,
        COALESCE(c.turno, hc.turno) as turno,
        COALESCE(c.tecnicatura_id, hc.tecnicatura_id) as tecnicatura_id,
        COALESCE(t.nombre, ht.nombre) as tecnicatura_nombre, 
        COALESCE(y.nombre, hy.nombre) as year_nombre
      FROM alumnos a
      LEFT JOIN cursos c ON a.course_id = c.id
      LEFT JOIN tecnicaturas t ON c.tecnicatura_id = t.id
      LEFT JOIN años_lectivos y ON c.year_id = y.id
      LEFT JOIN (
        SELECT alumno_id, course_id_origen 
        FROM pases 
        WHERE id IN (SELECT MAX(id) FROM pases GROUP BY alumno_id)
      ) p ON p.alumno_id = a.id
      LEFT JOIN cursos hc ON p.course_id_origen = hc.id
      LEFT JOIN tecnicaturas ht ON hc.tecnicatura_id = ht.id
      LEFT JOIN años_lectivos hy ON hc.year_id = hy.id
      WHERE a.dni = ?
    `).bind(dni).first();

    if (!alumno) {
      return new Response(JSON.stringify({ error: "Alumno no encontrado. Verifique el DNI." }), { status: 404 });
    }

    const providedPassword = url.searchParams.get("password");
    const authHeader = request.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    const staffPayload = token ? await verifyJWT(token, env.JWT_SECRET || "default_secret_for_dev_only") : null;
    const isStaffRequest = !!staffPayload;

    // Batch queries to reduce round-trips
    const batchRes = await env.DB.batch([
      env.DB.prepare("SELECT institucion_destino, fecha_pase FROM pases WHERE alumno_id = ?").bind(alumno.id),
      env.DB.prepare(`
        SELECT g.*, m.nombre as materia_nombre, m.tipo as materia_tipo, p.nombre as periodo_nombre
        FROM calificaciones g
        JOIN materias m ON g.materia_id = m.id
        JOIN periodos p ON g.periodo_id = p.id
        WHERE g.alumno_id = ?
      `).bind(alumno.id),
      env.DB.prepare("SELECT * FROM ajustes"),
      env.DB.prepare("SELECT * FROM materias WHERE tecnicatura_id = ?").bind(alumno.tecnicatura_id),
      env.DB.prepare("SELECT * FROM periodos ORDER BY id"),
      env.DB.prepare(`
        SELECT p.*, m.nombre as materia_nombre
        FROM previas p
        LEFT JOIN materias m ON p.materia_id = m.id
        WHERE p.alumno_id = ?
        ORDER BY p.curso_ano DESC, p.id ASC
      `).bind(alumno.id)
    ]);

    const pase = batchRes[0].results[0];
    const grades = batchRes[1].results;
    const configRaw = batchRes[2].results;
    const all_subjects = batchRes[3].results;
    const periods_query = batchRes[4].results;
    const previas = batchRes[5].results;

    const configData = configRaw.reduce((acc, curr) => ({ ...acc, [curr.clave]: curr.valor }), {});
    const mode = configData.period_view_mode || 'full';

    // Lógica de validación de contraseña (Bypass si es staff)
    if (!isStaffRequest) {
      if (!alumno.password || alumno.password.trim() === "") {
        return new Response(JSON.stringify({ 
          error: "PASSWORD_NOT_SET",
          custom_message: configData['password_not_set_msg'] || null
        }), { status: 403 });
      }

      if (alumno.password !== providedPassword) {
        return new Response(JSON.stringify({ error: "Contraseña incorrecta." }), { status: 401 });
      }
    }

    // Aplicar lógica de filtrado de periodos según el MODO
    let visible_periods = periods_query;
    if (mode === 'orientadores') {
      visible_periods = visible_periods.filter(p => [1, 3, 5].includes(p.id));
    } else if (mode === 'manual') {
      visible_periods = visible_periods.filter(p => p.activo === 1);
    }

    return new Response(JSON.stringify({
      alumno,
      pase,
      grades,
      previas,
      config: {
        subjects: all_subjects,
        periodos: visible_periods,
        mode
      }
    }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Error interno: " + err.message }), { status: 500 });
  }
}
