import React from 'react';
import { ClipboardList, Search, Lock, Unlock } from 'lucide-react';
import { truncateSubject } from '../functions/PreceptorHelpers';
import '../../css/AcademicManager.css';

const PERIOD_GROUPS = [
  { ids: [1], label: '1er Inf.' },
  { ids: [2], label: '1° Trim.' },
  { ids: [3], label: '2do Inf.' },
  { ids: [4], label: '2° Trim.' },
  { ids: [5], label: '3er Inf.' },
  { ids: [6], label: '3° Trim.' },
  { ids: [7, 8, 9, 10], label: 'Periodo Compensatorio' }
];

const AcademicManager = ({
  isMobile,
  user,
  data,
  selectedCourseId,
  materiasSearch,
  setMateriasSearch,
  handleUpdateLocks
}) => {
  const [mobilePeriodLabel, setMobilePeriodLabel] = React.useState(PERIOD_GROUPS[0].label);

  const visibleGroups = isMobile
    ? PERIOD_GROUPS.filter((group) => group.label === mobilePeriodLabel)
    : PERIOD_GROUPS;

  const relevantSubjects = (data.subjects || []).filter((subject) => {
    if (['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'].includes(user.rol)) return true;
    if (user.rol === 'preceptor') return subject.es_taller !== 1;
    if (user.rol === 'preceptor_taller') return subject.es_taller === 1;
    return false;
  });

  const filteredSubjects = data.subjects.filter((subject) =>
    subject.nombre.toLowerCase().includes(materiasSearch.toLowerCase())
  );

  return (
    <section className="page-section">
      <div
        className="section-title"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '0.8rem' : '0.5rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ClipboardList size={16} className="text-primary" />
          <h2>Gestión de Materias y Bloqueos</h2>
        </div>
        <div className="panel-actions" style={{ width: isMobile ? '100%' : 'auto', gap: isMobile ? '0.45rem' : '0.75rem', flexWrap: 'nowrap' }}>
          <button
            className="btn"
            onClick={() => handleUpdateLocks(null, null, true, true)}
            style={{
              background: 'rgba(231, 76, 60, 0.2)',
              color: '#e74c3c',
              flex: isMobile ? 1 : 'none',
              padding: isMobile ? '0.55rem 0.65rem' : undefined,
              fontSize: isMobile ? '0.68rem' : undefined,
              justifyContent: 'center'
            }}
          >
            {['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'].includes(user.rol)
              ? 'BLOQUEAR TODO EL CURSO'
              : 'BLOQUEAR MIS MATERIAS'}
          </button>
          <button
            className="btn"
            onClick={() => handleUpdateLocks(null, null, false, true)}
            style={{
              background: 'rgba(46, 204, 113, 0.2)',
              color: '#27ae60',
              flex: isMobile ? 1 : 'none',
              padding: isMobile ? '0.55rem 0.65rem' : undefined,
              fontSize: isMobile ? '0.68rem' : undefined,
              justifyContent: 'center'
            }}
          >
            {['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'].includes(user.rol)
              ? 'DESBLOQUEAR TODO'
              : 'DESBLOQUEAR MIS MATERIAS'}
          </button>
        </div>
      </div>

      <div className="glass-card table-container" style={{ marginTop: '1rem', overflowX: 'auto' }}>
        {isMobile && (
          <div style={{ padding: '1rem 1rem 0', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <label style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: '600' }}>Periodo</label>
            <select className="input-field" value={mobilePeriodLabel} onChange={(e) => setMobilePeriodLabel(e.target.value)} style={{ width: '100%' }}>
              {PERIOD_GROUPS.map((group) => (
                <option key={group.label} value={group.label}>{group.label}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '25px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
          <input
            className="input-field"
            placeholder="Buscar materia por nombre..."
            value={materiasSearch}
            onChange={(e) => setMateriasSearch(e.target.value)}
            style={{ paddingLeft: '45px' }}
          />
        </div>

        <table className="grades-table academic-locks-table" style={{ fontSize: '0.8rem' }}>
          <thead>
            <tr>
              <th className="academic-locks-header academic-locks-header-main" style={{ width: isMobile ? '140px' : '250px' }}>
                {isMobile ? 'MATERIA / DOCENTE' : 'ESTRUCTURA CURRICULAR / DOCENTES'}
              </th>
              {visibleGroups.map((group) => {
                const isPeriodLockedFull =
                  relevantSubjects.length > 0 &&
                  relevantSubjects.every((subject) =>
                    group.ids.every((periodId) =>
                      (data.locks || []).some((lock) => lock.materia_id === subject.id && lock.periodo_id === periodId)
                    )
                  );

                return (
                  <th key={group.label} className="academic-locks-header" style={{ textAlign: 'center', fontSize: '0.65rem', minWidth: isMobile ? '70px' : '80px', paddingBottom: '10px' }}>
                    <button
                      className={`icon-btn ${isPeriodLockedFull ? 'danger' : 'success'}`}
                      style={{ display: 'block', margin: '0 auto 6px auto', width: '24px', height: '24px', padding: 0, opacity: 0.8 }}
                      onClick={() => handleUpdateLocks(null, group.ids, !isPeriodLockedFull)}
                      title={isPeriodLockedFull ? 'Desbloquear hilera completa' : 'Bloquear hilera completa'}
                    >
                      {isPeriodLockedFull ? <Lock size={12} /> : <Unlock size={12} />}
                    </button>
                    {group.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {filteredSubjects.map((subject) => {
              const subjectKey = `${selectedCourseId}-${subject.id}`;
              const professors = (data.users || [])
                .filter((currentUser) => String(currentUser.professor_subject_ids || '').split(',').includes(subjectKey))
                .map((currentUser) => currentUser.nombre)
                .join(', ') || 'Sin prof. asignado';

              return (
                <tr key={subject.id}>
                  <td>
                    <div style={{ fontWeight: 'bold' }}>{truncateSubject(subject.nombre)}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{professors}</div>
                  </td>
                  {visibleGroups.map((group, idx) => {
                    const isLocked = group.ids.every((periodId) =>
                      (data.locks || []).some((lock) => lock.materia_id === subject.id && lock.periodo_id === periodId)
                    );

                    const canToggle =
                      ['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'].includes(user.rol) ||
                      (user.rol === 'preceptor' && subject.es_taller !== 1) ||
                      (user.rol === 'preceptor_taller' && subject.es_taller === 1);

                    return (
                      <td key={idx} style={{ textAlign: 'center' }}>
                        <button
                          className={`icon-btn ${isLocked ? 'danger' : 'success'}`}
                          onClick={() => canToggle && handleUpdateLocks(subject.id, group.ids, !isLocked)}
                          title={isLocked ? 'Periodo Bloqueado' : 'Periodo Abierto'}
                          style={{
                            padding: '8px',
                            background: isLocked ? 'rgba(231, 76, 60, 0.1)' : 'rgba(46, 204, 113, 0.1)',
                            opacity: canToggle ? 1 : 0.3,
                            cursor: canToggle ? 'pointer' : 'not-allowed'
                          }}
                          disabled={!canToggle}
                        >
                          {isLocked ? <Lock size={14} /> : <Unlock size={14} />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default AcademicManager;
