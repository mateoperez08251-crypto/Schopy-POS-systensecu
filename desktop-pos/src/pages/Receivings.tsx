import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, PackagePlus, Calendar, ArrowRight, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { subscribeToReceivings, Receiving } from '../firebase/localReceivingsService';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { X, Printer } from 'lucide-react';

const Receivings = ({ suppliers }: { suppliers?: any[] }) => {
  const navigate = useNavigate();
  const { companyId } = useAuth();
  const [receivings, setReceivings] = useState<Receiving[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedReceiving, setSelectedReceiving] = useState<Receiving | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { userData } = useAuth();

  const effectiveCompanyId = userData?.companyId || companyId || 'local';

  useEffect(() => {
    if (!effectiveCompanyId) return;
    const unsub = subscribeToReceivings(effectiveCompanyId, (data) => {
      setReceivings(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });
    return () => unsub();
  }, [effectiveCompanyId]);

  // La creación se hace desde NewReceiving.tsx
  const handleAddReceiving = (data: any) => {
    // Deprecated for direct add, use NewReceiving
  };

  const filteredReceivings = receivings.filter(r => {
    const matchesSearch = r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.supplier.toLowerCase().includes(searchTerm.toLowerCase());
                          
    let matchesDate = true;
    if (dateFrom || dateTo) {
      const rDate = r.date ? r.date.split('T')[0] : '';
      if (rDate) {
        if (dateFrom && rDate < dateFrom) matchesDate = false;
        if (dateTo && rDate > dateTo) matchesDate = false;
      }
    }
    
    return matchesSearch && matchesDate;
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <PackagePlus size={28} color="var(--accent-primary)" /> Recepción de Mercancía
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Registra e inspecciona el historial de entradas al inventario</p>
        </div>
        <button 
          className="btn btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={() => navigate('/receivings/new')}
        >
          <Plus size={18} /> Registrar Entrada
        </button>
      </div>

      <div 
        style={{ 
          marginBottom: '32px', 
          display: 'flex', 
          gap: '16px', 
          alignItems: 'center',
          background: 'linear-gradient(145deg, var(--bg-card), var(--bg-app))',
          padding: '16px 20px',
          borderRadius: '24px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05), inset 0 2px 0 rgba(255, 255, 255, 0.6)',
          border: '1px solid var(--border-light)'
        }}
      >
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            background: 'var(--accent-primary)', 
            padding: '12px', 
            borderRadius: '16px', 
            marginRight: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.15)'
          }}>
            <Search size={20} color="white" />
          </div>
          <input 
            type="text" 
            placeholder="Buscar por ID, proveedor o usuario..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '1.1rem',
              fontWeight: 500,
              color: 'var(--text-primary)',
              padding: '8px 0'
            }}
          />
        </div>
        
        <div style={{ width: '2px', height: '40px', background: 'var(--border-light)', margin: '0 8px', borderRadius: '2px' }}></div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            background: 'var(--bg-app)', 
            padding: '8px 20px', 
            borderRadius: '16px', 
            border: '1px solid var(--border-light)', 
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }} 
          className="hover:border-blue-500 hover:shadow-md"
          >
            <Calendar size={18} color="var(--accent-primary)" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Desde Fecha</span>
              <input 
                type="date" 
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', padding: 0 }}
              />
            </div>
          </div>
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            background: 'var(--bg-app)', 
            padding: '8px 20px', 
            borderRadius: '16px', 
            border: '1px solid var(--border-light)', 
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
          }} 
          className="hover:border-blue-500 hover:shadow-md"
          >
            <Calendar size={18} color="var(--accent-primary)" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hasta Fecha</span>
              <input 
                type="date" 
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', padding: 0 }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--border-light)' }}>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>ID RECEPCIÓN</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>FECHA Y HORA</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>PROVEEDOR</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>CANT. ÍTEMS</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>COSTO TOTAL</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>REGISTRADO POR</th>
              <th style={{ padding: '16px 20px' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredReceivings.map((rcv) => (
              <tr key={rcv.id} style={{ borderBottom: '1px solid var(--border-light)', transition: '0.2s', cursor: 'pointer' }} className="hover:bg-[var(--bg-app)]">
                <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>{rcv.id}</td>
                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {new Date(rcv.date).toLocaleString('es-DO')}
                </td>
                <td style={{ padding: '16px 20px', fontWeight: 500, color: 'var(--text-primary)' }}>{rcv.supplier}</td>
                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                  <span style={{ background: 'var(--bg-app)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600 }}>
                    {rcv.items} productos
                  </span>
                </td>
                <td style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                  ${rcv.totalCost.toLocaleString()}
                </td>
                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={12} color="var(--text-muted)" />
                  </div>
                  {rcv.user}
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  <button 
                    className="btn btn-outline" 
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    onClick={() => setSelectedReceiving(rcv)}
                  >
                    Detalles <ArrowRight size={14} style={{ marginLeft: '4px' }} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredReceivings.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No hay recepciones registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Detalles */}
      {selectedReceiving && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-app)', borderRadius: '16px', width: '100%', maxWidth: '600px',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
          }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Detalles de Recepción <span style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>#{selectedReceiving.id.slice(-6).toUpperCase()}</span>
              </h2>
              <button onClick={() => setSelectedReceiving(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="var(--text-muted)" />
              </button>
            </div>
            
            <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '12px' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Proveedor</p>
                  <p style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 600 }}>{selectedReceiving.supplier}</p>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '12px' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Fecha</p>
                  <p style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 600 }}>{new Date(selectedReceiving.date).toLocaleString('es-DO')}</p>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '12px' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Registrado por</p>
                  <p style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 600 }}>{selectedReceiving.user}</p>
                </div>
                <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '12px' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Costo Total</p>
                  <p style={{ fontSize: '1.05rem', color: 'var(--accent-primary)', fontWeight: 700 }}>${selectedReceiving.totalCost.toLocaleString()}</p>
                </div>
              </div>

              {selectedReceiving.notes && (
                <div style={{ marginBottom: '24px', background: 'var(--bg-card)', padding: '12px', borderRadius: '12px' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Notas</p>
                  <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{selectedReceiving.notes}</p>
                </div>
              )}

              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>Productos Recibidos</h3>
              {selectedReceiving.receivedItems && selectedReceiving.receivedItems.length > 0 ? (
                <div style={{ border: '1px solid var(--border-light)', borderRadius: '12px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-light)' }}>
                        <th style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Producto</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cant.</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Costo U.</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedReceiving.receivedItems.map((item: any, i: number) => {
                        const isPackage = item.entryType === 'package';
                        const quantityText = isPackage ? `${item.quantity} Cajas` : `${item.quantity} Uds`;
                        const displayTotal = item.quantity * item.cost;
                        return (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                            <td style={{ padding: '12px 16px', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>{item.name}</td>
                            <td style={{ padding: '12px 16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{quantityText}</td>
                            <td style={{ padding: '12px 16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>${item.cost.toLocaleString()}</td>
                            <td style={{ padding: '12px 16px', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>${displayTotal.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '12px', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Los detalles de los productos no están disponibles para esta recepción.</p>
                </div>
              )}
            </div>
            
            <div style={{ padding: '20px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                className="btn btn-outline" 
                onClick={() => setSelectedReceiving(null)}
              >
                Cerrar
              </button>
              <button 
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                onClick={async () => {
                  const doc = new jsPDF();
                  
                  // Intentar cargar logo
                  try {
                    const img = new Image();
                    img.src = '/app-icon.png';
                    await new Promise((resolve) => {
                      img.onload = resolve;
                      img.onerror = resolve;
                    });
                    doc.addImage(img, 'PNG', 14, 10, 18, 18);
                  } catch (e) { /* sin logo */ }
                  
                  doc.setTextColor(0, 0, 0);
                  doc.setFontSize(18);
                  doc.setFont('helvetica', 'bold');
                  doc.text(userData?.companyName || 'SCHOPY POS', 36, 18);
                  
                  doc.setFontSize(10);
                  doc.setFont('helvetica', 'normal');
                  doc.text('COMPROBANTE DE ENTRADA (Copia)', 196, 18, { align: 'right' });

                  doc.setFontSize(10);
                  doc.text(`Fecha: ${new Date(selectedReceiving.date).toLocaleDateString('es-DO')} ${new Date(selectedReceiving.date).toLocaleTimeString('es-DO')}`, 14, 35);
                  
                  doc.setDrawColor(0, 0, 0);
                  doc.setLineWidth(0.5);
                  doc.line(14, 40, 196, 40);

                  doc.setFontSize(12);
                  doc.setFont('helvetica', 'bold');
                  doc.text('DATOS DEL PROVEEDOR', 14, 50);
                  
                  doc.setFontSize(10);
                  doc.setFont('helvetica', 'normal');
                  doc.text(`Empresa: ${selectedReceiving.supplier}`, 14, 58);
                  doc.text(`Registrado por: ${selectedReceiving.user}`, 120, 58);
                  
                  if (selectedReceiving.notes) {
                    doc.text(`Notas: ${selectedReceiving.notes}`, 14, 65);
                  }

                  doc.line(14, 72, 196, 72);

                  if (selectedReceiving.receivedItems && selectedReceiving.receivedItems.length > 0) {
                    const tableData = selectedReceiving.receivedItems.map((item: any) => {
                      const isPackage = item.entryType === 'package';
                      const quantityText = isPackage ? `${item.quantity} Cajas/Paq.` : `${item.quantity} Unidades`;
                      const displayTotal = item.quantity * item.cost;
                      return [
                        item.code || item.sku || 'N/A',
                        item.name,
                        quantityText,
                        `$${item.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                        `$${displayTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                      ];
                    });

                    autoTable(doc, {
                      startY: 78,
                      head: [['Código/SKU', 'Producto', 'Cant.', 'Costo Unit.', 'Total']],
                      body: tableData,
                      theme: 'plain',
                      headStyles: { textColor: 0, fontStyle: 'bold', lineWidth: { bottom: 0.5 }, lineColor: 0 },
                      styles: { fontSize: 10, cellPadding: 4, textColor: 0 },
                      columnStyles: {
                        0: { cellWidth: 30 },
                        2: { halign: 'center', cellWidth: 25 },
                        3: { halign: 'right', cellWidth: 35 },
                        4: { halign: 'right', cellWidth: 35 }
                      }
                    });
                  } else {
                    doc.text('Detalle de productos no disponible.', 14, 85);
                  }

                  const finalY = (doc as any).lastAutoTable?.finalY || 90;
                  doc.setFontSize(14);
                  doc.setFont('helvetica', 'bold');
                  doc.text(`COSTO TOTAL: $${selectedReceiving.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 196, finalY + 15, { align: 'right' });

                  doc.save(`Recepcion_${selectedReceiving.id.slice(-6)}.pdf`);
                  
                  // Mostrar notificación personalizada en la parte inferior
                  setToastMessage(`¡PDF descargado exitosamente!`);
                  setTimeout(() => {
                    setToastMessage(null);
                  }, 3500);
                }}
              >
                <Printer size={16} /> Imprimir PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification (Notificación inferior) */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(10px)',
          color: '#ffffff',
          padding: '12px 24px',
          borderRadius: '50px',
          fontSize: '0.95rem',
          fontWeight: 500,
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 10000,
          animation: 'slideUpToast 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
        }}>
          <div style={{
            background: 'var(--accent-primary)',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          {toastMessage}
          <style>
            {`
              @keyframes slideUpToast {
                from { opacity: 0; transform: translate(-50%, 20px); }
                to { opacity: 1; transform: translate(-50%, 0); }
              }
            `}
          </style>
        </div>
      )}
    </div>
  );
};

export default Receivings;
