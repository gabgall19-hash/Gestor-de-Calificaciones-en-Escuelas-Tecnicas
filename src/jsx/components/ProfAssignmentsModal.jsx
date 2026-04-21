import React from 'react';
import Modal from '../UI/Modal';
import { simplifyTecName } from '../functions/PreceptorHelpers';

export default function ProfAssignmentsModal({
  show,
  onClose,
  data,
  viewingProf
}) {
  if (!show || !viewingProf) return null;

  return (
    <Modal title={`Asignaciones: ${viewingProf.nombre}`} onClose={onClose}>
      <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '12px' }}>
        {(() => {
          const pairs = (viewingProf.professor_subject_ids || '').split(',').filter(Boolean);
          if (pairs.length === 0) return <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: '2rem 0' }}>Este profesor no tiene materias asignadas.</p>;

          return pairs.map(pair => {
            const [cid, sid] = pair.split('-');
            const course = (data?.allCourses || []).find(c => String(c.id) === String(cid));
            const subject = (data?.allSubjects || []).find(s => String(s.id) === String(sid));

            return (
              <div key={pair} style={{
                padding: '12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                marginBottom: '10px'
              }}>
                <div style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '0.95rem' }}>{subject?.nombre || 'Materia no encontrada'}</div>
                <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '2px' }}>{course?.label} ({course?.year_nombre}) · {simplifyTecName(course?.tecnicatura_nombre)}</div>
                {subject?.es_taller === 1 && <div style={{ fontSize: '0.65rem', color: '#f39c12', fontWeight: '900', marginTop: '4px' }}>TALLER</div>}
              </div>
            );
          });
        })()}
      </div>
      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
        <button className="btn" onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)' }}>Cerrar</button>
      </div>
    </Modal>
  );
}
