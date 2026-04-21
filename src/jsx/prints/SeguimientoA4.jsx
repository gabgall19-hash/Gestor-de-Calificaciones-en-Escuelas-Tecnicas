import { formatDNI, numberToWords, simplifyTecName, allWorkshopNames, getCoursePreceptor } from '../functions/PreceptorHelpers';

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

