import React, { useState, useMemo } from 'react';
import { Search, GraduationCap, FileText, Filter } from 'lucide-react';
import { simplifyTecName } from '../functions/PreceptorHelpers';

export default function EgresadosPanel({ isMobile, data, onViewFicha, onUpdateGraduate }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('todos');

  const filtered = useMemo(() => {
    let list = data.graduates || [];
    if (filter !== 'todos') {
      list = list.filter(s => s.egresado_tipo === filter);
    }
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(s_obj => 
        (s_obj.nombre || '').toLowerCase().includes(s) || 
        (s_obj.apellido || '').toLowerCase().includes(s) || 
        (s_obj.dni || '').includes(s) ||
        (s_obj.tecnicatura_nombre || '').toLowerCase().includes(s) ||
        (s_obj.ciclo_egreso || '').toLowerCase().includes(s)
      );
    }
    return list;
  }, [data.graduates, search, filter]);

  return (
    <div className="panel-container animate-fade-in" style={{ padding: isMobile ? '0.5rem' : '1rem' }}>
      <div className="panel-header" style={{ marginBottom: isMobile ? '1rem' : '2rem', display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'center' : 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '15px' }}>
          <div className="icon-badge primary" style={{ background: 'linear-gradient(135deg, var(--primary), #4f46e5)', color: 'white', padding: isMobile ? '8px' : '12px', borderRadius: '12px' }}>
            <GraduationCap size={isMobile ? 18 : 24} />
          </div>
          <div>
            <h2 className="panel-title" style={{ fontSize: isMobile ? '1.15rem' : '1.5rem', fontWeight: '800', margin: 0, lineHeight: 1.1 }}>Registro de Egresados</h2>
            <p className="panel-subtitle" style={{ opacity: 0.6, fontSize: isMobile ? '0.72rem' : '0.9rem', marginTop: '2px' }}>Listado global de alumnos técnicos.</p>
          </div>
        </div>
        {!isMobile && (
          <div className="panel-stats" style={{ display: 'flex', gap: '10px' }}>
              <div className="stat-pill" style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 15px', borderRadius: '10px', fontSize: '0.85rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <strong>{data.graduates?.length || 0}</strong> Egresados Totales
              </div>
          </div>
        )}
      </div>

      <div className="glass-card" style={{ padding: isMobile ? '1rem' : '1.5rem', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', gap: isMobile ? '10px' : '15px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-container" style={{ flex: 1, minWidth: isMobile ? '100%' : '280px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
            <input 
              type="text" 
              className="input-field" 
              style={{ paddingLeft: '45px', width: '100%', fontSize: isMobile ? '0.85rem' : '1rem' }}
              placeholder={isMobile ? "Buscar..." : "Buscar por Apellido, Nombre o DNI..."} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: isMobile ? '100%' : 'auto' }}>
            {!isMobile && <Filter size={16} style={{ opacity: 0.5 }} />}
            <select 
              className="input-field compact-select" 
              style={{ width: isMobile ? '100%' : '180px', fontSize: isMobile ? '0.85rem' : '1rem' }}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="todos">Todos los Tipos</option>
              <option value="Recibido">Recibidos</option>
              <option value="Egresado">Egresados (Pend.)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-responsive custom-scroll" style={{ borderRadius: '15px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15, 23, 42, 0.3)', overflowX: 'auto' }}>
        <table className="custom-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: isMobile ? 'auto' : 'fixed' }}>
          <thead>
            <tr>
              <th style={{ padding: isMobile ? '8px 10px' : '12px 15px', fontSize: isMobile ? '0.75rem' : '0.85rem' }}>Alumno</th>
              {!isMobile && <th style={{ width: '120px' }}>DNI</th>}
              <th style={{ padding: isMobile ? '8px 5px' : '12px 15px', fontSize: isMobile ? '0.75rem' : '0.85rem', width: isMobile ? '80px' : 'auto' }}>Carrera</th>
              <th style={{ textAlign: 'center', padding: isMobile ? '8px 5px' : '12px 15px', fontSize: isMobile ? '0.75rem' : '0.85rem', width: isMobile ? '100px' : '140px' }}>Estado</th>
              <th style={{ textAlign: 'center', padding: isMobile ? '8px 5px' : '12px 15px', fontSize: isMobile ? '0.75rem' : '0.85rem', width: isMobile ? '60px' : '120px' }}>Ciclo</th>
              <th style={{ textAlign: 'center', padding: isMobile ? '8px 5px' : '12px 15px', fontSize: isMobile ? '0.75rem' : '0.85rem', width: isMobile ? '50px' : '100px' }}>Ver</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="hover-row">
                <td style={{ padding: isMobile ? '8px 10px' : '12px 15px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px' }}>
                    {!isMobile && (
                      <div className="avatar-small" style={{ background: s.egresado_tipo === 'Recibido' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(212, 175, 55, 0.2)', color: s.egresado_tipo === 'Recibido' ? '#10b981' : '#d4af37', fontWeight: 'bold', width: '32px', height: '32px', fontSize: '0.85rem' }}>
                        {s.apellido?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div style={{ fontWeight: '700', fontSize: isMobile ? '0.78rem' : '0.95rem', lineHeight: 1.2 }}>{s.apellido}, {s.nombre}</div>
                    </div>
                  </div>
                </td>
                {!isMobile && <td style={{ opacity: 0.8, fontFamily: 'monospace', fontSize: '0.85rem' }}>{s.dni || '---'}</td>}
                <td style={{ padding: isMobile ? '8px 5px' : '12px 15px' }}>
                  <div style={{ fontSize: isMobile ? '0.7rem' : '0.85rem', fontWeight: '600', color: 'var(--primary)', whiteSpace: isMobile ? 'nowrap' : 'normal', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.tecnicatura_nombre ? simplifyTecName(s.tecnicatura_nombre) : '---'}
                  </div>
                </td>
                <td style={{ textAlign: 'center', padding: isMobile ? '8px 5px' : '12px 15px' }}>
                  <select 
                    className={`badge ${s.egresado_tipo === 'Recibido' ? 'badge-recibido' : 'badge-egresado'}`} 
                    style={{ 
                      padding: isMobile ? '4px 6px' : '4px 8px', 
                      borderRadius: '20px', 
                      fontSize: isMobile ? '0.65rem' : '0.75rem', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.5px',
                      border: 'none',
                      cursor: 'pointer',
                      outline: 'none',
                      textAlign: 'center',
                      appearance: 'none',
                      width: isMobile ? '75px' : '100px',
                      color: 'white'
                    }}
                    value={s.egresado_tipo}
                    onChange={(e) => onUpdateGraduate(s, 'egresado_tipo', e.target.value)}
                  >
                    <option value="Egresado">Egresado</option>
                    <option value="Recibido">Recibido</option>
                  </select>
                </td>
                <td style={{ textAlign: 'center', fontWeight: '500', padding: isMobile ? '8px 5px' : '12px 15px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: isMobile ? '2px 6px' : '4px 10px', borderRadius: '6px', fontSize: isMobile ? '0.7rem' : '0.85rem' }}>
                        {s.ciclo_egreso || '---'}
                    </div>
                </td>
                <td style={{ textAlign: 'center', padding: isMobile ? '8px 5px' : '12px 15px' }}>
                  <button 
                    className="icon-btn primary" 
                    title="Ver Legajo / Ficha"
                    style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.2)', width: isMobile ? '30px' : '36px', height: isMobile ? '30px' : '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onClick={() => onViewFicha(s)}
                  >
                    <FileText size={isMobile ? 16 : 18} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={isMobile ? "5" : "6"} style={{ textAlign: 'center', padding: '5rem', opacity: 0.5 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                    <Search size={40} style={{ opacity: 0.2 }} />
                    <p>No se encontraron registros de egresados.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
