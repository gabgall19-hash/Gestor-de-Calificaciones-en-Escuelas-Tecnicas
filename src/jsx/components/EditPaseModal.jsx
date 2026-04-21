import React from 'react';
import Modal from '../UI/Modal';
import { Save } from 'lucide-react';
import { formatDNI } from '../functions/PreceptorHelpers';

export default function EditPaseModal({
  show,
  onClose,
  data,
  editingPase,
  setEditingPase,
  savePaseEdit
}) {
  if (!show || !editingPase) return null;

  return (
    <Modal title="Editar Registro de Pase" onClose={onClose}>
      <form className="stack-form" onSubmit={savePaseEdit}>
        <p className="helper-text">{editingPase.nombre_apellido} ({formatDNI(editingPase.dni)})</p>
        <label className="label">Curso Origen:</label>
        <select className="input-field" value={editingPase.course_id_origen} onChange={(e) => setEditingPase(p => ({ ...p, course_id_origen: Number(e.target.value) }))}>
          {(data?.allCourses || []).map(c => <option key={c.id} value={c.id}>{c.year_nombre} · {c.label} · {c.tecnicatura_nombre}</option>)}
        </select>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <label className="label">Institución Destino:</label>
            <input className="input-field" value={editingPase.institucion_destino} onChange={(e) => setEditingPase(p => ({ ...p, institucion_destino: e.target.value }))} required />
          </div>
          <div style={{ width: '150px' }}>
            <label className="label">Fecha:</label>
            <input className="input-field" value={editingPase.fecha_pase} onChange={(e) => setEditingPase(p => ({ ...p, fecha_pase: e.target.value }))} required />
          </div>
        </div>
        <label className="label">Motivo:</label>
        <textarea className="input-field" value={editingPase.motivo === '...' ? '' : editingPase.motivo} onChange={(e) => setEditingPase(p => ({ ...p, motivo: e.target.value }))} placeholder="..." rows="3"></textarea>
        <label className="label">Estado:</label>
        <select className="input-field" value={editingPase.estado || 'De pase'} onChange={(e) => setEditingPase(p => ({ ...p, estado: e.target.value }))}>
          <option value="De pase">De pase (Rojo)</option>
          <option value="En proceso de pase">En proceso de pase (Naranja)</option>
        </select>
        <button className="btn btn-primary" type="submit"><Save size={16} /> Guardar Cambios</button>
      </form>
    </Modal>
  );
}
