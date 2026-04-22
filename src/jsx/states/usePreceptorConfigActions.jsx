import apiService from '../functions/apiService';
import { handlePrintAllCourses } from '../prints/SeguimientoA4';
import { handlePrintSeguimientoGlobal } from '../prints/SeguimientoAllA4';
import { handlePrintPlanillasCurso } from '../prints/CalificacionesA4';
import { handlePrintRAC } from '../prints/RACA4';
import { handlePrintParteDiario, handlePrintParteDiarioGlobal } from '../prints/ParteDiarioA4';

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

  const savePrevia = async (previaData) => {
    try {
      await post('previas', ...[{ ...previaData, userId: user.id }]);
      showToast(previaData.id ? 'Previa actualizada' : 'Previa agregada', 'success');
      await loadData(selectedCourseId, selectedYearId);
    } catch (err) {
      alert(err.message);
    }
  };

  const deletePrevia = async (previaId) => {
    if (!window.confirm('Â¿Seguro que deseas eliminar esta previa?')) return;
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
  const onPrintPlanillasCurso = () => handlePrintPlanillasCurso(data, selectedCourseId);
  const onPrintRAC = (student) => handlePrintRAC(data, student);

  const onPrintParteDiario = async () => {
    if (!selectedCourseId) return;
    const course = data.allCourses.find((item) => item.id === selectedCourseId);
    if (!course) return;
    setLoading(true);
    try {
      const scheduleRes = await apiService.get('horarios', { courseId: selectedCourseId, userId: user.id });
      handlePrintParteDiario(data, course, scheduleRes);
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
      handlePrintParteDiarioGlobal(data, allSchedules);
    } catch (err) {
      console.error('Error fetching all schedules for global parte:', err);
      showToast('Error al obtener los horarios institucionales', 'error');
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
    savePrevia,
    deletePrevia,
    handleUpdatePeriods,
    onPrintAllCourses,
    onPrintSeguimientoGlobal,
    onPrintPlanillasCurso,
    onPrintRAC,
    onPrintParteDiario,
    onPrintParteDiarioGlobal
  };
}
