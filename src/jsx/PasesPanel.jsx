import React from 'react';
import { ArrowRightLeft, Search, Wrench, RotateCcw, Eye } from 'lucide-react';
import { formatDNI } from './PreceptorHelpers';

const PasesPanel = ({ user, data, pasesSearch, setPasesSearch, setEditingPase, undoPase, onPreviewStudent }) => {
  return (
    <section className="page-section">
      <div className="section-title"><ArrowRightLeft size={16} /><h2>Gestión de Pases de Alumnos</h2></div>
      <div className="management-card" style={{ marginTop: '1rem' }}>
        <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
          <input className="input-field" placeholder="Buscar en historial de pases..." value={pasesSearch} onChange={(e) => setPasesSearch(e.target.value)} style={{ paddingLeft: '45px' }} />
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
              {data.pases.filter(p => `${p.nombre_apellido} ${p.dni} ${p.institucion_destino}`.toLowerCase().includes(pasesSearch.toLowerCase())).map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.nombre_apellido}</strong></td>
                  <td>{formatDNI(p.dni)}</td>
                  <td style={{ fontSize: '0.8rem' }}>{p.course_label} ({p.year_nombre})</td>
                  <td>{p.institucion_destino}</td>
                  <td>{p.fecha_pase}</td>
                  <td><span className={`badge ${p.estado === 'De pase' ? 'badge-danger' : 'badge-warning'}`}>{p.estado || 'De pase'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'].includes(user.rol) && <button className="icon-btn" onClick={() => setEditingPase(p)} title="Editar Pase"><Wrench size={14} /></button>}
                      <button className="icon-btn" style={{ color: '#3498db' }} onClick={() => onPreviewStudent(p.dni)} title="Ver Boletín"><Eye size={14} /></button>
                      {['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares'].includes(user.rol) && <button className="icon-btn danger" onClick={() => undoPase(p)} title="Deshacer Pase"><RotateCcw size={14} /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default PasesPanel;
