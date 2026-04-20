import React, { useState } from 'react';

const MultiSelect = ({ label, options, selected, onChange, placeholder = "Buscar..." }) => {
  const [search, setSearch] = useState('');
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="input-group" style={{ marginBottom: '1rem' }}>
      <label>{label} ({selected.length})</label>
      <input 
        type="text" 
        className="input-field" 
        placeholder={placeholder} 
        value={search} 
        onChange={(e) => setSearch(e.target.value)} 
        style={{ marginBottom: '5px' }}
      />
      <div style={{ 
        maxHeight: '150px', 
        overflowY: 'auto', 
        background: 'rgba(255,255,255,0.05)', 
        padding: '8px', 
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        {filtered.map(opt => (
          <label key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer', fontSize: '0.9rem' }}>
            <input 
              type="checkbox" 
              checked={selected.includes(opt.id)} 
              onChange={(e) => {
                if (e.target.checked) onChange([...new Set([...selected, opt.id])]);
                else onChange(selected.filter(id => id !== opt.id));
              }}
            />
            {opt.label}
          </label>
        ))}
        {filtered.length === 0 && <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>Sin resultados</p>}
      </div>
    </div>
  );
};

export default MultiSelect;
