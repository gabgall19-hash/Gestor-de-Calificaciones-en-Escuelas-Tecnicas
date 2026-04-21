import React from 'react';
import Modal from '../UI/Modal';
import MultiSelect from '../UI/MultiSelect';
import { Save } from 'lucide-react';
import { simplifyTecName, truncateSubject } from '../functions/PreceptorHelpers';

export default function UserFormModal({
  show,
  onClose,
  data,
  userForm,
  setUserForm,
  editingUserId,
  createUser,
  editUser
}) {
  if (!show || !editingUserId) return null;

  return (
    <Modal title={editingUserId === 'new' ? 'Crear Usuario' : 'Editar Usuario'} onClose={onClose}>
      <form onSubmit={editingUserId === 'new' ? createUser : editUser} className="stack-form" style={{ maxHeight: '80vh', overflowY: 'auto', paddingRight: '10px' }}>
        <label className="label">Información Personal</label>
        <input className="input-field" placeholder="Nombre completo" value={userForm.nombre} onChange={(e) => setUserForm(p => ({ ...p, nombre: e.target.value }))} required />
        <div className="grid-2">
          <input className="input-field" placeholder="Usuario" value={userForm.username} onChange={(e) => setUserForm(p => ({ ...p, username: e.target.value }))} required />
          <input className="input-field" placeholder="Contraseña" value={userForm.password} onChange={(e) => setUserForm(p => ({ ...p, password: e.target.value }))} required />
        </div>

        <label className="label">Rol en el Sistema</label>
        <select className="input-field" value={userForm.rol} onChange={(e) => setUserForm(p => ({ ...p, rol: e.target.value }))}>
          <option value="admin">Administrador</option>
          <option value="secretaria_de_alumnos">Secretaria de Alumnos</option>
          <option value="jefe_de_auxiliares">Jefe de Auxiliares</option>
          <option value="director">Director</option>
          <option value="vicedirector">Vicedirector</option>
          <option value="preceptor">Preceptor</option>
          <option value="preceptor_taller">Preceptor Taller</option>
          <option value="preceptor_ef">Preceptor Ed. Física</option>
          <option value="profesor">Profesor</option>
        </select>

        {(userForm.rol === 'preceptor' || userForm.rol === 'preceptor_taller' || userForm.rol === 'preceptor_ef') && (
          <div className="stack-form" style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <label className="label" style={{ color: 'var(--primary)' }}>Asignación de Preceptoría</label>
            <div className="stack-form">
              <label className="label">Curso Responsable</label>
              <select className="input-field" value={userForm.preceptor_course_id || ''} onChange={(e) => setUserForm(p => ({ ...p, preceptor_course_id: e.target.value }))}>
                <option value="">-- Seleccionar Curso --</option>
                {(data?.allCourses || []).map(c => <option key={c.id} value={c.id}>{c.year_nombre} · {c.label} · {simplifyTecName(c.tecnicatura_nombre)}</option>)}
              </select>
            </div>
            
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
              <input 
                type="checkbox" 
                id="is_prof_check"
                checked={userForm.is_professor_hybrid || (userForm.professor_subject_ids && userForm.professor_subject_ids.length > 0)} 
                onChange={(e) => setUserForm(p => ({ ...p, is_professor_hybrid: e.target.checked }))} 
              />
              <label htmlFor="is_prof_check" style={{ fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer' }}>¿También es Profesor? (Asignar materias extra)</label>
            </div>
          </div>
        )}

        {(userForm.rol === 'profesor' || userForm.is_professor_hybrid || (userForm.rol !== 'admin' && userForm.rol !== 'jefe_de_auxiliares' && userForm.professor_subject_ids && userForm.professor_subject_ids.length > 0)) && (
          <div style={{ marginTop: '1rem' }}>
            <MultiSelect
              label="Asignar Materias (Como Profesor)"
              options={(data?.allCourses || []).flatMap(c =>
                (data?.allSubjects || []).filter(s => s.tecnicatura_id === c.tecnicatura_id).map(s => ({
                  id: `${c.id}-${s.id}`,
                  label: `${c.label} (${c.year_nombre}) · ${truncateSubject(s.nombre)}`
                }))
              )}
              selected={userForm.professor_subject_ids || []}
              onChange={(vals) => setUserForm(p => ({ ...p, professor_subject_ids: vals }))}
            />
          </div>
        )}

        <button className="btn btn-primary" type="submit" style={{ marginTop: '1rem' }}><Save size={16} /> {editingUserId === 'new' ? 'Crear Usuario' : 'Guardar Cambios'}</button>
      </form>
    </Modal>
  );
}
