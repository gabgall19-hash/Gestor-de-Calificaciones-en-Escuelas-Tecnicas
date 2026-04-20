import React from 'react';
import { ClipboardList, Search, Lock, Unlock } from 'lucide-react';
import { truncateSubject } from './PreceptorHelpers';
import '../css/AcademicManager.css';

const AcademicManager = ({ 
  user, data, selectedCourseId, 
  materiasSearch, setMateriasSearch, 
  handleUpdateLocks 
}) => {
  return (
    <section className="page-section">
      <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ClipboardList size={16} className="text-primary" />
          <h2>Gestión de Materias y Bloqueos</h2>
        </div>
        <div className="panel-actions">
          <button className="btn" onClick={() => handleUpdateLocks(null, null, true, true)} style={{ background: 'rgba(231, 76, 60, 0.2)', color: '#e74c3c' }}>
            {['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'].includes(user.rol) ? 'BLOQUEAR TODO EL CURSO' : 'BLOQUEAR MIS MATERIAS'}
          </button>
          <button className="btn" onClick={() => handleUpdateLocks(null, null, false, true)} style={{ background: 'rgba(46, 204, 113, 0.2)', color: '#27ae60' }}>
            {['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'].includes(user.rol) ? 'DESBLOQUEAR TODO' : 'DESBLOQUEAR MIS MATERIAS'}
          </button>
        </div>
      </div>

      <div className="glass-card table-container" style={{ marginTop: '1rem', overflowX: 'auto' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '25px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
          <input 
            className="input-field" 
            placeholder="Buscar materia por nombre..." 
            value={materiasSearch} 
            onChange={(e) => setMateriasSearch(e.target.value)}
            style={{ paddingLeft: '45px' }}
          />
        </div>
        <table className="grades-table" style={{ fontSize: '0.8rem' }}>
          <thead>
            <tr>
              <th style={{ width: '250px' }}>ESTRUCTURA CURRICULAR / DOCENTES</th>
              {[
                { ids: [1], label: '1er Inf.' },
                { ids: [2], label: '1° Trim.' },
                { ids: [3], label: '2do Inf.' },
                { ids: [4], label: '2° Trim.' },
                { ids: [5], label: '3er Inf.' },
                { ids: [6], label: '3° Trim.' },
                { ids: [7, 8, 9, 10], label: 'Periodo Compensatorio' }
              ].map(group => {
                const relevantSubjects = (data.subjects || []).filter(s => {
                  if (['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'].includes(user.rol)) return true;
                  if (user.rol === 'preceptor') return s.es_taller !== 1;
                  if (user.rol === 'preceptor_taller') return s.es_taller === 1;
                  return false;
                });
                
                const isPeriodLockedFull = relevantSubjects.length > 0 && relevantSubjects.every(s => 
                  group.ids.every(pid => (data.locks || []).some(l => l.materia_id === s.id && l.periodo_id === pid))
                );
                return (
                  <th key={group.label} style={{ textAlign: 'center', fontSize: '0.65rem', minWidth: '80px', paddingBottom: '10px' }}>
                    <button 
                      className={`icon-btn ${isPeriodLockedFull ? 'danger' : 'success'}`}
                      style={{ display: 'block', margin: '0 auto 6px auto', width: '24px', height: '24px', padding: 0, opacity: 0.8 }}
                      onClick={() => handleUpdateLocks(null, group.ids, !isPeriodLockedFull)}
                      title={isPeriodLockedFull ? 'Desbloquear hila completa' : 'Bloquear hilera completa'}
                    >
                      {isPeriodLockedFull ? <Lock size={12} /> : <Unlock size={12} />}
                    </button>
                    {group.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {data.subjects.filter(s => s.nombre.toLowerCase().includes(materiasSearch.toLowerCase())).map(subject => {
              const subjectKey = `${selectedCourseId}-${subject.id}`;
              const professors = (data.users || [])
                .filter(u => String(u.professor_subject_ids || '').split(',').includes(subjectKey))
                .map(u => u.nombre)
                .join(', ') || 'Sin prof. asignado';

              return (
                <tr key={subject.id}>
                  <td>
                    <div style={{ fontWeight: 'bold' }}>{truncateSubject(subject.nombre)}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{professors}</div>
                  </td>
                  {[
                    { ids: [1] }, { ids: [2] }, { ids: [3] }, { ids: [4] }, { ids: [5] }, { ids: [6] }, { ids: [7, 8, 9, 10] }
                  ].map((group, idx) => {
                    const isLocked = group.ids.every(pid => (data.locks || []).some(l => l.materia_id === subject.id && l.periodo_id === pid));
                    return (
                      <td key={idx} style={{ textAlign: 'center' }}>
                        {(() => {
                          const canToggle = ['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'].includes(user.rol) || 
                                           (user.rol === 'preceptor' && subject.es_taller !== 1) ||
                                           (user.rol === 'preceptor_taller' && subject.es_taller === 1);
                          
                          return (
                            <button 
                              className={`icon-btn ${isLocked ? 'danger' : 'success'}`} 
                              onClick={() => canToggle && handleUpdateLocks(subject.id, group.ids, !isLocked)}
                              title={isLocked ? 'Periodo Bloqueado' : 'Periodo Abierto'}
                              style={{ 
                                padding: '8px', 
                                background: isLocked ? 'rgba(231, 76, 60, 0.1)' : 'rgba(46, 204, 113, 0.1)',
                                opacity: canToggle ? 1 : 0.3,
                                cursor: canToggle ? 'pointer' : 'not-allowed'
                              }}
                              disabled={!canToggle}
                            >
                              {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                            </button>
                          );
                        })()}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AcademicManager;
