import React, { useState } from 'react';
import { Search, ScanLine, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote } from 'lucide-react';

const POS = () => {
  const [cart, setCart] = useState([
    { id: 1, name: 'Coca Cola 2L', price: 2.50, quantity: 2, code: '7501055310883' },
    { id: 2, name: 'Sabritas Original 45g', price: 1.20, quantity: 1, code: '7501011133906' },
    { id: 3, name: 'Atún Dolores en Agua', price: 1.80, quantity: 3, code: '7501041810502' }
  ]);

  const [searchTerm, setSearchTerm] = useState('');

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = subtotal * 0.16; // 16% IVA
  const total = subtotal + tax;

  const handleRemove = (id: number) => setCart(cart.filter(item => item.id !== id));
  const updateQuantity = (id: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta;
        return { ...item, quantity: newQ > 0 ? newQ : 1 };
      }
      return item;
    }));
  };

  return (
    <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Cabecera */}
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Punto de Venta</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Caja #1 - Turno Matutino</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ScanLine size={18} /> Escáner Manual
          </button>
          <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--accent-success)', borderColor: 'var(--accent-success)' }}>
            <ScanLine size={18} /> Activar Cámara IA
          </button>
        </div>
      </div>

      {/* Grid Principal */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '24px', flex: 1, minHeight: 0 }}>
        
        {/* Panel Izquierdo: Carrito */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          {/* Buscador */}
          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar producto por nombre o escanear código..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '16px 16px 16px 48px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)', background: 'var(--bg-app)',
                fontSize: '1rem', color: 'var(--text-primary)', outline: 'none'
              }}
            />
          </div>

          {/* Tabla de Productos */}
          <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-app)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            {cart.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                <ShoppingCart size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <h3>El carrito está vacío</h3>
                <p>Escanea un producto para comenzar</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-light)', position: 'sticky', top: 0 }}>
                  <tr>
                    <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>PRODUCTO</th>
                    <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>CANTIDAD</th>
                    <th style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>PRECIO</th>
                    <th style={{ padding: '16px', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>SUBTOTAL</th>
                    <th style={{ padding: '16px', width: '60px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.code}</div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)' }}>
                          <button onClick={() => updateQuantity(item.id, -1)} style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', color: 'var(--text-secondary)' }}><Minus size={14} /></button>
                          <span style={{ padding: '0 12px', fontWeight: 600 }}>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} style={{ background: 'none', border: 'none', padding: '8px', cursor: 'pointer', color: 'var(--text-secondary)' }}><Plus size={14} /></button>
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: 500 }}>${item.price.toFixed(2)}</td>
                      <td style={{ padding: '16px', textAlign: 'right', fontWeight: 700, color: 'var(--accent-primary)' }}>${(item.price * item.quantity).toFixed(2)}</td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <button onClick={() => handleRemove(item.id)} style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}>
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Panel Derecho: Resumen y Pago */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '24px' }}>Resumen de Venta</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
            
            {/* Cliente */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Cliente</label>
              <input type="text" placeholder="Cliente General (Mostrador)" style={{
                width: '100%', padding: '12px', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-light)', background: 'var(--bg-app)',
                fontSize: '0.9rem', color: 'var(--text-primary)', outline: 'none'
              }} />
            </div>

            {/* Desglose de Totales */}
            <div style={{ background: 'var(--bg-app)', padding: '16px', borderRadius: 'var(--radius-md)', marginTop: 'auto' }}>
              <div className="flex-between" style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex-between" style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>
                <span>Descuento</span>
                <span style={{ fontWeight: 600, color: 'var(--accent-success)' }}>$0.00</span>
              </div>
              <div className="flex-between" style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
                <span>IVA (16%)</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>${tax.toFixed(2)}</span>
              </div>
              
              <div style={{ borderTop: '1px dashed var(--border-light)', margin: '16px 0' }}></div>
              
              <div className="flex-between">
                <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>Total</span>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-primary)' }}>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Botones de Pago */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
              <button className="btn btn-outline" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', gap: '8px', background: 'var(--bg-app)' }}>
                <Banknote size={24} />
                <span style={{ fontWeight: 600 }}>Efectivo</span>
              </button>
              <button className="btn btn-outline" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', gap: '8px', background: 'var(--bg-app)' }}>
                <CreditCard size={24} />
                <span style={{ fontWeight: 600 }}>Tarjeta</span>
              </button>
            </div>
            
            <button className="btn btn-primary" style={{ padding: '20px', fontSize: '1.2rem', fontWeight: 700, marginTop: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
              Procesar Pago (${total.toFixed(2)})
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default POS;
