import React from 'react';
import Modal from '../UI/Modal';
import { Save } from 'lucide-react';

export default function ObsModal({
  show,
  onClose,
  editingObsStudent,
  setEditingObsStudent,
  saveObs
}) {
  if (!show || !editingObsStudent) return null;

  return (
    <Modal title={`Observaciones: ${editingObsStudent.apellido}`} onClose={onClose}>
      <form className="stack-form" onSubmit={saveObs}>
        <p className="helper-text">Estas notas aparecerán en el boletín oficial del alumno. Puedes incluir párrafos y saltos de línea.</p>
        <textarea
          className="input-field"
          placeholder="Escribe aquí las observaciones pedagógicas..."
          value={editingObsStudent.observaciones || ''}
          onChange={(e) => setEditingObsStudent(p => ({ ...p, observaciones: e.target.value }))}
          rows="8"
          style={{ resize: 'vertical', minHeight: '150px' }}
        />
        <button className="btn btn-primary" type="submit"><Save size={16} /> Guardar Observaciones</button>
      </form>
    </Modal>
  );
}
