import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, PauseCircle, PlayCircle, Printer, MessageCircle, Tag, Package, X, Calendar, MapPin, StickyNote } from 'lucide-react';

const categories = ['Todos', 'Bebidas', 'Snacks', 'Abarrotes', 'Limpieza', 'Electrónica'];

const PRODUCT_CATALOG = [
  { id: 1, name: 'Coca Cola 2L', price: 2.50, code: '7501055310883', category: 'Bebidas', color: '#EF4444' },
  { id: 2, name: 'Sabritas Original 45g', price: 1.20, code: '7501011133906', category: 'Snacks', color: '#F59E0B' },
  { id: 3, name: 'Atún Dolores en Agua', price: 1.80, code: '7501041810502', category: 'Abarrotes', color: '#3B82F6' },
  { id: 4, name: 'Agua Ciel 1L', price: 1.00, code: '7501055310884', category: 'Bebidas', color: '#60A5FA' },
  { id: 5, name: 'Galletas Oreo 114g', price: 1.50, code: '7501011133907', category: 'Snacks', color: '#2563EB' },
  { id: 6, name: 'Jabón Zote Blanco', price: 0.90, code: '7501041810503', category: 'Limpieza', color: '#EC4899' },
  { id: 7, name: 'Cloro Cloralex 1L', price: 1.30, code: '7501041810504', category: 'Limpieza', color: '#10B981' },
  { id: 8, name: 'Pilas Duracell AA (4)', price: 4.50, code: '7501041810505', category: 'Electrónica', color: '#B45309' },
  { id: 9, name: 'Frijoles La Costeña', price: 1.10, code: '7501041810506', category: 'Abarrotes', color: '#92400E' },
  { id: 10, name: 'Gatorade Naranja', price: 1.60, code: '7501041810507', category: 'Bebidas', color: '#F97316' },
];

interface POSProps {
  salesHistory: any[];
  setSalesHistory: (val: any[]) => void;
}

