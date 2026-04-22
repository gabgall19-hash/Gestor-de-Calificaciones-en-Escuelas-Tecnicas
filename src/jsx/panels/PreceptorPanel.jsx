import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRightLeft, Book, BookOpen, Calendar, ClipboardList, Copy, Eye, FileText,
  GraduationCap, GripVertical, History, Lock, Megaphone, Plus, Printer,
  Save, Search, Settings, Smartphone, Trash2, Unlock, UserCog, Users, Wrench,
  AlertTriangle, CheckCircle2
} from 'lucide-react';

import {
  yearOptions, divisionOptions, shiftOptions, workshopI, workshopII, allWorkshopNames,
  emptyStudent, emptyCourse, emptyYear, emptyUser, emptyTec,
  truncate, truncateSubject, draftTec, simplifyTecName, formatGender, formatDNI, numberToWords
} from '../functions/PreceptorHelpers';

import { handlePrintAllCourses } from '../prints/SeguimientoA4';
import { handlePrintSeguimientoGlobal } from '../prints/SeguimientoAllA4';
import { handlePrintPlanillasCurso } from '../prints/CalificacionesA4';
import { handlePrintRAC } from '../prints/RACA4';
import { handlePrintParteDiario, handlePrintParteDiarioGlobal } from '../prints/ParteDiarioA4';

import MultiSelect from '../UI/MultiSelect';
import PreviasModal from '../components/PreviasModal';
import Modal from '../UI/Modal';
import GradesPanel from './GradesPanel';
import StudentManager from './StudentManager';
import RACPanel from './RACPanel';
import AuditPanel from './AuditPanel';
import SettingsPanel from './SettingsPanel';
import AcademicManager from './AcademicManager';
import PlanillasPanel from './PlanillasPanel';
import PasesPanel from './PasesPanel';
import AnunciosPanel from './AnunciosPanel';
import HorariosPanel from './HorariosPanel';
import StudentFichaModal from '../components/StudentFichaModal';
import apiService, { apiRequest, apiLoadData } from '../functions/apiService';

