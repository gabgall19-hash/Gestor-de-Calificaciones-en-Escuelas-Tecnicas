import { draftTec, emptyUser, findDuplicateSubjectNames } from '../functions/PreceptorHelpers';

function normalizeTecMaterias(materias) {
  return materias.filter((materia) => materia.nombre.trim()).map((materia) => {
    let tipo = materia.tipo;
    let es_taller = 0;
    if (materia.tipo === 'taller') {
      tipo = 'comun';
      es_taller = 1;
    } else if (materia.tipo === 'taller_modular') {
      tipo = 'modular';
      es_taller = 1;
    } else if (materia.tipo === 'modular') {
      tipo = 'modular';
      es_taller = 0;
    }
    return { ...materia, tipo, es_taller };
  });
}

function validateTecPayload(tecForm, showToast) {
  const nombre = String(tecForm?.nombre || '').trim();
  const materias = normalizeTecMaterias(Array.isArray(tecForm?.materias) ? tecForm.materias : []);

  if (!nombre) {
    showToast('La tecnicatura debe tener un nombre.', 'error');
    return null;
  }

  if (!materias.length) {
    showToast('Agrega al menos una materia antes de guardar la tecnicatura.', 'error');
    return null;
  }

  const duplicates = findDuplicateSubjectNames(materias);
  if (duplicates.length) {
    showToast(`Hay materias duplicadas o casi idénticas: ${duplicates.join(', ')}`, 'error');
    return null;
  }

  return materias;
}

