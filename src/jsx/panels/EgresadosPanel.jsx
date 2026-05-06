import React, { useState, useMemo } from 'react';
import { Search, GraduationCap, FileText, Filter } from 'lucide-react';
import { simplifyTecName } from '../functions/PreceptorHelpers';

export default function EgresadosPanel({ data, onViewFicha, onUpdateGraduate }) {
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
    <div className="panel-container animate-fade-in" style={{ padding: '1rem' }}>
      <div className="panel-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div className="icon-badge primary" style={{ background: 'linear-gradient(135deg, var(--primary), #4f46e5)', color: 'white', padding: '12px', borderRadius: '15px' }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <h2 className="panel-title" style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>Registro de Egresados</h2>
            <p className="panel-subtitle" style={{ opacity: 0.6, fontSize: '0.9rem' }}>Listado global de alumnos que finalizaron su formación técnica.</p>
          </div>
        </div>
        <div className="panel-stats" style={{ display: 'flex', gap: '10px' }}>
            <div className="stat-pill" style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 15px', borderRadius: '10px', fontSize: '0.85rem', border: '1px solid rgba(255,255,255,0.1)' }}>
                <strong>{data.graduates?.length || 0}</strong> Egresados Totales
            </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-container" style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
            <input 
              type="text" 
              className="input-field" 
              style={{ paddingLeft: '45px', width: '100%' }}
              placeholder="Buscar por Apellido, Nombre o DNI..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Filter size={16} style={{ opacity: 0.5 }} />
            <select 
              className="input-field compact-select" 
              style={{ width: '180px' }}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="todos">Todos los Tipos</option>
              <option value="Recibido">Recibidos</option>
              <option value="Egresado">Egresados (Pendientes)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-responsive custom-scroll" style={{ borderRadius: '15px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15, 23, 42, 0.3)' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Alumno</th>
              <th>DNI</th>
              <th>Carrera / Tecnicatura</th>
              <th style={{ textAlign: 'center' }}>Estado / Tipo</th>
              <th style={{ textAlign: 'center' }}>Ciclo de Egreso</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="hover-row">
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="avatar-small" style={{ background: s.egresado_tipo === 'Recibido' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(212, 175, 55, 0.2)', color: s.egresado_tipo === 'Recibido' ? '#10b981' : '#d4af37', fontWeight: 'bold' }}>
                      {s.apellido?.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{s.apellido}, {s.nombre}</div>
                    </div>
                  </div>
                </td>
                <td style={{ opacity: 0.8, fontFamily: 'monospace' }}>{s.dni || '---'}</td>
                <td>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary)' }}>
                    {s.tecnicatura_nombre ? simplifyTecName(s.tecnicatura_nombre) : '---'}
                  </div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <select 
                    className={`badge ${s.egresado_tipo === 'Recibido' ? 'badge-recibido' : 'badge-egresado'}`} 
                    style={{ 
                      padding: '4px 8px', 
                      borderRadius: '20px', 
                      fontSize: '0.75rem', 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.5px',
                      border: 'none',
                      cursor: 'pointer',
                      outline: 'none',
                      textAlign: 'center',
                      appearance: 'none',
                      width: '100px',
                      color: 'white'
                    }}
                    value={s.egresado_tipo}
                    onChange={(e) => onUpdateGraduate(s, 'egresado_tipo', e.target.value)}
                  >
                    <option value="Egresado">Egresado</option>
                    <option value="Recibido">Recibido</option>
                  </select>
                </td>
                <td style={{ textAlign: 'center', fontWeight: '500' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.85rem' }}>
                        {s.ciclo_egreso || '---'}
                    </div>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button 
                    className="icon-btn primary" 
                    title="Ver Legajo / Ficha"
                    style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.2)' }}
                    onClick={() => onViewFicha(s)}
                  >
                    <FileText size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '5rem', opacity: 0.5 }}>
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
