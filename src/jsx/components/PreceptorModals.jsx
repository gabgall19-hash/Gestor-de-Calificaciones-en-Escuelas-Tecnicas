import React from 'react';
import {
  ArrowRightLeft, AlertTriangle, Save, GraduationCap, GripVertical, Trash2, Plus
} from 'lucide-react';
import Modal from '../UI/Modal';
import MultiSelect from '../UI/MultiSelect';
import PreviasModal from './PreviasModal';
import StudentFichaModal from './StudentFichaModal';
import { formatDNI, simplifyTecName, truncateSubject, emptyUser } from '../functions/PreceptorHelpers';

const PreceptorModals = ({
  data,
  showNomenclaturaModal, setShowNomenclaturaModal,
  showEndCycleModal, setShowEndCycleModal, endCycleForm, setEndCycleForm, selectedStudentIds, selectedCourseId, handleEndCycleConfirm,
  showPreviasModal, setShowPreviasModal, selectedRacStudent, setSelectedRacStudent, savePrevia, deletePrevia,
  tecMode, setTecMode, tecForm, setTecForm, addTec, editTec, draggedMateriaIndex, handleDragStart, handleDragEnter, handleDragEnd,
  editingCourseId, setEditingCourseId, courseForm, setCourseForm, editCourse, yearOptions, divisionOptions, shiftOptions,
  transferringAlumno, setTransferringAlumno, transferMotivo, setTransferMotivo, execTransfer,
  editingStudent, setEditingStudent, editStudent, dniError, setDniError,
  pasingStudent, setPasingStudent, paseForm, setPaseForm, execPase,
  editingPase, setEditingPase, savePaseEdit,
  editingObsStudent, setEditingObsStudent, saveObs,
  viewingProf, setViewingProf,
  editingUserId, setEditingUserId, userForm, setUserForm, createUser, editUser,
  viewingFichaStudent, setViewingFichaStudent, isEditingFicha, setIsEditingFicha, handleSaveFicha, studentForm, setStudentForm, getHistorial
}) => {
  return (
    <>
      {showNomenclaturaModal && (
        <Modal title="Nomenclatura de Calificación" onClose={() => setShowNomenclaturaModal(false)}>
          <div className="nomenclatura-container">
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.2rem', lineHeight: '1.4' }}>
              Escala de valoración utilizada para los informes orientadores y planillas oficiales de la institución.
            </p>
            <table className="nomenclatura-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Sigla</th>
                  <th style={{ textAlign: 'left', padding: '10px' }}>Descripción</th>
                </tr>
              </thead>
              <tbody>
                <tr><td style={{ padding: '8px' }}><strong>AE</strong></td><td style={{ padding: '8px' }}>Acredita con Excelencia (10)</td></tr>
                <tr><td style={{ padding: '8px' }}><strong>AD</strong></td><td style={{ padding: '8px' }}>Acredita con Distinción (9)</td></tr>
                <tr><td style={{ padding: '8px' }}><strong>AMS</strong></td><td style={{ padding: '8px' }}>Acredita Muy Satisfactoriamente (8)</td></tr>
                <tr><td style={{ padding: '8px' }}><strong>A</strong></td><td style={{ padding: '8px' }}>Acredita (7)</td></tr>
                <tr><td style={{ padding: '8px' }}><strong>NA</strong></td><td style={{ padding: '8px' }}>No Acredita (1-6)</td></tr>
                <tr><td style={{ padding: '8px' }}><strong>S/C</strong></td><td style={{ padding: '8px' }}>Sin Calificar (*)</td></tr>
              </tbody>
            </table>
            <div style={{ marginTop: '1.5rem', padding: '0.8rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', margin: 0 }}>
                Nota: Las calificaciones definitivas se expresan en números enteros (1 al 10).
              </p>
            </div>
          </div>
        </Modal>
      )}

      {showEndCycleModal && (
        <Modal onClose={() => setShowEndCycleModal(false)}>
          <div className="ficha-alumno">
            <div className="section-title"><AlertTriangle size={24} color="#e74c3c" /><h2>Terminación de Ciclo Lectivo</h2></div>
            <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
              Estás por procesar a <strong>{selectedStudentIds?.length || 0}</strong> alumnos seleccionados. 
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
                    {(data.allCourses ?? []).map(c => (
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
                    Los alumnos seleccionados se mantendrán en el mismo curso ({data.courses.find(c => c.id === selectedCourseId)?.label}) del próximo ciclo lectivo.
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button className="btn" style={{ flex: 1 }} onClick={() => setShowEndCycleModal(false)}>Cancelar</button>
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
      )}

      {showPreviasModal && selectedRacStudent && (
        <PreviasModal
          student={selectedRacStudent}
          previas={data.previas.filter(p => p.alumno_id === selectedRacStudent.id)}
          subjects={data.allSubjects}
          onSave={savePrevia}
          onDelete={deletePrevia}
          onClose={() => { setShowPreviasModal(false); setSelectedRacStudent(null); }}
        />
      )}

      {tecMode !== 'list' && (
        <Modal title={tecMode === 'create' ? 'Nueva Tecnicatura' : 'Editar Estructura Curricular'} onClose={() => setTecMode('list')}>
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
              <button className="btn" type="button" onClick={() => setTecMode('list')} style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }}>Cancelar</button>
            </div>
          </form>
        </Modal>
      )}

      {editingCourseId && (
        <Modal title="Editar Curso" onClose={() => setEditingCourseId(null)}>
          <form className="stack-form" onSubmit={editCourse}>
            <select className="input-field" value={courseForm.year_id} onChange={(e) => setCourseForm((p) => ({ ...p, year_id: e.target.value }))}>{data.academicYears.map((year) => <option key={year.id} value={year.id}>{year.nombre}</option>)}</select>
            <select className="input-field" value={courseForm.ano} onChange={(e) => setCourseForm((p) => ({ ...p, ano: e.target.value }))}>{yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}</select>
            <select className="input-field" value={courseForm.division} onChange={(e) => setCourseForm((p) => ({ ...p, division: e.target.value }))}>{divisionOptions.map((division) => <option key={division} value={division}>{division}</option>)}</select>
            <select className="input-field" value={courseForm.turno} onChange={(e) => setCourseForm((p) => ({ ...p, turno: e.target.value }))}>{shiftOptions.map((shift) => <option key={shift} value={shift}>{shift}</option>)}</select>
            <select className="input-field" value={courseForm.tecnicatura_id} onChange={(e) => setCourseForm((p) => ({ ...p, tecnicatura_id: e.target.value }))}>
              {data.tecnicaturas.map((tec) => <option key={tec.id} value={tec.id}>{tec.nombre}{tec.detalle ? ` (${tec.detalle})` : ''}</option>)}
            </select>
            {data.tecnicaturas.find(t => String(t.id) === String(courseForm.tecnicatura_id))?.detalle && (
              <p className="helper-text" style={{ fontStyle: 'italic', marginBottom: '0.5rem' }}>
                Identificador: {data.tecnicaturas.find(t => String(t.id) === String(courseForm.tecnicatura_id)).detalle}
              </p>
            )}
            <button className="btn btn-primary" type="submit"><Save size={16} /> Guardar Cambios</button>
          </form>
        </Modal>
      )}

      {transferringAlumno && (
        <Modal title={`Transferir Alumno: ${transferringAlumno.apellido}`} onClose={() => setTransferringAlumno(null)}>
          <p className="helper-text">Selecciona el curso destino para el alumno. Se eliminarán sus notas actuales en este año lectivo.</p>
          <div className="stack-form">
            <select id="transfer-select" className="input-field">
              <option value="">-- Seleccionar Curso --</option>
              {data.allCourses.filter(c => c.id !== transferringAlumno.course_id).map(c => <option key={c.id} value={c.id}>{c.year_nombre} · {c.label} · {c.tecnicatura_nombre}</option>)}
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
      )}

      {editingStudent && (
        <Modal title="Editar Alumno" onClose={() => { setEditingStudent(null); setDniError(''); }}>
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
      )}

      {pasingStudent && (
        <Modal title={`Dar de Pase: ${pasingStudent.apellido}`} onClose={() => setPasingStudent(null)}>
          <p className="helper-text">Registrar la salida del alumno de la institución. Quedará guardado en el historial de Pases.</p>
          <form className="stack-form" onSubmit={execPase}>
            <input className="input-field" placeholder="Institución Destino" value={paseForm.institucion} onChange={(e) => setPaseForm(p => ({ ...p, institucion: e.target.value }))} required />
            <input className="input-field" placeholder="Fecha (dd/mm/aaaa)" value={paseForm.fecha} onChange={(e) => setPaseForm(p => ({ ...p, fecha: e.target.value }))} required />
            <textarea className="input-field" placeholder="Motivo del pase (Opcional)" value={paseForm.motivo} onChange={(e) => setPaseForm(p => ({ ...p, motivo: e.target.value }))} rows="3" />
            <button className="btn btn-primary" type="submit" style={{ background: 'var(--success)' }}><GraduationCap size={16} /> Confirmar Pase</button>
          </form>
        </Modal>
      )}

      {editingPase && (
        <Modal title="Editar Registro de Pase" onClose={() => setEditingPase(null)}>
          <form className="stack-form" onSubmit={savePaseEdit}>
            <p className="helper-text">{editingPase.nombre_apellido} ({formatDNI(editingPase.dni)})</p>
            <label className="label">Curso Origen:</label>
            <select className="input-field" value={editingPase.course_id_origen} onChange={(e) => setEditingPase(p => ({ ...p, course_id_origen: Number(e.target.value) }))}>
              {data.allCourses.map(c => <option key={c.id} value={c.id}>{c.year_nombre} · {c.label} · {c.tecnicatura_nombre}</option>)}
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
      )}

      {editingObsStudent && (
        <Modal title={`Observaciones: ${editingObsStudent.apellido}`} onClose={() => setEditingObsStudent(null)}>
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
      )}

      {viewingProf && (
        <Modal title={`Asignaciones: ${viewingProf.nombre}`} onClose={() => setViewingProf(null)}>
          <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '12px' }}>
            {(() => {
              const pairs = (viewingProf.professor_subject_ids || '').split(',').filter(Boolean);
              if (pairs.length === 0) return <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: '2rem 0' }}>Este profesor no tiene materias asignadas.</p>;

              return pairs.map(pair => {
                const [cid, sid] = pair.split('-');
                const course = data.allCourses.find(c => String(c.id) === String(cid));
                const subject = data.allSubjects.find(s => String(s.id) === String(sid));

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
            <button className="btn" onClick={() => setViewingProf(null)} style={{ background: 'rgba(255,255,255,0.1)' }}>Cerrar</button>
          </div>
        </Modal>
      )}

      {editingUserId && (
        <Modal title={editingUserId === 'new' ? 'Crear Usuario' : 'Editar Usuario'} onClose={() => { setEditingUserId(null); setUserForm(emptyUser); }}>
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
                    {data.allCourses.map(c => <option key={c.id} value={c.id}>{c.year_nombre} · {c.label} · {simplifyTecName(c.tecnicatura_nombre)}</option>)}
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
                  options={data.allCourses.flatMap(c =>
                    data.allSubjects.filter(s => s.tecnicatura_id === c.tecnicatura_id).map(s => ({
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
      )}

      {viewingFichaStudent && (
        <StudentFichaModal 
          student={viewingFichaStudent}
          onClose={() => { setViewingFichaStudent(null); setIsEditingFicha(false); }}
          onSave={handleSaveFicha}
          isEditing={isEditingFicha}
          setIsEditing={setIsEditingFicha}
          studentForm={studentForm}
          setStudentForm={setStudentForm}
          getHistorial={getHistorial}
        />
      )}
    </>
  );
};

export default PreceptorModals;
