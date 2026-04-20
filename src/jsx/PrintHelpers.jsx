import { formatDNI, numberToWords, simplifyTecName, allWorkshopNames } from './PreceptorHelpers';

export const getCoursePreceptor = (data, courseId) => {
  return (data.users || [])
    .filter(u => u.rol === 'preceptor' && String(u.preceptor_course_ids || '').split(',').includes(String(courseId)))
    .map(u => u.nombre)
    .join(', ') || 'Sin asignar';
};

export const handlePrintAllCourses = (data) => {
  const win = window.open('', '_blank');
  const coursesHTML = data.allCourses.map(course => {
    const students = data.students.filter(s => s.course_id === course.id).sort((a, b) => a.apellido.localeCompare(b.apellido));
    if (students.length === 0) return '';

    const yearText = String(course.year_nombre).includes('2026') ? `Ciclo ${course.year_nombre}` : `Ciclo 2026 · ${course.year_nombre}`;

    const availableHeight = 180; // mm
    const rowHeight = Math.min(Math.max(Math.floor(availableHeight / students.length), 6), 14);
    const fontSize = rowHeight < 8 ? '0.75rem' : rowHeight < 10 ? '0.85rem' : '0.95rem';
    const rowPadding = `${Math.floor(rowHeight / 3)}px 10px`;

    return `
      <div class="printable-page glass-card">
        <div class="print-header" style="text-align: center; margin-bottom: 1.5rem;">
          <img src="/logo.png" style="height: 60px; margin-bottom: 0.5rem;" />
          <h1 style="margin: 0; font-size: 1.3rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">
            INDUSTRIAL N°6 "X BRIGADA AEREA"
          </h1>
          <p style="margin: 0.3rem 0 0; font-size: 0.9rem; font-weight: bold; text-transform: uppercase; opacity: 0.8;">
            Planilla de Seguimiento y Evaluación de Curso
          </p>

          <div class="boletin-info-grid">
            <div><strong>CURSO:</strong> ${course.ano} ${course.division} · <strong>TURNO:</strong> ${course.turno}</div>
            <div style="text-align: right;"><strong>${yearText}</strong></div>
            <div style="grid-column: span 2; margin-top: 5px; opacity: 0.9;">
              <strong>TECNICATURA:</strong> ${course.tecnicatura_nombre}<br/>
              <strong style="margin-top: 5px; display: inline-block;">PRECEPTOR:</strong> ${getCoursePreceptor(data, course.id)}
            </div>
          </div>
        </div>

        <table class="print-table" style="font-size: ${fontSize};">
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>Apellido y Nombres</th>
              <th style="width: 110px;">DNI</th>
              <th style="width: 260px;">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            ${students.map((s, idx) => `
              <tr>
                <td style="text-align: center; padding: ${rowPadding};">${idx + 1}</td>
                <td style="padding: ${rowPadding};">${s.apellido}, ${s.nombre}</td>
                <td style="padding: ${rowPadding};">${formatDNI(s.dni)}</td>
                <td style="padding: ${rowPadding};"></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }).join('');

  win.document.write(`
    <html>
      <head>
        <title>Planillas - Industrial N6</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          :root {
            --primary: #6366f1;
            --bg-gradient: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
            --glass-bg: rgba(255, 255, 255, 0.05);
            --glass-border: rgba(255, 255, 255, 0.1);
          }
          body { 
            font-family: 'Inter', sans-serif; 
            margin: 0; 
            padding: 0; 
            background: #0f172a;
            background-image: var(--bg-gradient);
            background-attachment: fixed;
            color: white;
            padding-top: 80px;
          }
          .no-print-toolbar {
            position: fixed;
            top: 0; left: 0; right: 0;
            height: 70px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(15, 23, 42, 0.8);
            backdrop-filter: blur(10px);
            z-index: 1000;
            border-bottom: 1px solid var(--glass-border);
            gap: 1.5rem;
          }
          .btn-print {
            background: var(--primary);
            color: white;
            border: none;
            padding: 0.7rem 2rem;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            font-size: 1rem;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
          }
          @page {
            size: A4;
            margin: 20mm 15mm;
          }
          .printable-page { 
            width: 210mm;
            min-height: 297mm;
            padding: 20mm 15mm;
            box-sizing: border-box;
            background: white !important;
            margin-bottom: 30px;
            position: relative;
            color: black !important;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            border-radius: 4px;
            margin-left: auto;
            margin-right: auto;
          }
          .printable-page * {
            color: black !important;
          }
          .glass-card {
            background: white !important;
            border: none !important;
            box-shadow: none !important;
          }
          .boletin-info-grid {
            margin-top: 1.5rem; 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            border: 2px solid black; 
            padding: 15px; 
            text-align: left; 
            font-size: 0.95rem;
          }
          .print-table { 
            width: 100%; 
            border-collapse: collapse; 
            border: 2px solid black; 
            margin-top: 20px;
            table-layout: fixed;
          }
          .print-table th, .print-table td { 
            border: 1px solid black; 
            text-align: left; 
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          .print-table th { 
            background: #eee !important;
            font-weight: 900;
            text-transform: uppercase;
            font-size: 0.75rem;
            padding: 12px 10px;
            -webkit-print-color-adjust: exact;
          }
          @media print {
            body { background: white !important; color: black !important; padding: 0 !important; display: block !important; }
            .no-print-toolbar { display: none !important; }
            .printable-page { margin: 0 !important; padding: 0 !important; width: 100% !important; height: auto !important; border: none !important; box-shadow: none !important; background: white !important; }
          }
        </style>
      </head>
      <body>
        <div class="no-print-toolbar">
          <button class="btn-print" onclick="window.print()">
             🖨️ IMPRIMIR PLANILLAS
          </button>
          <p style="font-size: 0.9rem; opacity: 0.8;">Vista previa institucional (un curso por hoja A4)</p>
        </div>
        ${coursesHTML}
      </body>
    </html>
  `);
  win.document.close();
};

