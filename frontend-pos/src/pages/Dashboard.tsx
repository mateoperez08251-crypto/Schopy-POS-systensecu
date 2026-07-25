import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart2, MoreHorizontal, ArrowUpRight, ArrowDownRight,
  DownloadCloud, UploadCloud, SlidersHorizontal, Info, CheckCircle2,
  X
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Cell
} from 'recharts';
import TopNav from '../components/TopNav';
import { useDashboardData } from '../hooks/useDashboardData';

const Dashboard = () => {
  const { data, loading } = useDashboardData();
  const navigate = useNavigate();
  
  // Estados para las interacciones
  const [timeFilter, setTimeFilter] = useState('1 A');
  const [toast, setToast] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(10); // Octubre es el 10
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleExport = () => {
    showToast("Generando reporte PDF...");
    setTimeout(() => showToast("Reporte descargado exitosamente: reporte_ventas_ia.pdf"), 1500);
  };

  if (loading) return <div style={{ padding: 40, opacity: 0.5 }}>Cargando datos del servidor...</div>;

  // Filtrar datos del gráfico según la selección
  let filteredRevenue = data.revenue;
  if (timeFilter === '6 M') filteredRevenue = data.revenue.slice(-6);
  if (timeFilter === '1 M') filteredRevenue = data.revenue.slice(-1);
  if (timeFilter === '1 S') filteredRevenue = data.revenue.slice(-1).map(d => ({ ...d, uv: d.uv / 4 })); // mock
  if (timeFilter === '1 D') filteredRevenue = data.revenue.slice(-1).map(d => ({ ...d, uv: d.uv / 30 })); // mock

  return (
    <main className="main-content" style={{ position: 'relative' }}>
      <TopNav title="Panel de Control" />

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
          <button className="btn btn-outline" onClick={() => showToast("Buscando archivos para importar...")}><DownloadCloud size={16} /> Importar</button>
          
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
            { title: 'Alertas IA (Robos)', value: data.metrics.alerts, trend: '-8%', isPositive: true },
            { title: 'Ingresos Totales', value: data.metrics.totalRevenue, trend: '+15%', isPositive: true }
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

          {/* Calendario de Tareas */}
          <div className="card animate-item" style={{ padding: '24px', animationDelay: '0.5s' }}>
            <div className="flex-between" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Agenda del Día</h3>
              <MoreHorizontal size={16} color="var(--text-muted)" style={{ cursor: 'pointer' }} onClick={() => showToast("Opciones de agenda")} />
            </div>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div className="flex-between" style={{ marginBottom: '16px', padding: '0 12px' }}>
                <span 
                  style={{ color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 'bold' }} 
                  onClick={() => setCalendarMonth(prev => (prev === 0 ? 11 : prev - 1))}
                >&lt;</span>
                <span style={{ fontWeight: 600 }}>{months[calendarMonth]} 2026</span>
                <span 
                  style={{ color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 'bold' }}
                  onClick={() => setCalendarMonth(prev => (prev === 11 ? 0 : prev + 1))}
                >&gt;</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
                <span>Do</span><span>Lu</span><span>Ma</span><span>Mi</span><span>Ju</span><span>Vi</span><span>Sá</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', fontSize: '0.9rem', fontWeight: 500 }}>
                <span>5</span><span>6</span><span>7</span><span style={{ background: 'var(--accent-primary)', color: 'white', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', boxShadow: '0 4px 10px rgba(99,102,241,0.4)' }}>8</span><span>9</span><span>10</span><span>11</span>
              </div>
            </div>
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { title: 'Revisión de Inventario', time: '9.00 am - 10.00 am', platform: 'Almacén Principal' },
                { title: 'Auditoría de Cajas IA', time: '10.45 am - 11.45 am', platform: 'Panel de Control' }
              ].map((event, i) => (
                <div key={i} style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px', cursor: 'pointer' }} onClick={() => showToast(`Abriendo tarea: ${event.title}`)}>
                  <div className="flex-between" style={{ marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{event.title}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{event.time}</span>
                  </div>
                  <div className="flex-between">
                    <div style={{ display: 'flex' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#ccc', border: '2px solid white' }}></div>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#bbb', border: '2px solid white', marginLeft: '-8px' }}></div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{event.platform}</span>
                  </div>
                </div>
              ))}
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
    </main>
  );
};

export default Dashboard;
