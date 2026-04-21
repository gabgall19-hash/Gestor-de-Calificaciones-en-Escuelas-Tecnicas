import React from 'react';
import { Users, Settings, Plus, Eye, Wrench, Trash2, Smartphone, Unlock, Lock, Copy, BookOpen, Check, ArrowUpCircle, AlertTriangle } from 'lucide-react';
import { simplifyTecName } from './PreceptorHelpers';

const SettingsPanel = ({ 
  user, data, isMobile,
  editingUserId, setEditingUserId,
  userForm, setUserForm, emptyUser,
  yearForm, setYearForm,
  activeTecId, setActiveTecId,
  startEditUser, deleteUser, setViewingProf,
  handleUpdateSystemMode, handleUpdatePeriods,
  handleUpdatePreceptorMode,
  addYear, editYear, deleteYear,
  startCreateTec, startEditTec, duplicateTec, removeTec,
  prepareEditCourse, toggleCourseActive,
  handleUpdateMobileLogin, handleResetPassword,
  setYearAsCurrent, copyYearInfo, startEndCycle
}) => {
  const [userSearch, setUserSearch] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const usersPerPage = 10;
  return (
    <section className="page-section management-grid">
      <section className="management-card" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="section-title"><Users size={16} /><h2>Gestión de Usuarios</h2></div>
        <div className="section-toolbar-left" style={{ marginBottom: '1.2rem' }}>
          <button className="btn btn-primary" type="button" onClick={() => { setEditingUserId('new'); setUserForm({ ...emptyUser, rol: 'profesor' }); }}>
            <Plus size={16} /> Nuevo Usuario
          </button>
            {data.academicYears.length >= 2 && (
              <button 
                className="btn btn-secondary" 
                type="button" 
                onClick={() => {
                  const years = data.academicYears;
                  if (years.length < 2) {
                    alert("Se necesitan al menos dos años lectivos para realizar copias.");
                    return;
                  }
                  const to = window.prompt(`Sincronización Masiva: Copiar TODOS los roles DESDE el año anterior AL año destino. Confirma el año DESTINO:`, data.academicYears[0].nombre);
                  if (to) {
                    const targetYear = data.academicYears.find(y => y.nombre === to || String(y.id) === to);
                    const fromYear = data.academicYears.find(y => y.id !== targetYear?.id);
                    if (targetYear && fromYear && window.confirm(`¿Sincronizar TODOS los usuarios de (${fromYear.nombre}) a (${targetYear.nombre})?`)) {
                      copyYearInfo(fromYear.id, targetYear.id);
                    }
                  }
                }}
                title="Sincronización masiva de roles"
              >
                <ArrowUpCircle size={16} /> Sincronización Masiva
              </button>
            )}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Buscar usuario por nombre o ID..." 
            value={userSearch} 
            onChange={(e) => { setUserSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="student-list" style={{ flex: 1, maxHeight: '450px', overflowY: 'auto' }}>
          {(() => {
            const filtered = data.users.filter(u => 
              u.nombre.toLowerCase().includes(userSearch.toLowerCase()) || 
              u.username.toLowerCase().includes(userSearch.toLowerCase())
            );
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
                        {(u.rol === 'preceptor' || u.rol === 'preceptor_taller' || u.rol === 'preceptor_ef') && u.preceptor_course_id && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                            · {data.allCourses.find(c => c.id === Number(u.preceptor_course_id))?.label || 'Curso no encontrado'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="student-item-actions">
                      {data.academicYears.length >= 2 && (
                        <button 
                          className="icon-btn" 
                          style={{ color: '#2ecc71', background: 'rgba(46,204,113,0.1)' }} 
                          onClick={() => {
                            const years = data.academicYears;
                            if (years.length < 2) return alert("Se requieren 2 años lectivos.");
                            const targetYear = years.find(y => y.es_actual === 1) || years[0];
                            const fromYear = years.find(y => y.id !== targetYear.id);
                            if (window.confirm(`¿Copiar asignaciones de ${u.nombre} desde (${fromYear.nombre}) a (${targetYear.nombre})?`)) {
                              copyYearInfo(fromYear.id, targetYear.id, u.id);
                            }
                          }} 
                          title="Copiar info de año anterior"
                        >
                          <Copy size={14} />
                        </button>
                      )}
                      {u.rol === 'profesor' && <button className="icon-btn" style={{ color: '#3498db' }} onClick={() => setViewingProf(u)} title="Ver asignaciones"><Eye size={14} /></button>}
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
        </div>
      </section>

      <section className="management-card" style={{ gridColumn: 'span 2' }}>
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

      <section className="management-card" style={{ gridColumn: 'span 2' }}>
        <div className="section-title">
          <Smartphone size={16} />
          <h2>Otras Opciones</h2>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem', marginTop: '1.2rem' }}>
          {/* Configuración de Preceptores */}
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={16} /> Configuración de Preceptores
            </h3>
            
            <div className="stack-form" style={{ gap: '15px' }}>
              {[
                { id: 'preceptor', label: 'Preceptores (General)' },
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
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={16} /> Acceso Móvil
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '0.8rem', opacity: 0.6, flex: 1, paddingRight: '1rem' }}>
                Habilita o deshabilita el acceso desde teléfonos y tablets.
              </p>
              <button 
                className={`btn ${data.config.mobile_login_enabled === 'true' ? 'btn-primary' : ''}`} 
                style={{ 
                  background: data.config.mobile_login_enabled === 'true' ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                  minWidth: '130px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px 12px'
                }}
                onClick={() => handleUpdateMobileLogin(data.config.mobile_login_enabled === 'true' ? 'false' : 'true')}
              >
                {data.config.mobile_login_enabled === 'true' ? <Unlock size={14} /> : <Lock size={14} />}
                <span style={{ fontSize: '0.8rem' }}>{data.config.mobile_login_enabled === 'true' ? 'Habilitado' : 'Deshabilitado'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </section>
  );
};

export default SettingsPanel;