export default function PreceptorPanel({ user, onLogout, onPreviewStudent, showToast }) {
  const tabs = useMemo(() => {
    const list = [{ id: 'grades', label: 'Notas', icon: <ClipboardList size={16} /> }];
    if (user.rol !== 'profesor') {
      list.push({ id: 'materias', label: 'Materias', icon: <Book size={16} /> });
    }
    if (user.rol !== 'profesor' && user.rol !== 'preceptor_taller' && user.rol !== 'preceptor_ef') {
      list.push({ id: 'students', label: 'Alumnos', icon: <Users size={16} /> });
    }
    if (user.rol === 'admin' || user.rol === 'secretaria_de_alumnos' || user.rol === 'jefe_de_auxiliares' || user.rol === 'director' || user.rol === 'vicedirector') {
      list.push({ id: 'pases', label: 'Pases', icon: <ArrowRightLeft size={16} /> });
    }
    if (['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'preceptor', 'preceptor_taller', 'preceptor_ef', 'director', 'vicedirector'].includes(user.rol)) {
      if (user.rol !== 'preceptor_taller' && user.rol !== 'preceptor_ef') {
        list.push({ id: 'rac', label: 'RAC', icon: <FileText size={16} /> });
      }
      list.push({ id: 'historial', label: 'Historial', icon: <History size={16} /> });
    }
    if (['admin', 'secretaria_de_alumnos', 'director', 'vicedirector'].includes(user.rol)) {
      list.push({ id: 'anuncios', label: 'Anuncios', icon: <Megaphone size={16} /> });
      list.push({ id: 'settings', label: 'Ajustes', icon: <UserCog size={16} /> });
    }
    if (user.rol !== 'profesor') {
      list.push({ id: 'horarios', label: 'Horarios', icon: <Calendar size={16} /> });
    }
    list.push({ id: 'planillas', label: 'Generar Planillas', icon: <Save size={16} /> });
    return list;
  }, [user.rol]);

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

  const handleUpdateRACModular = async (enabled) => {
    try {
      await post('config', { action: 'update_rac_modular', valor: String(enabled) });
      showToast('Configuración de RAC Modular actualizada', 'success');
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
  
  const onPrintParteDiario = async () => {
    if (!selectedCourseId) return;
    const course = data.allCourses.find(c => c.id === selectedCourseId);
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

  if (viewingFichaStudent) {
    return (
      <div className="full-page-view" style={{ minHeight: '100vh', padding: isMobile ? '1rem' : '2.5rem', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        <div className="glass-card" style={{ maxWidth: '1000px', width: '100%', padding: isMobile ? '1.5rem' : '3.5rem', backdropFilter: 'blur(20px)', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <StudentFichaModal 
            student={viewingFichaStudent}
            onClose={() => setViewingFichaStudent(null)}
            onSave={handleSaveFicha}
            isEditing={isEditingFicha}
            setIsEditing={setIsEditingFicha}
            studentForm={studentForm}
            setStudentForm={setStudentForm}
            fullPage={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card compact-panel" style={{ width: '100%', maxWidth: 'none' }}>
      <div className="panel-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '45px' }} />
          <div>
            <h1 style={{ fontSize: '1.2rem', marginBottom: '0.1rem', fontWeight: '800' }}>
              INDUSTRIAL N°6 "X BRIGADA AEREA"
            </h1>
            <h2 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '500' }}>
              Gestión de Calificaciones
            </h2>
          </div>
        </div>
        <div style={{ textAlign: 'right', flex: 1, paddingRight: '1rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Bienvenido, {user.nombre}</p>
          {currentCourse && <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Curso: {currentCourse.year_nombre} · {currentCourse.label}</p>}
          {status && <p className="panel-status" style={{ display: 'inline-block', marginTop: '0.25rem' }}>{status}</p>}
        </div>
        <div className="panel-actions">
          <button className="btn" style={{ background: 'rgba(255,255,255,0.1)' }} onClick={onLogout}>Cerrar Sesión</button>
        </div>
      </div>
      <div className="tab-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab-btn${page === tab.id ? ' active' : ''}`}
            onClick={() => setPage(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              ...(tab.id === 'settings' ? { marginLeft: 'auto' } : {})
            }}
          >
            {tab.icon && <span style={{ marginRight: '6px', display: 'flex', alignItems: 'center' }}>{tab.icon}</span>}
            {tab.label}
            {((tab.id === 'pases' && unseenPases) || (tab.id === 'historial' && unseenHistorial)) && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                background: '#ff4757',
                borderRadius: '50%',
                border: '2px solid #1e1b4b',
                boxShadow: '0 0 5px rgba(255, 71, 87, 0.5)'
              }} />
            )}
          </button>
        ))}
      </div>
      <div className="panel-filters">
        <label className="label">Año Lectivo:</label>
        <select className="input-field compact-select" value={selectedYearId} onChange={async (e) => { setPending({}); await loadData(null, Number(e.target.value)); }}>{data.academicYears.map((year) => <option key={year.id} value={year.id}>{year.nombre}</option>)}</select>

        {data.courses.length > 0 && (
          <>
            <label className="label">Curso:</label>
            <select className="input-field compact-select" value={selectedCourseId ?? ''} onChange={async (e) => { setPending({}); await loadData(Number(e.target.value), selectedYearId); }}>
              {data.courses.map((course) => <option key={course.id} value={course.id}>{course.label} · {simplifyTecName(course.tecnicatura_nombre)}</option>)}
            </select>
          </>
        )}

        {page === 'grades' && (
          <>
            {(viewMode === 'bySubject' || viewMode === 'taller') ? (
              <>
                <label className="label">Materia:</label>
                <select
                  className="input-field compact-select"
                  value={selectedSubjectId || ''}
                  onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                >
                  {filteredSubjects.map((s) => (
                    <option key={s.id} value={s.id}>{truncateSubject(s.nombre, isMobile)}</option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <label className="label">Periodo:</label>
                <select className="input-field compact-select" value={selectedPeriod} onChange={(e) => setSelectedPeriod(Number(e.target.value))}>
                  {data.periodos.filter(p => {
                    const mode = data.config?.period_view_mode || 'completo';
                    if (mode === 'completo') return true;
                    if (mode === 'orientadores') return [1, 3, 5].includes(p.id);
                    if (mode === 'trimestrales') return [2, 4, 6].includes(p.id);
                    if (mode === 'finales') return [7, 8, 9, 10, 11].includes(p.id);
                    return true;
                  }).sort((a, b) => {
                    const order = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 10];
                    return order.indexOf(a.id) - order.indexOf(b.id);
                  }).map((periodo) => <option key={periodo.id} value={periodo.id}>{periodo.nombre}</option>)}
                </select>
              </>
            )}
          </>
        )}
        <div className="panel-stats"><span className="panel-stat"><Users size={15} /> {data.students.length} Alumnos</span><span className="panel-stat"><BookOpen size={15} /> {data.subjects.length} Materias</span></div>
      </div>

      {page === 'grades' && (
        <GradesPanel
          data={data}
          user={user}
          pending={pending}
          loading={loading}
          viewMode={viewMode}
          setViewMode={setViewMode}
          notesSearch={notesSearch}
          setNotesSearch={setNotesSearch}
          previewDni={previewDni}
          setPreviewDni={setPreviewDni}
          selectedSubjectId={selectedSubjectId}
          setSelectedSubjectId={setSelectedSubjectId}
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          isMobile={isMobile}
          updateCell={updateCell}
          gradeValue={gradeValue}
          saveGrades={saveGrades}
          filteredSubjects={filteredSubjects}
          getSubjectUnits={getSubjectUnits}
          rotationFilteredStudents={rotationFilteredStudents}
          setShowNomenclaturaModal={setShowNomenclaturaModal}
          setEditingObsStudent={setEditingObsStudent}
        />
      )}

      {page === 'planillas' && (
        <PlanillasPanel
          user={user}
          handlePrintPlanillasCurso={onPrintPlanillasCurso}
          handlePrintAllCourses={onPrintAllCourses}
          handlePrintSeguimientoGlobal={onPrintSeguimientoGlobal}
          handlePrintParteDiario={onPrintParteDiario}
          handlePrintParteDiarioGlobal={onPrintParteDiarioGlobal}
        />
      )}

      {page === 'horarios' && (
        <HorariosPanel 
          user={user} 
          selectedYearId={selectedYearId} 
          selectedCourseId={selectedCourseId}
          allCourses={data.allCourses}
        />
      )}

      {page === 'students' && (
        <StudentManager 
          user={user} data={data} loading={loading}
          studentForm={studentForm} setStudentForm={setStudentForm}
          studentsSearch={studentsSearch} setStudentsSearch={setStudentsSearch}
          canManageStudents={canManageStudents}
          canTransfer={canTransfer}
          addStudent={addStudent}
          deleteStudent={deleteStudent}
          setEditingStudent={setEditingStudent}
          setTransferringAlumno={setTransferringAlumno}
          setPasingStudent={setPasingStudent}
          setViewingFichaStudent={handleViewFicha}
          dniError={dniError} setDniError={setDniError}
          setSelectedStudentIds={setSelectedStudentIds}
          onEndCycle={() => setShowEndCycleModal(true)}
          onSetPassword={handleSetPassword}
        />
      )}

      {page === 'rac' && (
        <RACPanel
          data={data} selectedYearId={selectedYearId} racSearch={racSearch} setRacSearch={setRacSearch}
          handlePrintRAC={onPrintRAC} setSelectedRacStudent={setSelectedRacStudent} setShowPreviasModal={setShowPreviasModal}
          updateStudentField={updateStudentField}
          setViewingFichaStudent={handleViewFicha}
          isSelectionMode={isSelectionMode}
          setIsSelectionMode={setIsSelectionMode}
          selectedStudentIds={selectedStudentIds}
          setSelectedStudentIds={setSelectedStudentIds}
          onEndCycle={() => setShowEndCycleModal(true)}
        />
      )}

      {page === 'historial' && (
        <AuditPanel
          data={data}
          user={user}
          onDelete={async (action, logId) => {
            await post('historial_delete', { action, logId, courseId: data.selectedCourseId });
            loadData();
          }}
        />
      )}

      {page === 'materias' && (
        <AcademicManager
          user={user} data={data} selectedCourseId={selectedCourseId}
          materiasSearch={materiasSearch} setMateriasSearch={setMateriasSearch}
          handleUpdateLocks={handleUpdateLocks}
        />
      )}

      {page === 'pases' && (
        <PasesPanel
          user={user}
          data={data} pasesSearch={pasesSearch} setPasesSearch={setPasesSearch}
          setEditingPase={setEditingPase} undoPase={undoPase}
          onPreviewStudent={onPreviewStudent}
        />
      )}

      {page === 'anuncios' && (
        <AnunciosPanel
          data={data} post={post} loadData={loadData}
        />
      )}

      {page === 'settings' && (
        <SettingsPanel 
          user={user} data={data} isMobile={isMobile}
          editingUserId={editingUserId} setEditingUserId={setEditingUserId}
          userForm={userForm} setUserForm={setUserForm} emptyUser={emptyUser}
          yearForm={yearForm} setYearForm={setYearForm}
          activeTecId={activeTecId} setActiveTecId={setActiveTecId}
          startEditUser={startEditUser} deleteUser={deleteUser} setViewingProf={setViewingProf}
          handleUpdateSystemMode={handleUpdateSystemMode} 
          handleUpdatePreceptorMode={handleUpdatePreceptorMode}
          handleUpdateMobileLogin={handleUpdateMobileLogin} 
          handleUpdatePeriods={handleUpdatePeriods}
          handleUpdateRACModular={handleUpdateRACModular}
          addYear={addYear} editYear={editYear} deleteYear={deleteYear}
          startCreateTec={startCreateTec} startEditTec={startEditTec} duplicateTec={duplicateTec} removeTec={removeTec}
          prepareEditCourse={prepareEditCourse} toggleCourseActive={toggleCourseActive}
          handleUpdateMobileLogin={handleUpdateMobileLogin} handleResetPassword={handleResetPassword}
          setYearAsCurrent={setYearAsCurrent} copyYearInfo={copyYearInfo} startEndCycle={startEndCycle}
        />
      )}

      {showNomenclaturaModal && (
        <Modal title="Nomenclatura de Calificación" onClose={() => setShowNomenclaturaModal(false)}>
          <div className="nomenclatura-container">
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.2rem', lineHeight: '1.4' }}>
              Escala de valoración utilizada para los informes orientadores y planillas oficiales de la institución.
            </p>
            <table className="nomenclatura-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Sigla</th>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Descripción</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={{ padding: '8px' }}><strong>AE</strong></td><td style={{ padding: '8px' }}>Acredita con Excelencia (10)</td></tr>
                <tr><td style={{ padding: '8px' }}><strong>AD</strong></td><td style={{ padding: '8px' }}>Acredita con Distinción (9)</td></tr>
                <tr><td style={{ padding: '8px' }}><strong>AMS</strong></td><td style={{ padding: '8px' }}>Acredita Muy Satisfactoriamente (8)</td></tr>
                <tr><td style={{ padding: '8px' }}><strong>A</strong></td><td style={{ padding: '8px' }}>Acredita (7)</td></tr>
                <tr><td style={{ padding: '8px' }}><strong>NA</strong></td><td style={{ padding: '8px' }}>No Acredita (1-6)</td></tr>
                <tr><td style={{ padding: '8px' }}><strong>S/C</strong></td><td style={{ padding: '8px' }}>Sin Calificar (*)</td></tr>
              </tbody>
            </table>
            <div style={{ marginTop: '1.5rem', padding: '0.8rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', margin: 0 }}>
                Nota: Las calificaciones definitivas se expresan en números enteros (1 al 10).
              </p>
            </div>
          </div>
        </Modal>
      )}

      {showEndCycleModal && (
        <Modal onClose={() => setShowEndCycleModal(false)}>
          <div className="ficha-alumno">
            <div className="section-title"><AlertTriangle size={24} color="#e74c3c" /><h2>Terminación de Ciclo Lectivo</h2></div>
            <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
              Estás por procesar a <strong>{selectedStudentIds.length}</strong> alumnos seleccionados. 
              Este proceso registrará su historial escolar y los moverá al curso destino.
            </p>

            <div className="stack-form">
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '10px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={endCycleForm.isRepeater} 
                  onChange={(e) => setEndCycleForm(p => ({ ...p, isRepeater: e.target.checked }))} 
                  style={{ width: '20px', height: '20px' }}
                />
                <span style={{ fontWeight: 'bold' }}>¿Son alumnos REPITENTES?</span>
              </label>

              {!endCycleForm.isRepeater ? (
                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', opacity: 0.7 }}>Curso Destino (Año Siguiente):</label>
                  <select 
                    className="input-field" 
                    value={endCycleForm.targetCourseId || ''} 
                    onChange={(e) => setEndCycleForm(p => ({ ...p, targetCourseId: e.target.value }))}
                  >
                    <option value="">-- Seleccionar curso destino --</option>
                    {(data.allCourses ?? []).map(c => (
                      <option key={c.id} value={c.id}>{c.year_nombre} · {c.label} · {c.tecnicatura_nombre}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(46, 204, 113, 0.1)', borderRadius: '10px', border: '1px solid rgba(46, 204, 113, 0.2)' }}>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#2ecc71', fontWeight: 'bold' }}>
                    Modo Repitente Activo:
                  </p>
                  <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>
                    Los alumnos seleccionados se mantendrán en el mismo curso ({data.courses.find(c => c.id === selectedCourseId)?.label}) del próximo ciclo lectivo.
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button className="btn" style={{ flex: 1 }} onClick={() => setShowEndCycleModal(false)}>Cancelar</button>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1 }} 
                  disabled={!endCycleForm.isRepeater && !endCycleForm.targetCourseId}
                  onClick={handleEndCycleConfirm}
                >
                  Confirmar Transición
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {showPreviasModal && selectedRacStudent && (
        <PreviasModal
          student={selectedRacStudent}
          previas={data.previas.filter(p => p.alumno_id === selectedRacStudent.id)}
          subjects={data.allSubjects}
          onSave={savePrevia}
          onDelete={deletePrevia}
          onClose={() => { setShowPreviasModal(false); setSelectedRacStudent(null); }}
        />
      )}

      {tecMode !== 'list' && (
        <Modal title={tecMode === 'create' ? 'Nueva Tecnicatura' : 'Editar Estructura Curricular'} onClose={() => setTecMode('list')}>
          <form className="stack-form" onSubmit={tecMode === 'create' ? addTec : editTec}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input className="input-field" style={{ flex: 2 }} placeholder="Nombre de la Carrera" value={tecForm.nombre} onChange={(e) => setTecForm((p) => ({ ...p, nombre: e.target.value }))} required />
              <input className="input-field" placeholder="Identificador / Detalle" value={tecForm.detalle} onChange={(e) => setTecForm((p) => ({ ...p, detalle: e.target.value }))} />
            </div>

            <div style={{ marginTop: '1rem', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--primary)' }}>Estructura Curricular (Arrastra para reordenar)</div>
            <div className="subject-editor">
              {tecForm.materias.map((m, i) => (
                <div
                  key={m.id}
                  className={`subject-row ${draggedMateriaIndex === i ? 'dragging' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, i)}
                  onDragEnter={(e) => handleDragEnter(e, i)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className="drag-handle"><GripVertical size={16} /></div>
                  <input className="input-field" placeholder="Nombre de la Materia" value={m.nombre} onChange={(e) => setTecForm((p) => ({ ...p, materias: p.materias.map((x, idx) => idx === i ? { ...x, nombre: e.target.value } : x) }))} />
                  <select className="input-field" style={{ width: '160px' }} value={m.tipo} onChange={(e) => setTecForm((p) => ({ ...p, materias: p.materias.map((x, idx) => idx === i ? { ...x, tipo: e.target.value } : x) }))}>
                    <option value="comun">Materias Comunes</option>
                    <option value="modular">Modular (Teoría/Prác.)</option>
                    <option value="taller">Taller (Simple)</option>
                    <option value="taller_modular">Taller (Modular)</option>
                  </select>
                  <button className="icon-btn danger" type="button" onClick={() => setTecForm((p) => ({ ...p, materias: p.materias.length === 1 ? [{ id: `draft-${Date.now()}`, nombre: '', tipo: 'comun' }] : p.materias.filter((_, idx) => idx !== i) }))}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
              <button className="btn" type="button" onClick={() => setTecForm((p) => ({ ...p, materias: [...p.materias, { id: `draft-${Date.now()}`, nombre: '', tipo: 'comun' }] }))} style={{ flex: 1 }}><Plus size={16} /> Agregar Materia</button>
              <button className="btn btn-primary" type="submit" style={{ flex: 1 }}>{tecMode === 'create' ? 'Guardar Tecnicatura' : 'Guardar Cambios'}</button>
              <button className="btn" type="button" onClick={() => setTecMode('list')} style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }}>Cancelar</button>
            </div>
          </form>
        </Modal>
      )}

      {editingCourseId && (
        <Modal title="Editar Curso" onClose={() => setEditingCourseId(null)}>
          <form className="stack-form" onSubmit={editCourse}>
            <select className="input-field" value={courseForm.year_id} onChange={(e) => setCourseForm((p) => ({ ...p, year_id: e.target.value }))}>{data.academicYears.map((year) => <option key={year.id} value={year.id}>{year.nombre}</option>)}</select>
            <select className="input-field" value={courseForm.ano} onChange={(e) => setCourseForm((p) => ({ ...p, ano: e.target.value }))}>{yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}</select>
            <select className="input-field" value={courseForm.division} onChange={(e) => setCourseForm((p) => ({ ...p, division: e.target.value }))}>{divisionOptions.map((division) => <option key={division} value={division}>{division}</option>)}</select>
            <select className="input-field" value={courseForm.turno} onChange={(e) => setCourseForm((p) => ({ ...p, turno: e.target.value }))}>{shiftOptions.map((shift) => <option key={shift} value={shift}>{shift}</option>)}</select>
            <select className="input-field" value={courseForm.tecnicatura_id} onChange={(e) => setCourseForm((p) => ({ ...p, tecnicatura_id: e.target.value }))}>
              {data.tecnicaturas.map((tec) => <option key={tec.id} value={tec.id}>{tec.nombre}{tec.detalle ? ` (${tec.detalle})` : ''}</option>)}
            </select>
            {data.tecnicaturas.find(t => String(t.id) === String(courseForm.tecnicatura_id))?.detalle && (
              <p className="helper-text" style={{ fontStyle: 'italic', marginBottom: '0.5rem' }}>
                Identificador: {data.tecnicaturas.find(t => String(t.id) === String(courseForm.tecnicatura_id)).detalle}
              </p>
            )}
            <button className="btn btn-primary" type="submit"><Save size={16} /> Guardar Cambios</button>
          </form>
        </Modal>
      )}

      {transferringAlumno && (
        <Modal title={`Transferir Alumno: ${transferringAlumno.apellido}`} onClose={() => setTransferringAlumno(null)}>
          <p className="helper-text">Selecciona el curso destino para el alumno. Se eliminarán sus notas actuales en este año lectivo.</p>
          <div className="stack-form">
            <select id="transfer-select" className="input-field">
              <option value="">-- Seleccionar Curso --</option>
              {data.allCourses.filter(c => c.id !== transferringAlumno.course_id).map(c => <option key={c.id} value={c.id}>{c.year_nombre} · {c.label} · {c.tecnicatura_nombre}</option>)}
            </select>
            <textarea
              className="input-field"
              placeholder="Motivo de la transferencia (Opcional)"
              value={transferMotivo}
              onChange={(e) => setTransferMotivo(e.target.value)}
              rows="3"
            />
            <button className="btn btn-primary" onClick={() => execTransfer(transferringAlumno.id, document.getElementById('transfer-select').value)}><ArrowRightLeft size={16} /> Confirmar Transferencia</button>
          </div>
        </Modal>
      )}

      {editingStudent && (
        <Modal title="Editar Alumno" onClose={() => { setEditingStudent(null); setDniError(''); }}>
          <form className="stack-form" onSubmit={editStudent}>
            <input className="input-field" placeholder="Apellido(s)" value={editingStudent.apellido} onChange={(e) => setEditingStudent(p => ({ ...p, apellido: e.target.value }))} />
            <input className="input-field" placeholder="Nombre(s)" value={editingStudent.nombre} onChange={(e) => setEditingStudent(p => ({ ...p, nombre: e.target.value }))} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                className="input-field"
                placeholder="DNI (Opcional)"
                value={editingStudent.dni}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                  setEditingStudent(p => ({ ...p, dni: val }));
                  setDniError('');
                }}
              />
              <select
                className="input-field"
                value={editingStudent.genero}
                onChange={(e) => setEditingStudent(p => ({ ...p, genero: e.target.value }))}
              >
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input className="input-field" placeholder="Matrícula" value={editingStudent.matricula || ''} onChange={(e) => setEditingStudent(p => ({ ...p, matricula: e.target.value }))} />
              <input className="input-field" placeholder="Legajo" value={editingStudent.legajo || ''} onChange={(e) => setEditingStudent(p => ({ ...p, legajo: e.target.value }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input className="input-field" placeholder="Libro" value={editingStudent.libro || ''} onChange={(e) => setEditingStudent(p => ({ ...p, libro: e.target.value }))} />
              <input className="input-field" placeholder="Folio" value={editingStudent.folio || ''} onChange={(e) => setEditingStudent(p => ({ ...p, folio: e.target.value }))} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={!editingStudent.nombre || !editingStudent.apellido}><Save size={16} /> Guardar Cambios</button>
            {dniError && <div className="error-message" style={{ color: '#ff4d4d', fontSize: '0.85rem', marginTop: '8px', fontWeight: 'bold', textAlign: 'center' }}>{dniError}</div>}
          </form>
        </Modal>
      )}

      {pasingStudent && (
        <Modal title={`Dar de Pase: ${pasingStudent.apellido}`} onClose={() => setPasingStudent(null)}>
          <p className="helper-text">Registrar la salida del alumno de la institución. Quedará guardado en el historial de Pases.</p>
          <form className="stack-form" onSubmit={execPase}>
            <input className="input-field" placeholder="Institución Destino" value={paseForm.institucion} onChange={(e) => setPaseForm(p => ({ ...p, institucion: e.target.value }))} required />
            <input className="input-field" placeholder="Fecha (dd/mm/aaaa)" value={paseForm.fecha} onChange={(e) => setPaseForm(p => ({ ...p, fecha: e.target.value }))} required />
            <textarea className="input-field" placeholder="Motivo del pase (Opcional)" value={paseForm.motivo} onChange={(e) => setPaseForm(p => ({ ...p, motivo: e.target.value }))} rows="3" />
            <button className="btn btn-primary" type="submit" style={{ background: 'var(--success)' }}><GraduationCap size={16} /> Confirmar Pase</button>
          </form>
        </Modal>
      )}

      {editingPase && (
        <Modal title="Editar Registro de Pase" onClose={() => setEditingPase(null)}>
          <form className="stack-form" onSubmit={savePaseEdit}>
            <p className="helper-text">{editingPase.nombre_apellido} ({formatDNI(editingPase.dni)})</p>
            <label className="label">Curso Origen:</label>
            <select className="input-field" value={editingPase.course_id_origen} onChange={(e) => setEditingPase(p => ({ ...p, course_id_origen: Number(e.target.value) }))}>
              {data.allCourses.map(c => <option key={c.id} value={c.id}>{c.year_nombre} · {c.label} · {c.tecnicatura_nombre}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <label className="label">Institución Destino:</label>
                <input className="input-field" value={editingPase.institucion_destino} onChange={(e) => setEditingPase(p => ({ ...p, institucion_destino: e.target.value }))} required />
              </div>
              <div style={{ width: '150px' }}>
                <label className="label">Fecha:</label>
                <input className="input-field" value={editingPase.fecha_pase} onChange={(e) => setEditingPase(p => ({ ...p, fecha_pase: e.target.value }))} required />
              </div>
            </div>
            <label className="label">Motivo:</label>
            <textarea className="input-field" value={editingPase.motivo === '...' ? '' : editingPase.motivo} onChange={(e) => setEditingPase(p => ({ ...p, motivo: e.target.value }))} placeholder="..." rows="3"></textarea>
            <label className="label">Estado:</label>
            <select className="input-field" value={editingPase.estado || 'De pase'} onChange={(e) => setEditingPase(p => ({ ...p, estado: e.target.value }))}>
              <option value="De pase">De pase (Rojo)</option>
              <option value="En proceso de pase">En proceso de pase (Naranja)</option>
            </select>
            <button className="btn btn-primary" type="submit"><Save size={16} /> Guardar Cambios</button>
          </form>
        </Modal>
      )}

      {editingObsStudent && (
        <Modal title={`Observaciones: ${editingObsStudent.apellido}`} onClose={() => setEditingObsStudent(null)}>
          <form className="stack-form" onSubmit={saveObs}>
            <p className="helper-text">Estas notas aparecerán en el boletín oficial del alumno. Puedes incluir párrafos y saltos de línea.</p>
            <textarea
              className="input-field"
              placeholder="Escribe aquí las observaciones pedagógicas..."
              value={editingObsStudent.observaciones || ''}
              onChange={(e) => setEditingObsStudent(p => ({ ...p, observaciones: e.target.value }))}
              rows="8"
              style={{ resize: 'vertical', minHeight: '150px' }}
            />
            <button className="btn btn-primary" type="submit"><Save size={16} /> Guardar Observaciones</button>
          </form>
        </Modal>
      )}

      {viewingProf && (
        <Modal title={`Asignaciones: ${viewingProf.nombre}`} onClose={() => setViewingProf(null)}>
          <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '12px' }}>
            {(() => {
              const pairs = (viewingProf.professor_subject_ids || '').split(',').filter(Boolean);
              if (pairs.length === 0) return <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: '2rem 0' }}>Este profesor no tiene materias asignadas.</p>;

              return pairs.map(pair => {
                const [cid, sid] = pair.split('-');
                const course = data.allCourses.find(c => String(c.id) === String(cid));
                const subject = data.allSubjects.find(s => String(s.id) === String(sid));

                return (
                  <div key={pair} style={{
                    padding: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    marginBottom: '10px'
                  }}>
                    <div style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '0.95rem' }}>{subject?.nombre || 'Materia no encontrada'}</div>
                    <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '2px' }}>{course?.label} ({course?.year_nombre}) · {simplifyTecName(course?.tecnicatura_nombre)}</div>
                    {subject?.es_taller === 1 && <div style={{ fontSize: '0.65rem', color: '#f39c12', fontWeight: '900', marginTop: '4px' }}>TALLER</div>}
                  </div>
                );
              });
            })()}
          </div>
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
            <button className="btn" onClick={() => setViewingProf(null)} style={{ background: 'rgba(255,255,255,0.1)' }}>Cerrar</button>
          </div>
        </Modal>
      )}

      {editingUserId && (
        <Modal title={editingUserId === 'new' ? 'Crear Usuario' : 'Editar Usuario'} onClose={() => { setEditingUserId(null); setUserForm(emptyUser); }}>
          <form onSubmit={editingUserId === 'new' ? createUser : editUser} className="stack-form" style={{ maxHeight: '80vh', overflowY: 'auto', paddingRight: '10px' }}>
            <label className="label">Información Personal</label>
            <input className="input-field" placeholder="Nombre completo" value={userForm.nombre} onChange={(e) => setUserForm(p => ({ ...p, nombre: e.target.value }))} required />
            <div className="grid-2">
              <input className="input-field" placeholder="Usuario" value={userForm.username} onChange={(e) => setUserForm(p => ({ ...p, username: e.target.value }))} required />
              <input className="input-field" placeholder="Contraseña" value={userForm.password} onChange={(e) => setUserForm(p => ({ ...p, password: e.target.value }))} required />
            </div>

            <label className="label">Rol en el Sistema</label>
            <select className="input-field" value={userForm.rol} onChange={(e) => setUserForm(p => ({ ...p, rol: e.target.value }))}>
              <option value="admin">Administrador</option>
              <option value="secretaria_de_alumnos">Secretaria de Alumnos</option>
              <option value="jefe_de_auxiliares">Jefe de Auxiliares</option>
              <option value="director">Director</option>
              <option value="vicedirector">Vicedirector</option>
              <option value="preceptor">Preceptor</option>
              <option value="preceptor_taller">Preceptor Taller</option>
              <option value="preceptor_ef">Preceptor Ed. Física</option>
              <option value="profesor">Profesor</option>
            </select>

            {(userForm.rol === 'preceptor' || userForm.rol === 'preceptor_taller' || userForm.rol === 'preceptor_ef') && (
              <div className="stack-form" style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <label className="label" style={{ color: 'var(--primary)' }}>Asignación de Preceptoría</label>
                <div className="stack-form">
                  <label className="label">Curso Responsable</label>
                  <select className="input-field" value={userForm.preceptor_course_id || ''} onChange={(e) => setUserForm(p => ({ ...p, preceptor_course_id: e.target.value }))}>
                    <option value="">-- Seleccionar Curso --</option>
                    {data.allCourses.map(c => <option key={c.id} value={c.id}>{c.year_nombre} · {c.label} · {simplifyTecName(c.tecnicatura_nombre)}</option>)}
                  </select>
                </div>
                
                <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                  <input 
                    type="checkbox" 
                    id="is_prof_check"
                    checked={userForm.is_professor_hybrid || (userForm.professor_subject_ids && userForm.professor_subject_ids.length > 0)} 
                    onChange={(e) => setUserForm(p => ({ ...p, is_professor_hybrid: e.target.checked }))} 
                  />
                  <label htmlFor="is_prof_check" style={{ fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}>¿También es Profesor? (Asignar materias extra)</label>
                </div>
              </div>
            )}

            {(userForm.rol === 'profesor' || userForm.is_professor_hybrid || (userForm.rol !== 'admin' && userForm.rol !== 'jefe_de_auxiliares' && userForm.professor_subject_ids && userForm.professor_subject_ids.length > 0)) && (
              <div style={{ marginTop: '1rem' }}>
                <MultiSelect
                  label="Asignar Materias (Como Profesor)"
                  options={data.allCourses.flatMap(c =>
                    data.allSubjects.filter(s => s.tecnicatura_id === c.tecnicatura_id).map(s => ({
                      id: `${c.id}-${s.id}`,
                      label: `${c.label} (${c.year_nombre}) · ${truncateSubject(s.nombre)}`
                    }))
                  )}
                  selected={userForm.professor_subject_ids || []}
                  onChange={(vals) => setUserForm(p => ({ ...p, professor_subject_ids: vals }))}
                />
              </div>
            )}

            <button className="btn btn-primary" type="submit" style={{ marginTop: '1rem' }}><Save size={16} /> {editingUserId === 'new' ? 'Crear Usuario' : 'Guardar Cambios'}</button>
          </form>
        </Modal>
      )}

      {viewingFichaStudent && (
        <StudentFichaModal 
          student={viewingFichaStudent}
          onClose={() => { setViewingFichaStudent(null); setIsEditingFicha(false); }}
          onSave={handleSaveFicha}
          isEditing={isEditingFicha}
          setIsEditing={setIsEditingFicha}
          studentForm={studentForm}
          setStudentForm={setStudentForm}
          getHistorial={getHistorial}
        />
      )}
    </div>
  );
}
