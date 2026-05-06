import { emptyStudent } from '../functions/PreceptorHelpers';
import { apiRequest, default as apiService } from '../functions/apiService';

export default function usePreceptorStudentActions(deps) {
  const {
    user,
    data,
    studentForm,
    setStudentForm,
    selectedCourseId,
    selectedYearId,
    setDniError,
    showToast,
    post,
    loadData,
    setStatus,
    transferMotivo,
    setTransferringAlumno,
    setTransferMotivo,
    pasingStudent,
    paseForm,
    setPasingStudent,
    editingPase,
    setEditingPase,
    setData,
    editingObsStudent,
    setEditingObsStudent,
    editingStudent,
    setEditingStudent,
    viewingFichaStudent,
    studentFormState,
    setIsEditingFicha,
    setViewingFichaStudent,
    setPage,
    setIsSelectionMode,
    selectedStudentIds,
    endCycleForm,
    setLoading,
    setSelectedStudentIds,
    setShowEndCycleModal
  } = deps;

  const addStudent = async (e) => {
    e.preventDefault();
    setDniError('');
    try {
      await post('students', { action: 'create', ...studentForm, course_id: selectedCourseId });
      setStudentForm(emptyStudent);
      showToast('Alumno agregado', 'success');
      await loadData(selectedCourseId, selectedYearId);
    } catch (err) {
      if (err.message.includes('DNI')) setDniError(err.message);
      else showToast(err.message, 'error');
    }
  };

  const deleteStudent = async (student) => {
    if (!['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'].includes(user.rol)) {
      showToast('No tienes permisos para eliminar alumnos.', 'error');
      return;
    }
    if (!window.confirm(`Â¿Estas seguro de eliminar permanentemente a ${student.apellido}, ${student.nombre}? Esta acciÃ³n NO se puede deshacer.`)) return;
    await post('students', { action: 'delete', studentId: student.id });
    showToast('Alumno eliminado', 'success');
    await loadData(selectedCourseId, selectedYearId);
  };

  const transferStudent = async (student) => {
    const options = (data.allCourses ?? []).filter((c) => c.id !== student.course_id).map((c) => `${c.id}: ${c.year_nombre} Â· ${c.label} Â· ${c.tecnicatura_nombre}`).join('\n');
    const to = window.prompt(`IngresÃ¡ el ID del curso destino para ${student.apellido}, ${student.nombre}:\n${options}`);
    if (!to || !window.confirm(`Â¿Estas seguro de transferir a ${student.apellido}, ${student.nombre}?`)) return;
    await post('students', { action: 'transfer', studentId: student.id, course_id: Number(to) });
    setStatus('Alumno transferido');
    await loadData(selectedCourseId, selectedYearId);
  };

  const execPase = async (e) => {
    e.preventDefault();
    await post('students', { action: 'dar_de_pase', studentId: pasingStudent.id, ...paseForm });
    setPasingStudent(null);
    showToast('Pase registrado', 'success');
    await loadData(selectedCourseId, selectedYearId);
  };

  const undoPase = async (paseId) => {
    if (!window.confirm('Â¿Seguro que deseas deshacer este pase y reactivar al alumno?')) return;
    await post('students', { action: 'undo_pase', paseId });
    showToast('Pase deshecho', 'success');
    await loadData(selectedCourseId, selectedYearId);
  };

  const execTransfer = async (alumnoId, targetCourseId) => {
    if (!targetCourseId) return;
    await post('students', { action: 'transfer', studentId: alumnoId, course_id: Number(targetCourseId), motivo: transferMotivo });
    setTransferringAlumno(null);
    setTransferMotivo('');
    showToast('Alumno transferido correctamente', 'success');
    await loadData(selectedCourseId, selectedYearId);
  };

  const savePaseEdit = async (e) => {
    e.preventDefault();
    await post('students', { action: 'update_pase', ...editingPase });
    setEditingPase(null);
    showToast('Pase actualizado', 'success');
    await loadData(selectedCourseId, selectedYearId);
  };

  const updateStudentField = async (student, field, value) => {
    setData((prev) => ({
      ...prev,
      students: prev.students?.map((s) => s.id === student.id ? { ...s, [field]: value } : s) || [],
      graduates: prev.graduates?.map((s) => s.id === student.id ? { ...s, [field]: value } : s) || []
    }));
    try {
      await post('students', { action: 'update', studentId: student.id, ...student, [field]: value });
    } catch {
      showToast('Error al actualizar datos del alumno', 'error');
    }
  };

  const saveObs = async (e) => {
    e.preventDefault();
    try {
      await post('students', { action: 'update', ...editingObsStudent });
      setEditingObsStudent(null);
      showToast('Observaciones guardadas correctamente', 'success');
      await loadData(selectedCourseId, selectedYearId);
    } catch (err) {
      showToast('Error al guardar observaciones: ' + err.message, 'error');
    }
  };

  const editStudent = async (e) => {
    e.preventDefault();
    setDniError('');
    try {
      await post('students', { action: 'update', studentId: editingStudent.id, ...editingStudent });
      setEditingStudent(null);
      showToast('Alumno actualizado', 'success');
      await loadData(selectedCourseId, selectedYearId);
    } catch (err) {
      if (err.message.includes('DNI')) setDniError(err.message);
      else showToast(err.message, 'error');
    }
  };

  const handleSaveFicha = async () => {
    try {
      await post('students', { action: 'update', studentId: viewingFichaStudent.id, ...studentFormState });
      setIsEditingFicha(false);
      showToast('Ficha de alumno actualizada correctamente', 'success');
      await loadData(selectedCourseId, selectedYearId);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSetPassword = async (student) => {
    const newPass = window.prompt(`Establecer contraseÃ±a de boletÃ­n para ${student.apellido}, ${student.nombre}:`, '');
    if (newPass === null) return;
    try {
      await post('students', { action: 'update_password', studentId: student.id, password: newPass });
      showToast('ContraseÃ±a de boletÃ­n actualizada', 'success');
      await loadData(selectedCourseId, selectedYearId);
    } catch (err) {
      showToast('Error al actualizar contraseÃ±a: ' + err.message, 'error');
    }
  };

  const startEndCycle = () => {
    setIsSelectionMode(true);
    setPage('students');
    showToast('Modo de selecciÃ³n masiva activado. Selecciona los alumnos para promover o repetir.', 'info');
  };

  const handleEndCycleConfirm = async () => {
    const selectedStudents = data.students.filter((s) => selectedStudentIds.includes(s.id));

    if (!endCycleForm.isRepeater) {
      const alerted = [];
      selectedStudents.forEach((student) => {
        const studentGrades = data.grades.filter((grade) => grade.alumno_id === student.id && grade.periodo_id === 10);
        const studentPrevias = data.previas.filter((previa) => previa.alumno_id === student.id && previa.estado === 'pendiente');
        const currentYearPrevias = data.subjects.filter((subject) => {
          const grade = studentGrades.find((item) => item.materia_id === subject.id);
          const val = grade ? Number(String(grade.valor_t).replace(',', '.')) : 0;
          return val < 7;
        }).length;
        const totalPrevias = currentYearPrevias + studentPrevias.length;
        if (totalPrevias >= 3) alerted.push(`${student.apellido} (${totalPrevias} previas)`);
      });

      if (alerted.length > 0 && !window.confirm(`ADVERTENCIA: Los siguientes alumnos tienen 3 o mÃ¡s materias previas:\n${alerted.join('\n')}\n\nÂ¿Desea hacer pasar a estos alumnos igualmente?`)) {
        return;
      }
    }

    let targetId = Number(endCycleForm.targetCourseId);
    const currentYear = data.academicYears.find((year) => year.id === selectedYearId);

    if (endCycleForm.isRepeater) {
      const nextYearName = String(Number(currentYear.nombre) + 1);
      const currentCourse = data.courses.find((course) => course.id === selectedCourseId);
      const targetCourse = data.allCourses.find((course) =>
        String(course.year_nombre) === nextYearName &&
        course.label === currentCourse.label &&
        course.tecnicatura_id === currentCourse.tecnicatura_id
      );

      if (!targetCourse) {
        showToast(`Error: No existe el curso ${currentCourse.label} en el ciclo ${nextYearName}. Por favor crÃ©alo en Configuraciones antes de procesar repitentes.`, 'error');
        setLoading(false);
        return;
      }
      targetId = targetCourse.id;
    }

    try {
      setLoading(true);
      await post('end_cycle', {
        students: selectedStudents,
        isRepeater: endCycleForm.isRepeater,
        targetCourseId: targetId,
        cycleName: currentYear?.nombre || 'Desconocido',
        egresadoTipo: endCycleForm.egresadoTipo
      });
      showToast('Proceso de fin de ciclo completado', 'success');
      setIsSelectionMode(false);
      setSelectedStudentIds([]);
      setShowEndCycleModal(false);
      await loadData(null, selectedYearId);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleViewFicha = (student) => {
    setViewingFichaStudent(student);
    setStudentForm({ ...emptyStudent, ...student });
    setIsEditingFicha(false);
  };

  const getHistorial = async (studentId) => {
    return await apiService.get('historial_escolar', { studentId });
  };

  return {
    addStudent,
    deleteStudent,
    transferStudent,
    execPase,
    undoPase,
    execTransfer,
    savePaseEdit,
    updateStudentField,
    saveObs,
    editStudent,
    handleSaveFicha,
    handleSetPassword,
    startEndCycle,
    handleEndCycleConfirm,
    handleViewFicha,
    getHistorial
  };
}
