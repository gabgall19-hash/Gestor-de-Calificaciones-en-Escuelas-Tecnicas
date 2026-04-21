import React from 'react';
import Modal from '../UI/Modal';
import { GraduationCap } from 'lucide-react';

export default function PaseModal({
  show,
  onClose,
  pasingStudent,
  paseForm,
  setPaseForm,
  execPase
}) {
  if (!show || !pasingStudent) return null;

  return (
    <Modal title={`Dar de Pase: ${pasingStudent.apellido}`} onClose={onClose}>
      <p className="helper-text">Registrar la salida del alumno de la institución. Quedará guardado en el historial de Pases.</p>
      <form className="stack-form" onSubmit={execPase}>
        <input className="input-field" placeholder="Institución Destino" value={paseForm.institucion} onChange={(e) => setPaseForm(p => ({ ...p, institucion: e.target.value }))} required />
        <input className="input-field" placeholder="Fecha (dd/mm/aaaa)" value={paseForm.fecha} onChange={(e) => setPaseForm(p => ({ ...p, fecha: e.target.value }))} required />
        <textarea className="input-field" placeholder="Motivo del pase (Opcional)" value={paseForm.motivo} onChange={(e) => setPaseForm(p => ({ ...p, motivo: e.target.value }))} rows="3" />
        <button className="btn btn-primary" type="submit" style={{ background: 'var(--success)' }}><GraduationCap size={16} /> Confirmar Pase</button>
      </form>
    </Modal>
  );
}
