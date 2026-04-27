import React from 'react';
import { ArrowRightLeft, GraduationCap, GripVertical, Plus, Save, Trash2, AlertTriangle } from 'lucide-react';
import {
  divisionOptions,
  emptyUser,
  findDuplicateSubjectNames,
  formatDNI,
  normalizeCurricularName,
  shiftOptions,
  simplifyTecName,
  yearOptions
} from '../functions/PreceptorHelpers';
import MultiSelect from '../UI/MultiSelect';
import Modal from '../UI/Modal';
import PreviasModal from './PreviasModal';
import StudentFichaModal from './StudentFichaModal';

export default function PreceptorModals(props) {
  const {
    data,
    selectedStudentIds,
    selectedRacStudent,
    showNomenclaturaModal,
    setShowNomenclaturaModal,
    showEndCycleModal,
    setShowEndCycleModal,
    endCycleForm,
    setEndCycleForm,
    handleEndCycleConfirm,
    showPreviasModal,
    setShowPreviasModal,
    savePrevia,
    deletePrevia,
    tecMode,
    setTecMode,
    tecForm,
    setTecForm,
    addTec,
    editTec,
    draggedMateriaIndex,
    handleDragStart,
    handleDragEnter,
    handleDragEnd,
    editingCourseId,
    setEditingCourseId,
    courseForm,
    setCourseForm,
    editCourse,
    transferringAlumno,
    setTransferringAlumno,
    transferMotivo,
    setTransferMotivo,
    execTransfer,
    editingStudent,
    setEditingStudent,
    dniError,
    setDniError,
    editStudent,
    pasingStudent,
    setPasingStudent,
    paseForm,
    setPaseForm,
    execPase,
    editingPase,
    setEditingPase,
    savePaseEdit,
    editingObsStudent,
    setEditingObsStudent,
    saveObs,
    viewingProf,
    setViewingProf,
    editingUserId,
    setEditingUserId,
    userForm,
    setUserForm,
    createUser,
    editUser,
    truncateSubject,
    viewingFichaStudent,
    setViewingFichaStudent,
    setIsEditingFicha,
    isEditingFicha,
    studentForm,
    setStudentForm,
    handleSaveFicha,
    getHistorial
  } = props;

  const duplicateSubjectNames = tecMode !== 'list' ? findDuplicateSubjectNames(tecForm.materias) : [];
  const duplicateSubjectKeys = new Set(duplicateSubjectNames.map((name) => normalizeCurricularName(name)));

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
          </div>
        </Modal>
      )}

      {showEndCycleModal && (
        <Modal onClose={() => setShowEndCycleModal(false)}>
          <div className="ficha-alumno">
            <div className="section-title"><AlertTriangle size={24} color="#e74c3c" /><h2>Terminación de Ciclo Lectivo</h2></div>
            <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
              Estás por procesar a <strong>{selectedStudentIds.length}</strong> alumnos seleccionados.
            </p>
            <div className="stack-form">
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={endCycleForm.isRepeater}
                  onChange={(e) => setEndCycleForm((prev) => ({ ...prev, isRepeater: e.target.checked }))}
                  style={{ width: '20px', height: '20px' }}
                />
                <span style={{ fontWeight: 'bold' }}>¿Son alumnos REPITENTES?</span>
              </label>

              {!endCycleForm.isRepeater ? (
                <div style={{ marginTop: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', opacity: 0.7 }}>Curso Destino</label>
                  <select className="input-field" value={endCycleForm.targetCourseId || ''} onChange={(e) => setEndCycleForm((prev) => ({ ...prev, targetCourseId: e.target.value }))}>
                    <option value="">-- Seleccionar curso destino --</option>
                    {(data.allCourses ?? []).map((course) => (
                      <option key={course.id} value={course.id}>{course.year_nombre} · {course.label} · {course.tecnicatura_nombre}</option>
                    ))}
                  </select>
                </div>
              ) : null}

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button className="btn" style={{ flex: 1 }} onClick={() => setShowEndCycleModal(false)}>Cancelar</button>
                <button className="btn btn-primary" style={{ flex: 1 }} disabled={!endCycleForm.isRepeater && !endCycleForm.targetCourseId} onClick={handleEndCycleConfirm}>
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
          previas={data.previas.filter((previa) => previa.alumno_id === selectedRacStudent.id)}
          subjects={data.allSubjects}
          onSave={savePrevia}
          onDelete={deletePrevia}
          onClose={() => {
            setShowPreviasModal(false);
          }}
        />
      )}

      {tecMode !== 'list' && (
        <Modal title={tecMode === 'create' ? 'Nueva Tecnicatura' : 'Editar Estructura Curricular'} onClose={() => setTecMode('list')}>
          <form className="stack-form" onSubmit={tecMode === 'create' ? addTec : editTec}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input className="input-field" style={{ flex: 2 }} placeholder="Nombre de la Carrera" value={tecForm.nombre} onChange={(e) => setTecForm((prev) => ({ ...prev, nombre: e.target.value }))} required />
              <input className="input-field" placeholder="Identificador / Detalle" value={tecForm.detalle} onChange={(e) => setTecForm((prev) => ({ ...prev, detalle: e.target.value }))} />
            </div>
            <div style={{ marginTop: '1rem', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--primary)' }}>Estructura Curricular</div>
            <div className="subject-editor">
              {tecForm.materias.map((materia, index) => (
                <div
                  key={materia.id}
                  className={`subject-row ${draggedMateriaIndex === index ? 'dragging' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className="drag-handle"><GripVertical size={16} /></div>
                  <input
                    className="input-field"
                    style={duplicateSubjectKeys.has(normalizeCurricularName(materia.nombre)) ? { borderColor: 'rgba(255, 102, 102, 0.75)', boxShadow: '0 0 0 1px rgba(255, 102, 102, 0.25)' } : undefined}
                    placeholder="Nombre de la Materia"
                    value={materia.nombre}
                    onChange={(e) => setTecForm((prev) => ({ ...prev, materias: prev.materias.map((item, idx) => idx === index ? { ...item, nombre: e.target.value } : item) }))}
                  />
                  <select className="input-field" style={{ width: '160px' }} value={materia.tipo} onChange={(e) => setTecForm((prev) => ({ ...prev, materias: prev.materias.map((item, idx) => idx === index ? { ...item, tipo: e.target.value } : item) }))}>
                    <option value="comun">Materias Comunes</option>
                    <option value="modular">Modular (Teoría/Prác.)</option>
                    <option value="taller">Taller (Simple)</option>
                    <option value="taller_modular">Taller (Modular)</option>
                  </select>
                  <button className="icon-btn danger" type="button" onClick={() => setTecForm((prev) => ({ ...prev, materias: prev.materias.length === 1 ? [{ id: `draft-${Date.now()}`, nombre: '', tipo: 'comun' }] : prev.materias.filter((_, idx) => idx !== index) }))}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            {duplicateSubjectNames.length > 0 && (
              <div style={{ marginTop: '0.85rem', padding: '0.85rem 1rem', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ffd4d4', fontSize: '0.88rem', lineHeight: '1.45' }}>
                Hay materias duplicadas o casi iguales: <strong>{duplicateSubjectNames.join(', ')}</strong>. CorrÃ­gelas antes de guardar para evitar desincronizaciones.
              </div>
            )}
            <div style={{ marginTop: '0.85rem', padding: '0.85rem 1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.45' }}>
              Los <strong>Taller (Modular)</strong> se usan luego con <strong>2 docentes titulares</strong> y <strong>2 suplentes</strong> en Horarios. Los <strong>Taller (Simple)</strong> y las materias teÃ³ricas usan una sola asignaciÃ³n.
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
              <button className="btn" type="button" onClick={() => setTecForm((prev) => ({ ...prev, materias: [...prev.materias, { id: `draft-${Date.now()}`, nombre: '', tipo: 'comun' }] }))} style={{ flex: 1 }}><Plus size={16} /> Agregar Materia</button>
              <button className="btn btn-primary" type="submit" style={{ flex: 1 }}>{tecMode === 'create' ? 'Guardar Tecnicatura' : 'Guardar Cambios'}</button>
            </div>
          </form>
        </Modal>
      )}

      {editingCourseId && (
        <Modal title="Editar Curso" onClose={() => setEditingCourseId(null)}>
          <form className="stack-form" onSubmit={editCourse}>
            <select className="input-field" value={courseForm.year_id} onChange={(e) => setCourseForm((prev) => ({ ...prev, year_id: e.target.value }))}>{data.academicYears.map((year) => <option key={year.id} value={year.id}>{year.nombre}</option>)}</select>
            <select className="input-field" value={courseForm.ano} onChange={(e) => setCourseForm((prev) => ({ ...prev, ano: e.target.value }))}>{yearOptions.map((year) => <option key={year} value={year}>{year}</option>)}</select>
            <select className="input-field" value={courseForm.division} onChange={(e) => setCourseForm((prev) => ({ ...prev, division: e.target.value }))}>{divisionOptions.map((division) => <option key={division} value={division}>{division}</option>)}</select>
            <select className="input-field" value={courseForm.turno} onChange={(e) => setCourseForm((prev) => ({ ...prev, turno: e.target.value }))}>{shiftOptions.map((turno) => <option key={turno} value={turno}>{turno}</option>)}</select>
            <select className="input-field" value={courseForm.tecnicatura_id} onChange={(e) => setCourseForm((prev) => ({ ...prev, tecnicatura_id: e.target.value }))}>
              {data.tecnicaturas.map((tec) => <option key={tec.id} value={tec.id}>{tec.nombre}{tec.detalle ? ` (${tec.detalle})` : ''}</option>)}
            </select>
            <button className="btn btn-primary" type="submit"><Save size={16} /> Guardar Cambios</button>
          </form>
        </Modal>
      )}

      {transferringAlumno && (
        <Modal title={`Transferir Alumno: ${transferringAlumno.apellido}`} onClose={() => setTransferringAlumno(null)}>
          <div className="stack-form">
            <select id="transfer-select" className="input-field">
              <option value="">-- Seleccionar Curso --</option>
              {data.allCourses.filter((course) => course.id !== transferringAlumno.course_id).map((course) => (
                <option key={course.id} value={course.id}>{course.year_nombre} · {course.label} · {course.tecnicatura_nombre}</option>
              ))}
            </select>
            <textarea className="input-field" placeholder="Motivo de la transferencia (Opcional)" value={transferMotivo} onChange={(e) => setTransferMotivo(e.target.value)} rows="3" />
            <button className="btn btn-primary" onClick={() => execTransfer(transferringAlumno.id, document.getElementById('transfer-select').value)}><ArrowRightLeft size={16} /> Confirmar Transferencia</button>
          </div>
        </Modal>
      )}

      {editingStudent && (
        <Modal title="Editar Alumno" onClose={() => { setEditingStudent(null); setDniError(''); }}>
          <form className="stack-form" onSubmit={editStudent}>
            <input className="input-field" placeholder="Apellido(s)" value={editingStudent.apellido} onChange={(e) => setEditingStudent((prev) => ({ ...prev, apellido: e.target.value }))} />
            <input className="input-field" placeholder="Nombre(s)" value={editingStudent.nombre} onChange={(e) => setEditingStudent((prev) => ({ ...prev, nombre: e.target.value }))} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <input className="input-field" placeholder="DNI (Opcional)" value={editingStudent.dni} onChange={(e) => { const val = e.target.value.replace(/\D/g, '').slice(0, 8); setEditingStudent((prev) => ({ ...prev, dni: val })); setDniError(''); }} />
              <select className="input-field" value={editingStudent.genero} onChange={(e) => setEditingStudent((prev) => ({ ...prev, genero: e.target.value }))}>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
            </div>
            <button className="btn btn-primary" type="submit" disabled={!editingStudent.nombre || !editingStudent.apellido}><Save size={16} /> Guardar Cambios</button>
            {dniError && <div className="error-message" style={{ color: '#ff4d4d', fontSize: '0.85rem', marginTop: '8px', fontWeight: 'bold', textAlign: 'center' }}>{dniError}</div>}
          </form>
        </Modal>
      )}

      {pasingStudent && (
        <Modal title={`Dar de Pase: ${pasingStudent.apellido}`} onClose={() => setPasingStudent(null)}>
          <form className="stack-form" onSubmit={execPase}>
            <input className="input-field" placeholder="Institución Destino" value={paseForm.institucion} onChange={(e) => setPaseForm((prev) => ({ ...prev, institucion: e.target.value }))} required />
            <input className="input-field" placeholder="Fecha (dd/mm/aaaa)" value={paseForm.fecha} onChange={(e) => setPaseForm((prev) => ({ ...prev, fecha: e.target.value }))} required />
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={paseForm.noAsiste || false}
                onChange={(e) => setPaseForm((prev) => ({ ...prev, noAsiste: e.target.checked }))}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '0.9rem' }}>El alumno <strong>NO registra asistencia</strong> (Nunca asistió)</span>
            </label>
            <textarea className="input-field" placeholder="Motivo del pase (Opcional)" value={paseForm.motivo} onChange={(e) => setPaseForm((prev) => ({ ...prev, motivo: e.target.value }))} rows="3" />
            <button className="btn btn-primary" type="submit" style={{ background: 'var(--success)' }}><GraduationCap size={16} /> Confirmar Pase</button>
          </form>
        </Modal>
      )}

      {editingPase && (
        <Modal title="Editar Registro de Pase" onClose={() => setEditingPase(null)}>
          <form className="stack-form" onSubmit={savePaseEdit}>
            <p className="helper-text">{editingPase.nombre_apellido} ({formatDNI(editingPase.dni)})</p>
            <select className="input-field" value={editingPase.course_id_origen} onChange={(e) => setEditingPase((prev) => ({ ...prev, course_id_origen: Number(e.target.value) }))}>
              {data.allCourses.map((course) => <option key={course.id} value={course.id}>{course.year_nombre} · {course.label} · {course.tecnicatura_nombre}</option>)}
            </select>
            <input className="input-field" value={editingPase.institucion_destino} onChange={(e) => setEditingPase((prev) => ({ ...prev, institucion_destino: e.target.value }))} required />
            <input className="input-field" value={editingPase.fecha_pase} onChange={(e) => setEditingPase((prev) => ({ ...prev, fecha_pase: e.target.value }))} required />
            <textarea className="input-field" value={editingPase.motivo === '...' ? '' : editingPase.motivo} onChange={(e) => setEditingPase((prev) => ({ ...prev, motivo: e.target.value }))} placeholder="..." rows="3" />
            <select className="input-field" value={editingPase.estado || 'De pase'} onChange={(e) => setEditingPase((prev) => ({ ...prev, estado: e.target.value }))}>
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
            <textarea className="input-field" placeholder="Escribe aquí las observaciones pedagógicas..." value={editingObsStudent.observaciones || ''} onChange={(e) => setEditingObsStudent((prev) => ({ ...prev, observaciones: e.target.value }))} rows="8" style={{ resize: 'vertical', minHeight: '150px' }} />
            <button className="btn btn-primary" type="submit"><Save size={16} /> Guardar Observaciones</button>
          </form>
        </Modal>
      )}


      {editingUserId && (
        <Modal title={editingUserId === 'new' ? 'Crear Usuario' : 'Editar Usuario'} onClose={() => { setEditingUserId(null); setUserForm(emptyUser); }}>
          <form onSubmit={editingUserId === 'new' ? createUser : editUser} className="stack-form" style={{ maxHeight: '80vh', overflowY: 'auto', paddingRight: '10px' }}>
            <input className="input-field" placeholder="Nombre completo" value={userForm.nombre} onChange={(e) => setUserForm((prev) => ({ ...prev, nombre: e.target.value }))} required />
            <div className="grid-2">
              <input className="input-field" placeholder="Usuario" value={userForm.username} onChange={(e) => setUserForm((prev) => ({ ...prev, username: e.target.value }))} required />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <input 
                  className="input-field" 
                  placeholder={editingUserId === 'new' ? "Contraseña" : "Nueva contraseña (opcional)"} 
                  value={userForm.password} 
                  onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))} 
                  required={editingUserId === 'new'} 
                />
                {editingUserId !== 'new' && <span style={{ fontSize: '0.65rem', opacity: 0.5, marginLeft: '4px' }}>Vacío para mantener actual</span>}
              </div>
            </div>
            <select className="input-field" value={userForm.rol} onChange={(e) => setUserForm((prev) => ({ ...prev, rol: e.target.value }))}>
              <option value="admin">Administrador</option>
              <option value="secretaria_de_alumnos">Secretaria de Alumnos</option>
              <option value="jefe_de_auxiliares">Jefe de Auxiliares</option>
              <option value="director">Director</option>
              <option value="vicedirector">Vicedirector</option>
              <option value="regente_profesores">Regente de Profesores</option>
              <option value="preceptor">Preceptor</option>
              <option value="preceptor_taller">Preceptor Taller</option>
              <option value="preceptor_ef">Preceptor Ed. Física</option>
              <option value="profesor">Profesor</option>
            </select>

            {!['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector', 'regente_profesores'].includes(userForm.rol) && (userForm.rol === 'preceptor' || userForm.rol === 'preceptor_taller' || userForm.rol === 'preceptor_ef') && (
              <select className="input-field" value={userForm.preceptor_course_id || ''} onChange={(e) => setUserForm((prev) => ({ ...prev, preceptor_course_id: e.target.value }))}>
                <option value="">-- Seleccionar Curso --</option>
                {data.allCourses.map((course) => <option key={course.id} value={course.id}>{course.year_nombre} · {course.label} · {simplifyTecName(course.tecnicatura_nombre)}</option>)}
              </select>
            )}

            {/* Read-only view of subjects assigned via Schedules (Hidden for high-level roles) */}
            {!['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector', 'regente_profesores'].includes(userForm.rol) && (userForm.rol === 'profesor' || userForm.is_professor_hybrid || (userForm.professor_subject_ids && userForm.professor_subject_ids.length > 0)) && editingUserId !== 'new' && (
              <div className="read-only-assignments" style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '10px', opacity: 0.7, fontWeight: 'bold', color: 'var(--primary)' }}>Materias Asignadas (vía Horarios):</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(() => {
                    const pairs = Array.isArray(userForm.professor_subject_ids) 
                      ? userForm.professor_subject_ids 
                      : (userForm.professor_subject_ids || '').split(',').filter(Boolean);
                    
                    if (pairs.length === 0) return <p style={{ fontSize: '0.85rem', opacity: 0.5, fontStyle: 'italic' }}>Sin materias asignadas en horarios.</p>;

                    return pairs.map((pair) => {
                      const [cid, sid] = pair.split('-');
                      const course = data.allCourses.find((item) => String(item.id) === String(cid));
                      const subject = data.allSubjects.find((item) => String(item.id) === String(sid));
                      return (
                        <div key={pair} style={{ fontSize: '0.82rem', padding: '6px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', borderLeft: '3px solid var(--primary)' }}>
                          <strong>{subject?.nombre || 'Materia no encontrada'}</strong>
                          <div style={{ opacity: 0.6, fontSize: '0.75rem' }}>{course?.label} ({course?.year_nombre})</div>
                        </div>
                      );
                    });
                  })()}
                </div>
                <p style={{ fontSize: '0.7rem', marginTop: '12px', opacity: 0.4, fontStyle: 'italic', lineHeight: '1.3' }}>
                  * Los accesos se gestionan exclusivamente desde la sección de Horarios de cada curso.
                </p>
              </div>
            )}

            <button className="btn btn-primary" type="submit"><Save size={16} /> {editingUserId === 'new' ? 'Crear Usuario' : 'Guardar Cambios'}</button>
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
}
