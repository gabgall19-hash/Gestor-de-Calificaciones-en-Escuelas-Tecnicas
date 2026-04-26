import React from 'react';
import { Save } from 'lucide-react';

const PlanillasPanel = ({ user, handlePrintPlanillasCurso, handlePrintAllCourses, handlePrintSeguimientoGlobal, handlePrintParteDiario, handlePrintParteDiarioGlobal }) => {
  const isAdmin = ['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'].includes(user.rol);

  return (
    <section className="page-section">
      <div className="section-title"><Save size={16} /><h2>Generar Planillas de Cursos</h2></div>
      <div className="panel-actions" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        {/* Row 1: Qualifications (Full Width) */}
        <div className="glass-card" style={{ padding: '1.5rem', margin: 0 }}>
          <button className="btn btn-primary" style={{ background: 'var(--primary)', border: 'none', width: '100%', justifyContent: 'center' }} onClick={handlePrintPlanillasCurso}>
            🖨️ IMPRIMIR PLANILLAS DE CALIFICACIONES DEL CURSO
          </button>
          <p className="helper-text" style={{ marginTop: '10px' }}>Genera las planillas oficiales de TODAS las materias del curso seleccionado.</p>
        </div>

        {/* Row 2: Parte Semanal (Individual and Global) */}
        <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr 1fr' : '1fr', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem', margin: 0, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <button className="btn btn-primary" style={{ background: '#10b981', border: 'none', width: '100%', justifyContent: 'center' }} onClick={handlePrintParteDiario}>
              📋 PARTE SEMANAL (CURSO ACTUAL)
            </button>
            <p className="helper-text" style={{ marginTop: '10px' }}>Lista de alumnos y horario semanal integrado.</p>
          </div>

          {isAdmin && (
            <div className="glass-card" style={{ padding: '1.5rem', margin: 0, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <button className="btn btn-primary" style={{ background: '#059669', border: 'none', width: '100%', justifyContent: 'center' }} onClick={handlePrintParteDiarioGlobal}>
                📋 PARTE SEMANAL (TODOS LOS CURSOS)
              </button>
              <p className="helper-text" style={{ marginTop: '10px' }}>Reporte masivo de toda la institución.</p>
            </div>
          )}
        </div>

        {/* Row 3: Seguimiento (Individual and Global) */}
        <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? '1fr 1fr' : '1fr', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem', margin: 0, opacity: 0.8 }}>
            <button className="btn btn-primary" style={{ background: 'black', border: '1px solid #333', width: '100%', justifyContent: 'center' }} onClick={handlePrintAllCourses}>
              🖨️ SEGUIMIENTO (CURSO ACTUAL)
            </button>
            <p className="helper-text" style={{ marginTop: '10px' }}>Listado simplificado del curso seleccionado.</p>
          </div>

          {isAdmin && (
            <div className="glass-card" style={{ padding: '1.5rem', margin: 0, opacity: 0.8 }}>
              <button className="btn btn-primary" style={{ background: 'black', border: '1px solid #333', width: '100%', justifyContent: 'center' }} onClick={handlePrintSeguimientoGlobal}>
                🖨️ SEGUIMIENTO (TODOS LOS CURSOS)
              </button>
              <p className="helper-text" style={{ marginTop: '10px' }}>Listado masivo de toda la institución.</p>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};

export default PlanillasPanel;
