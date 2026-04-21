import React from 'react';
import Modal from '../UI/Modal';
import { Save } from 'lucide-react';

export default function EditStudentModal({
  show,
  onClose,
  editingStudent,
  setEditingStudent,
  dniError,
  setDniError,
  editStudent
}) {
  if (!show || !editingStudent) return null;

  return (
    <Modal title="Editar Alumno" onClose={() => { onClose(); setDniError(''); }}>
      <form className="stack-form" onSubmit={editStudent}>
        <input className="input-field" placeholder="Apellido(s)" value={editingStudent.apellido} onChange={(e) => setEditingStudent(p => ({ ...p, apellido: e.target.value }))} />
        <input className="input-field" placeholder="Nombre(s)" value={editingStudent.nombre} onChange={(e) => setEditingStudent(p => ({ ...p, nombre: e.target.value }))} />
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            className="input-field"
            placeholder="DNI (Opcional)"
            value={editingStudent.dni}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 8);
              setEditingStudent(p => ({ ...p, dni: val }));
              setDniError('');
            }}
          />
          <select
            className="input-field"
            value={editingStudent.genero}
            onChange={(e) => setEditingStudent(p => ({ ...p, genero: e.target.value }))}
          >
            <option value="Masculino">Masculino</option>
            <option value="Femenino">Femenino</option>
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <input className="input-field" placeholder="Matrícula" value={editingStudent.matricula || ''} onChange={(e) => setEditingStudent(p => ({ ...p, matricula: e.target.value }))} />
          <input className="input-field" placeholder="Legajo" value={editingStudent.legajo || ''} onChange={(e) => setEditingStudent(p => ({ ...p, legajo: e.target.value }))} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <input className="input-field" placeholder="Libro" value={editingStudent.libro || ''} onChange={(e) => setEditingStudent(p => ({ ...p, libro: e.target.value }))} />
          <input className="input-field" placeholder="Folio" value={editingStudent.folio || ''} onChange={(e) => setEditingStudent(p => ({ ...p, folio: e.target.value }))} />
        </div>
        <button className="btn btn-primary" type="submit" disabled={!editingStudent.nombre || !editingStudent.apellido}><Save size={16} /> Guardar Cambios</button>
        {dniError && <div className="error-message" style={{ color: '#ff4d4d', fontSize: '0.85rem', marginTop: '8px', fontWeight: 'bold', textAlign: 'center' }}>{dniError}</div>}
      </form>
    </Modal>
  );
}
