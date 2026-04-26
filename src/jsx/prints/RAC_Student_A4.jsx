import { formatDNI, numberToWords, simplifyTecName, allWorkshopNames, getCoursePreceptor } from '../functions/PreceptorHelpers';

export const handlePrintRAC_Student = (data, student) => {
  const activeCourse = data.selectedCourse;
  if (!activeCourse) return;

  const win = window.open('', '_blank');
  const subjects = data.allSubjects.filter(s => s.tecnicatura_id === data.selectedTecnicaturaId);

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
      const isRACModular = data.config?.rac_modular_enabled === 'true';
      const cellHeight = isRACModular ? '48px' : '30px';

      if (isMod) {
        if (sub.es_taller === 1 && !isRACModular) {
          return `<td colspan="3" class="grade-cell" style="min-height: ${cellHeight};">${getV(pid, 'valor_pond')}</td>`;
        } else {
          return `
            <td class="grade-cell" style="font-size: 7.5pt; width: 22px; vertical-align: top; padding: 2px 0; height: ${cellHeight};">
              <div style="font-size: 5.5pt; font-weight: bold; opacity: 0.8; border-bottom: 0.5px solid #bbb; margin-bottom: 2px; padding-bottom: 1px;">T</div>
              ${getV(pid, 'valor_t')}
            </td>
            <td class="grade-cell" style="font-size: 7.5pt; width: 22px; vertical-align: top; padding: 2px 0; height: ${cellHeight};">
              <div style="font-size: 5.5pt; font-weight: bold; opacity: 0.8; border-bottom: 0.5px solid #bbb; margin-bottom: 2px; padding-bottom: 1px;">P</div>
              ${getV(pid, 'valor_p')}
            </td>
            <td class="grade-cell gray" style="font-size: 7.5pt; width: 30px; vertical-align: top; padding: 2px 0; height: ${cellHeight};">
              <div style="font-size: 5.5pt; font-weight: bold; opacity: 0.8; border-bottom: 0.5px solid #bbb; margin-bottom: 2px; padding-bottom: 1px;">Pnd</div>
              ${getV(pid, 'valor_pond')}
            </td>
          `;
        }
      } else {
        return `<td colspan="3" class="grade-cell" style="height: ${cellHeight};">${getV(pid, 'valor_t')}</td>`;
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
  const studentHTML = `
    <div class="rac-container">
      <div class="printable-page rac-page">
        <div style="font-weight: bold; font-size: 11pt; margin-bottom: 5px; text-align: left;">N° <span style="font-weight: normal;">1</span></div>
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

  win.document.write(`
    <html>
      <head>
        <title>RAC Individual - ${student.apellido}</title>
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
            @page { size: A4; margin: 0; }
            body { background: white; }
            .rac-container { box-shadow: none; width: 100%; }
            .printable-page { margin: 0; page-break-after: always; padding: 8mm 10mm; border: none; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button class="btn-print" onclick="window.print()">🖨️ IMPRIMIR RAC INDIVIDUAL</button>
        </div>
        ${studentHTML}
      </body>
    </html>
  `);
  win.document.close();
};
