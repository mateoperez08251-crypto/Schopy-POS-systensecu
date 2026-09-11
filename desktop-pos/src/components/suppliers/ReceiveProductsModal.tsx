import React, { useState } from 'react';
import { X, Search, Package, Plus, Trash2, Building2 } from 'lucide-react';

interface ReceiveProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const ReceiveProductsModal: React.FC<ReceiveProductsModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [supplier, setSupplier] = useState('');
  const [items, setItems] = useState([{ product: '', quantity: 1, cost: 0 }]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([...items, { product: '', quantity: 1, cost: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleChangeItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const totalCost = items.reduce((sum, item) => sum + (item.quantity * item.cost), 0);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '20px'
    }}>
      <div className="card" style={{
        width: '100%', maxWidth: '800px', maxHeight: '90vh', backgroundColor: 'var(--bg-card)',
        borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex', flexDirection: 'column', animation: 'scaleIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px', borderBottom: '1px solid var(--border-light)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Registrar Recepción de Mercancía</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Da entrada a los productos que has comprado para actualizar el stock y costos.
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'var(--bg-app)', border: 'none', width: '32px', height: '32px',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-muted)'
          }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Supplier Selection */}
          <div className="form-group" style={{ padding: '20px', background: 'var(--bg-app)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px', display: 'block' }}>Proveedor Origen</label>
            <div style={{ position: 'relative' }}>
              <Building2 size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
              <select className="input" style={{ width: '100%', paddingLeft: '44px', appearance: 'none', background: 'var(--bg-card)' }}
                value={supplier} onChange={e => setSupplier(e.target.value)}>
                <option value="">Seleccione un proveedor...</option>
                <option value="1">Distribuidora Corripio</option>
                <option value="2">Cervecería Nacional</option>
                <option value="3">Mercasid</option>
              </select>
            </div>
          </div>

          {/* Items List */}
          <div>
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>Productos Recibidos</h3>
              <button className="btn btn-outline" onClick={handleAddItem} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', fontSize: '0.85rem' }}>
                <Plus size={16} /> Añadir Línea
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {items.map((item, index) => (
                <div key={index} style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--bg-app)', padding: '12px', borderRadius: '12px' }}>
                  
                  <div style={{ flex: 2 }}>
                    <div style={{ position: 'relative' }}>
                      <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input type="text" className="input" placeholder="Buscar producto (ej. Coca Cola)" 
                        style={{ width: '100%', paddingLeft: '36px', background: 'var(--bg-card)', fontSize: '0.9rem', padding: '8px 12px 8px 36px' }}
                        value={item.product} onChange={e => handleChangeItem(index, 'product', e.target.value)} />
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cant:</span>
                      <input type="number" min="1" className="input" 
                        style={{ width: '100%', paddingLeft: '48px', background: 'var(--bg-card)', fontSize: '0.9rem', padding: '8px 12px 8px 48px' }}
                        value={item.quantity} onChange={e => handleChangeItem(index, 'quantity', parseInt(e.target.value) || 0)} />
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Costo $:</span>
                      <input type="number" min="0" step="0.01" className="input" 
                        style={{ width: '100%', paddingLeft: '64px', background: 'var(--bg-card)', fontSize: '0.9rem', padding: '8px 12px 8px 64px' }}
                        value={item.cost} onChange={e => handleChangeItem(index, 'cost', parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>

                  <div style={{ width: '100px', textAlign: 'right', fontWeight: 600, color: 'var(--accent-primary)', fontSize: '0.95rem' }}>
                    ${(item.quantity * item.cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>

                  <button onClick={() => handleRemoveItem(index)} disabled={items.length === 1}
                    style={{ background: 'transparent', border: 'none', color: items.length === 1 ? 'var(--text-muted)' : 'var(--accent-danger)', cursor: items.length === 1 ? 'not-allowed' : 'pointer', padding: '4px' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
        </div>

        {/* Footer */}
        <div style={{
          padding: '24px', borderTop: '1px solid var(--border-light)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backgroundColor: 'var(--bg-app)', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px'
        }}>
          <div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Costo Total de Recepción</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
            <button className="btn btn-primary" onClick={() => onSubmit({ supplier, items, totalCost })} 
              disabled={!supplier || items.length === 0 || items.some(i => !i.product)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: (!supplier || items.length === 0 || items.some(i => !i.product)) ? 0.5 : 1 }}>
              <Package size={18} /> Ingresar al Inventario
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiveProductsModal;
