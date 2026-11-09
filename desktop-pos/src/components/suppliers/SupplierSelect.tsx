import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { filterSuppliers } from '../../utils/suppliers';

interface SupplierSelectProps {
  value: string;
  suppliers: any[];
  onChange: (supplierName: string) => void;
}

/** Selector de suplidor con búsqueda. El valor es el nombre, igual que en el campo `supplier` del producto. */
const SupplierSelect: React.FC<SupplierSelectProps> = ({ value, suppliers, onChange }) => {
  const [term, setTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const results = useMemo(() => filterSuppliers(suppliers, term), [suppliers, term]);

  const select = (name: string) => {
    onChange(name);
    setTerm('');
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
      <input
        type="text"
        value={isOpen ? term : value}
        placeholder={value || 'Buscar suplidor por nombre, RNC o teléfono...'}
        onFocus={() => { setTerm(''); setIsOpen(true); }}
        onBlur={() => setIsOpen(false)}
        onChange={e => { setTerm(e.target.value); setIsOpen(true); }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            // Evita enviar el formulario del producto al confirmar el suplidor.
            e.preventDefault();
            if (isOpen && results.length > 0) select(results[0].name);
          }
          if (e.key === 'Escape' && isOpen) {
            e.stopPropagation();
            setIsOpen(false);
          }
        }}
        style={{ width: '100%', background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 36px', borderRadius: 'var(--radius-md)', outline: 'none' }}
      />
      {value && !isOpen && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Quitar suplidor"
          style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '4px' }}
        >
          <X size={16} />
        </button>
      )}

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', zIndex: 10,
          maxHeight: '220px', overflowY: 'auto', background: 'var(--bg-card)',
          border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)'
        }}>
          {results.length === 0 ? (
            <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No se encontraron suplidores</div>
          ) : results.map(supplier => (
            <div
              key={supplier.id}
              // onMouseDown se dispara antes del blur que cierra la lista.
              onMouseDown={e => { e.preventDefault(); select(supplier.name); }}
              style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)', background: supplier.name === value ? 'var(--accent-primary-light)' : 'transparent' }}
              onMouseEnter={e => { if (supplier.name !== value) e.currentTarget.style.background = 'var(--bg-app)'; }}
              onMouseLeave={e => { if (supplier.name !== value) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{supplier.name}</div>
              {(supplier.rnc || supplier.phone) && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {[supplier.rnc && `RNC: ${supplier.rnc}`, supplier.phone && `Tel: ${supplier.phone}`].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SupplierSelect;
