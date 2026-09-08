import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Clock, Receipt, Printer, Calendar as CalendarIcon, Download, Edit, ShoppingCart, RotateCcw } from 'lucide-react';
import { updateSale } from '../firebase/localSalesService';
import { updateInventoryItem } from '../firebase/inventoryService';
import { addReturn } from '../firebase/returnsService';

interface SalesHistoryProps {
  salesHistory: any[];
  inventory: any[];
}

const AnimatedCheckbox = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
  <div className="checkbox-wrapper">
    <input type="checkbox" checked={checked} onChange={onChange} />
    <svg viewBox="0 0 40 40">
      <rect className="background" width="40" height="40" rx="8" />
      <rect className="stroke" width="40" height="40" rx="8" />
      <path className="check" d="M12,20 l6,6 l12,-12" />
    </svg>
  </div>
);

const SalesHistory: React.FC<SalesHistoryProps> = ({ salesHistory, inventory }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [returnModalSale, setReturnModalSale] = useState<any | null>(null);
  const [isReturning, setIsReturning] = useState(false);
  const { userData, companyId } = useAuth();
  const currency = userData?.currency || '$';
  const anyUserData = userData as any;

  const handlePrintTicket = (sale: any) => {
    if (!sale) return;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const printDocument = iframe.contentWindow?.document;
    if (!printDocument) {
      document.body.removeChild(iframe);
      return;
    }

    let itemsHtml = '';
    sale.items.forEach((item: any) => {
      itemsHtml += `
        <tr>
          <td style="padding: 4px 0; font-size: 12px;">${item.name} x${item.quantity}</td>
          <td style="padding: 4px 0; text-align: right; font-size: 12px;">${currency}${((item.price * item.quantity) * (1 - (item.discount || 0)/100)).toFixed(2)}</td>
        </tr>
      `;
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket de Compra - Copia</title>
        <style>
          @page { margin: 0; }
          body { font-family: 'Courier New', Courier, monospace; width: 80mm; margin: 0; padding: 10px; color: #000; font-size: 12px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .line { border-top: 1px dashed #000; margin: 10px 0; }
          .logo { width: 60px; height: 60px; margin: 0 auto 10px; display: block; border-radius: 8px; }
        </style>
      </head>
      <body>
        ${anyUserData?.logoUrl ? `<img src="${anyUserData.logoUrl}" class="logo" alt="Logo" />` : ''}
        <div class="center bold" style="font-size: 16px; margin-bottom: 4px;">${anyUserData?.businessName || userData?.companyName || 'Mi Negocio'}</div>
        ${anyUserData?.rnc || userData?.taxId ? `<div class="center" style="font-size: 11px;">RNC: ${anyUserData?.rnc || userData?.taxId}</div>` : ''}
        ${userData?.phone ? `<div class="center" style="font-size: 11px;">Tel: ${userData.phone}</div>` : ''}
        ${userData?.address ? `<div class="center" style="font-size: 11px; margin-bottom: 10px;">${userData.address}</div>` : ''}
        
        <div class="center bold" style="margin: 10px 0; border: 1px solid #000; padding: 4px;">COPIA DE TICKET</div>
        
        <div class="row"><span>Ticket:</span> <span>#${sale.id}</span></div>
        <div class="row"><span>Fecha:</span> <span>${sale.date || (sale.createdAt ? sale.createdAt.split('T')[0] : '')} ${sale.time}</span></div>
        <div class="row"><span>Cliente:</span> <span>${sale.client || 'Público en General'}</span></div>
        ${sale.status === 'returned' ? '<div class="center bold" style="color: red; margin-top:5px;">*** VENTA DEVUELTA ***</div>' : ''}
        
        <div class="line"></div>
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>${itemsHtml}</tbody>
        </table>
        <div class="line"></div>
        
        <div class="row bold" style="font-size: 14px; margin-top: 5px;"><span>TOTAL:</span> <span>${currency}${sale.total.toFixed(2)}</span></div>
        <div class="row" style="font-size: 12px; margin-top: 5px;"><span>Método:</span> <span>${sale.paymentMethod}</span></div>
        
        <div class="line"></div>
        <div class="center" style="margin-top: 15px; font-size: 11px;">
          <p>${userData?.ticketFooter || '¡Gracias por su compra!'}</p>
          <p style="font-size: 10px; margin-top: 10px;">Schopy POS System</p>
        </div>
      </body>
      </html>
    `;

    printDocument.write(html);
    printDocument.close();
    
    const win = iframe.contentWindow;
    if (win) {
      win.focus();
      win.print();
    }
    
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 1000);
  };
  
  const handleEditSale = (sale: any) => {
    // Si el usuario quiere editar los artículos, deberíamos redirigir a POS o tener un modal complejo.
    // Como solución rápida para "editar factura", permitiremos editar Cliente y Método de Pago.
    const newClient = prompt("Editar Cliente (Dejar vacío para Público en General):", sale.client || "");
    if (newClient !== null) {
      const newPayment = prompt("Editar Método de Pago (Efectivo, Tarjeta, Transferencia):", sale.paymentMethod);
      if (newPayment !== null) {
        updateSale(sale.id, { client: newClient || 'Público en General', paymentMethod: newPayment })
          .then(() => alert("Venta actualizada con éxito."))
          .catch(e => alert("Error al actualizar: " + e.message));
      }
    }
  };
  
  const filteredSales = salesHistory.filter(sale => {
    const clientName = sale.client || 'Público en General';
    const matchesSearch = sale.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          clientName.toLowerCase().includes(searchTerm.toLowerCase());
                          
    let matchesDate = true;
    if (dateFrom || dateTo) {
      // Intentar obtener la fecha en formato YYYY-MM-DD
      const sDate = sale.date || (sale.createdAt ? sale.createdAt.split('T')[0] : '');
      if (sDate) {
        if (dateFrom && sDate < dateFrom) matchesDate = false;
        if (dateTo && sDate > dateTo) matchesDate = false;
      }
    }

    return matchesSearch && matchesDate;
  });

  const handleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredSales.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSales.map(s => s.id));
    }
  };

  return (
    <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Historial de Ventas</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Consulta, edita y reimprime transacciones</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={() => navigate('/pos')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingCart size={18} /> Ir a Ventas (POS)
          </button>
          {selectedIds.length > 0 && (
            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--accent-primary)' }}>
              <Printer size={18} /> Imprimir ({selectedIds.length})
            </button>
          )}
          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={18} /> Exportar
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>Total Ventas (Filtradas)</p>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>${filteredSales.reduce((acc, s) => acc + s.total, 0).toFixed(2)}</h2>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>Transacciones</p>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{filteredSales.length}</h2>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>Ticket Promedio</p>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            ${filteredSales.length > 0 ? (filteredSales.reduce((acc, s) => acc + s.total, 0) / filteredSales.length).toFixed(2) : '0.00'}
          </h2>
        </div>
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
        
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '10px' }}>
             <button 
                onClick={handleSelectAll} 
                className="btn btn-outline" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px' }}
             >
                <div style={{ transform: 'scale(0.6)', transformOrigin: 'left center' }}>
                  <AnimatedCheckbox checked={selectedIds.length > 0 && selectedIds.length === filteredSales.length} onChange={() => {}} />
                </div>
                Seleccionar Todo
             </button>
          </div>

          <div style={{ flex: 1, minWidth: '250px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Buscar Transacción</label>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="ID de ticket o Cliente..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', padding: '10px 16px 10px 42px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)', background: 'var(--bg-app)',
                  fontSize: '0.9rem', color: 'var(--text-primary)', outline: 'none',
                }}
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Fecha Desde</label>
            <div style={{ position: 'relative' }}>
              <CalendarIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="date" 
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{
                  padding: '10px 16px 10px 36px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)', background: 'var(--bg-app)',
                  fontSize: '0.9rem', color: 'var(--text-primary)', outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Fecha Hasta</label>
            <div style={{ position: 'relative' }}>
              <CalendarIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="date" 
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{
                  padding: '10px 16px 10px 36px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)', background: 'var(--bg-app)',
                  fontSize: '0.9rem', color: 'var(--text-primary)', outline: 'none',
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {filteredSales.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <Receipt size={64} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>No hay transacciones</h3>
              <p>No se encontraron ventas con los filtros actuales.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              {filteredSales.map((sale) => {
                const isSelected = selectedIds.includes(sale.id);
                return (
                  <div key={sale.id} onClick={() => handleSelect(sale.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: isSelected ? 'rgba(24, 94, 224, 0.05)' : 'var(--bg-app)', border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-light)'}`, borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'all 0.2s' }}>
                    
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <div onClick={(e) => { e.stopPropagation(); handleSelect(sale.id); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AnimatedCheckbox checked={isSelected} onChange={() => handleSelect(sale.id)} />
                      </div>
                      <div style={{ width: '48px', height: '48px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                        <Clock size={24} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{sale.id}</h4>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: sale.status === 'returned' ? 'var(--accent-danger)' : 'var(--accent-primary)', background: sale.status === 'returned' ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                            {sale.time} {sale.status === 'returned' && '• DEVUELTA'}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
                          {sale.items.length} productos • Cliente: <b>{sale.client || 'Público en General'}</b> • Pago: {sale.paymentMethod}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Total</p>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-success)', margin: 0 }}>
                          ${sale.total.toFixed(2)}
                        </h3>
                      </div>
                      <div style={{ width: '1px', height: '40px', background: 'var(--border-light)' }}></div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={(e) => { e.stopPropagation(); handlePrintTicket(sale); }} className="btn btn-outline" title="Re-imprimir Ticket" style={{ padding: '10px' }}>
                          <Printer size={18} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleEditSale(sale); }} className="btn btn-outline" title="Editar Venta" style={{ padding: '10px', color: 'var(--accent-warning)', borderColor: 'var(--border-light)' }}>
                          <Edit size={18} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setReturnModalSale(sale); }} className="btn btn-outline" title="Devolver Venta" style={{ padding: '10px', color: 'var(--accent-danger)', borderColor: 'var(--border-light)' }}>
                          <RotateCcw size={18} />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Devolución */}
      {returnModalSale && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '90%', maxWidth: '500px', padding: '24px', position: 'relative' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Devolver Venta #{returnModalSale.id}</h3>
            
            {returnModalSale.status === 'returned' ? (
              <div style={{ padding: '16px', background: 'rgba(239,68,68,0.1)', color: 'var(--accent-danger)', borderRadius: '8px', marginBottom: '16px' }}>
                Esta venta ya ha sido devuelta completamente.
              </div>
            ) : (
              <>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Al devolver la venta, el stock de los productos regresará al inventario y se agregarán notas al Gestor de Devoluciones.
                </p>
                <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '24px', border: '1px solid var(--border-light)', borderRadius: '8px' }}>
                  {returnModalSale.items.map((item: any, idx: number) => (
                    <div key={idx} style={{ padding: '12px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cant: {item.quantity}</div>
                      </div>
                      <div style={{ fontWeight: 700 }}>
                        ${((item.price * item.quantity) * (1 - (item.discount || 0)/100)).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setReturnModalSale(null)} className="btn btn-outline">Cerrar</button>
              {returnModalSale.status !== 'returned' && (
                <button 
                  disabled={isReturning}
                  onClick={async () => {
                    setIsReturning(true);
                    try {
                      // 1. Restaurar stock
                      for (const item of returnModalSale.items) {
                        const invItem = inventory.find((i: any) => i.id === item.id);
                        if (invItem) {
                          const newStock = (invItem.stock || 0) + item.quantity;
                          await updateInventoryItem(item.id, { stock: newStock });
                        }
                      }

                      // 2. Marcar venta como devuelta
                      await updateSale(returnModalSale.id, { status: 'returned' });

                      // 3. Agregar al Gestor de Devoluciones en Firestore
                      if (companyId) {
                        for (const item of returnModalSale.items) {
                          const invItem = inventory.find((i: any) => i.id === item.id);
                          await addReturn(companyId, {
                            productId: item.id,
                            productName: item.name,
                            supplier: invItem?.supplier || 'No especificado',
                            note: `Devolución de Venta #${returnModalSale.id}`
                          });
                        }
                      }

                      setReturnModalSale(null);
                    } catch (e) {
                      console.error("Error devolviendo venta:", e);
                    }
                    setIsReturning(false);
                  }} 
                  className="btn btn-primary" 
                  style={{ background: 'var(--accent-danger)', border: 'none' }}
                >
                  {isReturning ? 'Procesando...' : 'Devolver Toda la Venta'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;
