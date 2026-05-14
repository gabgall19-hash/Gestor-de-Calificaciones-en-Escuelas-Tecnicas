import { getCoursePreceptor, abbreviateSubject } from '../functions/PreceptorHelpers';

export const handlePrintParteSemanal_AllWeek = (data, course, scheduleData, selectedMonth, attendanceMap) => {
  const win = window.open('', '_blank');
  
  const [year, month] = selectedMonth.split('-').map(Number);
  const studentsSource = (data.allStudents && data.allStudents.length > 0) ? data.allStudents : (data.students || []);
  const students = studentsSource
    .filter(s => s.course_id === course.id)
    .sort((a, b) => a.apellido.localeCompare(b.apellido));

  // Determine weeks
  const weeks = [];
  let current = new Date(year, month - 1, 1);
  // Find Monday of the first week
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  current = new Date(year, month - 1, diff);

  while (true) {
    const week = [];
    const mon = new Date(current);
    for (let i = 0; i < 5; i++) {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      week.push(d);
    }
    // Check if week belongs to month
    const hasDaysInMonth = week.some(d => d.getMonth() === month - 1);
    if (!hasDaysInMonth && weeks.length > 0) break;
    if (hasDaysInMonth) weeks.push(week);
    
    current.setDate(current.getDate() + 7);
    if (current.getMonth() !== month - 1 && weeks.length >= 5) break;
  }

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  let grid = [];
  try {
    const parsed = JSON.parse(scheduleData.grid_data || '[]');
    grid = Array.isArray(parsed) ? parsed : (parsed.grid || []);
  } catch (e) {
    grid = [];
  }

  let leftCount = 20;
  let rightCount = 0;
  if (students.length <= 20) { leftCount = 20; rightCount = 0; }
  else if (students.length <= 30) { leftCount = 15; rightCount = 15; }
  else { leftCount = 20; rightCount = 20; }

  const leftCol = students.slice(0, leftCount);
  const rightCol = students.slice(leftCount, leftCount + rightCount);

  const renderAttendanceTable = (cols, startIdx, week) => `
    <table class="attendance-table" style="width: 49%;">
      <colgroup>
        <col style="width: 28px;">
        <col style="width: auto;">
        ${Array(5).fill('<col style="width: 25px;">').join('')}
      </colgroup>
      <thead>
        <tr class="date-row">
          <th colspan="2" style="border: none;"></th>
          ${week.map(d => `<th class="col-day-date">${d.getDate()}</th>`).join('')}
        </tr>
        <tr>
          <th class="col-num">#</th>
          <th class="col-name">Apellidos y Nombres</th>
          <th class="col-day">Lu</th>
          <th class="col-day">Ma</th>
          <th class="col-day">Mi</th>
          <th class="col-day">Ju</th>
          <th class="col-day">Vi</th>
        </tr>
      </thead>
      <tbody>
        ${Array(cols.length || 20).fill(0).map((_, i) => {
          const s = cols[i];
          const actualIdx = startIdx + i;
          return `
            <tr>
              <td class="col-num">${actualIdx}</td>
              <td class="col-name">${s ? (s.apellido + ' ' + s.nombre).toUpperCase() : ''}</td>
              ${week.map(d => {
                const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                const val = s ? (attendanceMap[`${s.id}|${dateKey}`] || '') : '';
                const displayVal = val === 'PD' ? '<div style="width: 2px; height: 100%; min-height: 14px; background-color: #ef4444; margin: 0 auto; -webkit-print-color-adjust: exact; print-color-adjust: exact;"></div>' : val;
                return `<td style="${val === 'PD' ? 'padding: 0;' : ''}">${displayVal}</td>`;
              }).join('')}
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  const pagesHTML = weeks.map(week => `
    <div class="printable-page">
      <div class="header-main">
        <div class="header-left">
          <img src="/Escudo_de_la_Provincia_de_Santa_Cruz.svg" class="shield-img" />
          <div class="inst-text">Consejo Provincial de Educación<br/>Provincia de Santa Cruz</div>
        </div>
        <div class="header-center"></div>
        <div class="header-right">
          <img src="/logo.png" class="logo-img" />
          <div class="inst-text">Industrial N°6<br/>"X Brigada Aerea"</div>
        </div>
      </div>

      <div class="title-row">
        <div>Parte Semanal de Asistencia</div>
        <div>Curso: ${course.ano} ${course.division}</div>
        <div>Mes: ${[...new Set(week.map(d => monthNames[d.getMonth()]))].join('/')}</div>
      </div>

      <div class="meta-row">
        Auxiliar Docente: ${getCoursePreceptor(data, course.id).toUpperCase()}
      </div>

      <div class="attendance-container" style="grid-template-columns: ${rightCount > 0 ? '1fr 1fr' : '1fr'};">
        ${renderAttendanceTable(Array(leftCount).fill(0).map((_, i) => leftCol[i]), 1, week)}
        ${rightCount > 0 ? renderAttendanceTable(Array(rightCount).fill(0).map((_, i) => rightCol[i]), leftCount + 1, week) : ''}
      </div>

      <div class="schedule-section">
        <table class="schedule-table">
          <thead>
            <tr class="sched-date-row">
              <th style="border: none !important;"></th>
              ${week.map(d => `<th class="sched-date-cell">${d.getDate()}</th>`).join('')}
            </tr>
            <tr>
              <th style="width: 75px;">Horas/ Día/Fecha</th>
              <th style="width: 18%;">Lunes</th>
              <th style="width: 18%;">Martes</th>
              <th style="width: 18%;">Miércoles</th>
              <th style="width: 18%;">Jueves</th>
              <th style="width: 18%;">Viernes</th>
            </tr>
          </thead>
          <tbody>
            ${grid.map(row => {
              if (row.type === 'break' || row.isRecreo) {
                return `
                  <tr class="row-break">
                    <td style="vertical-align: middle !important; height: 15px !important;">${row.time || ''}</td>
                    <td colspan="5" style="vertical-align: middle !important; font-size: 7pt; height: 15px !important; line-height: 15px !important;">RECREO</td>
                  </tr>
                `;
              }
              return `
                <tr>
                  <td style="font-weight: 900; vertical-align: middle;">${row.time || ''}</td>
                  ${['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map(day => {
                    const d = row.days?.[day];
                    const subject = d?.subject || '';
                    const isLibre = !subject || subject.toLowerCase().includes('libre');
                    if (isLibre) {
                      return `<td style="vertical-align: middle !important; color: #bbb; font-weight: 900; font-size: 0.45rem; text-align: center;">HORARIO LIBRE</td>`;
                    }
                    return `
                      <td>
                        <span class="cell-subject">${abbreviateSubject(subject, 25)}</span>
                        <span class="cell-teacher">${d?.teacher ? (d.teacher.startsWith('Prof.') ? d.teacher : 'Prof. ' + d.teacher) : ''}</span>
                        <span class="signature-line"></span>
                      </td>
                    `;
                  }).join('')}
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div class="footer-suplentes">
        <div class="suplente-box">SUPLENTE N° 1</div>
        <div class="suplente-box">SUPLENTE N° 2</div>
        <div class="suplente-box">SUPLENTTE N° 3</div>
      </div>
    </div>
  `).join('');

  win.document.write(`
    <html>
      <head>
        <title>Partes de Asistencia Mensual - ${course.ano} ${course.division}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700;900&display=swap');
          body { font-family: 'Roboto', sans-serif; margin: 0; padding: 0; background: #eee; color: black; }
          .no-print-toolbar { position: fixed; top: 0; left: 0; right: 0; height: 60px; background: #333; color: white; display: flex; align-items: center; justify-content: center; z-index: 1000; box-shadow: 0 2px 10px rgba(0,0,0,0.3); }
          .btn-print { background: #10b981; color: white; border: none; padding: 10px 30px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 1rem; }
          .printable-page { width: 210mm; min-height: 297mm; padding: 8mm 8mm; margin: 80px auto 20px; background: white; box-sizing: border-box; }
          .header-main { display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; margin-bottom: 5px; }
          .header-left, .header-right { text-align: center; }
          .shield-img { height: 70px; }
          .logo-img { height: 75px; }
          .inst-text { font-size: 0.65rem; font-weight: 900; line-height: 1.2; margin-top: 5px; text-transform: uppercase; }
          .title-row { display: grid; grid-template-columns: 1.5fr 1fr 1fr; border-bottom: 1px solid black; padding: 2px 0; margin-bottom: 5px; font-size: 0.75rem; font-weight: 900; }
          .meta-row { font-size: 0.75rem; font-weight: 900; margin-bottom: 15px; }
          .attendance-container { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 25px; align-items: start; }
          .attendance-table { border-collapse: collapse; border: 1px solid black; font-size: 0.6rem; table-layout: fixed; }
          .attendance-table th, .attendance-table td { border: 1px solid black; padding: 1px 3px; height: 14px; min-height: 14px; max-height: 14px; text-align: center; line-height: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .attendance-table th { background: #fff; font-weight: 700; }
          .date-row th { height: 14px !important; border: none !important; }
          .col-day-date { background: white !important; border: 1px solid black !important; }
          .col-num { font-weight: bold; }
          .col-name { text-align: left !important; font-size: 0.55rem; }
          .col-day { font-weight: bold; }
          .schedule-section { margin-top: 5px; }
          .schedule-table { width: 100%; border-collapse: collapse; border: 1px solid black; table-layout: fixed; }
          .schedule-table th, .schedule-table td { border: 1px solid black; padding: 0; text-align: center; font-size: 0.52rem; height: 48px; vertical-align: top; }
          .schedule-table th { background: #fff; font-weight: 900; height: 22px; vertical-align: middle; }
          .sched-date-row th { height: 12px !important; border: 1px solid black !important; }
          .sched-date-cell { background: white !important; }
          .row-break { background: #e5e5e5 !important; -webkit-print-color-adjust: exact; font-weight: 900; letter-spacing: 5px; vertical-align: middle !important; height: 15px !important; }
          .row-break td { height: 15px !important; min-height: 15px !important; line-height: 15px !important; padding: 0 !important; }
          .cell-subject { font-weight: 900; display: block; line-height: 1; margin-top: 3px; padding: 0 2px; }
          .cell-teacher { font-size: 0.48rem; font-style: italic; color: #333; display: block; margin-top: 2px; padding: 0 2px; }
          .signature-line { border-top: 1px solid black; width: 100%; margin-top: 6px; height: 24px; display: block; }
          .footer-suplentes { margin-top: 5px; display: grid; grid-template-columns: 1fr 1fr 1fr; border: 1px solid black; }
          .suplente-box { border-right: 1px solid black; padding: 2px; font-size: 0.58rem; font-weight: 900; text-align: center; }
          .suplente-box:last-child { border-right: none; }
          @media print {
            @page { margin: 0; size: A4; }
            body { background: white; padding: 0; margin: 0; }
            .no-print-toolbar { display: none; }
            .printable-page { margin: 0; box-shadow: none; width: 100%; height: 297mm; min-height: 297mm; padding: 5mm; page-break-after: always; overflow: hidden; position: relative; }
            .printable-page:last-child { page-break-after: auto; }
            .row-break { background: #e5e5e5 !important; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="no-print-toolbar">
          <button class="btn-print" onclick="window.print()">🖨️ IMPRIMIR TODOS LOS PARTES DEL MES</button>
        </div>
        ${pagesHTML}
      </body>
    </html>
  `);
  win.document.close();
};