export default function usePreceptorAdminActions(deps) {
  const {
    data,
    post,
    courseForm,
    editingCourseId,
    setEditingCourseId,
    setCourseForm,
    selectedCourseId,
    selectedYearId,
    loadData,
    setPage,
    yearForm,
    setYearForm,
    showToast,
    userForm,
    setUserForm,
    editingUserId,
    setEditingUserId,
    tecForm,
    setTecForm,
    setTecMode,
    setEditingTecId,
    editingTecId,
    setStatus,
    setLoading
  } = deps;

  const prepareEditCourse = (course) => {
    setEditingCourseId(course.id);
    setCourseForm({ year_id: String(course.year_id), ano: course.ano, division: course.division, turno: course.turno, tecnicatura_id: String(course.tecnicatura_id) });
  };

  const editCourse = async (e) => {
    e.preventDefault();
    await post('courses', { action: 'update', courseId: editingCourseId, ...courseForm, year_id: Number(courseForm.year_id), tecnicatura_id: Number(courseForm.tecnicatura_id) });
    setEditingCourseId(null);
    showToast('Curso actualizado', 'success');
    await loadData(selectedCourseId, selectedYearId);
  };

  const toggleCourseActive = async (course) => {
    const newState = !course.activo;
    const actionLabel = newState ? 'habilitar' : 'deshabilitar';
    if (!window.confirm(`Â¿Seguro que deseas ${actionLabel} el curso ${course.label}?`)) return;
    await post('courses', { action: 'toggle_active', courseId: course.id, activo: newState });
    showToast(`Curso ${newState ? 'habilitado' : 'deshabilitado'}`, 'success');
    await loadData(null, selectedYearId);
  };

  const addCourse = async (e) => {
    e.preventDefault();
    const json = await post('courses', { action: 'create', ...courseForm, year_id: Number(courseForm.year_id), tecnicatura_id: Number(courseForm.tecnicatura_id) });
    showToast('Curso agregado', 'success');
    await loadData(json.course.id, Number(courseForm.year_id));
    setPage('grades');
  };

  const addYear = async (e) => {
    e.preventDefault();
    const json = await post('years', yearForm);
    setYearForm({ nombre: '' });
    showToast('AÃ±o lectivo agregado', 'success');
    await loadData(null, json.year.id);
  };

  const editYear = async (yearId, newName) => {
    if (!newName) return;
    await post('years', { action: 'update', yearId, nombre: newName });
    showToast('AÃ±o lectivo actualizado', 'success');
    await loadData(selectedCourseId, selectedYearId);
  };

  const deleteYear = async (year) => {
    if (!window.confirm(`Â¿Seguro que deseas eliminar el aÃ±o ${year.nombre}? Esto podrÃ­a romper vÃ­nculos con cursos existentes.`)) return;
    await post('years', { action: 'delete', yearId: year.id });
    showToast('AÃ±o lectivo eliminado', 'success');
    await loadData(selectedCourseId, null);
  };

  const createUser = async (e) => {
    e.preventDefault();
    const payload = {
      ...userForm,
      preceptor_course_id: ['preceptor', 'preceptor_taller', 'preceptor_ef'].includes(userForm.rol) ? Number(userForm.preceptor_course_id) : null,
      professor_course_ids: Array.isArray(userForm.professor_course_ids) ? userForm.professor_course_ids : [],
      professor_subject_ids: Array.isArray(userForm.professor_subject_ids) ? userForm.professor_subject_ids : [],
      is_professor_hybrid: !!userForm.is_professor_hybrid
    };
    await post('users', { action: 'create', ...payload });
    setUserForm(emptyUser);
    setEditingUserId(null);
    showToast('Usuario agregado', 'success');
    await loadData(selectedCourseId, selectedYearId);
  };

  const editUser = async (e) => {
    e.preventDefault();
    const payload = {
      ...userForm,
      preceptor_course_id: ['preceptor', 'preceptor_taller', 'preceptor_ef'].includes(userForm.rol) ? Number(userForm.preceptor_course_id) : null,
      professor_course_ids: Array.isArray(userForm.professor_course_ids) ? userForm.professor_course_ids : [],
      professor_subject_ids: Array.isArray(userForm.professor_subject_ids) ? userForm.professor_subject_ids : [],
      is_professor_hybrid: !!userForm.is_professor_hybrid
    };
    await post('users', { action: 'update', targetUserId: editingUserId, ...payload });
    setEditingUserId(null);
    setUserForm(emptyUser);
    setStatus('Usuario actualizado');
    await loadData(selectedCourseId, selectedYearId);
  };

  const startEditUser = (userRow) => {
    setEditingUserId(userRow.id);
    setUserForm({
      id: userRow.id,
      nombre: userRow.nombre,
      username: userRow.username,
      password: userRow.password,
      rol: userRow.rol,
      preceptor_course_id: userRow.preceptor_course_id,
      is_professor_hybrid: !!userRow.is_professor_hybrid,
      professor_course_ids: String(userRow.professor_course_ids || '').split(',').filter(Boolean).map(Number),
      professor_subject_ids: String(userRow.professor_subject_ids || '').split(',').filter(Boolean)
    });
    setPage('settings');
  };

  const deleteUser = async (userRow) => {
    if (!window.confirm(`Â¿Seguro que deseas eliminar al usuario ${userRow.nombre}?`)) return;
    await post('users', { action: 'delete', targetUserId: userRow.id });
    setStatus('Usuario eliminado');
    await loadData(selectedCourseId, selectedYearId);
  };

  const handleResetPassword = async (targetUserId, newPassword) => {
    try {
      await post('users', { action: 'reset_password', targetUserId, newPassword });
      showToast('ContraseÃ±a actualizada correctamente', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const setYearAsCurrent = async (yearId) => {
    try {
      await post('years', { action: 'set_current', yearId });
      showToast('AÃ±o marcado como actual', 'success');
      await loadData(selectedCourseId, selectedYearId);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const copyYearInfo = async (fromYearId, toYearId, targetUserId = null) => {
    try {
      setLoading(true);
      await post('years', { action: 'copy_roles', fromYearId, toYearId, targetUserId });
      showToast('InformaciÃ³n copiada correctamente', 'success');
      await loadData(selectedCourseId, toYearId);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const startCreateTec = () => {
    setTecMode('create');
    setTecForm({ nombre: '', materias: [{ id: `draft-${Date.now()}`, nombre: '', tipo: 'comun' }] });
  };

  const startEditTec = (tecId) => {
    const tec = data.tecnicaturas.find((item) => item.id === tecId);
    const subjects = data.allSubjects.filter((subject) => subject.tecnicatura_id === tecId);
    setEditingTecId(String(tecId));
    setTecForm(draftTec(tec, subjects));
    setTecMode('edit');
  };

  const addTec = async (e) => {
    e.preventDefault();
    const materias = validateTecPayload(tecForm, showToast);
    if (!materias) return;
    await post('tecnicaturas', { action: 'create', nombre: tecForm.nombre.trim(), detalle: tecForm.detalle, materias });
    setTecMode('list');
    setStatus('Tecnicatura creada');
    await loadData(selectedCourseId, selectedYearId);
  };

  const editTec = async (e) => {
    e.preventDefault();
    const materias = validateTecPayload(tecForm, showToast);
    if (!materias) return;
    await post('tecnicaturas', {
      action: 'update',
      tecnicaturaId: Number(editingTecId),
      nombre: tecForm.nombre.trim(),
      detalle: tecForm.detalle,
      materias
    });
    setTecMode('list');
    setStatus('Tecnicatura actualizada');
    await loadData(selectedCourseId, selectedYearId);
  };

  const removeTec = async (tec) => {
    if (!window.confirm(`Â¿Estas seguro de eliminar la tecnicatura ${tec.nombre}?`)) return;
    await post('tecnicaturas', { action: 'delete', tecnicaturaId: tec.id });
    setTecMode('list');
    setStatus('Tecnicatura eliminada');
    await loadData(selectedCourseId, selectedYearId);
  };

  const duplicateTec = async (tecId) => {
    const tec = data.tecnicaturas.find((item) => item.id === tecId);
    const subjects = data.allSubjects.filter((subject) => subject.tecnicatura_id === tecId);
    await post('tecnicaturas', {
      action: 'create',
      nombre: `${tec.nombre} (Copia)`,
      detalle: tec.detalle,
      materias: subjects.map((subject) => ({ nombre: subject.nombre, tipo: subject.tipo, es_taller: subject.es_taller }))
    });
    showToast('Tecnicatura duplicada', 'success');
    await loadData(selectedCourseId, selectedYearId);
  };

  return {
    prepareEditCourse,
    editCourse,
    toggleCourseActive,
    addCourse,
    addYear,
    editYear,
    deleteYear,
    createUser,
    editUser,
    startEditUser,
    deleteUser,
    handleResetPassword,
    setYearAsCurrent,
    copyYearInfo,
    startCreateTec,
    startEditTec,
    addTec,
    editTec,
    removeTec,
    duplicateTec
  };
}
