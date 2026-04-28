import { validateUser, json, logHistory, toNumber, SYSTEM_VERSION } from "../_helpers.js";
import { hashPassword } from "../_utils.js";

export async function handleUsers(env, request, userId, body) {
  await validateUser(env, request, userId, 'admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector');
  const { action, targetUserId, nombre, username, password, rol, preceptor_course_id, professor_course_ids = [], is_professor_hybrid = 0 } = body;

  if (action === 'delete') {
    if (!targetUserId) throw new Error('ID de usuario requerido');
    if (userId === Number(targetUserId)) throw new Error('No puedes eliminarte a ti mismo.');
    await env.DB.prepare('DELETE FROM usuarios WHERE id = ?').bind(targetUserId).run();
    return json({ success: true });
  }

  const highLevelRoles = ['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'];
  const isHighLevel = highLevelRoles.includes(rol);
  const cleanPreceptorCourseId = isHighLevel ? null : (preceptor_course_id || null);
  const cleanProfessorCourseIds = isHighLevel ? '' : (Array.isArray(professor_course_ids) ? professor_course_ids.join(',') : professor_course_ids || '');
  const cleanIsHybrid = isHighLevel ? 0 : (is_professor_hybrid ? 1 : 0);

  if (action === 'update') {
    const hashedPass = password ? hashPassword(password) : null;
    if (isHighLevel) {
      if (password) {
        await env.DB.prepare(
          `UPDATE usuarios SET nombre = ?, username = ?, password = ?, rol = ?, preceptor_course_id = ?, 
           professor_course_ids = ?, professor_subject_ids = ?, is_professor_hybrid = ?
           WHERE id = ?`
        ).bind(nombre, username, hashedPass, rol, null, '', '', 0, targetUserId).run();
      } else {
        await env.DB.prepare(
          `UPDATE usuarios SET nombre = ?, username = ?, rol = ?, preceptor_course_id = ?, 
           professor_course_ids = ?, professor_subject_ids = ?, is_professor_hybrid = ?
           WHERE id = ?`
        ).bind(nombre, username, rol, null, '', '', 0, targetUserId).run();
      }
    } else {
      if (password) {
        await env.DB.prepare(
          `UPDATE usuarios SET nombre = ?, username = ?, password = ?, rol = ?, preceptor_course_id = ?, 
           professor_course_ids = ?, is_professor_hybrid = ?, reset_by_admin = 1
           WHERE id = ?`
        ).bind(nombre, username, hashedPass, rol, cleanPreceptorCourseId, cleanProfessorCourseIds, cleanIsHybrid, targetUserId).run();
      } else {
        await env.DB.prepare(
          `UPDATE usuarios SET nombre = ?, username = ?, rol = ?, preceptor_course_id = ?, 
           professor_course_ids = ?, is_professor_hybrid = ?
           WHERE id = ?`
        ).bind(nombre, username, rol, cleanPreceptorCourseId, cleanProfessorCourseIds, cleanIsHybrid, targetUserId).run();
      }
    }
    await logHistory(env, userId, null, 'gestion_usuarios', `Usuario actualizado: ${nombre} (Rol: ${rol})`);
    return json({ success: true });
  }

  if (action === 'reset_password') {
    const { newPassword } = body;
    if (!newPassword) throw new Error('Nueva contraseña requerida');
    const hashed = hashPassword(newPassword);
    await env.DB.prepare('UPDATE usuarios SET password = ?, security_acknowledged = 0, reset_by_admin = 1 WHERE id = ?').bind(hashed, targetUserId).run();
    await logHistory(env, userId, null, 'gestion_usuarios', `Contraseña reseteada para usuario ID: ${targetUserId}`);
    return json({ success: true });
  }

  if (action === 'create') {
    const existing = await env.DB.prepare('SELECT id FROM usuarios WHERE username = ?').bind(username).first();
    if (existing) {
      throw new Error(`El usuario que esta intentando crear ya existe: ${username}`);
    }
  }

  const hashedPass = hashPassword(password);
  await env.DB.prepare(
    `INSERT INTO usuarios (nombre, username, password, rol, preceptor_course_id, professor_course_ids, professor_subject_ids, is_professor_hybrid, reset_by_admin)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`
  ).bind(nombre, username, hashedPass, rol, cleanPreceptorCourseId, cleanProfessorCourseIds, '', cleanIsHybrid).run();
  await logHistory(env, userId, null, 'gestion_usuarios', `Usuario creado: ${nombre} (${username}) con rol ${rol}`);
  return json({ success: true });
}

export async function handleConfig(env, request, userId, body) {
  await validateUser(env, request, userId, 'admin', 'secretaria_de_alumnos', 'director', 'vicedirector', 'regente_profesores');
  const { action, valor, periodos = [] } = body;

  const updateAjuste = async (clave, v) => {
    await env.DB.prepare('INSERT OR REPLACE INTO ajustes (clave, valor) VALUES (?, ?)').bind(clave, v).run();
    return json({ success: true });
  };

  if (action === 'update_mode') return updateAjuste('period_view_mode', valor);
  if (action === 'update_mobile') return updateAjuste('mobile_login_enabled', valor);
  if (action === 'update_rac_modular') return updateAjuste('rac_modular_enabled', valor);
  if (action === 'update_password_msg') return updateAjuste('password_not_set_msg', valor);
  if (action === 'update_preceptor_mode') {
    const { role, mode } = body;
    return updateAjuste(`${role}_mode`, mode);
  }
  if (action === 'update_periods') {
    const statements = periodos.map(p => env.DB.prepare('UPDATE periodos SET activo = ? WHERE id = ?').bind(p.activo ? 1 : 0, p.id));
    await env.DB.batch(statements);
    return json({ success: true });
  }
  return json({ error: 'Accion no soportada' }, 400);
}