export const handlePrintSeguimientoGlobal = async (data, selectedYearId, user, setStatus) => {
  const activeCourses = data.courses.filter(c => c.activo === 1).sort((a, b) => a.ano - b.ano || a.division.localeCompare(b.division));
  if (activeCourses.length === 0) return;

  try {
    setStatus('Cargando datos de todos los alumnos...');
    const res = await fetch(`/api/data?type=grid&yearId=${selectedYearId}&includeAllStudents=true&userId=${user.id}`, {
      headers: { 'Authorization': `Bearer auth-token-${user.id}` }
    });
    if (!res.ok) throw new Error(`Error servidor: ${res.status}`);
    const globalData = await res.json();
    setStatus('');

    const allStudents = globalData.allStudents || [];
    if (allStudents.length === 0) {
      alert(`No se encontraron alumnos activos para imprimir en el año lectivo seleccionado (ID: ${selectedYearId}). Por favor, verifique que los cursos tengan alumnos cargados.`);
      return;
    }

    let allContent = '';
    activeCourses.forEach(course => {
      const courseStudents = allStudents.filter(s => s.course_id === course.id).sort((a, b) => a.apellido.localeCompare(b.apellido));
      if (courseStudents.length === 0) return;

      const yearText = String(course.year_nombre).includes('2026') ? `Ciclo ${course.year_nombre}` : `Ciclo 2026 · ${course.year_nombre}`;
      const availableHeight = 180;
      const rowHeight = Math.min(Math.max(Math.floor(availableHeight / courseStudents.length), 6), 14);
      const fontSize = rowHeight < 8 ? '0.75rem' : rowHeight < 10 ? '0.85rem' : '0.95rem';
      const rowPadding = `${Math.floor(rowHeight / 3)}px 10px`;

      allContent += `
        <div class="printable-page glass-card">
          <div class="print-header" style="text-align: center; margin-bottom: 1.5rem;">
            <img src="/logo.png" style="height: 60px; margin-bottom: 0.5rem;" />
            <h1 style="margin: 0; font-size: 1.3rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">
              INDUSTRIAL N°6 "X BRIGADA AEREA"
            </h1>
            <p style="margin: 0.3rem 0 0; font-size: 0.9rem; font-weight: bold; text-transform: uppercase; opacity: 0.8;">
              Planilla de Seguimiento y Evaluación de Curso
            </p>

            <div class="boletin-info-grid">
              <div><strong>CURSO:</strong> ${course.ano} ${course.division} · <strong>TURNO:</strong> ${course.turno}</div>
              <div style="text-align: right;"><strong>${yearText}</strong></div>
              <div style="grid-column: span 2; margin-top: 5px; opacity: 0.9;">
                <strong>TECNICATURA:</strong> ${course.tecnicatura_nombre}<br/>
                <strong style="margin-top: 5px; display: inline-block;">PRECEPTOR:</strong> ${getCoursePreceptor(data, course.id)}
              </div>
            </div>
          </div>

          <table class="print-table" style="font-size: ${fontSize};">
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>Apellido y Nombres</th>
                <th style="width: 110px;">DNI</th>
                <th style="width: 260px;">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              ${courseStudents.map((s, idx) => `
                <tr>
                  <td style="text-align: center; padding: ${rowPadding};">${idx + 1}</td>
                  <td style="padding: ${rowPadding};">${s.apellido}, ${s.nombre}</td>
                  <td style="padding: ${rowPadding};">${formatDNI(s.dni)}</td>
                  <td style="padding: ${rowPadding};"></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    });

    const win = window.open('', '_blank');
    win.document.write(`
      <html>
        <head>
          <title>Planillas de Seguimiento Global</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            @page { size: A4; margin: 20mm 15mm; }
            body { font-family: 'Inter', sans-serif; margin: 0; padding: 100px 0; background: #0f172a; display: flex; flex-direction: column; align-items: center; color: white; }
            .printable-page { width: 210mm; min-height: 297mm; padding: 20mm 15mm; box-sizing: border-box; background: white !important; margin-bottom: 30px; position: relative; color: black !important; box-shadow: 0 20px 50px rgba(0,0,0,0.5); border-radius: 4px; }
            .printable-page + .printable-page { page-break-before: always; break-before: page; }
            .printable-page * { color: black !important; }
            .print-table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid #000; }
            .print-table th, .print-table td { border: 1px solid #000; padding: 8px 12px; text-align: left; }
            .print-table th { background: #f8fafc; font-weight: 900; text-transform: uppercase; font-size: 0.8rem; }
            .boletin-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; text-align: left; margin-top: 1rem; border: 1px solid #000; padding: 15px; font-size: 0.85rem; }
            .no-print-toolbar { position: fixed; top: 0; left: 0; right: 0; height: 70px; display: flex; align-items: center; justify-content: center; background: rgba(30, 41, 59, 0.8); backdrop-filter: blur(10px); z-index: 1000; border-bottom: 1px solid rgba(255,255,255,0.1); gap: 1.5rem; }
            .btn-print { background: #6366f1; color: white; border: none; padding: 0.7rem 2rem; border-radius: 8px; font-weight: bold; cursor: pointer; }
            @media print {
              body { background: white !important; padding: 0 !important; margin: 0 !important; display: block !important; }
              .no-print-toolbar { display: none !important; }
              .printable-page { margin: 0 !important; padding: 0 !important; width: 100% !important; height: auto !important; box-shadow: none !important; background: white !important; border: none !important; max-height: 265mm; overflow: hidden; }
            }
          </style>
        </head>
        <body>
          <div class="no-print-toolbar">
            <span style="font-weight: bold; color: white;">VISTA PREVIA GLOBAL - ${activeCourses.length} CURSOS</span>
            <button class="btn-print" onclick="window.print()">IMPRIMIR TODO</button>
          </div>
          ${allContent}
        </body>
      </html>
    `);
    win.document.close();
  } catch (err) {
    console.error(err);
    setStatus('');
    alert("Error al cargar los datos para la impresión global.");
  }
};

