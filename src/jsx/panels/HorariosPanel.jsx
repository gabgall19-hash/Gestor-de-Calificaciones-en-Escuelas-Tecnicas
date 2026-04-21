import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Save, 
  Trash2, 
  Printer, 
  Plus, 
  X, 
  CheckCircle2,
  AlertCircle,
  GripVertical
} from 'lucide-react';
import apiService from '../functions/apiService';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

const HorariosPanel = ({ user, selectedYearId, selectedCourseId, allCourses }) => {
  const [grid, setGrid] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);

  const isAdmin = user.rol === 'admin';

  useEffect(() => {
    if (selectedCourseId) {
      handleCourseSelect(selectedCourseId);
    } else {
      setGrid([]);
      setMeta({});
    }
  }, [selectedCourseId]);

  const handleCourseSelect = async (courseId) => {
    setLoading(true);
    try {
      const res = await apiService.get('horarios', { userId: user.id, courseId });
      let parsed;
      try {
        parsed = JSON.parse(res.grid_data || '[]');
      } catch (e) {
        parsed = [];
      }
      
      let finalGrid = [];
      if (Array.isArray(parsed)) {
        finalGrid = parsed;
        setMeta({});
      } else {
        finalGrid = parsed.grid || [];
        setMeta(parsed.meta || {});
      }

      // Add "hrs" if missing
      finalGrid = finalGrid.map(row => ({
        ...row,
        time: row.time && !row.time.toLowerCase().includes('hrs') ? `${row.time} hrs` : row.time
      }));

      setGrid(finalGrid);
    } catch (err) {
      console.error('Error fetching schedule:', err);
      showMsg('error', 'Error al cargar horario');
      setGrid([]);
      setMeta({});
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSave = async () => {
    if (!selectedCourseId || !isAdmin) return;
    setIsSaving(true);
    try {
      await apiService.post('horarios', user.id, {
        action: 'save',
        course_id: selectedCourseId,
        grid_data: JSON.stringify({ meta, grid })
      });
      showMsg('success', 'Horario guardado correctamente');
    } catch (err) {
      console.error('Error saving schedule:', err);
      showMsg('error', 'Error al guardar horario');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCourseId || !isAdmin || !window.confirm('¿Estás seguro de eliminar el horario de este curso?')) return;
    try {
      await apiService.post('horarios', user.id, {
        action: 'delete',
        course_id: selectedCourseId
      });
      setGrid([]);
      setMeta({});
      showMsg('success', 'Horario eliminado');
    } catch (err) {
      showMsg('error', 'Error al eliminar');
    }
  };

  const addRow = (type = 'slot') => {
    if (!isAdmin) return;
    if (type === 'break') {
      setGrid([...grid, { type: 'break', label: 'RECREO', time: '00:00 hrs' }]);
    } else {
      setGrid([...grid, {
        type: 'slot',
        time: '00:00 a 00:00 hrs',
        days: DAYS.reduce((acc, day) => ({ ...acc, [day]: { subject: '', teacher: '' } }), {})
      }]);
    }
  };

  const removeRow = (index) => {
    if (!isAdmin) return;
    const newGrid = [...grid];
    newGrid.splice(index, 1);
    setGrid(newGrid);
  };

  const updateCell = (rowIndex, day, field, value) => {
    if (!isAdmin) return;
    const newGrid = [...grid];
    if (day === 'time') {
      newGrid[rowIndex].time = value;
    } else if (day === 'label') {
      newGrid[rowIndex].label = value;
    } else {
      if (!newGrid[rowIndex].days) newGrid[rowIndex].days = {};
      if (!newGrid[rowIndex].days[day]) newGrid[rowIndex].days[day] = { subject: '', teacher: '' };
      newGrid[rowIndex].days[day][field] = value;
    }
    setGrid(newGrid);
  };

  const handlePrint = () => {
    window.print();
  };

  const onDragStart = (e, index) => {
    if (!isAdmin) return;
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e, index) => {
    e.preventDefault();
    if (!isAdmin || draggedItemIndex === null || draggedItemIndex === index) return;
    
    const items = [...grid];
    const draggedItem = items[draggedItemIndex];
    items.splice(draggedItemIndex, 1);
    items.splice(index, 0, draggedItem);
    
    setDraggedItemIndex(index);
    setGrid(items);
  };

  const onDragEnd = () => {
    setDraggedItemIndex(null);
  };

  const selectedCourse = allCourses?.find(c => c.id === selectedCourseId);

  const getHeaderColor = () => {
    const tec = selectedCourse?.tecnicatura_nombre?.toUpperCase() || '';
    if (tec.includes('CICLO BASICO')) return '#ff9900'; 
    if (tec.includes('AERONAUTICA')) return '#2563eb'; 
    if (tec.includes('ELECTRONICA')) return '#16a34a'; 
    if (tec.includes('AUTOMOTORES')) return '#dc2626'; 
    return '#ffff00';
  };

  const getCiclo = () => {
    const ano = Number(selectedCourse?.ano);
    if (ano <= 2) return 'Básico';
    return 'Superior';
  };

  return (
    <div className="horarios-panel">
      {message && (
        <div className={`message-banner ${message.type}`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="main-editor glass-card">
        {!selectedCourseId ? (
          <div className="empty-state">
            <Calendar size={64} className="empty-icon" />
            <h3>Selecciona un curso</h3>
            <p>Elige un curso en el menú superior para gestionar su horario.</p>
          </div>
        ) : loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Cargando horario...</p>
          </div>
        ) : (
          <>
            <div className="editor-header no-print">
              <div className="course-info">
                <h2>{selectedCourse?.ano}° {selectedCourse?.division} - {selectedCourse?.turno} - {selectedCourse?.preceptor_nombre}</h2>
                <span className="badge">{selectedCourse?.tecnicatura_nombre}</span>
              </div>
              <div className="editor-actions">
                {isAdmin && (
                  <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                    <Save size={18} />
                    <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
                  </button>
                )}
                <button className="btn btn-icon" onClick={handlePrint} title="Imprimir">
                  <Printer size={20} />
                </button>
                {isAdmin && (
                  <button className="btn btn-icon text-danger" onClick={handleDelete} title="Eliminar horario">
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>

            {/* Institutional Print Header */}
            <div className="print-only inst-header">
              <div className="yellow-banner" style={{ background: getHeaderColor(), color: getHeaderColor() === '#ff9900' ? 'black' : 'white' }}>
                HORARIO 2026 - INDUSTRIAL N°6 "X BRIGADA AÉREA"
              </div>
              <table className="meta-print-table">
                <thead>
                  <tr>
                    <th>Auxiliar Docente</th>
                    <th>Año / Curso</th>
                    <th>Ciclo</th>
                    <th>División</th>
                    <th>Turno</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{selectedCourse?.preceptor_nombre || '---'}</td>
                    <td>{selectedCourse?.ano}°</td>
                    <td>{getCiclo()}</td>
                    <td>{selectedCourse?.division}</td>
                    <td>{selectedCourse?.turno}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="schedule-table-container print-content">
              <table className="schedule-table">
                <thead>
                  <tr>
                    {isAdmin && <th className="col-drag print-hide"></th>}
                    <th className="col-time">Hora</th>
                    {DAYS.map(day => <th key={day}>{day}</th>)}
                    {isAdmin && <th className="col-actions print-hide"></th>}
                  </tr>
                </thead>
                <tbody>
                  {grid.map((row, rowIndex) => (
                    <tr 
                      key={rowIndex} 
                      className={`${row.type === 'break' ? 'row-break' : 'row-slot'} ${draggedItemIndex === rowIndex ? 'dragging' : ''}`}
                      draggable={isAdmin}
                      onDragStart={(e) => onDragStart(e, rowIndex)}
                      onDragOver={(e) => onDragOver(e, rowIndex)}
                      onDragEnd={onDragEnd}
                    >
                      {isAdmin && (
                        <td className="cell-drag print-hide">
                          <GripVertical size={16} className="drag-handle" />
                        </td>
                      )}
                      <td className="cell-time">
                        <input 
                          type="text" 
                          className="input-time" 
                          value={row.time || ''} 
                          readOnly={!isAdmin}
                          onChange={(e) => updateCell(rowIndex, 'time', null, e.target.value)}
                        />
                      </td>
                      {row.type === 'break' ? (
                        <td colSpan={5}>
                          <input 
                            type="text" 
                            className="input-break" 
                            value={row.label} 
                            readOnly={!isAdmin}
                            onChange={(e) => updateCell(rowIndex, 'label', null, e.target.value)}
                          />
                        </td>
                      ) : (
                        <>
                          {DAYS.map(day => (
                            <td key={day} className="cell-slot">
                              <div className="slot-editor">
                                <input 
                                  type="text" 
                                  className="input-subject" 
                                  placeholder="Materia"
                                  value={row.days?.[day]?.subject || ''} 
                                  readOnly={!isAdmin}
                                  onChange={(e) => updateCell(rowIndex, day, 'subject', e.target.value)}
                                />
                                <input 
                                  type="text" 
                                  className="input-teacher" 
                                  placeholder="Profesor"
                                  value={row.days?.[day]?.teacher || ''} 
                                  readOnly={!isAdmin}
                                  onChange={(e) => updateCell(rowIndex, day, 'teacher', e.target.value)}
                                />
                              </div>
                            </td>
                          ))}
                        </>
                      )}
                      {isAdmin && (
                        <td className="cell-actions print-hide">
                          <button className="btn-remove" onClick={() => removeRow(rowIndex)}>
                            <X size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {isAdmin && (
              <div className="editor-footer print-hide">
                <button className="btn btn-outline" onClick={() => addRow('slot')}>
                  <Plus size={18} />
                  <span>Agregar Hora</span>
                </button>
                <button className="btn btn-outline" onClick={() => addRow('break')}>
                  <Plus size={18} />
                  <span>Agregar Recreo</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .horarios-panel { padding: 10px; animation: fadeIn 0.3s ease; }
        .main-editor { padding: 25px; min-height: 600px; display: flex; flex-direction: column; background: rgba(255,255,255,0.03); }
        .editor-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; }
        .course-info h2 { margin: 0; font-size: 1.6rem; font-weight: 800; color: white; }
        .badge { background: var(--primary-color); color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; margin-top: 8px; display: inline-block; font-weight: 700; text-transform: uppercase; }
        
        .editor-actions { display: flex; gap: 12px; align-items: center; }
        
        .schedule-table-container { overflow-x: auto; flex: 1; }
        .schedule-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .schedule-table th { padding: 15px 10px; text-align: center; background: rgba(255,255,255,0.05); color: #aaa; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
        .schedule-table td { padding: 10px; border: 1px solid rgba(255,255,255,0.08); vertical-align: middle; }

        .col-drag { width: 40px; }
        .col-time { width: 140px; }
        .col-actions { width: 45px; }

        .cell-drag { cursor: grab; display: flex; align-items: center; justify-content: center; height: 100%; min-height: 50px; opacity: 0.3; transition: 0.2s; }
        tr:hover .cell-drag { opacity: 1; }
        .dragging { opacity: 0.4; background: rgba(var(--primary-rgb), 0.1) !important; }

        .cell-time { background: rgba(255,255,255,0.02); text-align: center; }
        .input-time { 
          background: transparent; border: none; color: #fff; width: 100%; text-align: center; 
          font-weight: 700; font-size: 0.95rem; outline: none;
        }
        
        .slot-editor { display: flex; flex-direction: column; gap: 6px; }
        .input-subject { background: transparent; border: none; color: white; font-weight: 700; font-size: 0.9rem; text-align: center; outline: none; }
        .input-teacher { background: transparent; border: none; color: var(--primary-color); font-size: 0.8rem; text-align: center; outline: none; opacity: 0.8; }
        
        .row-break { background: rgba(255,255,255,0.04); }
        .input-break { 
          width: 100%; background: transparent; border: none; color: #ffcc00; 
          text-align: center; font-style: italic; letter-spacing: 4px; font-weight: 700; outline: none;
        }

        .btn-remove { 
          background: rgba(239, 68, 68, 0.1); border: none; color: #ef4444; 
          padding: 6px; border-radius: 50%; cursor: pointer; opacity: 0; transition: 0.2s;
        }
        tr:hover .btn-remove { opacity: 1; }

        .editor-footer { display: flex; gap: 15px; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
        
        .print-only { display: none; }

        @media print {
          .no-print, .print-hide { display: none !important; }
          .print-only { display: block !important; }
          .horarios-panel { padding: 0; background: white; }
          .main-editor { background: white !important; padding: 0; border: none; }
          
          .inst-header { margin-bottom: 20px; }
          .yellow-banner { 
             -webkit-print-color-adjust: exact; 
            text-align: center; font-weight: 900; padding: 10px; border: 2px solid black;
            font-size: 1.2rem;
          }
          
          .meta-print-table { 
            width: 100%; border-collapse: collapse; margin-top: -2px;
          }
          .meta-print-table th, .meta-print-table td { 
            border: 2px solid black; padding: 4px; text-align: center; font-size: 0.8rem;
          }
          .meta-print-table th { background: #f0f0f0 !important; font-weight: 400; color: #666; }
          .meta-print-table td { font-weight: 900; }

          .schedule-table { border: 2px solid black !important; width: 100% !important; margin-top: 10px; border-top: none !important; }
          .schedule-table th { background: #f0f0f0 !important; color: black !important; border: 2px solid black !important; padding: 5px; }
          .schedule-table td { border: 2px solid black !important; color: black !important; }
          
          .row-break td { background: #d9ead3 !important; -webkit-print-color-adjust: exact; }
          .input-break { color: black !important; font-weight: 900; font-size: 1rem; }
          .input-time, .input-subject, .input-teacher { color: black !important; background: transparent !important; }
          .input-teacher { font-style: italic; opacity: 1; }
          .input-subject { font-weight: 900; }
        }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default HorariosPanel;
