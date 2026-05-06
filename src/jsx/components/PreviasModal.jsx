import React, { useState, useEffect, useMemo } from 'react';
import { X, Save } from 'lucide-react';
import { workshopI, workshopII } from '../functions/PreceptorHelpers';

const PreviasModal = ({ student, previas, subjects, tecnicaturas, onSave, onDelete, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPrevias, setEditingPrevias] = useState(previas);
  const [deletedIds, setDeletedIds] = useState([]);

  // Sync state when props change (only if no unsaved changes or on first load)
  useEffect(() => {
    if (editingPrevias.length === 0 && previas.length > 0) {
      setEditingPrevias(previas);
    } else {
      let merged = [...editingPrevias];
      let changed = false;
      
      previas.forEach(p => {
        // Find if we have a temporary item for this same subject
        const tempIndex = merged.findIndex(m => !m.id && m.materia_id === p.materia_id);
        // Find if we already have this saved item
        const savedIndex = merged.findIndex(m => m.id === p.id);
        
        if (tempIndex !== -1) {
          // Replace the temporary item with the official saved item
          merged[tempIndex] = p;
          changed = true;
        } else if (savedIndex === -1) {
          // It's a completely new item from the server
          merged.push(p);
          changed = true;
        } else {
          // Update existing saved item to match server (in case other fields were formatted by server)
          // We only do this if it's identical to avoid overwriting ongoing typing, 
          // but since they just saved, it's safe to sync
          merged[savedIndex] = { ...merged[savedIndex], ...p };
          changed = true;
        }
      });
      
      if (changed) {
         setEditingPrevias(merged);
      }
    }
  }, [previas]);
  
  const normalize = (val) => String(val || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

  // Map each subject to its year based on tecnicatura.detalle
  const subjectsWithYears = useMemo(() => {
    return (subjects || []).map(s => {
      const tec = (tecnicaturas || []).find(t => t.id === s.tecnicatura_id);
      const year = tec?.detalle?.split(' ')[0] || ''; // Extracts "1°", "2°", etc.
      return { ...s, year };
    });
  }, [subjects, tecnicaturas]);

  // Group subjects by normalized name to identify unique/common ones
  const subjectsByName = useMemo(() => {
    const groups = {};
    subjectsWithYears.forEach(s => {
      const key = normalize(s.nombre);
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    return groups;
  }, [subjectsWithYears]);

  const filteredSubjects = useMemo(() => {
    const uniqueSubjects = [];
    const seen = new Set();
    
    subjectsWithYears.forEach(s => {
      const norm = normalize(s.nombre);
      if (!seen.has(norm)) {
        seen.add(norm);
        uniqueSubjects.push(s);
      }
    });

    return uniqueSubjects.filter(s => 
      normalize(s.nombre).includes(normalize(searchTerm))
    );
  }, [subjectsWithYears, searchTerm]);

  const handleUpdate = (id, field, value) => {
    setEditingPrevias(prevs => prevs.map(p => {
      if ((p.id || p._tempId) === id) {
        let updated = { ...p, [field]: value };
        
        // If changing year, we must update materia_id to match the correct record for that name
        if (field === 'curso_ano') {
          const variants = subjectsByName[normalize(p.materia_nombre || p.materia_nombre_custom)];
          if (variants) {
            const match = variants.find(v => v.year === value);
            if (match) {
              updated.materia_id = match.id;
            }
          }
        }
        return updated;
      }
      return p;
    }));
  };

  const hasChanges = useMemo(() => {
    if (deletedIds.length > 0) return true;
    if (editingPrevias.length !== previas.length) return true;
    for (const ep of editingPrevias) {
      if (!ep.id) return true; // new item
      const sp = previas.find(p => p.id === ep.id);
      if (!sp) return true;
      if (
        ep.curso_ano !== sp.curso_ano ||
        ep.libro !== sp.libro ||
        ep.folio !== sp.folio ||
        ep.calificacion !== sp.calificacion ||
        ep.fecha !== sp.fecha ||
        ep.estado !== sp.estado
      ) return true;
    }
    return false;
  }, [editingPrevias, previas, deletedIds]);

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-card" style={{ width: '90%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.4rem' }}>Previas de {student.apellido}, {student.nombre}</h2>
          <button className="icon-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ marginBottom: '2rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Añadir Materias</h3>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Buscar materia..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginBottom: '1rem' }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto', padding: '0.5rem' }}>
            {filteredSubjects.map(sub => {
              let label = '';
              const subName = sub.nombre.trim();
              if (workshopI.some(w => w.toLowerCase() === subName.toLowerCase())) label = ' [Taller I]';
              else if (workshopII.some(w => w.toLowerCase() === subName.toLowerCase())) label = ' [Taller II]';
              else if (sub.es_taller === 1) {
                if ((sub.tipo || '').toLowerCase() === 'modular') label = ' [Taller Modular]';
                else label = ' [Taller]';
              } else if ((sub.tipo || '').toLowerCase() === 'modular') {
                label = ' [Modular]';
              }

              const variants = subjectsByName[normalize(sub.nombre)] || [];
              const availableYears = [...new Set(variants.map(v => v.year).filter(Boolean))];
              const isUniqueYear = availableYears.length === 1;
              const yearHint = isUniqueYear ? ` (${availableYears[0]})` : '';

              return (
                <button 
                  key={sub.id} 
                  className="tab-btn" 
                  style={{ fontSize: '0.75rem', textAlign: 'left', padding: '8px 12px' }}
                  onClick={() => {
                    setEditingPrevias(prev => [...prev, {
                      _tempId: Date.now() + Math.random(),
                      alumno_id: student.id,
                      materia_id: sub.id,
                      materia_nombre: sub.nombre,
                      curso_ano: isUniqueYear ? availableYears[0] : '', 
                      estado: 'pendiente'
                    }]);
                  }}
                >
                  + {sub.nombre}{yearHint}{label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Materia</th>
                <th style={{ width: '90px' }}>Año</th>
                <th style={{ width: '60px' }}>L°</th>
                <th style={{ width: '60px' }}>F°</th>
                <th style={{ width: '60px' }}>Calif.</th>
                <th style={{ width: '130px' }}>Fecha</th>
                <th style={{ width: '130px' }}>Estado</th>
                <th style={{ width: '80px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {editingPrevias.map(p => {
                const sub = subjects.find(s => s.id === p.materia_id);
                const isTallerSimple = sub?.es_taller === 1 && (sub?.tipo || '').toLowerCase() !== 'modular';
                const variants = subjectsByName[normalize(p.materia_nombre || p.materia_nombre_custom)] || [];
                const availableYears = [...new Set(variants.map(v => v.year).filter(Boolean))];
                const isYearFixed = availableYears.length === 1;
                
                return (
                  <tr key={p.id || p._tempId}>
                    <td style={{ fontSize: '0.85rem' }}>{p.materia_nombre || p.materia_nombre_custom}</td>
                    <td>
                      {isTallerSimple ? (
                        <div style={{ fontSize: '0.65rem', opacity: 0.5, textAlign: 'center' }}>-</div>
                      ) : isYearFixed ? (
                        <div style={{ textAlign: 'center', fontWeight: 'bold' }}>{p.curso_ano}</div>
                      ) : (
                        <select 
                          className="cell-input" 
                          style={{ width: '100%', textAlign: 'center', height: '28px', fontSize: '0.8rem', border: '1px solid var(--primary)', borderRadius: '4px' }} 
                          value={p.curso_ano || ''} 
                          onChange={(e) => handleUpdate(p.id || p._tempId, 'curso_ano', e.target.value)}
                        >
                          <option value="">--</option>
                          {availableYears.length > 0 
                            ? availableYears.sort().map(y => <option key={y} value={y}>{y}</option>)
                            : ['1°', '2°', '3°', '4°', '5°', '6°'].map(y => <option key={y} value={y}>{y}</option>)
                          }
                        </select>
                      )}
                    </td>
                    <td><input type="text" className="cell-input" style={{ width: '100%', textAlign: 'center' }} value={p.libro || ''} onChange={(e) => handleUpdate(p.id || p._tempId, 'libro', e.target.value)} /></td>
                    <td><input type="text" className="cell-input" style={{ width: '100%', textAlign: 'center' }} value={p.folio || ''} onChange={(e) => handleUpdate(p.id || p._tempId, 'folio', e.target.value)} /></td>
                    <td><input type="text" className="cell-input" style={{ width: '100%', textAlign: 'center' }} value={p.calificacion || ''} onChange={(e) => handleUpdate(p.id || p._tempId, 'calificacion', e.target.value)} /></td>
                    <td><input type="text" className="cell-input" style={{ width: '100%' }} value={p.fecha || ''} onChange={(e) => handleUpdate(p.id || p._tempId, 'fecha', e.target.value)} /></td>
                    <td>
                      <select className="input-field" style={{ padding: '4px', fontSize: '0.8rem' }} value={p.estado} onChange={(e) => handleUpdate(p.id || p._tempId, 'estado', e.target.value)}>
                        <option value="pendiente">Pendiente</option>
                        <option value="aprobada">Aprobada</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                        <button className="icon-btn danger" onClick={() => {
                          if (p.id) {
                            setDeletedIds(prev => [...prev, p.id]);
                            setEditingPrevias(prev => prev.filter(item => item.id !== p.id));
                          } else {
                            setEditingPrevias(prev => prev.filter(item => item._tempId !== p._tempId));
                          }
                        }} title="Eliminar"><X size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {editingPrevias.length === 0 && <tr><td colSpan="8" style={{ textAlign: 'center', opacity: 0.5 }}>No hay previas registradas.</td></tr>}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button className="btn" onClick={onClose}>Cerrar</button>
          <button 
            className={`btn ${hasChanges ? 'btn-primary' : ''}`}
            style={!hasChanges ? { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', cursor: 'not-allowed' } : {}}
            disabled={!hasChanges}
            onClick={() => {
              // validate that non-taller subjects have curso_ano
              const invalid = editingPrevias.find(p => {
                const sub = subjects.find(s => s.id === p.materia_id);
                const isTallerSimple = sub?.es_taller === 1 && (sub?.tipo || '').toLowerCase() !== 'modular';
                return !isTallerSimple && !p.curso_ano;
              });
              if (invalid) {
                alert(`Debes indicar el "Año" en la materia ${invalid.materia_nombre || invalid.materia_nombre_custom}`);
                return;
              }
              onSave(editingPrevias, deletedIds);
            }}
          >
            <Save size={18} /> Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviasModal;
