import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, Tag, Trash2, X } from 'lucide-react';
import { smartSearch } from '../../utils/searchEngine';

interface CustomerPricesModalProps {
  customer: any;
  inventory: any[];
  currency: string;
  onClose: () => void;
  onSave: (customPrices: Record<string, number>) => Promise<void>;
}

const MAX_RESULTS = 8;

/** Administra los precios únicos de un cliente: `customPrices` guarda { idProducto: precio }. */
const CustomerPricesModal: React.FC<CustomerPricesModalProps> = ({ customer, inventory, currency, onClose, onSave }) => {
  const [prices, setPrices] = useState<Record<string, number | ''>>(customer.customPrices || {});
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const results = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const available = inventory.filter(product => !(product.id in prices));
    return smartSearch(available, searchTerm, ['name', 'code', 'referenceCode']).slice(0, MAX_RESULTS);
  }, [inventory, prices, searchTerm]);

  const addProduct = (product: any) => {
    setPrices(prev => ({ ...prev, [product.id]: parseFloat(product.price) || '' }));
    setSearchTerm('');
  };

  const removeProduct = (id: string) => {
    setPrices(prev => {
      const { [id]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const handleSave = async () => {
    const hasInvalidPrice = Object.values(prices).some(price => !(Number(price) > 0));
    if (hasInvalidPrice) {
      setError('Cada producto debe tener un precio mayor que cero.');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      await onSave(Object.fromEntries(Object.entries(prices).map(([id, price]) => [id, Number(price)])));
      onClose();
    } catch (e) {
      console.error(e);
      setError('No se pudieron guardar los precios. Inténtalo de nuevo.');
      setIsSaving(false);
    }
  };

  const productIds = Object.keys(prices);
  const inputStyle: React.CSSProperties = { background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' };

  return createPortal(
    <div className="checkout-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '24px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '640px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-medium)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-app)' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tag size={20} color="var(--accent-primary)" /> Precios Únicos
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{customer.name}</p>
          </div>
          <button type="button" className="btn btn-outline" onClick={onClose} style={{ padding: '6px', border: 'none' }} aria-label="Cerrar"><X size={20} /></button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '21px', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar producto por nombre o código para añadirlo..."
              style={{ ...inputStyle, width: '100%', paddingLeft: '36px' }}
            />
            {searchTerm.trim() !== '' && (
              <div style={{ marginTop: '4px', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                {results.length === 0 ? (
                  <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No se encontraron productos</div>
                ) : results.map(product => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => addProduct(product)}
                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '10px 12px', border: 'none', borderBottom: '1px solid var(--border-light)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{product.name}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', flexShrink: 0 }}>{currency}{(parseFloat(product.price) || 0).toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {productIds.length === 0 ? (
            <p style={{ margin: 0, padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Este cliente paga los precios normales. Busca un producto para asignarle un precio único.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {productIds.map(id => {
                const product = inventory.find(item => item.id === id);
                return (
                  <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{product?.name || 'Producto eliminado del inventario'}</div>
                      {product && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {product.code} · Precio normal: {currency}{(parseFloat(product.price) || 0).toFixed(2)}
                        </div>
                      )}
                    </div>
                    <input
                      type="number" min="0" step="0.01"
                      aria-label={`Precio único de ${product?.name || id}`}
                      value={prices[id]}
                      onChange={e => setPrices(prev => ({ ...prev, [id]: e.target.value === '' ? '' : parseFloat(e.target.value) }))}
                      onWheel={e => e.currentTarget.blur()}
                      style={{ ...inputStyle, width: '120px', textAlign: 'right', fontWeight: 700, background: 'var(--bg-card)' }}
                    />
                    <button type="button" onClick={() => removeProduct(id)} aria-label="Quitar precio único" style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', display: 'flex', padding: '4px' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {error && <p style={{ margin: 0, color: 'var(--accent-danger)', fontSize: '0.875rem', fontWeight: 600 }}>{error}</p>}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-medium)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--bg-app)' }}>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSaving}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar Precios'}</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CustomerPricesModal;
