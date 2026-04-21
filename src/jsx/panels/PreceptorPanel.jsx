import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRightLeft, Book, BookOpen, ClipboardList, Copy, Eye, FileText,
  GraduationCap, GripVertical, History, Lock, Megaphone, Plus, Printer,
  Save, Search, Settings, Smartphone, Trash2, Unlock, UserCog, Users, Wrench,
  AlertTriangle, CheckCircle2
} from 'lucide-react';

import {
  yearOptions, divisionOptions, shiftOptions, workshopI, workshopII, allWorkshopNames,
  emptyStudent, emptyCourse, emptyYear, emptyUser, emptyTec,
  truncate, truncateSubject, draftTec, simplifyTecName, formatGender, formatDNI, numberToWords
} from '../functions/PreceptorHelpers';

import { handlePrintAllCourses } from '../prints/SeguimientoA4';
import { handlePrintSeguimientoGlobal } from '../prints/SeguimientoAllA4';
import { handlePrintPlanillasCurso } from '../prints/CalificacionesA4';
import { handlePrintRAC } from '../prints/RACA4';
import { getCoursePreceptor } from '../functions/PreceptorHelpers';

import MultiSelect from '../UI/MultiSelect';
import PreviasModal from '../components/PreviasModal';
import EndCycleModal from '../components/EndCycleModal';
import TecnicaturaModal from '../components/TecnicaturaModal';
import CourseModal from '../components/CourseModal';
import TransferStudentModal from '../components/TransferStudentModal';
import EditStudentModal from '../components/EditStudentModal';
import PaseModal from '../components/PaseModal';
import EditPaseModal from '../components/EditPaseModal';
import ObsModal from '../components/ObsModal';
import ProfAssignmentsModal from '../components/ProfAssignmentsModal';
import UserFormModal from '../components/UserFormModal';
import Modal from '../UI/Modal';
import GradesPanel from './GradesPanel';
import StudentManager from './StudentManager';
import RACPanel from './RACPanel';
import AuditPanel from './AuditPanel';
import SettingsPanel from './SettingsPanel';
import AcademicManager from './AcademicManager';
import PlanillasPanel from './PlanillasPanel';
import PasesPanel from './PasesPanel';
import AnunciosPanel from './AnunciosPanel';
import StudentFichaModal from '../components/StudentFichaModal';
import { apiRequest, apiLoadData } from '../functions/apiService';
import '../../css/PreceptorPanel.css';

