import React from 'react';
import { Save } from 'lucide-react';

const PlanillasPanel = ({ user, handlePrintPlanillasCurso, handlePrintAllCourses, handlePrintSeguimientoGlobal }) => {
  return (
    <section className="page-section">
      <div className="section-title"><Save size={16} /><h2>Generar Planillas de Cursos</h2></div>
      <div className="panel-actions" style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', margin: 0 }}>
          <button className="btn btn-primary" style={{ background: 'var(--primary)', border: 'none', width: '100%', justifyContent: 'center' }} onClick={handlePrintPlanillasCurso}>
             🖨️ IMPRIMIR PLANILLAS DE CALIFICACIONES (A4 VERTICAL)
          </button>
          <p className="helper-text" style={{ marginTop: '10px' }}>Genera las planillas oficiales de TODAS las materias del curso seleccionado (un espacio curricular por hoja A4).</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: (['admin', 'secretaria_de_alumnos', 'jefe_de_auxiliares', 'director', 'vicedirector'].includes(user.rol)) ? '1fr 1fr' : '1fr', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '1.5rem', margin: 0, opacity: 0.8 }}>
            <button className="btn btn-primary" style={{ background: 'black', border: '1px solid #333', width: '100%', justifyContent: 'center' }} onClick={handlePrintAllCourses}>
               🖨️ SEGUIMIENTO (CURSO ACTUAL)
            </button>
            <p className="helper-text" style={{ marginTop: '10px' }}>Listado simplificado del curso seleccionado.</p>
          </div>

          {(user.rol === 'admin' || user.rol === 'secretaria_de_alumnos' || user.rol === 'jefe_de_auxiliares' || user.rol === 'director' || user.rol === 'vicedirector') && (
            <div className="glass-card" style={{ padding: '1.5rem', margin: 0, border: '1px solid rgba(99, 102, 241, 0.3)' }}>
              <button className="btn btn-primary" style={{ background: '#6366f1', border: 'none', width: '100%', justifyContent: 'center' }} onClick={handlePrintSeguimientoGlobal}>
                 🖨️ SEGUIMIENTO (TODOS LOS CURSOS)
              </button>
              <p className="helper-text" style={{ marginTop: '10px' }}>Genera una hoja por cada curso activo de la institución en un solo documento.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PlanillasPanel;
