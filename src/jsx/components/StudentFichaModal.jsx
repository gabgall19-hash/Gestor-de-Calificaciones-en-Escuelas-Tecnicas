import React from 'react';
import { User, Shield, Home, Phone, Mail, Calendar, BookOpen, Save, X, ArrowLeft, History, Image as ImageIcon, Plus, Trash2, Eye, Maximize2, FileText } from 'lucide-react';
import Modal from '../UI/Modal';
import { formatDNI } from '../functions/PreceptorHelpers';

const StudentFichaModal = ({ student, onClose, onSave, isEditing, setIsEditing, studentForm, setStudentForm, fullPage = false, getHistorial }) => {
  const [historial, setHistorial] = React.useState([]);
  const [loadingHistorial, setLoadingHistorial] = React.useState(false);
  const [images, setImages] = React.useState([]);
  const [isUploading, setIsUploading] = React.useState(false);

  React.useEffect(() => {
    if (student?.id) {
      loadHistorial();
      loadImages();
    }
  }, [student?.id]);

  const loadImages = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      const res = await fetch(`/api/data?type=student_images&studentId=${student.id}`, {
        headers: { 'Authorization': `Bearer ${currentUser?.token}` }
      });
      const json = await res.json();
      setImages(Array.isArray(json) ? json : []);
    } catch (err) { console.error("Error loading images:", err); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const titulo = window.prompt("Título del archivo (ej: DNI Frente, Certificado Médico):");
    if (!titulo) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const res = await fetch(`https://api.imgbb.com/1/upload?key=48bf2f480ae36924a8d74ae9a38ed6d3`, {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      
      if (json.success) {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        await fetch(`/api/data?type=student_images&userId=${currentUser.id}`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentUser.token}`
          },
          body: JSON.stringify({
            action: 'create',
            alumno_id: student.id,
            titulo: titulo,
            url: json.data.url
          })
        });
        loadImages();
      }
    } catch (err) {
      alert("Error al subir archivo");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const deleteImage = async (id) => {
    if (!window.confirm("¿Eliminar este archivo adjunto?")) return;
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    await fetch(`/api/data?type=student_images&userId=${currentUser.id}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentUser.token}`
      },
      body: JSON.stringify({ action: 'delete', id })
    });
    loadImages();
  };

  const loadHistorial = async () => {
    if (!getHistorial) return;
    setLoadingHistorial(true);
    try {
      const res = await getHistorial(student.id);
      setHistorial(res?.results || res || []);
    } catch (err) {
      console.error("Error loading history:", err);
    } finally {
      setLoadingHistorial(false);
    }
  };
  if (!student) return null;

  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    try {
      // Si ya está en formato YYYY-MM-DD, devolverlo
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
      
      // Intentar parsear si viene en formato DD/MM/YYYY o similar
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
      
      // Fallback para DD/MM/YYYY manual
      const parts = dateStr.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      }
    } catch (e) { return ''; }
    return '';
  };

  const calculateAge = (birthday) => {
    if (!birthday) return '';
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : '';
  };

  const handleChange = (field, value) => {
    const numericFields = ['dni', 'tutor_dni', 'libro', 'folio', 'legajo', 'edad', 'cuil'];
    if (numericFields.includes(field)) {
      value = value.replace(/\D/g, '');
      if (field === 'dni' || field === 'tutor_dni') value = value.slice(0, 8);
      if (field === 'cuil') value = value.slice(0, 11);
    }
    
    setStudentForm(prev => {
      const next = { ...prev, [field]: value };
      // Si cambia la fecha de nacimiento, calculamos la edad
      if (field === 'fecha_nacimiento') {
        const autoAge = calculateAge(value);
        if (autoAge !== '') next.edad = String(autoAge);
      }
      return next;
    });
  };

  // Limpieza automática al entrar en modo edición para evitar errores de validación
  React.useEffect(() => {
    if (isEditing) {
      setStudentForm(prev => {
        const next = { ...prev };
        if (next.cuil) next.cuil = next.cuil.replace(/\D/g, '');
        if (next.dni) next.dni = next.dni.replace(/\D/g, '');
        if (next.tutor_dni) next.tutor_dni = next.tutor_dni.replace(/\D/g, '');
        return next;
      });
    }
  }, [isEditing]);

  const emailDomains = ["@gmail.com", "@hotmail.com", "@outlook.com", "@yahoo.com", "@live.com.ar", "@me.com", "@icloud.com"];

  const sections = [
    {
      title: 'Datos Personales',
      icon: <User size={18} />,
      fields: [
        { label: 'Apellido(s)', key: 'apellido', type: 'text' },
        { label: 'Nombre(s)', key: 'nombre', type: 'text' },
        { label: 'DNI', key: 'dni', type: 'text', formatter: formatDNI },
        { label: 'CUIL', key: 'cuil', type: 'text' },
        { label: 'Sexo', key: 'genero', type: 'select', options: ['Masculino', 'Femenino'] },
        { label: 'Fecha de Nacimiento', key: 'fecha_nacimiento', type: 'date' },
        { label: 'Edad', key: 'edad', type: 'number' },
      ]
    },
    {
      title: 'Responsable / Tutor',
      icon: <Shield size={18} />,
      fields: [
        { label: 'Nombre del Tutor', key: 'tutor_nombre', type: 'text' },
        { label: 'Parentesco', key: 'tutor_parentesco', type: 'text' },
        { label: 'DNI Tutor', key: 'tutor_dni', type: 'text', formatter: formatDNI },
        { label: 'Teléfono de Contacto', key: 'tutor_contacto', type: 'text', icon: <Phone size={14} /> },
        { label: 'Email Tutor', key: 'tutor_mail', type: 'email', icon: <Mail size={14} />, list: 'email-suggestions' },
      ]
    },
    {
      title: 'Ubicación y Legajo',
      icon: <Home size={18} />,
      fields: [
        { label: 'Domicilio', key: 'domicilio', type: 'text', fullWidth: true },
        { label: 'Matrícula', key: 'matricula', type: 'text' },
        { label: 'Libro (L°)', key: 'libro', type: 'text' },
        { label: 'Folio (F°)', key: 'folio', type: 'text' },
        { label: 'Legajo N°', key: 'legajo', type: 'text' },
      ]
    },
    {
      title: 'Observaciones Pedagógicas',
      icon: <FileText size={18} />,
      isFullRow: true,
      fields: [
        { label: 'Historial de Observaciones', key: 'observaciones', type: 'textarea' },
      ]
    }
  ];

  const content = (
    <div className="ficha-alumno" style={{ width: '100%' }}>
      <datalist id="email-suggestions">
        {studentForm.tutor_mail && !studentForm.tutor_mail.includes('@') && emailDomains.map(domain => (
          <option key={domain} value={`${studentForm.tutor_mail}${domain}`} />
        ))}
        {emailDomains.map(domain => <option key={domain} value={domain} />)}
      </datalist>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {fullPage && (
            <button className="icon-btn" onClick={onClose} style={{ background: 'var(--primary)', padding: '12px', borderRadius: '12px', color: 'white', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' }}>
              <ArrowLeft size={22} />
            </button>
          )}
          {!fullPage && (
            <div style={{ background: 'var(--primary)', padding: '10px', borderRadius: '12px' }}>
              <User size={24} color="white" />
            </div>
          )}
          <div>
            <h2 style={{ margin: 0, fontSize: fullPage ? '2.4rem' : '1.5rem', fontWeight: '900', letterSpacing: '-0.5px' }}>Ficha del Alumno</h2>
            <p style={{ margin: 0, fontSize: '1.1rem', opacity: 0.7, fontWeight: '500' }}>
              {student.apellido}, {student.nombre} · DNI: {formatDNI(student.dni)} 
            </p>
          </div>
        </div>
        {!fullPage && <button className="icon-btn" onClick={onClose}><X size={20} /></button>}
      </div>

      <div className={fullPage ? "" : "custom-scroll"} style={fullPage ? {} : { maxHeight: '70vh', overflowY: 'auto', paddingRight: '10px' }}>
        {sections.map((sec, idx) => (
          <div key={idx} style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', color: 'var(--primary)' }}>
              {sec.icon}
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>{sec.title}</h3>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: sec.isFullRow ? '1fr' : (fullPage ? 'repeat(auto-fit, minmax(280px, 1fr))' : 'repeat(auto-fit, minmax(200px, 1fr))'), gap: '1.5rem' }}>
              {sec.fields.map(f => (
                <div key={f.key} style={f.fullWidth || sec.isFullRow ? { gridColumn: '1 / -1' } : {}}>
                  <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.5, marginBottom: '8px', fontWeight: 'bold', textTransform: 'uppercase' }}>{f.label}</label>
                  {isEditing ? (
                    f.type === 'select' ? (
                      <select 
                        className="input-field" 
                        value={studentForm[f.key] || ''} 
                        onChange={(e) => handleChange(f.key, e.target.value)}
                      >
                        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : f.type === 'textarea' ? (
                      <textarea
                        className="input-field"
                        style={{ minHeight: '120px', resize: 'vertical' }}
                        value={studentForm[f.key] || ''}
                        onChange={(e) => handleChange(f.key, e.target.value)}
                      />
                    ) : (
                      <div style={{ position: 'relative' }}>
                        {f.icon && <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>{f.icon}</span>}
                        <input 
                          type={f.type} 
                          list={f.list}
                          className="input-field" 
                          style={f.icon ? { paddingLeft: '35px' } : {}}
                          value={f.type === 'date' ? formatDateForInput(studentForm[f.key]) : (studentForm[f.key] || '')} 
                          onChange={(e) => handleChange(f.key, e.target.value)}
                        />
                      </div>
                    )
                  ) : (
                    <div style={{ 
                      background: 'rgba(255,255,255,0.03)', 
                      padding: '12px 16px', 
                      borderRadius: '10px', 
                      fontSize: '1.05rem',
                      border: '1px solid rgba(255,255,255,0.05)',
                      minHeight: f.type === 'textarea' ? '80px' : '48px',
                      display: 'flex',
                      alignItems: f.type === 'textarea' ? 'flex-start' : 'center',
                      gap: '10px',
                      whiteSpace: f.type === 'textarea' ? 'pre-wrap' : 'normal'
                    }}>
                      {f.icon && <span style={{ opacity: 0.4 }}>{f.icon}</span>}
                      <span style={{ fontWeight: '500' }}>
                        {f.key === 'fecha_nacimiento' && studentForm[f.key] && !isNaN(new Date(studentForm[f.key]).getTime())
                          ? new Date(studentForm[f.key]).toLocaleDateString('es-AR', { timeZone: 'UTC' }) 
                          : (f.formatter ? f.formatter(studentForm[f.key]) : (studentForm[f.key] || <span style={{ opacity: 0.3, fontStyle: 'italic' }}>No especificado</span>))
                        }
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.2rem', color: 'var(--primary)' }}>
            <History size={18} />
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Historial Escolar</h3>
          </div>
          <div style={{ 
            background: 'rgba(255,255,255,0.02)', 
            borderRadius: '14px', 
            border: '1px solid rgba(255,255,255,0.05)',
            overflow: 'hidden'
          }}>
            {loadingHistorial ? (
              <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5 }}>Cargando historial...</div>
            ) : historial.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', opacity: 0.5 }}>No hay antecedentes registrados en ciclos anteriores.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px' }}>Ciclo</th>
                    <th style={{ padding: '12px 16px' }}>Curso</th>
                    <th style={{ padding: '12px 16px' }}>Carrera</th>
                    <th style={{ padding: '12px 16px' }}>Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((h, i) => {
                    const boletin = JSON.parse(h.boletin_data || '[]');
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{h.ciclo_lectivo_nombre}</td>
                        <td style={{ padding: '12px 16px' }}>{h.curso_label}</td>
                        <td style={{ padding: '12px 16px' }}>{h.tecnicatura_nombre}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <details>
                            <summary style={{ cursor: 'pointer', color: 'var(--primary)', fontSize: '0.8rem' }}>Ver Notas</summary>
                            <div style={{ marginTop: '8px', padding: '10px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                              {boletin.length > 0 ? (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                  {boletin.map((n, ni) => (
                                    <li key={ni} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                                      <span>{n.materia}:</span>
                                      <span style={{ fontWeight: 'bold' }}>{n.definitiva || '-'}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : 'Sin notas registradas.'}
                            </div>
                          </details>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div style={{ marginBottom: '2.5rem', marginTop: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--primary)' }}>
              <ImageIcon size={18} />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}>Archivos adjuntos</h3>
            </div>
            {isEditing && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                <label className="btn" style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                  {isUploading ? '⌛ Subiendo...' : <><Plus size={14} /> Adjuntar Archivo</>}
                  <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handleImageUpload} disabled={isUploading} />
                </label>
                <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>Formatos soportado (menos de 32mb): JPG, PNG, BMP, GIF, TIFF, WEBP, HEIC, AVIF y PDF.</span>
              </div>
            )}
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
            gap: '1.2rem' 
          }}>
            {images.map((img) => (
              <div key={img.id} className="glass-card" style={{ 
                padding: '10px', 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div 
                  onClick={() => window.open(img.url, '_blank')}
                  style={{ 
                    width: '100%', 
                    height: '100px', 
                    borderRadius: '6px', 
                    overflow: 'hidden', 
                    cursor: 'pointer',
                    position: 'relative',
                    background: '#000'
                  }}
                >
                  <img src={img.url} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} alt="" />
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translateY(-50%) translateX(-50%)', opacity: 0.5 }}>
                    <Maximize2 size={20} color="white" />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button 
                    onClick={() => window.open(img.url, '_blank')}
                    style={{ 
                      fontSize: '0.8rem', 
                      fontWeight: 'bold', 
                      background: 'none', 
                      border: 'none', 
                      color: 'white', 
                      cursor: 'pointer',
                      textAlign: 'left',
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {img.titulo} <span style={{ opacity: 0.5, fontWeight: 'normal', fontSize: '0.7rem' }}>({new Date(img.fecha_creacion).toLocaleDateString()})</span>
                  </button>
                  {isEditing && (
                    <button className="icon-btn danger" onClick={() => deleteImage(img.id)} style={{ padding: '4px' }}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {images.length === 0 && !isUploading && (
              <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', opacity: 0.3, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                No hay imágenes o documentos adjuntos.
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end', gap: '1.5rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)' }}>
        {isEditing ? (
          <>
            <button className="btn" onClick={() => setIsEditing(false)} style={{ padding: '0.8rem 2rem' }}>Cancelar</button>
            <button className="btn btn-primary" onClick={onSave} style={{ padding: '0.8rem 2.5rem' }}><Save size={20} /> Guardar Cambios</button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={() => setIsEditing(true)} style={{ padding: '0.8rem 2.5rem' }}>Editar Información</button>
        )}
      </div>
    </div>
  );

  return fullPage ? content : <Modal onClose={onClose}>{content}</Modal>;
};

export default StudentFichaModal;
