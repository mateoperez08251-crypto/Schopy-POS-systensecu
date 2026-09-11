import React, { useState, useEffect } from 'react';
import { Calculator, Wallet, DollarSign, Save, AlertTriangle, CheckCircle, Printer, Download, ArrowLeft, Receipt, Package, TrendingUp, CreditCard } from 'lucide-react';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { getLocalStoreSettings } from '../services/localDb';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CashRegisterProps {
  salesHistory?: any[];
  setSalesHistory?: (val: any[]) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const CashRegister: React.FC<CashRegisterProps> = ({ salesHistory = [], showToast }) => {
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
  const [showWarningModal, setShowWarningModal] = useState(false);

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
      setShowWarningModal(true);
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
    
    // Usar un iframe oculto para evitar el bloqueo de ventanas emergentes (popups)
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    const printDocument = iframe.contentWindow?.document;
    if (!printDocument) {
      document.body.removeChild(iframe);
      if (showToast) showToast('Error al inicializar la impresión', 'error');
      return;
    }

    const settings = getLocalStoreSettings();
    printDocument.write(`
      <html>
        <head>
          <title>Corte de Caja</title>
          <style>
            @page { margin: 0; }
            body { font-family: 'Courier New', Courier, monospace; font-size: 12px; margin: 0; padding: 10px; width: 80mm; color: #000; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-bottom: 1px dashed #000; margin: 10px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .logo { width: 40px; height: 40px; margin: 0 auto 5px auto; display: block; }
          </style>
        </head>
        <body>
          <img src="data:image/png;base64,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" class="logo" alt="Logo" />
          <div class="center bold" style="font-size:16px;">${settings.companyName || 'SCHOPY POS'}</div>
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
        </body>
      </html>
    `);
    printDocument.close();
    
    // Llamar al print dialog usando el window del iframe
    const win = iframe.contentWindow;
    if (win) {
      win.focus();
      win.print();
    }
    
    // Limpiar el iframe después de un tiempo razonable para que el diálogo de impresión haya terminado
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 5000);
  };

  const handleDownloadDetailedReport = async () => {
    if (!closedRegisterData) return;

    try {
      const doc = new jsPDF();
      const settings = getLocalStoreSettings();
      
      const img = new Image();
      img.src = '/app-icon.png';
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });

      // Cabecera moderna
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, doc.internal.pageSize.width, 28, 'F');
      
      try {
        doc.addImage(img, 'PNG', 14, 5, 18, 18);
      } catch (e) {
        console.warn('Error loading logo for PDF:', e);
      }

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(settings.companyName || 'SCHOPY POS', 36, 17);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(14);
      doc.text('Reporte de Cierre de Caja (Z)', 14, 42);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Empresa: ${settings.companyName || 'SCHOPY POS'}`, 14, 50);
      doc.text(`Fecha: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 56);
      doc.text(`Cajero: ${closedRegisterData.cashierName}`, 14, 62);
      doc.text(`Corte Z ID: ${closedRegisterData.displayId || closedRegisterData.id}`, 14, 68);

      const base = Number(closedRegisterData.baseCash) || 0;
      const expected = Number(closedRegisterData.expectedAmount) || 0;
      const reported = Number(closedRegisterData.reportedAmount) || 0;
      const diff = Number(closedRegisterData.difference) || 0;
      const estProfit = Number(closedRegisterData.estimatedProfit) || 0;
      
      const methods = closedRegisterData.methods || { Efectivo: 0, Tarjeta: 0, Transferencia: 0 };
      const totals = closedRegisterData.totalsSummary || { grossTotal: 0, discounts: 0, taxes: 0, netTotal: 0 };

      autoTable(doc, {
        startY: 75,
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

      // Descargar directamente en lugar de abrir ventana
      doc.save(`Corte_Z_${closedRegisterData.displayId || closedRegisterData.id}.pdf`);
      if (showToast) showToast('Reporte PDF descargado con éxito.', 'success');
      
    } catch (error) {
      console.error("Error generando PDF:", error);
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
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
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
            disabled={submitting || loading}
          >
            {submitting ? 'Procesando...' : (
              <>
                <Save size={20} /> Ejecutar Cierre Z
              </>
            )}
          </button>

        </div>
      </div>
      
      {/* Modal de Advertencia Personalizada */}
      {showWarningModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ maxWidth: '400px', width: '90%', padding: '32px', textAlign: 'center', position: 'relative', animation: 'popIn 0.3s ease-out' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 16px' }}>
              <AlertTriangle size={32} color="#EF4444" />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>Datos Incompletos</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '24px', lineHeight: 1.5 }}>
              Para procesar el cierre Z es obligatorio declarar el <strong>Efectivo Físico Contado</strong> en caja.
            </p>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 700 }}
              onClick={() => setShowWarningModal(false)}
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default CashRegister;
