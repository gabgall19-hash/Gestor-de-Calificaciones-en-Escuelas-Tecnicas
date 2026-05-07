import { FileText, Printer, Search, Users, Book, RotateCcw, Eye, ClipboardList, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatDNI } from '../functions/PreceptorHelpers';
import '../../css/panels/ReportViews.css';

const RACPanel = ({ 
  user, data, selectedYearId, racSearch, setRacSearch, 
  handlePrintRAC_Student, handlePrintRAC_AllStudents, setSelectedRacStudent, setShowPreviasModal, 
  onPreviewStudent, undoPase, updateStudentField, setViewingFichaStudent,
  isSelectionMode, setIsSelectionMode, selectedStudentIds, setSelectedStudentIds, onEndCycle
}) => {
  const canEditRAC = ['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'preceptor'].includes(user.rol);
  const canEndCycle = ['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares'].includes(user.rol);

  return (
    <section className="page-section">
      <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={16} className="text-primary" />
          <h2>Registro Anual de Calificaciones (RAC)</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {canEndCycle && (
            <button 
              className="btn btn-primary" 
              style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)', border: 'none' }}
              onClick={() => setIsSelectionMode(true)}
            >
              <AlertTriangle size={16} /> TERMINACIÓN DE CICLO
            </button>
          )}
          <button className="btn btn-primary" onClick={() => handlePrintRAC_AllStudents()}>
            <Printer size={16} /> IMPRIMIR RAC
          </button>
        </div>
      </div>

      <div className="management-card" style={{ marginTop: '1rem' }}>
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
            <input 
              className="input-field" 
              placeholder="Filtrar listado RAC por nombre o DNI..." 
              value={racSearch} 
              onChange={(e) => setRacSearch(e.target.value)}
              style={{ paddingLeft: '45px', fontSize: '1rem' }}
            />
          </div>
          {isSelectionMode && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-success" disabled={selectedStudentIds.length === 0} onClick={onEndCycle}>
                <CheckCircle2 size={16} /> Procesar ({selectedStudentIds.length})
              </button>
              <button className="btn btn-danger" onClick={() => { setIsSelectionMode(false); setSelectedStudentIds([]); }}>Cancelar</button>
            </div>
          )}
        </div>
        <div className="table-container">
          <table className="grades-table">
            <thead>
              <tr>
                {isSelectionMode && <th style={{ width: '40px' }}>SEL</th>}
                <th style={{ width: '50px' }}>N°</th>
                <th style={{ textAlign: 'left' }}>ALUMNO</th>
                <th style={{ width: '120px', textAlign: 'left' }}>DNI</th>
                <th style={{ width: '100px' }}>MATRICULA</th>
                <th style={{ width: '60px' }}>L°</th>
                <th style={{ width: '60px' }}>F°</th>
                <th style={{ width: '100px' }}>LEGAJO N°</th>
                <th style={{ width: '150px' }}>PREVIAS</th>
                <th style={{ width: '160px' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {data.students.filter(s => 
                `${s.apellido} ${s.nombre}`.toLowerCase().includes(racSearch.toLowerCase()) || 
                String(s.dni).includes(racSearch)
              ).map((student, idx) => {
                const studentPrevias = data.previas.filter(p => p.alumno_id === student.id);
                const pendientes = studentPrevias.filter(p => p.estado === 'pendiente').length;
                const isSelected = selectedStudentIds.includes(student.id);
                return (
                  <tr key={student.id} className={isSelected ? 'selected-row' : ''} onClick={() => { if (isSelectionMode) setSelectedStudentIds(prev => prev.includes(student.id) ? prev.filter(id => id !== student.id) : [...prev, student.id]); }}>
                    {isSelectionMode && (
                      <td style={{ textAlign: 'center' }}>
                        <input type="checkbox" checked={isSelected} onChange={() => {}} />
                      </td>
                    )}
                    <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ textAlign: 'left' }}><strong>{student.apellido}, {student.nombre}</strong></td>
                    <td style={{ textAlign: 'left' }}>{formatDNI(student.dni)}</td>
                    <td>
                      <input 
                        type="text" 
                        className="cell-input" 
                        style={{ width: '100%', ...(canEditRAC ? {} : { pointerEvents: 'none', background: 'transparent', border: 'none' }) }} 
                        value={student.matricula || ''} 
                        readOnly={!canEditRAC}
                        onChange={(e) => updateStudentField(student, 'matricula', e.target.value)}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        className="cell-input" 
                        style={{ width: '100%', textAlign: 'center', ...(canEditRAC ? {} : { pointerEvents: 'none', background: 'transparent', border: 'none' }) }} 
                        value={student.libro || ''} 
                        readOnly={!canEditRAC}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          updateStudentField(student, 'libro', val);
                        }}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        className="cell-input" 
                        style={{ width: '100%', textAlign: 'center', ...(canEditRAC ? {} : { pointerEvents: 'none', background: 'transparent', border: 'none' }) }} 
                        value={student.folio || ''} 
                        readOnly={!canEditRAC}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          updateStudentField(student, 'folio', val);
                        }}
                      />
                    </td>
                    <td>
                      <input 
                        type="text" 
                        className="cell-input" 
                        style={{ width: '100%', textAlign: 'center', ...(canEditRAC ? {} : { pointerEvents: 'none', background: 'transparent', border: 'none' }) }} 
                        value={student.legajo || ''} 
                        readOnly={!canEditRAC}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          updateStudentField(student, 'legajo', val);
                        }}
                      />
                    </td>
                    <td>
                      {pendientes === 0 ? (
                        <span className="badge badge-preceptor" style={{ opacity: 0.5 }}>SIN PREVIAS</span>
                      ) : pendientes <= 3 ? (
                        <span className="badge badge-warning">{pendientes} PENDIENTES</span>
                      ) : (
                        <span className="badge badge-danger">{pendientes} PENDIENTES</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="icon-btn" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary)', width: '32px', height: '32px' }} onClick={() => setViewingFichaStudent(student)} title="Ver Ficha y Editar">
                          <FileText size={16} />
                        </button>
                        <button className="icon-btn" style={{ background: 'rgba(52,152,219,0.1)', color: '#3498db', width: '32px', height: '32px' }} onClick={() => onPreviewStudent && onPreviewStudent(student.dni)} title="Ver Boletín (RAC)">
                          <Eye size={16} />
                        </button>
                        <button className="icon-btn" style={{ background: 'rgba(231, 76, 60, 0.7)', color: '#fff', width: '32px', height: '32px' }} onClick={() => { setSelectedRacStudent(student); setShowPreviasModal(true); }} title="Gestionar Previas">
                          <Book size={16} />
                        </button>
                        <button className="icon-btn" style={{ background: 'rgba(99,102,241,0.1)', color: '#a5b4fc', width: '32px', height: '32px' }} onClick={() => handlePrintRAC_Student(student)} title="Imprimir RAC Individual">
                          <Printer size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default RACPanel;
