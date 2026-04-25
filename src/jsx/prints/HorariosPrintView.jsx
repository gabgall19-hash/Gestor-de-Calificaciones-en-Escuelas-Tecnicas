import React from 'react';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export default function HorariosPrintView({ selectedCourse, grid = [], getHeaderColor, getCiclo, allSchedules = null, allCourses = [] }) {
  const isBatch = Array.isArray(allSchedules);
  const schedulesToPrint = isBatch ? allSchedules : [{ course: selectedCourse, grid }];

  return (
    <>
      <div className="print-only">
        {schedulesToPrint.map((item, idx) => {
          const course = isBatch ? allCourses.find(c => c.id === item.course_id) : item.course;
          if (!course) return null;

          let gridData = item.grid || [];
          if (typeof item.grid_data === 'string') {
            try {
              const parsed = JSON.parse(item.grid_data);
              gridData = Array.isArray(parsed) ? parsed : (parsed.grid || []);
            } catch (e) {
              gridData = [];
            }
          }

          const rowCount = Math.max(gridData.length || 0, 1);
          const rowHeight = rowCount <= 8 ? '17mm' : rowCount <= 10 ? '14mm' : rowCount <= 12 ? '12mm' : '10.5mm';
          const isLast = idx === schedulesToPrint.length - 1;

          return (
            <div 
              key={course.id || idx} 
              className="horarios-print-page" 
              style={{ 
                '--print-row-height': rowHeight, 
                pageBreakAfter: isLast ? 'auto' : 'always', 
                breakAfter: isLast ? 'auto' : 'page' 
              }}
            >
              <div
                className="yellow-banner"
                style={{ 
                  background: getHeaderColor ? getHeaderColor(course) : '#ffff00', 
                  color: (getHeaderColor && getHeaderColor(course) === '#ff9900') ? 'black' : 'white' 
                }}
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
                    <td>{course.preceptor_nombre || '---'}</td>
                    <td>{course.ano}</td>
                    <td>{getCiclo ? getCiclo(course) : '---'}</td>
                    <td>{course.division || '---'}</td>
                    <td>{course.turno || '---'}</td>
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
                  {gridData.map((row, rowIndex) => (
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
          );
        })}
      </div>

      <style>{`
        .print-only { display: none; }
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
          @page { size: A4 landscape; margin: 10mm 10mm; }
          .no-print, .print-hide { display: none !important; }
          .print-only { display: block !important; }
          .horarios-print-page { margin-bottom: 0 !important; }
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
