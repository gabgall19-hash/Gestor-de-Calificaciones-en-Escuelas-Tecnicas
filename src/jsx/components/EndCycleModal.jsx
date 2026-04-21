import React from 'react';
import Modal from '../UI/Modal';
import { AlertTriangle } from 'lucide-react';

export default function EndCycleModal({ 
  show, 
  onClose, 
  selectedStudentIds, 
  data, 
  selectedCourseId, 
  endCycleForm, 
  setEndCycleForm, 
  handleEndCycleConfirm 
}) {
  if (!show) return null;

  return (
    <Modal title="Fin de Ciclo Lectivo" onClose={onClose}>
      <div style={{ maxWidth: '500px' }}>
        <div className="section-title"><AlertTriangle size={24} color="#e74c3c" /><h2>Terminación de Ciclo Lectivo</h2></div>
        <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
          Estás por procesar a <strong>{selectedStudentIds.length}</strong> alumnos seleccionados. 
          Este proceso registrará su historial escolar y los moverá al curso destino.
        </p>

        <div className="stack-form">
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '10px', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={endCycleForm.isRepeater} 
              onChange={(e) => setEndCycleForm(p => ({ ...p, isRepeater: e.target.checked }))} 
              style={{ width: '20px', height: '20px' }}
            />
            <span style={{ fontWeight: 'bold' }}>¿Son alumnos REPITENTES?</span>
          </label>

          {!endCycleForm.isRepeater ? (
            <div style={{ marginTop: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', opacity: 0.7 }}>Curso Destino (Año Siguiente):</label>
              <select 
                className="input-field" 
                value={endCycleForm.targetCourseId || ''} 
                onChange={(e) => setEndCycleForm(p => ({ ...p, targetCourseId: e.target.value }))}
              >
                <option value="">-- Seleccionar curso destino --</option>
                {(data?.allCourses ?? []).map(c => (
                  <option key={c.id} value={c.id}>{c.year_nombre} · {c.label} · {c.tecnicatura_nombre}</option>
                ))}
              </select>
            </div>
          ) : (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(46, 204, 113, 0.1)', borderRadius: '10px', border: '1px solid rgba(46, 204, 113, 0.2)' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#2ecc71', fontWeight: 'bold' }}>
                Modo Repitente Activo:
              </p>
              <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>
                Los alumnos seleccionados se mantendrán en el mismo curso ({data?.courses?.find(c => c.id === selectedCourseId)?.label}) del próximo ciclo lectivo.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
            <button className="btn" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
            <button 
              className="btn btn-primary" 
              style={{ flex: 1 }} 
              disabled={!endCycleForm.isRepeater && !endCycleForm.targetCourseId}
              onClick={handleEndCycleConfirm}
            >
              Confirmar Transición
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
