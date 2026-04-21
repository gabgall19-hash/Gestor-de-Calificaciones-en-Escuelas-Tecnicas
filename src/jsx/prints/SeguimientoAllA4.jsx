import { formatDNI, numberToWords, simplifyTecName, allWorkshopNames, getCoursePreceptor } from '../functions/PreceptorHelpers';

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