export default function PreceptorPanel({ user, onLogout, onPreviewStudent, showToast }) {
  const tabs = useMemo(() => {
    const list = [{ id: 'grades', label: 'Notas', icon: <ClipboardList size={16} /> }];
    if (user.rol !== 'profesor') {
      list.push({ id: 'materias', label: 'Materias', icon: <Book size={16} /> });
    }
    if (user.rol !== 'profesor' && user.rol !== 'preceptor_taller' && user.rol !== 'preceptor_ef') {
      list.push({ id: 'students', label: 'Alumnos', icon: <Users size={16} /> });
    }
    if (user.rol === 'admin' || user.rol === 'secretaria_de_alumnos' || user.rol === 'jefe_de_auxiliares' || user.rol === 'director' || user.rol === 'vicedirector') {
      list.push({ id: 'pases', label: 'Pases', icon: <ArrowRightLeft size={16} /> });
    }
    if (['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'preceptor', 'preceptor_taller', 'preceptor_ef', 'director', 'vicedirector'].includes(user.rol)) {
      if (user.rol !== 'preceptor_taller' && user.rol !== 'preceptor_ef') {
        list.push({ id: 'rac', label: 'RAC', icon: <FileText size={16} /> });
      }
      list.push({ id: 'historial', label: 'Historial', icon: <History size={16} /> });
    }
    if (['admin', 'secretaria_de_alumnos', 'director', 'vicedirector'].includes(user.rol)) {
      list.push({ id: 'anuncios', label: 'Anuncios', icon: <Megaphone size={16} /> });
      list.push({ id: 'settings', label: 'Ajustes', icon: <UserCog size={16} /> });
    }
    list.push({ id: 'planillas', label: 'Generar Planillas', icon: <Save size={16} /> });
    return list;
  }, [user.rol]);

    const logic = usePreceptorLogic({ user, onPreviewStudent, showToast });
  const {
    location, navigate, data, setData, loading, setLoading, unseenPases, setUnseenPases, unseenHistorial, setUnseenHistorial,
    activeTecId, setActiveTecId, showNomenclaturaModal, setShowNomenclaturaModal, selectedYearId, setSelectedYearId,
    selectedCourseId, setSelectedCourseId, selectedPeriod, setSelectedPeriod, viewMode, setViewMode, pending, setPending,
    studentForm, setStudentForm, courseForm, setCourseForm, yearForm, setYearForm, userForm, setUserForm, tecForm, setTecForm,
    tecMode, setTecMode, editingTecId, setEditingTecId, previewDni, setPreviewDni, status, setStatus, editingCourseId, setEditingCourseId,
    editingStudent, setEditingStudent, editingUserId, setEditingUserId, transferringAlumno, setTransferringAlumno, transferMotivo, setTransferMotivo,
    pasingStudent, setPasingStudent, paseForm, setPaseForm, pasesSearch, setPasesSearch, notesSearch, setNotesSearch, selectedSubjectId, setSelectedSubjectId,
    selectedGroup, setSelectedGroup, editingPase, setEditingPase, editingObsStudent, setEditingObsStudent, viewingProf, setViewingProf,
    selectedRacStudent, setSelectedRacStudent, showPreviasModal, setShowPreviasModal, previasSearch, setPreviasSearch, dniError, setDniError,
    draggedMateriaIndex, setDraggedMateriaIndex, studentsSearch, setStudentsSearch, racSearch, setRacSearch, materiasSearch, setMateriasSearch,
    viewingFichaStudent, setViewingFichaStudent, isEditingFicha, setIsEditingFicha, isMobile, setIsMobile, isSelectionMode, setIsSelectionMode,
    selectedStudentIds, setSelectedStudentIds, showEndCycleModal, setShowEndCycleModal, endCycleForm, setEndCycleForm,
    truncateSubject, filteredSubjects, rotationFilteredStudents, roleText, loadData, handleDragStart, handleDragEnter, handleDragEnd,
    currentCourse, getSubjectUnits, gradeUnits, gradeWidth, canManageStudents, canTransfer, gradeValue, post, saveGrades, saveFicha,
    updateCell, addStudent, deleteStudent, transferStudent, prepareEditCourse, editCourse, toggleCourseActive, execPase, undoPase,
    execTransfer, savePaseEdit, updateStudentField, saveObs, editStudent, handleSaveFicha, addCourse, addYear, editYear, deleteYear,
    createUser, editUser, startEditUser, deleteUser, handleResetPassword, setYearAsCurrent, copyYearInfo, handleSetPassword,
    startEndCycle, handleEndCycleConfirm, handleViewFicha, getHistorial, startCreateTec, startEditTec, addTec, editTec, removeTec,
    handleUpdateLocks, handleUpdateSystemMode, handleUpdateMobileLogin, handleUpdatePreceptorMode, duplicateTec, savePrevia, deletePrevia,
    page, setPage, handleUpdatePeriods
  } = logic;

  if (viewingFichaStudent) {
    return (
      <div className="full-page-view preceptor-panel-full-page" style={{ padding: isMobile ? '1rem' : '2.5rem' }}>
        <div className="glass-card preceptor-panel-full-page-inner" style={{ padding: isMobile ? '1.5rem' : '3.5rem' }}>
          <StudentFichaModal 
            student={viewingFichaStudent}
            onClose={() => setViewingFichaStudent(null)}
            onSave={handleSaveFicha}
            isEditing={isEditingFicha}
            setIsEditing={setIsEditingFicha}
            studentForm={studentForm}
            setStudentForm={setStudentForm}
            fullPage={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card compact-panel preceptor-panel-compact">
      <div className="panel-toolbar">
        <div className="preceptor-panel-header-logo-container">
          <img src="/logo.png" alt="Logo" className="preceptor-panel-header-logo" />
          <div>
            <h1 className="preceptor-panel-header-title">
              INDUSTRIAL N°6 "X BRIGADA AEREA"
            </h1>
            <h2 className="preceptor-panel-header-subtitle">
              Gestión de Calificaciones
            </h2>
          </div>
        </div>
        <div className="preceptor-panel-user-info">
          <p className="preceptor-panel-user-welcome">Bienvenido, {user.nombre}</p>
          {currentCourse && <p className="preceptor-panel-course-info">Curso: {currentCourse.year_nombre} · {currentCourse.label}</p>}
          {status && <p className="panel-status preceptor-panel-status-msg">{status}</p>}
        </div>
        <div className="panel-actions">
          <button className="btn preceptor-panel-logout-btn" onClick={onLogout}>Cerrar Sesión</button>
        </div>
      </div>
      <div className="tab-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab-btn${page === tab.id ? ' active' : ''} preceptor-panel-tab-btn`}
            onClick={() => setPage(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              ...(tab.id === 'settings' ? { marginLeft: 'auto' } : {})
            }}
          >
            {tab.icon && <span className="preceptor-panel-tab-icon">{tab.icon}</span>}
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
          data={data}
          user={user}
          pending={pending}
          loading={loading}
          viewMode={viewMode}
          setViewMode={setViewMode}
          notesSearch={notesSearch}
          setNotesSearch={setNotesSearch}
          previewDni={previewDni}
          setPreviewDni={setPreviewDni}
          selectedSubjectId={selectedSubjectId}
          setSelectedSubjectId={setSelectedSubjectId}
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          isMobile={isMobile}
          updateCell={updateCell}
          gradeValue={gradeValue}
          saveGrades={saveGrades}
          filteredSubjects={filteredSubjects}
          getSubjectUnits={getSubjectUnits}
          rotationFilteredStudents={rotationFilteredStudents}
          setShowNomenclaturaModal={setShowNomenclaturaModal}
          setEditingObsStudent={setEditingObsStudent}
        />
      )}

      {page === 'planillas' && (
        <PlanillasPanel
          user={user}
          handlePrintPlanillasCurso={onPrintPlanillasCurso}
          handlePrintAllCourses={onPrintAllCourses}
          handlePrintSeguimientoGlobal={onPrintSeguimientoGlobal}
        />
      )}

      {page === 'students' && (
        <StudentManager 
          user={user} data={data} loading={loading}
          studentForm={studentForm} setStudentForm={setStudentForm}
          studentsSearch={studentsSearch} setStudentsSearch={setStudentsSearch}
          canManageStudents={canManageStudents}
          canTransfer={canTransfer}
          addStudent={addStudent}
          deleteStudent={deleteStudent}
          setEditingStudent={setEditingStudent}
          setTransferringAlumno={setTransferringAlumno}
          setPasingStudent={setPasingStudent}
          setViewingFichaStudent={handleViewFicha}
          dniError={dniError} setDniError={setDniError}
          setSelectedStudentIds={setSelectedStudentIds}
          onEndCycle={() => setShowEndCycleModal(true)}
          onSetPassword={handleSetPassword}
        />
      )}

      {page === 'rac' && (
        <RACPanel
          data={data} selectedYearId={selectedYearId} racSearch={racSearch} setRacSearch={setRacSearch}
          handlePrintRAC={onPrintRAC} setSelectedRacStudent={setSelectedRacStudent} setShowPreviasModal={setShowPreviasModal}
          updateStudentField={updateStudentField}
          setViewingFichaStudent={handleViewFicha}
          isSelectionMode={isSelectionMode}
          setIsSelectionMode={setIsSelectionMode}
          selectedStudentIds={selectedStudentIds}
          setSelectedStudentIds={setSelectedStudentIds}
          onEndCycle={() => setShowEndCycleModal(true)}
        />
      )}

      {page === 'historial' && (
        <AuditPanel
          data={data}
          user={user}
          onDelete={async (action, logId) => {
            await post('historial_delete', { action, logId, courseId: data.selectedCourseId });
            loadData();
          }}
        />
      )}

      {page === 'materias' && (
        <AcademicManager
          user={user} data={data} selectedCourseId={selectedCourseId}
          materiasSearch={materiasSearch} setMateriasSearch={setMateriasSearch}
          handleUpdateLocks={handleUpdateLocks}
        />
      )}

      {page === 'pases' && (
        <PasesPanel
          user={user}
          data={data} pasesSearch={pasesSearch} setPasesSearch={setPasesSearch}
          setEditingPase={setEditingPase} undoPase={undoPase}
          onPreviewStudent={onPreviewStudent}
        />
      )}

      {page === 'anuncios' && (
        <AnunciosPanel
          data={data} post={post} loadData={loadData}
        />
      )}

      {page === 'settings' && (
        <SettingsPanel 
          user={user} data={data} isMobile={isMobile}
          editingUserId={editingUserId} setEditingUserId={setEditingUserId}
          userForm={userForm} setUserForm={setUserForm} emptyUser={emptyUser}
          yearForm={yearForm} setYearForm={setYearForm}
          activeTecId={activeTecId} setActiveTecId={setActiveTecId}
          startEditUser={startEditUser} deleteUser={deleteUser} setViewingProf={setViewingProf}
          handleUpdateSystemMode={handleUpdateSystemMode} 
          handleUpdatePreceptorMode={handleUpdatePreceptorMode}
          handleUpdateMobileLogin={handleUpdateMobileLogin}
          handleUpdatePeriods={handleUpdatePeriods}
          addYear={addYear} editYear={editYear} deleteYear={deleteYear}
          startCreateTec={startCreateTec} startEditTec={startEditTec} duplicateTec={duplicateTec} removeTec={removeTec}
          prepareEditCourse={prepareEditCourse} toggleCourseActive={toggleCourseActive}
          handleUpdateMobileLogin={handleUpdateMobileLogin} handleResetPassword={handleResetPassword}
          setYearAsCurrent={setYearAsCurrent} copyYearInfo={copyYearInfo} startEndCycle={startEndCycle}
        />
      )}

      {showNomenclaturaModal && (
        <Modal title="Nomenclatura de Calificación" onClose={() => setShowNomenclaturaModal(false)}>
          <div className="nomenclatura-container">
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.2rem', lineHeight: '1.4' }}>
              Escala de valoración utilizada para los informes orientadores y planillas oficiales de la institución.
            </p>
            <table className="nomenclatura-table">
              <thead>
                <tr>
                  <th className="preceptor-panel-nomenclatura-th">Sigla</th>
                  <th className="preceptor-panel-nomenclatura-th">Descripción</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="preceptor-panel-nomenclatura-td"><strong>AE</strong></td><td className="preceptor-panel-nomenclatura-td">Acredita con Excelencia (10)</td></tr>
                <tr><td className="preceptor-panel-nomenclatura-td"><strong>AD</strong></td><td className="preceptor-panel-nomenclatura-td">Acredita con Distinción (9)</td></tr>
                <tr><td className="preceptor-panel-nomenclatura-td"><strong>AMS</strong></td><td className="preceptor-panel-nomenclatura-td">Acredita Muy Satisfactoriamente (8)</td></tr>
                <tr><td className="preceptor-panel-nomenclatura-td"><strong>A</strong></td><td className="preceptor-panel-nomenclatura-td">Acredita (7)</td></tr>
                <tr><td className="preceptor-panel-nomenclatura-td"><strong>NA</strong></td><td className="preceptor-panel-nomenclatura-td">No Acredita (1-6)</td></tr>
                <tr><td className="preceptor-panel-nomenclatura-td"><strong>S/C</strong></td><td className="preceptor-panel-nomenclatura-td">Sin Calificar (*)</td></tr>
              </tbody>
            </table>
            <div className="preceptor-panel-role-info">
              <p className="preceptor-panel-role-text">
                Nota: Las calificaciones definitivas se expresan en números enteros (1 al 10).
              </p>
            </div>
          </div>
        </Modal>
      )}

            <EndCycleModal show={showEndCycleModal} onClose={() => setShowEndCycleModal(false)} selectedStudentIds={selectedStudentIds} data={data} selectedCourseId={selectedCourseId} endCycleForm={endCycleForm} setEndCycleForm={setEndCycleForm} handleEndCycleConfirm={handleEndCycleConfirm} />
      <PreviasModal student={selectedRacStudent} previas={data.previas.filter(p => p.alumno_id === selectedRacStudent?.id)} subjects={data.allSubjects} onSave={savePrevia} onDelete={deletePrevia} onClose={() => { setShowPreviasModal(false); setSelectedRacStudent(null); }} />
      <TecnicaturaModal show={tecMode !== 'list'} onClose={() => setTecMode('list')} tecMode={tecMode} tecForm={tecForm} setTecForm={setTecForm} addTec={addTec} editTec={editTec} draggedMateriaIndex={draggedMateriaIndex} handleDragStart={handleDragStart} handleDragEnter={handleDragEnter} handleDragEnd={handleDragEnd} />
      <CourseModal show={!!editingCourseId} onClose={() => setEditingCourseId(null)} data={data} courseForm={courseForm} setCourseForm={setCourseForm} editCourse={editCourse} />
      <TransferStudentModal show={!!transferringAlumno} onClose={() => setTransferringAlumno(null)} data={data} transferringAlumno={transferringAlumno} transferMotivo={transferMotivo} setTransferMotivo={setTransferMotivo} execTransfer={execTransfer} />
      <EditStudentModal show={!!editingStudent} onClose={() => { setEditingStudent(null); setDniError(''); }} editingStudent={editingStudent} setEditingStudent={setEditingStudent} dniError={dniError} setDniError={setDniError} editStudent={editStudent} />
      <PaseModal show={!!pasingStudent} onClose={() => setPasingStudent(null)} pasingStudent={pasingStudent} paseForm={paseForm} setPaseForm={setPaseForm} execPase={execPase} />
      <EditPaseModal show={!!editingPase} onClose={() => setEditingPase(null)} data={data} editingPase={editingPase} setEditingPase={setEditingPase} savePaseEdit={savePaseEdit} />
      <ObsModal show={!!editingObsStudent} onClose={() => setEditingObsStudent(null)} editingObsStudent={editingObsStudent} setEditingObsStudent={setEditingObsStudent} saveObs={saveObs} />
      <ProfAssignmentsModal show={!!viewingProf} onClose={() => setViewingProf(null)} data={data} viewingProf={viewingProf} />
      <UserFormModal show={!!editingUserId} onClose={() => { setEditingUserId(null); setUserForm(emptyUser); }} data={data} userForm={userForm} setUserForm={setUserForm} editingUserId={editingUserId} createUser={createUser} editUser={editUser} />
      
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
    </div>
  );
}
