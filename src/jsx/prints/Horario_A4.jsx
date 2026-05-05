import { simplifyTecName } from '../functions/PreceptorHelpers';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

const getHeaderColor = (course) => {
  const tec = course?.tecnicatura_nombre?.toUpperCase() || '';
  if (tec.includes('CICLO BASICO')) return '#ff9900'; 
  if (tec.includes('AERONAUTICA')) return '#2563eb'; 
  if (tec.includes('ELECTRONICA')) return '#16a34a'; 
  if (tec.includes('AUTOMOTORES')) return '#dc2626'; 
  return '#ffff00';
};

export const handlePrintHorario = (course, grid) => {
  if (!course || !grid) return;

  const win = window.open('', '_blank');
  
  const rowCount = Math.max(grid.length || 0, 1);
  const rowHeight = rowCount <= 8 ? '16mm' : rowCount <= 10 ? '13mm' : rowCount <= 12 ? '11mm' : '9.5mm';

  const rowsHTML = grid.map((row, rowIndex) => {
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

  win.document.write(`
    <html>
      <head>
        <title>Horario - ${course.ano} ${course.division}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          
          body { 
            font-family: 'Arial', sans-serif; 
            margin: 0; padding: 0; 
            background: #f1f5f9;
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
            color: black; box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            margin-bottom: 20px;
          }

          .yellow-banner {
            text-align: center;
            font-weight: 900;
            padding: 10px;
            border: 2px solid black;
            font-size: 1.2rem;
            background: #ffff00;
            color: black;
            text-transform: uppercase;
          }

          .meta-print-table {
            width: 100%; border-collapse: collapse; margin-top: -2px;
          }
          .meta-print-table th, .meta-print-table td {
            border: 2px solid black; padding: 4px; text-align: center; font-size: 0.8rem;
          }
          .meta-print-table th { background: #f0f0f0; font-weight: 400; color: #666; }
          .meta-print-table td { font-weight: 900; }

          .schedule-print-table { 
            width: 100%; border-collapse: collapse; margin-top: 10px; table-layout: fixed; 
          }
          .schedule-print-table th, .schedule-print-table td { 
            border: 2px solid black; padding: 6px; text-align: center; color: black; 
          }
          .schedule-print-table th { font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; }
          
          .print-time-cell, .print-slot-cell { 
            height: ${rowHeight}; 
          }
          .print-time-cell { font-weight: 900; white-space: nowrap; font-size: 0.85rem; }
          .print-subject { font-weight: 700; color: black; font-size: 0.72rem; line-height: 1; margin-bottom: 2px; }
          .print-subject.is-free { font-weight: 500; font-style: italic; opacity: 0.7; font-size: 0.65rem; }
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
            @page { size: A4 landscape; margin: 10mm; }
            .yellow-banner { 
              -webkit-print-color-adjust: exact; 
              print-color-adjust: exact; 
              background: ${getHeaderColor(course)} !important; 
              color: black !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="no-print-toolbar">
          <button class="btn-print" onclick="window.print()">
             🖨️ IMPRIMIR HORARIO
          </button>
        </div>
        
        <div class="horarios-print-page">
          <div class="yellow-banner" style="background: ${getHeaderColor(course)};">
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
                <td>${parseInt(course.ano, 10) <= 3 ? 'BÁSICO' : 'SUPERIOR'}</td>
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
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>
        </div>
      </body>
    </html>
  `);
  win.document.close();
};
