import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { emptyStudent, emptyCourse, emptyYear, emptyUser, emptyTec, draftTec } from '../functions/PreceptorHelpers';
import { apiLoadData, apiRequest, default as apiService } from '../functions/apiService';
import usePreceptorStudentActions from './usePreceptorStudentActions';
import usePreceptorAdminActions from './usePreceptorAdminActions';
import usePreceptorConfigActions from './usePreceptorConfigActions';
import usePreceptorGradesLogic from './usePreceptorGradesLogic';

export default function usePreceptorLogic({ user, onPreviewStudent, showToast }) {
  const location = useLocation();
  const navigate = useNavigate();
  const pathSegments = location.pathname.split('/');
  const page = pathSegments[2] || (['preceptor', 'preceptor_taller', 'preceptor_ef'].includes(user.rol) ? 'asistencia' : 'grades');
  const setPage = (newPage) => navigate(`/dashboard/${newPage}`);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unseenPases, setUnseenPases] = useState(false);
  const [unseenHistorial, setUnseenHistorial] = useState(false);
  const [activeTecId, setActiveTecId] = useState('');
  const [showNomenclaturaModal, setShowNomenclaturaModal] = useState(false);

  const [selectedYearId, setSelectedYearId] = useState(() => Number(localStorage.getItem('selectedYearId')) || 1);
  const [selectedCourseId, setSelectedCourseId] = useState(() => Number(localStorage.getItem('selectedCourseId')) || null);
  const [selectedPeriod, setSelectedPeriod] = useState(() => Number(localStorage.getItem('selectedPeriod')) || 2);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('viewMode') || (user.rol === 'profesor' ? 'bySubject' : (user.rol === 'preceptor_taller' || user.rol === 'preceptor_ef' ? 'bySubject' : 'simple')));

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
      setUnseenPases(count > last);
    }
  }, [page, data?.pases]);

  useEffect(() => {
    if (page === 'historial') {
      const count = (data?.historial || []).length;
      localStorage.setItem('lastSeenHistorialCount', String(count));
      setUnseenHistorial(false);
    } else {
      const count = (data?.historial || []).length;
      const last = Number(localStorage.getItem('lastSeenHistorialCount') || 0);
      setUnseenHistorial(count > last);
    }
  }, [page, data?.historial]);

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
  const [userError, setUserError] = useState('');
  const [draggedMateriaIndex, setDraggedMateriaIndex] = useState(null);
  const [studentsSearch, setStudentsSearch] = useState('');
  const [racSearch, setRacSearch] = useState('');
  const [materiasSearch, setMateriasSearch] = useState('');
  const [viewingFichaStudent, setViewingFichaStudent] = useState(null);
  const [isEditingFicha, setIsEditingFicha] = useState(false);
  const [academicYearSummary, setAcademicYearSummary] = useState(null);
  const checkIsMobile = () => {
    const ua = navigator.userAgent;
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    return isMobileUA || isTouch || (window.innerWidth <= 1024);
  };

  const [isMobile, setIsMobile] = useState(checkIsMobile());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [showEndCycleModal, setShowEndCycleModal] = useState(false);
  const [endCycleForm, setEndCycleForm] = useState({ isRepeater: false, targetCourseId: null, egresadoTipo: '' });

  const truncateSubject = (name) => {
    if (!name) return '';
    const limit = isMobile ? 18 : 32;
    return name.length > limit ? `${name.slice(0, limit - 3).trim()}...` : name;
  };

  useEffect(() => {
    const handleResize = () => setIsMobile(checkIsMobile());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredSubjects = useMemo(() => {
    if (!data?.subjects) return [];
    const all = data.subjects;
    let base = all;

    if (user.rol === 'preceptor_taller') {
      base = all.filter((subject) => subject.es_taller === 1);
    } else if (user.rol === 'preceptor_ef') {
      base = all.filter((subject) => (subject.nombre || '').toUpperCase().includes('EDUCACION FISICA'));
    } else if (user.rol === 'preceptor') {
      base = viewMode === 'taller'
        ? all.filter((subject) => subject.es_taller === 1 && (subject.tipo || '').toLowerCase().includes('modular'))
        : all.filter((subject) => subject.es_taller !== 1);
    } else if (user.rol === 'profesor') {
      const subjectPairs = (user.professor_subject_ids || '').split(',').filter(Boolean);
      const allowedSubjectIds = subjectPairs
        .filter((pair) => Number(pair.split('-')[0]) === selectedCourseId)
        .map((pair) => Number(pair.split('-')[1]));
      base = all.filter((subject) => allowedSubjectIds.includes(subject.id));
    }

    if (user.rol === 'preceptor_taller') return base;
    if (viewMode === 'simple' || viewMode === 'bySubject') return base.filter((subject) => subject.es_taller !== 1);
    if (viewMode === 'taller') return base.filter((subject) => subject.es_taller === 1);
    return base;
  }, [viewMode, data?.subjects, user, selectedCourseId]);

  const rotationFilteredStudents = data?.students || [];

  const roleText = user.rol === 'admin'
    ? 'Administrador: control total del sistema.'
    : user.rol === 'jefe_de_auxiliares'
      ? 'Jefe de Auxiliares: acceso y ediciÃ³n en todos los cursos y listados.'
      : user.rol === 'preceptor_taller'
        ? 'Preceptor de Taller: gestiona exclusivamente materias de taller en sus cursos.'
        : user.rol === 'preceptor_ef'
          ? 'Preceptor de EducaciÃ³n FÃ­sica: gestiona exclusivamente la materia de EducaciÃ³n FÃ­sica en sus cursos.'
          : user.rol === 'preceptor'
            ? 'Preceptor: gestiona alumnos y notas en sus cursos asignados.'
            : 'Profesor: carga notas en sus cursos y materias asignadas.';

  const loadData = useCallback(async (courseId = selectedCourseId, yearId = selectedYearId) => {
    setLoading(true);
    try {
      const isGlobal = page === 'students' || ['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'].includes(user.rol);
      const json = await apiLoadData(user.id, yearId, courseId, isGlobal);
      setData(json);
      setSelectedYearId(json.selectedYearId);
      setSelectedCourseId(json.selectedCourseId);

      const hasWorkshops = (json.subjects || []).some((subject) => subject.es_taller === 1);
      const hasModularWorkshops = (json.subjects || []).some((subject) => subject.es_taller === 1 && (subject.tipo || '').toLowerCase().includes('modular'));

      let currentMode = viewMode;
      if (['preceptor_taller', 'preceptor_ef', 'profesor'].includes(user.rol)) {
        setViewMode('bySubject');
        currentMode = 'bySubject';
      } else if (!selectedSubjectId && ['preceptor', 'admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'].includes(user.rol)) {
        setViewMode('simple');
        currentMode = 'simple';
      } else if (viewMode === 'taller') {
        if ((user.rol === 'preceptor' && !hasModularWorkshops) || !hasWorkshops) {
          setViewMode('simple');
          currentMode = 'simple';
        }
      }

      if (!selectedSubjectId && json.subjects?.length > 0) {
        let initialSub = null;
        if (currentMode === 'taller') {
          initialSub = user.rol === 'preceptor'
            ? json.subjects.find((subject) => subject.es_taller === 1 && (subject.tipo || '').toLowerCase().includes('modular'))
            : json.subjects.find((subject) => subject.es_taller === 1);
        } else if (currentMode === 'simple') {
          initialSub = json.subjects.find((subject) => subject.es_taller !== 1);
        } else {
          if (user.rol === 'preceptor_taller') initialSub = json.subjects.find((subject) => subject.es_taller === 1);
          else if (user.rol === 'preceptor_ef') initialSub = json.subjects.find((subject) => (subject.nombre || '').toUpperCase().includes('EDUCACION FISICA'));
          else initialSub = json.subjects.find((subject) => subject.es_taller !== 1);
        }
        setSelectedSubjectId(initialSub ? initialSub.id : json.subjects[0].id);
      }

      setCourseForm((prev) => ({ ...prev, year_id: prev.year_id || String(json.selectedYearId ?? ''), tecnicatura_id: prev.tecnicatura_id || String(json.selectedTecnicaturaId ?? '') }));
      setUserForm((prev) => ({ ...prev, preceptor_course_id: prev.preceptor_course_id || String(json.selectedCourseId ?? '') }));
    } catch (err) {
      showToast('Error al cargar datos: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId, selectedYearId, page, user.rol, viewMode, selectedSubjectId, showToast, user.id]);

  useEffect(() => { loadData(selectedCourseId, selectedYearId); }, [loadData, selectedCourseId, selectedYearId]);

  useEffect(() => {
    if (page === 'grades' && (viewMode === 'bySubject' || viewMode === 'taller') && filteredSubjects.length > 0) {
      const current = filteredSubjects.find((subject) => subject.id === selectedSubjectId);
      if (!current) setSelectedSubjectId(filteredSubjects[0].id);
    }
  }, [viewMode, filteredSubjects, selectedSubjectId, page]);

  useEffect(() => {
    if (!data) return;
    const tec = data.tecnicaturas?.find((item) => item.id === data.selectedTecnicaturaId);
    const subjects = (data.allSubjects || []).filter((subject) => subject.tecnicatura_id === data.selectedTecnicaturaId);
    setEditingTecId(String(data.selectedTecnicaturaId ?? ''));
    setTecForm(draftTec(tec, subjects));
  }, [data]);

  const handleDragStart = (e, index) => {
    setDraggedMateriaIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e, targetIndex) => {
    if (draggedMateriaIndex === null || draggedMateriaIndex === targetIndex) return;
    const newMaterias = [...tecForm.materias];
    const draggedItem = newMaterias[draggedMateriaIndex];
    newMaterias.splice(draggedMateriaIndex, 1);
    newMaterias.splice(targetIndex, 0, draggedItem);
    setTecForm((prev) => ({ ...prev, materias: newMaterias }));
    setDraggedMateriaIndex(targetIndex);
  };

  const handleDragEnd = () => setDraggedMateriaIndex(null);

  const currentCourse = data?.selectedCourse ?? null;

  const getSubjectUnits = (subject) => {
    const isModular = (subject.tipo || '').toLowerCase().includes('modular');
    if (isModular) {
      if ([1, 3, 5].includes(selectedPeriod)) return 2;
      if ([2, 4, 6].includes(selectedPeriod)) return 3;
      return 1;
    }
    return 1;
  };

  const gradeUnits = (data?.subjects || []).reduce((sum, subject) => sum + getSubjectUnits(subject), 0) || 1;
  const gradeWidth = `calc((100% - 148px) / ${gradeUnits})`;
  const canManageStudents = ['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares'].includes(user.rol) ||
    ((['preceptor', 'preceptor_taller', 'preceptor_ef'].includes(user.rol) || (user.rol === 'profesor' && user.is_professor_hybrid)) &&
      (Number(user.preceptor_course_id) === selectedCourseId));
  const canTransfer = ['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector', 'preceptor', 'preceptor_taller', 'preceptor_ef'].includes(user.rol) || (user.rol === 'profesor' && user.is_professor_hybrid);

  const post = async (type, body) => apiRequest(type, body, user.id);
  const get = async (type, params) => apiService.get(type, { ...params, userId: user.id });

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

  const { gradeValue, saveGrades, updateCell } = usePreceptorGradesLogic({
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
  });

  const {
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
  } = usePreceptorStudentActions({
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
    studentFormState: studentForm,
    setIsEditingFicha,
    setViewingFichaStudent,
    setPage,
    setIsSelectionMode,
    selectedStudentIds,
    endCycleForm,
    setLoading,
    setSelectedStudentIds,
    setShowEndCycleModal,
    setUserError
  });

  const {
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
    duplicateTec,
    getYearSummary
  } = usePreceptorAdminActions({
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
    setLoading,
    userError,
    setUserError,
    academicYearSummary,
    setAcademicYearSummary
  });

  const {
    handleUpdateLocks,
    handleUpdateSystemMode,
    handleUpdateMobileLogin,
    handleUpdateRACModular,
    handleUpdatePreceptorMode,
    handleUpdatePasswordMsg,
    savePrevia,
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
  } = usePreceptorConfigActions({
    data,
    user,
    post,
    selectedCourseId,
    selectedYearId,
    loadData,
    setStatus,
    showToast,
    setLoading
  });

  if (!data) return <p>Cargando datos...</p>;

  return {
    location, navigate, data, setData, loading, setLoading, unseenPases, setUnseenPases, unseenHistorial, setUnseenHistorial,
    activeTecId, setActiveTecId, showNomenclaturaModal, setShowNomenclaturaModal, selectedYearId, setSelectedYearId,
    selectedCourseId, setSelectedCourseId, selectedPeriod, setSelectedPeriod, viewMode, setViewMode, pending, setPending,
    studentForm, setStudentForm, courseForm, setCourseForm, yearForm, setYearForm, userForm, setUserForm, tecForm, setTecForm,
    tecMode, setTecMode, editingTecId, setEditingTecId, previewDni, setPreviewDni, status, setStatus, editingCourseId, setEditingCourseId,
    editingStudent, setEditingStudent, editingUserId, setEditingUserId, transferringAlumno, setTransferringAlumno, transferMotivo, setTransferMotivo,
    pasingStudent, setPasingStudent, paseForm, setPaseForm, pasesSearch, setPasesSearch, notesSearch, setNotesSearch, selectedSubjectId, setSelectedSubjectId,
    selectedGroup, setSelectedGroup, editingPase, setEditingPase, editingObsStudent, setEditingObsStudent, viewingProf, setViewingProf,
    selectedRacStudent, setSelectedRacStudent, showPreviasModal, setShowPreviasModal, previasSearch, setPreviasSearch, dniError, setDniError, userError, setUserError,
    draggedMateriaIndex, setDraggedMateriaIndex, studentsSearch, setStudentsSearch, racSearch, setRacSearch, materiasSearch, setMateriasSearch,
    viewingFichaStudent, setViewingFichaStudent, isEditingFicha, setIsEditingFicha, isMobile, setIsMobile, isSelectionMode, setIsSelectionMode,
    selectedStudentIds, setSelectedStudentIds, showEndCycleModal, setShowEndCycleModal, endCycleForm, setEndCycleForm,
    truncateSubject, filteredSubjects, rotationFilteredStudents, roleText, loadData, handleDragStart, handleDragEnter, handleDragEnd,
    currentCourse, getSubjectUnits, gradeUnits, gradeWidth, canManageStudents, canTransfer, gradeValue, post, get, saveGrades, saveFicha,
    updateCell, addStudent, deleteStudent, transferStudent, prepareEditCourse, editCourse, toggleCourseActive, execPase, undoPase,
    execTransfer, savePaseEdit, updateStudentField, saveObs, editStudent, handleSaveFicha, addCourse, addYear, editYear, deleteYear,
    createUser, editUser, startEditUser, deleteUser, handleResetPassword, setYearAsCurrent, copyYearInfo, handleSetPassword,
    startEndCycle, handleEndCycleConfirm, handleViewFicha, getHistorial, startCreateTec, startEditTec, addTec, editTec, removeTec,
    handleUpdateLocks, handleUpdateSystemMode, handleUpdateMobileLogin, handleUpdateRACModular, handleUpdatePreceptorMode,
    handleUpdatePasswordMsg,
    duplicateTec, savePrevia, deletePrevia, page, setPage, handleUpdatePeriods,
    onPrintAllCourses, onPrintSeguimientoGlobal, onPrintPlanillasCurso, onPrintRAC_Student, onPrintRAC_AllStudents, onPrintParteDiario, onPrintParteDiarioGlobal, onPrintParteConInformacion,
    academicYearSummary, setAcademicYearSummary, getYearSummary
  };
}
