import React from 'react';
import { Users, GraduationCap, Search, Plus, ArrowRightLeft, Trash2, FileText, Lock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { formatDNI, formatGender } from '../functions/PreceptorHelpers';
import Skeleton from '../UI/Skeleton';
import Modal from '../UI/Modal';
import '../../css/StudentManager.css';

const StudentManager = ({ 
  user, data, loading,
  studentForm, setStudentForm, 
  studentsSearch, setStudentsSearch,
  canManageStudents, canTransfer,
  addStudent, deleteStudent, 
  setEditingStudent, setTransferringAlumno, setPasingStudent,
  setViewingFichaStudent,
  dniError, setDniError,
  setSelectedStudentIds,
  onSetPassword
}) => {
  const [searchMode, setSearchMode] = React.useState('course'); // 'course' | 'global'
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 30;

  const handleAddSubmit = (e) => {
    e.preventDefault();
    addStudent(e);
    setShowAddModal(false);
  };

  const filteredStudents = (searchMode === 'global' ? (data.allStudents || []) : data.students).filter(s => 
    `${s.apellido} ${s.nombre}`.toLowerCase().includes(studentsSearch.toLowerCase()) || 
    String(s.dni).includes(studentsSearch)
  );

  const paginatedStudents = filteredStudents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  // Reset page when search or mode changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [studentsSearch, searchMode]);

  return (
    <section className="page-section management-grid" style={{ gridTemplateColumns: '1fr' }}>
      {showAddModal && (
        <Modal title="Agregar Nuevo Alumno" onClose={() => setShowAddModal(false)}>
          <p className="helper-text" style={{ marginBottom: '1.5rem' }}>El alumno se agregará al curso seleccionado.</p>
          <form className="stack-form" onSubmit={handleAddSubmit}>
            <input className="input-field" placeholder="Apellido(s)" value={studentForm.apellido} onChange={(e) => { setStudentForm((p) => ({ ...p, apellido: e.target.value })); setDniError(''); }} disabled={!canManageStudents} required />
            <input className="input-field" placeholder="Nombre(s)" value={studentForm.nombre} onChange={(e) => { setStudentForm((p) => ({ ...p, nombre: e.target.value })); setDniError(''); }} disabled={!canManageStudents} required />
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                className="input-field" 
                placeholder="DNI (Opcional)" 
                value={studentForm.dni} 
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                  setStudentForm((p) => ({ ...p, dni: val }));
                  setDniError('');
                }} 
                disabled={!canManageStudents} 
              />
              <select 
                className="input-field" 
                value={studentForm.genero} 
                onChange={(e) => setStudentForm((p) => ({ ...p, genero: e.target.value }))}
                disabled={!canManageStudents}
              >
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
            </div>
            <button className="btn btn-primary" type="submit" disabled={!canManageStudents || !studentForm.nombre || !studentForm.apellido} style={{ width: '100%', marginTop: '1rem' }}><Plus size={16} /> Confirmar Alta</button>
            {dniError && <div className="error-message" style={{ color: '#ff4d4d', fontSize: '0.85rem', marginTop: '8px', fontWeight: 'bold', textAlign: 'center' }}>{dniError}</div>}
          </form>
        </Modal>
      )}
      <section className="management-card">
        <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GraduationCap size={16} />
            <h2>Listado del Curso</h2>
          </div>
          {['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'].includes(user.rol) && (
            <button 
              className="btn btn-primary" 
              onClick={() => setShowAddModal(true)}
              disabled={!canManageStudents}
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              <Plus size={16} /> Nuevo Alumno
            </button>
          )}
        </div>
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input 
              className="input-field" 
              placeholder={searchMode === 'global' ? "Buscador Global (todos los cursos)..." : "Buscar en este curso..."} 
              value={studentsSearch} 
              onChange={(e) => setStudentsSearch(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
          <select 
            className="input-field" 
            style={{ width: 'auto', minWidth: '120px' }}
            value={searchMode}
            onChange={(e) => setSearchMode(e.target.value)}
          >
            <option value="course">Por Curso</option>
            <option value="global">Global</option>
          </select>
        </div>
        <div className="student-list">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="student-item" style={{ gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <Skeleton type="text" style={{ width: '60%', height: '18px' }} />
                  <Skeleton type="text" style={{ width: '40%', height: '14px', marginTop: '8px' }} />
                </div>
              </div>
            ))
          ) : (paginatedStudents.map((student) => {
            return (
              <div 
                key={student.id} 
                className="student-item"
                style={{ 
                  ...(student.estado === 0 ? { opacity: 0.6, background: 'rgba(0,0,0,0.1)' } : {}),
                  padding: '1rem 1.2rem' // Estirar un poco más cada item
                }}
              >
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '1rem', ...(student.estado === 0 ? { textDecoration: 'line-through' } : {}) }}>{student.apellido}, {student.nombre}</strong> 
                  {student.estado === 0 && <span className="badge badge-danger" style={{ fontSize: '0.6rem', verticalAlign: 'middle', marginLeft: '4px' }}>INACTIVO / PASE</span>}
                  {student.observaciones?.toLowerCase().includes('transferido de') && <span className="badge badge-warning" style={{ fontSize: '0.6rem', verticalAlign: 'middle', marginLeft: '4px' }}>Transferido</span>}
                  <p style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center', marginTop: '0.4rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {formatDNI(student.dni)} · {formatGender(student.genero)}
                      {searchMode === 'global' && <span> · <strong style={{ color: 'var(--primary)', fontSize: '0.75rem' }}>{student.course_label}</strong></span>} · 
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 'bold', 
                        color: student.password ? 'var(--success)' : '#ef4444',
                        background: student.password ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}>
                        {student.password ? 'Contraseña Definida' : 'Sin Contraseña'}
                      </span>
                    </span>
                    {(() => {
                        const transferLines = (student.observaciones || '').split('\n')
                          .filter(line => line.toLowerCase().includes('transferido de'));
                        const lastTransfer = transferLines[transferLines.length - 1];
                        return lastTransfer ? (
                          <span style={{ fontSize: '0.75rem', color: '#f39c12', fontStyle: 'italic', marginLeft: '4px' }}>
                            · {lastTransfer}
                          </span>
                        ) : null;
                    })()}
                  </p>
                </div>
                <div className="student-item-actions" onClick={e => e.stopPropagation()}>
                  <button className="icon-btn" type="button" onClick={() => onSetPassword(student)} title="Establecer contraseña de boletín" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)' }}><Lock size={14} /></button>
                  <button className="icon-btn" type="button" onClick={() => setViewingFichaStudent(student)} title="Ver Ficha y Editar" style={{ color: 'var(--primary)', background: 'rgba(99,102,241,0.1)' }}><FileText size={14} /></button>
                  {canTransfer && <button className="icon-btn" type="button" onClick={() => setTransferringAlumno(student)} title="Transferir"><ArrowRightLeft size={14} /></button>}
                  {canTransfer && <button className="icon-btn" type="button" onClick={() => setPasingStudent(student)} title="Dar de Pase" style={{ color: 'var(--success)' }}><GraduationCap size={14} /></button>}
                  <button 
                    className="icon-btn danger" 
                    type="button" 
                    onClick={() => deleteStudent(student)} 
                    disabled={!['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'].includes(user.rol)} 
                    title={['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'].includes(user.rol) ? "Eliminar Alumno" : "No tienes permisos para eliminar"}
                    style={!['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'].includes(user.rol) ? { opacity: 0.3, cursor: 'not-allowed' } : {}}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          }))}
        </div>

        {totalPages > 1 && (
          <div className="pagination-controls">
            <button 
              className="page-btn" 
              disabled={currentPage === 1} 
              onClick={() => { setCurrentPage(p => p - 1); document.querySelector('.student-list').scrollTo(0,0); }}
            >
              Anterior
            </button>
            <span className="page-info">Página {currentPage} de {totalPages}</span>
            <button 
              className="page-btn" 
              disabled={currentPage === totalPages} 
              onClick={() => { setCurrentPage(p => p + 1); document.querySelector('.student-list').scrollTo(0,0); }}
            >
              Siguiente
            </button>
          </div>
        )}
      </section>
    </section>
  );
};

export default StudentManager;