const POS: React.FC<POSProps> = ({ salesHistory, setSalesHistory }) => {
  const [cart, setCart] = useState<any[]>([]);
  const [heldCarts, setHeldCarts] = useState<any[][]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'processing' | 'success'>('processing');
  
  const [modifierItem, setModifierItem] = useState<any | null>(null);
  const [isNumpadOpen, setIsNumpadOpen] = useState(false);
  const [numpadValue, setNumpadValue] = useState('');
  const [quickCash, setQuickCash] = useState<number | null>(null);
  
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [saleNote, setSaleNote] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = searchTerm.trim() === '' ? [] : PRODUCT_CATALOG.filter(p => 
    (selectedCategory === 'Todos' || p.category === selectedCategory) &&
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.includes(searchTerm))
  );

  const subtotal = cart.reduce((acc, item) => acc + ((item.price * item.quantity) * (1 - (item.discount || 0)/100)), 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (isNumpadOpen) setIsNumpadOpen(false);
        else if (modifierItem) setModifierItem(null);
        else if (!isCheckoutOpen) { setCart([]); setQuickCash(null); }
      }
      if (e.key === 'Enter' && cart.length > 0 && !isCheckoutOpen && !isNumpadOpen && !modifierItem) {
        processPayment();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, isCheckoutOpen, isNumpadOpen, modifierItem]);

  const addToCart = (product: typeof PRODUCT_CATALOG[0]) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1, discount: 0, note: '' }];
    });
  };

  const handleRemove = (id: number) => setCart(cart.filter(item => item.id !== id));
  const updateQuantity = (id: number, delta: number) => {
    setCart(cart.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };

  const applyModifier = (e: React.FormEvent) => {
    e.preventDefault();
    if (modifierItem) {
      setCart(cart.map(item => item.id === modifierItem.id ? modifierItem : item));
      setModifierItem(null);
    }
  };

  const processPayment = (cashReceived?: number) => {
    if (cashReceived) setQuickCash(cashReceived);
    setIsCheckoutOpen(true);
    setCheckoutStep('processing');
    
    setTimeout(() => {
      setCheckoutStep('success');
      const newSale = {
        id: `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
        items: [...cart],
        total,
        client: clientName,
        address: clientAddress,
        note: saleNote,
        paymentMethod: cashReceived ? 'Efectivo' : 'Tarjeta',
        date: saleDate,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setSalesHistory([newSale, ...salesHistory]);
    }, 1500);
  };

  const finishSale = () => {
    setCart([]);
    setQuickCash(null);
    setClientName('');
    setClientAddress('');
    setSaleNote('');
    setIsCheckoutOpen(false);
  };

  const handleNumpadSubmit = () => {
    const val = parseFloat(numpadValue);
    if (!isNaN(val) && val >= total) {
      setIsNumpadOpen(false);
      processPayment(val);
    }
  };

  const handlePauseSale = () => {
    if (cart.length > 0) {
      setHeldCarts([...heldCarts, cart]);
      setCart([]);
    }
  };

  const handleResumeSale = () => {
    if (heldCarts.length > 0) {
      const current = cart.length > 0 ? cart : null;
      const lastHeld = heldCarts[heldCarts.length - 1];
      setCart(lastHeld);
      const newHeld = heldCarts.slice(0, -1);
      if (current) newHeld.push(current);
      setHeldCarts(newHeld);
    }
  };

  return (
    <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', zoom: 0.9 }}>
      
      {/* Cabecera */}
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Punto de Venta</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Caja #1 - Turno Matutino <span style={{opacity:0.5}}>(F2: Buscar, Enter: Cobrar)</span></p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {heldCarts.length > 0 && (
            <button className="btn btn-primary" onClick={handleResumeSale} style={{ display: 'flex', alignItems: 'center', gap: '8px', animation: 'pulse 2s infinite' }}>
              <PlayCircle size={18} /> Retomar Venta ({heldCarts.length})
            </button>
          )}
          <button className="btn btn-outline" onClick={handlePauseSale} disabled={cart.length === 0} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PauseCircle size={18} /> Pausar Venta
          </button>
        </div>
      </div>

      {/* Contenedor Principal Relativo */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
        
        {/* Área de Ventas (100%) */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px 0', borderBottom: '1px solid var(--border-light)' }}>
            
            {/* Campos de Facturación (Movidos arriba) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
              <div>
                <input type="text" placeholder="Cliente General" value={clientName} onChange={e => setClientName(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-app)', fontSize: '0.8rem', outline: 'none' }} />
              </div>
              <div style={{ position: 'relative' }}>
                <Calendar size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} style={{ width: '100%', padding: '8px 10px 8px 26px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-app)', fontSize: '0.8rem', outline: 'none' }} />
              </div>
              <div style={{ position: 'relative' }}>
                <MapPin size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Dirección..." value={clientAddress} onChange={e => setClientAddress(e.target.value)} style={{ width: '100%', padding: '8px 10px 8px 26px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-app)', fontSize: '0.8rem', outline: 'none' }} />
              </div>
              <div style={{ position: 'relative' }}>
                <StickyNote size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Nota de venta..." value={saleNote} onChange={e => setSaleNote(e.target.value)} style={{ width: '100%', padding: '8px 10px 8px 26px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', background: 'var(--bg-app)', fontSize: '0.8rem', outline: 'none' }} />
              </div>
            </div>

            <div style={{ borderTop: '1px dashed var(--border-light)', marginBottom: '16px' }}></div>
            
            {/* Buscador */}
            <div style={{ marginBottom: '12px', position: 'relative' }}>
              <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Busca por inicial o nombre..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', padding: '12px 16px 12px 48px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)', background: 'var(--bg-app)',
                  fontSize: '0.95rem', color: 'var(--text-primary)', outline: 'none',
                  transition: '0.3s'
                }}
              />
            </div>

            {/* Filtros de Categorías animado (Glider) */}
            <div style={{ marginBottom: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
              <div className="tabs-container" style={{ display: 'inline-flex', minWidth: 'max-content' }}>
                {categories.map((cat, index) => (
                  <React.Fragment key={cat}>
                    <input 
                      type="radio" 
                      id={`radio-cat-${index}`} 
                      name="category-tabs" 
                      checked={selectedCategory === cat}
                      onChange={() => setSelectedCategory(cat)}
                    />
                    <label className="tab" htmlFor={`radio-cat-${index}`} style={{ fontSize: '0.8rem', padding: '0 12px', height: '28px' }}>
                      {cat}
                    </label>
                  </React.Fragment>
                ))}
                <div 
                  className="glider" 
                  style={{ transform: `translateX(${categories.indexOf(selectedCategory) * 100}%)`, height: '28px' }} 
                />
              </div>
            </div>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px', alignContent: 'start', background: 'var(--bg-app)' }}>
            {searchTerm.trim() === '' ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
                <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.2 }} />
                <p>Escribe el nombre del producto para agregarlo</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>
                <p>No se encontraron productos.</p>
              </div>
            ) : (
              filteredProducts.map(product => (
                <div key={product.id} onClick={() => addToCart(product)} className="card" style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `4px solid ${product.color}` }}>
                  <h4 style={{ fontWeight: 700, fontSize: '0.8rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</h4>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', marginLeft: '8px' }}>${product.price.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel Inferior: Ticket y Cobro */}
        <div className="card" style={{ height: '300px', display: 'flex', overflow: 'hidden', marginTop: '16px' }}>
          
          {/* Lista de productos agregados */}
          <div style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-app)', padding: '12px' }}>
            {cart.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                <ShoppingCart size={32} style={{ marginBottom: '8px', opacity: 0.3 }} />
                <p style={{ fontSize: '0.85rem' }}>Carrito Vacío</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                {cart.map((item) => (
                  <div key={item.id} className="card" style={{ padding: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
                    <div style={{ minWidth: 0, flex: 1, marginRight: '8px' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>${item.price.toFixed(2)} x {item.quantity}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.85rem' }}>
                        ${((item.price * item.quantity) * (1 - (item.discount || 0)/100)).toFixed(2)}
                      </div>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        <button onClick={() => updateQuantity(item.id, -1)} className="btn btn-outline" style={{ padding: '2px 4px' }}><Minus size={10} /></button>
                        <button onClick={() => updateQuantity(item.id, 1)} className="btn btn-outline" style={{ padding: '2px 4px' }}><Plus size={10} /></button>
                        <button onClick={() => handleRemove(item.id)} className="btn btn-outline" style={{ padding: '2px 4px', color: 'var(--accent-danger)' }}><Trash2 size={10} /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel de Cobro y Detalles */}
          <div style={{ width: '380px', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border-light)', background: '#fff' }}>
            <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
              <div style={{ background: 'var(--bg-app)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                <div className="flex-between" style={{ marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <span>Subtotal</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex-between" style={{ marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <span>IVA (16%)</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>${tax.toFixed(2)}</span>
                </div>
                <div style={{ borderTop: '1px dashed var(--border-light)', margin: '8px 0' }}></div>
                <div className="flex-between">
                  <span style={{ fontSize: '1rem', fontWeight: 700 }}>Total</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-primary)' }}>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div style={{ padding: '12px', borderTop: '1px solid var(--border-light)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '8px' }}>
                {[20, 50, 100, 500].map(amt => (
                  <button key={amt} onClick={() => processPayment(amt)} disabled={cart.length === 0} className="btn btn-outline" style={{ padding: '8px 4px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-success)' }}>
                    ${amt}
                  </button>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <button onClick={() => { setNumpadValue(''); setIsNumpadOpen(true); }} disabled={cart.length === 0} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', gap: '4px', background: 'var(--bg-app)' }}>
                  <Banknote size={14} /> <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>Efectivo</span>
                </button>
                <button onClick={() => processPayment()} disabled={cart.length === 0} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', gap: '4px', background: 'var(--bg-app)' }}>
                  <CreditCard size={14} /> <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>Tarjeta</span>
                </button>
              </div>
              <button 
                className="btn btn-primary" 
                onClick={() => processPayment()}
                disabled={cart.length === 0}
                style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: 800, display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: cart.length === 0 ? 0.5 : 1 }}
              >
                Cobrar ${total.toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}
      {modifierItem && (
        <div className="checkout-modal-overlay" onClick={() => setModifierItem(null)} style={{ background: 'rgba(0,0,0,0.4)', zIndex: 999 }}>
          <div className="checkout-modal" onClick={e => e.stopPropagation()} style={{ width: '300px', textAlign: 'left', padding: '24px' }}>
            <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>Modificar: {modifierItem.name}</h3>
            <form onSubmit={applyModifier}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Descuento (%)</label>
                <input type="number" min="0" max="100" value={modifierItem.discount} onChange={e => setModifierItem({...modifierItem, discount: parseInt(e.target.value) || 0})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-medium)' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Nota (Opcional)</label>
                <input type="text" placeholder="Ej. Sin azúcar" value={modifierItem.note} onChange={e => setModifierItem({...modifierItem, note: e.target.value})} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-medium)' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setModifierItem(null)} style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Aplicar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isNumpadOpen && (
        <div className="checkout-modal-overlay" onClick={() => setIsNumpadOpen(false)} style={{ background: 'rgba(0,0,0,0.4)', zIndex: 999 }}>
          <div className="checkout-modal" onClick={e => e.stopPropagation()} style={{ width: '320px', padding: '24px' }}>
            <h3 style={{ marginBottom: '8px', fontWeight: 700 }}>Monto Recibido</h3>
            <div style={{ fontSize: '2rem', fontWeight: 800, textAlign: 'center', marginBottom: '16px', padding: '12px', background: 'var(--bg-app)', borderRadius: '8px' }}>
              ${numpadValue || '0.00'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
              {['7','8','9','4','5','6','1','2','3','0','.','<'].map(key => (
                <button 
                  key={key} 
                  onClick={() => {
                    if (key === '<') setNumpadValue(numpadValue.slice(0, -1));
                    else if (key === '.' && numpadValue.includes('.')) return;
                    else setNumpadValue(numpadValue + key);
                  }}
                  style={{ padding: '16px', fontSize: '1.2rem', fontWeight: 600, borderRadius: '8px', border: '1px solid var(--border-light)', background: 'white', cursor: 'pointer' }}
                >
                  {key}
                </button>
              ))}
            </div>
            <button className="btn btn-primary" onClick={handleNumpadSubmit} style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }} disabled={!numpadValue}>
              Ingresar Pago
            </button>
          </div>
        </div>
      )}

      {isCheckoutOpen && (
        <div className="checkout-modal-overlay">
          <div className="checkout-modal" style={{ maxWidth: '400px' }}>
            {checkoutStep === 'processing' ? (
              <>
                <div className="loader" style={{ margin: '20px' }}><svg viewBox="0 0 80 80"><circle r="32" cy="40" cx="40" id="test"></circle></svg></div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Procesando Pago...</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Comunicando con el terminal</p>
              </>
            ) : (
              <>
                <svg className="success-checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" style={{ margin: '0 auto 16px' }}>
                  <circle className="success-checkmark__circle" cx="26" cy="26" r="25" fill="none"/>
                  <path className="success-checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                </svg>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-success)', marginTop: '-10px' }}>¡Venta Exitosa!</h2>
                {quickCash && quickCash > total && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid var(--accent-success)', margin: '16px 0', width: '100%' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '4px', textAlign: 'center' }}>Vuelto a entregar:</p>
                    <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-success)', textAlign: 'center', margin: 0 }}>
                      ${(quickCash - total).toFixed(2)}
                    </p>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px', width: '100%' }}>
                  <button className="btn btn-outline" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}>
                    <Printer size={20} /> Imprimir
                  </button>
                  <button className="btn btn-outline" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', color: '#25D366', borderColor: '#25D366' }}>
                    <MessageCircle size={20} /> WhatsApp
                  </button>
                </div>
                <button className="btn btn-primary" onClick={finishSale} style={{ width: '100%', padding: '16px', marginTop: '16px', fontSize: '1.1rem' }}>
                  Nueva Venta (Enter)
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
