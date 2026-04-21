import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Save, 
  Trash2, 
  Printer, 
  Plus, 
  X, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import apiService from '../functions/apiService';

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

const HorariosPanel = ({ user, selectedYearId, selectedCourseId, allCourses }) => {
  const [grid, setGrid] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedCourseId) {
      handleCourseSelect(selectedCourseId);
    } else {
      setGrid([]);
    }
  }, [selectedCourseId]);

  const handleCourseSelect = async (courseId) => {
    setLoading(true);
    try {
      const res = await apiService.get('horarios', { userId: user.id, courseId });
      const parsedGrid = JSON.parse(res.grid_data || '[]');
      setGrid(parsedGrid);
    } catch (err) {
      console.error('Error fetching schedule:', err);
      showMsg('error', 'Error al cargar horario');
      setGrid([]);
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSave = async () => {
    if (!selectedCourseId) return;
    setIsSaving(true);
    try {
      await apiService.post('horarios', user.id, {
        action: 'save',
        course_id: selectedCourseId,
        grid_data: JSON.stringify(grid)
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
    if (!selectedCourseId || !window.confirm('¿Estás seguro de eliminar el horario de este curso?')) return;
    try {
      await apiService.post('horarios', user.id, {
        action: 'delete',
        course_id: selectedCourseId
      });
      setGrid([]);
      showMsg('success', 'Horario eliminado');
    } catch (err) {
      showMsg('error', 'Error al eliminar');
    }
  };

  const addRow = (type = 'slot') => {
    if (type === 'break') {
      setGrid([...grid, { type: 'break', label: 'RECREO', time: '00:00' }]);
    } else {
      setGrid([...grid, {
        type: 'slot',
        time: '00:00 a 00:00',
        days: DAYS.reduce((acc, day) => ({ ...acc, [day]: { subject: '', teacher: '' } }), {})
      }]);
    }
  };

  const removeRow = (index) => {
    const newGrid = [...grid];
    newGrid.splice(index, 1);
    setGrid(newGrid);
  };

  const updateCell = (rowIndex, day, field, value) => {
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

  const selectedCourse = allCourses?.find(c => c.id === selectedCourseId);

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
            <div className="editor-header">
              <div className="course-info">
                <h2>{selectedCourse?.ano}° {selectedCourse?.division} - {selectedCourse?.turno}</h2>
                <span className="badge">{selectedCourse?.tecnicatura_nombre}</span>
              </div>
              <div className="editor-actions">
                <button className="btn btn-primary" onClick={handleSave} disabled={isSaving}>
                  <Save size={18} />
                  <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
                <button className="btn btn-icon" onClick={handlePrint} title="Imprimir">
                  <Printer size={20} />
                </button>
                <button className="btn btn-icon text-danger" onClick={handleDelete} title="Eliminar horario">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>

            <div className="schedule-table-container print-content">
              <table className="schedule-table">
                <thead>
                  <tr>
                    <th className="col-time">Hora</th>
                    {DAYS.map(day => <th key={day}>{day}</th>)}
                    <th className="col-actions print-hide"></th>
                  </tr>
                </thead>
                <tbody>
                  {grid.map((row, rowIndex) => (
                    <tr key={rowIndex} className={row.type === 'break' ? 'row-break' : 'row-slot'}>
                      <td className="cell-time">
                        <input 
                          type="text" 
                          className="input-time" 
                          value={row.time || ''} 
                          onChange={(e) => updateCell(rowIndex, 'time', null, e.target.value)}
                        />
                      </td>
                      {row.type === 'break' ? (
                        <td colSpan={5}>
                          <input 
                            type="text" 
                            className="input-break" 
                            value={row.label} 
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
                                  onChange={(e) => updateCell(rowIndex, day, 'subject', e.target.value)}
                                />
                                <input 
                                  type="text" 
                                  className="input-teacher" 
                                  placeholder="Profesor"
                                  value={row.days?.[day]?.teacher || ''} 
                                  onChange={(e) => updateCell(rowIndex, day, 'teacher', e.target.value)}
                                />
                              </div>
                            </td>
                          ))}
                        </>
                      )}
                      <td className="cell-actions print-hide">
                        <button className="btn-remove" onClick={() => removeRow(rowIndex)}>
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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
          </>
        )}
      </div>

      <style jsx>{`
        .horarios-panel { padding: 10px; animation: fadeIn 0.3s ease; }
        .main-editor { padding: 25px; min-height: 600px; display: flex; flex-direction: column; background: rgba(255,255,255,0.03); }
        .editor-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 20px; }
        .course-info h2 { margin: 0; font-size: 1.8rem; font-weight: 800; color: white; }
        .badge { background: var(--primary-color); color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; margin-top: 8px; display: inline-block; font-weight: 700; text-transform: uppercase; }
        
        .editor-actions { display: flex; gap: 12px; align-items: center; }
        
        .schedule-table-container { overflow-x: auto; flex: 1; }
        .schedule-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .schedule-table th { padding: 15px 10px; text-align: center; background: rgba(255,255,255,0.05); color: #aaa; font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
        .schedule-table td { padding: 10px; border: 1px solid rgba(255,255,255,0.08); vertical-align: top; }

        .col-time { width: 140px; }
        .col-actions { width: 45px; }

        .cell-time { background: rgba(255,255,255,0.02); }
        .input-time { 
          background: transparent; border: none; color: #fff; width: 100%; text-align: center; 
          font-weight: 700; font-size: 0.95rem; outline: none;
        }
        
        .slot-editor { display: flex; flex-direction: column; gap: 6px; }
        .input-subject { background: transparent; border: none; color: white; font-weight: 700; font-size: 0.9rem; text-align: center; outline: none; }
        .input-teacher { background: transparent; border: none; color: var(--primary-color); font-size: 0.8rem; text-align: center; outline: none; opacity: 0.8; }
        .input-subject:focus, .input-teacher:focus { background: rgba(255,255,255,0.05); border-radius: 4px; }
        
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
        .btn-remove:hover { background: #ef4444; color: white; }

        .editor-footer { display: flex; gap: 15px; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); }
        
        .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0.5; padding: 100px 0; }
        .empty-icon { margin-bottom: 20px; color: var(--primary-color); }

        .loading-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .spinner { width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.1); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 15px; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        @media print {
          .print-hide { display: none !important; }
          .glass-card { background: white !important; color: black !important; border: 1px solid #000 !important; box-shadow: none !important; }
          .horarios-panel { padding: 0; }
          .schedule-table { border: 2px solid black !important; width: 100% !important; }
          .schedule-table th, .schedule-table td { border: 1px solid black !important; color: black !important; }
          .input-time, .input-subject, .input-teacher, .input-break { color: black !important; }
          .badge { border: 1px solid black; color: black; background: none; }
        }
      `}</style>
    </div>
  );
};

export default HorariosPanel;
