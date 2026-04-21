import { formatDNI, numberToWords, simplifyTecName, allWorkshopNames, getCoursePreceptor } from '../functions/PreceptorHelpers';

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

