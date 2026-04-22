import { numberToWords } from '../functions/PreceptorHelpers';

export default function usePreceptorGradesLogic(deps) {
  const {
    pending,
    setPending,
    selectedPeriod,
    data,
    post,
    previewDni,
    onPreviewStudent,
    showToast,
    loadData,
    selectedCourseId,
    selectedYearId
  } = deps;

  const gradeValue = (alumnoId, materiaId, field, pidOverride) => {
    const pid = pidOverride || selectedPeriod;
    const key = `${alumnoId}-${materiaId}-${pid}`;
    if (pending[key]?.[field] !== undefined) return pending[key][field];
    const grade = data?.grades.find((item) => item.alumno_id === alumnoId && item.materia_id === materiaId && item.periodo_id === pid);
    return grade ? grade[field] : '';
  };

  const saveGrades = async () => {
    const snapshots = { ...pending };
    const updates = Object.values(snapshots);
    if (!updates.length) {
      if (previewDni.trim()) onPreviewStudent(previewDni.trim());
      return;
    }

    try {
      const studentsToPrompt = [...new Set(updates.filter((update) => update._triggerObs).map((update) => update.alumno_id))];
      for (const aid of studentsToPrompt) {
        const student = data.students.find((item) => item.id === aid);
        const obs = window.prompt(`Has completado 'Otras Instancias' para ${student?.apellido}. Â¿Deseas agregar información a las observaciones del RAC? (Opcional)`, student?.observaciones_rac || '');
        if (obs !== null) {
          await post('students', { action: 'update_field', studentId: aid, field: 'observaciones_rac', value: obs });
        }
      }

      await post('grades', { updates });
      setPending((prev) => {
        const next = { ...prev };
        Object.keys(snapshots).forEach((key) => delete next[key]);
        return next;
      });
      showToast('Cambios guardados correctamente', 'success');
      await loadData(selectedCourseId, selectedYearId);
      if (previewDni.trim()) onPreviewStudent(previewDni.trim());
    } catch (err) {
      showToast('Error al guardar notas: ' + err.message, 'error');
    }
  };

  const updateCell = (alumnoId, materiaId, pid, field, value) => {
    const key = `${alumnoId}-${materiaId}-${pid}`;
    setPending((prev) => {
      const next = { ...prev, [key]: { ...prev[key], alumno_id: alumnoId, materia_id: materiaId, periodo_id: pid, [field]: value } };
      if ((field === 'valor_pond' || field === 'valor_t') && [2, 4, 6].includes(pid)) {
        next[key] = { ...next[key], valor_letras: value && !isNaN(value) ? numberToWords(value) : '' };
      }

      const currentSub = data.subjects?.find((subject) => subject.id === materiaId);
      const isTallerSimple = currentSub?.es_taller === 1 && !(currentSub.tipo || '').toLowerCase().includes('modular');

      if (isTallerSimple && pid === 10) {
        data.subjects
          .filter((subject) => subject.es_taller === 1 && !(subject.tipo || '').toLowerCase().includes('modular'))
          .forEach((subject) => {
            const sKey = `${alumnoId}-${subject.id}-${pid}`;
            next[sKey] = { ...next[sKey], alumno_id: alumnoId, materia_id: subject.id, periodo_id: pid, [field]: value };
          });
      }

      if (!isTallerSimple && [6, 7, 8, 9].includes(pid)) {
        const getVal = (periodId) => {
          const localKey = `${alumnoId}-${materiaId}-${periodId}`;
          const localField = [7, 8, 9, 10].includes(periodId) ? 'valor_t' : ((currentSub?.tipo || '').toLowerCase().includes('modular') ? 'valor_pond' : 'valor_t');
          const val = next[localKey]?.[localField] ?? data.grades.find((grade) => grade.alumno_id === alumnoId && grade.materia_id === materiaId && grade.periodo_id === periodId)?.[localField];
          return val ? Number(String(val).replace(',', '.')) : null;
        };

        const trim3 = getVal(6);
        const dic = getVal(7);
        const feb = getVal(8);
        const mar = getVal(9);
        const otras = getVal(11);

        let finalVal = null;
        if (otras !== null) finalVal = otras;
        else if (mar !== null) finalVal = mar;
        else if (feb >= 7) finalVal = feb;
        else if (dic >= 7) finalVal = dic;
        else if (trim3 >= 7) finalVal = trim3;

        const defKey = `${alumnoId}-${materiaId}-10`;
        if (finalVal !== null) {
          next[defKey] = { ...next[defKey], alumno_id: alumnoId, materia_id: materiaId, periodo_id: 10, valor_t: String(finalVal).replace('.', ',') };
          if (pid === 11) next[defKey]._triggerObs = true;
        } else {
          const existingDef = data.grades.find((grade) => grade.alumno_id === alumnoId && grade.materia_id === materiaId && grade.periodo_id === 10);
          if (existingDef?.valor_t || next[defKey]?.valor_t) {
            next[defKey] = { ...next[defKey], alumno_id: alumnoId, materia_id: materiaId, periodo_id: 10, valor_t: '' };
          }
        }
      }

      return next;
    });
  };

  return { gradeValue, saveGrades, updateCell };
}
