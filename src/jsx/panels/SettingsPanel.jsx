import React from 'react';
import { Users, Settings, Plus, Eye, Wrench, Trash2, Smartphone, Unlock, Lock, Copy, BookOpen, Check, ArrowUpCircle, AlertTriangle, ListChecks } from 'lucide-react';
import Modal from '../UI/Modal';

const SettingsPanel = ({
  user, data, isMobile,
  setEditingUserId,
  setUserForm, emptyUser,
  yearForm, setYearForm,
  activeTecId, setActiveTecId,
  startEditUser, deleteUser, setViewingProf,
  handleUpdateSystemMode, handleUpdatePeriods,
  handleUpdatePreceptorMode,
  addYear, editYear,
  startCreateTec, startEditTec, duplicateTec, removeTec,
  prepareEditCourse, toggleCourseActive,
  handleUpdateMobileLogin,
  handleUpdateRACModular,
  handleUpdateEndCycleButton,
  handleUpdatePasswordMsg,
  setYearAsCurrent, copyYearInfo,
  setUserError,
  academicYearSummary, setAcademicYearSummary,
  populateYearCourses, handleUpdateTabVisibility
}) => {
  const [userSearch, setUserSearch] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [showTabsModal, setShowTabsModal] = React.useState(false);
  const usersPerPage = 10;

  const currentVisibility = data?.config?.tab_visibility || {};

  const tabsToManage = [
    { id: 'asistencia', label: 'Asistencia' },
    { id: 'grades', label: 'Notas' },
    { id: 'materias', label: 'Materias' },
    { id: 'students', label: 'Alumnos' },
    { id: 'pases', label: 'Pases' },
    { id: 'rac', label: 'RAC' },
    { id: 'historial', label: 'Historial' },
    { id: 'egresados', label: 'Egresados' },
    { id: 'anuncios', label: 'Anuncios' },
    { id: 'horarios', label: 'Horarios' },
    { id: 'planillas', label: 'Planillas' },
  ];
  return (
    <section className="page-section management-grid">
      {showTabsModal && (
        <Modal title="Modificaciones de Pestañas" onClose={() => setShowTabsModal(false)}>
          <p style={{ fontSize: '0.85rem', opacity: 0.7, marginBottom: '1.5rem' }}>Oculta módulos del menú principal para todos los usuarios.</p>
          <div className="stack-form" style={{ gap: '12px' }}>
            {tabsToManage.map(tab => {
              const isVisible = currentVisibility[tab.id] !== false; // Default true
              return (
                <div key={tab.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>{tab.label}</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className={`btn ${!isVisible ? 'btn-danger' : ''}`} 
                      style={{ fontSize: '0.7rem', padding: '4px 10px', background: !isVisible ? '#ef4444' : 'rgba(255,255,255,0.1)' }}
                      onClick={() => handleUpdateTabVisibility({ ...currentVisibility, [tab.id]: false })}
                    >
                      OCULTO
                    </button>
                    <button 
                      className={`btn ${isVisible ? 'btn-primary' : ''}`} 
                      style={{ fontSize: '0.7rem', padding: '4px 10px', background: isVisible ? 'var(--primary)' : 'rgba(255,255,255,0.1)' }}
                      onClick={() => handleUpdateTabVisibility({ ...currentVisibility, [tab.id]: true })}
                    >
                      VISIBLE
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={() => setShowTabsModal(false)}>Cerrar</button>
        </Modal>
      )}
      <section className="management-card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="section-title"><Users size={16} /><h2>Gestión de Usuarios</h2></div>
        <div className="section-toolbar-left" style={{ marginBottom: '1.2rem' }}>
          <button className="btn btn-primary" type="button" onClick={() => { setUserError(''); setEditingUserId('new'); setUserForm({ ...emptyUser, rol: 'profesor' }); }}>
            <Plus size={16} /> Nuevo Usuario
          </button>
          {(() => {
            const selectedYear = data.academicYears.find(y => y.id === data.selectedYearId);
            const prevYearName = selectedYear ? String(Number(selectedYear.nombre) - 1) : null;
            const prevYear = prevYearName ? data.academicYears.find(y => y.nombre === prevYearName) : null;
            if (!prevYear || !selectedYear || selectedYear.nombre === '2026') return null;
            return (
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => {
                  if (window.confirm(`¿Sincronizar TODOS los roles y accesos de los usuarios desde ${prevYear.nombre} → ${selectedYear.nombre}?`)) {
                    copyYearInfo(prevYear.id, selectedYear.id);
                  }
                }}
                title={`Copiar roles desde ${prevYear.nombre} a ${selectedYear.nombre}`}
              >
                <ArrowUpCircle size={16} /> Sincronización Masiva ({prevYear.nombre} → {selectedYear.nombre})
              </button>
            );
          })()}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Buscar por nombre, usuario, rol, curso o materia..." 
            value={userSearch}
            onChange={(e) => { setUserSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="student-list" style={{ flex: 1, maxHeight: '450px', overflowY: 'auto' }}>
          {(() => {
            const filtered = data.users.filter(u => {
              const lowerSearch = userSearch.toLowerCase();
              
              // 1. Nombre y Usuario
              if (u.nombre.toLowerCase().includes(lowerSearch) || u.username.toLowerCase().includes(lowerSearch)) return true;
              
              // 2. Rol
              if (u.rol.toLowerCase().replace(/_/g, ' ').includes(lowerSearch)) return true;
              
              // 3. Curso (Preceptores)
              if (u.preceptor_course_id) {
                const course = data.allCourses.find(c => c.id === Number(u.preceptor_course_id));
                if (course && course.label.toLowerCase().includes(lowerSearch)) return true;
              }
              
              // 4. Materias (Profesores)
              if (u.professor_subject_ids) {
                const pairs = (u.professor_subject_ids || '').split(',').filter(Boolean);
                const hasMatch = pairs.some(pair => {
                  const [, sid] = pair.split('-');
                  const subject = data.allSubjects.find(s => String(s.id) === String(sid));
                  return subject && subject.nombre.toLowerCase().includes(lowerSearch);
                });
                if (hasMatch) return true;
              }
              
              return false;
            });
            const totalPages = Math.ceil(filtered.length / usersPerPage);
            const paged = filtered.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage);

            return (
              <>
                {paged.map((u) => (
                  <div key={u.id} className="student-item">
                    <div>
                      <strong>{u.nombre}</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                        <span className={`badge badge-${u.rol}`}>{u.rol.replace(/_/g, ' ')}</span>
                        <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                          · {u.username}
                        </span>
                        {(u.rol === 'preceptor' || u.rol === 'preceptor_taller' || u.rol === 'preceptor_ef') && u.preceptor_course_id && (() => {
                          const course = data.allCourses.find(c => c.id === Number(u.preceptor_course_id));
                          if (!course) return null;
                          return (
                            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                              · {course.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="student-item-actions">
                      {(() => {
                        const selectedYear = data.academicYears.find(y => y.id === data.selectedYearId);
                        const prevYearName = selectedYear ? String(Number(selectedYear.nombre) - 1) : null;
                        const prevYear = prevYearName ? data.academicYears.find(y => y.nombre === prevYearName) : null;
                        if (!prevYear || !selectedYear || selectedYear.nombre === '2026') return null;
                        return (
                          <button
                            className="icon-btn"
                            style={{ color: '#2ecc71', background: 'rgba(46,204,113,0.1)' }}
                            onClick={() => {
                              if (window.confirm(`¿Copiar asignaciones de ${u.nombre} desde ${prevYear.nombre} → ${selectedYear.nombre}?`)) {
                                copyYearInfo(prevYear.id, selectedYear.id, u.id);
                              }
                            }}
                            title={`Copiar roles desde ${prevYear.nombre} a ${selectedYear.nombre}`}
                          >
                            <Copy size={14} />
                          </button>
                        );
                      })()}
                      <button className="icon-btn" onClick={() => startEditUser(u)}><Wrench size={14} /></button>
                      {(user.rol === 'admin' || user.rol === 'secretaria_de_alumnos' || user.rol === 'jefe_de_auxiliares') && (
                        <button className="icon-btn danger" onClick={() => deleteUser(u)} disabled={u.id === user.id}><Trash2 size={14} /></button>
                      )}
                    </div>
                  </div>
                ))}

                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '1rem', padding: '10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button className="btn btn-primary" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ padding: '4px 12px', fontSize: '0.8rem' }}>Anterior</button>
                    <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Página {currentPage} de {totalPages}</span>
                    <button className="btn btn-primary" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ padding: '4px 12px', fontSize: '0.8rem' }}>Siguiente</button>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      </section>

      <section className="management-card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="section-title"><Settings size={16} /><h2>Sistema, Períodos y Años</h2></div>

        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.2rem' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>Modo de Visualización:</label>
          <div style={{ display: 'flex', gap: '5px', marginTop: '8px', flexWrap: 'wrap' }}>
            {['completo', 'orientadores', 'trimestrales', 'finales', 'manual'].map(m => (
              <button
                key={m}
                className={`btn ${data.config?.period_view_mode === m ? 'btn-primary' : ''}`}
                onClick={() => handleUpdateSystemMode(m)}
                style={{ flex: '1 1 30%', fontSize: '0.65rem', padding: '6px' }}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>

          <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ fontSize: '0.75rem', marginBottom: '8px' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>COMPLETO:</span> Acceso total a todos los períodos del año lectivo (Normal).
            </p>
            <p style={{ fontSize: '0.75rem', marginBottom: '8px' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>ORIENTADORES:</span> Limita la carga y vista solo a Informes Orientadores (1, 3, 5).
            </p>
            <p style={{ fontSize: '0.75rem', marginBottom: '8px' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>TRIMESTRALES:</span> Enfoca la vista en las Notas Trimestrales (2, 4, 6).
            </p>
            <p style={{ fontSize: '0.75rem', marginBottom: '8px' }}>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>FINALES:</span> Restringe la vista a Compensatorios y Notas Definitivas (7, 8, 9, 10).
            </p>
          </div>

          {data.config?.period_view_mode === 'manual' && (
            <div style={{ marginTop: '1rem', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '8px' }}>Períodos Manuales:</p>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '6px' }}>
                {data.periodos.map(p => (
                  <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem' }}>
                    <input type="checkbox" checked={p.activo === 1} onChange={(e) => handleUpdatePeriods(data.periodos.map(per => per.id === p.id ? { ...per, activo: e.target.checked ? 1 : 0 } : per))} />
                    {p.nombre}
                  </label>
                ))}
              </div>
            </div>
          )}


        </div>

        <div style={{ flex: 1 }}>
          <div className="section-title" style={{ marginTop: '0.5rem' }}><Plus size={14} /><h3>Años Lectivos</h3></div>
          <form className="stack-form" style={{ marginBottom: '1rem' }} onSubmit={addYear}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input className="input-field" style={{ flex: 1 }} placeholder="ej: 2027" value={yearForm.nombre} onChange={(e) => setYearForm({ nombre: e.target.value.replace(/\D/g, '').slice(0, 4) })} />
              <button className="btn btn-primary" type="submit"><Plus size={14} /></button>
            </div>
          </form>
          <div className="student-list" style={{ maxHeight: '200px' }}>
            {data.academicYears.map((year) => (
              <div key={year.id} className="student-item" style={{ padding: '8px 12px' }}>
                <div>
                  <strong style={{ fontSize: '0.9rem' }}>{year.nombre}</strong>
                  <p style={{ fontSize: '0.75rem' }}>Alumnos: {year.student_count || 0}</p>
                </div>
                <div className="student-item-actions">
                  {(user.rol === 'admin' || user.rol === 'secretaria_de_alumnos' || user.rol === 'jefe_de_auxiliares') && (
                    <>
                      <button
                        className={`icon-btn ${year.es_actual ? 'active' : ''}`}
                        style={{ width: '28px', height: '28px', color: year.es_actual ? '#2ecc71' : 'rgba(255,255,255,0.3)' }}
                        onClick={() => setYearAsCurrent(year.id)}
                        title={year.es_actual ? "Año Actual (Activo)" : "Marcar como Año Actual"}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        className="icon-btn"
                        style={{ width: '28px', height: '28px', color: '#f39c12' }}
                        type="button"
                        onClick={() => getYearSummary(year.id)}
                        title="Ver Detalles"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="icon-btn"
                        style={{ width: '28px', height: '28px', color: '#3498db' }}
                        type="button"
                        onClick={() => {
                          const newName = window.prompt(`Editar nombre para el año ${year.nombre}:`, year.nombre);
                          if (newName && newName.trim() && newName !== year.nombre) {
                            editYear(year.id, newName.trim());
                          }
                        }}
                        title="Editar"
                      >
                        <Wrench size={12} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          {(data.allCourses || []).length === 0 && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(241, 196, 15, 0.08)', border: '1px solid rgba(241, 196, 15, 0.25)', borderRadius: '10px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: '#f1c40f', marginBottom: '10px', fontWeight: 'bold' }}>⚠️ Este año no tiene cursos asignados.</p>
              <button
                className="btn btn-primary"
                style={{ fontSize: '0.8rem', padding: '8px 20px' }}
                onClick={() => {
                  const selectedYear = data.academicYears.find(y => (data.allCourses || []).length === 0 && y.id);
                  const currentYearId = data.selectedYearId;
                  if (currentYearId && window.confirm('¿Heredar todos los cursos desde el año activo actual? Los profesores quedarán vacíos.')) {
                    populateYearCourses(currentYearId);
                  }
                }}
              >
                📋 Heredar Cursos del Año Activo
              </button>
            </div>
          )}
        </div>
      </section>


      <section className="management-card" style={{ gridColumn: isMobile ? 'auto' : 'span 2' }}>
        <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen size={16} />
            <h2>Gestión Académica</h2>
          </div>
          <button className="btn btn-primary" onClick={startCreateTec}><Plus size={14} /> Nueva Tecnicatura</button>
        </div>

        <div style={{ marginTop: '1.2rem', marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '6px', display: 'block' }}>Seleccionar Carrera / Tecnicatura para gestionar:</label>
          <select
            className="input-field"
            style={{ width: '100%', fontSize: '1rem', height: '45px' }}
            value={activeTecId}
            onChange={(e) => setActiveTecId(e.target.value)}
          >
            <option value="">-- Elegir una opción --</option>
            {data.tecnicaturas.map(t => (
              <option key={t.id} value={t.id}>{t.nombre} {t.detalle ? `(${t.detalle})` : ''}</option>
            ))}
          </select>
        </div>

        <div className="tecnicatura-focused-view">
          {(() => {
            const tec = data.tecnicaturas.find(t => String(t.id) === String(activeTecId));
            if (!tec) return (
              <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <BookOpen size={32} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p style={{ opacity: 0.5 }}>Selecciona una tecnicatura arriba para gestionar sus materias y cursos.</p>
              </div>
            );

            const tecCursos = (data.allCourses ?? []).filter(c => c.tecnicatura_id === tec.id);
            return (
              <div key={tec.id} className="tec-unified-item" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--primary)' }}>{tec.nombre}</h3>
                    {tec.detalle && <p style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: '4px', fontWeight: 'bold' }}>DETALLE: {tec.detalle}</p>}
                  </div>
                  <div className="student-item-actions">
                    <button className="btn" style={{ background: 'var(--primary)', color: 'white' }} onClick={() => startEditTec(tec.id)}>
                      <Wrench size={14} /> Gestionar Materias
                    </button>
                    <button className="icon-btn" onClick={() => duplicateTec(tec.id)} title="Duplicar"><Copy size={14} /></button>
                    {(user.rol === 'admin' || user.rol === 'secretaria_de_alumnos' || user.rol === 'jefe_de_auxiliares') && (
                      <button className="icon-btn danger" onClick={() => removeTec(tec)} title="Eliminar"><Trash2 size={14} /></button>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 'bold', opacity: 0.7 }}>Cursos vinculados a esta carrera:</div>
                <div className="course-grid-focused" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                  {tecCursos.length === 0 ? (
                    <p style={{ fontSize: '0.85rem', opacity: 0.4, fontStyle: 'italic', gridColumn: '1 / -1' }}>No hay cursos activos para esta carrera.</p>
                  ) : (
                    tecCursos.map((course) => (
                      <div key={course.id} style={{ background: 'rgba(255,255,255,0.04)', padding: '15px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div>
                          <strong style={{ fontSize: '1rem' }}>{course.label}</strong>
                          <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '4px' }}>
                            {course.student_count || 0} alumnos · {course.year_nombre}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="icon-btn" style={{ width: '32px', height: '32px' }} onClick={() => prepareEditCourse(course)} title="Configurar Curso">
                            <Settings size={14} />
                          </button>
                          <button
                            className="icon-btn"
                            style={{
                              width: '32px', height: '32px',
                              background: course.activo ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                              color: course.activo ? '#10b981' : '#ef4444'
                            }}
                            onClick={() => toggleCourseActive(course)}
                            title={course.activo ? "Deshabilitar" : "Habilitar"}
                          >
                            {course.activo ? <Unlock size={14} /> : <Lock size={14} />}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      <section className="management-card" style={{ gridColumn: isMobile ? 'auto' : 'span 2' }}>
        <div className="section-title">
          <Smartphone size={16} />
          <h2>Otras Opciones</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem', marginTop: '1.2rem' }}>
          {/* Configuración de Preceptores */}
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={16} /> Configuración de Edicion de Preceptores
            </h3>

            <div className="stack-form" style={{ gap: '15px' }}>
              {[
                { id: 'preceptor', label: 'Preceptores de Teoria' },
                { id: 'preceptor_taller', label: 'Preceptores de Taller' },
                { id: 'preceptor_ef', label: 'Preceptores de Educación Física' }
              ].map(pRole => (
                <div key={pRole.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>{pRole.label}:</span>
                  <select
                    className="input-field"
                    style={{ width: '160px', padding: '5px 10px', fontSize: '0.8rem', height: 'auto' }}
                    value={data.config[`${pRole.id}_mode`] || 'view'}
                    onChange={(e) => handleUpdatePreceptorMode(pRole.id, e.target.value)}
                  >
                    <option value="view">Modo Visualización</option>
                    <option value="edit">Modo Edición</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Seguridad / Dispositivos */}
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Smartphone size={16} /> Acceso Móvil
                </h3>
                <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>Habilitar/Deshabilitar acceso desde celulares.</p>
              </div>
              <button
                className={`btn ${data.config.mobile_login_enabled === 'true' ? 'btn-primary' : ''}`}
                style={{
                  background: data.config.mobile_login_enabled === 'true' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                  minWidth: '120px', padding: '8px'
                }}
                onClick={() => handleUpdateMobileLogin(data.config.mobile_login_enabled === 'true' ? 'false' : 'true')}
              >
                {data.config.mobile_login_enabled === 'true' ? 'Habilitado' : 'Deshabilitado'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={16} /> RAC Modular
                </h3>
                <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>T / P / Pond en materias de taller.</p>
              </div>
              <button
                className={`btn ${data.config.rac_modular_enabled === 'true' ? 'btn-primary' : ''}`}
                style={{
                  background: data.config.rac_modular_enabled === 'true' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                  minWidth: '120px', padding: '8px'
                }}
                onClick={() => handleUpdateRACModular(data.config.rac_modular_enabled === 'true' ? 'false' : 'true')}
              >
                {data.config.rac_modular_enabled === 'true' ? 'Activado' : 'Desactivado'}
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={16} /> Botón de Fin de Ciclo
                </h3>
                <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>Habilitar/Deshabilitar botón de Terminación de Ciclo en RAC.</p>
              </div>
              <button
                className={`btn ${data.config.end_cycle_btn_enabled !== 'false' ? 'btn-primary' : ''}`}
                style={{
                  background: data.config.end_cycle_btn_enabled !== 'false' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                  minWidth: '120px', padding: '8px'
                }}
                onClick={() => handleUpdateEndCycleButton(data.config.end_cycle_btn_enabled !== 'false' ? 'false' : 'true')}
              >
                {data.config.end_cycle_btn_enabled !== 'false' ? 'Habilitado' : 'Deshabilitado'}
              </button>
            </div>
          </div>

          {/* Mensaje de Contraseña no Definida */}
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.8rem', gridColumn: isMobile ? 'auto' : 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Unlock size={16} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1rem', color: 'var(--primary)', margin: 0 }}>Mensaje de "Contraseña no definida"</h3>
            </div>
            <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: 0 }}>Este texto aparecerá cuando un alumno intente entrar a su boletín sin haber configurado una clave previa.</p>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <textarea
                className="input-field"
                style={{ flex: 1, minHeight: '80px', fontSize: '0.85rem', lineHeight: '1.4', padding: '12px' }}
                placeholder="Ej: Solicite la contraseña mediante atención directa en el horario de 8:00 a 13:00 de Lunes a Viernes."
                defaultValue={data.config.password_not_set_msg || ''}
                id="password-msg-input"
              />
              <button
                className="btn btn-primary"
                style={{ alignSelf: 'stretch', padding: '0 1.5rem' }}
                onClick={() => {
                  const val = document.getElementById('password-msg-input').value;
                  handleUpdatePasswordMsg(val);
                }}
              >
                Guardar
              </button>
            </div>
          </div>

          {/* Modificación de Pestañas */}
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ListChecks size={16} /> Visibilidad de Módulos
                </h3>
                <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>Ocultar o mostrar pestañas globalmente.</p>
              </div>
              <button
                className="btn btn-primary"
                style={{ minWidth: '120px', padding: '8px' }}
                onClick={() => setShowTabsModal(true)}
              >
                Modificaciones de Pestañas
              </button>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
};

export default SettingsPanel;
