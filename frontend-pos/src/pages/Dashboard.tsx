import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart2, MoreHorizontal, ArrowUpRight, ArrowDownRight,
  SlidersHorizontal, Info, CheckCircle2,
  X
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Cell
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useDashboardData } from '../hooks/useDashboardData';

const Dashboard = () => {
  const { data, loading } = useDashboardData();
  const navigate = useNavigate();
  
  // Estados para las interacciones
  const [timeFilter, setTimeFilter] = useState('1 A');
  const [toast, setToast] = useState<string | null>(null);


  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleExport = () => {
    showToast("Generando reporte PDF profesional...");

    const now = new Date();
    const fecha = now.toLocaleDateString('es-DO');
    const hora = now.toLocaleTimeString('es-DO');

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // --- FUNCIÓN DE CABECERA Y PIE DE PÁGINA GLOBAL ---
    const addHeaderFooter = (data: any) => {
      // Cabecera en todas las páginas
      doc.setFillColor(30, 41, 59); // Slate-800
      doc.rect(0, 0, pageWidth, 25, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SCHOPY POS SYSTEM', 14, 16);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('REPORTE EJECUTIVO DE OPERACIONES', pageWidth - 14, 16, { align: 'right' });

      // Pie de página en todas las páginas
      doc.setFillColor(248, 250, 252); // Slate-50
      doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
      doc.setTextColor(100, 116, 139); // Slate-500
      doc.setFontSize(9);
      doc.text(`Generado el: ${fecha} a las ${hora}`, 14, pageHeight - 6);
      doc.text(`Página ${data.pageNumber} de ${data.pageCount || 1}`, pageWidth - 14, pageHeight - 6, { align: 'right' });
    };

    // --- METADATA INICIAL ---
    let startY = 40;
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    
    let tipoReporte = 'Mensual';
    if (timeFilter === '1 D') tipoReporte = 'Diario';
    if (timeFilter === '1 M') tipoReporte = 'Mensual';
    if (timeFilter === '1 A') tipoReporte = 'Anual';
    if (timeFilter === '6 M') tipoReporte = 'Semestral';
    if (timeFilter === 'TODO') tipoReporte = 'Histórico Completo';

    doc.text(`Resumen Ejecutivo ${tipoReporte}`, 14, startY);
    
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.text(`El siguiente documento detalla las métricas financieras, operativas y de seguridad correspondientes al período ${tipoReporte.toLowerCase()}.`, 14, startY + 6);
    
    startY += 20;

    // ==========================================
    // SECCIÓN 1: MÉTRICAS GENERALES
    // ==========================================
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('1. MÉTRICAS CLAVE', 14, startY);
    
    autoTable(doc, {
      startY: startY + 4,
      head: [['Indicador', 'Valor Actual', 'Descripción']],
      body: [
        ['Facturas Emitidas', data.metrics.invoices, 'Volumen de transacciones procesadas'],
        ['Ticket Promedio', data.metrics.avgTicket, 'Gasto medio por cliente en el período'],
        ['Ingresos Totales', data.metrics.totalRevenue, 'Recaudación bruta general'],
        ['Ganancia Neta', data.metrics.netProfit, 'Beneficio después de costos operativos']
      ],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 5 },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      didDrawPage: addHeaderFooter
    });

    // @ts-ignore
    startY = doc.lastAutoTable.finalY + 15;

    // ==========================================
    // SECCIÓN 2: DESGLOSE FINANCIERO (GANANCIAS Y COSTOS)
    // ==========================================
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(`2. ESTADO FINANCIERO ${tipoReporte.toUpperCase()}`, 14, startY);
    
    let totalIngresos = 0;
    let totalCostos = 0;
    let totalGanancias = 0;

    // Filtrar los datos en base al timeFilter (Simulación)
    let financialData = data.financials;
    if (timeFilter === '1 D' || timeFilter === '1 S') financialData = [data.financials[data.financials.length - 1]];
    if (timeFilter === '1 M') financialData = [data.financials[data.financials.length - 1]];
    if (timeFilter === '6 M') financialData = data.financials.slice(-6);

    const bodyFinancials = financialData.map(f => {
      const margen = f.ingresos > 0 ? ((f.ganancia / f.ingresos) * 100).toFixed(1) : '0';
      totalIngresos += f.ingresos;
      totalCostos += f.costos;
      totalGanancias += f.ganancia;
      return [f.name, `$${f.ingresos.toLocaleString()}`, `$${f.costos.toLocaleString()}`, `$${f.ganancia.toLocaleString()}`, `${margen}%`];
    });

    const margenTotal = totalIngresos > 0 ? ((totalGanancias / totalIngresos) * 100).toFixed(1) : '0';
    bodyFinancials.push(['TOTAL ACUMULADO', `$${totalIngresos.toLocaleString()}`, `$${totalCostos.toLocaleString()}`, `$${totalGanancias.toLocaleString()}`, `${margenTotal}%`]);

    autoTable(doc, {
      startY: startY + 4,
      head: [['Período', 'Ingresos Brutos', 'Costos Operativos', 'Ganancia Neta', 'Margen']],
      body: bodyFinancials,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129], textColor: 255 },
      styles: { fontSize: 9, cellPadding: 4, halign: 'center' },
      columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
      didParseCell: (hookData) => {
        if (hookData.row.index === bodyFinancials.length - 1) {
          hookData.cell.styles.fontStyle = 'bold';
          hookData.cell.styles.fillColor = [226, 232, 240];
          hookData.cell.styles.textColor = [15, 23, 42];
        }
      },
      didDrawPage: addHeaderFooter
    });

    // @ts-ignore
    startY = doc.lastAutoTable.finalY + 15;
    
    if (startY > 230) { doc.addPage(); startY = 40; }

    // ==========================================
    // SECCIÓN 3: RENDIMIENTO DE PRODUCTOS
    // ==========================================
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('3. TOP 5 PRODUCTOS MÁS VENDIDOS', 14, startY);
    
    const bodyProducts = data.topProducts.map((p, index) => {
      const avgPrice = p.sold > 0 ? (p.revenue / p.sold).toFixed(2) : '0';
      return [`#${index + 1}`, p.name, p.sold.toString(), `$${p.revenue.toLocaleString()}`, `$${avgPrice}`];
    });

    autoTable(doc, {
      startY: startY + 4,
      head: [['Rank', 'Producto', 'Unidades', 'Revenue Generado', 'Precio Promedio']],
      body: bodyProducts,
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11] },
      styles: { fontSize: 9, cellPadding: 4 },
      didDrawPage: addHeaderFooter
    });

    // @ts-ignore
    startY = doc.lastAutoTable.finalY + 15;

    if (startY > 230) { doc.addPage(); startY = 40; }

    // ==========================================
    // SECCIÓN 4: AUDITORÍA Y SEGURIDAD IA
    // ==========================================
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('4. AUDITORÍA DE SEGURIDAD IA', 14, startY);
    
    const bodyRetention = data.retention.map(r => {
      const total = r.falsosPositivos + r.verificados + r.pendientes;
      return [r.name, r.verificados.toString(), r.pendientes.toString(), r.falsosPositivos.toString(), total.toString()];
    });

    autoTable(doc, {
      startY: startY + 4,
      head: [['Período', 'Fraudes Evitados', 'En Revisión', 'Falsas Alarmas', 'Total Detectado']],
      body: bodyRetention,
      theme: 'striped',
      headStyles: { fillColor: [225, 29, 72] }, // Rose-600
      styles: { fontSize: 9, halign: 'center', cellPadding: 4 },
      columnStyles: { 0: { halign: 'left', fontStyle: 'bold' } },
      didDrawPage: addHeaderFooter
    });

    // --- MENSAJE FINAL ---
    // @ts-ignore
    startY = doc.lastAutoTable.finalY + 20;
    if (startY > 260) { doc.addPage(); startY = 40; }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('*** Fin del Reporte ***', pageWidth / 2, startY, { align: 'center' });
    doc.text('Este documento fue generado automáticamente por el sistema de inteligencia artificial de Schopy POS.', pageWidth / 2, startY + 6, { align: 'center' });

    // Guardar
    doc.save(`Reporte_Ejecutivo_Schopy_${now.toISOString().split('T')[0]}.pdf`);
    setTimeout(() => showToast("Reporte PDF profesional descargado"), 500);
  };

  if (loading) {
    return (
      <main className="main-content" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', height: '80vh', gap: '40px' }}>
        <div className="loader">
          <svg viewBox="0 0 80 80">
            <circle r="32" cy="40" cx="40" id="test"></circle>
          </svg>
        </div>
        <div className="loader triangle">
          <svg viewBox="0 0 86 80">
            <polygon points="43 8 79 72 7 72"></polygon>
          </svg>
        </div>
        <div className="loader">
          <svg viewBox="0 0 80 80">
            <rect height="64" width="64" y="8" x="8"></rect>
          </svg>
        </div>
      </main>
    );
  }

  // Filtrar datos del gráfico según la selección
  let filteredRevenue = data.revenue;
  if (timeFilter === '6 M') filteredRevenue = data.revenue.slice(-6);
  if (timeFilter === '1 M') filteredRevenue = data.revenue.slice(-1);
  if (timeFilter === '1 S') filteredRevenue = data.revenue.slice(-1).map(d => ({ ...d, uv: d.uv / 4 })); // mock
  if (timeFilter === '1 D') filteredRevenue = data.revenue.slice(-1).map(d => ({ ...d, uv: d.uv / 30 })); // mock

  return (
    <div style={{ position: 'relative' }}>

      {/* Toast Notification */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 30, right: 30, background: 'var(--text-primary)', color: 'white', padding: '12px 24px', borderRadius: '8px', zIndex: 1000, display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', animation: 'popIn 0.3s ease-out' }}>
          <CheckCircle2 size={18} color="var(--accent-success)" />
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{toast}</span>
          <X size={16} style={{ cursor: 'pointer', opacity: 0.7 }} onClick={() => setToast(null)} />
        </div>
      )}

      {/* Barra de Acciones */}
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-success)', fontSize: '0.85rem', fontWeight: 500 }}>
          <CheckCircle2 size={16} /> Base de datos actualizada ahora
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn btn-outline" onClick={() => showToast("Abriendo configuración de widgets...")}><SlidersHorizontal size={16} /> Personalizar Widgets</button>

          
          {/* Animated Download Button */}
          <div className="container-dl">
            <label className="label">
              <input type="checkbox" className="input" onChange={(e) => {
                if (e.target.checked) {
                  handleExport();
                  setTimeout(() => {
                    if(e.target) e.target.checked = false;
                  }, 2500); // Se reinicia el botón después de exportar
                }
              }} />
              <span className="circle">
                <svg className="icon" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 19V5m0 14-4-4m4 4 4-4"></path>
                </svg>
                <div className="square"></div>
              </span>
              <p className="title">Exportar</p>
              <p className="title">Abrir</p>
            </label>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Fila de Métricas */}
        <div className="metrics-row">
          {[
            { title: 'Facturas Emitidas', value: data.metrics.invoices, trend: '+12%', isPositive: true },
            { title: 'Ticket Promedio', value: data.metrics.avgTicket, trend: '-2%', isPositive: false },
            { title: 'Ingresos Totales', value: data.metrics.totalRevenue, trend: '+15%', isPositive: true },
            { title: 'Ganancias Netas', value: data.metrics.netProfit, trend: '+18%', isPositive: true }
          ].map((metric, i) => (
            <div key={i} className="card animate-item" style={{ padding: '20px', animationDelay: `${i * 0.1}s` }}>
              <div className="flex-between" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ padding: '6px', background: 'var(--bg-app)', borderRadius: '50%' }}><BarChart2 size={16} color="var(--accent-primary)" /></div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{metric.title}</span>
                </div>
                <Info size={16} color="var(--text-muted)" style={{ cursor: 'pointer' }} onClick={() => showToast(`Mostrando detalles de ${metric.title}`)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 700 }}>{metric.value}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: metric.isPositive ? 'var(--accent-success)' : 'var(--accent-danger)', fontWeight: 600 }}>
                  {metric.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {metric.trend}
                </div>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>vs semana pasada</p>
            </div>
          ))}
        </div>

        {/* Fila Central */}
        <div className="middle-row">
          {/* Gráfico de Ingresos */}
          <div className="card animate-item" style={{ padding: '24px', animationDelay: '0.4s' }}>
            <div className="flex-between" style={{ marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>Ingresos</h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginTop: '8px' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>$32,209</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--accent-success)', fontWeight: 600 }}>+22% vs mes pasado</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                {['1 D', '1 S', '1 M', '6 M', '1 A', 'TODO'].map(tf => (
                  <span 
                    key={tf} 
                    style={{ cursor: 'pointer', color: timeFilter === tf ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: timeFilter === tf ? 700 : 500 }}
                    onClick={() => setTimeFilter(tf)}
                  >
                    {tf}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ height: '240px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredRevenue}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} tickFormatter={(value) => `${Math.round(value/1000)}k`} />
                  <RechartsTooltip cursor={{ fill: 'var(--bg-app)' }} />
                  <Bar dataKey="uv" radius={[6, 6, 0, 0]}>
                    {filteredRevenue.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === filteredRevenue.length - 3 ? 'url(#colorUv)' : '#E0E7FF'} />
                    ))}
                  </Bar>
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Comparativo Financiero */}
          <div className="card animate-item" style={{ padding: '24px', animationDelay: '0.5s' }}>
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>Comparativo Financiero</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Últimos 7 meses</span>
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', fontWeight: 500 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#6366F1' }}></div>
                  <span style={{ color: 'var(--text-secondary)' }}>Ingresos</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#E0E7FF' }}></div>
                  <span style={{ color: 'var(--text-secondary)' }}>Costos</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#10B981' }}></div>
                  <span style={{ color: 'var(--text-secondary)' }}>Ganancia</span>
                </div>
              </div>
            </div>
            <div style={{ height: '200px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.financials} barGap={2} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 500 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={(v) => `${Math.round(v/1000)}k`} />
                  <RechartsTooltip 
                    cursor={{ fill: 'var(--bg-app)' }} 
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '8px', fontSize: '0.85rem' }}
                  />
                  <Bar dataKey="ingresos" fill="#6366F1" radius={[4, 4, 0, 0]} name="Ingresos" />
                  <Bar dataKey="costos" fill="#E0E7FF" radius={[4, 4, 0, 0]} name="Costos" />
                  <Bar dataKey="ganancia" fill="#10B981" radius={[4, 4, 0, 0]} name="Ganancia" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Productos del Mes */}
            <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-secondary)' }}>Top 5 Productos del Mes</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.topProducts.map((product, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', width: '18px' }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</div>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>{product.sold} uds</span>
                    <span style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 700, whiteSpace: 'nowrap' }}>${product.revenue.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Fila Inferior */}
        <div className="bottom-row">
          {/* Gestión de Alertas IA */}
          <div className="card animate-item" style={{ padding: '24px', animationDelay: '0.6s' }}>
            <div className="flex-between" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Gestión de Alertas IA</h3>
              <MoreHorizontal size={16} color="var(--text-muted)" style={{ cursor: 'pointer' }} onClick={() => showToast("Opciones de alertas")} />
            </div>
            <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '24px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Estado</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Tipo</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>Severidad</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                { label: 'Justificadas', width: '80%', color: 'var(--accent-primary)' },
                { label: 'Pendientes', width: '60%', color: 'var(--accent-warning, #F59E0B)' },
                { label: 'Falsas Alarmas', width: '20%', color: 'var(--text-muted)' },
                { label: 'Sancionadas', width: '40%', color: 'var(--accent-danger)' }
              ].map(item => (
                <div key={item.label} style={{ display: 'grid', gridTemplateColumns: '95px 1fr', alignItems: 'center', gap: '16px', cursor: 'pointer' }} onClick={() => showToast(`Mostrando lista de Alertas: ${item.label}`)}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{item.label}</span>
                  <div style={{ height: '12px', background: 'var(--bg-app)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div className="animate-pop" style={{ height: '100%', width: item.width, background: item.color, borderRadius: '6px' }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Zonas Críticas */}
          <div className="card animate-item" style={{ padding: '24px', animationDelay: '0.7s', display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: '100%', height: '160px', background: 'var(--bg-app)', borderRadius: '12px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border-medium)', cursor: 'pointer' }} onClick={() => showToast("Abriendo cámara en vivo...")}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>Plano del Local</span>
                <div className="animate-pop" style={{ position: 'absolute', top: '40%', left: '30%', width: '14px', height: '14px', background: 'var(--accent-danger)', borderRadius: '50%', boxShadow: '0 0 0 4px rgba(239, 68, 68, 0.2)' }}></div>
                <div className="animate-pop" style={{ position: 'absolute', top: '70%', left: '60%', width: '10px', height: '10px', background: 'var(--accent-success)', borderRadius: '50%' }}></div>
              </div>
            </div>
            <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column' }}>
              <div className="flex-between" style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Zonas Auditadas</h3>
                <MoreHorizontal size={16} color="var(--text-muted)" style={{ cursor: 'pointer' }} onClick={() => showToast("Opciones de zonas")} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                {[
                  { rank: 1, name: 'Caja Principal', val: '48%' },
                  { rank: 2, name: 'Pasillo 3', val: '33%' },
                  { rank: 3, name: 'Puerta Salida', val: '25%' },
                  { rank: 4, name: 'Almacén', val: '17%' }
                ].map(c => (
                  <div key={c.rank} className="flex-between" style={{ fontSize: '0.85rem', cursor: 'pointer' }} onClick={() => showToast(`Mostrando métricas de ${c.name}`)}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{c.rank}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{c.val}</span>
                  </div>
                ))}
              </div>
              <button className="btn btn-outline" style={{ width: '100%', marginTop: 'auto', padding: '8px', fontSize: '0.8rem' }} onClick={() => navigate('/audit')}>Ver todas las cámaras</button>
            </div>
          </div>

          {/* Efectividad del Modelo IA */}
          <div className="card animate-item" style={{ padding: '24px', animationDelay: '0.8s' }}>
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Precisión del Modelo IA</h3>
              <MoreHorizontal size={16} color="var(--text-muted)" style={{ cursor: 'pointer' }} onClick={() => showToast("Opciones de modelo IA")} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>95%</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}><span style={{ color: 'var(--accent-success)', fontWeight: 600 }}>+2.5%</span> vs mes pasado</span>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px', fontWeight: 500 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', background: '#E0E7FF', borderRadius: '50%' }}></div> Falsos +</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', background: '#A5B4FC', borderRadius: '50%' }}></div> Revisión</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '8px', height: '8px', background: '#6366F1', borderRadius: '50%' }}></div> Verificados</div>
            </div>
            <div style={{ height: '140px', width: '100%', cursor: 'crosshair' }} onClick={() => showToast("Analizando gráfico de retención...")}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.retention}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--text-muted)', fontWeight: 500 }} />
                  <RechartsTooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="verificados" stackId="a" fill="#6366F1" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="pendientes" stackId="a" fill="#A5B4FC" />
                  <Bar dataKey="falsosPositivos" stackId="a" fill="#E0E7FF" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
