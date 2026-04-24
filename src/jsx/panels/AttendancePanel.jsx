import React, { useState, useEffect, useMemo } from 'react';
import { Save, Calendar, CheckCircle, XCircle, AlertCircle, Info, Search, ChevronLeft, ChevronRight, Printer } from 'lucide-react';
import { TableSkeleton } from '../UI/Skeleton';
import SaveStatusButton from '../UI/SaveStatusButton';
import '../../css/AttendancePanel.css';

const AttendancePanel = ({ data, user, selectedCourseId, apiService, showToast, isMobile, onPrintInformacion }) => {
  const [loading, setLoading] = useState(false);
  const [attendance, setAttendance] = useState({}); // { studentId|date: value }
  const [pending, setPending] = useState({}); // { studentId|date: value }
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileDayIndex, setMobileDayIndex] = useState(-1);
  
  const canEdit = useMemo(() => {
    const editRoles = ['preceptor', 'admin', 'jefe_de_auxiliares', 'secretaria_de_alumnos', 'director', 'vicedirector'];
    return editRoles.includes(user.rol);
  }, [user.rol]);

  // Generate months for selector (March to December 2026)
  const monthOptions = useMemo(() => {
    const options = [];
    const months = [
      { id: '03', name: 'Marzo' },
      { id: '04', name: 'Abril' },
      { id: '05', name: 'Mayo' },
      { id: '06', name: 'Junio' },
      { id: '07', name: 'Julio' },
      { id: '08', name: 'Agosto' },
      { id: '09', name: 'Septiembre' },
      { id: '10', name: 'Octubre' },
      { id: '11', name: 'Noviembre' },
      { id: '12', name: 'Diciembre' }
    ];
    months.forEach(m => {
      options.push({ value: `2026-${m.id}`, label: m.name });
    });
    return options;
  }, []);

  const monthDays = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const days = [];
    const dayLabels = ['DOM', 'LU', 'MA', 'MIE', 'JUE', 'VIE', 'SAB'];
    
    let currentWeek = 0;
    while (date.getMonth() === month - 1) {
      const dayOfWeek = date.getDay();
      // Start a new week on Mondays (day 1)
      if (dayOfWeek === 1 && days.length > 0) currentWeek++;
      
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Exclude Sunday (0) and Saturday (6)
        days.push({
          day: date.getDate(),
          label: dayLabels[dayOfWeek],
          weekIndex: currentWeek
        });
      }
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [selectedMonth]);

  // Set initial mobileDayIndex based on current day
  useEffect(() => {
    if (isMobile && monthDays.length > 0 && mobileDayIndex === -1) {
      const today = new Date().getDate();
      const idx = monthDays.findIndex(d => d.day >= today);
      setMobileDayIndex(idx === -1 ? monthDays.length - 1 : idx);
    }
  }, [isMobile, monthDays, mobileDayIndex]);

  useEffect(() => {
    setMobileDayIndex(-1);
  }, [selectedMonth]);

  const isToday = (day) => {
    const today = new Date();
    const currentMonthYear = today.toISOString().slice(0, 7);
    return day === today.getDate() && selectedMonth === currentMonthYear;
  };

  const resolvedIndex = useMemo(() => {
    if (mobileDayIndex !== -1) return mobileDayIndex;
    if (monthDays.length === 0) return 0;
    const today = new Date().getDate();
    const idx = monthDays.findIndex(d => d.day >= today);
    return idx === -1 ? monthDays.length - 1 : idx;
  }, [mobileDayIndex, monthDays]);

  const visibleDays = useMemo(() => {
    if (!isMobile) return monthDays;
    
    const idx = resolvedIndex;
    if (monthDays.length === 0) return [];

    const res = [];
    if (idx > 0) res.push(monthDays[idx - 1]);
    else res.push({ day: null, label: '-' });

    res.push(monthDays[idx]);

    if (idx < monthDays.length - 1) res.push(monthDays[idx + 1]);
    else res.push({ day: null, label: '-' });

    return res;
  }, [isMobile, monthDays, resolvedIndex]);

  const loadAttendance = async () => {
    if (!selectedCourseId) return;
    setLoading(true);
    try {
      const res = await apiService.get('asistencia', { courseId: selectedCourseId, month: selectedMonth });
      const map = {};
      res.forEach(item => {
        map[`${item.alumno_id}|${item.fecha}`] = item.valor;
      });
      setAttendance(map);
      setPending({});
    } catch (err) {
      showToast('Error al cargar asistencia: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [selectedCourseId, selectedMonth]);

  const handleCellChange = (alumnoId, day, value) => {
    if (!canEdit) return;
    const val = value.toUpperCase().trim();
    
    // Validation logic: Allow empty, "P", "A", or "AJ"
    if (val !== '') {
      if (val === 'AJ') {
        // Full AJ is allowed
      } else if (val === 'A') {
        // A is allowed (could be partial AJ or just A)
      } else if (val === 'P') {
        // P is allowed
      } else {
        // Any other character is blocked
        return;
      }
    }

    const date = `${selectedMonth}-${String(day).padStart(2, '0')}`;
    const key = `${alumnoId}|${date}`;
    
    setPending(prev => ({ ...prev, [key]: val }));
  };

  const handleCellClick = (alumnoId, day) => {
    if (!isMobile || !canEdit) return;
    
    const currentVal = getCellValue(alumnoId, day);
    let nextVal = '';
    
    if (currentVal === '') nextVal = 'P';
    else if (currentVal === 'P') nextVal = 'A';
    else if (currentVal === 'A') nextVal = 'AJ';
    else if (currentVal === 'AJ') nextVal = '';
    
    const date = `${selectedMonth}-${String(day).padStart(2, '0')}`;
    const key = `${alumnoId}|${date}`;
    setPending(prev => ({ ...prev, [key]: nextVal }));
  };

  const getCellValue = (alumnoId, day) => {
    const date = `${selectedMonth}-${String(day).padStart(2, '0')}`;
    const key = `${alumnoId}|${date}`;
    return pending[key] !== undefined ? pending[key] : (attendance[key] || '');
  };

  const getInputClass = (val) => {
    if (!val) return 'attendance-input';
    const v = val.toLowerCase();
    if (v === 'p') return 'attendance-input val-p';
    if (v === 'a') return 'attendance-input val-a';
    if (v === 'aj') return 'attendance-input val-aj';
    return 'attendance-input';
  };

  const saveChanges = async () => {
    const updates = Object.entries(pending).map(([key, valor]) => {
      const [alumno_id, fecha] = key.split('|');
      return { alumno_id: Number(alumno_id), fecha, valor };
    });

    if (!updates.length) return;

    setLoading(true);
    try {
      await apiService.post('asistencia', { updates });
      showToast('Cambios guardados correctamente', 'success');
      await loadAttendance();
    } catch (err) {
      showToast('Error al guardar cambios: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const hasPendingChanges = Object.keys(pending).length > 0;

  const filteredStudents = useMemo(() => {
    return (data.students || []).filter(s => 
      `${s.apellido} ${s.nombre}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data.students, searchTerm]);

  if (!selectedCourseId) {
    return (
      <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <Calendar size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
        <p style={{ color: 'var(--text-muted)' }}>Seleccione un curso para gestionar la asistencia.</p>
      </div>
    );
  }

  return (
    <section className="page-section animate-fade-in">
      <div className="section-title">
        <Calendar size={18} />
        <h2>Registro de Asistencia Mensual</h2>
      </div>

      <div className="attendance-legend-top glass-card">
        <div className="legend-item">
          <div className="legend-badge badge-p">P</div>
          <span>Presente</span>
        </div>
        <div className="legend-item">
          <div className="legend-badge badge-a">A</div>
          <span>Ausente</span>
        </div>
        <div className="legend-item">
          <div className="legend-badge badge-aj">AJ</div>
          <span>Ausente Justificado</span>
        </div>
      </div>

      <div className="attendance-container">
        <div className="attendance-header glass-card">
          <div className="month-selector-wrapper">
            <label htmlFor="month-select">Período:</label>
            <select 
              id="month-select" 
              className="month-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {monthOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label} 2026</option>
              ))}
            </select>
          </div>

          <div className="search-wrapper">
            <div className="search-input-container">
              <Search size={16} className="search-icon" />
              <input 
                type="text" 
                placeholder="Buscar alumno..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="attendance-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isMobile && (
              <div className="mobile-nav-arrows">
                <button 
                  className="btn btn-icon" 
                  onClick={() => setMobileDayIndex(Math.max(0, resolvedIndex - 1))}
                  disabled={resolvedIndex === 0}
                >
                  <ChevronLeft size={18} />
                </button>
                <button 
                  className="btn btn-icon" 
                  onClick={() => setMobileDayIndex(Math.min(monthDays.length - 1, resolvedIndex + 1))}
                  disabled={resolvedIndex === monthDays.length - 1}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
            <SaveStatusButton
              className="btn-save"
              onClick={saveChanges}
              loading={loading}
              hasChanges={hasPendingChanges}
              canEdit={canEdit}
            />

            <button 
              className="btn btn-secondary" 
              onClick={() => onPrintInformacion?.(selectedMonth, attendance)}
              disabled={loading}
              title="Imprimir Parte Mensual con Asistencias"
            >
              {isMobile ? <Printer size={18} /> : <span>Imprimir Parte</span>}
            </button>
          </div>
        </div>

        <div className="attendance-grid-wrapper shadow-xl">
          {loading && !Object.keys(attendance).length ? (
            <TableSkeleton rows={15} cols={monthDays.length + 1} />
          ) : (
            <table className="attendance-table">
              <thead>
                <tr>
                  <th className="student-col">Alumno</th>
                  {visibleDays.map((d, i) => (
                    <th key={i} className={`day-cell ${d.day ? (d.weekIndex % 2 === 0 ? '' : 'week-alt') : 'day-empty'} ${isToday(d.day) ? 'day-active' : ''}`}>
                      <div className="day-label">{d.label}</div>
                      <div className="day-num">{d.day || ''}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="student-col">
                      <div className="attendance-student-name">
                        {student.apellido.toUpperCase()}, {student.nombre}
                      </div>
                    </td>
                    {visibleDays.map((d, i) => {
                      if (!d.day) return <td key={i} className="day-cell day-empty"></td>;
                      const val = getCellValue(student.id, d.day);
                      return (
                        <td 
                          key={i} 
                          className={`day-cell ${d.weekIndex % 2 === 0 ? '' : 'week-alt'} ${isToday(d.day) ? 'day-active' : ''}`}
                          onClick={() => handleCellClick(student.id, d.day)}
                          style={isMobile ? { cursor: 'pointer' } : {}}
                        >
                          <input 
                            type="text"
                            className={getInputClass(val)}
                            value={val}
                            onChange={(e) => handleCellChange(student.id, d.day, e.target.value)}
                            readOnly={isMobile || !canEdit}
                            maxLength={2}
                            autoComplete="off"
                            style={(isMobile || !canEdit) ? { pointerEvents: 'none' } : {}}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
};

export default AttendancePanel;
