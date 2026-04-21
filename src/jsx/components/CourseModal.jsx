import React from 'react';
import Modal from '../UI/Modal';
import { Save } from 'lucide-react';
import { yearOptions, divisionOptions, shiftOptions } from '../functions/PreceptorHelpers';

export default function CourseModal({
  show,
  onClose,
  data,
  courseForm,
  setCourseForm,
  editCourse
}) {
  if (!show) return null;

  return (
    <Modal title="Editar Curso" onClose={onClose}>
      <form className="stack-form" onSubmit={editCourse}>
        <select className="input-field" value={courseForm.year_id} onChange={(e) => setCourseForm((p) => ({ ...p, year_id: e.target.value }))}>
          {(data?.academicYears || []).map((year) => <option key={year.id} value={year.id}>{year.nombre}</option>)}
        </select>
        <select className="input-field" value={courseForm.ano} onChange={(e) => setCourseForm((p) => ({ ...p, ano: e.target.value }))}>
          {yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}
        </select>
        <select className="input-field" value={courseForm.division} onChange={(e) => setCourseForm((p) => ({ ...p, division: e.target.value }))}>
          {divisionOptions.map((division) => <option key={division} value={division}>{division}</option>)}
        </select>
        <select className="input-field" value={courseForm.turno} onChange={(e) => setCourseForm((p) => ({ ...p, turno: e.target.value }))}>
          {shiftOptions.map((shift) => <option key={shift} value={shift}>{shift}</option>)}
        </select>
        <select className="input-field" value={courseForm.tecnicatura_id} onChange={(e) => setCourseForm((p) => ({ ...p, tecnicatura_id: e.target.value }))}>
          {(data?.tecnicaturas || []).map((tec) => <option key={tec.id} value={tec.id}>{tec.nombre}{tec.detalle ? ` (${tec.detalle})` : ''}</option>)}
        </select>
        {(data?.tecnicaturas || []).find(t => String(t.id) === String(courseForm.tecnicatura_id))?.detalle && (
          <p className="helper-text" style={{ fontStyle: 'italic', marginBottom: '0.5rem' }}>
            Identificador: {(data?.tecnicaturas || []).find(t => String(t.id) === String(courseForm.tecnicatura_id)).detalle}
          </p>
        )}
        <button className="btn btn-primary" type="submit"><Save size={16} /> Guardar Cambios</button>
      </form>
    </Modal>
  );
}
