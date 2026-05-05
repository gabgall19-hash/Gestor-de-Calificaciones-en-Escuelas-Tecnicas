import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Save,
  Trash2, 
  Printer, 
  Plus, 
  X, 
  CheckCircle2,
  AlertCircle,
  GripVertical,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { TableSkeleton } from '../UI/Skeleton';
import apiService from '../functions/apiService';
import SaveStatusButton from '../UI/SaveStatusButton';
import '../../css/panels/HorariosPanel.css';
import { handlePrintHorario } from '../prints/Horario_A4';
import { handlePrintHorario_AllGrades } from '../prints/Horario_AllGrades_A4';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
const HORARIOS_TEMPLATES = {
  'Mañana': {
    'Básico': [
      { type: 'slot', time: '07:10 a 07:50 hrs' },
      { type: 'slot', time: '07:50 a 08:30 hrs' },
      { type: 'break', label: 'Recreo', time: '' },
      { type: 'slot', time: '08:40 a 09:20 hrs' },
      { type: 'slot', time: '09:20 a 10:00 hrs' },
      { type: 'break', label: 'Recreo', time: '' },
      { type: 'slot', time: '10:10 a 10:50 hrs' },
      { type: 'slot', time: '10:50 a 11:30 hrs' },
      { type: 'break', label: 'Recreo', time: '' },
      { type: 'slot', time: '11:40 a 12:20 hrs' },
      { type: 'slot', time: '12:20 a 13:00 hrs' },
    ],
    'Superior': [
      { type: 'slot', time: '07:10 a 07:50 hrs' },
      { type: 'slot', time: '07:50 a 08:30 hrs' },
      { type: 'slot', time: '08:30 a 09:10 hrs' },
      { type: 'break', label: 'Recreo', time: '' },
      { type: 'slot', time: '09:20 a 10:00 hrs' },
      { type: 'slot', time: '10:00 a 10:40 hrs' },
      { type: 'break', label: 'Recreo', time: '' },
      { type: 'slot', time: '10:50 a 11:30 hrs' },
      { type: 'slot', time: '11:30 a 12:10 hrs' },
      { type: 'slot', time: '12:10 a 13:00 hrs' },
    ]
  },
  'Tarde': {
    'Básico': [
      { type: 'slot', time: '13:20 a 14:00 hrs' },
      { type: 'slot', time: '14:00 a 14:40 hrs' },
      { type: 'break', label: 'Recreo', time: '' },
      { type: 'slot', time: '14:50 a 15:30 hrs' },
      { type: 'slot', time: '15:30 a 16:10 hrs' },
      { type: 'break', label: 'Recreo', time: '' },
      { type: 'slot', time: '16:20 a 17:00 hrs' },
      { type: 'slot', time: '17:00 a 17:40 hrs' },
      { type: 'break', label: 'Recreo', time: '' },
      { type: 'slot', time: '17:50 a 18:30 hrs' },
      { type: 'slot', time: '18:30 a 19:00 hrs' },
    ],
    'Superior': [
      { type: 'slot', time: '13:20 a 14:00 hrs' },
      { type: 'slot', time: '14:00 a 14:40 hrs' },
      { type: 'slot', time: '14:40 a 15:20 hrs' },
      { type: 'break', label: 'Recreo', time: '' },
      { type: 'slot', time: '15:30 a 16:10 hrs' },
      { type: 'slot', time: '16:20 a 17:00 hrs' },
      { type: 'break', label: 'Recreo', time: '' },
      { type: 'slot', time: '17:10 a 17:50 hrs' },
      { type: 'slot', time: '17:50 a 18:40 hrs' },
      { type: 'slot', time: '18:40 a 19:00 hrs' },
    ]
  }
};
const normalize = (str) => (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const isSlotRow = (row) => row?.type !== 'break' && !!row?.days;
const getSubjectLogicalId = (subject) => {
  const parsedOrder = Number(subject?.orden);
  return Number.isFinite(parsedOrder) ? parsedOrder + 1 : null;
};
const getCanonicalSubjectName = (subjectName) => {
  const normalizedName = normalize(subjectName).replace(/\s+/g, ' ').trim();

  if (!normalizedName) return '';

  const normalizedForeignLanguage = normalizedName
    .replace(/lenguaje extranjero/g, 'lengua extranjera')
    .replace(/lengua extrajera/g, 'lengua extranjera')
    .replace(/lengua extrangera/g, 'lengua extranjera')
    .replace(/ingles tecnico/g, 'ingles')
    .replace(/ingl tecnico/g, 'ingles')
    .replace(/ing\. tecnico/g, 'ingles')
    .replace(/\s+/g, ' ')
    .trim();

  if (normalizedForeignLanguage.includes('lengua extranjera') && normalizedForeignLanguage.includes('ingles')) {
    return 'lengua extranjera - ingles';
  }

  return normalizedForeignLanguage;
};
const getSubjectKeyCandidates = (subjectId, subjectName, subjectLogicalId = null) => {
  const normalizedName = normalize(subjectName).replace(/\s+/g, ' ').trim();
  const canonicalName = getCanonicalSubjectName(subjectName);
  const keys = [];

  if (canonicalName) {
    keys.push(`subject-canonical-${canonicalName}`);
  }
  if (subjectLogicalId) {
    keys.push(`subject-logical-${subjectLogicalId}`);
  }
  if (canonicalName && canonicalName !== normalizedName) {
    keys.push(`subject-alias-${canonicalName}`);
  }
  if (subjectId) {
    keys.push(`subject-${subjectId}`);
  }
  if (normalizedName) {
    keys.push(`subject-name-${normalizedName}`);
  }

  return [...new Set(keys)];
};
const getSubjectMetaKey = (subjectId, subjectName, subjectLogicalId = null) => getSubjectKeyCandidates(subjectId, subjectName, subjectLogicalId)[0] || `subject-name-${normalize(subjectName)}`;
const isModularWorkshop = (subject) => subject?.es_taller === 1 && String(subject?.tipo || '').toLowerCase().includes('modular');

const HorariosPanel = ({ user, selectedYearId, selectedCourseId, allCourses, subjects = [], allSubjects = [], users = [] }) => {
  const [grid, setGrid] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState('');
  const [isPrintingAll, setIsPrintingAll] = useState(false);

  const canEdit = ['admin', 'secretaria_de_alumnos', 'director', 'vicedirector', 'regente_profesores'].includes(user.rol);
  const professors = users.filter((userRow) =>
    ['profesor', 'preceptor', 'preceptor_taller', 'preceptor_ef'].includes(userRow.rol) || userRow.is_professor_hybrid === 1
  );

  const currentDay = new Date().getDay();
  const initialMobileDay = currentDay >= 1 && currentDay <= 5 ? currentDay - 1 : 0;
  const [mobileDayIndex, setMobileDayIndex] = useState(initialMobileDay);

  const handlePrevDay = () => setMobileDayIndex(prev => Math.max(0, prev - 1));
  const handleNextDay = () => setMobileDayIndex(prev => Math.min(4, prev + 1));

  const buildSnapshot = (nextMeta, nextGrid) => JSON.stringify({ meta: nextMeta || {}, grid: nextGrid || [] });

  useEffect(() => {
    if (selectedCourseId) {
      handleCourseSelect(selectedCourseId);
    } else {
      setGrid([]);
      setMeta({});
      setLastSavedSnapshot('');
    }
  }, [selectedCourseId]);

  const handleCourseSelect = async (courseId) => {
    setLoading(true);
    const currentCourse = allCourses?.find(c => c.id === courseId);
    try {
      const res = await apiService.get('horarios', { userId: user.id, courseId });
      let parsed;
      try {
        parsed = JSON.parse(res.grid_data || '[]');
      } catch (e) {
        parsed = [];
      }
      
      let finalGrid = [];
      let nextMeta = {};
      if (Array.isArray(parsed)) {
        finalGrid = parsed;
        setMeta({});
      } else {
        finalGrid = parsed.grid || [];
        nextMeta = parsed.meta || {};
        setMeta(nextMeta);
      }

      // Add "hrs" if missing and auto-map IDs if missing for backward compatibility
      finalGrid = finalGrid.map(row => {
        if (isSlotRow(row)) {
          const newDays = { ...row.days };
          Object.keys(newDays).forEach(day => {
            const cell = newDays[day];
            if ((!cell.subject_id || !cell.subject_logical_id) && cell.subject) {
              const sub = cell.subject_logical_id
                ? subjects.find((subject) => getSubjectLogicalId(subject) === Number(cell.subject_logical_id))
                : subjects.find(s => normalize(s.nombre) === normalize(cell.subject));
              if (sub) {
                cell.subject_id = sub.id;
                cell.subject_logical_id = getSubjectLogicalId(sub);
              }
            }
            if (!cell.teacher_id && cell.teacher) {
              const teacherName = cell.teacher.replace('Prof. ', '').trim();
              const prof = professors.find(p => normalize(p.nombre) === normalize(teacherName));
              if (prof) cell.teacher_id = prof.id;
            }
          });
          return { ...row, days: newDays, time: row.time && !row.time.toLowerCase().includes('hrs') ? `${row.time} hrs` : row.time };
        }
        return {
          ...row,
          time: row.time && !row.time.toLowerCase().includes('hrs') ? `${row.time} hrs` : row.time
        };
      });

      const syncWithTemplate = (currentGrid) => {
        const turno = currentCourse?.turno;
        const ano = parseInt(currentCourse?.ano, 10);
        const ciclo = (ano && ano <= 3) ? 'Básico' : 'Superior';
        const template = HORARIOS_TEMPLATES[turno]?.[ciclo];
        
        if (!template) return currentGrid;
        
        const isCompatible = currentGrid.length === template.length && 
                             currentGrid.every((row, i) => row.type === template[i].type && row.time === template[i].time);
                             
        if (isCompatible && currentGrid.length > 0) return currentGrid;
        
        // Robust data extraction: get all rows that have actual content
        const existingSlotsWithData = currentGrid.filter(r => r.days && Object.values(r.days).some(d => d.subject));
        
        let slotCounter = 0;
        return template.map(tRow => {
          if (tRow.type === 'break') return { ...tRow };
          
          const existing = existingSlotsWithData[slotCounter];
          slotCounter++;
          
          return {
            ...tRow,
            days: existing?.days || DAYS.reduce((acc, day) => ({ 
              ...acc, 
              [day]: { subject: '', teacher: '', subject_id: null, subject_logical_id: null, teacher_id: null } 
            }), {})
          };
        });
      };

      const synchronizedGrid = syncWithTemplate(finalGrid);
      
      // AUTO-FIX: Aplicar suplentes desde meta automáticamente
      if (nextMeta && nextMeta.subjectAssignments) {
        synchronizedGrid.forEach(row => {
          if (!isSlotRow(row)) return;
          DAYS.forEach(day => {
            const cell = row.days[day];
            if (!cell || !cell.subject || cell.subject.toUpperCase() === 'HORARIO LIBRE') return;
            
            const currentTeacherStr = String(cell.teacher || '').replace('Prof. ', '').trim().toLowerCase();
            if (!currentTeacherStr) return;

            for (const key in nextMeta.subjectAssignments) {
              const assignment = nextMeta.subjectAssignments[key];
              const substitutes = Array.isArray(assignment.substituteTeachers) ? assignment.substituteTeachers : [assignment.substituteTeacherName || ''];
              const actuals = Array.isArray(assignment.actualTeachers) ? assignment.actualTeachers : [assignment.actualTeacherName || ''];
              
              const subIndex = substitutes.findIndex(sub => sub && sub.toLowerCase().includes(currentTeacherStr));
              const actIndex = actuals.findIndex(act => act && act.toLowerCase().includes(currentTeacherStr));
              
              if (subIndex !== -1 && currentTeacherStr.length > 3) {
                cell.teacher = actuals[subIndex] || actuals[0] || '';
                cell.substitute_teacher = substitutes[subIndex];
                
                const actIds = Array.isArray(assignment.actualTeacherIds) ? assignment.actualTeacherIds : [assignment.actualTeacherId || null];
                const subIds = Array.isArray(assignment.substituteTeacherIds) ? assignment.substituteTeacherIds : [assignment.substituteTeacherId || null];
                cell.teacher_id = actIds[subIndex] || actIds[0] || null;
                cell.substitute_teacher_id = subIds[subIndex] || null;
                break;
              } else if (actIndex !== -1 && substitutes[actIndex] && currentTeacherStr.length > 3) {
                cell.substitute_teacher = substitutes[actIndex];
                const subIds = Array.isArray(assignment.substituteTeacherIds) ? assignment.substituteTeacherIds : [assignment.substituteTeacherId || null];
                cell.substitute_teacher_id = subIds[actIndex] || null;
                break;
              }
            }
          });
        });
      }

      setGrid(synchronizedGrid);
      setLastSavedSnapshot(buildSnapshot(nextMeta, synchronizedGrid));
    } catch (err) {
      console.error('Error fetching schedule:', err);
      showMsg('error', 'Error al cargar horario');
      setGrid([]);
      setMeta({});
      setLastSavedSnapshot('');
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSave = async () => {
    if (!selectedCourseId || !canEdit) return;

    // Validation
    for (let r = 0; r < grid.length; r++) {
      const row = grid[r];
      if (row.type === 'slot' && row.days) {
        for (const day of DAYS) {
          const cell = row.days[day];
          if (cell?.subject && cell.subject.toUpperCase() !== 'HORARIO LIBRE') {
            if (!cell.subject_id) {
              showMsg('error', `Materia inexistente: "${cell.subject}" en ${day} ${row.time}`);
              return;
            }
            if (cell.teacher && !cell.teacher_id) {
              showMsg('error', `Profesor inexistente: "${cell.teacher}" en ${day} ${row.time}`);
              return;
            }
          }
        }
      }
    }

    setIsSaving(true);
    try {
      await apiService.post('horarios', user.id, {
        action: 'save',
        course_id: selectedCourseId,
        grid_data: JSON.stringify({ meta, grid })
      });
      setLastSavedSnapshot(buildSnapshot(meta, grid));
      showMsg('success', 'Horario guardado correctamente');
    } catch (err) {
      console.error('Error saving schedule:', err);
      showMsg('error', 'Error al guardar horario');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCourseId || !canEdit || !window.confirm('¿Estás seguro de eliminar el horario de este curso?')) return;
    try {
      await apiService.post('horarios', user.id, {
        action: 'delete',
        course_id: selectedCourseId
      });
      setGrid([]);
      setMeta({});
      setLastSavedSnapshot(buildSnapshot({}, []));
      showMsg('success', 'Horario eliminado');
    } catch (err) {
      showMsg('error', 'Error al eliminar');
    }
  };


  const addRow = (type = 'slot') => {
    if (!canEdit) return;
    if (type === 'break') {
      setGrid([...grid, { type: 'break', label: 'RECREO', time: '00:00 hrs' }]);
    } else {
      setGrid([...grid, {
        type: 'slot',
        time: '00:00 a 00:00 hrs',
        days: DAYS.reduce((acc, day) => ({ ...acc, [day]: { subject: '', teacher: '', subject_id: null, subject_logical_id: null, teacher_id: null } }), {})
      }]);
    }
  };

  const removeRow = (index) => {
    if (!canEdit) return;
    const newGrid = [...grid];
    newGrid.splice(index, 1);
    setGrid(newGrid);
  };

  const updateCell = (rowIndex, day, field, value) => {
    if (!canEdit) return;
    const newGrid = [...grid];
    if (day === 'time') {
      newGrid[rowIndex].time = value;
    } else if (day === 'label') {
      newGrid[rowIndex].label = value;
    } else {
      if (!newGrid[rowIndex].days) newGrid[rowIndex].days = {};
      if (!newGrid[rowIndex].days[day]) newGrid[rowIndex].days[day] = { subject: '', teacher: '', subject_id: null, subject_logical_id: null, teacher_id: null };
      
      newGrid[rowIndex].days[day][field] = value;
      
      // Auto-fill ID or Name based on selection/typing
      if (field === 'subject') {
        const sub = subjects.find(s => normalize(s.nombre) === normalize(value));
        newGrid[rowIndex].days[day].subject_id = sub ? sub.id : null;
        newGrid[rowIndex].days[day].subject_logical_id = sub ? getSubjectLogicalId(sub) : null;
      } else if (field === 'teacher') {
        const teacherName = value.replace('Prof. ', '').trim();
        const prof = professors.find(p => normalize(p.nombre) === normalize(teacherName));
        newGrid[rowIndex].days[day].teacher_id = prof ? prof.id : null;
      } else if (field === 'subject_id') {
        const sub = subjects.find(s => s.id === Number(value));
        newGrid[rowIndex].days[day].subject = sub ? sub.nombre : '';
        newGrid[rowIndex].days[day].subject_logical_id = sub ? getSubjectLogicalId(sub) : null;
      } else if (field === 'teacher_id') {
        const prof = professors.find(p => p.id === Number(value));
        newGrid[rowIndex].days[day].teacher = prof ? prof.nombre : '';
      }
    }
    setGrid(newGrid);
  };

  const handlePrint = () => {
    handlePrintHorario(selectedCourse, grid);
  };

  const handlePrintAll = async () => {
    setIsPrintingAll(true);
    try {
      const res = await apiService.get('horarios', { userId: user.id });
      handlePrintHorario_AllGrades(allCourses, res);
    } catch (err) {
      console.error('Error fetching all schedules:', err);
      showMsg('error', 'Error al cargar todos los horarios');
    } finally {
      setIsPrintingAll(false);
    }
  };

  const findSubjectByLogicalId = (logicalId) => {
    const parsedLogicalId = Number(logicalId);
    return Number.isFinite(parsedLogicalId)
      ? subjects.find((subject) => getSubjectLogicalId(subject) === parsedLogicalId)
      : null;
  };
  const findSubjectByName = (name) => {
    const normalizedName = normalize(name);
    const canonicalName = getCanonicalSubjectName(name);
    return subjects.find((subject) => normalize(subject.nombre) === normalizedName)
      || subjects.find((subject) => getCanonicalSubjectName(subject.nombre) === canonicalName);
  };
  const findProfessorByName = (name) => {
    const teacherName = String(name || '').replace('Prof. ', '').trim();
    return professors.find((professor) => normalize(professor.nombre) === normalize(teacherName));
  };
  const getSubjectAssignment = (subjectId, subjectName, subjectLogicalId = null, extraKeys = []) => {
    const assignmentKeys = [...new Set([...extraKeys, ...getSubjectKeyCandidates(subjectId, subjectName, subjectLogicalId)])];
    const assignment = assignmentKeys.map((key) => subjectAssignments[key]).find(Boolean) || {};
    return {
      key: assignmentKeys[0] || getSubjectMetaKey(subjectId, subjectName, subjectLogicalId),
      assignment,
      assignmentKeys
    };
  };
  const subjectAssignments = meta?.subjectAssignments && typeof meta.subjectAssignments === 'object'
    ? meta.subjectAssignments
    : {};
  const getTeacherValue = (teacherName, teacherId) => {
    if (teacherId) {
      const byId = professors.find((professor) => professor.id === Number(teacherId));
      if (byId) return { name: byId.nombre, id: byId.id };
    }
    const byName = findProfessorByName(teacherName);
    return {
      name: teacherName ? String(teacherName).replace('Prof. ', '').trim() : '',
      id: byName?.id || null
    };
  };
  const getSubjectTypeLabel = (subject) => {
    if (!subject) return 'TEORIA';
    return subject.es_taller === 1 ? 'TALLER' : 'TEORIA';
  };
  const getTeacherSlots = (assignment, slotCount, fallbackNames = []) => {
    const assignedActual = Array.isArray(assignment?.actualTeachers)
      ? assignment.actualTeachers
      : [assignment?.actualTeacherName || ''];
    const assignedActualIds = Array.isArray(assignment?.actualTeacherIds)
      ? assignment.actualTeacherIds
      : [assignment?.actualTeacherId || null];
    const assignedSubstitute = Array.isArray(assignment?.substituteTeachers)
      ? assignment.substituteTeachers
      : [assignment?.substituteTeacherName || ''];
    const assignedSubstituteIds = Array.isArray(assignment?.substituteTeacherIds)
      ? assignment?.substituteTeacherIds
      : [assignment?.substituteTeacherId || null];
    const sourceSlots = Array.isArray(assignment?.teacherSlots) && assignment.teacherSlots.length > 0
      ? assignment.teacherSlots
      : fallbackNames;

    return Array.from({ length: slotCount }, (_, index) => {
      const actual = getTeacherValue(assignedActual[index] || sourceSlots[index] || '', assignedActualIds[index] || null);
      const substitute = getTeacherValue(assignedSubstitute[index] || '', assignedSubstituteIds[index] || null);
      return {
        slot: index,
        sourceName: sourceSlots[index] || '',
        actualName: actual.name,
        actualId: actual.id,
        substituteName: substitute.name,
        substituteId: substitute.id
      };
    });
  };
  const applyTeacherToSubject = (subjectRow, field, slotIndex, teacherValue) => {
    if (!canEdit) return;

    const nextTeacher = getTeacherValue(teacherValue, null);
    const nextSlots = subjectRow.teacherSlots.map((slot, index) => {
      if (index !== slotIndex) return slot;
      return field === 'actual'
        ? { ...slot, actualName: nextTeacher.name, actualId: nextTeacher.id }
        : { ...slot, substituteName: nextTeacher.name, substituteId: nextTeacher.id };
    });
    const nextAssignment = {
      teacherSlots: nextSlots.map((slot) => slot.sourceName || ''),
      actualTeachers: nextSlots.map((slot) => slot.actualName || ''),
      actualTeacherIds: nextSlots.map((slot) => slot.actualId || null),
      substituteTeachers: nextSlots.map((slot) => slot.substituteName || ''),
      substituteTeacherIds: nextSlots.map((slot) => slot.substituteId || null),
      actualTeacherName: nextSlots[0]?.actualName || '',
      actualTeacherId: nextSlots[0]?.actualId || null,
      substituteTeacherName: nextSlots[0]?.substituteName || '',
      substituteTeacherId: nextSlots[0]?.substituteId || null
    };

    setMeta((currentMeta) => ({
      ...currentMeta,
      subjectAssignments: {
        ...(currentMeta?.subjectAssignments || {}),
        ...Object.fromEntries((subjectRow.assignmentKeys || [subjectRow.key]).map((key) => [key, nextAssignment]))
      }
    }));

    setGrid((currentGrid) => currentGrid.map((row) => {
      if (!isSlotRow(row)) return row;

      let rowChanged = false;
      const nextDays = { ...row.days };
      const rowSlotUsage = {};

      DAYS.forEach((day) => {
        const cell = nextDays[day];
        const subjectName = String(cell?.subject || '').trim();
        if (!subjectName || subjectName.toUpperCase() === 'HORARIO LIBRE') return;

        const subject = cell?.subject_id
          ? subjects.find((item) => item.id === Number(cell.subject_id))
          : (findSubjectByLogicalId(cell?.subject_logical_id) || findSubjectByName(subjectName));
        const subjectLogicalId = cell?.subject_logical_id || getSubjectLogicalId(subject);
        const matches = getSubjectMetaKey(subject?.id ?? null, subject?.nombre || subjectName, subjectLogicalId) === subjectRow.key;

        if (!matches) return;

        const currentTeacherName = String(cell?.teacher || '').replace('Prof. ', '').trim();
        let matchedSlotIndex = nextSlots.findIndex((slot) => normalize(slot.sourceName) === normalize(currentTeacherName));
        if (matchedSlotIndex === -1) {
          rowSlotUsage[subjectRow.key] = rowSlotUsage[subjectRow.key] ?? 0;
          matchedSlotIndex = Math.min(rowSlotUsage[subjectRow.key], Math.max(nextSlots.length - 1, 0));
          rowSlotUsage[subjectRow.key] += 1;
        }

        const slotTeacher = nextSlots[matchedSlotIndex] || nextSlots[0] || {};
        rowChanged = true;
        nextDays[day] = {
          ...cell,
          teacher: slotTeacher.actualName || '',
          teacher_id: slotTeacher.actualId || null,
          substitute_teacher: slotTeacher.substituteName || '',
          substitute_teacher_id: slotTeacher.substituteId || null
        };
      });

      return rowChanged ? { ...row, days: nextDays } : row;
    }));
  };

  const onDragStart = (e, index) => {
    if (!canEdit || grid[index].type !== 'break') return;
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e, index) => {
    e.preventDefault();
    if (!canEdit || draggedItemIndex === null || draggedItemIndex === index) return;
    
    const items = [...grid];
    const draggedItem = items[draggedItemIndex];
    items.splice(draggedItemIndex, 1);
    items.splice(index, 0, draggedItem);
    
    setDraggedItemIndex(index);
    setGrid(items);
  };

  const onDragEnd = () => {
    setDraggedItemIndex(null);
  };

  const selectedCourse = allCourses?.find(c => c.id === selectedCourseId);
  const hasPendingChanges = !!selectedCourseId && buildSnapshot(meta, grid) !== lastSavedSnapshot;
  const curriculumSubjects = useMemo(() => {
    if (!selectedCourse?.tecnicatura_id) return subjects;
    const source = Array.isArray(allSubjects) && allSubjects.length > 0 ? allSubjects : subjects;
    return source.filter((subject) => Number(subject.tecnicatura_id) === Number(selectedCourse.tecnicatura_id));
  }, [allSubjects, selectedCourse?.tecnicatura_id, subjects]);
  const subjectOrderMap = useMemo(
    () => new Map(curriculumSubjects.map((subject, index) => [String(subject.id), index])),
    [curriculumSubjects]
  );
  const subjectTeacherRows = useMemo(() => {
    const grouped = new Map();
    curriculumSubjects.forEach((subject, index) => {
      const logicalId = getSubjectLogicalId(subject);
      const { key, assignmentKeys } = getSubjectAssignment(subject.id, subject.nombre, logicalId);
      const slotCount = isModularWorkshop(subject) ? 2 : 1;
      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          subjectId: subject.id,
          subjectLogicalId: logicalId,
          subjectName: subject.nombre,
          subjectType: getSubjectTypeLabel(subject),
          subjectOrder: index,
          currentTeachers: new Set(),
          currentTeacherIds: new Set(),
          occurrences: 0,
          order: index,
          slotCount,
          assignmentKeys: new Set(assignmentKeys)
        });
        return;
      }

      const group = grouped.get(key);
      assignmentKeys.forEach((assignmentKey) => group.assignmentKeys.add(assignmentKey));
      group.subjectOrder = Math.min(group.subjectOrder, index);
      group.order = Math.min(group.order, index);
      if (!group.subjectLogicalId && logicalId) group.subjectLogicalId = logicalId;
      if (group.subjectName.length > subject.nombre.length) {
        group.subjectName = subject.nombre;
      }
    });
    let orderCounter = curriculumSubjects.length;

    grid.forEach((row) => {
      if (!isSlotRow(row)) return;

      DAYS.forEach((day) => {
        const cell = row.days?.[day];
        const subjectName = String(cell?.subject || '').trim();
        if (!subjectName || subjectName.toUpperCase() === 'HORARIO LIBRE') return;

        const subject = cell?.subject_id
          ? subjects.find((item) => item.id === Number(cell.subject_id))
          : (findSubjectByLogicalId(cell?.subject_logical_id) || findSubjectByName(subjectName));
        const subjectId = subject?.id ?? null;
        const subjectLogicalId = cell?.subject_logical_id || getSubjectLogicalId(subject);
        const { key, assignmentKeys } = getSubjectAssignment(subjectId, subject?.nombre || subjectName, subjectLogicalId);

        if (!grouped.has(key)) {
          const curriculumSubject = curriculumSubjects.find(s => s.id === subjectId || (subjectId === null && normalize(s.nombre) === normalize(subjectName)));
          if (!curriculumSubject) return; // Skip subjects not in the current curriculum

          const slotCount = isModularWorkshop(subject) ? 2 : 1;
          grouped.set(key, {
            key,
            subjectId: curriculumSubject.id,
            subjectLogicalId: curriculumSubject.orden !== undefined ? curriculumSubject.orden + 1 : subjectLogicalId,
            subjectName: curriculumSubject.nombre,
            subjectType: getSubjectTypeLabel(curriculumSubject),
            subjectOrder: subjectOrderMap.get(String(curriculumSubject.id)) ?? orderCounter,
            currentTeachers: new Set(),
            currentTeacherIds: new Set(),
            occurrences: 0,
            order: orderCounter++,
            slotCount,
            assignmentKeys: new Set(assignmentKeys)
          });
        }

        const group = grouped.get(key);
        assignmentKeys.forEach((assignmentKey) => group.assignmentKeys.add(assignmentKey));
        if (!group.subjectLogicalId && subjectLogicalId) group.subjectLogicalId = subjectLogicalId;
        const teacherName = String(cell?.teacher || '').replace('Prof. ', '').trim();
        const teacher = cell?.teacher_id
          ? professors.find((professor) => professor.id === Number(cell.teacher_id))
          : findProfessorByName(teacherName);

        group.occurrences += 1;
        if (teacherName) group.currentTeachers.add(teacherName);
        if (teacher?.id) group.currentTeacherIds.add(teacher.id);
      });
    });

    return Array.from(grouped.values())
      .map((entry) => {
        const assignment = Array.from(entry.assignmentKeys).map((key) => subjectAssignments[key]).find(Boolean) || {};
        const teacherNames = Array.from(entry.currentTeachers);
        const teacherSlots = getTeacherSlots(assignment, entry.slotCount).map((slot, index) => {
          const fallbackName = teacherNames[index] || slot.sourceName || '';
          const fallbackId = Array.from(entry.currentTeacherIds)[index] || null;
          const actual = slot.actualName || slot.actualId
            ? getTeacherValue(slot.actualName, slot.actualId)
            : getTeacherValue(fallbackName, fallbackId);
          const substitute = slot.substituteName || slot.substituteId
            ? getTeacherValue(slot.substituteName, slot.substituteId)
            : { name: '', id: null };

          return {
            ...slot,
            sourceName: slot.sourceName || fallbackName,
            actualName: actual.name,
            actualId: actual.id,
            substituteName: substitute.name,
            substituteId: substitute.id
          };
        });

        return {
          ...entry,
          assignmentKeys: Array.from(entry.assignmentKeys),
          teacherSlots
        };
      })
      .sort((a, b) => {
        const orderDiff = a.subjectOrder - b.subjectOrder;
        if (orderDiff !== 0) return orderDiff;
        return a.order - b.order;
      })
      .map((entry, index) => ({
        ...entry,
        index: index + 1
      }));
  }, [curriculumSubjects, grid, professors, subjectAssignments, subjectOrderMap, subjects]);

  const getHeaderColor = (courseArg) => {
    const course = courseArg || selectedCourse;
    const tec = course?.tecnicatura_nombre?.toUpperCase() || '';
    if (tec.includes('CICLO BASICO')) return '#ff9900'; 
    if (tec.includes('AERONAUTICA')) return '#2563eb'; 
    if (tec.includes('ELECTRONICA')) return '#16a34a'; 
    if (tec.includes('AUTOMOTORES')) return '#dc2626'; 
    return '#ffff00';
  };

  const getCiclo = (courseArg) => {
    const course = courseArg || selectedCourse;
    const ano = parseInt(course?.ano, 10);
    if (ano <= 3) return 'Básico';
    return 'Superior';
  };

  const dynamicPrimary = getHeaderColor();

  return (
    <div className="horarios-panel" style={{ '--dynamic-primary': dynamicPrimary }}>
      {/* Datalists for autocomplete */}
      <datalist id="list-subjects">
        <option value="Horario Libre" />
        {subjects.map(s => <option key={s.id} value={s.nombre} />)}
      </datalist>
      <datalist id="list-teachers">
        {professors.map(p => <option key={p.id} value={p.nombre} />)}
      </datalist>

      {message && (
        <div className={`message-banner ${message.type}`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="main-editor glass-card">
        {!selectedCourseId ? (
          <div className="empty-state">
            <Calendar size={64} className="empty-icon" />
            <h3>Selecciona un curso</h3>
            <p>Elige un curso en el menú superior para gestionar su horario.</p>
          </div>
        ) : loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando horario...</p>
          </div>
        ) : (
          <>
            <div className="editor-header no-print">
              <div className="course-info">
                <h2>{selectedCourse?.ano} {selectedCourse?.division} - {selectedCourse?.turno} - {selectedCourse?.preceptor_nombre}</h2>
                <span className="badge">{selectedCourse?.tecnicatura_nombre}</span>
              </div>
              <div className="editor-actions">
                {canEdit && (
                  <SaveStatusButton
                    onClick={handleSave}
                    loading={isSaving}
                    hasChanges={hasPendingChanges}
                    canEdit={canEdit}
                  />
                )}
                <button className="btn btn-icon" onClick={handlePrint} title="Imprimir">
                  <Printer size={20} />
                </button>
                <button 
                  className={`btn btn-outline btn-sm print-all-btn ${isPrintingAll ? 'loading' : ''}`} 
                  onClick={handlePrintAll} 
                  disabled={isPrintingAll}
                  title="Imprimir todos los horarios del año"
                >
                  <Printer size={16} className="print-icon-all" />
                  <span className="print-all-text">{isPrintingAll ? 'Cargando...' : 'Imprimir todos'}</span>
                </button>
                {canEdit && (
                  <button className="btn btn-icon text-danger" onClick={handleDelete} title="Eliminar horario">
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>


            {/* Desktop Table View */}
            <div className="schedule-table-container print-hide mobile-hide">
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th className="col-time">Hora</th>
                    {DAYS.map(day => <th key={day}>{day}</th>)}
                    {canEdit && <th className="col-actions print-hide"></th>}
                  </tr>
                </thead>
                <tbody>
                  {grid.map((row, rowIndex) => (
                    <tr 
                      key={rowIndex} 
                      className={`${row.type === 'break' ? 'row-break' : 'row-slot'} ${draggedItemIndex === rowIndex ? 'dragging' : ''}`}
                      draggable={canEdit && row.type === 'break'}
                      onDragStart={(e) => onDragStart(e, rowIndex)}
                      onDragOver={(e) => onDragOver(e, rowIndex)}
                      onDragEnd={onDragEnd}
                    >
                      <td className="cell-time">
                        <input 
                          type="text" 
                          className="input-time" 
                          value={row.time || ''} 
                          readOnly={true}
                          onChange={(e) => updateCell(rowIndex, 'time', null, e.target.value)}
                        />
                      </td>
                      {row.type === 'break' ? (
                        <td colSpan={5}>
                          <input 
                            type="text" 
                            className="input-break" 
                            value={row.label} 
                            readOnly={true}
                            onChange={(e) => updateCell(rowIndex, 'label', null, e.target.value)}
                          />
                        </td>
                      ) : (
                        <>
                          {DAYS.map(day => (
                            <td key={day} className="cell-slot">
                              <div className="slot-editor">
                                {canEdit ? (
                                  <>
                                    <input 
                                      type="text"
                                      list="list-subjects"
                                      className={`input-subject-search ${(!row.days?.[day]?.subject || row.days?.[day]?.subject.toUpperCase() === 'HORARIO LIBRE') ? 'centered-free is-free-input' : ''} ${row.days?.[day]?.subject && row.days?.[day]?.subject.toUpperCase() !== 'HORARIO LIBRE' && !row.days?.[day]?.subject_id ? 'invalid' : ''}`}
                                      placeholder="Materia..."
                                      value={row.days?.[day]?.subject || ''} 
                                      onChange={(e) => updateCell(rowIndex, day, 'subject', e.target.value)}
                                    />
                                    {row.days?.[day]?.subject && row.days?.[day]?.subject.toUpperCase() !== 'HORARIO LIBRE' && (
                                      <input 
                                        type="text"
                                        list="list-teachers"
                                        className={`input-teacher-search ${row.days?.[day]?.teacher && !row.days?.[day]?.teacher_id ? 'invalid' : ''}`}
                                        placeholder="Profesor..."
                                        value={row.days?.[day]?.teacher || ''} 
                                        onChange={(e) => updateCell(rowIndex, day, 'teacher', e.target.value)}
                                      />
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <div className={`view-subject ${(!row.days?.[day]?.subject || row.days?.[day]?.subject.toUpperCase() === 'HORARIO LIBRE') ? 'is-free centered-free' : ''}`}>
                                      {row.days?.[day]?.subject || 'Horario Libre'}
                                    </div>
                                    {row.days?.[day]?.subject && row.days?.[day]?.subject.toUpperCase() !== 'HORARIO LIBRE' && (
                                      <div className="view-teacher">
                                        {row.days?.[day]?.teacher ? 'Prof. ' + row.days[day].teacher : ''}
                                        {row.days?.[day]?.substitute_teacher && <br />}
                                        {row.days?.[day]?.substitute_teacher ? <span style={{fontStyle: 'italic', opacity: 0.85}}>Supl. {row.days[day].substitute_teacher}</span> : ''}
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                              </td>
                          ))}
                        </>
                      )}
                      {canEdit && (
                        <td className="cell-actions print-hide">
                          {/* Removed remove button as per user request */}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Carousel View */}
            <div className="mobile-carousel-container desktop-hide print-hide">
              <div className="carousel-controls">
                <button className="btn-icon" onClick={handlePrevDay} disabled={mobileDayIndex === 0}>
                  <ChevronLeft size={20} />
                </button>
                <div className="carousel-day-indicator">
                  <Calendar size={16} />
                  <span>{DAYS[mobileDayIndex]}</span>
                </div>
                <button className="btn-icon" onClick={handleNextDay} disabled={mobileDayIndex === 4}>
                  <ChevronRight size={20} />
                </button>
              </div>
              
              <div className="carousel-track-wrapper">
                <div className="carousel-track" style={{ transform: `translateX(calc(-${mobileDayIndex * 85}% + 7.5%))` }}>
                  {DAYS.map((day, dIdx) => {
                    const isActive = dIdx === mobileDayIndex;
                    return (
                      <div className={`carousel-slide ${isActive ? 'active' : 'dimmed'}`} key={day}>
                        <div className="mobile-day-card">
                          <div className="mobile-day-slots">
                            {grid.map((row, rowIndex) => {
                              if (row.type === 'break') {
                                return (
                                  <div className="mobile-slot break-slot" key={rowIndex}>
                                    <div className="mobile-slot-time">{row.time}</div>
                                    <div className="mobile-slot-label">{row.label}</div>
                                  </div>
                                );
                              }
                              const cell = row.days?.[day];
                              return (
                                <div className="mobile-slot data-slot" key={rowIndex}>
                                  <div className="mobile-slot-time">{row.time}</div>
                                  <div className="mobile-slot-content">
                                    {canEdit ? (
                                      <>
                                        <input 
                                          type="text"
                                          list="list-subjects"
                                          className={`input-subject-search ${(!cell?.subject || cell.subject.toUpperCase() === 'HORARIO LIBRE') ? 'centered-free is-free-input' : ''} ${cell?.subject && cell.subject.toUpperCase() !== 'HORARIO LIBRE' && !cell?.subject_id ? 'invalid' : ''}`}
                                          placeholder="Materia..."
                                          value={cell?.subject || ''} 
                                          onChange={(e) => updateCell(rowIndex, day, 'subject', e.target.value)}
                                        />
                                        {cell?.subject && cell.subject.toUpperCase() !== 'HORARIO LIBRE' && (
                                          <input 
                                            type="text"
                                            list="list-teachers"
                                            className={`input-teacher-search ${cell?.teacher && !cell?.teacher_id ? 'invalid' : ''}`}
                                            placeholder="Profesor..."
                                            value={cell?.teacher || ''} 
                                            onChange={(e) => updateCell(rowIndex, day, 'teacher', e.target.value)}
                                          />
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        <div className={`view-subject ${(!cell?.subject || cell.subject.toUpperCase() === 'HORARIO LIBRE') ? 'is-free centered-free' : ''}`}>
                                          {cell?.subject || 'Horario Libre'}
                                        </div>
                                        {cell?.subject && cell.subject.toUpperCase() !== 'HORARIO LIBRE' && (
                                          <div className="view-teacher">
                                            {cell?.teacher ? 'Prof. ' + cell.teacher : ''}
                                            {cell?.substitute_teacher && <br />}
                                            {cell?.substitute_teacher ? <span style={{fontStyle: 'italic', opacity: 0.85}}>Supl. {cell.substitute_teacher}</span> : ''}
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {selectedCourseId && (
              <div className="bulk-editor-section print-hide">
                <table className="bulk-editor-meta">
                  <thead>
                    <tr>
                      <th colSpan={5}>Asignacion de Docente por Materia</th>
                    </tr>
                    <tr>
                      <th>Año / Curso</th>
                      <th>Ciclo</th>
                      <th>División</th>
                      <th>Turno</th>
                      <th>Auxiliar Docente</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{selectedCourse?.ano}</td>
                      <td>{getCiclo()}</td>
                      <td>{selectedCourse?.division || '---'}</td>
                      <td>{selectedCourse?.turno || '---'}</td>
                      <td>{selectedCourse?.preceptor_nombre || '---'}</td>
                    </tr>
                  </tbody>
                </table>

                <table className="bulk-editor-table">
                  <thead>
                    <tr>
                      <th className="bulk-col-number">N°</th>
                      <th>Nombre del espacio curricular</th>
                      <th className="bulk-col-type">Tipo</th>
                      <th>Docente actual</th>
                      <th>Suplente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectTeacherRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="bulk-empty">
                          Todavía no hay materias cargadas en este horario.
                        </td>
                      </tr>
                    ) : (
                      subjectTeacherRows.map((subjectRow) => {
                        return (
                          <tr key={subjectRow.key}>
                            <td className="bulk-number-cell">{subjectRow.index}</td>
                            <td className="bulk-subject-cell">{subjectRow.subjectName}</td>
                            <td className="bulk-type-cell">{subjectRow.subjectType}</td>
                            <td>
                              {canEdit ? (
                                <div className="bulk-teacher-stack">
                                  {subjectRow.teacherSlots.map((slot, slotIndex) => (
                                    <input
                                      key={`actual-${subjectRow.key}-${slotIndex}`}
                                      type="text"
                                      list="list-teachers"
                                      className="bulk-teacher-input"
                                      placeholder={subjectRow.teacherSlots.length > 1 ? `Docente titular ${slotIndex + 1}...` : 'Docente titular...'}
                                      value={slot.actualName}
                                      onChange={(e) => applyTeacherToSubject(subjectRow, 'actual', slotIndex, e.target.value)}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <div className="bulk-teacher-stack">
                                  {subjectRow.teacherSlots.map((slot, slotIndex) => (
                                    <div key={`actual-view-${subjectRow.key}-${slotIndex}`} className="bulk-readonly-teacher">
                                      {slot.actualName || 'Sin asignar'}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td>
                              {canEdit ? (
                                <div className="bulk-teacher-stack">
                                  {subjectRow.teacherSlots.map((slot, slotIndex) => (
                                    <input
                                      key={`substitute-${subjectRow.key}-${slotIndex}`}
                                      type="text"
                                      list="list-teachers"
                                      className="bulk-teacher-input is-substitute"
                                      placeholder={subjectRow.teacherSlots.length > 1 ? `Suplente ${slotIndex + 1}...` : 'Suplente...'}
                                      value={slot.substituteName}
                                      onChange={(e) => applyTeacherToSubject(subjectRow, 'substitute', slotIndex, e.target.value)}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <div className="bulk-teacher-stack">
                                  {subjectRow.teacherSlots.map((slot, slotIndex) => (
                                    <div key={`substitute-view-${subjectRow.key}-${slotIndex}`} className="bulk-readonly-teacher">
                                      {slot.substituteName || 'Sin asignar'}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {canEdit && (
              <div className="editor-footer print-hide">
                {/* Fixed structure enforced automatically */}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HorariosPanel;
