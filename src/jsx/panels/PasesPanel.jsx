import React from 'react';
import { ArrowRightLeft, Search, Wrench, RotateCcw, Eye, FileText } from 'lucide-react';
import { formatDNI } from '../functions/PreceptorHelpers';

const PasesPanel = ({ user, data, pasesSearch, setPasesSearch, setEditingPase, undoPase, onPreviewStudent, onViewFicha }) => {
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 30;

  const [viewMode, setViewMode] = React.useState('course'); // 'course' or 'global'

  const filteredPases = data.pases.filter(p => {
    const matchesSearch = `${p.nombre_apellido} ${p.dni} ${p.institucion_destino}`.toLowerCase().includes(pasesSearch.toLowerCase());
    const matchesCourse = viewMode === 'global' || p.course_id_origen === data.selectedCourseId;
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
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input className="input-field" placeholder={viewMode === 'global' ? "Buscar en historial global de pases..." : "Buscar pases en este curso..."} value={pasesSearch} onChange={(e) => setPasesSearch(e.target.value)} style={{ paddingLeft: '45px' }} />
          </div>
          <select 
            className="input-field" 
            style={{ width: 'auto', minWidth: '120px' }}
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
                <th>DNI</th>
                <th>CURSO ORIGEN</th>
                <th>DESTINO</th>
                <th>FECHA</th>
                <th>ESTADO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPases.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.nombre_apellido}</strong></td>
                  <td>{formatDNI(p.dni)}</td>
                  <td style={{ fontSize: '0.8rem' }}>
                    {p.course_label ? `${p.course_label} (${p.year_nombre || '---'})` : (p.course_id_origen === 0 ? 'Importado (Sin curso)' : '---')}
                  </td>
                  <td>{p.institucion_destino === 'NUNCA ASISTIO' ? 'SABANA 2026' : p.institucion_destino}</td>
                  <td>{p.fecha_pase}</td>
                  <td>
                    {p.institucion_destino === 'NUNCA ASISTIO' ? (
                      <span className="badge badge-never">NUNCA ASISTIO</span>
                    ) : (
                      <span className={`badge ${p.estado === 'En Proceso de Pase' ? 'badge-warning' : 'badge-danger'}`}>
                        {p.estado === 'En Proceso de Pase' ? 'Proceso de Pase' : (p.estado || 'De Pase')}
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'].includes(user.rol) && <button className="icon-btn" onClick={() => setEditingPase(p)} title="Editar Pase"><Wrench size={14} /></button>}
                      <button 
                        className="icon-btn" 
                        style={{ color: 'var(--primary)', background: 'rgba(99,102,241,0.1)' }} 
                        onClick={() => {
                          const student = (data.allStudents || []).find(s => String(s.dni) === String(p.dni)) || 
                                          (data.students || []).find(s => String(s.dni) === String(p.dni));
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
                      <button className="icon-btn" style={{ color: '#3498db' }} onClick={() => onPreviewStudent(p.dni)} title="Ver Boletín"><Eye size={14} /></button>
                      {['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares'].includes(user.rol) && <button className="icon-btn danger" onClick={() => undoPase(p)} title="Deshacer Pase"><RotateCcw size={14} /></button>}
                    </div>
                  </td>
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
              onClick={() => { setCurrentPage(p => p - 1); document.querySelector('.table-container').scrollTo(0,0); }}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Anterior
            </button>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Página {currentPage} de {totalPages}</span>
            <button 
              className="page-btn" 
              disabled={currentPage === totalPages} 
              onClick={() => { setCurrentPage(p => p + 1); document.querySelector('.table-container').scrollTo(0,0); }}
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
