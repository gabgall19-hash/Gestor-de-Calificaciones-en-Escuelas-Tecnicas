import * as XLSX from 'xlsx';

/**
 * Parses a schedule Excel file buffer and returns a structured JSON.
 * Expects the institutional format:
 * - Meta info in top rows.
 * - Header row starting with "Hora".
 * - Double-row slots (subject then teacher).
 * - Recess rows labeled as "RECREO" or "ALMUERZO".
 */
export const parseScheduleExcel = (fileBuffer) => {
  const workbook = XLSX.read(fileBuffer, { type: 'array' });
  const results = [];

  workbook.SheetNames.forEach(sheetName => {
    // Skip hidden or technical sheets
    if (sheetName.toLowerCase().includes('datos') || sheetName.toLowerCase().includes('hoja')) return;

    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    // 1. Identify Header Row
    const headerRowIndex = data.findIndex(row => row && row[0] === 'Hora');
    if (headerRowIndex === -1) return;

    // 2. Extract Metadata (optional but helpful for matching)
    const meta = {};
    if (headerRowIndex >= 3) {
      const metaRow = data[headerRowIndex - 2];
      const valRow = data[headerRowIndex - 1];
      if (metaRow && valRow) {
        meta.auxiliar = valRow[0];
        meta.ano = valRow[2];
        meta.ciclo = valRow[4];
        meta.division = valRow[5];
        meta.turno = valRow[6];
      }
    }

    // 3. Process Grid
    const gridData = [];
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      let timeSlot = String(row[0] || '').trim();
      
      // Handle Recess/Breaks
      if (timeSlot.toLowerCase().includes('recreo') || timeSlot.toLowerCase().includes('almuerzo')) {
        gridData.push({
          type: 'break',
          label: timeSlot
        });
        continue;
      }

      // Handle Time Slots (Double rows: Subject then Teacher)
      if (/^\d{1,2}:\d{2}/.test(timeSlot)) {
        const nextRow = data[i + 1] || [];
        
        // Institutional columns: 0:Hora, 1:Lun, 2:Mar, 3:empty?, 4:Mie, 5:Jue, 6:Vie
        // We'll be flexible: if col 3 is empty, we shift.
        const dayCols = [1, 2, 4, 5, 6];
        const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
        
        const days = {};
        dayNames.forEach((day, idx) => {
          const col = dayCols[idx];
          days[day] = {
            subject: String(row[col] || '').trim(),
            teacher: String(nextRow[col] || '').trim()
          };
        });

        gridData.push({
          type: 'slot',
          time: timeSlot,
          days
        });
        i++; // Skip the teacher row
      }
    }

    results.push({
      sheetName,
      meta,
      gridData
    });
  });

  return results;
};

/**
 * Normalizes a course name from Excel (e.g. "1° CB I") to match DB format (e.g. "1 I")
 * This is heuristic and might need manual correction in the UI.
 */
export const normalizeCourseName = (excelName, meta) => {
  if (meta && meta.ano && meta.division) {
    return `${meta.ano} ${meta.division}`.trim();
  }
  // Fallback regex
  const match = excelName.match(/(\d+).*(I+V*|VI*)/);
  if (match) return `${match[1]} ${match[2]}`;
  return excelName;
};
