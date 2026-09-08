import React, { useState, useEffect } from 'react';
import { Calculator, Wallet, DollarSign, Save, AlertTriangle, CheckCircle, Printer, Download, ArrowLeft, Receipt, Package, TrendingUp, CreditCard } from 'lucide-react';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CashRegisterProps {
  salesHistory?: any[];
  setSalesHistory?: (val: any[]) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const CashRegister: React.FC<CashRegisterProps> = ({ salesHistory = [], setSalesHistory, showToast }) => {
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [todaysSales, setTodaysSales] = useState<any[]>([]);
  const [salesCount, setSalesCount] = useState(0);
  const [estimatedProfit, setEstimatedProfit] = useState(0);
  
  const [salesByMethod, setSalesByMethod] = useState({ Efectivo: 0, Tarjeta: 0, Transferencia: 0 });
  const [totalsSummary, setTotalsSummary] = useState({ grossTotal: 0, discounts: 0, taxes: 0, netTotal: 0 });
  
  const [baseCash, setBaseCash] = useState<string>('50');
  const [countedCash, setCountedCash] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  const [closedRegisterData, setClosedRegisterData] = useState<any>(null);

  const currency = userData?.currency || '$';
  const taxRateVal = userData?.taxRate !== undefined ? userData.taxRate / 100 : 0.16;

  useEffect(() => {
    fetchTodaysSales();
  }, [salesHistory]);

  const fetchTodaysSales = () => {
    setLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const todaySalesFiltered = salesHistory.filter(sale => sale.date === todayStr);
      
      let profit = 0;
      const methods = { Efectivo: 0, Tarjeta: 0, Transferencia: 0 };
      const summary = { grossTotal: 0, discounts: 0, taxes: 0, netTotal: 0 };
      
      todaySalesFiltered.forEach((sale) => {
        const saleMethod = sale.paymentMethod || 'Efectivo';
        if (methods[saleMethod as keyof typeof methods] !== undefined) {
           methods[saleMethod as keyof typeof methods] += sale.total;
        } else {
           methods['Efectivo'] += sale.total;
        }
        
        let saleGross = 0;
        let saleDiscountAmount = 0;

        sale.items?.forEach((item: any) => {
          const rawTotal = item.price * item.quantity;
          const disc = rawTotal * ((item.discount || 0)/100);
          saleGross += rawTotal;
          saleDiscountAmount += disc;
          
          const itemCost = item.costPrice || (item.price * 0.6);
          profit += (rawTotal - disc) - (itemCost * item.quantity);
        });
        
        const saleSubtotal = saleGross - saleDiscountAmount;
        const saleTax = saleSubtotal * taxRateVal;
        
        summary.grossTotal += saleGross;
        summary.discounts += saleDiscountAmount;
        summary.taxes += saleTax;
        summary.netTotal += sale.total;
      });
      
      setTodaysSales(todaySalesFiltered);
      setSalesByMethod(methods);
      setTotalsSummary(summary);
      setEstimatedProfit(profit);
      setSalesCount(todaySalesFiltered.length);
    } catch (error) {
      console.error("Error cargando ventas:", error);
    } finally {
      setLoading(false);
    }
  };

  const parsedBase = parseFloat(baseCash || '0');
  const expectedCashInDrawer = salesByMethod.Efectivo + parsedBase;
  const difference = (parseFloat(countedCash || '0')) - expectedCashInDrawer;
  const hasDifference = Math.abs(difference) > 0.01;

  const handleCloseRegister = async () => {
    if (!countedCash || isNaN(Number(countedCash))) {
      if (showToast) showToast("Ingresa una cantidad válida de efectivo físico", 'error');
      return;
    }

    setSubmitting(true);
    try {
      const snapshot = await getDocs(collection(db, 'cash_registers'));
      const nextTicketNumber = snapshot.size + 1;
      const displayId = `Z-${nextTicketNumber.toString().padStart(4, '0')}`;

      const dataToSave = {
        cashierId: currentUser?.uid,
        cashierName: userData?.name || currentUser?.email || 'Administrador',
        companyId: userData?.companyId || 'default',
        baseCash: parsedBase,
        expectedAmount: expectedCashInDrawer,
        reportedAmount: parseFloat(countedCash),
        difference: difference,
        salesCount: salesCount,
        estimatedProfit: estimatedProfit,
        methods: salesByMethod,
        totalsSummary: totalsSummary,
        notes: notes,
        salesDetails: todaysSales,
        timestamp: serverTimestamp(),
        displayId: displayId
      };
      
      const docRef = await addDoc(collection(db, 'cash_registers'), dataToSave);
      if (showToast) showToast("Cierre de caja guardado con éxito", 'success');
      
      setClosedRegisterData({ ...dataToSave, id: docRef.id });
      setCountedCash('');
      setNotes('');
    } catch (error) {
      console.error("Error cerrando caja:", error);
      if (showToast) showToast("Error al procesar el cierre", 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrintTicket = () => {
    if (!closedRegisterData) return;
    const printWindow = window.open('', '', 'width=300,height=600');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Corte de Caja</title>
          <style>
            body { font-family: monospace; font-size: 12px; margin: 0; padding: 10px; width: 80mm; color: #000; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-bottom: 1px dashed #000; margin: 10px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            @media print { body { width: 100%; margin: 0; padding: 0; } }
          </style>
        </head>
        <body>
          <div class="center bold" style="font-size:16px;">${userData?.companyName || 'SCHOPY POS'}</div>
          <div class="center">CORTE DE CAJA (Z)</div>
          <div class="line"></div>
          <div class="row"><span>Fecha:</span><span>${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</span></div>
          <div class="row"><span>Cajero:</span><span>${closedRegisterData.cashierName}</span></div>
          <div class="row"><span>Corte Z:</span><span>${closedRegisterData.displayId || closedRegisterData.id}</span></div>
          <div class="line"></div>
          <div class="row"><span>Ventas (Tickets):</span><span>${closedRegisterData.salesCount}</span></div>
          <div class="row"><span>Ventas Efectivo:</span><span>${currency}${closedRegisterData.methods.Efectivo.toFixed(2)}</span></div>
          <div class="row"><span>Ventas Tarjeta/Otros:</span><span>${currency}${(closedRegisterData.methods.Tarjeta + closedRegisterData.methods.Transferencia).toFixed(2)}</span></div>
          <div class="line"></div>
          <div class="row"><span>Base Inicial:</span><span>${currency}${Number(closedRegisterData.baseCash).toFixed(2)}</span></div>
          <div class="row"><span>Esperado (Caja):</span><span>${currency}${closedRegisterData.expectedAmount.toFixed(2)}</span></div>
          <div class="row"><span>Contado Físico:</span><span>${currency}${closedRegisterData.reportedAmount.toFixed(2)}</span></div>
          <div class="line"></div>
          <div class="row bold" style="font-size:14px;">
            <span>DIFERENCIA:</span>
            <span>${currency}${closedRegisterData.difference.toFixed(2)}</span>
          </div>
          <div class="center" style="margin-top:40px;">
            <p>_______________________</p>
            <p>Firma del Cajero</p>
          </div>
          <script>window.onload = function() { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadDetailedReport = () => {
    if (!closedRegisterData) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      if (showToast) showToast('El navegador bloqueó la pestaña. Por favor, permite las ventanas emergentes.', 'error');
      return;
    }

    try {
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text('Reporte de Cierre de Caja (Z)', 14, 20);
      
      doc.setFontSize(10);
      doc.text(`Empresa: ${userData?.companyName || 'SCHOPY POS'}`, 14, 28);
      doc.text(`Fecha: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 34);
      doc.text(`Cajero: ${closedRegisterData.cashierName}`, 14, 40);
      doc.text(`Corte Z ID: ${closedRegisterData.displayId || closedRegisterData.id}`, 14, 46);

      const base = Number(closedRegisterData.baseCash) || 0;
      const expected = Number(closedRegisterData.expectedAmount) || 0;
      const reported = Number(closedRegisterData.reportedAmount) || 0;
      const diff = Number(closedRegisterData.difference) || 0;
      const estProfit = Number(closedRegisterData.estimatedProfit) || 0;
      
      const methods = closedRegisterData.methods || { Efectivo: 0, Tarjeta: 0, Transferencia: 0 };
      const totals = closedRegisterData.totalsSummary || { grossTotal: 0, discounts: 0, taxes: 0, netTotal: 0 };

      autoTable(doc, {
        startY: 55,
        head: [['Resumen Financiero', 'Monto']],
        body: [
          ['Total Transacciones (Tickets)', String(closedRegisterData.salesCount || 0)],
          ['Ingresos Brutos', `${currency}${Number(totals.grossTotal).toFixed(2)}`],
          ['Descuentos Otorgados', `-${currency}${Number(totals.discounts).toFixed(2)}`],
          ['Impuestos Retenidos', `${currency}${Number(totals.taxes).toFixed(2)}`],
          ['Ingresos Netos (Total Ventas)', `${currency}${Number(totals.netTotal).toFixed(2)}`],
          ['', ''],
          ['Ventas en Efectivo', `${currency}${Number(methods.Efectivo).toFixed(2)}`],
          ['Ventas en Tarjeta / Otros', `${currency}${(Number(methods.Tarjeta) + Number(methods.Transferencia)).toFixed(2)}`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [70, 70, 70] }
      });

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Arqueo de Caja Física', 'Valor']],
        body: [
          ['Fondo de Caja (Base Inicial)', `${currency}${base.toFixed(2)}`],
          ['Efectivo de Ventas', `${currency}${Number(methods.Efectivo).toFixed(2)}`],
          ['Efectivo Esperado (Base + Ventas)', `${currency}${expected.toFixed(2)}`],
          ['Efectivo Contado (Reportado)', `${currency}${reported.toFixed(2)}`],
          ['Diferencia', `${currency}${diff.toFixed(2)}`],
          ['', ''],
          ['Ganancia Neta Estimada (Utilidad)', `${currency}${estProfit.toFixed(2)}`]
        ],
        theme: 'grid',
        headStyles: { fillColor: [0, 0, 0] }
      });

      const salesBody: any[] = [];
      if (closedRegisterData.salesDetails && closedRegisterData.salesDetails.length > 0) {
        closedRegisterData.salesDetails.forEach((sale: any, index: number) => {
          const saleTotal = Number(sale.total) || 0;
          salesBody.push([
            { content: `Ticket #${index + 1} | Hora: ${sale.time} | Pago: ${sale.paymentMethod || 'Efectivo'}`, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
            { content: `${currency}${saleTotal.toFixed(2)}`, styles: { fontStyle: 'bold', fillColor: [240, 240, 240], halign: 'right' } }
          ]);
          if (sale.items) {
            sale.items.forEach((item: any) => {
              const price = Number(item.price) || 0;
              const qty = Number(item.quantity) || 1;
              const discount = Number(item.discount) || 0;
              const rowTotal = ((price * qty) * (1 - discount/100)).toFixed(2);
              salesBody.push([
                `- ${item.name} (x${qty})`, 
                '', 
                { content: `${currency}${rowTotal}`, styles: { halign: 'right' } }
              ]);
            });
          }
        });

        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 10,
          head: [['Desglose de Ventas (Productos)', '', 'Total']],
          body: salesBody,
          theme: 'grid',
          headStyles: { fillColor: [50, 50, 50] }
        });
      }

      if (closedRegisterData.notes) {
        const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : 150;
        doc.text('Observaciones:', 14, finalY);
        const splitNotes = doc.splitTextToSize(closedRegisterData.notes, 180);
        doc.text(splitNotes, 14, finalY + 6);
      }

      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      printWindow.location.href = url;
    } catch (error) {
      console.error("Error generando PDF:", error);
      printWindow.close();
      if (showToast) showToast('Error al generar el PDF. Revisa la consola.', 'error');
    }
  };

  if (closedRegisterData) {
    return (
      <div style={{ padding: '24px', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="card" style={{ maxWidth: '600px', width: '100%', padding: '40px', textAlign: 'center' }}>
          <CheckCircle size={64} color="#10B981" style={{ margin: '0 auto 24px' }} />
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>Cierre Exitoso</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>El corte de caja y detalle de ganancias se guardó correctamente.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <button onClick={handlePrintTicket} className="btn btn-outline" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '20px' }}>
              <Printer size={32} />
              <div>
                <span style={{ fontWeight: 600, display: 'block' }}>Ticket Corto</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Impresora Térmica</span>
              </div>
            </button>
            <button onClick={handleDownloadDetailedReport} className="btn btn-outline" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '20px', borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}>
              <Download size={32} />
              <div>
                <span style={{ fontWeight: 600, display: 'block' }}>Reporte Completo A4</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Con ganancias y detalles (PDF)</span>
              </div>
            </button>
          </div>
          
          <button 
            onClick={() => { setClosedRegisterData(null); fetchTodaysSales(); }}
            className="btn btn-primary" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', padding: '16px' }}
          >
            <ArrowLeft size={18} /> Volver a Caja
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Caja & Cortes</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Realiza el cierre Z diario, cuadra el efectivo y analiza ganancias</p>
        </div>
        <button className="btn btn-outline" onClick={fetchTodaysSales} disabled={loading}>
          Actualizar Datos
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'start' }}>
        
        {/* Panel Izquierdo: Resumen y Detalle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                <Calculator size={20} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Resumen Financiero del Turno</h3>
            </div>
            
            {loading ? (
              <p style={{ color: 'var(--text-secondary)' }}>Calculando transacciones...</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ padding: '16px', background: 'var(--bg-app)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Transacciones</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Receipt size={18} color="var(--accent-primary)" />
                      <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{salesCount}</span>
                    </div>
                  </div>
                  <div style={{ padding: '16px', background: 'var(--bg-app)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Ventas Netas</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <TrendingUp size={18} color="var(--accent-primary)" />
                      <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{currency}{totalsSummary.netTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '16px', border: '1px solid var(--border-light)', borderRadius: '12px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: 600 }}>Desglose por Método de Pago</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><DollarSign size={14}/> Efectivo (Caja)</span>
                    <span style={{ fontWeight: 700 }}>{currency}{salesByMethod.Efectivo.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CreditCard size={14}/> Tarjeta / Otros</span>
                    <span style={{ fontWeight: 700 }}>{currency}{(salesByMethod.Tarjeta + salesByMethod.Transferencia).toFixed(2)}</span>
                  </div>
                </div>

                <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ color: 'var(--accent-success)', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <TrendingUp size={16} /> Ganancia Estimada
                    </span>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Margen estimado</p>
                  </div>
                  <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {currency}{estimatedProfit.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: '24px', flex: 1, maxHeight: '400px', overflowY: 'auto' }}>
             <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Package size={18} color="var(--accent-primary)" /> Detalle de Ventas
             </h3>
             {todaysSales.length === 0 ? (
               <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No hay ventas registradas en este turno.</p>
             ) : (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 {todaysSales.map((sale, i) => (
                   <div key={sale.id} style={{ padding: '12px', border: '1px solid var(--border-light)', borderRadius: '8px', background: 'var(--bg-app)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Ticket #{i + 1} ({sale.paymentMethod || 'Efectivo'})</span>
                        <span style={{ fontWeight: 800, color: 'var(--accent-success)' }}>{currency}{sale.total.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {sale.items?.map((item: any) => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <span>{item.quantity}x {item.name}</span>
                            <span>{currency}{((item.price * item.quantity) * (1 - (item.discount || 0)/100)).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </div>

        </div>

        {/* Panel Derecho: Ingreso de Datos */}
        <div className="card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
              <Wallet size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Arqueo de Caja Física</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Declara el efectivo para cuadrar</p>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Fondo de Caja (Base Inicial)
            </label>
            <div style={{ position: 'relative' }}>
              <DollarSign size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="number" 
                value={baseCash}
                onChange={(e) => setBaseCash(e.target.value)}
                placeholder="50.00"
                style={{ width: '100%', padding: '14px 14px 14px 44px', fontSize: '1.1rem', fontWeight: 700, background: 'var(--bg-app)', border: '2px solid var(--border-light)', borderRadius: '12px', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>Dinero que dejaste para cambio al abrir la caja.</p>
          </div>
          
          <div style={{ borderTop: '1px dashed var(--border-medium)', margin: '24px 0' }}></div>

          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Efectivo Esperado (Ventas + Base):</span>
             <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{currency}{expectedCashInDrawer.toFixed(2)}</span>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Efectivo Físico Contado ({currency})
            </label>
            <div style={{ position: 'relative' }}>
              <DollarSign size={24} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="number" 
                value={countedCash}
                onChange={(e) => setCountedCash(e.target.value)}
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '20px 20px 20px 48px',
                  fontSize: '2rem',
                  fontWeight: 800,
                  background: 'var(--bg-app)',
                  border: '2px solid var(--border-medium)',
                  borderRadius: '16px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
              />
            </div>
          </div>

          {countedCash !== '' && !isNaN(Number(countedCash)) && (
            <div style={{ 
              padding: '16px', 
              borderRadius: '12px', 
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: hasDifference ? (difference > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)') : 'rgba(16, 185, 129, 0.1)',
              border: `1px solid ${hasDifference ? (difference > 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)') : 'rgba(16, 185, 129, 0.3)'}`
            }}>
              {hasDifference ? (
                <AlertTriangle size={24} color={difference > 0 ? '#10B981' : '#EF4444'} />
              ) : (
                <CheckCircle size={24} color="#10B981" />
              )}
              
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: hasDifference ? (difference > 0 ? '#10B981' : '#EF4444') : '#10B981' }}>
                  {hasDifference ? (difference > 0 ? 'Sobrante en caja' : 'Faltante en caja') : 'Caja Cuadrada Perfectamente'}
                </p>
                <p style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {currency}{Math.abs(difference).toFixed(2)}
                </p>
              </div>
            </div>
          )}

          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Notas / Observaciones (Opcional)
            </label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Faltan $2 por vuelto no entregado..."
              rows={3}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '0.95rem',
                background: 'var(--bg-app)',
                border: '1px solid var(--border-medium)',
                borderRadius: '12px',
                color: 'var(--text-primary)',
                outline: 'none',
                resize: 'none'
              }}
            />
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '18px', fontSize: '1.1rem', display: 'flex', justifyContent: 'center', gap: '12px' }}
            onClick={handleCloseRegister}
            disabled={submitting || loading || !countedCash}
          >
            {submitting ? 'Procesando...' : (
              <>
                <Save size={20} /> Ejecutar Cierre Z
              </>
            )}
          </button>

        </div>
      </div>
    </div>
  );
};

export default CashRegister;
