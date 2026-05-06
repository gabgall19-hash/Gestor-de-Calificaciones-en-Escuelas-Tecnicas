import apiService from '../functions/apiService';
import { handlePrintAllCourses } from '../prints/Seguimiento_A4';
import { handlePrintSeguimientoGlobal } from '../prints/Seguimiento_AllGrades_A4';
import { handlePrintPlanillas_AllSubjects } from '../prints/Calificaciones_AllSubjects_A4';
import { handlePrintRAC_Student } from '../prints/RAC_Student_A4';
import { handlePrintRAC_AllStudents } from '../prints/RAC_AllStudents_A4';
import { handlePrintParteSemanal } from '../prints/ParteSemanal_A4';
import { handlePrintParteSemanal_AllGrades } from '../prints/ParteSemanal_AllGrades_A4';
import { handlePrintParteSemanal_AllWeek } from '../prints/ParteSemanal_AllWeek_A4';

export default function usePreceptorConfigActions(deps) {
  const {
    data,
    user,
    post,
    selectedCourseId,
    selectedYearId,
    loadData,
    setStatus,
    showToast,
    setLoading
  } = deps;

  const handleUpdateLocks = async (materiaId, periodoId, bloqueado, all = false) => {
    try {
      await post('bloqueos', { action: 'toggle', courseId: selectedCourseId, materiaId, periodoId, bloqueado, all });
      setStatus(all ? (bloqueado ? 'Curso bloqueado' : 'Curso desbloqueado') : (bloqueado ? 'Periodo bloqueado' : 'Periodo desbloqueado'));
      await loadData(selectedCourseId, selectedYearId);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateSystemMode = async (mode) => {
    try {
      await post('config', { action: 'update_mode', valor: mode });
      showToast('Modo de sistema actualizado', 'success');
      await loadData(selectedCourseId, selectedYearId);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateMobileLogin = async (enabled) => {
    try {
      await post('config', { action: 'update_mobile', valor: String(enabled) });
      showToast('ConfiguraciÃ³n de acceso mÃ³vil actualizada', 'success');
      await loadData(selectedCourseId, selectedYearId);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateRACModular = async (enabled) => {
    try {
      await post('config', { action: 'update_rac_modular', valor: String(enabled) });
      showToast('ConfiguraciÃ³n de RAC Modular actualizada', 'success');
      await loadData(selectedCourseId, selectedYearId);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdatePreceptorMode = async (role, mode) => {
    try {
      await post('config', { action: 'update_preceptor_mode', role, mode });
      showToast(`Modo de ${role} actualizado`, 'success');
      await loadData(selectedCourseId, selectedYearId);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdatePasswordMsg = async (msg) => {
    try {
      await post('config', { action: 'update_password_msg', valor: msg });
      showToast('Mensaje de contraseña actualizado', 'success');
      await loadData(selectedCourseId, selectedYearId);
    } catch (err) {
      alert(err.message);
    }
  };

  const savePrevias = async (previasArray, deletedIds = []) => {
    try {
      setLoading(true);
      // Perform deletions first
      if (deletedIds.length > 0) {
        for (const id of deletedIds) {
          await post('previas', { action: 'delete', id, userId: user.id });
        }
      }
      // Then perform updates/inserts
      await post('previas', { updates: previasArray, userId: user.id });
      
      showToast('Cambios guardados correctamente', 'success');
      await loadData(selectedCourseId, selectedYearId);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deletePrevia = async (previaId) => {
    try {
      await post('previas', { action: 'delete', id: previaId, userId: user.id });
      showToast('Previa eliminada', 'success');
      await loadData(selectedCourseId, selectedYearId);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdatePeriods = async (updatedPeriods) => {
    try {
      await post('config', { action: 'update_periods', periodos: updatedPeriods });
      setStatus('ConfiguraciÃ³n de perÃ­odos guardada');
      await loadData(selectedCourseId, selectedYearId);
    } catch (err) {
      alert(err.message);
    }
  };

  const onPrintAllCourses = () => handlePrintAllCourses(data);
  const onPrintSeguimientoGlobal = () => handlePrintSeguimientoGlobal(data, selectedYearId, user, setStatus);
  const onPrintPlanillasCurso = async () => {
    if (!selectedCourseId) return;
    setLoading(true);
    try {
      const scheduleRes = await apiService.get('horarios', { courseId: selectedCourseId, userId: user.id });
      handlePrintPlanillas_AllSubjects(data, selectedCourseId, scheduleRes);
    } catch (err) {
      console.error('Error fetching schedule for planillas:', err);
      // Fallback to existing data if schedule fails
      handlePrintPlanillas_AllSubjects(data, selectedCourseId);
    } finally {
      setLoading(false);
    }
  };

  const onPrintRAC_Student = (student) => handlePrintRAC_Student(data, student);
  const onPrintRAC_AllStudents = () => handlePrintRAC_AllStudents(data);

  const onPrintParteDiario = async () => {
    if (!selectedCourseId) return;
    const course = data.allCourses.find((item) => item.id === selectedCourseId);
    if (!course) return;
    setLoading(true);
    try {
      const scheduleRes = await apiService.get('horarios', { courseId: selectedCourseId, userId: user.id });
      handlePrintParteSemanal(data, course, scheduleRes);
    } catch (err) {
      console.error('Error fetching schedule for parte:', err);
      showToast('Error al obtener el horario del curso', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onPrintParteDiarioGlobal = async () => {
    setLoading(true);
    try {
      const allSchedules = await apiService.get('horarios', { userId: user.id });
      handlePrintParteSemanal_AllGrades(data, allSchedules);
    } catch (err) {
      console.error('Error fetching all schedules for global parte:', err);
      showToast('Error al obtener los horarios institucionales', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onPrintParteConInformacion = async (month, attendanceMap) => {
    if (!selectedCourseId) return;
    const course = data.allCourses.find((item) => item.id === selectedCourseId);
    if (!course) return;
    setLoading(true);
    try {
      const scheduleRes = await apiService.get('horarios', { courseId: selectedCourseId, userId: user.id });
      handlePrintParteSemanal_AllWeek(data, course, scheduleRes, month, attendanceMap);
    } catch (err) {
      console.error('Error fetching schedule for parte info:', err);
      showToast('Error al obtener el horario del curso', 'error');
    } finally {
      setLoading(false);
    }
  };

  return {
    handleUpdateLocks,
    handleUpdateSystemMode,
    handleUpdateMobileLogin,
    handleUpdateRACModular,
    handleUpdatePreceptorMode,
    handleUpdatePasswordMsg,
    savePrevias,
    deletePrevia,
    handleUpdatePeriods,
    onPrintAllCourses,
    onPrintSeguimientoGlobal,
    onPrintPlanillasCurso,
    onPrintRAC_Student,
    onPrintRAC_AllStudents,
    onPrintParteDiario,
    onPrintParteDiarioGlobal,
    onPrintParteConInformacion
  };
}
