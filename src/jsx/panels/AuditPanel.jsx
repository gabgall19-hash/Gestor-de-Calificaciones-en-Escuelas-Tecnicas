import React, { useState, useMemo } from 'react';
import { History, X, Search, Trash2, Info, Plus, Pencil, MinusCircle } from 'lucide-react';

const AuditPanel = ({ data, user, onDelete }) => {
  const [selectedLog, setSelectedLog] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, add, edit, delete
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  const abbreviateRole = (role) => {
    const roles = {
      'admin': 'ADM',
      'jefe_de_auxiliares': 'JEF',
      'preceptor': 'PREC',
      'director': 'DIR',
      'vicedirector': 'VDIR',
      'secretaria_de_alumnos': 'SEC',
      'profesor': 'PROF',
      'preceptor_taller': 'P.TAL',
      'preceptor_ef': 'P.EF',
      'visualizador': 'VIS'
    };
    return roles[role] || role.substring(0, 3).toUpperCase();
  };

  const getRoleColor = (role) => {
    const colors = {
      'admin': '#ef4444',
      'secretaria_de_alumnos': '#06b6d4',
      'jefe_de_auxiliares': '#ec4899',
      'director': '#8b5cf6',
      'vicedirector': '#a78bfa',
      'preceptor': '#10b981',
      'preceptor_taller': '#f59e0b',
      'preceptor_ef': '#14b8a6',
      'profesor': '#6366f1'
    };
    return colors[role] || 'var(--primary)';
  };

  const getActionInfo = (log) => {
    const tipo = log.tipo_evento || '';
    const detail = log.detalle || '';
    
    // Prioridad para logs de sistema (Config) con colores específicos
    if (tipo.includes('gestion') || tipo.includes('historial') || tipo === 'password_edit' || tipo === 'acknowledge_security') {
      let color = '#ec4899';
      if (detail.includes('Usuario creado')) color = '#10b981'; // Verde
      if (detail.includes('Usuario actualizado')) color = '#f59e0b'; // Amarillo/Naranja
      return { type: 'config', color, icon: <Info size={12} /> };
    }

    if (tipo === 'notas_add' || detail.includes('Carga')) return { type: 'add', color: '#10b981', icon: <Plus size={12} /> };
    if (tipo === 'notas_edit' || tipo.includes('horarios') || detail.includes('Modificación') || detail.includes('Edición')) return { type: 'edit', color: '#f59e0b', icon: <Pencil size={11} /> };
    if (tipo === 'notas_delete' || detail.includes('Eliminación')) return { type: 'delete', color: '#ef4444', icon: <MinusCircle size={12} /> };
    if (tipo.includes('alumno') || tipo === 'pase_alumno' || tipo.includes('transferencia') || tipo === 'ficha_edit' || tipo === 'password_edit' || tipo === 'observacion' || tipo === 'pase_undo') return { type: 'students', color: '#06b6d4', icon: <Info size={12} /> };
    if (tipo.includes('asistencia')) return { type: 'attendance', color: '#8b5cf6', icon: <Info size={12} /> };
    
    return { type: 'other', color: 'var(--primary)', icon: <Info size={12} /> };
  };

  const filteredHistorial = useMemo(() => {
    let logs = data.historial || [];
    const isAdminOrJefe = user.rol === 'admin' || user.rol === 'jefe_de_auxiliares';
    
    // Filtro por tipo de pestaña
    if (filterType === 'all') {
      // En "Todos" mostramos Cargas, Ediciones y Eliminaciones para todos.
      // Si es Admin/Jefe, también mostramos Alumnos y Asistencia.
      // NUNCA mostramos Sistema (config) en "Todos".
      const allowedTypes = ['add', 'edit', 'delete'];
      if (isAdminOrJefe) {
        allowedTypes.push('students', 'attendance');
      }
      
      logs = logs.filter(h => {
        const info = getActionInfo(h);
        return allowedTypes.includes(info.type);
      });
    } else {
      // Si no es Admin/Jefe, bloqueamos el acceso a pestañas restringidas
      if (!isAdminOrJefe && ['students', 'attendance', 'config'].includes(filterType)) {
        return [];
      }

      logs = logs.filter(h => {
        const info = getActionInfo(h);
        return info.type === filterType;
      });
    }

    if (!searchTerm.trim()) return logs;
    const lower = searchTerm.toLowerCase();
    return logs.filter(h => 
      (h.detalle || '').toLowerCase().includes(lower) ||
      (h.usuario_nombre || '').toLowerCase().includes(lower) ||
      (h.alumno_apellido || '').toLowerCase().includes(lower) ||
      (h.alumno_nombre || '').toLowerCase().includes(lower)
    );
  }, [data.historial, searchTerm, filterType, user.rol]);

  const paginatedHistorial = useMemo(() => {
    return filteredHistorial.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredHistorial, currentPage]);

  const totalPages = Math.ceil(filteredHistorial.length / itemsPerPage);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const handleDeleteAll = () => {
    if (window.confirm('¿ESTÁS COMPLETAMENTE SEGURO? Se borrará TODO el historial de este curso. Esta acción no se puede deshacer.')) {
      onDelete('delete_all');
    }
  };

  const handleDeleteOne = (id) => {
    if (window.confirm('¿Eliminar este registro del historial?')) {
      onDelete('delete_one', id);
    }
  };

  const isAdminOrJefe = user.rol === 'admin' || user.rol === 'jefe_de_auxiliares';

  return (
    <section className="page-section">
      <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={16} />
          <h2>Historial de Actividad</h2>
        </div>
        {isAdminOrJefe && (
          <button 
            className="btn btn-danger" 
            style={{ padding: '4px 12px', fontSize: '0.75rem', height: 'auto' }}
            onClick={handleDeleteAll}
          >
            <Trash2 size={12} /> Borrar Todo
          </button>
        )}
      </div>

      <div className="glass-card" style={{ marginTop: '1rem', padding: '0.8rem' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'Todos', color: 'var(--primary)', visible: true },
            { id: 'add', label: 'Cargas', color: '#10b981', visible: true },
            { id: 'edit', label: 'Ediciones', color: '#f59e0b', visible: true },
            { id: 'delete', label: 'Eliminaciones', color: '#ef4444', visible: true },
            { id: 'students', label: 'Alumnos', color: '#06b6d4', visible: isAdminOrJefe },
            { id: 'attendance', label: 'Asistencia', color: '#8b5cf6', visible: isAdminOrJefe },
            { id: 'config', label: 'Sistema', color: '#ec4899', visible: isAdminOrJefe }
          ].filter(tab => tab.visible).map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              style={{
                padding: '4px 12px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 'bold',
                border: `1px solid ${filterType === tab.id ? tab.color : 'rgba(255,255,255,0.1)'}`,
                background: filterType === tab.id ? `${tab.color}22` : 'transparent',
                color: filterType === tab.id ? tab.color : 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="search-box" style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={16} style={{ opacity: 0.5 }} />
          <input 
            type="text" 
            placeholder="Buscar por usuario, alumno o detalle..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ background: 'none', border: 'none', color: 'white', outline: 'none', width: '100%', padding: '8px 0', fontSize: '0.85rem' }}
          />
        </div>

        <div className="audit-list" style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '5px' }}>
          {filteredHistorial.length === 0 ? (
            <p style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>No se encontraron registros.</p>
          ) : (
            <>
              {paginatedHistorial.map((h) => {
                const hasDetail = h.detalle.includes('[DETALLE]');
                const mainDetail = h.detalle.split('Desglose:')[0].replace('[DETALLE]', '').trim();
                const action = getActionInfo(h);
                
                return (
                  <div key={h.id} className="audit-item compact" style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start',
                    padding: '8px 12px',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '6px',
                    marginBottom: '6px',
                    borderLeft: `4px solid ${action.color}`,
                    position: 'relative',
                    gap: '10px'
                  }}>
                    <div style={{ color: action.color, marginTop: '18px', opacity: 0.8 }}>
                      {action.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontSize: '0.68rem', opacity: 0.5, fontWeight: 'bold' }}>
                          {new Date(h.fecha).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ 
                            fontSize: '0.6rem', 
                            color: 'white', 
                            fontWeight: '900', 
                            background: getRoleColor(h.usuario_rol), 
                            padding: '1px 5px', 
                            borderRadius: '3px',
                            textTransform: 'uppercase'
                          }}>
                            {abbreviateRole(h.usuario_rol)}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'white', opacity: 0.9, fontWeight: 'bold' }}>
                            — {h.usuario_nombre}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.82rem', lineHeight: '1.4' }}>
                        {h.alumno_nombre && <span style={{ fontWeight: 'bold', marginRight: '6px', opacity: 0.7 }}>{h.alumno_apellido}:</span>}
                        <span style={{ opacity: 0.9, color: 'white', fontWeight: 'normal' }}>
                          {mainDetail}
                        </span>
                        {hasDetail && (
                          <button 
                            onClick={() => setSelectedLog(h)}
                            className="detail-link"
                            style={{ 
                              background: 'none', border: 'none', color: 'var(--primary)', 
                              textDecoration: 'underline', cursor: 'pointer', fontSize: '0.75rem', 
                              marginLeft: '8px', fontWeight: 'bold', padding: 0
                            }}
                          >
                            Detalle
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {(user.rol === 'admin' || user.rol === 'jefe_de_auxiliares') && (
                      <button 
                        onClick={() => handleDeleteOne(h.id)}
                        style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', opacity: 0.4, padding: '4px' }}
                        title="Eliminar registro"
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.4'}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })}
              
              {totalPages > 1 && (
                <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <button 
                    className="page-btn" 
                    disabled={currentPage === 1} 
                    onClick={() => { setCurrentPage(p => p - 1); document.querySelector('.audit-list').scrollTo(0,0); }}
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Anterior
                  </button>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Página {currentPage} de {totalPages}</span>
                  <button 
                    className="page-btn" 
                    disabled={currentPage === totalPages} 
                    onClick={() => { setCurrentPage(p => p + 1); document.querySelector('.audit-list').scrollTo(0,0); }}
                    style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: 'white', cursor: 'pointer', fontSize: '0.85rem' }}
                  >
                    Siguiente
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal-content glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Info size={18} /> Desglose de Operación</h3>
              <button className="icon-btn" onClick={() => setSelectedLog(null)} style={{ background: 'rgba(255,255,255,0.1)' }}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                <div><strong>Fecha:</strong> {new Date(selectedLog.fecha).toLocaleString('es-AR')}</div>
                <div><strong>Usuario:</strong> {selectedLog.usuario_nombre}</div>
                <div style={{ gridColumn: 'span 2' }}><strong>Actividad:</strong> {selectedLog.detalle.split('Desglose:')[0].replace('[DETALLE]', '').trim()}</div>
              </div>
              
              <div className="glass-card" style={{ padding: '0', background: 'rgba(0,0,0,0.2)', overflow: 'hidden' }}>
                <div style={{ padding: '10px 15px', background: 'rgba(255,255,255,0.05)', fontSize: '0.8rem', fontWeight: 'bold', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  Alumnos y Notas Registradas
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '10px 15px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
                    {selectedLog.detalle.includes('Desglose:') ? (
                      selectedLog.detalle.split('Desglose:')[1].split('|').map((item, idx) => {
                        const [name, val] = item.split(':');
                        return (
                          <React.Fragment key={idx}>
                            <div style={{ fontSize: '0.85rem', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{name.trim()}</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--primary)', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{val?.trim()}</div>
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <div style={{ gridColumn: 'span 2', opacity: 0.7 }}>No hay desglose disponible para este registro.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedLog(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AuditPanel;
