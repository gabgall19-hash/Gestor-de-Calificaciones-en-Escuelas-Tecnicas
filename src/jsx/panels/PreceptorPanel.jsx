import React from 'react';
import { BookOpen, Users } from 'lucide-react';

import { yearOptions, divisionOptions, shiftOptions, simplifyTecName, truncateSubject } from '../functions/PreceptorHelpers';
import usePreceptorLogic from '../states/usePreceptorLogic';
import PreceptorModals from '../components/PreceptorModals';
import GradesPanel from './GradesPanel';
import StudentManager from './StudentManager';
import RACPanel from './RACPanel';
import AuditPanel from './AuditPanel';
import SettingsPanel from './SettingsPanel';
import AcademicManager from './AcademicManager';
import PlanillasPanel from './PlanillasPanel';
import PasesPanel from './PasesPanel';
import AnunciosPanel from './AnunciosPanel';
import HorariosPanel from './HorariosPanel';

export default function PreceptorPanel({ user, onLogout, onPreviewStudent, showToast }) {
  const logic = usePreceptorLogic({ user, onPreviewStudent, showToast });
  const {
    tabs,
    data, loading, unseenPases, unseenHistorial,
    activeTecId, setActiveTecId, showNomenclaturaModal, setShowNomenclaturaModal, selectedYearId,
    selectedCourseId, selectedPeriod, setSelectedPeriod, viewMode, setViewMode, pending, setPending,
    studentForm, setStudentForm, courseForm, setCourseForm, yearForm, setYearForm, userForm, setUserForm, tecForm, setTecForm,
    tecMode, setTecMode, editingTecId, setEditingTecId, previewDni, setPreviewDni, status, editingCourseId, setEditingCourseId,
    editingStudent, setEditingStudent, editingUserId, setEditingUserId, transferringAlumno, setTransferringAlumno, transferMotivo, setTransferMotivo,
    pasingStudent, setPasingStudent, paseForm, setPaseForm, pasesSearch, setPasesSearch, notesSearch, setNotesSearch, selectedSubjectId, setSelectedSubjectId,
    editingPase, setEditingPase, editingObsStudent, setEditingObsStudent, viewingProf, setViewingProf,
    selectedRacStudent, setSelectedRacStudent, showPreviasModal, setShowPreviasModal, dniError, setDniError,
    draggedMateriaIndex, studentsSearch, setStudentsSearch, racSearch, setRacSearch, materiasSearch, setMateriasSearch,
    viewingFichaStudent, setViewingFichaStudent, isEditingFicha, setIsEditingFicha, isMobile, isSelectionMode, setIsSelectionMode,
    selectedStudentIds, setSelectedStudentIds, showEndCycleModal, setShowEndCycleModal, endCycleForm, setEndCycleForm,
    filteredSubjects, rotationFilteredStudents, loadData, handleDragStart, handleDragEnter, handleDragEnd,
    currentCourse, getSubjectUnits, canManageStudents, canTransfer, gradeValue, post, saveGrades,
    updateCell, addStudent, deleteStudent, prepareEditCourse, editCourse, toggleCourseActive, execPase, undoPase,
    execTransfer, savePaseEdit, updateStudentField, saveObs, editStudent, handleSaveFicha, addCourse, addYear, editYear, deleteYear,
    createUser, editUser, startEditUser, deleteUser, handleResetPassword, setYearAsCurrent, copyYearInfo, handleSetPassword,
    startEndCycle, handleEndCycleConfirm, handleViewFicha, getHistorial, startCreateTec, startEditTec, addTec, editTec, removeTec,
    handleUpdateLocks, handleUpdateSystemMode, handleUpdateMobileLogin, handleUpdatePreceptorMode, handleUpdateRACModular,
    duplicateTec, savePrevia, deletePrevia,
    page, setPage, handleUpdatePeriods,
    onPrintAllCourses, onPrintSeguimientoGlobal, onPrintPlanillasCurso, onPrintRAC, onPrintParteDiario, onPrintParteDiarioGlobal
  } = logic;

  return (
    <div className="glass-card compact-panel" style={{ width: '100%', maxWidth: 'none' }}>
      <div className="panel-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '45px' }} />
          <div>
            <h1 style={{ fontSize: '1.2rem', marginBottom: '0.1rem', fontWeight: '800' }}>
              INDUSTRIAL N°6 "X BRIGADA AEREA"
            </h1>
            <h2 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '500' }}>
              Gestión de Calificaciones
            </h2>
          </div>
        </div>
        <div style={{ textAlign: 'right', flex: 1, paddingRight: '1rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Bienvenido, {user.nombre}</p>
          {currentCourse && <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Curso: {currentCourse.year_nombre} · {currentCourse.label}</p>}
          {status && <p className="panel-status" style={{ display: 'inline-block', marginTop: '0.25rem' }}>{status}</p>}
        </div>
        <div className="panel-actions">
          <button className="btn" style={{ background: 'rgba(255,255,255,0.1)' }} onClick={onLogout}>Cerrar Sesión</button>
        </div>
      </div>
      
      <div className="tab-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab-btn${page === tab.id ? ' active' : ''}`}
            onClick={() => setPage(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              ...(tab.id === 'settings' ? { marginLeft: 'auto' } : {})
            }}
          >
            {tab.icon && <span style={{ marginRight: '6px', display: 'flex', alignItems: 'center' }}>{tab.icon}</span>}
            {tab.label}
            {((tab.id === 'pases' && unseenPases) || (tab.id === 'historial' && unseenHistorial)) && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                background: '#ff4757',
                borderRadius: '50%',
                border: '2px solid #1e1b4b',
                boxShadow: '0 0 5px rgba(255, 71, 87, 0.5)'
              }} />
            )}
          </button>
        ))}
      </div>
      
      <div className="panel-filters">
        <label className="label">Año Lectivo:</label>
        <select className="input-field compact-select" value={selectedYearId} onChange={async (e) => { setPending({}); await loadData(null, Number(e.target.value)); }}>{data.academicYears.map((year) => <option key={year.id} value={year.id}>{year.nombre}</option>)}</select>

        {data.courses.length > 0 && (
          <>
            <label className="label">Curso:</label>
            <select className="input-field compact-select" value={selectedCourseId ?? ''} onChange={async (e) => { setPending({}); await loadData(Number(e.target.value), selectedYearId); }}>
              {data.courses.map((course) => <option key={course.id} value={course.id}>{course.label} · {simplifyTecName(course.tecnicatura_nombre)}</option>)}
            </select>
          </>
        )}

        {page === 'grades' && (
          <>
            {(viewMode === 'bySubject' || viewMode === 'taller') ? (
              <>
                <label className="label">Materia:</label>
                <select
                  className="input-field compact-select"
                  value={selectedSubjectId || ''}
                  onChange={(e) => setSelectedSubjectId(Number(e.target.value))}
                >
                  {filteredSubjects.map((s) => (
                    <option key={s.id} value={s.id}>{truncateSubject(s.nombre, isMobile)}</option>
                  ))}
                </select>
              </>
            ) : (
              <>
                <label className="label">Periodo:</label>
                <select className="input-field compact-select" value={selectedPeriod} onChange={(e) => setSelectedPeriod(Number(e.target.value))}>
                  {data.periodos.filter(p => {
                    const mode = data.config?.period_view_mode || 'completo';
                    if (mode === 'completo') return true;
                    if (mode === 'orientadores') return [1, 3, 5].includes(p.id);
                    if (mode === 'trimestrales') return [2, 4, 6].includes(p.id);
                    if (mode === 'finales') return [7, 8, 9, 10, 11].includes(p.id);
                    return true;
                  }).sort((a, b) => {
                    const order = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 10];
                    return order.indexOf(a.id) - order.indexOf(b.id);
                  }).map((periodo) => <option key={periodo.id} value={periodo.id}>{periodo.nombre}</option>)}
                </select>
              </>
            )}
          </>
        )}
        <div className="panel-stats"><span className="panel-stat"><Users size={15} /> {data.students.length} Alumnos</span><span className="panel-stat"><BookOpen size={15} /> {data.subjects.length} Materias</span></div>
      </div>

      {page === 'grades' && (
        <GradesPanel
          data={data} user={user} pending={pending} loading={loading} viewMode={viewMode} setViewMode={setViewMode}
          notesSearch={notesSearch} setNotesSearch={setNotesSearch} previewDni={previewDni} setPreviewDni={setPreviewDni}
          selectedSubjectId={selectedSubjectId} setSelectedSubjectId={setSelectedSubjectId} selectedPeriod={selectedPeriod} setSelectedPeriod={setSelectedPeriod}
          isMobile={isMobile} updateCell={updateCell} gradeValue={gradeValue} saveGrades={saveGrades} filteredSubjects={filteredSubjects}
          getSubjectUnits={getSubjectUnits} rotationFilteredStudents={rotationFilteredStudents} setShowNomenclaturaModal={setShowNomenclaturaModal}
          setEditingObsStudent={setEditingObsStudent}
        />
      )}

      {page === 'planillas' && (
        <PlanillasPanel
          user={user} handlePrintPlanillasCurso={onPrintPlanillasCurso} handlePrintAllCourses={onPrintAllCourses}
          handlePrintSeguimientoGlobal={onPrintSeguimientoGlobal} handlePrintParteDiario={onPrintParteDiario} handlePrintParteDiarioGlobal={onPrintParteDiarioGlobal}
        />
      )}

      {page === 'horarios' && (
        <HorariosPanel user={user} selectedYearId={selectedYearId} selectedCourseId={selectedCourseId} allCourses={data.allCourses} />
      )}

      {page === 'students' && (
        <StudentManager 
          user={user} data={data} loading={loading} studentForm={studentForm} setStudentForm={setStudentForm}
          studentsSearch={studentsSearch} setStudentsSearch={setStudentsSearch} canManageStudents={canManageStudents}
          canTransfer={canTransfer} addStudent={addStudent} deleteStudent={deleteStudent} setEditingStudent={setEditingStudent}
          setTransferringAlumno={setTransferringAlumno} setPasingStudent={setPasingStudent} setViewingFichaStudent={handleViewFicha}
          dniError={dniError} setDniError={setDniError} setSelectedStudentIds={setSelectedStudentIds}
          onEndCycle={() => setShowEndCycleModal(true)} onSetPassword={handleSetPassword}
        />
      )}

      {page === 'rac' && (
        <RACPanel
          data={data} selectedYearId={selectedYearId} racSearch={racSearch} setRacSearch={setRacSearch} handlePrintRAC={onPrintRAC}
          setSelectedRacStudent={setSelectedRacStudent} setShowPreviasModal={setShowPreviasModal} updateStudentField={updateStudentField}
          setViewingFichaStudent={handleViewFicha} isSelectionMode={isSelectionMode} setIsSelectionMode={setIsSelectionMode}
          selectedStudentIds={selectedStudentIds} setSelectedStudentIds={setSelectedStudentIds} onEndCycle={() => setShowEndCycleModal(true)}
        />
      )}

      {page === 'historial' && (
        <AuditPanel data={data} user={user} onDelete={async (action, logId) => { await post('historial_delete', { action, logId, courseId: data.selectedCourseId }); loadData(); }} />
      )}

      {page === 'materias' && (
        <AcademicManager user={user} data={data} selectedCourseId={selectedCourseId} materiasSearch={materiasSearch} setMateriasSearch={setMateriasSearch} handleUpdateLocks={handleUpdateLocks} />
      )}

      {page === 'pases' && (
        <PasesPanel user={user} data={data} pasesSearch={pasesSearch} setPasesSearch={setPasesSearch} setEditingPase={setEditingPase} undoPase={undoPase} onPreviewStudent={onPreviewStudent} />
      )}

      {page === 'anuncios' && (
        <AnunciosPanel data={data} post={post} loadData={loadData} />
      )}

      {page === 'settings' && (
        <SettingsPanel 
          user={user} data={data} isMobile={isMobile} editingUserId={editingUserId} setEditingUserId={setEditingUserId}
          userForm={userForm} setUserForm={setUserForm} emptyUser={logic.emptyUser} yearForm={yearForm} setYearForm={setYearForm}
          activeTecId={activeTecId} setActiveTecId={setActiveTecId} startEditUser={startEditUser} deleteUser={deleteUser} setViewingProf={setViewingProf}
          handleUpdateSystemMode={handleUpdateSystemMode} handleUpdatePreceptorMode={handleUpdatePreceptorMode}
          handleUpdateMobileLogin={handleUpdateMobileLogin} handleUpdatePeriods={handleUpdatePeriods} handleUpdateRACModular={handleUpdateRACModular}
          addYear={addYear} editYear={editYear} deleteYear={deleteYear} startCreateTec={startCreateTec} startEditTec={startEditTec} duplicateTec={duplicateTec} removeTec={removeTec}
          prepareEditCourse={prepareEditCourse} toggleCourseActive={toggleCourseActive} handleResetPassword={handleResetPassword}
          setYearAsCurrent={setYearAsCurrent} copyYearInfo={copyYearInfo} startEndCycle={startEndCycle}
        />
      )}

      <PreceptorModals
        data={data}
        showNomenclaturaModal={showNomenclaturaModal} setShowNomenclaturaModal={setShowNomenclaturaModal}
        showEndCycleModal={showEndCycleModal} setShowEndCycleModal={setShowEndCycleModal} endCycleForm={endCycleForm} setEndCycleForm={setEndCycleForm} selectedStudentIds={selectedStudentIds} selectedCourseId={selectedCourseId} handleEndCycleConfirm={handleEndCycleConfirm}
        showPreviasModal={showPreviasModal} setShowPreviasModal={setShowPreviasModal} selectedRacStudent={selectedRacStudent} setSelectedRacStudent={setSelectedRacStudent} savePrevia={savePrevia} deletePrevia={deletePrevia}
        tecMode={tecMode} setTecMode={setTecMode} tecForm={tecForm} setTecForm={setTecForm} addTec={addTec} editTec={editTec} draggedMateriaIndex={draggedMateriaIndex} handleDragStart={handleDragStart} handleDragEnter={handleDragEnter} handleDragEnd={handleDragEnd}
        editingCourseId={editingCourseId} setEditingCourseId={setEditingCourseId} courseForm={courseForm} setCourseForm={setCourseForm} editCourse={editCourse} yearOptions={yearOptions} divisionOptions={divisionOptions} shiftOptions={shiftOptions}
        transferringAlumno={transferringAlumno} setTransferringAlumno={setTransferringAlumno} transferMotivo={transferMotivo} setTransferMotivo={setTransferMotivo} execTransfer={execTransfer}
        editingStudent={editingStudent} setEditingStudent={setEditingStudent} editStudent={editStudent} dniError={dniError} setDniError={setDniError}
        pasingStudent={pasingStudent} setPasingStudent={setPasingStudent} paseForm={paseForm} setPaseForm={setPaseForm} execPase={execPase}
        editingPase={editingPase} setEditingPase={setEditingPase} savePaseEdit={savePaseEdit}
        editingObsStudent={editingObsStudent} setEditingObsStudent={setEditingObsStudent} saveObs={saveObs}
        viewingProf={viewingProf} setViewingProf={setViewingProf}
        editingUserId={editingUserId} setEditingUserId={setEditingUserId} userForm={userForm} setUserForm={setUserForm} createUser={createUser} editUser={editUser}
        viewingFichaStudent={viewingFichaStudent} setViewingFichaStudent={setViewingFichaStudent} isEditingFicha={isEditingFicha} setIsEditingFicha={setIsEditingFicha} handleSaveFicha={handleSaveFicha} studentForm={studentForm} setStudentForm={setStudentForm} getHistorial={getHistorial}
      />
    </div>
  );
}
