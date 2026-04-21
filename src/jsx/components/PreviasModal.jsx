import React, { useState, useEffect, useMemo } from 'react';
import { X, Save } from 'lucide-react';
import { workshopI, workshopII } from '../functions/PreceptorHelpers';

const PreviasModal = ({ student, previas, subjects, onSave, onDelete, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPrevias, setEditingPrevias] = useState(previas);

  // Sync state when props change (real-time visibility)
  useEffect(() => {
    setEditingPrevias(previas);
  }, [previas]);
  
  const filteredSubjects = useMemo(() => {
    // Deduplicate subjects by name to avoid repetition in the search
    const uniqueSubjects = [];
    const seen = new Set();
    
    (subjects || []).forEach(s => {
      const lowerName = s.nombre.toLowerCase();
      if (!seen.has(lowerName)) {
        seen.add(lowerName);
        uniqueSubjects.push(s);
      }
    });

    return uniqueSubjects.filter(s => 
      s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) && 
      !previas.some(p => p.materia_id === s.id)
    );
  }, [subjects, searchTerm, previas]);

  const handleUpdate = (id, field, value) => {
    setEditingPrevias(prevs => prevs.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

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

              return (
                <button 
                  key={sub.id} 
                  className="tab-btn" 
                  style={{ fontSize: '0.75rem', textAlign: 'left', padding: '8px 12px' }}
                  onClick={() => onSave({ alumno_id: student.id, materia_id: sub.id, estado: 'pendiente' })}
                >
                  + {sub.nombre}{label}
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
                
                return (
                  <tr key={p.id}>
                    <td style={{ fontSize: '0.85rem' }}>{p.materia_nombre || p.materia_nombre_custom}</td>
                    <td>
                      {isTallerSimple ? (
                        <div style={{ fontSize: '0.65rem', opacity: 0.5, textAlign: 'center' }}>-</div>
                      ) : (
                        <select 
                          className="cell-input" 
                          style={{ width: '100%', textAlign: 'center', height: '28px', fontSize: '0.8rem' }} 
                          value={p.curso_ano || ''} 
                          onChange={(e) => handleUpdate(p.id, 'curso_ano', e.target.value)}
                        >
                          <option value="">--</option>
                          {['1°', '2°', '3°', '4°', '5°', '6°'].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      )}
                    </td>
                    <td><input type="text" className="cell-input" style={{ width: '100%', textAlign: 'center' }} value={p.libro || ''} onChange={(e) => handleUpdate(p.id, 'libro', e.target.value)} /></td>
                    <td><input type="text" className="cell-input" style={{ width: '100%', textAlign: 'center' }} value={p.folio || ''} onChange={(e) => handleUpdate(p.id, 'folio', e.target.value)} /></td>
                    <td><input type="text" className="cell-input" style={{ width: '100%', textAlign: 'center' }} value={p.calificacion || ''} onChange={(e) => handleUpdate(p.id, 'calificacion', e.target.value)} /></td>
                    <td><input type="text" className="cell-input" style={{ width: '100%' }} value={p.fecha || ''} onChange={(e) => handleUpdate(p.id, 'fecha', e.target.value)} /></td>
                    <td>
                      <select className="input-field" style={{ padding: '4px', fontSize: '0.8rem' }} value={p.estado} onChange={(e) => handleUpdate(p.id, 'estado', e.target.value)}>
                        <option value="pendiente">Pendiente</option>
                        <option value="aprobada">Aprobada</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button 
                          className="icon-btn" 
                          style={{ background: 'var(--success)', opacity: (isTallerSimple || p.curso_ano) ? 1 : 0.5 }} 
                          disabled={!isTallerSimple && !p.curso_ano}
                          onClick={() => onSave(p)} 
                          title={(isTallerSimple || p.curso_ano) ? "Guardar cambios" : "El año es obligatorio"}
                        >
                          <Save size={14} />
                        </button>
                        <button className="icon-btn danger" onClick={() => onDelete(p.id)} title="Eliminar"><X size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {editingPrevias.length === 0 && <tr><td colSpan="8" style={{ textAlign: 'center', opacity: 0.5 }}>No hay previas registradas.</td></tr>}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
          <button className="btn" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default PreviasModal;
