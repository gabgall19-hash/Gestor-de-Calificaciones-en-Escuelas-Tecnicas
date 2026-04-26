import React, { useMemo } from 'react';
import {
  ArrowRightLeft,
  Book,
  BookOpen,
  Calendar,
  ClipboardList,
  FileText,
  History,
  Megaphone,
  LogOut,
  Menu,
  Save,
  UserCog,
  Users,
  X
} from 'lucide-react';
import { emptyUser, simplifyTecName } from '../functions/PreceptorHelpers';
import usePreceptorLogic from '../states/usePreceptorLogic';
import PreceptorModals from '../components/PreceptorModals';
import StudentFichaModal from '../components/StudentFichaModal';
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
import AttendancePanel from './AttendancePanel';

export default function PreceptorPanel({ user, onLogout, onPreviewStudent, showToast }) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const logic = usePreceptorLogic({ user, onPreviewStudent, showToast });
  const {
    data,
    loading,
    page,
    setPage,
    status,
    isMobile,
    unseenPases,
    unseenHistorial,
    selectedYearId,
    selectedCourseId,
    selectedPeriod,
    setSelectedPeriod,
    viewMode,
    setViewMode,
    loadData,
    pending,
    notesSearch,
    setNotesSearch,
    previewDni,
    setPreviewDni,
    selectedSubjectId,
    setSelectedSubjectId,
    updateCell,
    gradeValue,
    saveGrades,
    filteredSubjects,
    getSubjectUnits,
    rotationFilteredStudents,
    setShowNomenclaturaModal,
    setEditingObsStudent,
    studentForm,
    setStudentForm,
    studentsSearch,
    setStudentsSearch,
    canManageStudents,
    canTransfer,
    addStudent,
    deleteStudent,
    setEditingStudent,
    setTransferringAlumno,
    setPasingStudent,
    handleViewFicha,
    dniError,
    setDniError,
    setSelectedStudentIds,
    setShowEndCycleModal,
    handleSetPassword,
    racSearch,
    setRacSearch,
    onPrintRAC_Student,
    onPrintRAC_AllStudents,
    setSelectedRacStudent,
    setShowPreviasModal,
    updateStudentField,
    isSelectionMode,
    setIsSelectionMode,
    selectedStudentIds,
    materiasSearch,
    setMateriasSearch,
    handleUpdateLocks,
    pasesSearch,
    setPasesSearch,
    setEditingPase,
    undoPase,
    post,
    get,
    userForm,
    setUserForm,
    yearForm,
    setYearForm,
    activeTecId,
    setActiveTecId,
    editingUserId,
    setEditingUserId,
    startEditUser,
    deleteUser,
    setViewingProf,
    handleUpdateSystemMode,
    handleUpdatePreceptorMode,
    handleUpdateMobileLogin,
    handleUpdateRACModular,
    addYear,
    editYear,
    deleteYear,
    startCreateTec,
    startEditTec,
    duplicateTec,
    removeTec,
    prepareEditCourse,
    toggleCourseActive,
    handleResetPassword,
    setYearAsCurrent,
    copyYearInfo,
    startEndCycle,
    onPrintPlanillasCurso,
    onPrintAllCourses,
    onPrintSeguimientoGlobal,
    onPrintParteDiario,
    onPrintParteDiarioGlobal,
    onPrintParteConInformacion,
    viewingFichaStudent,
    setViewingFichaStudent,
    handleSaveFicha,
    isEditingFicha,
    setIsEditingFicha,
    showNomenclaturaModal,
    showEndCycleModal,
    endCycleForm,
    setEndCycleForm,
    handleEndCycleConfirm,
    showPreviasModal,
    selectedRacStudent,
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
    transferMotivo,
    setTransferMotivo,
    execTransfer,
    editingStudent,
    editStudent,
    pasingStudent,
    paseForm,
    setPaseForm,
    execPase,
    editingPase,
    savePaseEdit,
    editingObsStudent,
    saveObs,
    viewingProf,
    createUser,
    editUser,
    truncateSubject,
    getHistorial
  } = logic;

  const tabs = useMemo(() => {
    const list = [];
    if (user.rol !== 'profesor') list.push({ id: 'asistencia', label: 'Asistencia', icon: <Calendar size={16} /> });
    list.push({ id: 'grades', label: 'Notas', icon: <ClipboardList size={16} /> });
    if (user.rol !== 'profesor' && user.rol !== 'preceptor_ef') list.push({ id: 'materias', label: 'Materias', icon: <Book size={16} /> });
    if (user.rol !== 'profesor' && user.rol !== 'preceptor_taller' && user.rol !== 'preceptor_ef') {
      list.push({ id: 'students', label: 'Alumnos', icon: <Users size={16} /> });
    }
    if (['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'].includes(user.rol)) {
      list.push({ id: 'pases', label: 'Pases', icon: <ArrowRightLeft size={16} /> });
    }
    if (['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'preceptor', 'preceptor_taller', 'preceptor_ef', 'director', 'vicedirector'].includes(user.rol)) {
      if (user.rol !== 'preceptor_taller' && user.rol !== 'preceptor_ef') list.push({ id: 'rac', label: 'RAC', icon: <FileText size={16} /> });
      list.push({ id: 'historial', label: 'Historial', icon: <History size={16} /> });
    }
    if (['admin', 'secretaria_de_alumnos', 'director', 'vicedirector'].includes(user.rol)) {
      list.push({ id: 'anuncios', label: 'Anuncios', icon: <Megaphone size={16} /> });
      list.push({ id: 'settings', label: 'Ajustes', icon: <UserCog size={16} /> });
    }
    if (!isMobile && user.rol !== 'profesor') list.push({ id: 'horarios', label: 'Horarios', icon: <Calendar size={16} /> });
    list.push({ id: 'planillas', label: 'Generar Planillas', icon: <Save size={16} /> });
    return isMobile ? list.filter((tab) => tab.id !== 'rac') : list;
  }, [isMobile, user.rol]);

  React.useEffect(() => {
    if (isMobile && (page === 'rac' || page === 'horarios')) {
      setPage('grades');
    }
  }, [isMobile, page, setPage]);

  if (!data) return <p>Cargando datos...</p>;

  if (viewingFichaStudent) {
    return (
      <div className="full-page-view" style={{ minHeight: '100vh', padding: isMobile ? '1rem' : '2.5rem', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        <div className="glass-card" style={{ maxWidth: '1000px', width: '100%', padding: isMobile ? '1.5rem' : '3.5rem', backdropFilter: 'blur(20px)', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
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
    <div className="glass-card compact-panel" style={{ width: '100%', maxWidth: 'none' }}>
      <div className="panel-toolbar">
        <div className="logo-section" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '45px' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ marginBottom: '0.1rem', fontWeight: '800' }}>INDUSTRIAL N°6 "X BRIGADA AEREA"</h1>
              {isMobile && <button 
                className="btn-logout-icon" 
                onClick={onLogout}
                title="Cerrar Sesión"
                style={{ 
                  width: '45px',
                  height: '45px',
                  background: 'rgba(239, 68, 68, 0.16)', 
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#f87171',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <LogOut size={20} />
              </button>}
            </div>
            <h2 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '500' }}>Gestión de Calificaciones</h2>
          </div>
        </div>
        {!isMobile && <div className="welcome-section" style={{ textAlign: 'right', flex: 1, paddingRight: '1rem', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Bienvenido, {user.rol === 'profesor' ? `Prof. ${user.nombre}` : user.nombre}</p>
          {status && <p className="panel-status" style={{ display: 'inline-block', marginTop: '0.25rem' }}>{status}</p>}
          </div>
          
            <button
              className="btn-logout-icon"
              onClick={onLogout}
              title="Cerrar SesiÃ³n"
              style={{
                width: '45px',
                height: '45px',
                background: 'rgba(239, 68, 68, 0.14)',
                border: '1px solid rgba(239, 68, 68, 0.32)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f87171',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <LogOut size={18} />
            </button>
          
        </div>}
        <div className="panel-actions">
          {isMobile && (
            <button 
              className="btn btn-hamburger-mobile" 
              style={{ width: '45px', height: '45px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu size={20} />
            </button>
          )}
        </div>
      </div>
      {isMobile && (
        <div style={{ marginTop: '-0.1rem', marginBottom: '0.55rem', textAlign: 'left', paddingLeft: '0.1rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', margin: 0, lineHeight: 1.25 }}>
            Bienvenido, {user.rol === 'profesor' ? `Prof. ${user.nombre}` : user.nombre}
          </p>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      <div className={`mobile-menu-overlay ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(false)}>
        <div className="mobile-menu-drawer" onClick={(e) => e.stopPropagation()}>
          <div className="menu-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/logo.png" alt="Logo" style={{ height: '30px' }} />
              <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Menú</span>
            </div>
            <button className="btn" style={{ background: 'transparent', padding: '5px' }} onClick={() => setIsMenuOpen(false)}>
              <X size={24} />
            </button>
          </div>

          <div className="menu-nav">
            {tabs.map((tab) => (
              <div 
                key={tab.id}
                className={`menu-item ${page === tab.id ? 'active' : ''}`}
                onClick={() => {
                  setPage(tab.id);
                  setIsMenuOpen(false);
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {((tab.id === 'pases' && unseenPases) || (tab.id === 'historial' && unseenHistorial)) && (
                  <span style={{ width: '8px', height: '8px', background: '#ff4757', borderRadius: '50%', position: 'absolute', right: '15px' }} />
                )}
              </div>
            ))}
          </div>

          <div className="menu-footer">
            <button 
              className="btn" 
              style={{ width: '100%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }} 
              onClick={onLogout}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      <div className="tab-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab-btn${page === tab.id ? ' active' : ''}`}
            onClick={() => setPage(tab.id)}
            style={{ display: 'flex', alignItems: 'center', position: 'relative', ...(tab.id === 'settings' ? { marginLeft: 'auto' } : {}) }}
          >
            {tab.icon && <span style={{ marginRight: '6px', display: 'flex', alignItems: 'center' }}>{tab.icon}</span>}
            {tab.label}
            {((tab.id === 'pases' && unseenPases) || (tab.id === 'historial' && unseenHistorial)) && (
              <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: '#ff4757', borderRadius: '50%', border: '2px solid #1e1b4b' }} />
            )}
          </button>
        ))}
      </div>

      <div className="panel-filters">
        <div className="filter-item">
          <label className="label">Año:</label>
          <select className="input-field compact-select" value={selectedYearId} onChange={async (e) => { await loadData(null, Number(e.target.value)); }}>
            {data.academicYears.map((year) => <option key={year.id} value={year.id}>{year.nombre}</option>)}
          </select>
        </div>

        {data.courses.length > 0 && (
          <div className="filter-item">
            <label className="label" style={{ fontSize: isMobile ? '0.7rem' : '0.76rem', whiteSpace: 'nowrap' }}>Curso:</label>
            <select className="input-field compact-select" value={selectedCourseId ?? ''} onChange={async (e) => { await loadData(Number(e.target.value), selectedYearId); }}>
              {data.courses.map((course) => <option key={course.id} value={course.id}>{course.label} · {simplifyTecName(course.tecnicatura_nombre)}</option>)}
            </select>
          </div>
        )}

        {page === 'grades' && (
          <>
            {(viewMode === 'bySubject' || viewMode === 'taller') ? (
              <div className="filter-item" style={{ gridColumn: isMobile ? '1' : 'auto' }}>
                <label className="label" style={{ fontSize: isMobile ? '0.7rem' : '0.76rem', whiteSpace: 'nowrap' }}>Materia:</label>
                <select className="input-field compact-select" value={selectedSubjectId || ''} onChange={(e) => setSelectedSubjectId(Number(e.target.value))}>
                  {filteredSubjects.map((subject) => <option key={subject.id} value={subject.id}>{truncateSubject(subject.nombre, isMobile)}</option>)}
                </select>
              </div>
            ) : (
              <div className="filter-item">
                <label className="label" style={{ fontSize: isMobile ? '0.7rem' : '0.76rem', whiteSpace: 'nowrap' }}>Periodo:</label>
                <select className="input-field compact-select" value={selectedPeriod} onChange={(e) => setSelectedPeriod(Number(e.target.value))}>
                  {data.periodos.map((periodo) => <option key={periodo.id} value={periodo.id}>{periodo.nombre}</option>)}
                </select>
              </div>
            )}
          </>
        )}

        <div className="panel-stats">
          <span className="panel-stat"><Users size={15} /> {data.students.length} Alumnos</span>
          <span className="panel-stat"><BookOpen size={15} /> {data.subjects.length} Materias</span>
        </div>
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

      {page === 'asistencia' && (
        <AttendancePanel
          data={data}
          user={user}
          selectedCourseId={selectedCourseId}
          apiService={{ get, post }}
          showToast={showToast}
          isMobile={isMobile}
          onPrintInformacion={onPrintParteConInformacion}
        />
      )}

      {page === 'planillas' && (
        <PlanillasPanel
          user={user}
          handlePrintPlanillasCurso={onPrintPlanillasCurso}
          handlePrintAllCourses={onPrintAllCourses}
          handlePrintSeguimientoGlobal={onPrintSeguimientoGlobal}
          handlePrintParteDiario={onPrintParteDiario}
          handlePrintParteDiarioGlobal={onPrintParteDiarioGlobal}
        />
      )}

      {page === 'horarios' && !isMobile && <HorariosPanel user={user} selectedYearId={selectedYearId} selectedCourseId={selectedCourseId} allCourses={data.allCourses} subjects={data.subjects} allSubjects={data.allSubjects} users={data.users} />}

      {page === 'students' && (
        <StudentManager
          user={user}
          data={data}
          loading={loading}
          studentForm={studentForm}
          setStudentForm={setStudentForm}
          studentsSearch={studentsSearch}
          setStudentsSearch={setStudentsSearch}
          canManageStudents={canManageStudents}
          canTransfer={canTransfer}
          addStudent={addStudent}
          deleteStudent={deleteStudent}
          setEditingStudent={setEditingStudent}
          setTransferringAlumno={setTransferringAlumno}
          setPasingStudent={setPasingStudent}
          setViewingFichaStudent={handleViewFicha}
          dniError={dniError}
          setDniError={setDniError}
          setSelectedStudentIds={setSelectedStudentIds}
          onEndCycle={() => setShowEndCycleModal(true)}
          onSetPassword={handleSetPassword}
        />
      )}

      {page === 'rac' && !isMobile && (
        <RACPanel
          data={data}
          selectedYearId={selectedYearId}
          racSearch={racSearch}
          setRacSearch={setRacSearch}
          handlePrintRAC_Student={onPrintRAC_Student}
          handlePrintRAC_AllStudents={onPrintRAC_AllStudents}
          setSelectedRacStudent={setSelectedRacStudent}
          setShowPreviasModal={setShowPreviasModal}
          updateStudentField={updateStudentField}
          setViewingFichaStudent={handleViewFicha}
          isSelectionMode={isSelectionMode}
          setIsSelectionMode={setIsSelectionMode}
          selectedStudentIds={selectedStudentIds}
          setSelectedStudentIds={setSelectedStudentIds}
          onEndCycle={() => setShowEndCycleModal(true)}
        />
      )}

      {page === 'historial' && <AuditPanel data={data} user={user} onDelete={async (action, logId) => { await post('historial_delete', { action, logId, courseId: data.selectedCourseId }); loadData(); }} />}
      {page === 'materias' && <AcademicManager isMobile={isMobile} user={user} data={data} selectedCourseId={selectedCourseId} materiasSearch={materiasSearch} setMateriasSearch={setMateriasSearch} handleUpdateLocks={handleUpdateLocks} />}
      {page === 'pases' && <PasesPanel isMobile={isMobile} user={user} data={data} pasesSearch={pasesSearch} setPasesSearch={setPasesSearch} setEditingPase={setEditingPase} undoPase={undoPase} onPreviewStudent={onPreviewStudent} onViewFicha={handleViewFicha} />}
      {page === 'anuncios' && <AnunciosPanel isMobile={isMobile} data={data} post={post} loadData={loadData} />}

      {page === 'settings' && (
        <SettingsPanel
          user={user}
          data={data}
          isMobile={isMobile}
          editingUserId={editingUserId}
          setEditingUserId={setEditingUserId}
          userForm={userForm}
          setUserForm={setUserForm}
          emptyUser={emptyUser}
          yearForm={yearForm}
          setYearForm={setYearForm}
          activeTecId={activeTecId}
          setActiveTecId={setActiveTecId}
          startEditUser={startEditUser}
          deleteUser={deleteUser}
          setViewingProf={setViewingProf}
          handleUpdateSystemMode={handleUpdateSystemMode}
          handleUpdatePreceptorMode={handleUpdatePreceptorMode}
          handleUpdateMobileLogin={handleUpdateMobileLogin}
          handleUpdatePeriods={logic.handleUpdatePeriods}
          handleUpdateRACModular={handleUpdateRACModular}
          addYear={addYear}
          editYear={editYear}
          deleteYear={deleteYear}
          startCreateTec={startCreateTec}
          startEditTec={startEditTec}
          duplicateTec={duplicateTec}
          removeTec={removeTec}
          prepareEditCourse={prepareEditCourse}
          toggleCourseActive={toggleCourseActive}
          handleResetPassword={handleResetPassword}
          setYearAsCurrent={setYearAsCurrent}
          copyYearInfo={copyYearInfo}
          startEndCycle={startEndCycle}
        />
      )}

      <PreceptorModals
        data={data}
        selectedStudentIds={selectedStudentIds}
        selectedRacStudent={selectedRacStudent}
        showNomenclaturaModal={showNomenclaturaModal}
        setShowNomenclaturaModal={setShowNomenclaturaModal}
        showEndCycleModal={showEndCycleModal}
        setShowEndCycleModal={setShowEndCycleModal}
        endCycleForm={endCycleForm}
        setEndCycleForm={setEndCycleForm}
        handleEndCycleConfirm={handleEndCycleConfirm}
        showPreviasModal={showPreviasModal}
        setShowPreviasModal={setShowPreviasModal}
        savePrevia={savePrevia}
        deletePrevia={deletePrevia}
        tecMode={tecMode}
        setTecMode={setTecMode}
        tecForm={tecForm}
        setTecForm={setTecForm}
        addTec={addTec}
        editTec={editTec}
        draggedMateriaIndex={draggedMateriaIndex}
        handleDragStart={handleDragStart}
        handleDragEnter={handleDragEnter}
        handleDragEnd={handleDragEnd}
        editingCourseId={editingCourseId}
        setEditingCourseId={setEditingCourseId}
        courseForm={courseForm}
        setCourseForm={setCourseForm}
        editCourse={editCourse}
        transferringAlumno={transferringAlumno}
        setTransferringAlumno={setTransferringAlumno}
        transferMotivo={transferMotivo}
        setTransferMotivo={setTransferMotivo}
        execTransfer={execTransfer}
        editingStudent={editingStudent}
        setEditingStudent={setEditingStudent}
        dniError={dniError}
        setDniError={setDniError}
        editStudent={editStudent}
        pasingStudent={pasingStudent}
        setPasingStudent={setPasingStudent}
        paseForm={paseForm}
        setPaseForm={setPaseForm}
        execPase={execPase}
        editingPase={editingPase}
        setEditingPase={setEditingPase}
        savePaseEdit={savePaseEdit}
        editingObsStudent={editingObsStudent}
        setEditingObsStudent={setEditingObsStudent}
        saveObs={saveObs}
        viewingProf={viewingProf}
        setViewingProf={setViewingProf}
        editingUserId={editingUserId}
        setEditingUserId={setEditingUserId}
        userForm={userForm}
        setUserForm={setUserForm}
        createUser={createUser}
        editUser={editUser}
        truncateSubject={truncateSubject}
        viewingFichaStudent={null}
        setViewingFichaStudent={setViewingFichaStudent}
        setIsEditingFicha={setIsEditingFicha}
        isEditingFicha={isEditingFicha}
        studentForm={studentForm}
        setStudentForm={setStudentForm}
        handleSaveFicha={handleSaveFicha}
        getHistorial={getHistorial}
      />
    </div>
  );
}
