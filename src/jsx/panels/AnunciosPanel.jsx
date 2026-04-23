import React, { useState } from 'react';
import { Megaphone, Plus, Trash2, Edit2, CheckCircle, XCircle } from 'lucide-react';

const AnunciosPanel = ({ data, post, loadData, isMobile }) => {
  const [editingAnuncio, setEditingAnuncio] = useState(null);
  const [anuncioForm, setAnuncioForm] = useState({ titulo: '', contenido: '', activo: 1 });

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
  };

  const deleteAnuncio = async (id) => {
    if (!window.confirm('¿Eliminar este anuncio?')) return;
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
        <div className="management-card">
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {editingAnuncio ? <Edit2 size={18} /> : <Plus size={18} />}
            {editingAnuncio ? 'Editar Anuncio' : 'Nuevo Anuncio'}
          </h3>
          <form className="stack-form" onSubmit={saveAnuncio}>
            <input 
              className="input-field" 
              placeholder="Título (Opcional)" 
              value={anuncioForm.titulo} 
              onChange={(e) => setAnuncioForm(p => ({ ...p, titulo: e.target.value }))} 
            />
            <textarea 
              className="input-field" 
              placeholder="Escribe el anuncio aquí. Si pegas un enlace de YouTube, se mostrará el video automáticamente." 
              value={anuncioForm.contenido} 
              onChange={(e) => setAnuncioForm(p => ({ ...p, contenido: e.target.value }))} 
              rows="8" 
              required 
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-primary" type="submit" style={{ flex: 1 }}>
                {editingAnuncio ? 'Actualizar Anuncio' : 'Publicar Anuncio'}
              </button>
              {editingAnuncio && (
                <button 
                  className="btn" 
                  type="button" 
                  style={{ background: 'rgba(255,255,255,0.1)' }} 
                  onClick={() => { setEditingAnuncio(null); setAnuncioForm({ titulo: '', contenido: '', tipo: 'texto', activo: 1 }); }}
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
          <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '10px' }}>
            {data.anuncios.map(a => (
              <div key={a.id} className="glass-card" style={{ 
                marginBottom: '1rem', 
                padding: '1rem', 
                background: 'rgba(255,255,255,0.03)',
                borderLeft: `4px solid ${a.activo ? 'var(--success)' : '#64748b'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Megaphone size={16} color="var(--primary)" />
                    <strong style={{ fontSize: '1rem' }}>{a.titulo}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="icon-btn" onClick={() => toggleStatus(a)} title={a.activo ? 'Desactivar' : 'Activar'}>
                      {a.activo ? <CheckCircle size={14} color="var(--success)" /> : <XCircle size={14} color="#64748b" />}
                    </button>
                    <button className="icon-btn" onClick={() => startEdit(a)} title="Editar"><Edit2 size={14} /></button>
                    <button className="icon-btn danger" onClick={() => deleteAnuncio(a.id)} title="Borrar"><Trash2 size={14} /></button>
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', opacity: 0.7, whiteSpace: 'pre-wrap' }}>
                  {a.contenido.length > 100 ? a.contenido.slice(0, 100) + '...' : a.contenido}
                </p>
              </div>
            ))}
            {data.anuncios.length === 0 && (
              <p style={{ textAlign: 'center', opacity: 0.5, marginTop: '2rem' }}>No hay anuncios publicados.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnunciosPanel;
