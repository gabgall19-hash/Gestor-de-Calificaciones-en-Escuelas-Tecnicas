import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { emptyStudent, emptyCourse, emptyYear, emptyUser, emptyTec, draftTec, numberToWords, truncate, truncateSubject, simplifyTecName, formatDNI } from '../functions/PreceptorHelpers';
import { apiRequest, apiLoadData } from '../functions/apiService';

export default function usePreceptorLogic({ user, onPreviewStudent, showToast }) {
const location = useLocation();
  const navigate = useNavigate();
  const pathSegments = location.pathname.split('/');
  const page = pathSegments[2] || 'grades';
  const setPage = (newPage) => navigate(`/dashboard/${newPage}`);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unseenPases, setUnseenPases] = useState(false);
  const [unseenHistorial, setUnseenHistorial] = useState(false);
  const [activeTecId, setActiveTecId] = useState('');
  const [showNomenclaturaModal, setShowNomenclaturaModal] = useState(false);

  // Persistence Cache
  const [selectedYearId, setSelectedYearId] = useState(() => Number(localStorage.getItem('selectedYearId')) || 1);
  const [selectedCourseId, setSelectedCourseId] = useState(() => Number(localStorage.getItem('selectedCourseId')) || null);
  const [selectedPeriod, setSelectedPeriod] = useState(() => Number(localStorage.getItem('selectedPeriod')) || 2);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('viewMode') || (user.rol === 'profesor' ? 'bySubject' : (user.rol === 'preceptor_taller' || user.rol === 'preceptor_ef' ? 'bySubject' : 'simple'))); // 'simple' | 'bySubject'

  useEffect(() => {
    localStorage.setItem('selectedYearId', String(selectedYearId));
    localStorage.setItem('selectedCourseId', String(selectedCourseId || ''));
    localStorage.setItem('selectedPeriod', String(selectedPeriod));
    localStorage.setItem('viewMode', viewMode);
  }, [selectedYearId, selectedCourseId, selectedPeriod, viewMode]);

  useEffect(() => {
    if (page === 'pases') {
      const count = (data?.pases || []).length;
      localStorage.setItem('lastSeenPasesCount', String(count));
      setUnseenPases(false);
    } else {
      const count = (data?.pases || []).length;
      const last = Number(localStorage.getItem('lastSeenPasesCount') || 0);
      if (count > last) setUnseenPases(true);
      else setUnseenPases(false);
    }
  }, [page, data?.pases]);

  useEffect(() => {
    if (page === 'historial') {
      const count = (data?.auditLogs || []).length;
      localStorage.setItem('lastSeenHistorialCount', String(count));
      setUnseenHistorial(false);
    } else {
      const count = (data?.auditLogs || []).length;
      const last = Number(localStorage.getItem('lastSeenHistorialCount') || 0);
      if (count > last) setUnseenHistorial(true);
      else setUnseenHistorial(false);
    }
  }, [page, data?.auditLogs]);

  const [pending, setPending] = useState({});
  const [studentForm, setStudentForm] = useState(emptyStudent);
  const [courseForm, setCourseForm] = useState(emptyCourse);
  const [yearForm, setYearForm] = useState(emptyYear);
  const [userForm, setUserForm] = useState(emptyUser);
  const [tecForm, setTecForm] = useState(emptyTec);
  const [tecMode, setTecMode] = useState('list');
  const [editingTecId, setEditingTecId] = useState('');
  const [previewDni, setPreviewDni] = useState('');
  const [status, setStatus] = useState('');
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [transferringAlumno, setTransferringAlumno] = useState(null);
  const [transferMotivo, setTransferMotivo] = useState('');
  const [pasingStudent, setPasingStudent] = useState(null);
  const [paseForm, setPaseForm] = useState({ institucion: '', fecha: new Date().toLocaleDateString('es-AR'), motivo: '' });
  const [pasesSearch, setPasesSearch] = useState('');
  const [notesSearch, setNotesSearch] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState('1T');
  const [editingPase, setEditingPase] = useState(null);
  const [editingObsStudent, setEditingObsStudent] = useState(null);
  const [viewingProf, setViewingProf] = useState(null);
  const [selectedRacStudent, setSelectedRacStudent] = useState(null);
  const [showPreviasModal, setShowPreviasModal] = useState(false);
  const [previasSearch, setPreviasSearch] = useState('');
  const [dniError, setDniError] = useState('');
  const [draggedMateriaIndex, setDraggedMateriaIndex] = useState(null);
  const [studentsSearch, setStudentsSearch] = useState('');
  const [racSearch, setRacSearch] = useState('');
  const [materiasSearch, setMateriasSearch] = useState('');
  const [viewingFichaStudent, setViewingFichaStudent] = useState(null);
  const [isEditingFicha, setIsEditingFicha] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Cycle Transition State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [showEndCycleModal, setShowEndCycleModal] = useState(false);
  const [endCycleForm, setEndCycleForm] = useState({ isRepeater: false, targetCourseId: null });

  const truncateSubject = (name) => {
    if (!name) return '';
    const limit = isMobile ? 18 : 32;
    return name.length > limit ? `${name.slice(0, limit - 3).trim()}...` : name;
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredSubjects = useMemo(() => {
    if (!data?.subjects) return [];
    const all = data.subjects;

    // Filtro inicial por rol
    let base = all;
    if (user.rol === 'preceptor_taller') {
      base = all.filter(s => s.es_taller === 1);
    } else if (user.rol === 'preceptor_ef') {
      base = all.filter(s => (s.nombre || '').toUpperCase().includes('EDUCACION FISICA'));
    } else if (user.rol === 'preceptor') {
      if (viewMode === 'taller') {
        base = all.filter(s => s.es_taller === 1 && (s.tipo || '').toLowerCase().includes('modular'));
      } else {
        base = all.filter(s => s.es_taller !== 1);
      }
    } else if (user.rol === 'profesor') {
      const subjectPairs = (user.professor_subject_ids || '').split(',').filter(Boolean);
      const allowedSubjectIds = subjectPairs
        .filter(pair => Number(pair.split('-')[0]) === selectedCourseId)
        .map(pair => Number(pair.split('-')[1]));
      
      base = all.filter(s => allowedSubjectIds.includes(s.id));
    }

    // Filtro final por modo de vista
    // Filtro final por modo de vista (Los preceptores de taller siempre ven sus materias)
    if (user.rol === 'preceptor_taller') return base;

    if (viewMode === 'simple' || viewMode === 'bySubject') {
      return base.filter(s => s.es_taller !== 1);
    }
    if (viewMode === 'taller') {
      return base.filter(s => s.es_taller === 1);
    }

    return base;
  }, [viewMode, data?.subjects, user]);

  const rotationFilteredStudents = data?.students || [];

  const roleText = user.rol === 'admin'
    ? 'Administrador: control total del sistema.'
    : user.rol === 'jefe_de_auxiliares'
      ? 'Jefe de Auxiliares: acceso y edición en todos los cursos y listados.'
      : user.rol === 'preceptor_taller'
        ? 'Preceptor de Taller: gestiona exclusivamente materias de taller en sus cursos.'
        : user.rol === 'preceptor_ef'
          ? 'Preceptor de Educación Física: gestiona exclusivamente la materia de Educación Física en sus cursos.'
          : user.rol === 'preceptor'
            ? 'Preceptor: gestiona alumnos y notas en sus cursos asignados.'
            : 'Profesor: carga notas en sus cursos y materias asignadas.';

  const loadData = async (courseId = selectedCourseId, yearId = selectedYearId) => {
    setLoading(true);
    try {
      const isGlobal = page === 'students' || ['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'].includes(user.rol);
      const json = await apiLoadData(user.id, yearId, courseId, isGlobal);
      setData(json);
      setSelectedYearId(json.selectedYearId);
      setSelectedCourseId(json.selectedCourseId);
      
      // Validation of view mode
      const hasWorkshops = (json.subjects || []).some(s => s.es_taller === 1);
      const hasModularWorkshops = (json.subjects || []).some(s => s.es_taller === 1 && (s.tipo || '').toLowerCase().includes('modular'));

      let currentMode = viewMode;
      if (user.rol === 'preceptor_taller' || user.rol === 'preceptor_ef') {
        setViewMode('bySubject');
        currentMode = 'bySubject';
      } else if (user.rol === 'profesor') {
        setViewMode('bySubject');
        currentMode = 'bySubject';
      } else if (!data && (user.rol === 'preceptor' || user.rol === 'admin' || user.rol === 'secretaria_de_alumnos' || user.rol === 'jefe_de_auxiliares' || user.rol === 'director' || user.rol === 'vicedirector')) {
        setViewMode('simple');
        currentMode = 'simple';
      } else if (viewMode === 'taller') {
        if (user.rol === 'preceptor' && !hasModularWorkshops) {
          setViewMode('simple');
          currentMode = 'simple';
        } else if (!hasWorkshops) {
          setViewMode('simple');
          currentMode = 'simple';
        }
      }

      if (!selectedSubjectId && json.subjects?.length > 0) {
        let initialSub = null;
        if (currentMode === 'taller') {
          if (user.rol === 'preceptor') initialSub = json.subjects.find(s => s.es_taller === 1 && (s.tipo || '').toLowerCase().includes('modular'));
          else initialSub = json.subjects.find(s => s.es_taller === 1);
        } else if (currentMode === 'simple') {
          initialSub = json.subjects.find(s => s.es_taller !== 1);
        } else {
          if (user.rol === 'preceptor_taller') initialSub = json.subjects.find(s => s.es_taller === 1);
          else if (user.rol === 'preceptor_ef') initialSub = json.subjects.find(s => (s.nombre || '').toUpperCase().includes('EDUCACION FISICA'));
          else initialSub = json.subjects.find(s => s.es_taller !== 1);
        }

        setSelectedSubjectId(initialSub ? initialSub.id : json.subjects[0].id);
      }
      setCourseForm((p) => ({ ...p, year_id: p.year_id || String(json.selectedYearId ?? ''), tecnicatura_id: p.tecnicatura_id || String(json.selectedTecnicaturaId ?? '') }));
      setUserForm((p) => ({ ...p, preceptor_course_id: p.preceptor_course_id || String(json.selectedCourseId ?? '') }));
    } catch (err) {
      showToast('Error al cargar datos: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(selectedCourseId, selectedYearId); }, []);

  // Reset selectedSubjectId if it becomes invalid for the current viewMode
  useEffect(() => {
    if (page === 'grades' && (viewMode === 'bySubject' || viewMode === 'taller')) {
      if (filteredSubjects.length > 0) {
        const current = filteredSubjects.find(s => s.id === selectedSubjectId);
        if (!current) {
          setSelectedSubjectId(filteredSubjects[0].id);
        }
      }
    }
  }, [viewMode, filteredSubjects, selectedSubjectId, page]);
  useEffect(() => {
    if (!data) return;
    const tec = data.tecnicaturas?.find((t) => t.id === data.selectedTecnicaturaId);
    const subjects = (data.allSubjects || []).filter((s) => s.tecnicatura_id === data.selectedTecnicaturaId);
    setEditingTecId(String(data.selectedTecnicaturaId ?? ''));
    setTecForm(draftTec(tec, subjects));
  }, [data]);

  const handleDragStart = (e, index) => {
    setDraggedMateriaIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e, targetIndex) => {
    if (draggedMateriaIndex === null || draggedMateriaIndex === targetIndex) return;
    const newMaterias = [...tecForm.materias];
    const draggedItem = newMaterias[draggedMateriaIndex];
    newMaterias.splice(draggedMateriaIndex, 1);
    newMaterias.splice(targetIndex, 0, draggedItem);
    setTecForm(prev => ({ ...prev, materias: newMaterias }));
    setDraggedMateriaIndex(targetIndex);
  };

  const handleDragEnd = () => setDraggedMateriaIndex(null);

  if (!data) return <p>Cargando datos...</p>;

  const currentCourse = data.selectedCourse;

  // Cálculo dinámico de unidades de columna para la vista general
  const getSubjectUnits = (s) => {
    const isModular = (s.tipo || '').toLowerCase().includes('modular');
    if (isModular) {
      if ([1, 3, 5].includes(selectedPeriod)) return 2; // T y P
      if ([2, 4, 6].includes(selectedPeriod)) return 3; // T, P, Pond (Letras removed in Simple view)
      return 1; // Compensatorios/Final
    } else {
      if ([2, 4, 6].includes(selectedPeriod)) return 1; // Nota only (Letras removed in Simple view)
      return 1; // Inf. Ori or Final
    }
  };

  const gradeUnits = (data.subjects || []).reduce((sum, s) => sum + getSubjectUnits(s), 0) || 1;
  const gradeWidth = `calc((100% - 148px) / ${gradeUnits})`;
  const canManageStudents = user.rol === 'admin' || user.rol === 'secretaria_de_alumnos' || user.rol === 'jefe_de_auxiliares' || user.rol === 'director' || user.rol === 'vicedirector' ||
    ((user.rol === 'preceptor' || user.rol === 'preceptor_taller' || user.rol === 'preceptor_ef') &&
      (Number(user.preceptor_course_id) === selectedCourseId || (user.professor_course_ids || '').split(',').map(Number).includes(selectedCourseId)));
  const canTransfer = user.rol === 'admin' || user.rol === 'secretaria_de_alumnos' || user.rol === 'jefe_de_auxiliares' || user.rol === 'director' || user.rol === 'vicedirector' || user.rol === 'preceptor' || user.rol === 'preceptor_taller' || user.rol === 'preceptor_ef';

  const gradeValue = (alumnoId, materiaId, field, pidOverride) => {
    const pid = pidOverride || selectedPeriod;
    const key = `${alumnoId}-${materiaId}-${pid}`;
    if (pending[key]?.[field] !== undefined) return pending[key][field];
    const grade = data.grades.find((g) => g.alumno_id === alumnoId && g.materia_id === materiaId && g.periodo_id === pid);
    return grade ? grade[field] : '';
  };

  const post = async (type, body) => {
    return await apiRequest(type, body, user.id);
  };

  const saveGrades = async () => {
    const snapshots = { ...pending };
    const updates = Object.values(snapshots);
    if (!updates.length) {
      if (previewDni.trim()) onPreviewStudent(previewDni.trim());
      return;
    }
    try {
      // Check if any update triggered an observation prompt (Otras Instancias)
      const studentsToPrompt = [...new Set(updates.filter(u => u._triggerObs).map(u => u.alumno_id))];
      for (const aid of studentsToPrompt) {
        const student = data.students.find(s => s.id === aid);
        const obs = window.prompt(`Has completado 'Otras Instancias' para ${student?.apellido}. ¿Deseas agregar información a las observaciones del RAC? (Opcional)`, student?.observaciones_rac || '');
        if (obs !== null) {
          // Update local state and add to updates if needed
          await post('students', { action: 'update_field', studentId: aid, field: 'observaciones_rac', value: obs });
        }
      }

      await post('grades', { updates });
      setPending(prev => {
        const next = { ...prev };
        Object.keys(snapshots).forEach(key => delete next[key]);
        return next;
      });
      showToast('Cambios guardados correctamente', 'success');
      await loadData(selectedCourseId, selectedYearId);
      if (previewDni.trim()) onPreviewStudent(previewDni.trim());
    } catch (err) {
      showToast('Error al guardar notas: ' + err.message, 'error');
    }
  };

  const saveFicha = async () => {
    try {
      await post('students', { action: 'update', ...studentForm, id: viewingFichaStudent.id });
      setViewingFichaStudent(null);
      setIsEditingFicha(false);
      showToast('Ficha del alumno actualizada', 'success');
      await loadData(selectedCourseId, selectedYearId);
    } catch (err) {
      showToast('Error al actualizar ficha: ' + err.message, 'error');
    }
  };

  const updateCell = (alumnoId, materiaId, pid, field, value) => {
    const key = `${alumnoId}-${materiaId}-${pid}`;
    setPending((prev) => {
      const next = { ...prev, [key]: { ...prev[key], alumno_id: alumnoId, materia_id: materiaId, periodo_id: pid, [field]: value } };

      // Auto-conversión a Letras (Trimestrales numéricos)
      if ((field === 'valor_pond' || field === 'valor_t') && [2, 4, 6].includes(pid)) {
        if (value && !isNaN(value)) {
          const words = numberToWords(value);
          next[key] = { ...next[key], valor_letras: words };
        } else if (!value) {
          next[key] = { ...next[key], valor_letras: '' };
        }
      }

      // Unificación de Calificación Final de Taller Simple (Solo Pid 10)
      const currentSub = data.subjects?.find(s => s.id === materiaId);
      const isTallerSimple = currentSub?.es_taller === 1 && !(currentSub.tipo || '').toLowerCase().includes('modular');

      if (isTallerSimple) {
        if (pid === 10) {
          const siblingWorkshopSubs = data.subjects.filter(s => s.es_taller === 1 && !(s.tipo || '').toLowerCase().includes('modular'));
          siblingWorkshopSubs.forEach(s => {
            const sKey = `${alumnoId}-${s.id}-${pid}`;
            next[sKey] = { ...next[sKey], alumno_id: alumnoId, materia_id: s.id, periodo_id: pid, [field]: value };
          });
        }
      }

      // Lógica de Calificación Final Automática (No aplica a Taller Simple)
      if (!isTallerSimple && [6, 7, 8, 9].includes(pid)) {
        const targetField = 'valor_t'; // Siempre valor_t para finales (Dic, Feb, Mar, Def)

        const getVal = (pId) => {
          const k = `${alumnoId}-${materiaId}-${pId}`;
          const f = [7, 8, 9, 10].includes(pId) ? 'valor_t' : (currentSub?.tipo?.toLowerCase().includes('modular') ? 'valor_pond' : 'valor_t');
          const val = next[k]?.[f] ?? data.grades.find(g => g.alumno_id === alumnoId && g.materia_id === materiaId && g.periodo_id === pId)?.[f];
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
          next[defKey] = { ...next[defKey], alumno_id: alumnoId, materia_id: materiaId, periodo_id: 10, [targetField]: String(finalVal).replace('.', ',') };
          
          // Si la nota viene de Otras Instancias (pid 11), marcar que hubo cambios para pedir observación al guardar
          if (pid === 11) {
            next[defKey]._triggerObs = true;
          }
        } else {
          // Si no hay ninguna nota que determine la definitiva, enviamos un string vacío para limpiar la DB
          const existingDef = data.grades.find(g => g.alumno_id === alumnoId && g.materia_id === materiaId && g.periodo_id === 10);
          if (existingDef?.[targetField] || next[defKey]?.[targetField]) {
            next[defKey] = { ...next[defKey], alumno_id: alumnoId, materia_id: materiaId, periodo_id: 10, [targetField]: '' };
          }
        }
      }
      return next;
    });
  };

  const addStudent = async (e) => {
    e.preventDefault();
    setDniError('');
    try {
      await post('students', { action: 'create', ...studentForm, course_id: selectedCourseId });
      setStudentForm(emptyStudent);
      showToast('Alumno agregado', 'success');
      await loadData(selectedCourseId, selectedYearId);
    } catch (err) {
      if (err.message.includes('DNI')) {
        setDniError(err.message);
      } else {
        showToast(err.message, 'error');
      }
    }
  };
  const deleteStudent = async (student) => {
    if (user.rol !== 'admin' && user.rol !== 'secretaria_de_alumnos' && user.rol !== 'jefe_de_auxiliares' && user.rol !== 'director' && user.rol !== 'vicedirector') {
      showToast('No tienes permisos para eliminar alumnos.', 'error');
      return;
    }
    if (!window.confirm(`¿Estas seguro de eliminar permanentemente a ${student.apellido}, ${student.nombre}? Esta acción NO se puede deshacer.`)) return;
    await post('students', { action: 'delete', studentId: student.id });
    showToast('Alumno eliminado', 'success');
    await loadData(selectedCourseId, selectedYearId);
  };
  const transferStudent = async (student) => {
    const options = (data.allCourses ?? []).filter((c) => c.id !== student.course_id).map((c) => `${c.id}: ${c.year_nombre} · ${c.label} · ${c.tecnicatura_nombre}`).join('\n');
    const to = window.prompt(`Ingresá el ID del curso destino para ${student.apellido}, ${student.nombre}:\n${options}`);
    if (!to || !window.confirm(`¿Estas seguro de transferir a ${student.apellido}, ${student.nombre}?`)) return;
    await post('students', { action: 'transfer', studentId: student.id, course_id: Number(to) });
    setStatus('Alumno transferido');
    await loadData(selectedCourseId, selectedYearId);
  };

  const prepareEditCourse = (c) => { setEditingCourseId(c.id); setCourseForm({ year_id: String(c.year_id), ano: c.ano, division: c.division, turno: c.turno, tecnicatura_id: String(c.tecnicatura_id) }); };
  const editCourse = async (e) => { e.preventDefault(); await post('courses', { action: 'update', courseId: editingCourseId, ...courseForm, year_id: Number(courseForm.year_id), tecnicatura_id: Number(courseForm.tecnicatura_id) }); setEditingCourseId(null); showToast('Curso actualizado', 'success'); await loadData(selectedCourseId, selectedYearId); };
  const toggleCourseActive = async (course) => {
    const newState = !course.activo;
    const actionLabel = newState ? 'habilitar' : 'deshabilitar';
    if (!window.confirm(`¿Seguro que deseas ${actionLabel} el curso ${course.label}?`)) return;
    await post('courses', { action: 'toggle_active', courseId: course.id, activo: newState });
    showToast(`Curso ${newState ? 'habilitado' : 'deshabilitado'}`, 'success');
    await loadData(null, selectedYearId);
  };

  const execPase = async (e) => { e.preventDefault(); await post('students', { action: 'dar_de_pase', studentId: pasingStudent.id, ...paseForm }); setPasingStudent(null); showToast('Pase registrado', 'success'); await loadData(selectedCourseId, selectedYearId); };
  const undoPase = async (paseId) => { if (!window.confirm('¿Seguro que deseas deshacer este pase y reactivar al alumno?')) return; await post('students', { action: 'undo_pase', paseId }); showToast('Pase deshecho', 'success'); await loadData(selectedCourseId, selectedYearId); };

  const execTransfer = async (alumnoId, targetCourseId) => { if (!targetCourseId) return; await post('students', { action: 'transfer', studentId: alumnoId, course_id: Number(targetCourseId), motivo: transferMotivo }); setTransferringAlumno(null); setTransferMotivo(''); showToast('Alumno transferido correctamente', 'success'); await loadData(selectedCourseId, selectedYearId); };
  const savePaseEdit = async (e) => { e.preventDefault(); await post('students', { action: 'update_pase', ...editingPase }); setEditingPase(null); showToast('Pase actualizado', 'success'); await loadData(selectedCourseId, selectedYearId); };


  const updateStudentField = async (student, field, value) => {
    // Update local state for immediate feedback
    setData(prev => ({
      ...prev,
      students: prev.students.map(s => s.id === student.id ? { ...s, [field]: value } : s)
    }));
    try {
      await post('students', { action: 'update', studentId: student.id, ...student, [field]: value });
    } catch (err) {
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
      if (err.message.includes('DNI')) {
        setDniError(err.message);
      } else {
        showToast(err.message, 'error');
      }
    }
  };

  const handleSaveFicha = async () => {
    try {
      await post('students', { action: 'update', studentId: viewingFichaStudent.id, ...studentForm });
      setIsEditingFicha(false);
      showToast('Ficha de alumno actualizada correctamente', 'success');
      await loadData(selectedCourseId, selectedYearId);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const addCourse = async (e) => { e.preventDefault(); const json = await post('courses', { action: 'create', ...courseForm, year_id: Number(courseForm.year_id), tecnicatura_id: Number(courseForm.tecnicatura_id) }); showToast('Curso agregado', 'success'); await loadData(json.course.id, Number(courseForm.year_id)); setPage('grades'); };
  const addYear = async (e) => { e.preventDefault(); const json = await post('years', yearForm); setYearForm(emptyYear); showToast('Año lectivo agregado', 'success'); await loadData(null, json.year.id); };
  const editYear = async (yearId, newName) => { if (!newName) return; await post('years', { action: 'update', yearId, nombre: newName }); showToast('Año lectivo actualizado', 'success'); await loadData(selectedCourseId, selectedYearId); };
  const deleteYear = async (year) => { if (!window.confirm(`¿Seguro que deseas eliminar el año ${year.nombre}? Esto podría romper vínculos con cursos existentes.`)) return; await post('years', { action: 'delete', yearId: year.id }); showToast('Año lectivo eliminado', 'success'); await loadData(selectedCourseId, null); };
  const createUser = async (e) => {
    e.preventDefault();
    const payload = {
      ...userForm,
      preceptor_course_id: (userForm.rol === 'preceptor' || userForm.rol === 'preceptor_taller' || userForm.rol === 'preceptor_ef') ? Number(userForm.preceptor_course_id) : null,
      professor_course_ids: Array.isArray(userForm.professor_course_ids) ? userForm.professor_course_ids : [],
      professor_subject_ids: Array.isArray(userForm.professor_subject_ids) ? userForm.professor_subject_ids : [],
      is_professor_hybrid: !!userForm.is_professor_hybrid
    };
    await post('users', { action: 'create', ...payload });
    setUserForm(emptyUser); setEditingUserId(null); showToast('Usuario agregado', 'success'); await loadData(selectedCourseId, selectedYearId);
  };
  const editUser = async (e) => {
    e.preventDefault();
    const payload = {
      ...userForm,
      preceptor_course_id: (userForm.rol === 'preceptor' || userForm.rol === 'preceptor_taller' || userForm.rol === 'preceptor_ef') ? Number(userForm.preceptor_course_id) : null,
      professor_course_ids: Array.isArray(userForm.professor_course_ids) ? userForm.professor_course_ids : [],
      professor_subject_ids: Array.isArray(userForm.professor_subject_ids) ? userForm.professor_subject_ids : [],
      is_professor_hybrid: !!userForm.is_professor_hybrid
    };
    await post('users', { action: 'update', targetUserId: editingUserId, ...payload });
    setEditingUserId(null); setUserForm(emptyUser); setStatus('Usuario actualizado'); await loadData(selectedCourseId, selectedYearId);
  };
  const startEditUser = (u) => {
    setEditingUserId(u.id);
    setUserForm({
      id: u.id,
      nombre: u.nombre,
      username: u.username,
      password: u.password,
      rol: u.rol,
      preceptor_course_id: u.preceptor_course_id,
      is_professor_hybrid: !!u.is_professor_hybrid,
      professor_course_ids: String(u.professor_course_ids || '').split(',').filter(Boolean).map(Number),
      professor_subject_ids: String(u.professor_subject_ids || '').split(',').filter(Boolean)
    });
    setPage('settings');
  };
  const deleteUser = async (u) => { if (!window.confirm(`¿Seguro que deseas eliminar al usuario ${u.nombre}?`)) return; await post('users', { action: 'delete', targetUserId: u.id }); setStatus('Usuario eliminado'); await loadData(selectedCourseId, selectedYearId); };
  const handleResetPassword = async (targetUserId, newPassword) => {
    try {
      await post('users', { action: 'reset_password', targetUserId, newPassword });
      showToast('Contraseña actualizada correctamente', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const setYearAsCurrent = async (yearId) => {
    try {
      await post('years', { action: 'set_current', yearId });
      showToast('Año marcado como actual', 'success');
      await loadData(selectedCourseId, selectedYearId);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const copyYearInfo = async (fromYearId, toYearId, targetUserId = null) => {
    try {
      setLoading(true);
      await post('years', { action: 'copy_roles', fromYearId, toYearId, targetUserId });
      showToast('Información copiada correctamente', 'success');
      await loadData(selectedCourseId, toYearId);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (student) => {
    const newPass = window.prompt(`Establecer contraseña de boletín para ${student.apellido}, ${student.nombre}:`, '');
    if (newPass === null) return;
    try {
      await post('students', { action: 'update_password', studentId: student.id, password: newPass });
      showToast('Contraseña de boletín actualizada', 'success');
      await loadData(selectedCourseId, selectedYearId);
    } catch (err) {
      showToast('Error al actualizar contraseña: ' + err.message, 'error');
    }
  };

  const startEndCycle = () => {
    setIsSelectionMode(true);
    setPage('students');
    showToast('Modo de selección masiva activado. Selecciona los alumnos para promover o repetir.', 'info');
  };

  const handleEndCycleConfirm = async () => {
    const selectedStudents = data.students.filter(s => selectedStudentIds.includes(s.id));
    
    // Validate previas if not repeater
    if (!endCycleForm.isRepeater) {
      const alerted = [];
      selectedStudents.forEach(s => {
        const studentGrades = data.grades.filter(g => g.alumno_id === s.id && g.periodo_id === 10);
        const studentPrevias = data.previas.filter(p => p.alumno_id === s.id && p.estado === 'pendiente');
        
        // Failures: grades < 7 in definitive (or missing)
        // Wait, current school rules: 3 or more previas = warning
        // Let's count missing definitive grades < 7
        const currentYearPrevias = data.subjects.filter(sub => {
          const g = studentGrades.find(g => g.materia_id === sub.id);
          const val = g ? Number(String(g.valor_t).replace(',', '.')) : 0;
          return val < 7;
        }).length;

        const totalPrevias = currentYearPrevias + studentPrevias.length;
        if (totalPrevias >= 3) alerted.push(`${s.apellido} (${totalPrevias} previas)`);
      });

      if (alerted.length > 0) {
        if (!window.confirm(`ADVERTENCIA: Los siguientes alumnos tienen 3 o más materias previas:\n${alerted.join('\n')}\n\n¿Desea hacer pasar a estos alumnos igualmente?`)) return;
      }
    }

    let targetId = Number(endCycleForm.targetCourseId);
    const currentYear = data.academicYears.find(y => y.id === selectedYearId);

    if (endCycleForm.isRepeater) {
      const nextYearName = String(Number(currentYear.nombre) + 1);
      const currentCourse = data.courses.find(c => c.id === selectedCourseId);
      const targetCourse = data.allCourses.find(c => 
        String(c.year_nombre) === nextYearName && 
        c.label === currentCourse.label && 
        c.tecnicatura_id === currentCourse.tecnicatura_id
      );
      
      if (!targetCourse) {
        showToast(`Error: No existe el curso ${currentCourse.label} en el ciclo ${nextYearName}. Por favor créalo en Configuraciones antes de procesar repitentes.`, 'error');
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
        cycleName: currentYear?.nombre || 'Desconocido'
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

  const handleViewFicha = (s) => {
    setViewingFichaStudent(s);
    setStudentForm({ ...emptyStudent, ...s });
    setIsEditingFicha(false);
  };

  const getHistorial = async (studentId) => {
    return await apiRequest(`historial_escolar&studentId=${studentId}`);
  };
  const startCreateTec = () => { setTecMode('create'); setTecForm({ nombre: '', materias: [{ id: `draft-${Date.now()}`, nombre: '', tipo: 'comun' }] }); };
  const startEditTec = (tecId) => { const tec = data.tecnicaturas.find((t) => t.id === tecId); const subjects = data.allSubjects.filter((s) => s.tecnicatura_id === tecId); setEditingTecId(String(tecId)); setTecForm(draftTec(tec, subjects)); setTecMode('edit'); };
  const addTec = async (e) => {
    e.preventDefault();
    const materias = tecForm.materias.filter((m) => m.nombre.trim()).map(m => {
      let tipo = m.tipo;
      let es_taller = 0;
      if (m.tipo === 'taller') {
        tipo = 'comun';
        es_taller = 1;
      } else if (m.tipo === 'taller_modular') {
        tipo = 'modular';
        es_taller = 1;
      } else if (m.tipo === 'modular') {
        tipo = 'modular';
        es_taller = 0;
      }
      return { ...m, tipo, es_taller };
    });
    await post('tecnicaturas', { action: 'create', nombre: tecForm.nombre, detalle: tecForm.detalle, materias });
    setTecMode('list'); setStatus('Tecnicatura creada'); await loadData(selectedCourseId, selectedYearId);
  };
  const editTec = async (e) => {
    e.preventDefault();
    const materias = tecForm.materias.filter((m) => m.nombre.trim()).map(m => {
      let tipo = m.tipo;
      let es_taller = 0;
      if (m.tipo === 'taller') {
        tipo = 'comun';
        es_taller = 1;
      } else if (m.tipo === 'taller_modular') {
        tipo = 'modular';
        es_taller = 1;
      } else if (m.tipo === 'modular') {
        tipo = 'modular';
        es_taller = 0;
      }
      return { ...m, tipo, es_taller };
    });
    await post('tecnicaturas', { action: 'update', tecnicaturaId: Number(editingTecId), nombre: tecForm.nombre, detalle: tecForm.detalle, materias });
    setTecMode('list'); setStatus('Tecnicatura actualizada'); await loadData(selectedCourseId, selectedYearId);
  };
  const removeTec = async (tec) => { if (!window.confirm(`¿Estas seguro de eliminar la tecnicatura ${tec.nombre}?`)) return; await post('tecnicaturas', { action: 'delete', tecnicaturaId: tec.id }); setTecMode('list'); setStatus('Tecnicatura eliminada'); await loadData(selectedCourseId, selectedYearId); };

  const handleUpdateLocks = async (materiaId, periodoId, bloqueado, all = false) => {
    try {
      await post('bloqueos', { action: 'toggle', courseId: selectedCourseId, materiaId, periodoId, bloqueado, all });
      setStatus(all ? (bloqueado ? 'Curso bloqueado' : 'Curso desbloqueado') : (bloqueado ? 'Periodo bloqueado' : 'Periodo desbloqueado'));
      await loadData(selectedCourseId, selectedYearId);
    } catch (err) { alert(err.message); }
  };

  const handleUpdateSystemMode = async (mode) => {
    try {
      await post('config', { action: 'update_mode', valor: mode });
      showToast('Modo de sistema actualizado', 'success');
      await loadData(selectedCourseId, selectedYearId);
    } catch (err) { alert(err.message); }
  };

  const handleUpdateMobileLogin = async (enabled) => {
    try {
      await post('config', { action: 'update_mobile', valor: String(enabled) });
      showToast('Configuración de acceso móvil actualizada', 'success');
      await loadData(selectedCourseId, selectedYearId);
    } catch (err) { alert(err.message); }
  };

  const handleUpdatePreceptorMode = async (role, mode) => {
    try {
      await post('config', { action: 'update_preceptor_mode', role, mode });
      showToast(`Modo de ${role} actualizado`, 'success');
      await loadData(selectedCourseId, selectedYearId);
    } catch (err) { alert(err.message); }
  };

  const duplicateTec = async (tecId) => {
    const tec = data.tecnicaturas.find(t => t.id === tecId);
    const subjects = data.allSubjects.filter(s => s.tecnicatura_id === tecId);
    await post('tecnicaturas', {
      action: 'create',
      nombre: `${tec.nombre} (Copia)`,
      detalle: tec.detalle,
      materias: subjects.map(s => ({ nombre: s.nombre, tipo: s.tipo, es_taller: s.es_taller }))
    });
    showToast('Tecnicatura duplicada', 'success');
    await loadData(selectedCourseId, selectedYearId);
  };

  const savePrevia = async (previaData) => {
    try {
      await post('previas', ...[{ ...previaData, userId: user.id }]);
      showToast(previaData.id ? 'Previa actualizada' : 'Previa agregada', 'success');
      await loadData(selectedCourseId, selectedYearId);
    } catch (err) { alert(err.message); }
  };

  const deletePrevia = async (previaId) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta previa?')) return;
    try {
      await post('previas', { action: 'delete', id: previaId, userId: user.id });
      showToast('Previa eliminada', 'success');
      await loadData(selectedCourseId, selectedYearId);
    } catch (err) { alert(err.message); }
  };

  const handleUpdatePeriods = async (updatedPeriods) => {
    try {
      await post('config', { action: 'update_periods', periodos: updatedPeriods });
      setStatus('Configuración de períodos guardada');
      await loadData(selectedCourseId, selectedYearId);
    } catch (err) { alert(err.message); }
  };

  const onPrintAllCourses = () => handlePrintAllCourses(data);
  const onPrintSeguimientoGlobal = () => handlePrintSeguimientoGlobal(data, selectedYearId, user, setStatus);
  const onPrintPlanillasCurso = () => handlePrintPlanillasCurso(data, selectedCourseId);
  const onPrintRAC = (student) => handlePrintRAC(data, student);

  
  return {
    location, navigate, data, setData, loading, setLoading, unseenPases, setUnseenPases, unseenHistorial, setUnseenHistorial,
    activeTecId, setActiveTecId, showNomenclaturaModal, setShowNomenclaturaModal, selectedYearId, setSelectedYearId,
    selectedCourseId, setSelectedCourseId, selectedPeriod, setSelectedPeriod, viewMode, setViewMode, pending, setPending,
    studentForm, setStudentForm, courseForm, setCourseForm, yearForm, setYearForm, userForm, setUserForm, tecForm, setTecForm,
    tecMode, setTecMode, editingTecId, setEditingTecId, previewDni, setPreviewDni, status, setStatus, editingCourseId, setEditingCourseId,
    editingStudent, setEditingStudent, editingUserId, setEditingUserId, transferringAlumno, setTransferringAlumno, transferMotivo, setTransferMotivo,
    pasingStudent, setPasingStudent, paseForm, setPaseForm, pasesSearch, setPasesSearch, notesSearch, setNotesSearch, selectedSubjectId, setSelectedSubjectId,
    selectedGroup, setSelectedGroup, editingPase, setEditingPase, editingObsStudent, setEditingObsStudent, viewingProf, setViewingProf,
    selectedRacStudent, setSelectedRacStudent, showPreviasModal, setShowPreviasModal, previasSearch, setPreviasSearch, dniError, setDniError,
    draggedMateriaIndex, setDraggedMateriaIndex, studentsSearch, setStudentsSearch, racSearch, setRacSearch, materiasSearch, setMateriasSearch,
    viewingFichaStudent, setViewingFichaStudent, isEditingFicha, setIsEditingFicha, isMobile, setIsMobile, isSelectionMode, setIsSelectionMode,
    selectedStudentIds, setSelectedStudentIds, showEndCycleModal, setShowEndCycleModal, endCycleForm, setEndCycleForm,
    truncateSubject, filteredSubjects, rotationFilteredStudents, roleText, loadData, handleDragStart, handleDragEnter, handleDragEnd,
    currentCourse, getSubjectUnits, gradeUnits, gradeWidth, canManageStudents, canTransfer, gradeValue, post, saveGrades, saveFicha,
    updateCell, addStudent, deleteStudent, transferStudent, prepareEditCourse, editCourse, toggleCourseActive, execPase, undoPase,
    execTransfer, savePaseEdit, updateStudentField, saveObs, editStudent, handleSaveFicha, addCourse, addYear, editYear, deleteYear,
    createUser, editUser, startEditUser, deleteUser, handleResetPassword, setYearAsCurrent, copyYearInfo, handleSetPassword,
    startEndCycle, handleEndCycleConfirm, handleViewFicha, getHistorial, startCreateTec, startEditTec, addTec, editTec, removeTec,
    handleUpdateLocks, handleUpdateSystemMode, handleUpdateMobileLogin, handleUpdatePreceptorMode, duplicateTec, savePrevia, deletePrevia,
    page, setPage, handleUpdatePeriods
  };
}
