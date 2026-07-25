import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, PauseCircle, PlayCircle, Printer, MessageCircle, Tag, Package, X, Calendar, MapPin, StickyNote, FileText, History } from 'lucide-react';

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

interface POSInterfaceProps {
  salesHistory: any[];
  setSalesHistory: (val: any[]) => void;
  isVoucherMode: boolean;
  onOpenVoucher?: () => void;
  onCloseVoucher?: () => void;
}

const POSInterface: React.FC<POSInterfaceProps> = ({ salesHistory, setSalesHistory, isVoucherMode, onOpenVoucher, onCloseVoucher }) => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<any[]>([]);
  const [heldCarts, setHeldCarts] = useState<any[][]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'processing' | 'success'>('processing');
  
  const [modifierItem, setModifierItem] = useState<any | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia'>('Efectivo');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [quickCash, setQuickCash] = useState<number | null>(null);
  
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [saleNote, setSaleNote] = useState('');
  const [voucherDocument, setVoucherDocument] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = searchTerm.trim() === '' ? [] : PRODUCT_CATALOG.filter(p => 
    (selectedCategory === 'Todos' || p.category === selectedCategory) &&
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.includes(searchTerm))
  );

  const subtotal = cart.reduce((acc, item) => acc + ((item.price * item.quantity) * (1 - (item.discount || 0)/100)), 0);
  const tax = subtotal * 0.16;
  const total = parseFloat((subtotal + tax).toFixed(2));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        if (isPaymentModalOpen) setIsPaymentModalOpen(false);
        else if (modifierItem) setModifierItem(null);
        else if (!isCheckoutOpen) { setCart([]); setQuickCash(null); }
      }
      if (e.key === 'Enter') {
        if (isCheckoutOpen && checkoutStep === 'success') {
          e.preventDefault();
          finishSale();
        } else if (isPaymentModalOpen) {
          const isInvalid = paymentMethod === 'Efectivo' && (parseFloat(amountReceived) < total || !amountReceived);
          if (!isInvalid) {
            e.preventDefault();
            setIsPaymentModalOpen(false);
            processPayment(paymentMethod === 'Efectivo' ? parseFloat(amountReceived) : undefined, paymentMethod);
          }
        } else if (cart.length > 0 && !isCheckoutOpen && !isPaymentModalOpen && !modifierItem) {
          e.preventDefault();
          setPaymentMethod('Efectivo');
          setAmountReceived('');
          setIsPaymentModalOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, isCheckoutOpen, isPaymentModalOpen, modifierItem, checkoutStep, paymentMethod, amountReceived, total]);

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

  const processPayment = (cashReceived?: number, method: string = 'Efectivo') => {
    if (cashReceived) setQuickCash(cashReceived);
    else setQuickCash(null);
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
        paymentMethod: method,
        voucherDocument: isVoucherMode ? voucherDocument : undefined,
        date: saleDate,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setSalesHistory([newSale, ...salesHistory]);
    }, 400);
  };

  const finishSale = () => {
    setCart([]);
    setQuickCash(null);
    setClientName('');
    setClientAddress('');
    setSaleNote('');
    setVoucherDocument('');
    setIsCheckoutOpen(false);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const handleEmptyCart = () => {
    setCart([]);
    searchInputRef.current?.focus();
  };

  const openPaymentModal = () => {
    setPaymentMethod('Efectivo');
    setAmountReceived('');
    setIsPaymentModalOpen(true);
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>{isVoucherMode ? 'Venta con Comprobante' : 'Punto de Venta'}</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Caja #1 - Turno Matutino <span style={{opacity:0.5}}>(F2: Buscar, Enter: Cobrar)</span></p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          
          {/* Navegación entre Venta Normal y Comprobante */}
          {!isVoucherMode ? (
            <button className="btn btn-outline" onClick={() => navigate('/voucher-pos')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={16} /> Ir a Venta con Comprobante
            </button>
          ) : (
            <button className="btn btn-outline" onClick={() => navigate('/pos')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShoppingCart size={16} /> Ir a Venta Normal
            </button>
          )}

          <div style={{ width: '1px', height: '24px', background: 'var(--border-medium)', margin: '0 8px' }} />

          <button className="btn btn-outline" onClick={() => navigate('/sales-history')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={18} /> Ir al Historial
          </button>
          
          {heldCarts.length > 0 && (
            <button className="btn btn-primary" onClick={handleResumeSale} style={{ display: 'flex', alignItems: 'center', gap: '8px', animation: 'pulse 2s infinite', marginLeft: '12px' }}>
              <PlayCircle size={18} /> Retomar Venta ({heldCarts.length})
            </button>
          )}
          <button className="btn btn-outline" onClick={handlePauseSale} disabled={cart.length === 0} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PauseCircle size={18} /> Pausar
          </button>
        </div>
      </div>

      {/* Contenedor Principal (Dividido en 2 columnas) */}
      <div style={{ flex: 1, display: 'flex', gap: '24px', minHeight: 0 }}>
        
        {/* Columna Izquierda: Datos Cliente, Buscador y Carrito */}
        <div style={{ flex: '2', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden' }}>
          
          {/* Datos del Cliente (Arriba del buscador, divididos) */}
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Nombre del Cliente</label>
                <input type="text" placeholder="Público General" value={clientName} onChange={e => setClientName(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
              <div style={{ width: '200px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Fecha de Emisión</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              {isVoucherMode && (
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '4px' }}>Documento / Comprobante</label>
                  <div style={{ position: 'relative' }}>
                    <FileText size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" placeholder="Ej. Factura #1020, RFC..." value={voucherDocument} onChange={e => setVoucherDocument(e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent-primary)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }} />
                  </div>
                </div>
              )}
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Dirección</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" placeholder="Opcional..." value={clientAddress} onChange={e => setClientAddress(e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }} />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Descripción / Nota</label>
                <div style={{ position: 'relative' }}>
                  <StickyNote size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" placeholder="Ej. Entregar en puerta trasera..." value={saleNote} onChange={e => setSaleNote(e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Buscador Principal */}
          <div style={{ position: 'relative', zIndex: 10, flexShrink: 0 }}>
            <Search size={22} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-primary)' }} />
            <input 
              ref={searchInputRef}
              autoFocus
              type="text" 
              placeholder="Escanea el código de barras o busca por nombre..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '16px 16px 16px 52px', borderRadius: 'var(--radius-lg)',
                border: '2px solid var(--border-medium)', background: 'var(--bg-card)',
                fontSize: '1.1rem', color: 'var(--text-primary)', outline: 'none',
                boxShadow: 'var(--shadow-sm)', transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-medium)'}
            />

            {/* Resultados Flotantes */}
            {searchTerm.trim() !== '' && (
              <div className="card animate-pop" style={{ 
                position: 'absolute', top: 'calc(100% + 8px)', left: 0, width: '100%', 
                maxHeight: '300px', overflowY: 'auto', zIndex: 20,
                padding: '8px', boxShadow: 'var(--shadow-lg)'
              }}>
                {filteredProducts.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No se encontraron productos.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                    {filteredProducts.map(product => (
                      <div 
                        key={product.id} 
                        onClick={() => { addToCart(product); setSearchTerm(''); searchInputRef.current?.focus(); }} 
                        style={{ 
                          padding: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', 
                          alignItems: 'center', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)',
                          borderLeft: `4px solid ${product.color}`
                        }}
                      >
                        <span style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>${product.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Carrito Grande */}
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-app)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={20} color="var(--accent-primary)" /> Productos Agregados ({cart.length})
              </h3>
              {cart.length > 0 && (
                <button onClick={handleEmptyCart} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--accent-danger)', borderColor: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Trash2 size={14} /> Vaciar Carrito
                </button>
              )}
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', background: 'var(--bg-card)' }}>
              {cart.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                  <ShoppingCart size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                  <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>El carrito está vacío</p>
                  <p style={{ fontSize: '0.85rem' }}>Utiliza el buscador de arriba para agregar productos</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {cart.map(item => (
                    <div key={item.id} style={{ 
                      padding: '8px 12px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      background: 'var(--bg-app)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)'
                    }}>
                      <div style={{ minWidth: 0, flex: 1, marginRight: '16px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '2px' }}>{item.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>${item.price.toFixed(2)} c/u</div>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-medium)', padding: '2px 4px' }}>
                          <button onClick={() => updateQuantity(item.id, -1)} style={{ background: 'transparent', border: 'none', padding: '4px 6px', cursor: 'pointer', color: 'var(--text-primary)' }}><Minus size={14} /></button>
                          <span style={{ fontWeight: 700, minWidth: '20px', textAlign: 'center', fontSize: '0.9rem' }}>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} style={{ background: 'transparent', border: 'none', padding: '4px 6px', cursor: 'pointer', color: 'var(--text-primary)' }}><Plus size={14} /></button>
                        </div>
                        
                        <div style={{ fontWeight: 800, color: 'var(--accent-primary)', fontSize: '1rem', width: '70px', textAlign: 'right' }}>
                          ${((item.price * item.quantity) * (1 - (item.discount || 0)/100)).toFixed(2)}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => setModifierItem(item)} className="btn btn-outline" style={{ padding: '6px', color: 'var(--text-secondary)' }} title="Aplicar Descuento / Nota">
                            <Tag size={14} />
                          </button>
                          <button onClick={() => handleRemove(item.id)} className="btn btn-outline" style={{ padding: '6px', color: 'var(--accent-danger)' }} title="Eliminar Producto">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Solo Cobro y Totales */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', minWidth: '300px', maxWidth: '360px' }}>
          
          <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
            
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 16px 0', paddingBottom: '12px', borderBottom: '1px solid var(--border-light)' }}>
              Resumen de Venta
            </h3>

            <div style={{ background: 'var(--bg-app)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
              <div className="flex-between" style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex-between" style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
                <span>IVA (16%)</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>${tax.toFixed(2)}</span>
              </div>
              <div style={{ borderTop: '2px dashed var(--border-light)', margin: '16px 0' }}></div>
              <div className="flex-between">
                <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>Total</span>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-primary)' }}>${total.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ flex: 1 }}></div>
            <button 
              className="btn btn-primary" 
              onClick={openPaymentModal}
              disabled={cart.length === 0}
              style={{ width: '100%', padding: '24px 20px', fontSize: '1.4rem', fontWeight: 800, marginTop: 'auto', opacity: cart.length === 0 ? 0.5 : 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>Cobrar</span>
              <span>${total.toFixed(2)}</span>
            </button>
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

      {isPaymentModalOpen && createPortal(
        <div className="checkout-modal-overlay" onClick={() => setIsPaymentModalOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '16px' }}>
          <div className="checkout-modal" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '450px', maxHeight: '90vh', padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-app)', flexShrink: 0 }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>Completar Pago</h2>
              <button onClick={() => setIsPaymentModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
            </div>
            
            {/* Body */}
            <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1 }}>
              <div style={{ padding: '20px', background: 'var(--bg-app)' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px', padding: '16px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '4px', marginTop: 0 }}>Total a Pagar</p>
                  <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-primary)', margin: 0 }}>${total.toFixed(2)}</p>
                </div>

                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>Método de Pago</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                  {['Efectivo', 'Tarjeta', 'Transferencia'].map(method => (
                    <button 
                      key={method}
                      onClick={() => { setPaymentMethod(method as any); setAmountReceived(''); }}
                      className={`btn ${paymentMethod === method ? 'btn-primary' : 'btn-outline'}`}
                      style={{ padding: '12px 8px', fontSize: '0.9rem', fontWeight: 600 }}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                {paymentMethod === 'Efectivo' ? (
                  <div style={{ marginBottom: '16px', animation: 'fadeIn 0.3s ease' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '12px' }}>Monto Recibido</label>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                      <input 
                        type="number" 
                        autoFocus
                        placeholder="0.00"
                        value={amountReceived}
                        onChange={e => setAmountReceived(e.target.value)}
                        style={{ flex: 1, padding: '16px', fontSize: '1.5rem', fontWeight: 700, borderRadius: 'var(--radius-sm)', border: '2px solid var(--border-medium)', background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none' }}
                      />
                      <button className="btn btn-outline" onClick={() => setAmountReceived(total.toFixed(2))} style={{ padding: '0 20px', fontWeight: 700, fontSize: '1.1rem' }}>Exacto</button>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
                      {[20, 50, 100, 500].map(amt => (
                        <button key={amt} onClick={() => setAmountReceived(amt.toString())} className="btn btn-outline" style={{ padding: '12px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-success)' }}>
                          ${amt}
                        </button>
                      ))}
                    </div>

                    {parseFloat(amountReceived) >= total && (
                      <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid var(--accent-success)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Cambio a devolver:</span>
                        <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-success)' }}>${(parseFloat(amountReceived) - total).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ marginBottom: '16px', padding: '32px', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '12px' }}>
                    <CreditCard size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
                    <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: 0 }}>Esperando cobro por terminal o verificación...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-light)', background: 'var(--bg-card)' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  setIsPaymentModalOpen(false);
                  processPayment(paymentMethod === 'Efectivo' ? parseFloat(amountReceived) : undefined, paymentMethod);
                }}
                disabled={paymentMethod === 'Efectivo' && (parseFloat(amountReceived) < total || !amountReceived)}
                style={{ width: '100%', padding: '16px', fontSize: '1.2rem', fontWeight: 800 }}
              >
                Confirmar Pago de ${total.toFixed(2)}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {isCheckoutOpen && createPortal(
        <div className="checkout-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '16px' }}>
          <div className="checkout-modal" style={{ width: '100%', maxWidth: '400px', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
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
                <div style={{ marginTop: '16px', width: '100%' }}>
                  <button className="btn btn-outline" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '16px', width: '100%' }}>
                    <Printer size={20} /> Imprimir Recibo
                  </button>
                </div>
                <button className="btn btn-primary" onClick={finishSale} style={{ width: '100%', padding: '16px', marginTop: '16px', fontSize: '1.1rem' }}>
                  Nueva Venta (Enter)
                </button>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default POSInterface;
