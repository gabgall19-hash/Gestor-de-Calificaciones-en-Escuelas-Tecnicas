import { Users, GraduationCap, Search, Plus, ArrowRightLeft, Trash2, FileText, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { formatDNI, formatGender } from './PreceptorHelpers';
import Skeleton from './Skeleton';
import '../css/StudentManager.css';

const StudentManager = ({ 
  user, data, loading,
  studentForm, setStudentForm, 
  studentsSearch, setStudentsSearch,
  canManageStudents, canTransfer,
  addStudent, deleteStudent, 
  setEditingStudent, setTransferringAlumno, setPasingStudent,
  setViewingFichaStudent,
  dniError, setDniError,
  setSelectedStudentIds
}) => {
  return (
    <section className="page-section management-grid" style={!['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'].includes(user.rol) ? { gridTemplateColumns: '1fr' } : {}}>
      {['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'].includes(user.rol) && <section className="management-card">
        <div className="section-title"><Users size={16} /><h2>Agregar Alumno</h2></div>
        <p className="helper-text">El alumno se agrega al curso seleccionado. {!canManageStudents ? 'No tienes permisos sobre este curso.' : ''}</p>
        <form className="stack-form" onSubmit={addStudent}>
          <input className="input-field" placeholder="Apellido(s)" value={studentForm.apellido} onChange={(e) => { setStudentForm((p) => ({ ...p, apellido: e.target.value })); setDniError(''); }} disabled={!canManageStudents} />
          <input className="input-field" placeholder="Nombre(s)" value={studentForm.nombre} onChange={(e) => { setStudentForm((p) => ({ ...p, nombre: e.target.value })); setDniError(''); }} disabled={!canManageStudents} />
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
          <button className="btn btn-primary" type="submit" disabled={!canManageStudents || !studentForm.nombre || !studentForm.apellido}><Plus size={16} /> Agregar alumno</button>
          {dniError && <div className="error-message" style={{ color: '#ff4d4d', fontSize: '0.85rem', marginTop: '8px', fontWeight: 'bold', textAlign: 'center' }}>{dniError}</div>}
        </form>
      </section>}
      <section className="management-card">
        <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GraduationCap size={16} />
            <h2>Listado del Curso</h2>
          </div>
        </div>
        <div style={{ marginBottom: '1rem', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
          <input 
            className="input-field" 
            placeholder="Buscar alumno por nombre o DNI..." 
            value={studentsSearch} 
            onChange={(e) => setStudentsSearch(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
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
          ) : (data.students.filter(s => 
            `${s.apellido} ${s.nombre}`.toLowerCase().includes(studentsSearch.toLowerCase()) || 
            String(s.dni).includes(studentsSearch)
          ).map((student) => {
            return (
              <div 
                key={student.id} 
                className="student-item"
                style={{ 
                  ...(student.estado === 0 ? { opacity: 0.6, background: 'rgba(0,0,0,0.1)' } : {})
                }}
              >
                <div style={{ flex: 1 }}>
                  <strong style={student.estado === 0 ? { textDecoration: 'line-through' } : {}}>{student.apellido}, {student.nombre}</strong> 
                  {student.estado === 0 && <span className="badge badge-danger" style={{ fontSize: '0.6rem', verticalAlign: 'middle', marginLeft: '4px' }}>INACTIVO / PASE</span>}
                  {student.observaciones?.toLowerCase().includes('transferido de') && <span className="badge badge-warning" style={{ fontSize: '0.6rem', verticalAlign: 'middle', marginLeft: '4px' }}>Transferido</span>}
                  <p style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'baseline' }}>
                    <span>{formatDNI(student.dni)} · {formatGender(student.genero)}</span>
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
      </section>
    </section>
  );
};

export default StudentManager;