export const handlePrintPlanillasCurso = (data, selectedCourseId) => {
  const activeCourse = data.courses.find(c => c.id === selectedCourseId);
  if (!activeCourse) return;

  const win = window.open('', '_blank');
  const subjectsHTML = data.subjects.map(subject => {
    const subjectKey = `${activeCourse.id}-${subject.id}`;
    const professors = (data.users || [])
      .filter(u => {
        const assignments = String(u.professor_subject_ids || '').split(',').map(s => s.trim());
        return u.rol === 'profesor' && assignments.includes(subjectKey);
      })
      .map(u => u.nombre)
      .join(' / ') || '________________';

    const students = [...data.students].sort((a, b) => a.apellido.localeCompare(b.apellido));

    const rowCount = students.length > 30 ? 40 : 30;
    const rowHeight = students.length > 30 ? '4.4mm' : '5.8mm';

    const tableRows = Array.from({ length: rowCount }).map((_, rowIndex) => {
      const s = students[rowIndex];

      const getV = (pid, f = 'valor_t') => {
        if (!s) return '';
        const g = data.grades.find(g => g.alumno_id === s.id && g.materia_id === subject.id && g.periodo_id === pid);
        return g ? (g[f] || '') : '';
      };

      const isModular = (subject.tipo || '').toLowerCase().includes('modular');

      if (isModular) {
        return `
          <tr>
            <td style="text-align: center; font-size: 7pt;">${s ? rowIndex + 1 : ''}</td>
            <td class="student-name-cell" style="width: 150px !important; font-size: 7pt;">${s ? `${s.apellido}, ${s.nombre}` : ''}</td>
            <td class="grade-cell narrow">${getV(1, 'valor_t')}</td><td class="grade-cell narrow">${getV(1, 'valor_p')}</td>
            <td class="grade-cell narrow">${getV(2, 'valor_t')}</td><td class="grade-cell narrow">${getV(2, 'valor_p')}</td>
            <td class="grade-cell narrow" style="background: #f9f9f9;">${getV(2, 'valor_pond')}</td>
            <td class="spacer-cell"></td>
            <td class="grade-cell narrow">${getV(3, 'valor_t')}</td><td class="grade-cell narrow">${getV(3, 'valor_p')}</td>
            <td class="grade-cell narrow">${getV(4, 'valor_t')}</td><td class="grade-cell narrow">${getV(4, 'valor_p')}</td>
            <td class="grade-cell narrow" style="background: #f9f9f9;">${getV(4, 'valor_pond')}</td>
            <td class="spacer-cell"></td>
            <td class="grade-cell narrow">${getV(5, 'valor_t')}</td><td class="grade-cell narrow">${getV(5, 'valor_p')}</td>
            <td class="grade-cell narrow">${getV(6, 'valor_t')}</td><td class="grade-cell narrow">${getV(6, 'valor_p')}</td>
            <td class="grade-cell narrow" style="background: #f9f9f9;">${getV(6, 'valor_pond')}</td>
            <td class="spacer-cell"></td>
            <td class="grade-cell narrow">${getV(7)}</td><td class="grade-cell narrow">${getV(8)}</td><td class="grade-cell narrow">${getV(9)}</td>
            <td class="grade-cell narrow" style="background: #f9f9f9;">${getV(11)}</td>
            <td class="grade-cell def-cell narrow">${getV(10)}</td>
          </tr>
        `;
      }

      return `
        <tr>
          <td style="text-align: center;">${s ? rowIndex + 1 : ''}</td>
          <td class="student-name-cell">${s ? `${s.apellido}, ${s.nombre}` : ''}</td>
          <td class="grade-cell">${getV(1)}</td>
          <td class="grade-cell">${getV(2)}</td>
          <td class="letter-cell">${s ? numberToWords(getV(2)) : ''}</td>
          <td class="spacer-cell"></td>
          <td class="grade-cell">${getV(3)}</td>
          <td class="grade-cell">${getV(4)}</td>
          <td class="letter-cell">${s ? numberToWords(getV(4)) : ''}</td>
          <td class="spacer-cell"></td>
          <td class="grade-cell">${getV(5)}</td>
          <td class="grade-cell">${getV(6)}</td>
          <td class="letter-cell">${s ? numberToWords(getV(6)) : ''}</td>
          <td class="spacer-cell"></td>
          <td class="grade-cell">${getV(7)}</td>
          <td class="grade-cell">${getV(8)}</td>
          <td class="grade-cell">${getV(9)}</td>
          <td class="grade-cell" style="background: #f9f9f9;">${getV(11)}</td>
          <td class="grade-cell def-cell">${getV(10)}</td>
        </tr>
      `;
    }).join('');

    return `
      <!-- PAGINA 1: FRENTE (CALIFICACIONES) -->
      <div class="printable-page glass-card">
        <div class="a4-portrait">
          <div class="institutional-header" style="display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 5px;">
            <div class="inst-left" style="text-align: left;">
              <img src="/logo.png" style="height: 40px; margin-bottom: 2px;" /><br/>
              Escuela Industrial N° 6<br/>
              "X Brigada Aérea"
            </div>
            <div class="inst-center" style="flex: 1; text-align: center;">
              <div class="main-title" style="margin-bottom: 0; font-size: 14pt;">PLANILLA DE CALIFICACIONES</div>
              <div class="sub-title">Ciclo Lectivo 2026</div>
            </div>
            <div style="width: 100px;"></div>
          </div>

          <div class="info-boxes">
            <div class="info-row" style="display: flex; align-items: stretch;">
              <div class="info-label" style="width: 140px; color: #000; font-size: 8pt; font-weight: 900;">ESPACIO CURRICULAR:</div>
              <div class="info-value-box" style="flex: 1; min-width: 450px; text-align: center; color: #000; border: 1.5px solid #000; padding: 2px;">${subject.nombre}</div>
              <div class="info-label" style="width: 60px; margin-left:15px; color: #000; font-size: 8pt; font-weight: 900;">CURSO:</div>
              <div class="info-value-box" style="width: 40px; text-align: center; color: #000; border: 1.5px solid #000; padding: 2px;">${activeCourse.ano}</div>
            </div>
            <div class="info-row" style="display: flex; align-items: stretch; margin-top: 4px;">
              <div class="info-label" style="width: 140px; color: #000; font-size: 8pt; font-weight: 900;">DOCENTES A CARGO:</div>
              <div class="info-value-box" style="flex: 1; min-width: 450px; text-align: center; color: #000; border: 1.5px solid #000; padding: 2px;">${professors}</div>
              <div class="info-label" style="width: 60px; margin-left: 15px; color: #000; font-size: 8pt; font-weight: 900;">DIVISION:</div>
              <div class="info-value-box" style="width: 40px; text-align: center; color: #000; border: 1.5px solid #000; padding: 2px;">${activeCourse.division}</div>
            </div>
          </div>

          ${((subject.tipo || '').toLowerCase().includes('modular')) ? `
          <table class="planilla-table official-format modular-layout" style="--dynamic-row-height: ${rowHeight};">
            <colgroup>
              <col style="width: 6mm;"> <!-- N° -->
              <col style="width: 40mm;"> <!-- Alumno -->
              <col style="width: 6mm;"><col style="width: 6mm;">
              <col style="width: 6mm;"><col style="width: 6mm;"><col style="width: 6mm;">
              <col style="width: 1mm;">
              <col style="width: 6mm;"><col style="width: 6mm;">
              <col style="width: 6mm;"><col style="width: 6mm;"><col style="width: 6mm;">
              <col style="width: 1mm;">
              <col style="width: 6mm;"><col style="width: 6mm;">
              <col style="width: 6mm;"><col style="width: 6mm;"><col style="width: 6mm;">
              <col style="width: 1mm;">
              <col style="width: 6mm;"><col style="width: 6mm;"><col style="width: 6mm;"><col style="width: 6mm;"><col style="width: 8mm;">
            </colgroup>
            <thead>
              <tr>
                <th rowspan="5" style="width: 25px;">N°</th>
                <th rowspan="5" style="width: 150px;">APELLIDO Y NOMBRE DEL ALUMNO</th>
                <th colspan="17">LOGROS ALCANZADOS POR EL ALUMNO</th>
                <th rowspan="5" colspan="1" class="spacer-cell"></th>
                <th colspan="5" rowspan="2">INSTANCIAS DE EVALUACIÓN Y COMPENSACIÓN</th>
              </tr>
              <tr>
                <th colspan="5" class="trim-header" style="font-size: 6.5pt;">1ER INF. ORIENTADOR</th>
                <th rowspan="4" colspan="1" class="spacer-cell"></th>
                <th colspan="5" class="trim-header" style="font-size: 6.5pt;">2DO INF. ORIENTADOR</th>
                <th rowspan="4" colspan="1" class="spacer-cell"></th>
                <th colspan="5" class="trim-header" style="font-size: 6.5pt;">3ER INF. ORIENTADOR</th>
              </tr>
              <tr>
                <th colspan="5" class="trim-header" style="font-size: 6.5pt; font-weight: 900;">1ER TRIMESTRE:</th>
                <th colspan="5" class="trim-header" style="font-size: 6.5pt; font-weight: 900;">2DO TRIMESTRE:</th>
                <th colspan="5" class="trim-header" style="font-size: 6.5pt; font-weight: 900;">3ER TRIMESTRE:</th>
                <th rowspan="3" style="width: 15px; font-size: 4.5pt;">DIC</th>
                <th rowspan="3" style="width: 15px; font-size: 4.5pt;">FEB</th>
                <th rowspan="3" style="width: 15px; font-size: 4.5pt;">MAR</th>
                <th rowspan="3" style="width: 15px; font-size: 4pt; line-height: 1; background: #eee;">OTRAS<br/>INST.</th>
                <th rowspan="3" class="def-cell" style="width: 25px; font-size: 5pt;">DEF.</th>
              </tr>
              <tr>
                <th colspan="5" class="trim-header" style="font-size: 5.5pt; font-weight: normal; font-style: italic;">CALIF. TRIMESTRAL</th>
                <th colspan="5" class="trim-header" style="font-size: 5.5pt; font-weight: normal; font-style: italic;">CALIF. TRIMESTRAL</th>
                <th colspan="5" class="trim-header" style="font-size: 5.5pt; font-weight: normal; font-style: italic;">CALIF. TRIMESTRAL</th>
              </tr>
              <tr>
                <th style="font-size: 6pt;">TEORIA</th><th style="font-size: 6pt;">PRACTICA</th>
                <th style="font-size: 6pt;">TEORIA</th><th style="font-size: 6pt;">PRACTICA</th><th style="font-size: 6pt; background: #eee;">POND.</th>
                <th style="font-size: 6pt;">TEORIA</th><th style="font-size: 6pt;">PRACTICA</th>
                <th style="font-size: 6pt;">TEORIA</th><th style="font-size: 6pt;">PRACTICA</th><th style="font-size: 6pt; background: #eee;">POND.</th>
                <th style="font-size: 6pt;">TEORIA</th><th style="font-size: 6pt;">PRACTICA</th>
                <th style="font-size: 6pt;">TEORIA</th><th style="font-size: 6pt;">PRACTICA</th><th style="font-size: 6pt; background: #eee;">POND.</th>
              </tr>
            </thead>
            ` : `
            <table class="planilla-table official-format" style="--dynamic-row-height: ${rowHeight};">
            <colgroup>
              <col style="width: 6mm;">
              <col style="width: 45mm;">
              <col style="width: 8mm;"><col style="width: 8mm;"><col style="width: 12mm;">
              <col style="width: 1.5mm;">
              <col style="width: 8mm;"><col style="width: 8mm;"><col style="width: 12mm;">
              <col style="width: 1.5mm;">
              <col style="width: 8mm;"><col style="width: 8mm;"><col style="width: 12mm;">
              <col style="width: 1.5mm;">
              <col style="width: 8mm;"><col style="width: 8mm;"><col style="width: 8mm;"><col style="width: 8mm;"><col style="width: 9mm;">
            </colgroup>
            <thead>
              <tr>
                <th rowspan="5" style="width: 30px;">N°</th>
                <th rowspan="5" style="width: 180px;">APELLIDO Y NOMBRE DEL ALUMNO</th>
                <th colspan="11">LOGROS ALCANZADOS POR EL ALUMNO</th>
                <th rowspan="5" colspan="1" class="spacer-cell"></th>
                <th colspan="5" rowspan="2">INSTANCIAS DE EVALUACIÓN Y COMPENSACIÓN</th>
              </tr>
              <tr>
                <th colspan="3" class="trim-header" style="font-size: 6.5pt;">1ER INF. ORIENTADOR</th>
                <th rowspan="4" colspan="1" class="spacer-cell"></th>
                <th colspan="3" class="trim-header" style="font-size: 6.5pt;">2DO INF. ORIENTADOR</th>
                <th rowspan="4" colspan="1" class="spacer-cell"></th>
                <th colspan="3" class="trim-header" style="font-size: 6.5pt;">3ER INF. ORIENTADOR</th>
              </tr>
              <tr>
                <th colspan="3" class="trim-header" style="font-size: 6.5pt; font-weight: 900;">1ER TRIMESTRE:</th>
                <th colspan="3" class="trim-header" style="font-size: 6.5pt; font-weight: 900;">2DO TRIMESTRE:</th>
                <th colspan="3" class="trim-header" style="font-size: 6.5pt; font-weight: 900;">3ER TRIMESTRE:</th>
                <th rowspan="3" style="width: 20px; font-size: 5pt; line-height: 1;">DIC</th>
                <th rowspan="3" style="width: 20px; font-size: 5pt; line-height: 1;">FEB</th>
                <th rowspan="3" style="width: 20px; font-size: 5pt; line-height: 1;">MAR</th>
                <th rowspan="3" style="width: 20px; font-size: 4pt; line-height: 1; background: #eee;">OTRAS<br/>INST.</th>
                <th rowspan="3" class="def-cell" style="font-size: 5pt; line-height: 1;">DEF.</th>
              </tr>
              <tr>
                <th colspan="3" class="trim-header" style="font-size: 5.5pt; font-weight: normal; font-style: italic;">CALIF. TRIMESTRAL</th>
                <th colspan="3" class="trim-header" style="font-size: 5.5pt; font-weight: normal; font-style: italic;">CALIF. TRIMESTRAL</th>
                <th colspan="3" class="trim-header" style="font-size: 5.5pt; font-weight: normal; font-style: italic;">CALIF. TRIMESTRAL</th>
              </tr>
              <tr>
                <th style="font-size: 6pt; border: 1px solid #000;">ORIENTA</th>
                <th style="font-size: 6pt; border: 1px solid #000;">NUMERO</th>
                <th style="font-size: 6pt; border: 1px solid #000;">LETRAS</th>
                <th style="font-size: 6pt; border: 1px solid #000;">ORIENTA</th>
                <th style="font-size: 6pt; border: 1px solid #000;">NUMERO</th>
                <th style="font-size: 6pt; border: 1px solid #000;">LETRAS</th>
                <th style="font-size: 6pt; border: 1px solid #000;">ORIENTA</th>
                <th style="font-size: 6pt; border: 1px solid #000;">NUMERO</th>
                <th style="font-size: 6pt; border: 1px solid #000;">LETRAS</th>
              </tr>
            </thead>
            `}
            <tbody>
              ${tableRows}
            </tbody>
            <tfoot>
              <tr style="height: 60px;">
                <td colspan="2" style="border: 1.5px solid #000; background: transparent !important;"></td>
                <td colspan="${((subject.tipo || '').toLowerCase().includes('modular')) ? 5 : 3}" style="border: 1.5px solid #000; vertical-align: bottom; font-size: 6pt; font-weight: bold; text-align: center; padding-bottom: 2px;">FIRMA Y<br/>ACLARACIÓN</td>
                <th class="spacer-cell" rowspan="1"></th>
                <td colspan="${((subject.tipo || '').toLowerCase().includes('modular')) ? 5 : 3}" style="border: 1.5px solid #000; vertical-align: bottom; font-size: 6pt; font-weight: bold; text-align: center; padding-bottom: 2px;">FIRMA Y<br/>ACLARACIÓN</td>
                <th class="spacer-cell" rowspan="1"></th>
                <td colspan="${((subject.tipo || '').toLowerCase().includes('modular')) ? 5 : 3}" style="border: 1.5px solid #000; vertical-align: bottom; font-size: 6pt; font-weight: bold; text-align: center; padding-bottom: 2px;">FIRMA Y<br/>ACLARACIÓN</td>
                <th class="spacer-cell" rowspan="1"></th>
                <td colspan="5" style="border: 1.5px solid #000; vertical-align: bottom; font-size: 6pt; font-weight: bold; text-align: center; padding-bottom: 2px;">FIRMA Y<br/>ACLARACIÓN</td>
              </tr>
            </tfoot>
          </table>

        </div>
      </div>

      <!-- PAGINA 2: DORSO (CRONOGRAMA Y OBS) -->
      <div class="printable-page glass-card">
        <div class="a4-portrait">
          <div class="institutional-header" style="display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 10px;">
            <div class="inst-left" style="text-align: left;">
              <img src="/logo.png" style="height: 50px; margin-bottom: 5px;" /><br/>
              Escuela Industrial N° 6<br/>
              "X Brigada Aérea"
            </div>
            <div class="inst-right" style="text-align: right; padding-bottom: 5px;">
              Ciclo Lectivo 2026
            </div>
          </div>

          <div class="info-boxes" style="margin-bottom: 25px;">
            <div class="info-row" style="display: flex; align-items: stretch;">
              <div class="info-label" style="width: 140px; color: #000; font-size: 8pt; font-weight: 900;">ESPACIO CURRICULAR:</div>
              <div class="info-value-box" style="flex: 1; min-width: 450px; text-align: center; color: #000; border: 1.5px solid #000; padding: 2px;">${subject.nombre}</div>
              <div class="info-label" style="width: 60px; margin-left: 15px; color: #000; font-size: 8pt; font-weight: 900;">CURSO:</div>
              <div class="info-value-box" style="width: 40px; text-align: center; color: #000; border: 1.5px solid #000; padding: 2px;">${activeCourse.ano}</div>
            </div>
            <div class="info-row" style="display: flex; align-items: stretch; margin-top: 4px;">
              <div class="info-label" style="width: 140px; color: #000; font-size: 8pt; font-weight: 900;">PROFESOR:</div>
              <div class="info-value-box" style="flex: 1; min-width: 450px; text-align: center; color: #000; border: 1.5px solid #000; padding: 2px;">${professors}</div>
              <div class="info-label" style="width: 60px; margin-left: 15px; color: #000; font-size: 8pt; font-weight: 900;">DIV:</div>
              <div class="info-value-box" style="width: 40px; text-align: center; color: #000; border: 1.5px solid #000; padding: 2px;">${activeCourse.division}</div>
            </div>
          </div>

          <table class="official-table cronograma-table">
            <thead>
              <tr>
                <th>CRONOGRAMA de CIERRE DE INFORME ORIENTADOR y CUATRIMESTRE</th>
                <th>FECHA de CIERRE</th>
                <th>FECHA LIMITE ENTREGA de PLANILLAS EN PRECEPTORIA</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>1er. INFORME ORIENTADOR</td><td></td><td></td></tr>
              <tr><td>1er. CUATRIMESTRE</td><td></td><td></td></tr>
              <tr><td>2do. INFORME ORIENTADOR</td><td></td><td></td></tr>
              <tr><td>2do. CUATRIMESTRE</td><td></td><td></td></tr>
            </tbody>
          </table>

          <table class="official-table observaciones-table" style="margin-top: 30px;">
            <thead>
              <tr>
                <th style="width: 70%;">OBSERVACIONES</th>
                <th style="width: 15%;">Fecha</th>
                <th style="width: 15%;">Firma</th>
              </tr>
            </thead>
            <tbody>
              ${Array(14).fill('<tr><td>&nbsp;</td><td></td><td></td></tr>').join('')}
            </tbody>
          </table>

          <div class="back-footer-container">
            <div class="instructions-section">
              <strong>NOTA:</strong> - La "PONDERACIÓN" la deben realizar en conjunto ambos docentes (Teoría y Práctica).<br/>
              Esta calificación será la que se pasará a los R.A.C. y posteriormente al Libro Matriz.<br/>
              - Tanto la "CALIFICACIÓN" como la "PONDERACIÓN" sera en número enteros (sin decimales).<br/>
              - Los Espacios Curriculares que no posean horas prácticas, utilizaran solamente la columna Teórico.<br/>
              - Finalizadas las instancias de compensación FEB/MAR, la columna calificación "Definitiva" de todas las Planillas deben quedar debidamente cerradas. Si no alcanzó a compensar en las instancias previstas, se colocará como Definitiva la calificación final del ultimo cuatrimestre.
            </div>
            <div class="mapping-section">
              <table class="mapping-table">
                <thead><tr><th colspan="3">INFORME ORIENTADOR</th></tr></thead>
                <tbody>
                  <tr><td>10</td><td>AE</td><td>Acredita con Excelencia</td></tr>
                  <tr><td>9</td><td>AD</td><td>Acredita con Distinción</td></tr>
                  <tr><td>8</td><td>AMS</td><td>Acredita Muy Satisfactoriamente</td></tr>
                  <tr><td>7</td><td>A</td><td>Acredita</td></tr>
                  <tr><td>1/6</td><td>NA</td><td>No Acredita</td></tr>
                  <tr><td colspan="2">S/C</td><td>Sin Calificar (*)</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  win.document.write(`
    <html>
      <head>
        <title>Planillas Oficiales - ${activeCourse.label}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          :root {
            --primary: #6366f1;
            --bg-gradient: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
            --glass-bg: rgba(255, 255, 255, 0.05);
            --glass-border: rgba(255, 255, 255, 0.1);
          }
          body { 
            font-family: 'Arial', sans-serif; 
            margin: 0; padding: 0; 
            background: #334155;
            color: white;
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
          @page {
            size: A4;
            margin: 15mm 10mm;
          }
          .printable-page { width: 210mm; min-height: 297mm; padding: 10mm; box-sizing: border-box; background: white !important; margin-bottom: 40px; position: relative; color: black !important; box-shadow: 0 20px 50px rgba(0,0,0,0.5); border-radius: 2px; margin-left: auto; margin-right: auto; }
          .printable-page * { color: black !important; }
          .institutional-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
          .inst-left { font-size: 10pt; font-weight: bold; line-height: 1.2; }
          .inst-center { text-align: center; flex: 1; }
          .main-title { font-size: 16pt; font-weight: 900; text-decoration: underline; margin-bottom: 2px; }
          .sub-title { font-size: 10pt; font-weight: bold; }
          .info-boxes { width: 100%; margin-top: 10px; }
          .info-row { display: flex; align-items: center; gap: 5px; width: 100%; }
          .info-label { font-size: 9pt; font-weight: 900; white-space: nowrap; font-style: italic; }
          .info-value-box { border: 1.5px solid #000; padding: 4px 10px; font-size: 10pt; font-weight: bold; background: #fff; text-transform: uppercase; color: #000; }
          .official-table { width: 100%; border-collapse: collapse; font-size: 8pt; border: 1.5px solid #000; margin-top: 10px; color: #000; }
          .official-table th, .official-table td { border: 1px solid #000; padding: 4px; text-align: center; }
          .official-table th { background: rgba(0,0,0,0.05); font-weight: bold; border: 1px solid #000; }
          .planilla-table { width: 100%; border-collapse: collapse; font-size: 7pt; border: 1.5px solid #000; margin-top: 5px; color: #000; table-layout: fixed; }
          .planilla-table th, .planilla-table td { border: 1px solid #000; padding: 0 !important; text-align: center; overflow: hidden; color: #000; height: var(--dynamic-row-height, 4.4mm) !important; }
          .planilla-table th { background: #eee !important; font-weight: bold; text-transform: uppercase; border: 1.5px solid #000; height: auto !important; padding: 2px 1px !important; }
          .trim-header { font-size: 9pt; font-style: italic; }
          .spacer-cell { background: #eee !important; border: 1px solid #000 !important; }
          .grade-cell { width: auto !important; font-weight: bold; color: black; border: 1px solid #000; }
          .grade-cell.narrow { width: 15px !important; font-size: 6.5pt !important; padding: 1px 0 !important; }
          .letter-cell { width: 55px; font-size: 5pt; color: black; border: 1px solid #000; }
          .def-cell { background: transparent; font-weight: 900; width: 35px; color: black; border: 1px solid #000; }
          .def-cell.narrow { width: 25px !important; }
          .cronograma-table th { font-size: 7pt; height: 30px; }
          .cronograma-table td { height: 25px; text-align: left; padding-left: 10px; font-weight: bold; }
          .observaciones-table th { height: 25px; }
          .observaciones-table td { height: 24px; }
          .back-footer-container { display: flex; gap: 20px; margin-top: 30px; align-items: flex-start; }
          .instructions-section { flex: 1; font-size: 7.5pt; line-height: 1.4; text-align: justify; }
          .mapping-section { width: 280px; }
          .mapping-table { width: 100%; border-collapse: collapse; font-size: 7pt; border: 1.5px solid #000; color: #000; }
          .mapping-table th, .mapping-table td { border: 1px solid #000; padding: 3px; text-align: center; background: rgba(0,0,0,0.02); }
          .mapping-table td:last-child { text-align: left; padding-left: 5px; }
          @media print {
            body { background: white !important; padding: 0 !important; margin: 0 !important; }
            .no-print-toolbar { display: none !important; }
            .printable-page { margin: 0 !important; padding: 0 !important; width: 100% !important; height: auto !important; min-height: 0 !important; max-height: 265mm; overflow: hidden; box-shadow: none !important; background: white !important; border: none !important; }
            .printable-page + .printable-page { page-break-before: always; break-before: page; }
            .planilla-table th { background: #f3f4f6 !important; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="no-print-toolbar">
          <button class="btn-print" onclick="window.print()">
             🖨️ IMPRIMIR PLANILLAS (FRENTE Y DORSO)
          </button>
          <p style="font-size: 0.9rem; opacity: 0.8;">Vista previa oficial para Duplex - ${activeCourse.label}</p>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center;">
          ${subjectsHTML}
        </div>
      </body>
    </html>
  `);
  win.document.close();
};

export const handlePrintRAC = (data, singleStudent = null) => {
  const activeCourse = data.selectedCourse;
  if (!activeCourse) return;
  const studentsToPrint = singleStudent ? [singleStudent] : data.students;

  const win = window.open('', '_blank');
  const subjects = data.allSubjects.filter(s => s.tecnicatura_id === data.selectedTecnicaturaId);

  const studentsHTML = studentsToPrint.map((student, idx) => {
    const studentGrades = data.grades.filter(g => g.alumno_id === student.id);
    const studentPrevias = data.previas.filter(p => p.alumno_id === student.id);

    const getG = (subjectId, pid, type = 'valor_t') => {
      const g = studentGrades.find(x => x.materia_id === subjectId && x.periodo_id === pid);
      return g ? g[type] : '';
    };

    const calcProm = (sid) => {
      const sub = subjects.find(s => s.id === sid);
      if (!sub) return '';
      const isMod = (sub.tipo || '').toLowerCase().includes('modular');
      const isTaller = sub.es_taller === 1;
      const field = (isMod && isTaller) ? 'valor_pond' : 'valor_t';

      const p1 = Number(getG(sid, 2, field)) || 0;
      const p2 = Number(getG(sid, 4, field)) || 0;
      const p3 = Number(getG(sid, 6, field)) || 0;
      let count = 0;
      if (p1 > 0) count++;
      if (p2 > 0) count++;
      if (p3 > 0) count++;
      return count > 0 ? (([p1, p2, p3].reduce((a, b) => a + (b || 0), 0)) / count).toFixed(1) : '';
    };

    const simpleSubjects = subjects.filter(s => s.es_taller !== 1 || (s.tipo || '').toLowerCase().includes('modular')).slice(0, 12);
    const rowsHTML = simpleSubjects.map((sub, i) => {
      const isMod = (sub.tipo || '').toLowerCase().includes('modular');
      const isTaller = sub.es_taller === 1;
      const prom = (isMod && !isTaller) ? '' : calcProm(sub.id);
      const getV = (pid, f = 'valor_t') => getG(sub.id, pid, f);

      const periodCells = (pid) => {
        if (isMod) {
          if (sub.es_taller === 1) {
            return `<td colspan="3" class="grade-cell">${getV(pid, 'valor_pond')}</td>`;
          } else {
            return `
              <td class="grade-cell" style="font-size: 7pt; width: 20px;">${getV(pid, 'valor_t')}</td>
              <td class="grade-cell" style="font-size: 7pt; width: 20px;">${getV(pid, 'valor_p')}</td>
              <td class="grade-cell gray" style="font-size: 7pt; width: 25px;">${getV(pid, 'valor_pond')}</td>
            `;
          }
        } else {
          return `<td colspan="3" class="grade-cell">${getV(pid, 'valor_t')}</td>`;
        }
      };

      const getObs = (sid) => {
        const def = getG(sid, 10);
        if (def && Number(String(def).replace(',', '.')) <= 6) {
          return `<span style="color: #e74c3c; font-weight: bold; font-size: 7pt;">ADEUDA</span>`;
        }
        return '';
      };

      return `
        <tr>
          <td style="text-align:center; font-size: 8pt;">${i + 1}</td>
          <td colspan="2" style="font-size: 8pt; text-align: left; padding-left: 5px;">${sub.nombre}</td>
          ${periodCells(2)}
          ${periodCells(4)}
          ${periodCells(6)}
          <td class="grade-cell gray">${prom}</td>
          <td class="grade-cell">${getG(sub.id, 7)}</td>
          <td class="grade-cell">${getG(sub.id, 8)}</td>
          <td class="grade-cell">${getG(sub.id, 9)}</td>
          <td class="grade-cell" style="font-size: 7pt; background: rgba(0,0,0,0.03);">${getG(sub.id, 11)}</td>
          <td class="grade-cell bold">${getG(sub.id, 10)}</td>
          <td style="text-align: center;">${getObs(sub.id)}</td>
        </tr>
      `;
    }).join('');

    const workshopGroupedSubjects = subjects.filter(s => s.es_taller === 1 && !(s.tipo || '').toLowerCase().includes('modular'));
    const workshopLabel = activeCourse.ano === '1°' ? 'TALLER I' : (activeCourse.ano === '2°' ? 'TALLER II' : 'TALLER');

    const modularRows = workshopGroupedSubjects.map((sub, i) => {
      const getV = (pid, f) => getG(sub.id, pid, f);
      const isMod = (sub.tipo || '').toLowerCase().includes('modular');

      const periodCells = (pid) => {
        if (isMod) {
          return `
            <td class="grade-cell" style="font-size: 7pt; width: 20px;">${getV(pid, 'valor_t')}</td>
            <td class="grade-cell" style="font-size: 7pt; width: 20px;">${getV(pid, 'valor_p')}</td>
            <td class="grade-cell gray" style="font-size: 7pt; width: 25px;">${getV(pid, 'valor_pond')}</td>
          `;
        } else {
          return `<td colspan="3" class="grade-cell">${getV(pid, 'valor_t')}</td>`;
        }
      };

      const getObs = (sid) => {
        const def = getG(sid, 10);
        if (def && Number(String(def).replace(',', '.')) <= 6) {
          return `<span style="color: #e74c3c; font-weight: bold; font-size: 7pt;">ADEUDA</span>`;
        }
        return '';
      };

      return `
        <tr>
          ${i === 0 ? `<td rowspan="${workshopGroupedSubjects.length}" style="text-align:center; vertical-align: middle; font-weight: bold;">13</td>` : ''}
          ${i === 0 ? `<td rowspan="${workshopGroupedSubjects.length}" style="font-size: 7pt; text-align: center; vertical-align: middle; font-weight: bold; background: #eee; width: 45px;">${workshopLabel}</td>` : ''}
          <td style="font-size: 7.5pt; text-align: left; padding-left: 5px; width: 140px; white-space: normal;">${sub.nombre}</td>
          ${periodCells(2)}
          ${periodCells(4)}
          ${periodCells(6)}
          <td class="grade-cell gray"></td>
          <td class="grade-cell">${getG(sub.id, 7)}</td>
          <td class="grade-cell">${getG(sub.id, 8)}</td>
          <td class="grade-cell">${getG(sub.id, 9)}</td>
          <td class="grade-cell" style="font-size: 7pt; background: rgba(0,0,0,0.03);">${getG(sub.id, 11)}</td>
          ${i === 0 ? `<td rowspan="${workshopGroupedSubjects.length}" class="grade-cell bold" style="vertical-align: middle;">${getG(sub.id, 10)}</td>` : ''}
          ${i === 0 ? `<td rowspan="${workshopGroupedSubjects.length}" style="text-align: center; vertical-align: middle;">${getObs(sub.id)}</td>` : ''}
        </tr>
      `;
    }).join('');

    const otherPrevias = studentPrevias.filter(p => {
      const name = (p.materia_nombre || p.materia_nombre_custom || '').trim().toLowerCase();
      return !allWorkshopNames.some(ws => ws.toLowerCase() === name);
    });

    const previasRows = Array.from({ length: 30 }).map((_, i) => {
      const prev = otherPrevias[i];
      let name = prev ? (prev.materia_nombre || prev.materia_nombre_custom) : '';
      if (prev?.curso_ano) name += ` (${prev.curso_ano})`;
      return `
        <tr>
          <td style="text-align:center; font-size: 8pt;">${i + 1}</td>
          <td style="text-align:left; padding-left: 5px; font-size: 8pt;">${name}</td>
          <td style="text-align:center;">${prev?.libro || ''}</td>
          <td style="text-align:center;">${prev?.folio || ''}</td>
          <td style="text-align:center;">${prev?.calificacion || ''}</td>
          <td style="text-align:center;">${prev?.fecha || ''}</td>
        </tr>
      `;
    }).join('');

    let workshopPreviaCounter = 0;
    const workshopPrevRow = (label, items) => {
      const matchedItems = items.map(name => {
        const p = studentPrevias.find(sp => (sp.materia_nombre || sp.materia_nombre_custom || '').trim().toLowerCase() === name.toLowerCase());
        if (p) workshopPreviaCounter++;
        return { name, p, num: p ? workshopPreviaCounter : '' };
      });

      return `
        <tr>
          <td rowspan="${items.length + 1}" class="side-header"><span>${label}</span></td>
          <td style="text-align:center; font-size: 7pt;">${matchedItems[0].num}</td>
          <td style="text-align:left; padding-left: 5px; font-size: 8pt;">${matchedItems[0].name}</td>
          <td style="text-align:center;">${matchedItems[0].p?.libro || ''}</td>
          <td style="text-align:center;">${matchedItems[0].p?.folio || ''}</td>
          <td style="text-align:center;">${matchedItems[0].p?.calificacion || ''}</td>
          <td style="text-align:center;">${matchedItems[0].p?.fecha || ''}</td>
        </tr>
        ${matchedItems.slice(1).map(m => `
          <tr>
            <td style="text-align:center; font-size: 7pt;">${m.num}</td>
            <td style="text-align:left; padding-left: 5px; font-size: 8pt;">${m.name}</td>
            <td style="text-align:center;">${m.p?.libro || ''}</td>
            <td style="text-align:center;">${m.p?.folio || ''}</td>
            <td style="text-align:center;">${m.p?.calificacion || ''}</td>
            <td style="text-align:center;">${m.p?.fecha || ''}</td>
          </tr>
        `).join('')}
        <tr class="gray">
          <td colspan="2" style="text-align: center; font-weight: bold; font-size: 8pt; height: 18px;">Ponderación</td>
          <td></td><td></td><td></td><td></td>
        </tr>
      `;
    };

    const isBasic = ['1°', '2°'].includes(activeCourse.ano);
    return `
      <div class="rac-container">
        <div class="printable-page rac-page">
          <div style="font-weight: bold; font-size: 11pt; margin-bottom: 5px; text-align: left;">N° <span style="font-weight: normal;">${idx + 1}</span></div>
          <div class="rac-header">
            <div style="font-weight: bold; border-bottom: 2px solid black; display: inline-block; padding: 2px 10px; margin-bottom: 12px; font-size: 11pt;">DATOS DEL ALUMNO</div>
            <div class="rac-info-row" style="justify-content: space-between;">
              <div class="rac-info-item" style="flex: 2;">Apellido y Nombre: <span class="val">${student.apellido}, ${student.nombre}</span></div>
              <div class="rac-info-item" style="flex: 1;">N° DNI: <span class="val">${formatDNI(student.dni)}</span></div>
            </div>
            <div class="rac-info-row" style="justify-content: space-between;">
              <div class="rac-info-item" style="flex: 1;">Curso: <span class="val">${activeCourse.ano} ${isBasic ? 'C.B.' : 'C.S.'}</span></div>
              <div class="rac-info-item" style="flex: 1;">División: <span class="val">${activeCourse.division}</span></div>
              <div class="rac-info-item" style="flex: 1;">Legajo N°: <span class="val">${student.legajo || ''}</span></div>
            </div>
            <div class="rac-info-row" style="justify-content: space-between;">
              <div class="rac-info-item" style="flex: 1;">Matrícula: <span class="val">${student.matricula || ''}</span></div>
              <div class="rac-info-item" style="flex: 1;">L°: <span class="val" style="min-width: 40px;">${student.libro || ''}</span></div>
              <div class="rac-info-item" style="flex: 1;">F°: <span class="val" style="min-width: 40px;">${student.folio || ''}</span></div>
            </div>
          </div>

          <table class="rac-table main-rac-table">
            <thead>
              <tr>
                <th rowspan="2" style="width: 25px;">N°</th>
                <th rowspan="2" colspan="2" style="width: 200px;">ESPACIOS/ASIGNATURAS</th>
                <th colspan="9">PERIODOS</th>
                <th rowspan="2" style="width: 40px; white-space: normal; line-height: 1.1; font-size: 6.5pt;">Promedio Anual</th>
                <th rowspan="2" style="width: 32px;">Dic.</th>
                <th rowspan="2" style="width: 32px;">Feb.</th>
                <th rowspan="2" style="width: 32px;">Mar.</th>
                <th rowspan="2" style="width: 35px; white-space: normal; line-height: 1; font-size: 6pt; background: #f9f9f9;">Otras Inst.</th>
                <th rowspan="2" style="width: 45px; white-space: normal; line-height: 1.1; font-size: 6.5pt;">Calificación Definitiva</th>
                <th rowspan="2" style="width: 60px;">OBS.</th>
              </tr>
              <tr>
                <th colspan="3">1°</th>
                <th colspan="3">2°</th>
                <th colspan="3">3°</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
              ${modularRows}
            </tbody>
          </table>

          <table class="rac-table workshop-previas-table" style="margin-top: 15px;">
            <thead>
              <tr>
                <th style="width: 30px;"></th>
                <th style="width: 35px;">N°</th>
                <th style="width: 365px;">ESPACIOS/ASIGNATURAS</th>
                <th style="width: 45px;">L°</th>
                <th style="width: 45px;">F°</th>
                <th style="width: 55px;">Calif.</th>
                <th style="width: 90px;">Fecha</th>
              </tr>
            </thead>
            <tbody>
              ${workshopPrevRow('Previas Taller I', ['Electricidad I', 'Carpintería', 'Hojalatería y herrería', 'Ajuste Mecánico I'])}
              ${workshopPrevRow('Previas Taller II', ['Electricidad II', 'Soldadura', 'Automotores', 'Materiales aeronáuticos'])}
            </tbody>
          </table>
        </div>

        <div class="printable-page rac-page" style="page-break-before: always;">
          <div style="font-weight: bold; font-size: 10pt; text-decoration: underline; margin-bottom: 10px;">ESPACIOS / ASIGNATURAS (Previas):</div>
          <table class="rac-table">
            <thead>
              <tr>
                <th style="width: 35px;">N°</th>
                <th style="width: 400px;">ESPACIO CURRICULAR</th>
                <th style="width: 45px;">L°</th>
                <th style="width: 45px;">F°</th>
                <th style="width: 55px;">Calif.</th>
                <th style="width: 90px;">Fecha</th>
              </tr>
            </thead>
            <tbody>
              ${previasRows}
            </tbody>
          </table>

          <div style="margin-top: 20px; border: 2px solid black; padding: 10px; min-height: 150px;">
            <div style="font-weight: bold; margin-bottom: 8px; font-size: 10pt; text-decoration: underline;">OBSERVACIONES:</div>
            <div style="font-size: 9pt; line-height: 1.4;">${student.observaciones || ''}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  win.document.write(`
    <html>
      <head>
        <title>RAC - ${activeCourse.label}</title>
        <style>
          body { font-family: 'Verdana', Geneva, sans-serif; margin: 0; padding: 0; background: #f0f0f0; color: black; }
          .rac-container { background: white; width: 210mm; margin: 0 auto; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          .printable-page { width: 210mm; height: 297mm; padding: 8mm 10mm; box-sizing: border-box; background: white; position: relative; display: flex; flex-direction: column; }
          .rac-header { margin-bottom: 20px; font-size: 9pt; }
          .rac-info-row { display: flex; gap: 20px; width: 100%; margin-bottom: 8px; }
          .rac-info-item { display: flex; gap: 5px; align-items: baseline; white-space: nowrap; flex: 1; }
          .val { font-weight: bold; border-bottom: 1.5px solid black; flex: 1; min-width: 40px; text-transform: uppercase; padding: 0 3px; }
          .rac-table { width: 100%; border-collapse: collapse; border: 2px solid black; table-layout: fixed; }
          .rac-table th, .rac-table td { border: 1.2px solid black; padding: 4px 2px; font-size: 8pt; text-align: center; min-height: 30px; word-wrap: break-word; overflow: hidden; }
          .rac-table th { background: #eee; font-weight: bold; font-size: 7.5pt; text-transform: uppercase; padding: 6px 2px; }
          .side-header { width: 25px; padding: 0 !important; background: #f2f2f2; }
          .side-header span { writing-mode: vertical-rl; transform: rotate(180deg); display: inline-block; font-weight: bold; font-size: 7pt; padding: 5px 0; }
          .grade-cell { width: 45px; font-size: 8.5pt; }
          .gray { background: #f4f4f4; }
          .bold { font-weight: bold; font-size: 9.5pt; }
          .no-print { position: fixed; top: 15px; right: 15px; z-index: 1000; }
          .btn-print { padding: 10px 20px; background: #334155; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
          @media print {
            body { background: white; }
            .rac-container { box-shadow: none; width: 100%; }
            .printable-page { margin: 0; page-break-after: always; padding: 8mm 10mm; border: none; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button class="btn-print" onclick="window.print()">🖨️ IMPRIMIR PLANILLAS RAC</button>
        </div>
        ${studentsHTML}
      </body>
    </html>
  `);
  win.document.close();
};
