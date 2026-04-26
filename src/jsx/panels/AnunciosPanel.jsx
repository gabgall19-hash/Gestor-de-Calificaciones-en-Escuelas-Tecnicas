import React, { useState } from 'react';
import { Megaphone, Plus, Trash2, Edit2, CheckCircle, XCircle, Image as ImageIcon } from 'lucide-react';

const AnunciosPanel = ({ data, post, loadData, isMobile }) => {
  const [editingAnuncio, setEditingAnuncio] = useState(null);
  const [anuncioForm, setAnuncioForm] = useState({ titulo: '', contenido: '', activo: 1 });
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      // API Key provided by user: 48bf2f480ae36924a8d74ae9a38ed6d3
      const res = await fetch(`https://api.imgbb.com/1/upload?key=48bf2f480ae36924a8d74ae9a38ed6d3`, {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      if (json.success) {
        const imageUrl = json.data.url;
        setAnuncioForm(p => ({
          ...p,
          contenido: p.contenido + (p.contenido ? '\n' : '') + imageUrl
        }));
      } else {
        alert('Error al subir imagen: ' + (json.error?.message || 'Error desconocido'));
      }
    } catch (err) {
      alert('Error de conexión al subir imagen');
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const renderContent = (content) => {
    if (!content) return null;
    const lines = content.split('\n');
    return lines.map((line, i) => {
      const trimmedLine = line.trim();
      
      // YouTube Regex
      const ytMatch = trimmedLine.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (ytMatch) {
        return (
          <div key={i} className="video-container" style={{ margin: '10px 0', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            <iframe
              width="100%"
              height="200"
              src={`https://www.youtube.com/embed/${ytMatch[1]}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        );
      }
      
      // Image Check
      const isImageUrl = trimmedLine.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i) || 
                         trimmedLine.includes('i.ibb.co') || 
                         trimmedLine.includes('imgur.com');
      
      if (isImageUrl && (trimmedLine.startsWith('http://') || trimmedLine.startsWith('https://'))) {
        return (
          <div key={i} style={{ margin: '12px 0' }}>
            <img 
              src={trimmedLine} 
              alt="Adjunto" 
              style={{ 
                maxWidth: '100%', 
                borderRadius: '12px', 
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)', 
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'block'
              }} 
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        );
      }

      return <div key={i} style={{ marginBottom: '4px', lineHeight: '1.5' }}>{line}</div>;
    });
  };

  const saveAnuncio = async (e) => {
    e.preventDefault();
    const action = editingAnuncio ? 'update' : 'create';
    await post('anuncios', { action, id: editingAnuncio?.id, ...anuncioForm, tipo: 'texto' });
    setEditingAnuncio(null);
    setAnuncioForm({ titulo: '', contenido: '', activo: 1 });
    await loadData();
  };

  const startEdit = (a) => {
    setEditingAnuncio(a);
    setAnuncioForm({ titulo: a.titulo, contenido: a.contenido, activo: a.activo });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteAnuncio = async (id) => {
    if (!window.confirm('¿Eliminar este anuncio permanentemente?')) return;
    await post('anuncios', { action: 'delete', id });
    await loadData();
  };

  const toggleStatus = async (a) => {
    await post('anuncios', { action: 'update', ...a, activo: a.activo === 1 ? 0 : 1 });
    await loadData();
  };

  return (
    <section className="page-section">
      <div className="section-title"><Megaphone size={16} /><h2>Tablón de Anuncios Institucionales</h2></div>
      
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
        {/* Formulario */}
        <div className="management-card" style={{ height: 'fit-content' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {editingAnuncio ? <Edit2 size={18} /> : <Plus size={18} />}
            {editingAnuncio ? 'Editar Anuncio' : 'Nuevo Anuncio'}
          </h3>
          <form className="stack-form" onSubmit={saveAnuncio}>
            <input 
              className="input-field" 
              placeholder="Título del anuncio (Opcional)" 
              value={anuncioForm.titulo} 
              onChange={(e) => setAnuncioForm(p => ({ ...p, titulo: e.target.value }))} 
            />
            <textarea 
              className="input-field" 
              placeholder="Escribe el mensaje aquí. Puedes subir imágenes con el botón de abajo o pegar enlaces de YouTube." 
              value={anuncioForm.contenido} 
              onChange={(e) => setAnuncioForm(p => ({ ...p, contenido: e.target.value }))} 
              rows="10" 
              required 
            />
            
            <div style={{ marginBottom: '1.5rem' }}>
              <input 
                type="file" 
                id="anuncio-img-upload" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={handleImageUpload} 
              />
              <button 
                type="button" 
                className="btn" 
                disabled={isUploading}
                onClick={() => document.getElementById('anuncio-img-upload').click()}
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  fontSize: '0.85rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  gap: '10px',
                  border: '1px dashed rgba(255,255,255,0.2)',
                  width: '100%',
                  padding: '12px'
                }}
              >
                {isUploading ? (
                  <>⌛ Subiendo archivo...</>
                ) : (
                  <>
                    <ImageIcon size={18} />
                    Añadir Imagen (ImgBB)
                  </>
                )}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" type="submit" style={{ flex: 1 }}>
                {editingAnuncio ? 'Guardar Cambios' : 'Publicar Ahora'}
              </button>
              {editingAnuncio && (
                <button 
                  className="btn" 
                  type="button" 
                  style={{ background: 'rgba(255,255,255,0.1)' }} 
                  onClick={() => { setEditingAnuncio(null); setAnuncioForm({ titulo: '', contenido: '', activo: 1 }); }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Lista de Anuncios */}
        <div className="management-card">
          <h3 style={{ marginBottom: '1.5rem' }}>Anuncios Publicados</h3>
          <div style={{ maxHeight: '700px', overflowY: 'auto', paddingRight: '10px' }}>
            {data.anuncios.map(a => (
              <div key={a.id} className="glass-card" style={{ 
                marginBottom: '1.5rem', 
                padding: '1.2rem', 
                background: 'rgba(255,255,255,0.03)',
                borderLeft: `4px solid ${a.activo ? 'var(--success)' : '#64748b'}`,
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Megaphone size={18} color="var(--primary)" />
                    <strong style={{ fontSize: '1.1rem' }}>{a.titulo || 'Anuncio Institucional'}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="icon-btn" onClick={() => toggleStatus(a)} title={a.activo ? 'Ocultar' : 'Mostrar'}>
                      {a.activo ? <CheckCircle size={16} color="var(--success)" /> : <XCircle size={16} color="#64748b" />}
                    </button>
                    <button className="icon-btn" onClick={() => startEdit(a)} title="Editar"><Edit2 size={16} /></button>
                    <button className="icon-btn danger" onClick={() => deleteAnuncio(a.id)} title="Eliminar"><Trash2 size={16} /></button>
                  </div>
                </div>
                <div style={{ 
                  fontSize: '0.9rem', 
                  opacity: 0.9, 
                  color: 'white',
                  wordBreak: 'break-word'
                }}>
                  {renderContent(a.contenido)}
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.75rem', opacity: 0.5 }}>
                  Publicado: {new Date(a.fecha_creacion).toLocaleDateString()}
                </div>
              </div>
            ))}
            {data.anuncios.length === 0 && (
              <div style={{ textAlign: 'center', opacity: 0.4, padding: '3rem 0' }}>
                <Megaphone size={40} style={{ marginBottom: '1rem' }} />
                <p>No hay anuncios publicados actualmente.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnunciosPanel;
