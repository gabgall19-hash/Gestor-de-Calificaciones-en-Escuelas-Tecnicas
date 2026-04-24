import React from 'react';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export default function HorariosPrintView({ selectedCourse, grid = [], getHeaderColor, getCiclo }) {
  const printRowCount = Math.max(grid.length || 0, 1);
  const printRowHeight = printRowCount <= 8 ? '18mm' : printRowCount <= 10 ? '15mm' : printRowCount <= 12 ? '13mm' : '11mm';

  return (
    <>
      <div className="print-only horarios-print-view" style={{ '--print-row-height': printRowHeight }}>
        <div
          className="yellow-banner"
          style={{ background: getHeaderColor(), color: getHeaderColor() === '#ff9900' ? 'black' : 'white' }}
        >
          HORARIO 2026 - INDUSTRIAL N°6 "X BRIGADA AÉREA"
        </div>

        <table className="meta-print-table">
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
              <td>{selectedCourse?.preceptor_nombre || '---'}</td>
              <td>{selectedCourse?.ano}°</td>
              <td>{getCiclo()}</td>
              <td>{selectedCourse?.division || '---'}</td>
              <td>{selectedCourse?.turno || '---'}</td>
            </tr>
          </tbody>
        </table>

        <table className="schedule-print-table">
          <thead>
            <tr>
              <th className="col-time">Hora</th>
              {DAYS.map((day) => (
                <th key={day}>{day}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((row, rowIndex) => (
              <tr key={rowIndex} className={row.type === 'break' ? 'print-break-row' : ''}>
                <td className="print-time-cell">{row.time || ''}</td>
                {row.type === 'break' ? (
                  <td colSpan={5} className="print-break-cell">{row.label || 'RECREO'}</td>
                ) : (
                  DAYS.map((day) => {
                    const cell = row.days?.[day] || {};
                    const subject = cell.subject || 'Horario Libre';
                    const teacher = subject.toUpperCase() === 'HORARIO LIBRE' ? '' : (cell.teacher || '');

                    return (
                      <td key={day} className="print-slot-cell">
                        <div className={`print-subject ${subject.toUpperCase() === 'HORARIO LIBRE' ? 'is-free' : ''}`}>
                          {subject}
                        </div>
                        {teacher && <div className="print-teacher">{teacher}</div>}
                      </td>
                    );
                  })
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .print-only { display: none; }
        .horarios-print-view { display: none; }
        .schedule-print-table { width: 100%; border-collapse: collapse; margin-top: 10px; table-layout: fixed; }
        .schedule-print-table th,
        .schedule-print-table td { border: 2px solid black; padding: 6px; text-align: center; color: black; background: white; }
        .schedule-print-table th { font-weight: 900; text-transform: uppercase; letter-spacing: 0.08em; }
        .print-time-cell,
        .print-slot-cell,
        .print-break-cell { height: var(--print-row-height, 12mm); }
        .print-time-cell { font-weight: 900; white-space: nowrap; }
        .print-slot-cell { background: white; }
        .print-subject { font-weight: 700; color: black; }
        .print-subject.is-free { font-weight: 500; font-style: italic; }
        .print-teacher { margin-top: 5px; color: black; font-size: 0.95rem; }
        .print-break-cell { font-weight: 900; letter-spacing: 0.15em; background: white; }

        @media print {
          @page { size: landscape; }
          .no-print, .print-hide { display: none !important; }
          .print-only { display: block !important; }
          .horarios-print-view { display: block !important; margin-bottom: 20px; }
          .horarios-panel { padding: 0; background: white; }
          .main-editor { background: white !important; padding: 0; border: none; }

          .yellow-banner {
            -webkit-print-color-adjust: exact;
            text-align: center;
            font-weight: 900;
            padding: 10px;
            border: 2px solid black;
            font-size: 1.2rem;
          }

          .meta-print-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: -2px;
          }
          .meta-print-table th,
          .meta-print-table td {
            border: 2px solid black;
            padding: 4px;
            text-align: center;
            font-size: 0.8rem;
          }
          .meta-print-table th { background: #f0f0f0 !important; font-weight: 400; color: #666; }
          .meta-print-table td { font-weight: 900; }

          .schedule-print-table { width: 100% !important; margin-top: 10px; }
          .schedule-print-table th,
          .schedule-print-table td,
          .print-slot-cell,
          .print-break-cell,
          .print-time-cell {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </>
  );
}
