import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, PauseCircle, PlayCircle, Printer, Tag, X, Calendar, MapPin, StickyNote, FileText, History, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { searchByRnc } from '../utils/rncLookup';

import { logAuditEvent } from '../firebase/auditService';
import { subscribeToMechanics } from '../firebase/localMechanicsService';
import { updateInventoryItem } from '../firebase/inventoryService';
import { addSale } from '../firebase/localSalesService';
import { invoke } from '@tauri-apps/api/core';
import Toast from './Toast';



interface POSInterfaceProps {
  salesHistory: any[];
  setSalesHistory: (val: any[]) => void;
  inventory: any[];
  isVoucherMode: boolean;
  onOpenVoucher?: () => void;
  onCloseVoucher?: () => void;
}

const POSInterface: React.FC<POSInterfaceProps> = ({ salesHistory, setSalesHistory, inventory, isVoucherMode, onOpenVoucher, onCloseVoucher }) => {
  const navigate = useNavigate();
  const { currentUser, userData, companyId } = useAuth();
  const effectiveCompanyId = userData?.companyId || companyId || 'local';
  const currency = userData?.currency || '$';
  const taxEnabled = userData?.taxEnabled !== false;
  const baseTax = userData?.taxRate !== undefined ? userData.taxRate / 100 : 0.16;
  const taxRateVal = taxEnabled ? baseTax : 0;

  const [cart, setCart] = useState<any[]>([]);
  const [posAlert, setPosAlert] = useState<{ message: string, type: 'error' | 'warning' } | null>(null);
  const [heldCarts, setHeldCarts] = useState<any[][]>([]);
  
  const [isSearchingRnc, setIsSearchingRnc] = useState(false);

  const lookupRnc = async (rnc: string) => {
    if (!rnc || rnc.length < 9) return;
    setIsSearchingRnc(true);
    try {
      const result = await searchByRnc(rnc);
      if (result) {
        setClientName(result.nombre_razon_social || result.nombre_comercial);
      }
    } catch (error) {
      console.error('Error fetching RNC:', error);
    } finally {
      setIsSearchingRnc(false);
    }
  };
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'processing' | 'success'>('processing');
  
  const [modifierItem, setModifierItem] = useState<any | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia'>('Efectivo');
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [quickCash, setQuickCash] = useState<number | null>(null);
  
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientRnc, setClientRnc] = useState('');
  const [invoiceType, setInvoiceType] = useState<'ticket' | 'consumo' | 'credito'>('ticket');
  const [saleDate, setSaleDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [saleNote, setSaleNote] = useState('');
  const [voucherDocument, setVoucherDocument] = useState('');

  const [mechanics, setMechanics] = useState<any[]>([]);
  const [selectedMechanic, setSelectedMechanic] = useState<string>('');
  const [priceLevel, setPriceLevel] = useState<'normal' | 'frequent' | 'wholesale'>('normal');

  useEffect(() => {
    if (!effectiveCompanyId) return;
    return subscribeToMechanics(effectiveCompanyId, (data) => setMechanics(data));
  }, [effectiveCompanyId]);

  const getPrice = (product: any, level: string) => {
    if (level === 'frequent' && product.priceFrequent) return parseFloat(product.priceFrequent);
    if (level === 'wholesale' && product.priceWholesale) return parseFloat(product.priceWholesale);
    return parseFloat(product.price) || 0;
  };

  useEffect(() => {
    setCart(prev => prev.map(item => ({
      ...item,
      price: getPrice(item, priceLevel)
    })));
  }, [priceLevel]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = searchTerm.trim() === '' ? [] : inventory.filter(p => 
    (selectedCategory === 'Todos' || p.category === selectedCategory) &&
    (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.code && p.code.includes(searchTerm)))
  );

  const subtotal = cart.reduce((acc, item) => acc + ((item.price * item.quantity) * (1 - (item.discount || 0)/100)), 0);
  const tax = subtotal * taxRateVal;
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
          let finalCash = parseFloat(amountReceived);
          if (paymentMethod === 'Efectivo' && (!amountReceived || isNaN(finalCash) || finalCash < total)) {
            finalCash = total;
          }
          e.preventDefault();
          setIsPaymentModalOpen(false);
          processPayment(paymentMethod === 'Efectivo' ? finalCash : undefined, paymentMethod);
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

  const addToCart = (product: any) => {
    if (product.stock <= 5) {
      setPosAlert({ message: `¡Aviso! Quedan pocas unidades de ${product.name} (Stock: ${product.stock})`, type: 'warning' });
    }
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, price: getPrice(product, priceLevel), quantity: 1, discount: 0, note: '' }];
    });
  };

  const handleRemove = (id: number) => {
    const item = cart.find(i => i.id === id);
    if (item && currentUser && (userData?.companyId || 'local')) {
      logAuditEvent(
        userData?.companyId || 'local',
        currentUser.uid || currentUser.id,
        userData?.name || 'Usuario Local',
        'Producto Eliminado',
        `Se eliminó ${item.name} del carrito actual.`,
        'warning'
      );
    }
    setCart(cart.filter(item => item.id !== id));
  };
  const updateQuantity = (id: number, delta: number) => {
    setCart(cart.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  };

  const applyModifier = (e: React.FormEvent) => {
    e.preventDefault();
    if (modifierItem) {
      if (modifierItem.discount && modifierItem.discount > 0 && currentUser && (userData?.companyId || 'local')) {
        logAuditEvent(
          userData?.companyId || 'local',
          currentUser.uid || currentUser.id,
          userData?.name || 'Usuario Local',
          'Descuento Aplicado',
          `Se aplicó un descuento del ${modifierItem.discount}% a ${modifierItem.name}.`,
          'warning'
        );
      }
      setCart(cart.map(item => item.id === modifierItem.id ? modifierItem : item));
      setModifierItem(null);
    }
  };

  const processPayment = (cashReceived?: number, method: string = 'Efectivo') => {
    if (invoiceType === 'credito' && !clientRnc) {
      setPosAlert({ message: 'Para Crédito Fiscal es obligatorio ingresar el RNC / Cédula del cliente.', type: 'error' });
      return;
    }

    if (method === 'Efectivo' && cashReceived !== undefined && cashReceived < total) {
      setPosAlert({ message: `El monto recibido (${currency}${cashReceived.toFixed(2)}) es menor al total de la compra (${currency}${total.toFixed(2)}).`, type: 'error' });
      return;
    }

    if (cashReceived) setQuickCash(cashReceived);
    else setQuickCash(null);
    setIsCheckoutOpen(true);
    setCheckoutStep('processing');
    
    setTimeout(() => {
      setCheckoutStep('success');

      let generatedNcf = '';
      if (invoiceType === 'consumo' || invoiceType === 'credito') {
        try {
          const settingsStr = localStorage.getItem('schopy_store_settings');
          let settings = settingsStr ? JSON.parse(settingsStr) : {};
          if (invoiceType === 'credito') {
            const seq = settings.ncfCreditoSequence || 1;
            generatedNcf = `B01${String(seq).padStart(8, '0')}`;
            settings.ncfCreditoSequence = seq + 1;
          } else {
            const seq = settings.ncfConsumoSequence || 1;
            generatedNcf = `B02${String(seq).padStart(8, '0')}`;
            settings.ncfConsumoSequence = seq + 1;
          }
          localStorage.setItem('schopy_store_settings', JSON.stringify(settings));
        } catch (e) {
          console.error('Error generando NCF', e);
        }
      }

      const newSale = {
        id: `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
        items: [...cart],
        total,
        client: clientName,
        clientRnc,
        ncf: generatedNcf,
        invoiceType,
        address: clientAddress,
        note: saleNote,
        paymentMethod: method,
        voucherDocument: isVoucherMode ? voucherDocument : null,
        mechanicId: selectedMechanic || null,
        priceLevel,
        date: saleDate,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setSalesHistory([newSale, ...salesHistory]);

      // Guardar en Firestore para sincronización
      if (effectiveCompanyId) addSale(effectiveCompanyId, newSale);

      cart.forEach(item => {
        const invItem = inventory.find(i => i.id === item.id);
        if (invItem) {
          updateInventoryItem(invItem.id, { stock: Math.max(0, (invItem.stock || 0) - item.quantity) });
        }
      });

      if (method === 'Efectivo' && userData?.autoOpenDrawer && userData?.printerName) {
        handleOpenDrawer();
      }

      if (currentUser && (userData?.companyId || 'local')) {
        logAuditEvent(
          userData?.companyId || 'local',
          currentUser.uid || currentUser.id,
          userData?.name || 'Usuario Local',
          'Venta Completada',
          `Venta #${newSale.id} por ${currency}${newSale.total.toFixed(2)} (${newSale.paymentMethod}). ${newSale.items.length} productos.`,
          'info'
        );
      }
    }, 400);
  };

  const handleOpenDrawer = async () => {
    if (userData?.printerName) {
      try {
        await invoke('open_cash_drawer', { printerName: userData.printerName });
      } catch (e: any) {
        console.error('Error abriendo caja:', e);
        setPosAlert({ message: 'Error al abrir la caja registradora: ' + (e.message || e), type: 'error' });
      }
    } else {
      console.warn('No hay impresora configurada para abrir la caja');
      setPosAlert({ message: 'Atención: No hay ninguna impresora configurada para abrir la caja. Ve a Configuración para asignar una.', type: 'error' });
    }
  };

  const finishSale = () => {
    setCart([]);
    setQuickCash(null);
    setClientName('');
    setClientRnc('');
    setInvoiceType('ticket');
    setClientAddress('');
    setSaleNote('');
    setVoucherDocument('');
    setIsCheckoutOpen(false);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const handlePrintTicket = () => {
    // Tomamos la última venta agregada (que es la actual porque se inserta al inicio)
    const lastSale = salesHistory[0];
    if (!lastSale) return;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const printDocument = iframe.contentWindow?.document;
    if (!printDocument) {
      document.body.removeChild(iframe);
      return;
    }

    let itemsHtml = '';
    lastSale.items.forEach((item: any) => {
      const itemTotal = ((item.price * item.quantity) * (1 - (item.discount || 0)/100)).toFixed(2);
      itemsHtml += `
        <tr>
          <td style="padding: 4px 0; font-size: 12px; vertical-align: top;">${item.quantity}</td>
          <td style="padding: 4px 5px; font-size: 12px;">${item.name}${item.discount ? ` <br><small>(-${item.discount}%)</small>` : ''}</td>
          <td style="padding: 4px 0; text-align: right; font-size: 12px; vertical-align: top;">${currency}${itemTotal}</td>
        </tr>
      `;
    });

    const companyName = userData?.companyName || 'Mi Negocio';
    const address = userData?.address || '';
    const phone = userData?.phone || '';
    const taxId = userData?.taxId || '';
    const footer = userData?.ticketFooter || '¡Gracias por su compra!';
    const cashierName = currentUser?.name || 'Caja';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket de Compra - ${lastSale.id}</title>
        <style>
          @page { margin: 0; size: 80mm auto; }
          body { 
            font-family: 'Courier New', Courier, monospace; 
            width: 72mm; /* Leave a small margin for 80mm printers */
            margin: 0 auto; 
            padding: 10px 4mm; 
            color: #000; 
            font-size: 12px; 
            line-height: 1.2;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .line { border-top: 1px dashed #000; margin: 8px 0; }
          .logo { width: 60px; height: 60px; margin: 0 auto 10px; display: block; border-radius: 8px; filter: grayscale(100%); }
          table { width: 100%; border-collapse: collapse; }
          .footer { text-align: center; margin-top: 15px; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="center">
          <img src="data:image/png;base64,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" class="logo" alt="Logo" />
          <div class="center bold" style="font-size: 16px; margin-bottom: 5px;">${companyName}</div>
          <div class="center">${address}</div>
          <div class="center">Tel: ${phone}</div>
          ${taxId ? `<div class="center">ID/RNC: ${taxId}</div>` : ''}
        </div>
        
        <div class="line"></div>
        <div class="row"><span>Fecha: ${lastSale.date}</span><span>${lastSale.time}</span></div>
        <div class="row"><span>Ticket: #${lastSale.id}</span></div>
        <div class="row"><span>Cajero: ${cashierName}</span></div>
        ${lastSale.ncf ? `<div class="row"><span class="bold">NCF:</span><span class="bold">${lastSale.ncf}</span></div>` : ''}
        ${lastSale.ncf ? `<div class="row"><span>Tipo:</span><span>${lastSale.invoiceType === 'credito' ? 'Crédito Fiscal' : 'Consumo'}</span></div>` : ''}
        ${lastSale.client || lastSale.clientRnc ? '<div class="line"></div>' : ''}
        ${lastSale.client ? `<div class="row"><span>Cliente:</span><span>${lastSale.client}</span></div>` : ''}
        ${lastSale.clientRnc ? `<div class="row"><span>RNC/Cédula:</span><span>${lastSale.clientRnc}</span></div>` : ''}
        <div class="line"></div>

        <table>
          <tr style="border-bottom: 1px dashed #000;">
            <th style="text-align: left; padding-bottom: 4px;">Cant</th>
            <th style="text-align: left; padding-bottom: 4px;">Descripción</th>
            <th style="text-align: right; padding-bottom: 4px;">Importe</th>
          </tr>
          ${itemsHtml}
        </table>

        <div class="line"></div>
        <div class="row bold" style="font-size: 14px;">
          <span>TOTAL</span>
          <span>${currency}${lastSale.total.toFixed(2)}</span>
        </div>
        <div class="row" style="margin-top: 5px;">
          <span>Método de Pago</span>
          <span>${lastSale.paymentMethod}</span>
        </div>
        
        <div class="line"></div>
        <div class="footer">
          <p style="margin: 0 0 5px 0;">${footer}</p>
          <p style="margin: 0; color: #555;">Schopy POS System</p>
        </div>
      </body>
      </html>
    `;

    printDocument.write(html);
    printDocument.close();
    
    // Llamar al print dialog usando el window del iframe
    const win = iframe.contentWindow;
    if (win) {
      win.focus();
      win.print();
    }
    
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 5000);
  };

  const clearCart = () => {
    if (cart.length > 0 && currentUser && (userData?.companyId || 'local')) {
      logAuditEvent(
        userData?.companyId || 'local',
        currentUser.uid || currentUser.id,
        userData?.name || 'Usuario Local',
        'Carrito Cancelado',
        `Se canceló una venta en progreso de ${currency}${total.toFixed(2)} con ${cart.length} productos.`,
        'warning'
      );
    }
    setCart([]);
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
    <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', zoom: 0.9, position: 'relative' }}>
      
      {/* Toast Notification Area */}
      {posAlert && (
        <div style={{ position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 10000 }}>
          <Toast message={posAlert.message} type={posAlert.type} onClose={() => setPosAlert(null)} />
        </div>
      )}
      
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

          <button className="btn btn-outline" onClick={handleOpenDrawer} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Banknote size={18} /> Abrir Caja
          </button>

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
        
        {/* Columna Izquierda: Datos Cliente, Buscador y Productos */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', overflow: 'hidden', minWidth: '320px' }}>
          
          {/* Datos del Cliente (Arriba del buscador, divididos) */}
          <div className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>

            {isVoucherMode && (
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Nombre del Cliente</label>
                  <input type="text" placeholder="Público General" value={clientName} onChange={e => setClientName(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }} />
                </div>
                <div style={{ width: '200px', position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>RNC / Cédula</label>
                  <input 
                    type="text" 
                    placeholder="Opcional" 
                    value={clientRnc} 
                    onChange={e => {
                      const val = e.target.value;
                      setClientRnc(val);
                      const clean = val.replace(/[^0-9]/g, '');
                      if (clean.length === 9 || clean.length === 11) {
                        lookupRnc(clean);
                      }
                    }} 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: `1px solid ${invoiceType === 'credito' && !clientRnc ? 'var(--accent-danger)' : 'var(--border-medium)'}`, background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }} 
                  />
                  {isSearchingRnc && <div style={{ position: 'absolute', right: '10px', top: '35px', fontSize: '10px', color: 'var(--accent-primary)' }}>Buscando...</div>}
                </div>
                <div style={{ width: '200px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Fecha de Emisión</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: '16px' }}>
              {isVoucherMode && (
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Tipo de Factura (NCF)</label>
                  <select value={invoiceType} onChange={e => setInvoiceType(e.target.value as any)} style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}>
                    <option value="ticket">Ticket Normal (Sin NCF)</option>
                    <option value="consumo">Consumo (B02)</option>
                    <option value="credito">Crédito Fiscal (B01)</option>
                  </select>
                </div>
              )}
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Nivel de Precio</label>
                <select value={priceLevel} onChange={e => setPriceLevel(e.target.value as any)} style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}>
                  <option value="normal">Público General (Normal)</option>
                  <option value="frequent">Cliente Frecuente</option>
                  <option value="wholesale">Mayorista</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Mecánico (Opcional)</label>
                <select value={selectedMechanic} onChange={e => setSelectedMechanic(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}>
                  <option value="">Ninguno</option>
                  {mechanics.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              {isVoucherMode && (
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Dirección</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" placeholder="Opcional..." value={clientAddress} onChange={e => setClientAddress(e.target.value)} style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }} />
                  </div>
                </div>
              )}
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
          </div>

          {/* Grid de Productos Integrado */}
          <div className="card" style={{ flex: 1, overflowY: 'auto', padding: '16px', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column' }}>
            {searchTerm.trim() === '' && (
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px', marginTop: 0 }}>
                🔥 Los más vendidos
              </h3>
            )}
            
            {(searchTerm.trim() === '' ? inventory.slice(0, 5) : filteredProducts).length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', flex: 1 }}>
                <Package size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>No hay productos</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', alignContent: 'start' }}>
                {(searchTerm.trim() === '' ? inventory.slice(0, 5) : filteredProducts).map(product => (
                  <div 
                    key={product.id} 
                    onClick={() => { addToCart(product); setSearchTerm(''); searchInputRef.current?.focus(); }} 
                    style={{ 
                      padding: '16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', 
                      alignItems: 'center', background: 'var(--bg-app)', borderRadius: '12px',
                      border: '1px solid var(--border-light)',
                      borderLeft: `4px solid ${product.color || 'var(--accent-primary)'}`,
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--accent-primary)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.05)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border-light)';
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, paddingRight: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {product.barcode && <span style={{ background: 'var(--bg-card)', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--border-medium)', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{product.barcode}</span>}
                        {product.stock !== undefined && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: product.stock <= (product.minStock || 5) ? 'var(--accent-danger)' : 'var(--accent-success)' }}>
                            <Package size={14} /> {product.stock}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{currency}{product.price.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Ticket (Carrito y Totales Unificados) */}
        <div className="card" style={{ flex: '1.2', display: 'flex', flexDirection: 'column', minWidth: '400px', overflow: 'hidden' }}>
          
          {/* Cabecera del Ticket */}
          <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-app)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart size={20} color="var(--accent-primary)" /> Ticket ({cart.length})
            </h3>
            {cart.length > 0 && (
              <button onClick={clearCart} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--accent-danger)', borderColor: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Trash2 size={14} /> Vaciar
              </button>
            )}
          </div>
          
          {/* Lista de Productos del Ticket */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', background: 'var(--bg-card)' }}>
            {cart.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                <ShoppingCart size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>El ticket está vacío</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cart.map(item => (
                  <div key={item.id} style={{ 
                    padding: '12px', 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: '8px',
                    background: 'var(--bg-app)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-light)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ minWidth: 0, flex: 1, marginRight: '12px' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '2px', lineHeight: '1.2' }}>{item.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {currency}{item.price.toFixed(2)} c/u
                          {item.discount > 0 && <span style={{ color: 'var(--accent-success)', marginLeft: '4px' }}>(-{item.discount}%)</span>}
                        </div>
                      </div>
                      <div style={{ fontWeight: 800, color: 'var(--accent-primary)', fontSize: '1.1rem', textAlign: 'right' }}>
                        {currency}{((item.price * item.quantity) * (1 - (item.discount || 0)/100)).toFixed(2)}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-medium)', padding: '2px 4px' }}>
                        <button onClick={() => updateQuantity(item.id, -1)} style={{ background: 'transparent', border: 'none', padding: '4px 8px', cursor: 'pointer', color: 'var(--text-primary)' }}><Minus size={14} /></button>
                        <span style={{ fontWeight: 700, minWidth: '24px', textAlign: 'center', fontSize: '0.95rem' }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} style={{ background: 'transparent', border: 'none', padding: '4px 8px', cursor: 'pointer', color: 'var(--text-primary)' }}><Plus size={14} /></button>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => setModifierItem(item)} className="btn btn-outline" style={{ padding: '6px', color: 'var(--text-secondary)' }} title="Descuento / Nota">
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

          {/* Resumen de Venta Integrado */}
          <div style={{ padding: '20px', background: 'var(--bg-app)', borderTop: '2px dashed var(--border-medium)', flexShrink: 0, display: 'flex', flexDirection: 'column', boxShadow: '0 -4px 10px rgba(0,0,0,0.02)' }}>
            
            <div style={{ marginBottom: '20px' }}>
              <div className="flex-between" style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{currency}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex-between" style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
                <span>IVA/Tax ({(taxRateVal * 100).toFixed(0)}%)</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{currency}{tax.toFixed(2)}</span>
              </div>
              
              <div className="flex-between" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>Total a Pagar</span>
                <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent-primary)', lineHeight: 1 }}>{currency}{total.toFixed(2)}</span>
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              onClick={openPaymentModal}
              disabled={cart.length === 0}
              style={{ width: '100%', padding: '20px', fontSize: '1.4rem', fontWeight: 800, opacity: cart.length === 0 ? 0.5 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}
            >
              <ShoppingCart size={24} /> COBRAR
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
                  <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-primary)', margin: 0 }}>{currency}{total.toFixed(2)}</p>
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
                        type="text" 
                        autoFocus
                        placeholder="0.00"
                        value={amountReceived}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.');
                          setAmountReceived(val);
                        }}
                        style={{ flex: 1, padding: '16px', fontSize: '1.5rem', fontWeight: 700, borderRadius: 'var(--radius-sm)', border: '2px solid var(--border-medium)', background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none' }}
                      />
                      <button className="btn btn-outline" onClick={() => setAmountReceived(total.toFixed(2))} style={{ padding: '0 20px', fontWeight: 700, fontSize: '1.1rem' }}>Exacto</button>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
                      {[20, 50, 100, 500].map(amt => (
                        <button key={amt} onClick={() => setAmountReceived(amt.toString())} className="btn btn-outline" style={{ padding: '12px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-success)' }}>
                          {currency}{amt}
                        </button>
                      ))}
                    </div>

                    {amountReceived !== '' && !isNaN(parseFloat(amountReceived)) && (
                      <div style={{ background: parseFloat(amountReceived) >= total ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '12px', border: `1px solid ${parseFloat(amountReceived) >= total ? 'var(--accent-success)' : 'var(--accent-danger)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                          {parseFloat(amountReceived) >= total ? 'Cambio a devolver:' : 'Falta:'}
                        </span>
                        <span style={{ fontSize: '1.8rem', fontWeight: 800, color: parseFloat(amountReceived) >= total ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                          {currency}{Math.abs(parseFloat(amountReceived) - total).toFixed(2)}
                        </span>
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
                  let finalCash = parseFloat(amountReceived);
                  if (paymentMethod === 'Efectivo' && (!amountReceived || isNaN(finalCash) || finalCash < total)) {
                    finalCash = total; // Si está vacío o es menor, asumimos exacto
                  }
                  setIsPaymentModalOpen(false);
                  processPayment(paymentMethod === 'Efectivo' ? finalCash : undefined, paymentMethod);
                }}
                style={{ width: '100%', padding: '16px', fontSize: '1.2rem', fontWeight: 800 }}
              >
                Confirmar Pago de {currency}{total.toFixed(2)}
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
                      {currency}{(quickCash - total).toFixed(2)}
                    </p>
                  </div>
                )}
                <div style={{ marginTop: '16px', width: '100%' }}>
                  <button className="btn btn-outline" onClick={handlePrintTicket} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '16px', width: '100%' }}>
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
