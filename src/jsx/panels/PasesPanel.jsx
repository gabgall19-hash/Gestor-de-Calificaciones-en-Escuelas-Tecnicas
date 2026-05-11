import React from 'react';
import { ArrowRightLeft, Search, Wrench, RotateCcw, Eye, FileText } from 'lucide-react';
import { formatDNI } from '../functions/PreceptorHelpers';

const truncateStudentName = (value) => (value.length > 20 ? `${value.slice(0, 20)}...` : value);

const PasesPanel = ({ user, data, isMobile, pasesSearch, setPasesSearch, setEditingPase, undoPase, onPreviewStudent, onViewFicha }) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [viewMode, setViewMode] = React.useState('course');
  const itemsPerPage = 30;

  const filteredPases = data.pases.filter((pase) => {
    const matchesSearch = `${pase.nombre_apellido} ${pase.dni} ${pase.institucion_destino}`.toLowerCase().includes(pasesSearch.toLowerCase());
    const matchesCourse = viewMode === 'global' || pase.course_id_origen === data.selectedCourseId;
    return matchesSearch && matchesCourse;
  });

  const paginatedPases = filteredPases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredPases.length / itemsPerPage);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [pasesSearch, viewMode]);

  return (
    <section className="page-section">
      <div className="section-title"><ArrowRightLeft size={16} /><h2>Gestión de Pases de Alumnos</h2></div>
      <div className="management-card" style={{ marginTop: '1rem' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '8px', flexDirection: isMobile ? 'column' : 'row' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input className="input-field" placeholder={viewMode === 'global' ? 'Buscar en historial global de pases...' : 'Buscar pases en este curso...'} value={pasesSearch} onChange={(e) => setPasesSearch(e.target.value)} style={{ paddingLeft: '45px' }} />
          </div>
          <select
            className="input-field"
            style={{ width: isMobile ? '100%' : 'auto', minWidth: isMobile ? 0 : '120px' }}
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
          >
            <option value="course">Por Curso</option>
            <option value="global">Global</option>
          </select>
        </div>

        <div className="table-container">
          <table className="grades-table">
            <thead>
              <tr>
                <th>ALUMNO</th>
                {isMobile ? (
                  <th>ESTADO</th>
                ) : (
                  <>
                    <th>DNI</th>
                    <th>CURSO ORIGEN</th>
                    <th>DESTINO</th>
                    <th>FECHA</th>
                    <th>ESTADO</th>
                    <th>ACCIONES</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedPases.map((pase) => (
                <tr key={pase.id}>
                  <td><strong>{isMobile ? truncateStudentName(pase.nombre_apellido) : pase.nombre_apellido}</strong></td>
                  {isMobile ? (
                    <td>
                      {pase.institucion_destino === 'NUNCA ASISTIO' ? (
                        <span className="badge badge-never">NUNCA ASISTIÓ</span>
                      ) : (
                        <span className={`badge ${pase.estado === 'En Proceso de Pase' ? 'badge-warning' : 'badge-danger'}`}>
                          {pase.estado === 'En Proceso de Pase' ? 'Proceso de Pase' : (pase.estado || 'De Pase')}
                        </span>
                      )}
                    </td>
                  ) : (
                    <>
                      <td>{formatDNI(pase.dni)}</td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {pase.course_label ? `${pase.course_label} (${pase.year_nombre || '---'})` : (pase.course_id_origen === 0 ? 'Importado (Sin curso)' : '---')}
                      </td>
                      <td>{pase.institucion_destino === 'NUNCA ASISTIO' ? 'SABANA 2026' : pase.institucion_destino}</td>
                      <td>{pase.fecha_pase}</td>
                      <td>
                        {pase.institucion_destino === 'NUNCA ASISTIO' ? (
                          <span className="badge badge-never">NUNCA ASISTIÓ</span>
                        ) : (
                          <span className={`badge ${pase.estado === 'En Proceso de Pase' ? 'badge-warning' : 'badge-danger'}`}>
                            {pase.estado === 'En Proceso de Pase' ? 'Proceso de Pase' : (pase.estado || 'De Pase')}
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          {['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'].includes(user.rol) && <button className="icon-btn" onClick={() => setEditingPase(pase)} title="Editar Pase"><Wrench size={14} /></button>}
                          <button
                            className="icon-btn"
                            style={{ color: 'var(--primary)', background: 'rgba(99,102,241,0.1)' }}
                            onClick={() => {
                              const student = (data.allStudents || []).find((currentStudent) => String(currentStudent.dni) === String(pase.dni)) ||
                                (data.students || []).find((currentStudent) => String(currentStudent.dni) === String(pase.dni));
                              if (student) {
                                onViewFicha(student);
                              } else {
                                alert('No se encontró la ficha del alumno en el listado cargado.');
                              }
                            }}
                            title="Ver Ficha"
                          >
                            <FileText size={14} />
                          </button>
                          <button className="icon-btn" style={{ color: '#3498db' }} onClick={() => onPreviewStudent(pase.dni)} title="Ver Boletín"><Eye size={14} /></button>
                          {['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares'].includes(user.rol) && <button className="icon-btn danger" onClick={() => undoPase(pase.id)} title="Deshacer Pase"><RotateCcw size={14} /></button>}
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
            <button
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => { setCurrentPage((page) => page - 1); document.querySelector('.table-container')?.scrollTo(0, 0); }}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Anterior
            </button>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Página {currentPage} de {totalPages}</span>
            <button
              className="page-btn"
              disabled={currentPage === totalPages}
              onClick={() => { setCurrentPage((page) => page + 1); document.querySelector('.table-container')?.scrollTo(0, 0); }}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default PasesPanel;
