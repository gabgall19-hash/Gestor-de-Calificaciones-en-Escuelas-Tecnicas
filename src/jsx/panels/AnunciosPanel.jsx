import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Trash2, Edit2, CheckCircle, XCircle, Image as ImageIcon, Video, Type, ChevronUp, ChevronDown, Save } from 'lucide-react';

const AnunciosPanel = ({ data, post, loadData, isMobile }) => {
  const [editingAnuncio, setEditingAnuncio] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [activo, setActivo] = useState(1);
  const [blocks, setBlocks] = useState([{ type: 'text', content: '' }]);
  const [isUploading, setIsUploading] = useState(false);

  // Convertir texto plano de la DB a bloques para el editor
  useEffect(() => {
    if (editingAnuncio) {
      setTitulo(editingAnuncio.titulo || '');
      setActivo(editingAnuncio.activo);
      
      const lines = editingAnuncio.contenido.split('\n');
      const newBlocks = [];
      lines.forEach(line => {
        const trimmed = line.trim();
        const isImage = trimmed.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i) || trimmed.includes('i.ibb.co') || trimmed.includes('imgur.com');
        const isVideo = trimmed.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        
        if (isImage && trimmed.startsWith('http')) {
          newBlocks.push({ type: 'image', content: trimmed });
        } else if (isVideo) {
          newBlocks.push({ type: 'video', content: trimmed });
        } else {
          // Si el último bloque era texto, añadir a ese, si no, crear uno nuevo
          if (newBlocks.length > 0 && newBlocks[newBlocks.length - 1].type === 'text') {
            newBlocks[newBlocks.length - 1].content += (newBlocks[newBlocks.length - 1].content ? '\n' : '') + line;
          } else {
            newBlocks.push({ type: 'text', content: line });
          }
        }
      });
      setBlocks(newBlocks.length > 0 ? newBlocks : [{ type: 'text', content: '' }]);
    } else {
      setTitulo('');
      setActivo(1);
      setBlocks([{ type: 'text', content: '' }]);
    }
  }, [editingAnuncio]);

  const saveAnuncio = async (e) => {
    e.preventDefault();
    // Unir bloques en un solo string para la DB
    const contenido = blocks.map(b => b.content.trim()).filter(Boolean).join('\n');
    if (!contenido) return alert('El anuncio no puede estar vacío');

    const action = editingAnuncio ? 'update' : 'create';
    await post('anuncios', { action, id: editingAnuncio?.id, titulo, contenido, activo, tipo: 'texto' });
    
    setEditingAnuncio(null);
    setBlocks([{ type: 'text', content: '' }]);
    setTitulo('');
    await loadData();
  };

  const addTextBlock = () => setBlocks([...blocks, { type: 'text', content: '' }]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=48bf2f480ae36924a8d74ae9a38ed6d3`, {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      if (json.success) {
        setBlocks([...blocks, { type: 'image', content: json.data.url }]);
      }
    } catch (err) { alert('Error al subir imagen'); }
    finally { setIsUploading(false); e.target.value = ''; }
  };

  const updateBlock = (index, newContent) => {
    const next = [...blocks];
    next[index].content = newContent;
    setBlocks(next);
  };

  const removeBlock = (index) => {
    if (blocks.length === 1) return setBlocks([{ type: 'text', content: '' }]);
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const moveBlock = (index, dir) => {
    const next = [...blocks];
    const target = index + dir;
    if (target < 0 || target >= blocks.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setBlocks(next);
  };

  const renderPreview = (content) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      const trimmed = line.trim();
      const ytMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
      if (ytMatch) {
        return (
          <div key={i} className="video-container" style={{ margin: '10px 0', borderRadius: '12px', overflow: 'hidden' }}>
            <iframe width="100%" height="200" src={`https://www.youtube.com/embed/${ytMatch[1]}`} frameBorder="0" allowFullScreen />
          </div>
        );
      }
      const isImg = trimmed.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i) || trimmed.includes('i.ibb.co') || trimmed.includes('imgur.com');
      if (isImg && trimmed.startsWith('http')) {
        return <img key={i} src={trimmed} alt="" style={{ maxWidth: '100%', borderRadius: '12px', margin: '10px 0', display: 'block' }} />;
      }
      return <div key={i} style={{ marginBottom: '4px' }}>{line}</div>;
    });
  };

  return (
    <section className="page-section">
      <div className="section-title"><Megaphone size={16} /><h2>Tablón de Anuncios Institucionales</h2></div>
      
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.2fr 0.8fr', gap: '2rem', marginTop: '1rem' }}>
        
        {/* EDITOR VISUAL POR BLOQUES */}
        <div className="management-card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {editingAnuncio ? <Edit2 size={18} /> : <Plus size={18} />}
              {editingAnuncio ? 'Editar Anuncio' : 'Nuevo Anuncio'}
            </span>
            {editingAnuncio && (
              <button className="btn" style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)' }} onClick={() => setEditingAnuncio(null)}>Cancelar</button>
            )}
          </h3>

          <div className="stack-form">
            <input 
              className="input-field" 
              placeholder="Título del anuncio (Opcional)" 
              value={titulo} 
              onChange={(e) => setTitulo(e.target.value)} 
              style={{ marginBottom: '1rem', fontWeight: 'bold' }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
              {blocks.map((block, idx) => (
                <div key={idx} className="glass-card" style={{ 
                  padding: '10px', 
                  background: 'rgba(255,255,255,0.03)', 
                  border: '1px solid rgba(255,255,255,0.05)',
                  position: 'relative'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.65rem', opacity: 0.5, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      {block.type === 'text' ? <Type size={12}/> : block.type === 'image' ? <ImageIcon size={12}/> : <Video size={12}/>}
                      Bloque de {block.type}
                    </span>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button onClick={() => moveBlock(idx, -1)} className="icon-btn" style={{ padding: '2px' }}><ChevronUp size={14}/></button>
                      <button onClick={() => moveBlock(idx, 1)} className="icon-btn" style={{ padding: '2px' }}><ChevronDown size={14}/></button>
                      <button onClick={() => removeBlock(idx)} className="icon-btn danger" style={{ padding: '2px' }}><Trash2 size={14}/></button>
                    </div>
                  </div>

                  {block.type === 'text' ? (
                    <textarea 
                      className="input-field" 
                      rows="4" 
                      value={block.content} 
                      onChange={(e) => updateBlock(idx, e.target.value)}
                      placeholder="Escribe aquí..."
                      style={{ background: 'transparent', border: 'none', padding: '0' }}
                    />
                  ) : block.type === 'image' ? (
                    <img src={block.content} style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px' }} alt="" />
                  ) : (
                    <div style={{ background: '#000', padding: '20px', borderRadius: '8px', textAlign: 'center', fontSize: '0.8rem' }}>
                      📹 Video de YouTube Detectado
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '1.5rem' }}>
              <button className="btn" onClick={addTextBlock} style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.75rem' }}>
                <Type size={16} /> + Texto
              </button>
              
              <label className="btn" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.75rem', cursor: 'pointer', textAlign: 'center' }}>
                <ImageIcon size={16} /> {isUploading ? '...' : '+ Imagen'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} disabled={isUploading} />
              </label>

              <button className="btn" onClick={() => {
                const url = window.prompt('Pega el enlace de YouTube:');
                if (url) setBlocks([...blocks, { type: 'video', content: url }]);
              }} style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.75rem' }}>
                <Video size={16} /> + Video
              </button>
            </div>

            <button className="btn btn-primary" onClick={saveAnuncio} style={{ width: '100%', padding: '12px' }}>
              <Save size={18} /> {editingAnuncio ? 'Actualizar Anuncio' : 'Publicar Ahora'}
            </button>
          </div>
        </div>

        {/* LISTA DE ANUNCIOS */}
        <div className="management-card">
          <h3 style={{ marginBottom: '1.5rem' }}>Anuncios Publicados</h3>
          <div style={{ maxHeight: '700px', overflowY: 'auto', paddingRight: '10px' }}>
            {data.anuncios.map(a => (
              <div key={a.id} className="glass-card" style={{ 
                marginBottom: '1.5rem', 
                padding: '1.2rem', 
                background: 'rgba(255,255,255,0.03)',
                borderLeft: `4px solid ${a.activo ? 'var(--success)' : '#64748b'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                  <strong style={{ fontSize: '1rem' }}>{a.titulo || 'Anuncio'}</strong>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="icon-btn" onClick={async () => {
                      await post('anuncios', { action: 'update', ...a, activo: a.activo ? 0 : 1 });
                      await loadData();
                    }}>{a.activo ? <CheckCircle size={14} color="var(--success)" /> : <XCircle size={14} color="#64748b" />}</button>
                    <button className="icon-btn" onClick={() => setEditingAnuncio(a)}><Edit2 size={14}/></button>
                    <button className="icon-btn danger" onClick={async () => {
                      if (window.confirm('¿Eliminar?')) {
                        await post('anuncios', { action: 'delete', id: a.id });
                        await loadData();
                      }
                    }}><Trash2 size={14}/></button>
                  </div>
                </div>
                <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>{renderPreview(a.contenido)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnunciosPanel;
