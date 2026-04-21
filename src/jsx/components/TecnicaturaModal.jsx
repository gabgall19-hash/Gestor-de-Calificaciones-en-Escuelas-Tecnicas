import React from 'react';
import Modal from '../UI/Modal';
import { GripVertical, Plus, Trash2 } from 'lucide-react';

export default function TecnicaturaModal({
  show,
  onClose,
  tecMode,
  tecForm,
  setTecForm,
  addTec,
  editTec,
  draggedMateriaIndex,
  handleDragStart,
  handleDragEnter,
  handleDragEnd
}) {
  if (!show) return null;

  return (
    <Modal title={tecMode === 'create' ? 'Nueva Tecnicatura' : 'Editar Estructura Curricular'} onClose={onClose}>
      <form className="stack-form" onSubmit={tecMode === 'create' ? addTec : editTec}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input className="input-field" style={{ flex: 2 }} placeholder="Nombre de la Carrera" value={tecForm.nombre} onChange={(e) => setTecForm((p) => ({ ...p, nombre: e.target.value }))} required />
          <input className="input-field" placeholder="Identificador / Detalle" value={tecForm.detalle} onChange={(e) => setTecForm((p) => ({ ...p, detalle: e.target.value }))} />
        </div>

        <div style={{ marginTop: '1rem', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--primary)' }}>Estructura Curricular (Arrastra para reordenar)</div>
        <div className="subject-editor">
          {tecForm.materias.map((m, i) => (
            <div
              key={m.id}
              className={`subject-row ${draggedMateriaIndex === i ? 'dragging' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, i)}
              onDragEnter={(e) => handleDragEnter(e, i)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className="drag-handle"><GripVertical size={16} /></div>
              <input className="input-field" placeholder="Nombre de la Materia" value={m.nombre} onChange={(e) => setTecForm((p) => ({ ...p, materias: p.materias.map((x, idx) => idx === i ? { ...x, nombre: e.target.value } : x) }))} />
              <select className="input-field" style={{ width: '160px' }} value={m.tipo} onChange={(e) => setTecForm((p) => ({ ...p, materias: p.materias.map((x, idx) => idx === i ? { ...x, tipo: e.target.value } : x) }))}>
                <option value="comun">Materias Comunes</option>
                <option value="modular">Modular (Teoría/Prác.)</option>
                <option value="taller">Taller (Simple)</option>
                <option value="taller_modular">Taller (Modular)</option>
              </select>
              <button className="icon-btn danger" type="button" onClick={() => setTecForm((p) => ({ ...p, materias: p.materias.length === 1 ? [{ id: `draft-${Date.now()}`, nombre: '', tipo: 'comun' }] : p.materias.filter((_, idx) => idx !== i) }))}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
          <button className="btn" type="button" onClick={() => setTecForm((p) => ({ ...p, materias: [...p.materias, { id: `draft-${Date.now()}`, nombre: '', tipo: 'comun' }] }))} style={{ flex: 1 }}><Plus size={16} /> Agregar Materia</button>
          <button className="btn btn-primary" type="submit" style={{ flex: 1 }}>{tecMode === 'create' ? 'Guardar Tecnicatura' : 'Guardar Cambios'}</button>
          <button className="btn" type="button" onClick={onClose} style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }}>Cancelar</button>
        </div>
      </form>
    </Modal>
  );
}
