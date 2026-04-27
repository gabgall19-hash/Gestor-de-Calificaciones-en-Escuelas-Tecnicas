import { toNumber, toTitleCase, validateUser, logHistory, json } from "../_helpers.js";

export async function handleStudents(env, request, userId, body) {
  const currentUser = await validateUser(env, request, userId, 'admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'preceptor');
  const { action, nombre, apellido, dni, course_id, studentId } = body;

  // Fetch up-to-date user record from DB
  const user = (await env.DB.prepare('SELECT * FROM usuarios WHERE id = ?').bind(userId).first()) || currentUser;

  if (user.rol === 'preceptor') {
    let courseToCheck = null;
    if (action === 'create') {
      courseToCheck = Number(course_id);
    } else if (studentId) {
      const current = await env.DB.prepare('SELECT course_id FROM alumnos WHERE id = ?').bind(studentId).first();
      courseToCheck = current?.course_id;
    }

    if (courseToCheck && Number(user.preceptor_course_id) !== courseToCheck) {
      throw new Error('No tienes permisos para gestionar alumnos fuera de tu curso asignado.');
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

    await logHistory(env, userId, course_id, 'alta_alumno', `Alta de nuevo alumno: ${finalApellido}, ${finalNombre}`);
    return json({ success: true });
  }

  if (action === 'delete') {
    await validateUser(env, request, userId, 'admin', 'jefe_de_auxiliares', 'director', 'vicedirector');
    const student = await env.DB.prepare('SELECT apellido, nombre, course_id FROM alumnos WHERE id = ?').bind(studentId).first();
    await env.DB.prepare('DELETE FROM calificaciones WHERE alumno_id = ?').bind(studentId).run();
    await env.DB.prepare('DELETE FROM pases WHERE alumno_id = ?').bind(studentId).run();
    await env.DB.prepare('DELETE FROM previas WHERE alumno_id = ?').bind(studentId).run();
    await env.DB.prepare('DELETE FROM historial WHERE alumno_id = ?').bind(studentId).run();
    await env.DB.prepare('DELETE FROM alumnos WHERE id = ?').bind(studentId).run();
    if (student) {
      await logHistory(env, userId, student.course_id, 'baja_alumno', `Eliminación permanente del alumno: ${student.apellido}, ${student.nombre}`);
    }
    return json({ success: true });
  }

  if (action === 'updateRotation') {
    const { rotations } = body;
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
    const student = await env.DB.prepare('SELECT course_id FROM alumnos WHERE id = ?').bind(studentId).first();
    if (!student) throw new Error('Alumno no encontrado');
    if (user.rol !== 'admin' && user.rol !== 'secretaria_de_alumnos' && user.rol !== 'jefe_de_auxiliares' && user.rol !== 'director' && user.rol !== 'vicedirector') {
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
    const noAsiste = !!body.noAsiste;
    const finalInstitucion = noAsiste ? 'NUNCA ASISTIO' : body.institucion;
    const finalEstado = noAsiste ? 'NUNCA ASISTIO' : 'En Proceso de Pase';
    const finalMotivo = body.motivo?.trim() || '...';
    await env.DB.prepare(
      `INSERT INTO pases (alumno_id, nombre_apellido, dni, institucion_destino, fecha_pase, motivo, course_id_origen, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(studentId, `${student.apellido}, ${student.nombre}`, student.dni, finalInstitucion, body.fecha, finalMotivo, student.course_id, finalEstado).run();
    const marker = noAsiste ? "**NUNCA ASISTIO**" : "**DADO DE PASE**";
    const lines = (student.observaciones || "").split("\n").filter(l => !l.startsWith("**DADO DE PASE**") && !l.startsWith("**NUNCA ASISTIO**"));
    lines.push(`${marker} en ${finalInstitucion} en la Fecha: ${body.fecha}. Motivo: ${finalMotivo}`);
    await env.DB.prepare('UPDATE alumnos SET course_id = NULL, estado = 0, observaciones = ? WHERE id = ?').bind(lines.join("\n").trim(), studentId).run();
    await logHistory(env, userId, student.course_id, 'pase_alumno', `${student.apellido}, ${student.nombre} ha sido dado de pase (${finalEstado}).`, studentId);
    return json({ success: true });
  }

  if (action === 'transfer') {
    if (user.rol !== 'admin' && user.rol !== 'secretaria_de_alumnos' && user.rol !== 'preceptor' && user.rol !== 'preceptor_taller' && user.rol !== 'jefe_de_auxiliares' && user.rol !== 'director' && user.rol !== 'vicedirector') {
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
    await env.DB.prepare('DELETE FROM calificaciones WHERE alumno_id = ?').bind(studentId).run();
    await env.DB.prepare('UPDATE alumnos SET course_id = ? WHERE id = ?').bind(body.course_id, studentId).run();
    const finalMotivo = body.motivo?.trim() || '...';
    const log = `Alumno transferido de (${student.old_course_label}) a (${targetCourse.new_course_label}) debido a: ${finalMotivo}`;
    const newObs = (student.observaciones ? student.observaciones + "\n" : "") + log;
    await env.DB.prepare('UPDATE alumnos SET observaciones = ? WHERE id = ?').bind(newObs, studentId).run();
    await logHistory(env, userId, student.course_id, 'transferencia_salida', `${student.apellido}, ${student.nombre} ha sido transferido a ${targetCourse.new_course_label}.`, studentId);
    await logHistory(env, userId, body.course_id, 'transferencia_entrada', `${student.apellido}, ${student.nombre} ha ingresado al curso debido a ${finalMotivo}.`, studentId);
    return json({ success: true });
  }

  if (action === 'update_pase') {
    if (user.rol !== 'admin' && user.rol !== 'secretaria_de_alumnos' && user.rol !== 'jefe_de_auxiliares' && user.rol !== 'director' && user.rol !== 'vicedirector') throw new Error('Permiso denegado.');
    const { id, course_id_origen, institucion_destino, fecha_pase, motivo, estado } = body;
    await env.DB.prepare(
      `UPDATE pases SET course_id_origen = ?, institucion_destino = ?, fecha_pase = ?, motivo = ?, estado = ? WHERE id = ?`
    ).bind(course_id_origen ?? null, institucion_destino ?? '', fecha_pase ?? '', motivo?.trim() || '...', estado ?? 'De pase', id).run();
    return json({ success: true });
  }

  if (action === 'undo_pase') {
    if (user.rol !== 'admin' && user.rol !== 'secretaria_de_alumnos' && user.rol !== 'jefe_de_auxiliares') throw new Error('Solo el personal administrativo puede deshacer pases.');
    const { paseId } = body;
    const pase = await env.DB.prepare('SELECT alumno_id, course_id_origen FROM pases WHERE id = ?').bind(paseId).first();
    if (pase) {
      const student = await env.DB.prepare('SELECT observaciones FROM alumnos WHERE id = ?').bind(pase.alumno_id).first();
      if (student) {
        const newObs = (student.observaciones || "").split("\n").filter(l => !l.startsWith("**DADO DE PASE**") && !l.startsWith("**NUNCA ASISTIO**")).join("\n").trim();
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

export async function handleStudentImages(env, request, userId, body) {
  await validateUser(env, request, userId, 'admin', 'preceptor', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector');
  const { action, id, alumno_id, titulo, url: imageUrl } = body;
  if (action === 'create') {
    await env.DB.prepare('INSERT INTO alumno_imagenes (alumno_id, titulo, url) VALUES (?, ?, ?)')
      .bind(alumno_id, titulo || 'Sin título', imageUrl).run();
  } else if (action === 'delete') {
    await env.DB.prepare('DELETE FROM alumno_imagenes WHERE id = ?').bind(id).run();
  }
  return json({ success: true });
}
