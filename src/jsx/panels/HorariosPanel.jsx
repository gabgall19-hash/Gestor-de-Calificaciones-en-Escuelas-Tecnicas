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
  GripVertical
} from 'lucide-react';
import apiService from '../functions/apiService';
import SaveStatusButton from '../UI/SaveStatusButton';
import HorariosPrintView from '../prints/HorariosPrintView';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
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
  const [allSchedules, setAllSchedules] = useState(null);
  const [isPrintingAll, setIsPrintingAll] = useState(false);

  const isAdmin = user.rol === 'admin';
  const professors = users.filter((userRow) =>
    ['profesor', 'preceptor', 'preceptor_taller', 'preceptor_ef'].includes(userRow.rol) || userRow.is_professor_hybrid === 1
  );
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

      setGrid(finalGrid);
      setLastSavedSnapshot(buildSnapshot(nextMeta, finalGrid));
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
    if (!selectedCourseId || !isAdmin) return;
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
    if (!selectedCourseId || !isAdmin || !window.confirm('¿Estás seguro de eliminar el horario de este curso?')) return;
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
    if (!isAdmin) return;
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
    if (!isAdmin) return;
    const newGrid = [...grid];
    newGrid.splice(index, 1);
    setGrid(newGrid);
  };

  const updateCell = (rowIndex, day, field, value) => {
    if (!isAdmin) return;
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
    setAllSchedules(null); // Ensure single print
    setTimeout(() => window.print(), 100);
  };

  const handlePrintAll = async () => {
    setIsPrintingAll(true);
    try {
      const res = await apiService.get('horarios', { userId: user.id });
      setAllSchedules(res);
      // Wait for React to render the batch print view
      setTimeout(() => {
        window.print();
        setAllSchedules(null);
      }, 500);
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
    if (!isAdmin) return;

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
        const visibleTeacher = slotTeacher.substituteName
          ? { name: slotTeacher.substituteName, id: slotTeacher.substituteId }
          : { name: slotTeacher.actualName, id: slotTeacher.actualId };

        rowChanged = true;
        nextDays[day] = {
          ...cell,
          teacher: visibleTeacher.name || '',
          teacher_id: visibleTeacher.id || null
        };
      });

      return rowChanged ? { ...row, days: nextDays } : row;
    }));
  };

  const onDragStart = (e, index) => {
    if (!isAdmin || grid[index].type !== 'break') return;
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e, index) => {
    e.preventDefault();
    if (!isAdmin || draggedItemIndex === null || draggedItemIndex === index) return;
    
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
          const slotCount = isModularWorkshop(subject) ? 2 : 1;
          grouped.set(key, {
            key,
            subjectId,
            subjectLogicalId,
            subjectName: subject?.nombre || subjectName,
            subjectType: getSubjectTypeLabel(subject),
            subjectOrder: subject?.id ? (subjectOrderMap.get(String(subject.id)) ?? Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER,
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
    const ano = Number(course?.ano);
    if (ano <= 2) return 'Básico';
    return 'Superior';
  };

  return (
    <div className="horarios-panel">
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
                {isAdmin && (
                  <SaveStatusButton
                    onClick={handleSave}
                    loading={isSaving}
                    hasChanges={hasPendingChanges}
                    canEdit={isAdmin}
                  />
                )}
                <button className="btn btn-icon" onClick={handlePrint} title="Imprimir">
                  <Printer size={20} />
                </button>
                <button 
                  className={`btn btn-outline btn-sm ${isPrintingAll ? 'loading' : ''}`} 
                  onClick={handlePrintAll} 
                  disabled={isPrintingAll}
                  title="Imprimir todos los horarios del año"
                >
                  <Printer size={16} />
                  <span>{isPrintingAll ? 'Cargando...' : 'Imprimir todos'}</span>
                </button>
                {isAdmin && (
                  <button className="btn btn-icon text-danger" onClick={handleDelete} title="Eliminar horario">
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>

            <HorariosPrintView
              selectedCourse={selectedCourse}
              grid={grid}
              getHeaderColor={getHeaderColor}
              getCiclo={getCiclo}
              allSchedules={allSchedules}
              allCourses={allCourses}
            />

            <div className="schedule-table-container print-hide">
              <table className="schedule-table">
                <thead>
                  <tr>
                    {isAdmin && <th className="col-drag print-hide"></th>}
                    <th className="col-time">Hora</th>
                    {DAYS.map(day => <th key={day}>{day}</th>)}
                    {isAdmin && <th className="col-actions print-hide"></th>}
                  </tr>
                </thead>
                <tbody>
                  {grid.map((row, rowIndex) => (
                    <tr 
                      key={rowIndex} 
                      className={`${row.type === 'break' ? 'row-break' : 'row-slot'} ${draggedItemIndex === rowIndex ? 'dragging' : ''}`}
                      draggable={isAdmin && row.type === 'break'}
                      onDragStart={(e) => onDragStart(e, rowIndex)}
                      onDragOver={(e) => onDragOver(e, rowIndex)}
                      onDragEnd={onDragEnd}
                    >
                      {isAdmin && (
                        <td className={`cell-drag print-hide ${row.type !== 'break' ? 'no-drag' : ''}`}>
                          {row.type === 'break' && <GripVertical size={16} className="drag-handle" />}
                        </td>
                      )}
                      <td className="cell-time">
                        <input 
                          type="text" 
                          className="input-time" 
                          value={row.time || ''} 
                          readOnly={!isAdmin}
                          onChange={(e) => updateCell(rowIndex, 'time', null, e.target.value)}
                        />
                      </td>
                      {row.type === 'break' ? (
                        <td colSpan={5}>
                          <input 
                            type="text" 
                            className="input-break" 
                            value={row.label} 
                            readOnly={!isAdmin}
                            onChange={(e) => updateCell(rowIndex, 'label', null, e.target.value)}
                          />
                        </td>
                      ) : (
                        <>
                          {DAYS.map(day => (
                            <td key={day} className="cell-slot">
                              <div className="slot-editor">
                                {isAdmin ? (
                                  <>
                                    <input 
                                      type="text"
                                      list="list-subjects"
                                      className={`input-subject-search ${(row.days?.[day]?.subject?.toUpperCase() === 'HORARIO LIBRE' || !row.days?.[day]?.subject) ? 'centered-free' : ''}`}
                                      placeholder="Materia..."
                                      value={row.days?.[day]?.subject || ''} 
                                      onChange={(e) => updateCell(rowIndex, day, 'subject', e.target.value)}
                                    />
                                    {row.days?.[day]?.subject && row.days?.[day]?.subject.toUpperCase() !== 'HORARIO LIBRE' && (
                                      <input 
                                        type="text"
                                        list="list-teachers"
                                        className="input-teacher-search"
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
                                      <div className="view-teacher">{row.days?.[day]?.teacher ? 'Prof. ' + row.days[day].teacher : ''}</div>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          ))}
                        </>
                      )}
                      {isAdmin && (
                        <td className="cell-actions print-hide">
                          <button className="btn-remove" onClick={() => removeRow(rowIndex)}>
                            <X size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
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
                              {isAdmin ? (
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
                              {isAdmin ? (
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

            {isAdmin && (
              <div className="editor-footer print-hide">
                <button className="btn btn-outline" onClick={() => addRow('slot')}>
                  <Plus size={18} />
                  <span>Agregar Hora</span>
                </button>
                <button className="btn btn-outline" onClick={() => addRow('break')}>
                  <Plus size={18} />
                  <span>Agregar Recreo</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .horarios-panel { padding: 10px; animation: fadeIn 0.3s ease; }
        .main-editor { 
          padding: 25px; 
          min-height: 600px; 
          display: flex; 
          flex-direction: column; 
          background: linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 20px 50px rgba(0,0,0,0.15);
        }
        .editor-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; }
        .course-info h2 { margin: 0; font-size: 1.6rem; font-weight: 800; color: white; }
        .badge { background: var(--primary-color); color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; margin-top: 8px; display: inline-block; font-weight: 700; text-transform: uppercase; }
        
        .editor-actions { display: flex; gap: 12px; align-items: center; }
        
        .schedule-table-container { 
          overflow-x: auto; 
          flex: 1; 
          border-radius: 12px; 
          border: 1px solid rgba(255,255,255,0.12); 
          background:
            linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05)),
            radial-gradient(circle at top left, rgba(255,255,255,0.1), transparent 40%),
            rgba(119, 125, 132, 0.15);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        .schedule-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .schedule-table th { 
          padding: 15px 10px; 
          text-align: center; 
          background: rgba(255,255,255,0.15); 
          color: #f8fafc; 
          font-size: 0.85rem; 
          font-weight: 900; 
          text-transform: uppercase; 
          letter-spacing: 0.05em;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .schedule-table td { 
          padding: 10px; 
          border: 1px solid rgba(255,255,255,0.08); 
          vertical-align: middle; 
          background: rgba(255,255,255,0.04); 
        }

        .bulk-editor-section {
          margin-top: 28px;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 18px;
          overflow: hidden;
          background:
            linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05)),
            radial-gradient(circle at top left, rgba(255,255,255,0.12), transparent 34%),
            rgba(119, 125, 132, 0.18);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          box-shadow: 0 24px 40px rgba(0,0,0,0.18);
        }
        .bulk-editor-meta,
        .bulk-editor-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        .bulk-editor-meta th,
        .bulk-editor-meta td,
        .bulk-editor-table th,
        .bulk-editor-table td {
          border: 1px solid rgba(255,255,255,0.1);
          color: #f8fafc;
        }
        .bulk-editor-meta thead tr:first-child th {
          background: rgba(191, 219, 254, 0.18);
          font-size: 1.05rem;
          font-weight: 900;
          padding: 14px 10px;
          text-align: center;
        }
        .bulk-editor-meta thead tr:last-child th {
          background: rgba(191, 219, 254, 0.1);
          padding: 10px 8px;
          font-size: 0.82rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .bulk-editor-meta td {
          background: rgba(15, 23, 42, 0.24);
          padding: 12px 10px;
          text-align: center;
          font-weight: 700;
        }
        .bulk-editor-table th {
          background: rgba(251, 146, 60, 0.16);
          padding: 12px 10px;
          font-size: 0.82rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .bulk-editor-table td {
          background: rgba(255,255,255,0.04);
          padding: 10px;
          font-size: 0.95rem;
        }
        .bulk-col-number { width: 64px; }
        .bulk-col-type { width: 110px; }
        .bulk-number-cell,
        .bulk-type-cell { text-align: center; font-weight: 800; }
        .bulk-subject-cell { font-weight: 700; }
        .bulk-type-cell { color: #dbeafe; letter-spacing: 0.08em; }
        .bulk-teacher-input,
        .bulk-readonly-teacher {
          width: 100%;
          min-height: 40px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.06);
          color: #f8fafc;
          padding: 8px 10px;
          font-size: 0.92rem;
          outline: none;
        }
        .bulk-teacher-input::placeholder {
          color: rgba(255,255,255,0.45);
        }
        .bulk-teacher-input.is-substitute {
          color: #fbbf24;
        }
        .bulk-teacher-stack {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .bulk-teacher-input:focus {
          border-color: rgba(96, 165, 250, 0.9);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
        }
        .bulk-empty {
          text-align: center;
          padding: 18px;
          color: rgba(255,255,255,0.72);
          font-style: italic;
        }

        .col-drag { width: 40px; }
        .col-time { width: 140px; }
        .col-actions { width: 45px; }

        .cell-drag { cursor: grab; display: flex; align-items: center; justify-content: center; height: 100%; min-height: 50px; opacity: 0.3; transition: 0.2s; }
        .cell-drag.no-drag { cursor: default; opacity: 0 !important; }
        tr:hover .cell-drag { opacity: 1; }
        tr:hover .cell-drag.no-drag { opacity: 0 !important; }
        .dragging { opacity: 0.4; background: rgba(var(--primary-rgb), 0.1) !important; }

        .cell-time { background: rgba(255,255,255,0.08); text-align: center; }
        .input-time { 
          background: transparent; border: none; color: #fff; width: 100%; text-align: center; 
          font-weight: 900; font-size: 0.95rem; outline: none;
        }
        
        .slot-editor { display: flex; flex-direction: column; gap: 4px; }
        .input-subject-search, .input-teacher-search { 
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); 
          color: white; font-size: 0.75rem; padding: 6px; border-radius: 6px; outline: none;
          width: 100%; transition: all 0.2s;
        }
        .input-subject-search:focus, .input-teacher-search:focus {
          background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.4);
        }
        .input-subject-search.centered-free { text-align: center; color: rgba(255,255,255,0.3); font-style: italic; }
        .input-teacher-search { color: #f1f5f9; opacity: 1; }
        .view-subject { font-weight: 700; font-size: 0.85rem; color: white; text-align: center; }
        .view-subject.is-free { color: rgba(255,255,255,0.2); font-style: italic; font-weight: 400; font-size: 0.75rem; min-height: 32px; display: flex; align-items: center; justify-content: center; }
        .view-subject.centered-free { text-align: center; }
        .view-teacher { font-size: 0.75rem; color: var(--primary-color); text-align: center; opacity: 0.8; }
        
        .row-break { background: rgba(255,255,255,0.08); }
        .input-break { 
          width: 100%; background: transparent; border: none; color: #ffcc00; 
          text-align: center; font-style: italic; letter-spacing: 4px; font-weight: 700; outline: none;
        }

        .btn-remove { 
          background: rgba(239, 68, 68, 0.1); border: none; color: #ef4444; 
          padding: 6px; border-radius: 50%; cursor: pointer; opacity: 0; transition: 0.2s;
        }
        tr:hover .btn-remove { opacity: 1; }

        .editor-footer { display: flex; gap: 15px; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
        
        @media (max-width: 1100px) {
          .bulk-editor-section { overflow-x: auto; }
          .bulk-editor-meta,
          .bulk-editor-table { min-width: 860px; }
        }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default HorariosPanel;
