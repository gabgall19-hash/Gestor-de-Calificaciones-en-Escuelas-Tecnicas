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

const getHeaderColor = (course) => {
  const tec = course?.tecnicatura_nombre?.toUpperCase() || '';
  if (tec.includes('CICLO BASICO')) return '#ff9900'; 
  if (tec.includes('AERONAUTICA')) return '#2563eb'; 
  if (tec.includes('ELECTRONICA')) return '#16a34a'; 
  if (tec.includes('AUTOMOTORES')) return '#dc2626'; 
  return '#ffff00';
};

export const handlePrintHorario_AllGrades = (allCourses, allSchedules) => {
  if (!allCourses || !allSchedules) return;

  const win = window.open('', '_blank');

  const pagesHTML = allSchedules.map((item, idx) => {
    const course = allCourses.find(c => c.id === item.course_id);
    if (!course) return '';

    let gridData = [];
    let meta = {};
    if (typeof item.grid_data === 'string') {
      try {
        const parsed = JSON.parse(item.grid_data);
        if (Array.isArray(parsed)) {
          gridData = parsed;
        } else {
          gridData = parsed.grid || [];
          meta = parsed.meta || {};
        }
      } catch (e) {
        gridData = [];
      }
    }

    const turno = course?.turno;
    const ano = parseInt(course?.ano, 10);
    const ciclo = (ano && ano <= 3) ? 'Básico' : 'Superior';
    const template = HORARIOS_TEMPLATES[turno]?.[ciclo];
    
    if (template) {
      const isCompatible = gridData.length === template.length && 
                           gridData.every((row, i) => row.type === template[i].type && row.time === template[i].time);
                           
      if (!isCompatible && gridData.length > 0) {
        const existingSlotsWithData = gridData.filter(r => r.days && Object.values(r.days).some(d => d.subject));
        let slotCounter = 0;
        gridData = template.map(tRow => {
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
      }
    }

    if (meta.subjectAssignments) {
      gridData.forEach(row => {
        if (row.type === 'break') return;
        DAYS.forEach(day => {
          const cell = row.days?.[day];
          if (!cell || !cell.subject || cell.subject.toUpperCase() === 'HORARIO LIBRE') return;
          
          const currentTeacherStr = String(cell.teacher || '').replace('Prof. ', '').trim().toLowerCase();
          if (!currentTeacherStr) return;

          for (const key in meta.subjectAssignments) {
            const assignment = meta.subjectAssignments[key];
            const substitutes = Array.isArray(assignment.substituteTeachers) ? assignment.substituteTeachers : [assignment.substituteTeacherName || ''];
            const actuals = Array.isArray(assignment.actualTeachers) ? assignment.actualTeachers : [assignment.actualTeacherName || ''];
            
            const subIndex = substitutes.findIndex(sub => sub && sub.toLowerCase().includes(currentTeacherStr));
            const actIndex = actuals.findIndex(act => act && act.toLowerCase().includes(currentTeacherStr));
            
            if (subIndex !== -1 && currentTeacherStr.length > 3) {
              cell.teacher = actuals[subIndex] || actuals[0] || '';
              cell.substitute_teacher = substitutes[subIndex];
              break;
            } else if (actIndex !== -1 && substitutes[actIndex] && currentTeacherStr.length > 3) {
              cell.substitute_teacher = substitutes[actIndex];
              break;
            }
          }
        });
      });
    }

    if (gridData.length === 0) return '';

    const breakCount = gridData.filter(r => r.type === 'break').length;
    const dataCount = Math.max(gridData.length - breakCount, 1);
    const rowHeight = ((145 - (breakCount * 6)) / dataCount).toFixed(1) + 'mm';

    const rowsHTML = gridData.map((row) => {
      const isBreak = row.type === 'break';
      if (isBreak) {
        return `
          <tr class="print-break-row">
            <td colspan="6" class="print-break-cell">${row.label || 'RECREO'}</td>
          </tr>
        `;
      }

      const cellsHTML = DAYS.map(day => {
        const cell = row.days?.[day] || {};
        const subject = cell.subject || 'Horario Libre';
        const isFree = subject.toUpperCase() === 'HORARIO LIBRE';
        const originalTeacher = isFree ? '' : (cell.teacher || '');
        const substituteTeacher = isFree ? '' : (cell.substitute_teacher || '');
        
        let teacherHTML = '';
        if (!isFree) {
          if (substituteTeacher) {
            teacherHTML = `<div class="print-teacher">${originalTeacher}</div><div class="print-teacher" style="font-style: italic; opacity: 0.85;">Supl. ${substituteTeacher}</div>`;
          } else if (originalTeacher) {
            teacherHTML = `<div class="print-teacher">${originalTeacher}</div>`;
          }
        }

        return `
          <td class="print-slot-cell">
            <div class="print-subject ${isFree ? 'is-free' : ''}">${subject}</div>
            ${teacherHTML}
          </td>
        `;
      }).join('');

      return `
        <tr>
          <td class="print-time-cell">${row.time || ''}</td>
          ${cellsHTML}
        </tr>
      `;
    }).join('');

    return `
      <div class="horarios-print-page">
        <div class="yellow-banner" style="background-color: ${getHeaderColor(course)} !important;">
          HORARIO 2026 - INDUSTRIAL N°6 "X BRIGADA AÉREA"
        </div>

        <table class="meta-print-table">
          <thead>
            <tr>
              <th>Auxiliar Docente</th>
              <th>Año / Curso</th>
              <th>Ciclo</th>
              <th>División</th>
              <th>Turno</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${course.preceptor_nombre || '---'}</td>
              <td>${course.ano}</td>
              <td>${parseInt(course.ano, 10) <= 2 ? 'BÁSICO' : 'SUPERIOR'}</td>
              <td>${course.division || '---'}</td>
              <td>${course.turno || '---'}</td>
            </tr>
          </tbody>
        </table>

        <table class="schedule-print-table">
          <thead>
            <tr>
              <th style="width: 15%;">Hora</th>
              ${DAYS.map(day => `<th>${day}</th>`).join('')}
            </tr>
          </thead>
          <tbody style="--dynamic-row-height: ${rowHeight}">
            ${rowsHTML}
          </tbody>
        </table>
      </div>
    `;
  }).join('');

  win.document.write(`
    <html>
      <head>
        <title>Todos los Horarios - 2026</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          
          body { 
            font-family: 'Arial', sans-serif; 
            margin: 0; padding: 0; 
            background: #334155;
            display: flex; flex-direction: column; align-items: center;
            padding-top: 80px;
          }

          .no-print-toolbar {
            position: fixed; top: 0; left: 0; right: 0; height: 70px;
            display: flex; align-items: center; justify-content: center;
            background: #1e293b;
            z-index: 1000; border-bottom: 2px solid #0f172a; gap: 1.5rem;
          }

          .btn-print {
            background: #6366f1; color: white; border: none; padding: 0.7rem 2rem;
            border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 1rem;
            display: flex; align-items: center; gap: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.2);
          }

          .horarios-print-page { 
            width: 277mm; height: 190mm; padding: 10mm; 
            box-sizing: border-box; background: white; 
            color: black; box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            margin-bottom: 40px;
            page-break-after: always;
            break-after: page;
          }
          .horarios-print-page:last-child { page-break-after: auto; break-after: auto; margin-bottom: 0; }

          .yellow-banner {
            text-align: center; font-weight: 900; padding: 8px; border: 2px solid black;
            font-size: 1.1rem; background: #ffff00; color: black; text-transform: uppercase;
          }

          .meta-print-table { width: 100%; border-collapse: collapse; margin-top: -2px; }
          .meta-print-table th, .meta-print-table td { border: 2px solid black; padding: 4px; text-align: center; font-size: 0.8rem; }
          .meta-print-table th { background: #f0f0f0; font-weight: 400; color: #666; }
          .meta-print-table td { font-weight: 900; }

          .schedule-print-table { width: 100%; border-collapse: collapse; margin-top: 8px; table-layout: fixed; }
          .schedule-print-table th, .schedule-print-table td { border: 2px solid black; padding: 4px; text-align: center; color: black; }
          .schedule-print-table th { font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; font-size: 0.8rem; }
          
          .print-time-cell, .print-slot-cell { height: var(--dynamic-row-height, 12mm); }
          .print-time-cell { font-weight: 900; white-space: nowrap; font-size: 0.75rem; }
          .print-subject { font-weight: 700; color: black; font-size: 0.72rem; line-height: 1; margin-bottom: 2px; }
          .print-subject.is-free { font-weight: 500; font-style: italic; opacity: 0.6; font-size: 0.65rem; }
          .print-teacher { color: black; font-size: 0.62rem; font-weight: normal; line-height: 1; }
          .print-break-cell { 
            height: 6mm; 
            font-weight: 400; 
            font-size: 0.65rem; 
            letter-spacing: 0.4em; 
            background: #fff; 
            text-transform: uppercase;
          }

          @media print {
            body { background: white; padding: 0; }
            .no-print-toolbar { display: none; }
            .horarios-print-page { box-shadow: none; margin: 0; padding: 0; width: 100%; height: auto; }
            .yellow-banner { 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
              color: black !important;
            }
            @page { size: A4 landscape; margin: 10mm; }
          }
        </style>
      </head>
      <body>
        <div class="no-print-toolbar">
          <button class="btn-print" onclick="window.print()">
             🖨️ IMPRIMIR TODOS LOS HORARIOS (${allSchedules.length})
          </button>
        </div>
        ${pagesHTML}
      </body>
    </html>
  `);
  win.document.close();
};
