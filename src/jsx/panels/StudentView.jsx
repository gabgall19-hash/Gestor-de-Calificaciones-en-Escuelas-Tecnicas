import React, { useState, useEffect } from 'react';
import { ArrowLeft, Printer, FileText, AlertCircle } from 'lucide-react';

export default function StudentView({ dni, password, onBack, isStaff }) {
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      // Bloquear F12
      if (e.keyCode === 123) {
        e.preventDefault();
        return false;
      }
      // Bloquear Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (e.ctrlKey && (e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) || (e.ctrlKey && e.keyCode === 85)) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const formatDNI = (val) => {
    if (!val) return '';
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const simplifyTecName = (name) => {
    if (!name) return '';
    // Patrón: "Tecnicatura en [Nombre]" -> "[NOMBRE]"
    // También eliminamos cualquier cosa entre paréntesis ej: "(Curso)"
    const match = name.match(/Tecnicatura en\s+([^(\r\n]+)/i);
    let result = (match ? match[1] : name).split('(')[0].trim();
    return result.toUpperCase();
  };
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [customMsg, setCustomMsg] = useState(null);

  useEffect(() => {
    // Limpiar DNI de puntos o espacios antes de la consulta
    const cleanDNI = dni ? dni.toString().replace(/\D/g, '') : '';
    
    const headers = {};
    if (isStaff) {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        const token = JSON.parse(stored).token;
        if (token) headers['Authorization'] = `Bearer ${token}`;
      }
    }

    fetch(`/api/student?dni=${cleanDNI}&password=${password || ''}`, { headers })
      .then(res => {
        const newToken = res.headers.get('X-Refresh-Token');
        if (newToken) {
          const stored = localStorage.getItem('currentUser');
          if (stored) {
            try {
              const user = JSON.parse(stored);
              user.token = newToken;
              localStorage.setItem('currentUser', JSON.stringify(user));
            } catch (e) {}
          }
        }
        return res.json();
      })
      .then(json => {
        if (json.error) {
          setError(json.error);
          if (json.custom_message) setCustomMsg(json.custom_message);
        } else {
          setData(json);
        }
        setLoading(false);
      })
      .catch(err => {
        setError("Error de conexión");
        setLoading(false);
      });
  }, [dni, password]);

  if (loading) return <div className="glass-card">Cargando boletín...</div>;
  if (error) return (
    <div className="glass-card" style={{ textAlign: 'center', maxWidth: '500px', margin: '4rem auto' }}>
      {error === 'PASSWORD_NOT_SET' ? (
        <div style={{ color: '#ef4444', padding: '1rem', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)' }}>
          <AlertCircle size={40} style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Contraseña no definida</h2>
          <p 
            style={{ fontSize: '0.95rem', lineHeight: '1.5' }}
            dangerouslySetInnerHTML={{ __html: customMsg || 'Solicite la contraseña mediante atención directa en el horario de <b>8:00 a 13:00 de Lunes a Viernes</b>.' }}
          />
        </div>
      ) : (
        <p style={{ color: 'var(--danger)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>{error}</p>
      )}
      <button className="btn btn-primary" onClick={onBack} style={{ marginTop: '1.5rem' }}><ArrowLeft size={16}/> Volver</button>
    </div>
  );

  const getGradeValue = (materiaId, periodoId, field) => {
    const grade = data.grades.find(g => g.materia_id === materiaId && g.periodo_id === periodoId);
    return grade ? grade[field] : '-';
  };

  const shortenPeriodName = (name) => {
    if (!name) return '';
    let n = name.toUpperCase();
    
    // Simplificar Informes
    if (n.includes('INF. ORIENTADOR') || n.includes('INF.ORIENTADOR')) {
      const num = n.match(/\d+/);
      return (num ? num[0] : '') + '° INF. OR.';
    }
    
    // Simplificar Trimestres
    if (n.includes('TRIMESTRE')) {
      const num = n.match(/\d+/);
      return (num ? num[0] : '') + '° TRI.';
    }
    
    // Simplificar Compensatorios y Definitiva
    if (n.includes('DIC')) return 'DIC.';
    if (n.includes('FEB')) return 'FEB.';
    if (n.includes('MAR')) return 'MAR.';
    if (n.includes('DEF') || n.includes('DEFINITIVA')) return 'DEF.';
    if (n.includes('OTRAS')) return 'OTRAS INST.';
    
    return n;
  };

  const dividerStyle = { borderRight: '3px solid rgba(255,255,255,0.6)' };
  const borderStyle = { borderRight: '1px solid rgba(255,255,255,0.1)' };

  // Lógica para las filas de previas
  const PREVIAS_MIN_ROWS = 12;
  const PREVIAS_MAX_ROWS = 40;
  const previasData = data.previas || [];
  const rowsToShow = Math.min(Math.max(previasData.length, PREVIAS_MIN_ROWS), PREVIAS_MAX_ROWS);
  const previasRows = Array.from({ length: rowsToShow }).map((_, i) => previasData[i] || null);

  // Lógica para altura dinámica de filas en Cara A (para que ocupe la hoja)
  const subCount = data.config.subjects.length;
  const dynamicRowHeight = subCount <= 8 ? '12mm' : subCount <= 12 ? '9mm' : subCount <= 15 ? '7.5mm' : '6.5mm';

  // Ordenar periodos: Asegurar que DEF esté al final y OTRAS INST antes
  const sortedPeriodos = [...data.config.periodos].sort((a, b) => {
    const nA = a.nombre.toUpperCase();
    const nB = b.nombre.toUpperCase();
    if (nA.includes('DEF') || nA.includes('DEFINITIVA')) return 1;
    if (nB.includes('DEF') || nB.includes('DEFINITIVA')) return -1;
    return a.id - b.id;
  });

  const hasModular = data.config.subjects.some(s => 
    s.tipo?.toLowerCase().includes('modular') || 
    s.tipo?.toLowerCase().includes('taller')
  );

  return (
    <div className="boletin-container">
      <style dangerouslySetInnerHTML={{ __html: `
        .boletin-container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 2rem 0;
        }
        @media screen {
          .boletin-page {
            margin-bottom: 3rem;
          }
        }
        @media print {
          @page { size: A4 landscape; margin: 10mm 10mm; }
          body { background: white !important; color: black !important; padding: 0 !important; margin: 0 !important; }
          .boletin-container { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
          .boletin-page { 
            background: transparent !important; 
            box-shadow: none !important; 
            border: none !important; 
            padding: 0 !important; 
            margin: 0 !important; 
            backdrop-filter: none !important; 
            width: 100% !important; 
            page-break-after: always;
            break-after: page;
            --dynamic-row-height: 8mm; /* Default */
          }
          .boletin-page:last-child { page-break-after: auto; }
          .panel-toolbar, .btn, .icon-btn { display: none !important; }
          .table-container { border: 1.5px solid #000 !important; background: white !important; overflow: visible !important; }
          table { border-collapse: collapse !important; border: 1.2px solid #000 !important; width: 100% !important; }
          th, td { border: 1.2px solid #000 !important; color: black !important; padding: 2px 4px !important; background: white !important; }
          tr { height: var(--dynamic-row-height) !important; }
          th { background: #eee !important; -webkit-print-color-adjust: exact; height: 8mm !important; border: 1.5px solid #000 !important; }
          .label { color: black !important; font-weight: bold !important; }
          .student-name-print { color: black !important; -webkit-print-color-adjust: exact; }
          span, div, h1, h2, h3, b, strong { color: black !important; opacity: 1 !important; border-color: black !important; }
          .boletin-footer { margin-top: 4.5rem !important; }
          .signature-line { border-top: 1.5px solid #000 !important; padding-top: 5px !important; width: 220px; margin: 0 auto; }
          .previas-table td { height: 18px !important; font-size: 7.5pt !important; border: 1px solid #000 !important; padding: 1px 4px !important; }
          .previas-table th { font-size: 7.5pt !important; padding: 4px 2px !important; border: 1.5px solid #000 !important; }
          .observations-box { border: 1.5px solid #000 !important; background: white !important; margin-top: 1rem !important; padding: 0.5rem !important; }
          /* Forzar divisores de trimestre a ser negros en la impresion */
          td[style*="border-right: 3px"], th[style*="border-right: 3px"] { border-right: 2px solid #000 !important; }
        }
      `}} />

      <div className="panel-toolbar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', padding: '0 1rem' }}>
        <button className="btn" style={{ background: 'rgba(255,255,255,0.1)' }} onClick={onBack}>
          <ArrowLeft size={18} /> Volver
        </button>
        <button className="btn btn-primary" onClick={() => window.print()}>
          <Printer size={18} /> Imprimir Boletín Completo
        </button>
      </div>

      {/* CARA A: CALIFICACIONES */}
      <div className="glass-card boletin-page boletin-view" style={{ 
        position: 'relative', 
        '--dynamic-row-height': dynamicRowHeight 
      }}>


      {isStaff && data.pase && (
        <div className="glass-card" style={{ 
          background: 'rgba(239, 68, 68, 0.15)', 
          border: '1px solid rgba(239, 68, 68, 0.3)', 
          padding: '1rem', 
          marginBottom: '1.5rem', 
          borderRadius: '12px',
          color: 'white',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 'bold' }}>
            ⚠️ ATENCIÓN: Alumno DADO de PASE el día {data.pase.fecha_pase}
          </h3>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', opacity: 0.9 }}>
            Institución: {data.pase.institucion_destino}
          </p>
        </div>
      )}

      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: '2.5rem', 
        marginBottom: '0.75rem',
        padding: '0 1rem'
      }}>
        <img src="/logo.png" alt="Logo Institucional" style={{ height: '75px', objectFit: 'contain' }} />
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: '900', margin: '0', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            INDUSTRIAL N°6 "X BRIGADA AEREA"
          </h2>
          <h1 style={{ fontSize: '0.85rem', fontWeight: '600', margin: '2px 0', letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            BOLETÍN DE INFORMACIÓN EVALUATIVA
          </h1>
          <div className="student-name-print" style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '2px', color: 'var(--primary)', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2px' }}>
            {data.alumno.apellido}, {data.alumno.nombre}
          </div>
        </div>
        {/* Placeholder for symmetry in flex if needed, or just let it center */}
        <div style={{ width: '75px', display: 'none' }}></div> 
      </div>

      <div className="boletin-header" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '0.5rem', 
        marginBottom: '0.75rem', 
        padding: '0.4rem 1rem', 
        background: 'rgba(255,255,255,0.03)', 
        borderRadius: '8px', 
        fontSize: '0.8rem',
        borderBottom: '1px dotted rgba(255,255,255,0.1)'
      }}>
        <div className="boletin-field">
          <div className="label" style={{ fontSize: '0.65rem', opacity: 0.6, textTransform: 'uppercase' }}>DNI</div>
          <div style={{ fontWeight: '500' }}>{formatDNI(data.alumno.dni)}</div>
        </div>
        <div className="boletin-field">
          <div className="label" style={{ fontSize: '0.65rem', opacity: 0.6, textTransform: 'uppercase' }}>AÑO</div>
          <div style={{ fontWeight: '500' }}>{data.alumno.year_nombre}</div>
        </div>
        <div className="boletin-field">
          <div className="label" style={{ fontSize: '0.65rem', opacity: 0.6, textTransform: 'uppercase' }}>CURSO</div>
          <div style={{ fontWeight: '500' }}>{data.alumno.ano} {data.alumno.division}</div>
        </div>
        <div className="boletin-field">
          <div className="label" style={{ fontSize: '0.65rem', opacity: 0.6, textTransform: 'uppercase' }}>TECNICATURA</div>
          <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>{simplifyTecName(data.alumno.tecnicatura_nombre)}</div>
        </div>
      </div>

      <div className="table-container" style={{ 
        overflowX: 'auto', 
        width: '100%', 
        border: '1px solid var(--glass-border)',
        borderRadius: '8px',
        background: 'rgba(0,0,0,0.15)'
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          fontSize: '0.78rem',
          minWidth: '850px'
        }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.08)' }}>
              <th style={{ width: '220px', padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid var(--primary)', ...borderStyle }}>ESPACIOS CURRICULARES</th>
              {sortedPeriodos.map(p => {
                const isDivider = [2, 4, 6].includes(p.id);
                const isTrimester = p.nombre.toUpperCase().includes('TRIMESTRE');
                return (
                  <th key={p.id} style={{ 
                    textAlign: 'center', 
                    padding: '8px 2px', 
                    borderBottom: '2px solid var(--primary)', 
                    fontSize: '0.65rem',
                    fontWeight: '900',
                    whiteSpace: 'nowrap',
                    ...(isDivider ? dividerStyle : borderStyle)
                  }}>
                    {shortenPeriodName(p.nombre)}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {data.config.subjects.map((sub, idx) => (
              <tr key={sub.id} style={{ background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                <td style={{ fontWeight: '600', padding: '6px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', ...borderStyle }}>
                  <div style={{ fontSize: '0.78rem' }}>{sub.nombre}</div>
                  {sub.tipo === 'modular' && (
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', marginTop: '1px', opacity: 0.6 }}>
                      <span>T: Teoría</span> <span>P: Práctica</span>
                    </div>
                  )}
                </td>
                {sortedPeriodos.map(p => {
                  const isDivider = [2, 4, 6].includes(p.id);
                  const isFinalStage = p.id > 6;
                  const isTrimester = [2, 4, 6].includes(p.id);
                  return (
                    <td key={p.id} style={{ 
                      textAlign: 'center', 
                      padding: '6px 2px', 
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      ...(isDivider ? dividerStyle : borderStyle)
                    }}>
                      {sub.tipo?.toLowerCase().includes('modular') || sub.tipo?.toLowerCase().includes('taller') ? (
                        !isFinalStage ? (
                          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '0.3rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px' }}>
                              <span style={{ fontSize: '0.55rem', opacity: 0.5, fontWeight: 'bold', marginBottom: '1px' }}>T</span>
                              <span style={{ fontSize: '0.75rem', color: '#fff' }}>{getGradeValue(sub.id, p.id, 'valor_t')}</span>
                            </div>
                            <span style={{ color: 'var(--text-muted)', opacity: 0.2, alignSelf: 'flex-end', marginBottom: '2px' }}>|</span>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20px' }}>
                              <span style={{ fontSize: '0.55rem', opacity: 0.5, fontWeight: 'bold', marginBottom: '1px' }}>P</span>
                              <span style={{ fontSize: '0.75rem', color: '#fff' }}>{getGradeValue(sub.id, p.id, 'valor_p')}</span>
                            </div>
                            {isTrimester && (
                              <>
                                <span style={{ color: 'var(--text-muted)', opacity: 0.2, alignSelf: 'flex-end', marginBottom: '2px' }}>|</span>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '28px' }}>
                                  <span style={{ fontSize: '0.52rem', opacity: 0.5, fontWeight: 'bold', marginBottom: '1px' }}>POND</span>
                                  <span style={{ fontSize: '0.75rem', color: '#2ecc71', fontWeight: 'bold' }}>{getGradeValue(sub.id, p.id, 'valor_pond')}</span>
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontWeight: 'normal', color: '#fff', fontSize: '0.8rem' }}>
                            {getGradeValue(sub.id, p.id, 'valor_t')}
                          </span>
                        )
                      ) : (
                        <span style={{ 
                          fontWeight: 'normal', 
                          color: '#fff',
                          fontSize: isFinalStage ? '0.8rem' : 'inherit'
                        }}>
                          {getGradeValue(sub.id, p.id, 'valor_t')}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      <div className="boletin-footer" style={{ marginTop: '5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', textAlign: 'center' }}>
        <div className="signature-line" style={{ paddingTop: '0.75rem' }}>
          <p className="label">Firma de la Autoridad Educativa</p>
        </div>
        <div className="signature-line" style={{ paddingTop: '0.75rem' }}>
          <p className="label">Firma del Padre, Madre o Tutor</p>
        </div>
      </div>
    </div>

      {/* CARA B: MATERIAS PREVIAS (DORSO) */}
      <div className="glass-card boletin-page" style={{ position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img src="/logo.png" alt="Logo Institucional" style={{ height: '40px', marginBottom: '0.25rem' }} />
          <h2 style={{ fontSize: '0.9rem', fontWeight: '800', margin: '0', color: 'var(--text-main)', textTransform: 'uppercase' }}>
            INDUSTRIAL N°6 "X BRIGADA AEREA"
          </h2>
          <h1 style={{ fontSize: '1rem', fontWeight: '900', margin: '0.5rem 0 0', color: 'var(--text-main)', textTransform: 'uppercase' }}>
            ESPACIOS CURRICULARES PENDIENTES DE ACREDITACIÓN
          </h1>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '0.25rem' }}>
            Régimen de Materias Previas / Equivalencias / Libres
          </p>
        </div>

        <div className="table-container" style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
          <table className="previas-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.08)' }}>
                <th style={{ width: '35px', textAlign: 'center', borderBottom: '2px solid var(--primary)' }}>N°</th>
                <th style={{ textAlign: 'left', padding: '10px', borderBottom: '2px solid var(--primary)' }}>ESPACIO CURRICULAR</th>
                <th style={{ width: '100px', textAlign: 'center', borderBottom: '2px solid var(--primary)' }}>AÑO / CICLO</th>
                <th style={{ width: '100px', textAlign: 'center', borderBottom: '2px solid var(--primary)' }}>FECHA</th>
                <th style={{ width: '60px', textAlign: 'center', borderBottom: '2px solid var(--primary)' }}>LIBRO</th>
                <th style={{ width: '60px', textAlign: 'center', borderBottom: '2px solid var(--primary)' }}>FOLIO</th>
                <th style={{ width: '80px', textAlign: 'center', borderBottom: '2px solid var(--primary)' }}>CALIF.</th>
              </tr>
            </thead>
            <tbody>
              {previasRows.map((previa, idx) => (
                <tr key={idx} style={{ 
                  background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.03)'
                }}>
                  <td style={{ textAlign: 'center', opacity: 0.3, fontSize: '0.7rem' }}>{idx + 1}</td>
                  <td style={{ textAlign: 'left', padding: '6px 10px', fontWeight: previa ? '700' : 'normal', color: previa ? '#fff' : 'transparent' }}>
                    {previa ? (previa.materia_nombre || previa.materia_nombre_custom) : '.'}
                  </td>
                  <td style={{ textAlign: 'center', color: '#fff' }}>{previa?.curso_ano || ''}</td>
                  <td style={{ textAlign: 'center', color: '#fff' }}>{previa?.fecha || ''}</td>
                  <td style={{ textAlign: 'center', color: '#fff' }}>{previa?.libro || ''}</td>
                  <td style={{ textAlign: 'center', color: '#fff' }}>{previa?.folio || ''}</td>
                  <td style={{ textAlign: 'center', fontWeight: '900', color: 'var(--success)' }}>{previa?.calificacion || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="observations-box" style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px dashed var(--glass-border)' }}>
          <p className="label" style={{ marginBottom: '0.5rem' }}>Observaciones</p>
          <p 
            style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontStyle: 'italic', minHeight: '1.2em', whiteSpace: 'pre-wrap' }}
            dangerouslySetInnerHTML={{ 
              __html: (data.alumno.observaciones || 'Sin observaciones.').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') 
            }}
          />
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{ 
            borderTop: '1.5px solid var(--glass-border)', 
            width: '300px', 
            textAlign: 'center', 
            paddingTop: '8px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }} className="signature-line">
            Sello y Firma de Secretaría
          </div>
        </div>

        <div style={{ marginTop: '1rem', fontSize: '0.65rem', opacity: 0.4, fontStyle: 'italic', textAlign: 'center', textTransform: 'uppercase' }}>
          Industrial N°6 - Sistema de Gestión Escolar - {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
