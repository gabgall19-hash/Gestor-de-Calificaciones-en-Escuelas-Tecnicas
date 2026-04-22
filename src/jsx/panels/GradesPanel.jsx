import React from 'react';
import { ClipboardList, Search, Save, BookOpen, Users } from 'lucide-react';
import { truncate, truncateSubject, formatDNI, numberToWords } from '../functions/PreceptorHelpers';
import { TableSkeleton } from '../UI/Skeleton';
import '../../css/GradesPanel.css';

const GradesPanel = ({ 
  data, user, pending, loading, viewMode, setViewMode, 
  notesSearch, setNotesSearch, 
  previewDni, setPreviewDni,
  selectedSubjectId, setSelectedSubjectId,
  selectedPeriod, setSelectedPeriod,
  isMobile, updateCell, gradeValue, saveGrades,
  filteredSubjects, getSubjectUnits, rotationFilteredStudents,
  setShowNomenclaturaModal, setEditingObsStudent
}) => {
  return (
    <section className="page-section">
      <div className="section-title">
        <ClipboardList size={16} />
        <h2>
          {viewMode === 'taller' ? 'Calificaciones de Taller' : 'Calificaciones del curso'}
          {(viewMode === 'bySubject' || viewMode === 'taller') && (
            <> · {(filteredSubjects.find(s => s.id === selectedSubjectId) || filteredSubjects[0])?.nombre || ''}</>
          )}
        </h2>
        <div style={{ marginLeft: 'auto' }}>
          <button 
            className="nomenclatura-link"
            onClick={() => setShowNomenclaturaModal(true)}
            style={{ fontSize: '0.75rem', padding: '4px 10px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '6px', color: '#818cf8', fontWeight: 'bold' }}
          >
            Nomenclatura Calificación
          </button>
        </div>
      </div>
      
      <div className="section-toolbar-compact" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '250px' }}>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Buscar alumno por nombre o DNI..." 
            value={notesSearch} 
            onChange={(e) => setNotesSearch(e.target.value)} 
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="view-selector">
            {/* Todas las Materias: Preceptores y Admin (inútil para Profesores y Preceptor de Taller) */}
            {user.rol !== 'profesor' && user.rol !== 'preceptor_taller' && (
              <button className={`tab-btn ${viewMode === 'simple' ? 'active' : ''}`} onClick={() => setViewMode('simple')}>Todas las Materias</button>
            )}
            
            {/* Por Materia: Preceptores y Profesores (inútil para Preceptor de Taller) */}
            {user.rol !== 'preceptor_taller' && (
              <button className={`tab-btn ${viewMode === 'bySubject' ? 'active' : ''}`} onClick={() => setViewMode('bySubject')}>Por Materia</button>
            )}

            {/* Taller: Preceptor de Taller, Preceptor (si hay modulares), Profesor (si tiene talleres) y Admin */}
            {(
              user.rol === 'admin' || 
              user.rol === 'preceptor_taller' || 
              (user.rol === 'preceptor' && (data.subjects || []).some(s => s.es_taller === 1 && (s.tipo || '').toLowerCase().includes('modular'))) || 
              (user.rol === 'profesor' && (data.subjects || []).some(s => s.es_taller === 1)) ||
              (['secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'].includes(user.rol))
            ) && (data.subjects || []).some(s => s.es_taller === 1) && (
              <button className={`tab-btn ${viewMode === 'taller' ? 'active' : ''}`} onClick={() => setViewMode('taller')}>Taller</button>
            )}
          </div>
        </div>

        <div className="panel-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="preview-inline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--primary)', whiteSpace: 'nowrap' }}>DNI Alumno:</span>
            <input type="text" value={previewDni} onChange={(e) => setPreviewDni(e.target.value)} className="input-field compact-inline-input" placeholder="..." style={{ padding: '0.55rem 0.75rem', width: '110px' }} />
          </div>
          <button className="btn btn-primary" onClick={saveGrades} disabled={Object.keys(pending).length === 0 && !previewDni.trim()} style={{ whiteSpace: 'nowrap' }}>
            <Save size={16} /> Guardar Cambios
          </button>
        </div>
      </div>
      
      <div className="table-container compact-table-container">
        <table className="grades-table">
          <colgroup>
            <col style={{ width: '120px' }} />
            {(viewMode === 'bySubject' || viewMode === 'taller') ? (() => {
              const currentSub = filteredSubjects.find(s => s.id === selectedSubjectId) || filteredSubjects[0];
              const sid = currentSub?.id;
              const sub = currentSub;
              const isModular = (sub?.tipo || '').toLowerCase().includes('modular');
              const mode = data.config?.period_view_mode || 'completo';
              let colCount = 1; // Student name
              if (mode === 'completo') colCount += isModular ? 23 : 14;
              else if (mode === 'orientadores') colCount += isModular ? 6 : 3;
              else if (mode === 'trimestrales') colCount += isModular ? 12 : 6;
              else if (mode === 'finales') colCount += 5;
              return Array(colCount - 1).fill(null).map((_, i) => <col key={i} style={{ width: isModular ? (isMobile ? '35px' : '40px') : (isMobile ? '40px' : '55px') }} />);
            })() : (
              filteredSubjects.map((subject) => {
                const units = getSubjectUnits(subject);
                return Array(units).fill(null).map((_, i) => <col key={`${subject.id}-${i}`} style={{ width: isMobile ? '40px' : '50px' }} />);
              })
            )}
          </colgroup>
          <thead>
            {(viewMode === 'bySubject' || viewMode === 'taller') ? (() => {
              const currentSub = filteredSubjects.find(s => s.id === selectedSubjectId) || filteredSubjects[0];
              const sid = currentSub?.id;
              const sub = currentSub;
              const isModular = (sub?.tipo || '').toLowerCase().includes('modular');

              if (isModular) {
                const mode = data.config?.period_view_mode || 'completo';
                return (
                  <>
                    <tr>
                      <th rowSpan="3" className="student-column student-column-header">Apellido(s) y Nombre(s):</th>
                      {(mode === 'completo' || mode === 'orientadores' || mode === 'trimestrales') && <th colSpan={(mode === 'orientadores') ? 2 : (mode === 'trimestrales') ? 4 : 6} className="subject-header" style={{ borderBottom: '2px solid var(--primary)', background: 'rgba(99, 102, 241, 0.1)', borderRight: '2px solid rgba(255,255,255,0.2)' }}>1° {isMobile ? 'T' : 'Trimestre'}</th>}
                      {(mode === 'completo' || mode === 'orientadores' || mode === 'trimestrales') && <th colSpan={(mode === 'orientadores') ? 2 : (mode === 'trimestrales') ? 4 : 6} className="subject-header" style={{ borderBottom: '2px solid var(--primary)', background: 'rgba(99, 102, 241, 0.05)', borderRight: '2px solid rgba(255,255,255,0.2)' }}>2° {isMobile ? 'T' : 'Trimestre'}</th>}
                      {(mode === 'completo' || mode === 'orientadores' || mode === 'trimestrales') && <th colSpan={(mode === 'orientadores') ? 2 : (mode === 'trimestrales') ? 4 : 6} className="subject-header" style={{ borderBottom: '2px solid var(--primary)', background: 'rgba(99, 102, 241, 0.1)', borderRight: '2px solid rgba(255,255,255,0.2)' }}>3° {isMobile ? 'T' : 'Trimestre'}</th>}
                      {(mode === 'completo' || mode === 'finales') && <th colSpan="5" className="subject-header" style={{ borderBottom: '2px solid #e74c3c', background: 'rgba(231, 76, 60, 0.1)' }}>Final</th>}
                    </tr>
                    <tr>
                      {(mode === 'completo' || mode === 'orientadores') && <th colSpan="2" className="cell-grade-header">1° {isMobile ? 'I' : 'Inf.'}</th>}{(mode === 'completo' || mode === 'trimestrales') && <th colSpan="2" className="cell-grade-header">Nota</th>}{(mode === 'completo' || mode === 'trimestrales') && <th className="cell-grade-header">{isMobile ? 'Pn' : 'Pond.'}</th>}{(mode === 'completo' || mode === 'trimestrales') && <th className="cell-grade-header" style={{ borderRight: '2px solid rgba(255,255,255,0.2)' }}>{isMobile ? 'Lt' : 'Letras'}</th>}
                      {(mode === 'completo' || mode === 'orientadores') && <th colSpan="2" className="cell-grade-header">2° {isMobile ? 'I' : 'Inf.'}</th>}{(mode === 'completo' || mode === 'trimestrales') && <th colSpan="2" className="cell-grade-header">Nota</th>}{(mode === 'completo' || mode === 'trimestrales') && <th className="cell-grade-header">{isMobile ? 'Pn' : 'Pond.'}</th>}{(mode === 'completo' || mode === 'trimestrales') && <th className="cell-grade-header" style={{ borderRight: '2px solid rgba(255,255,255,0.2)' }}>{isMobile ? 'Lt' : 'Letras'}</th>}
                      {(mode === 'completo' || mode === 'orientadores') && <th colSpan="2" className="cell-grade-header">3° {isMobile ? 'I' : 'Inf.'}</th>}{(mode === 'completo' || mode === 'trimestrales') && <th colSpan="2" className="cell-grade-header">Nota</th>}{(mode === 'completo' || mode === 'trimestrales') && <th className="cell-grade-header">{isMobile ? 'Pn' : 'Pond.'}</th>}{(mode === 'completo' || mode === 'trimestrales') && <th className="cell-grade-header" style={{ borderRight: '2px solid rgba(255,255,255,0.2)' }}>{isMobile ? 'Lt' : 'Letras'}</th>}
                      {(mode === 'completo' || mode === 'finales') && <th className="cell-grade-header">Dic.</th>}{(mode === 'completo' || mode === 'finales') && <th className="cell-grade-header">Feb.</th>}{(mode === 'completo' || mode === 'finales') && <th className="cell-grade-header">Mar.</th>}{(mode === 'completo' || mode === 'finales') && <th className="cell-grade-header" style={{ background: 'rgba(231, 76, 60, 0.05)', fontSize: '0.6rem' }}>Otras Inst.</th>}{(mode === 'completo' || mode === 'finales') && <th className="cell-grade-header">Def.</th>}
                    </tr>
                    <tr>
                      {(mode === 'completo' || mode === 'orientadores') && <><th className="cell-t">T</th><th className="cell-p">P</th></>}{(mode === 'completo' || mode === 'trimestrales') && <><th className="cell-t">T</th><th className="cell-p">P</th><th className="cell-pond"></th><th className="cell-letras" style={{ borderRight: '2px solid rgba(255,255,255,0.2)' }}></th></>}
                      {(mode === 'completo' || mode === 'orientadores') && <><th className="cell-t">T</th><th className="cell-p">P</th></>}{(mode === 'completo' || mode === 'trimestrales') && <><th className="cell-t">T</th><th className="cell-p">P</th><th className="cell-pond"></th><th className="cell-letras" style={{ borderRight: '2px solid rgba(255,255,255,0.2)' }}></th></>}
                      {(mode === 'completo' || mode === 'orientadores') && <><th className="cell-t">T</th><th className="cell-p">P</th></>}{(mode === 'completo' || mode === 'trimestrales') && <><th className="cell-t">T</th><th className="cell-p">P</th><th className="cell-pond"></th><th className="cell-letras" style={{ borderRight: '2px solid rgba(255,255,255,0.2)' }}></th></>}
                      {(mode === 'completo' || mode === 'finales') && <><th></th><th></th><th></th><th></th><th></th></>}
                    </tr>
                  </>
                );
              }

              const mode = data.config?.period_view_mode || 'completo';
              return (
                <>
                  <tr>
                    <th rowSpan="3" className="student-column student-column-header">Apellido(s) y Nombre(s):</th>
                    {(mode === 'completo' || mode === 'orientadores' || mode === 'trimestrales') && <th colSpan={(mode === 'orientadores') ? 1 : (mode === 'trimestrales') ? 2 : 3} className="subject-header" style={{ borderBottom: '2px solid var(--primary)', background: 'rgba(99, 102, 241, 0.1)', borderRight: '2px solid rgba(255,255,255,0.2)' }}>1° {isMobile ? 'T' : 'Trimestre'}</th>}
                    {(mode === 'completo' || mode === 'orientadores' || mode === 'trimestrales') && <th colSpan={(mode === 'orientadores') ? 1 : (mode === 'trimestrales') ? 2 : 3} className="subject-header" style={{ borderBottom: '2px solid var(--primary)', background: 'rgba(99, 102, 241, 0.05)', borderRight: '2px solid rgba(255,255,255,0.2)' }}>2° {isMobile ? 'T' : 'Trimestre'}</th>}
                    {(mode === 'completo' || mode === 'orientadores' || mode === 'trimestrales') && <th colSpan={(mode === 'orientadores') ? 1 : (mode === 'trimestrales') ? 2 : 3} className="subject-header" style={{ borderBottom: '2px solid var(--primary)', background: 'rgba(99, 102, 241, 0.1)', borderRight: '2px solid rgba(255,255,255,0.2)' }}>3° {isMobile ? 'T' : 'Trimestre'}</th>}
                    {(mode === 'completo' || mode === 'finales') && <th colSpan="5" className="subject-header" style={{ borderBottom: '2px solid #e74c3c', background: 'rgba(231, 76, 60, 0.1)' }}>{isMobile ? 'C. Final' : 'Calificación Final'}</th>}
                  </tr>
                  <tr>
                    {(mode === 'completo' || mode === 'orientadores') && <th className="cell-grade-header">1° {isMobile ? 'I' : 'Inf.'}</th>}{(mode === 'completo' || mode === 'trimestrales') && <th className="cell-grade-header">Nota</th>}{(mode === 'completo' || mode === 'trimestrales') && <th className="cell-grade-header" style={{ color: 'var(--primary)', borderRight: '2px solid rgba(255,255,255,0.2)' }}>{isMobile ? 'Lt' : 'Letras'}</th>}
                    {(mode === 'completo' || mode === 'orientadores') && <th className="cell-grade-header">2° {isMobile ? 'I' : 'Inf.'}</th>}{(mode === 'completo' || mode === 'trimestrales') && <th className="cell-grade-header">Nota</th>}{(mode === 'completo' || mode === 'trimestrales') && <th className="cell-grade-header" style={{ color: 'var(--primary)', borderRight: '2px solid rgba(255,255,255,0.2)' }}>{isMobile ? 'Lt' : 'Letras'}</th>}
                    {(mode === 'completo' || mode === 'orientadores') && <th className="cell-grade-header">3° {isMobile ? 'I' : 'Inf.'}</th>}{(mode === 'completo' || mode === 'trimestrales') && <th className="cell-grade-header">Nota</th>}{(mode === 'completo' || mode === 'trimestrales') && <th className="cell-grade-header" style={{ color: 'var(--primary)', borderRight: '2px solid rgba(255,255,255,0.2)' }}>{isMobile ? 'Lt' : 'Letras'}</th>}
                    {(mode === 'completo' || mode === 'finales') && <th className="cell-grade-header">Dic.</th>}{(mode === 'completo' || mode === 'finales') && <th className="cell-grade-header">Feb.</th>}{(mode === 'completo' || mode === 'finales') && <th className="cell-grade-header">Mar.</th>}{(mode === 'completo' || mode === 'finales') && <th className="cell-grade-header" style={{ background: 'rgba(231, 76, 60, 0.05)', fontSize: '0.6rem' }}>Otras Inst.</th>}{(mode === 'completo' || mode === 'finales') && <th className="cell-grade-header" style={{ fontWeight: 'bold' }}>Def.</th>}
                  </tr>
                </>
              );
            })() : (
              <>
                <tr>
                  <th rowSpan="2" className="student-column student-column-header">Apellido(s) y Nombre(s):</th>
                  {filteredSubjects.map((subject) => (
                    <th key={subject.id} colSpan={getSubjectUnits(subject)} className="subject-header" style={subject.es_taller === 1 ? { background: 'rgba(52, 152, 219, 0.15)', borderBottom: '2px solid #3498db' } : {}}>
                      {subject.es_taller === 1 && <div style={{ fontSize: '0.6rem', color: '#3498db', marginBottom: '4px', fontWeight: '900', letterSpacing: '0.05em' }}>TALLER</div>}
                      {truncateSubject(subject.nombre, isMobile)}
                    </th>
                  ))}
                </tr>
                <tr>
                  {filteredSubjects.map((subject) => {
                    const isModularSub = (subject.tipo || '').toLowerCase().includes('modular');
                    if (!isModularSub) {
                      if ([1,3,5].includes(selectedPeriod)) return <th key={subject.id} className="cell-grade-header">{isMobile ? 'Inf.' : 'Inf. Ori.'}</th>;
                      if ([2,4,6].includes(selectedPeriod)) return <th key={subject.id} className="cell-grade-header">Nota</th>;
                      return <th key={subject.id} className="cell-grade-header">Nota</th>;
                    }
                    if ([1,3,5].includes(selectedPeriod)) return <React.Fragment key={subject.id}><th className="cell-t">T</th><th className="cell-p">P</th></React.Fragment>;
                    if ([2,4,6].includes(selectedPeriod)) return <React.Fragment key={subject.id}><th className="cell-t">T</th><th className="cell-p">P</th><th className="cell-pond">{isMobile ? 'Pn' : 'Pond.'}</th></React.Fragment>;
                    return <th key={subject.id} className="cell-grade-header">Nota</th>;
                  })}
                </tr>
              </>
            )}
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="100%" style={{ padding: '2rem' }}>
                  <TableSkeleton rows={10} cols={viewMode === 'simple' ? 8 : 12} />
                </td>
              </tr>
            ) : rotationFilteredStudents.length === 0 ? (
              <tr>
                <td colSpan="100%" style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
                  No se encontraron alumnos para el criterio seleccionado.
                </td>
              </tr>
            ) : rotationFilteredStudents.map((student, idx) => {
              const isTransfer = student.observaciones?.toLowerCase().includes('transferido de');
              
              return (
                <tr key={student.id}>
                  <td className="student-name">
                    <div className="student-name-main" style={{ color: isTransfer ? '#f39c12' : 'inherit' }}>
                      {truncate(`${student.apellido}, ${student.nombre}`)}
                    </div>
                    <div className="student-name-meta" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span>{formatDNI(student.dni)}</span>
                      <button 
                        className="obs-btn-compact" 
                        onClick={() => setEditingObsStudent(student)}
                        title="Editar Observaciones del Boletín"
                        style={{ 
                          padding: '2px 6px', 
                          fontSize: '0.65rem', 
                          fontWeight: 'bold',
                          background: 'rgba(99, 102, 241, 0.15)', 
                          border: '1px solid rgba(99, 102, 241, 0.3)', 
                          borderRadius: '4px',
                          color: 'var(--primary)',
                          cursor: 'pointer',
                          marginLeft: '4px'
                        }}
                      >
                        Obs..
                      </button>
                    </div>
                  </td>

                  {(viewMode === 'bySubject' || viewMode === 'taller') ? (
                    (() => {
                      const currentSub = filteredSubjects.find(s => s.id === selectedSubjectId) || filteredSubjects[0];
                      const sid = currentSub?.id;
                      if (!sid) return <td colSpan="13">No hay materias vinculadas</td>;
                      const isModular = (currentSub?.tipo || '').toLowerCase().includes('modular');
                      const mode = data.config?.period_view_mode || 'completo';
                      
                      const p_subjects = (user.professor_subject_ids ?? '').split(',');
                      const isAssignedAsProfessor = p_subjects.includes(`${data.selectedCourseId}-${sid}`);
                      const configMode = data.config[`${user.rol}_mode`] || 'view';
                      const isPreceptorReadOnly = (['preceptor', 'preceptor_taller', 'preceptor_ef'].includes(user.rol)) && (configMode === 'view') && !isAssignedAsProfessor;
                      const isLocked = isPreceptorReadOnly;
                      const isTallerSimple = currentSub?.es_taller === 1 && !(currentSub?.tipo || '').toLowerCase().includes('modular');
                      const isPassed = (pId) => {
                        const f = [7, 8, 9, 10].includes(pId) ? 'valor_t' : (isModular ? 'valor_pond' : 'valor_t');
                        const val = gradeValue(student.id, sid, f, pId);
                        return val && Number(String(val).replace(',','.')) >= 7;
                      };

                      if (isModular) {
                        return (
                          <>
                            {[1, 2, 3].map(t => {
                              const pInf = t * 2 - 1;
                              const pTrim = t * 2;
                              return (
                                <React.Fragment key={t}>
                                  {(mode === 'completo' || mode === 'orientadores') && (
                                    <>
                                      <td className="cell-t"><input type="text" className="cell-input" value={gradeValue(student.id, sid, 'valor_t', pInf) || ''} disabled={(data.locks || []).some(l => l.materia_id === sid && l.periodo_id === pInf)} onChange={(e) => { const v = e.target.value; if (v !== '' && !/^[A-Za-z]+$/.test(v)) return; updateCell(student.id, sid, pInf, 'valor_t', v.toUpperCase()) }} /></td>
                                      <td className="cell-p"><input type="text" className="cell-input" value={gradeValue(student.id, sid, 'valor_p', pInf) || ''} disabled={(data.locks || []).some(l => l.materia_id === sid && l.periodo_id === pInf)} onChange={(e) => { const v = e.target.value; if (v !== '' && !/^[A-Za-z]+$/.test(v)) return; updateCell(student.id, sid, pInf, 'valor_p', v.toUpperCase()) }} /></td>
                                    </>
                                  )}
                                  {(mode === 'completo' || mode === 'trimestrales') && (
                                    <>
                                      <td className="cell-t"><input type="text" className="cell-input" inputMode="decimal" value={gradeValue(student.id, sid, 'valor_t', pTrim) || ''} disabled={isLocked || (pTrim === 6 && (isPassed(7) || isPassed(8) || isPassed(9) || isPassed(11))) || (data.locks || []).some(l => l.materia_id === sid && l.periodo_id === pTrim)} onChange={(e) => { const v = e.target.value; if (v !== '' && (isNaN(v) || Number(v) < 1 || Number(v) > 10)) return; updateCell(student.id, sid, pTrim, 'valor_t', v) }} /></td>
                                      <td className="cell-p"><input type="text" className="cell-input" inputMode="decimal" value={gradeValue(student.id, sid, 'valor_p', pTrim) || ''} disabled={isLocked || (pTrim === 6 && (isPassed(7) || isPassed(8) || isPassed(9) || isPassed(11))) || (data.locks || []).some(l => l.materia_id === sid && l.periodo_id === pTrim)} onChange={(e) => { const v = e.target.value; if (v !== '' && (isNaN(v) || Number(v) < 1 || Number(v) > 10)) return; updateCell(student.id, sid, pTrim, 'valor_p', v) }} /></td>
                                      <td className="cell-pond"><input type="text" className="cell-input" inputMode="decimal" value={gradeValue(student.id, sid, 'valor_pond', pTrim) || ''} disabled={isLocked || (pTrim === 6 && (isPassed(7) || isPassed(8) || isPassed(9) || isPassed(11))) || (data.locks || []).some(l => l.materia_id === sid && l.periodo_id === pTrim)} onChange={(e) => { const v = e.target.value; if (v !== '' && isNaN(v)) return; updateCell(student.id, sid, pTrim, 'valor_pond', v) }} /></td>
                                      <td className="cell-letras" style={{ borderRight: '2px solid rgba(255,255,255,0.2)', fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 'bold', textAlign: 'center' }}>
                                        {gradeValue(student.id, sid, 'valor_letras', pTrim) || numberToWords(gradeValue(student.id, sid, 'valor_pond', pTrim))}
                                      </td>
                                    </>
                                  )}
                                </React.Fragment>
                              );
                            })}
                            {(mode === 'completo' || mode === 'finales') && (
                              <>
                                <td className="cell-t">
                                  <input type="text" className="cell-input" inputMode="decimal" value={gradeValue(student.id, sid, 'valor_t', 7) || ''} disabled={isLocked || isPassed(6) || isPassed(8) || isPassed(9) || isPassed(11) || (data.locks || []).some(l => l.materia_id === sid && l.periodo_id === 7)} onChange={(e) => { const v = e.target.value; if (v !== '' && (isNaN(v) || Number(v) < 1 || Number(v) > 10)) return; updateCell(student.id, sid, 7, 'valor_t', v) }} />
                                </td>
                                <td className="cell-t">
                                  <input type="text" className="cell-input" inputMode="decimal" value={gradeValue(student.id, sid, 'valor_t', 8) || ''} disabled={isLocked || isPassed(6) || isPassed(7) || isPassed(9) || isPassed(11) || (data.locks || []).some(l => l.materia_id === sid && l.periodo_id === 8)} onChange={(e) => { const v = e.target.value; if (v !== '' && (isNaN(v) || Number(v) < 1 || Number(v) > 10)) return; updateCell(student.id, sid, 8, 'valor_t', v) }} />
                                </td>
                                <td className="cell-t">
                                  <input type="text" className="cell-input" inputMode="decimal" value={gradeValue(student.id, sid, 'valor_t', 9) || ''} disabled={isLocked || isPassed(6) || isPassed(7) || isPassed(8) || isPassed(11) || (data.locks || []).some(l => l.materia_id === sid && l.periodo_id === 9)} onChange={(e) => { const v = e.target.value; if (v !== '' && (isNaN(v) || Number(v) < 1 || Number(v) > 10)) return; updateCell(student.id, sid, 9, 'valor_t', v) }} />
                                </td>
                                <td className="cell-t">
                                  <input type="text" className="cell-input" inputMode="decimal" value={gradeValue(student.id, sid, 'valor_t', 11) || ''} disabled={isLocked || isPassed(6) || isPassed(7) || isPassed(8) || isPassed(9) || (data.locks || []).some(l => l.materia_id === sid && l.periodo_id === 11)} onChange={(e) => { const v = e.target.value; if (v !== '' && (isNaN(v) || Number(v) < 1 || Number(v) > 10)) return; updateCell(student.id, sid, 11, 'valor_t', v) }} placeholder="..." />
                                </td>
                                <td className="cell-t">
                                  <input type="text" className="cell-input" inputMode="decimal" style={{ fontWeight: 'bold' }} value={gradeValue(student.id, sid, 'valor_t', 10) || ''} disabled={!isTallerSimple || (data.locks || []).some(l => l.materia_id === sid && l.periodo_id === 10)} onChange={(e) => { const v = e.target.value; if (v !== '' && (isNaN(v) || Number(v) < 1 || Number(v) > 10)) return; updateCell(student.id, sid, 10, 'valor_t', v) }} />
                                </td>
                              </>
                            )}
                          </>
                        );
                      }

                      return (
                        <>
                          {[1, 2, 3].map(t => {
                              const pInf = t * 2 - 1;
                              const pTrim = t * 2;
                              return (
                                <React.Fragment key={t}>
                                  {(mode === 'completo' || mode === 'orientadores') && (
                                    <td className="cell-t">
                                      <input type="text" className="cell-input" value={gradeValue(student.id, sid, 'valor_t', pInf) || ''} disabled={(data.locks || []).some(l => l.materia_id === sid && l.periodo_id === pInf)} onChange={(e) => { const v = e.target.value; if (v !== '' && !/^[A-Za-z]+$/.test(v)) return; updateCell(student.id, sid, pInf, 'valor_t', v.toUpperCase()) }} />
                                    </td>
                                  )}
                                  {(mode === 'completo' || mode === 'trimestrales') && (
                                    <>
                                      <td className="cell-t">
                                        <input type="text" className="cell-input" inputMode="decimal" value={gradeValue(student.id, sid, 'valor_t', pTrim) || ''} disabled={isLocked || (pTrim === 6 && (isPassed(7) || isPassed(8) || isPassed(9) || isPassed(11))) || (data.locks || []).some(l => l.materia_id === sid && l.periodo_id === pTrim)} onChange={(e) => { const v = e.target.value; if (v !== '' && (isNaN(v) || Number(v) < 1 || Number(v) > 10)) return; updateCell(student.id, sid, pTrim, 'valor_t', v) }} />
                                      </td>
                                      <td className="cell-letras" style={{ borderRight: '2px solid rgba(255,255,255,0.2)', fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 'bold', textAlign: 'center' }}>
                                        {gradeValue(student.id, sid, 'valor_letras', pTrim) || numberToWords(gradeValue(student.id, sid, 'valor_t', pTrim))}
                                      </td>
                                    </>
                                  )}
                                </React.Fragment>
                              );
                          })}
                          
                          {(mode === 'completo' || mode === 'finales') && (
                            <>
                              <td className="cell-t">
                                <input type="text" className="cell-input" value={gradeValue(student.id, sid, 'valor_t', 7) || ''} onChange={(e) => { const v = e.target.value; if(v!=='' && (isNaN(v) || Number(v)<1 || Number(v)>10)) return; updateCell(student.id, sid, 7, 'valor_t', v); }} disabled={isLocked || isPassed(6) || isPassed(8) || isPassed(9) || isPassed(11) || (data.locks || []).some(l => l.materia_id === sid && l.periodo_id === 7)} />
                              </td>
                              <td className="cell-t">
                                <input type="text" className="cell-input" value={gradeValue(student.id, sid, 'valor_t', 8) || ''} onChange={(e) => { const v = e.target.value; if(v!=='' && (isNaN(v) || Number(v)<1 || Number(v)>10)) return; updateCell(student.id, sid, 8, 'valor_t', v); }} disabled={isLocked || isPassed(6) || isPassed(7) || isPassed(9) || isPassed(11) || (data.locks || []).some(l => l.materia_id === sid && l.periodo_id === 8)} />
                              </td>
                              <td className="cell-t">
                                <input type="text" className="cell-input" value={gradeValue(student.id, sid, 'valor_t', 9) || ''} onChange={(e) => { const v = e.target.value; if(v!=='' && (isNaN(v) || Number(v)<1 || Number(v)>10)) return; updateCell(student.id, sid, 9, 'valor_t', v); }} disabled={isLocked || isPassed(6) || isPassed(7) || isPassed(8) || isPassed(11) || (data.locks || []).some(l => l.materia_id === sid && l.periodo_id === 9)} />
                              </td>
                              <td className="cell-t">
                                <input type="text" className="cell-input" value={gradeValue(student.id, sid, 'valor_t', 11) || ''} onChange={(e) => { const v = e.target.value; if(v!=='' && (isNaN(v) || Number(v)<1 || Number(v)>10)) return; updateCell(student.id, sid, 11, 'valor_t', v); }} disabled={isLocked || isPassed(6) || isPassed(7) || isPassed(8) || isPassed(9) || (data.locks || []).some(l => l.materia_id === sid && l.periodo_id === 11)} placeholder="..." />
                              </td>
                              <td className="cell-t">
                                <input type="text" className="cell-input" style={{ fontWeight: 'bold' }} value={gradeValue(student.id, sid, 'valor_t', 10) || ''} onChange={(e) => { const v = e.target.value; if(v!=='' && (isNaN(v) || Number(v)<1 || Number(v)>10)) return; updateCell(student.id, sid, 10, 'valor_t', v); }} disabled={!isTallerSimple || (data.locks || []).some(l => l.materia_id === sid && l.periodo_id === 10)} />
                              </td>
                            </>
                          )}
                        </>
                      );
                    })()
                  ) : (
                    filteredSubjects.map((subject) => {
                      const isLocked = (data.locks || []).some(l => l.materia_id === subject.id && l.periodo_id === selectedPeriod);
                      
                      const p_subjects = (user.professor_subject_ids ?? '').split(',');
                      const isAssignedAsProfessor = p_subjects.includes(`${data.selectedCourseId}-${subject.id}`);
                      const configMode = data.config[`${user.rol}_mode`] || 'view';
                      const isPreceptorReadOnly = (['preceptor', 'preceptor_taller', 'preceptor_ef'].includes(user.rol)) && (configMode === 'view') && !isAssignedAsProfessor;
                      const isFinalLocked = isLocked || isPreceptorReadOnly;

                      return (subject.tipo || '').toLowerCase().includes('modular') ? (
                        <React.Fragment key={subject.id}>
                          {[1, 3, 5].includes(selectedPeriod) ? (
                            <>
                              <td className="cell-t" style={subject.es_taller === 1 ? { background: 'rgba(52, 152, 219, 0.05)' } : {}}>
                                <input type="text" className="cell-input" value={gradeValue(student.id, subject.id, 'valor_t') || ''} disabled={isFinalLocked} onChange={(e) => { const v = e.target.value; if (v !== '' && !/^[A-Za-z]+$/.test(v)) return; updateCell(student.id, subject.id, selectedPeriod, 'valor_t', v.toUpperCase()) }} />
                              </td>
                              <td className="cell-p" style={subject.es_taller === 1 ? { background: 'rgba(52, 152, 219, 0.05)' } : {}}>
                                <input type="text" className="cell-input" value={gradeValue(student.id, subject.id, 'valor_p') || ''} disabled={isFinalLocked} onChange={(e) => { const v = e.target.value; if (v !== '' && !/^[A-Za-z]+$/.test(v)) return; updateCell(student.id, subject.id, selectedPeriod, 'valor_p', v.toUpperCase()) }} />
                              </td>
                            </>
                          ) : [2, 4, 6].includes(selectedPeriod) ? (
                            <>
                              <td className="cell-t" style={subject.es_taller === 1 ? { background: 'rgba(52, 152, 219, 0.05)' } : {}}>
                                <input type="text" className="cell-input" inputMode="decimal" value={gradeValue(student.id, subject.id, 'valor_t') || ''} disabled={isFinalLocked} onChange={(e) => { const v = e.target.value; if (v !== '' && (isNaN(v) || Number(v) < 1 || Number(v) > 10)) return; updateCell(student.id, subject.id, selectedPeriod, 'valor_t', v) }} />
                              </td>
                              <td className="cell-p" style={subject.es_taller === 1 ? { background: 'rgba(52, 152, 219, 0.05)' } : {}}>
                                <input type="text" className="cell-input" inputMode="decimal" value={gradeValue(student.id, subject.id, 'valor_p') || ''} disabled={isFinalLocked} onChange={(e) => { const v = e.target.value; if (v !== '' && (isNaN(v) || Number(v) < 1 || Number(v) > 10)) return; updateCell(student.id, subject.id, selectedPeriod, 'valor_p', v) }} />
                              </td>
                              <td className="cell-pond" style={subject.es_taller === 1 ? { background: 'rgba(52, 152, 219, 0.05)' } : {}}>
                                <input type="text" className="cell-input" inputMode="decimal" value={gradeValue(student.id, subject.id, 'valor_pond') || ''} disabled={isFinalLocked} onChange={(e) => { const v = e.target.value; if (v !== '' && isNaN(v)) return; updateCell(student.id, subject.id, selectedPeriod, 'valor_pond', v) }} />
                              </td>
                            </>
                          ) : (
                            <td className="cell-t" style={subject.es_taller === 1 ? { background: 'rgba(52, 152, 219, 0.05)' } : {}}>
                              <input type="text" className="cell-input" inputMode="decimal" value={gradeValue(student.id, subject.id, 'valor_t') || ''} disabled={isFinalLocked} onChange={(e) => { const v = e.target.value; if (v !== '' && (isNaN(v) || Number(v) < 1 || Number(v) > 10)) return; updateCell(student.id, subject.id, selectedPeriod, 'valor_t', v) }} />
                            </td>
                          )}
                        </React.Fragment>
                      ) : (
                        <React.Fragment key={subject.id}>
                          {[1, 3, 5].includes(selectedPeriod) ? (
                            <td className="cell-t" style={subject.es_taller === 1 ? { background: 'rgba(52, 152, 219, 0.05)' } : {}}>
                              <input type="text" className="cell-input" value={gradeValue(student.id, subject.id, 'valor_t') || ''} disabled={isFinalLocked} onChange={(e) => { const v = e.target.value; if (v !== '' && !/^[A-Za-z]+$/.test(v)) return; updateCell(student.id, subject.id, selectedPeriod, 'valor_t', v.toUpperCase()) }} />
                            </td>
                          ) : [2, 4, 6].includes(selectedPeriod) ? (
                            <td className="cell-t" style={subject.es_taller === 1 ? { background: 'rgba(52, 152, 219, 0.05)' } : {}}>
                              <input type="text" className="cell-input" value={gradeValue(student.id, subject.id, 'valor_t') || ''} disabled={isFinalLocked} onChange={(e) => { const v = e.target.value; if (v !== '' && (isNaN(v) || Number(v) < 1 || Number(v) > 10)) return; updateCell(student.id, subject.id, selectedPeriod, 'valor_t', v) }} />
                            </td>
                          ) : (
                            <td className="cell-t" style={subject.es_taller === 1 ? { background: 'rgba(52, 152, 219, 0.05)' } : {}}>
                              <input type="text" className="cell-input" value={gradeValue(student.id, subject.id, 'valor_t') || ''} disabled={isFinalLocked} onChange={(e) => { const v = e.target.value; if (v !== '' && (isNaN(v) || Number(v) < 1 || Number(v) > 10)) return; updateCell(student.id, subject.id, selectedPeriod, 'valor_t', v) }} />
                            </td>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default GradesPanel;