export async function handleAnuncios(env, request, userId, body) {
  await validateUser(env, request, userId, 'admin', 'secretaria_de_alumnos', 'director', 'vicedirector');
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

export async function handleHistorialDelete(env, request, userId, body) {
  await validateUser(env, request, userId, 'admin', 'jefe_de_auxiliares');
  const { action, logId, courseId } = body;
  if (action === 'delete_all') {
    await env.DB.prepare('DELETE FROM historial WHERE course_id = ?').bind(courseId).run();
    await logHistory(env, userId, courseId, 'historial_clear', 'El administrador vació todo el historial de este curso.');
    return json({ success: true });
  }
  if (action === 'delete_one') {
    await env.DB.prepare('DELETE FROM historial WHERE id = ?').bind(logId).run();
    return json({ success: true });
  }
  return json({ error: 'Acción no soportada' }, 400);
}

export async function handleEndCycle(env, request, userId, body) {
  const user = await validateUser(env, request, userId, 'admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares');
  const { students = [], isRepeater, targetCourseId, cycleName } = body;
  const sIds = students.map(s => s.id);
  if (sIds.length === 0) return json({ success: true });

  const [allDataRes, allGradesRes] = await Promise.all([
    env.DB.prepare(`SELECT a.*, c.ano, c.division, c.turno, t.nombre as tec_nombre FROM alumnos a JOIN cursos c ON c.id = a.course_id JOIN tecnicaturas t ON t.id = c.tecnicatura_id WHERE a.id IN (${sIds.map(() => '?').join(',')})`).bind(...sIds).all(),
    env.DB.prepare(`SELECT g.alumno_id, m.id as materia_id, m.nombre as materia, g.valor_t as definitiva FROM calificaciones g JOIN materias m ON m.id = g.materia_id WHERE g.alumno_id IN (${sIds.map(() => '?').join(',')}) AND g.periodo_id = 10`).bind(...sIds).all()
  ]);

  const dataMap = allDataRes.results.reduce((acc, d) => ({ ...acc, [d.id]: d }), {});
  const gradesByStudent = allGradesRes.results.reduce((acc, g) => { if (!acc[g.alumno_id]) acc[g.alumno_id] = []; acc[g.alumno_id].push(g); return acc; }, {});

  const statements = [];
  for (const s of students) {
    const data = dataMap[s.id];
    if (!data) continue;
    const grades = gradesByStudent[s.id] || [];
    statements.push(env.DB.prepare('INSERT INTO historial_escolar (alumno_id, curso_label, tecnicatura_nombre, ciclo_lectivo_nombre, boletin_data) VALUES (?, ?, ?, ?, ?)').bind(s.id, `${data.ano} ${data.division}`, data.tec_nombre, cycleName, JSON.stringify(grades)));
    for (const g of grades) {
      const val = g.definitiva ? Number(String(g.definitiva).replace(',', '.')) : 0;
      if (val < 7) statements.push(env.DB.prepare('INSERT INTO previas (alumno_id, materia_id, materia_nombre_custom, curso_ano, estado) VALUES (?, ?, ?, ?, "pendiente")').bind(s.id, g.materia_id, null, `${data.ano} ${data.division} (${cycleName})`));
    }
    const obs = (data.observaciones ? data.observaciones + "\n" : "") + (isRepeater ? `REPITENTE ${cycleName}` : `PASO DE AÑO ${cycleName}`) + ` del curso ${data.ano} ${data.division}`;
    statements.push(env.DB.prepare('UPDATE alumnos SET observaciones = ?, course_id = ? WHERE id = ?').bind(obs, targetCourseId, s.id));
    statements.push(env.DB.prepare('DELETE FROM calificaciones WHERE alumno_id = ?').bind(s.id));
  }
  if (statements.length) await env.DB.batch(statements);
  return json({ success: true });
}

export async function handleSelfPasswordChange(env, request, userId, body) {
  // Solo validamos que el usuario esté autenticado y que sea su propio ID
  const payload = await validateUser(env, request, userId);
  const { newPassword } = body;
  
  if (!newPassword || newPassword.length < 4) {
    throw new Error('La nueva contraseña debe tener al menos 4 caracteres.');
  }

  const hashed = hashPassword(newPassword);
  await env.DB.prepare('UPDATE usuarios SET password = ?, security_acknowledged = 1, reset_by_admin = 0 WHERE id = ?').bind(hashed, userId).run();
  
  await logHistory(env, userId, null, 'gestion_usuarios', `Cambio de contraseña propio (usuario ID: ${userId})`);
  
  return json({ success: true });
}

export async function handleAcknowledgeSecurity(env, request, userId) {
  await validateUser(env, request, userId);
  await env.DB.prepare('UPDATE usuarios SET security_acknowledged = 1, reset_by_admin = 0 WHERE id = ?').bind(userId).run();
  return json({ success: true });
}
