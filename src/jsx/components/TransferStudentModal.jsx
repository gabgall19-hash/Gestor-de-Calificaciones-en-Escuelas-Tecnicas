import React from 'react';
import Modal from '../UI/Modal';
import { ArrowRightLeft } from 'lucide-react';

export default function TransferStudentModal({
  show,
  onClose,
  data,
  transferringAlumno,
  transferMotivo,
  setTransferMotivo,
  execTransfer
}) {
  if (!show || !transferringAlumno) return null;

  return (
    <Modal title={`Transferir Alumno: ${transferringAlumno.apellido}`} onClose={onClose}>
      <p className="helper-text">Selecciona el curso destino para el alumno. Se eliminarán sus notas actuales en este año lectivo.</p>
      <div className="stack-form">
        <select id="transfer-select" className="input-field">
          <option value="">-- Seleccionar Curso --</option>
          {(data?.allCourses || []).filter(c => c.id !== transferringAlumno.course_id).map(c => <option key={c.id} value={c.id}>{c.year_nombre} · {c.label} · {c.tecnicatura_nombre}</option>)}
        </select>
        <textarea
          className="input-field"
          placeholder="Motivo de la transferencia (Opcional)"
          value={transferMotivo}
          onChange={(e) => setTransferMotivo(e.target.value)}
          rows="3"
        />
        <button className="btn btn-primary" onClick={() => execTransfer(transferringAlumno.id, document.getElementById('transfer-select').value)}><ArrowRightLeft size={16} /> Confirmar Transferencia</button>
      </div>
    </Modal>
  );
}
