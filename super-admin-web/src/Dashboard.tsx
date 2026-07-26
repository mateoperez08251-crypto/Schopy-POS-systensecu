import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Building2, LogOut, LayoutDashboard, Store, PlusCircle, Server, CheckCircle, AlertTriangle, Play } from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';
import { getCompanies, updateCompanyStatus, renewSubscription } from './companyService';
import type { Company } from './companyService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'stores' | 'new' | 'infra'>('overview');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Estados del formulario "Nueva Tienda"
  const [email, setEmail] = useState('');
  const [uid, setUid] = useState('');
  const [storeName, setStoreName] = useState('');
  const [trialDays, setTrialDays] = useState('14');
  const [monthlyFee, setMonthlyFee] = useState('29.99');
  
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    setLoadingData(true);
    try {
      const data = await getCompanies();
      setCompanies(data);
    } catch (err) {
      console.error("Error loading companies:", err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    setSuccess('');

    try {
      const companyId = uid.trim();
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(trialDays));
      
      const newAdminData = {
        companyId: companyId,
        companyName: storeName.trim(),
        role: 'admin',
        name: 'Administrador Principal',
        email: email.trim(),
        createdAt: startDate.toISOString(),
        plan: 'mensual',
        monthlyFee: parseFloat(monthlyFee),
        status: 'prueba',
        subscriptionStart: startDate.toISOString(),
        subscriptionEnd: endDate.toISOString(),
      };

      await setDoc(doc(db, 'users', companyId), newAdminData);

      setSuccess(`¡Empresa "${storeName}" creada con ${trialDays} días de prueba!`);
      setEmail('');
      setUid('');
      setStoreName('');
      setTrialDays('14');
      setMonthlyFee('29.99');
      loadCompanies();
    } catch (err: any) {
      console.error(err);
      setError(`Error de permisos: Asegúrate de que las Reglas de Firebase tengan la Regla Maestra.`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleRenew = async (company: Company) => {
    if (window.confirm(`¿Renovar suscripción de ${company.companyName} por 30 días?`)) {
      await renewSubscription(company.id, 30);
      loadCompanies();
    }
  };

  const handleSuspend = async (company: Company) => {
    const newStatus = company.status === 'suspendida' ? 'activa' : 'suspendida';
    if (window.confirm(`¿Seguro que deseas marcar como ${newStatus} a ${company.companyName}?`)) {
      await updateCompanyStatus(company.id, newStatus);
      loadCompanies();
    }
  };

  const getDaysRemaining = (endDateStr: string) => {
    const end = new Date(endDateStr);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return days;
  };

  const totalRevenue = companies.filter(c => c.status !== 'suspendida').reduce((acc, curr) => acc + curr.monthlyFee, 0);
  const activeStores = companies.filter(c => c.status !== 'suspendida').length;
  const expiringStores = companies.filter(c => getDaysRemaining(c.subscriptionEnd) <= 5 && getDaysRemaining(c.subscriptionEnd) >= 0);

  // Data for Charts
  const chartData = [
    { name: 'Activas', value: activeStores, color: '#10b981' },
    { name: 'Suspendidas', value: companies.length - activeStores, color: '#ef4444' },
    { name: 'Por Vencer', value: expiringStores.length, color: '#f59e0b' }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#000000', color: '#f8fafc' }}>
      
      {/* Sidebar */}
      <div className="neu-flat" style={{ width: '260px', margin: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '30px 24px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #111' }}>
          <div className="neu-pressed" style={{ padding: '12px', display: 'flex', borderRadius: '12px' }}>
            <Building2 color="#3b82f6" size={28} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#fff' }}>Schopy SaaS</h2>
            <span style={{ fontSize: '12px', color: '#8a94a5', fontWeight: 600 }}>Super Admin</span>
          </div>
        </div>
        
        <nav style={{ padding: '0 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <SidebarButton active={activeTab === 'overview'} icon={<LayoutDashboard size={20}/>} label="Dashboard" onClick={() => setActiveTab('overview')} />
          <SidebarButton active={activeTab === 'stores'} icon={<Store size={20}/>} label="Tiendas" onClick={() => setActiveTab('stores')} />
          <SidebarButton active={activeTab === 'new'} icon={<PlusCircle size={20}/>} label="Nueva Tienda" onClick={() => setActiveTab('new')} />
          <SidebarButton active={activeTab === 'infra'} icon={<Server size={20}/>} label="Servidores" onClick={() => setActiveTab('infra')} />
        </nav>

        <div style={{ padding: '24px 16px' }}>
          <button onClick={handleLogout} className="neu-button" style={{ width: '100%', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#ef4444', fontWeight: 600 }}>
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '20px 40px 40px 20px', overflowY: 'auto' }}>
        
        {activeTab === 'overview' && (
          <div className="animate-fade-in">
            <h1 style={{ fontSize: '28px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 800 }}>
              <LayoutDashboard size={28} color="#3b82f6" /> Resumen General
            </h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px', marginBottom: '40px' }}>
              <StatCard title="Ganancias Mensuales" value={`$${totalRevenue.toFixed(2)}`} icon={<Play color="#10b981" />} />
              <StatCard title="Tiendas Activas" value={activeStores.toString()} icon={<Store color="#3b82f6" />} />
              <StatCard title="Tiendas Suspendidas" value={(companies.length - activeStores).toString()} icon={<AlertTriangle color="#ef4444" />} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
              <div className="neu-flat animate-chart" style={{ padding: '30px' }}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', color: '#8a94a5', fontWeight: 600 }}>ESTADO DE SUSCRIPCIONES</h3>
                <div style={{ height: '300px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#34393f" vertical={false} />
                      <XAxis dataKey="name" stroke="#555" tick={{fill: '#8a94a5', fontSize: '12px'}} axisLine={false} tickLine={false} />
                      <YAxis stroke="#555" tick={{fill: '#8a94a5', fontSize: '12px'}} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #222', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', color: '#fff' }}
                        itemStyle={{ color: '#fff', fontWeight: 600 }}
                        cursor={{fill: '#111'}}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} animationDuration={2000} animationEasing="ease-out">
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="neu-flat" style={{ padding: '30px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ margin: '0 0 24px 0', fontSize: '18px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertTriangle size={20} /> Riesgo de Vencimiento
                </h3>
                <div className="neu-pressed" style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
                  {expiringStores.length === 0 ? (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a94a5', textAlign: 'center', fontSize: '14px' }}>
                      Excelente. No hay tiendas próximas a vencer.
                    </div>
                  ) : (
                    expiringStores.map(company => (
                      <div key={company.id} style={{ padding: '16px', marginBottom: '12px', background: '#0a0a0a', border: '1px solid #1f1f1f', borderRadius: '12px', transition: 'all 0.2s' }}>
                        <div style={{ fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{company.companyName}</div>
                        <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 600 }}>Quedan {getDaysRemaining(company.subscriptionEnd)} días</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stores' && (
          <div className="animate-fade-in">
            <h1 style={{ fontSize: '28px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 800 }}>
              <Store size={28} color="#3b82f6" /> Gestión de Tiendas
            </h1>
            
            <div className="neu-flat" style={{ padding: '20px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '16px 24px', color: '#8a94a5', fontWeight: 600, borderBottom: '2px solid #34393f' }}>Empresa</th>
                    <th style={{ padding: '16px 24px', color: '#8a94a5', fontWeight: 600, borderBottom: '2px solid #34393f' }}>Estado</th>
                    <th style={{ padding: '16px 24px', color: '#8a94a5', fontWeight: 600, borderBottom: '2px solid #34393f' }}>Días Restantes</th>
                    <th style={{ padding: '16px 24px', color: '#8a94a5', fontWeight: 600, borderBottom: '2px solid #34393f' }}>Tarifa</th>
                    <th style={{ padding: '16px 24px', color: '#8a94a5', fontWeight: 600, borderBottom: '2px solid #34393f' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingData ? <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center' }}>Cargando...</td></tr> : null}
                  {!loadingData && companies.map(company => {
                    const days = getDaysRemaining(company.subscriptionEnd);
                    const isSuspended = company.status === 'suspendida';
                    return (
                      <tr key={company.id} style={{ transition: 'all 0.2s', borderBottom: '1px solid #34393f' }}>
                        <td style={{ padding: '20px 24px' }}>
                          <div style={{ fontWeight: 600, color: '#fff', marginBottom: '4px' }}>{company.companyName}</div>
                          <div style={{ fontSize: '12px', color: '#8a94a5' }}>{company.email}</div>
                        </td>
                        <td style={{ padding: '20px 24px' }}>
                          <span style={{ 
                            padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px',
                            background: isSuspended ? '#ef444422' : (days < 0 ? '#f59e0b22' : '#10b98122'),
                            color: isSuspended ? '#ef4444' : (days < 0 ? '#f59e0b' : '#10b981'),
                            boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.2)'
                          }}>
                            {isSuspended ? 'SUSPENDIDA' : (days < 0 ? 'VENCIDA' : company.status.toUpperCase())}
                          </span>
                        </td>
                        <td style={{ padding: '20px 24px', fontWeight: 600, color: days < 0 ? '#ef4444' : (days <= 5 ? '#f59e0b' : '#fff') }}>
                          {days < 0 ? `Vencida hace ${Math.abs(days)} días` : `${days} días`}
                        </td>
                        <td style={{ padding: '20px 24px', color: '#10b981', fontWeight: 700, fontSize: '16px' }}>
                          ${company.monthlyFee}
                        </td>
                        <td style={{ padding: '20px 24px', display: 'flex', gap: '12px' }}>
                          <button onClick={() => handleRenew(company)} className="neu-button" style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: '#3b82f6' }}>Renovar 30D</button>
                          <button onClick={() => handleSuspend(company)} className="neu-button" style={{ padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: isSuspended ? '#10b981' : '#ef4444' }}>
                            {isSuspended ? 'Activar' : 'Suspender'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'new' && (
          <div className="animate-fade-in" style={{ maxWidth: '700px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '28px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 800 }}>
              <PlusCircle size={28} color="#3b82f6" /> Crear Nueva Tienda
            </h1>
            
            <div className="neu-flat" style={{ padding: '40px' }}>
              {error && <div style={{ background: '#ef444422', color: '#ef4444', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', fontWeight: 600 }}>{error}</div>}
              {success && <div style={{ background: '#10b98122', color: '#10b981', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={20} /> {success}</div>}

              <form onSubmit={handleCreateCompany}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '12px', color: '#8a94a5', fontSize: '14px', fontWeight: 600, letterSpacing: '0.5px' }}>CORREO DEL ADMIN (FIREBASE)</label>
                  <input type="email" className="neu-input" style={{ width: '100%' }} value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', marginBottom: '12px', color: '#8a94a5', fontSize: '14px', fontWeight: 600, letterSpacing: '0.5px' }}>UID DE FIREBASE AUTH</label>
                  <input type="text" className="neu-input" style={{ width: '100%', fontFamily: 'monospace' }} value={uid} onChange={e => setUid(e.target.value)} required />
                </div>

                <div style={{ marginBottom: '32px' }}>
                  <label style={{ display: 'block', marginBottom: '12px', color: '#8a94a5', fontSize: '14px', fontWeight: 600, letterSpacing: '0.5px' }}>NOMBRE COMERCIAL DE LA TIENDA</label>
                  <input type="text" className="neu-input" style={{ width: '100%' }} value={storeName} onChange={e => setStoreName(e.target.value)} required />
                </div>

                <div style={{ display: 'flex', gap: '30px', marginBottom: '40px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '12px', color: '#8a94a5', fontSize: '14px', fontWeight: 600, letterSpacing: '0.5px' }}>DÍAS DE PRUEBA</label>
                    <input type="number" className="neu-input" style={{ width: '100%', fontSize: '18px', fontWeight: 700 }} value={trialDays} onChange={e => setTrialDays(e.target.value)} required />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '12px', color: '#8a94a5', fontSize: '14px', fontWeight: 600, letterSpacing: '0.5px' }}>TARIFA MENSUAL ($)</label>
                    <input type="number" step="0.01" className="neu-input" style={{ width: '100%', fontSize: '18px', fontWeight: 700, color: '#10b981' }} value={monthlyFee} onChange={e => setMonthlyFee(e.target.value)} required />
                  </div>
                </div>

                <button type="submit" disabled={formLoading} className="neu-button" style={{ width: '100%', padding: '18px', fontSize: '16px', fontWeight: 700, opacity: formLoading ? 0.7 : 1, color: '#3b82f6' }}>
                  {formLoading ? 'Procesando...' : 'CREAR SISTEMA PARA CLIENTE'}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'infra' && (
          <div className="animate-fade-in">
            <h1 style={{ fontSize: '28px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 800 }}>
              <Server size={28} color="#3b82f6" /> Infraestructura & Servidores
            </h1>
            <div className="neu-pressed" style={{ padding: '24px', borderRadius: '16px', marginBottom: '40px', color: '#8a94a5', lineHeight: '1.6', fontSize: '15px' }}>
              <strong>Nota de Seguridad:</strong> Por arquitectura Cloud, Google bloquea la exportación de telemetría de facturación hacia aplicaciones cliente para prevenir ataques DDoS o fugas de datos de facturación.
              Utiliza el portal seguro de GCP/Firebase para monitorizar el rendimiento en vivo haciendo clic en los botones de abajo.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
              <InfraCard title="Base de Datos (Firestore)" desc="Consumo de lecturas/escrituras. Vigila si tus clientes están facturando en exceso." link="https://console.firebase.google.com/project/schopy-pos-technology/firestore/usage" />
              <InfraCard title="Hosting & Dominios" desc="Ancho de banda descargado y gestión de dominios personalizados." link="https://console.firebase.google.com/project/schopy-pos-technology/hosting/sites" />
              <InfraCard title="Gestor de Usuarios (Auth)" desc="Auditoría de correos registrados en el ecosistema global." link="https://console.firebase.google.com/project/schopy-pos-technology/authentication/users" />
              <InfraCard title="Facturación Cloud" desc="Resumen de gastos generados por el consumo total de infraestructura." link="https://console.firebase.google.com/project/schopy-pos-technology/usage" />
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

const SidebarButton = ({ active, icon, label, onClick }: any) => (
  <button 
    onClick={onClick}
    className={active ? 'neu-pressed' : 'neu-button'}
    style={{
      display: 'flex', alignItems: 'center', gap: '14px', width: '100%', padding: '16px 20px',
      color: active ? '#3b82f6' : '#8a94a5',
      fontSize: '15px', fontWeight: 600,
      textAlign: 'left',
      boxShadow: active ? undefined : 'none', // Remove outer shadow for inactive items to keep sidebar clean, or keep it. Let's keep it clean
      background: 'transparent'
    }}
  >
    {icon} {label}
  </button>
);

const StatCard = ({ title, value, icon }: any) => (
  <div className="neu-flat" style={{ padding: '30px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
    <div>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#8a94a5', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>{title}</h3>
      <div style={{ fontSize: '36px', fontWeight: 800, color: '#fff' }}>{value}</div>
    </div>
    <div className="neu-pressed" style={{ padding: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </div>
  </div>
);

const InfraCard = ({ title, desc, link }: any) => (
  <div className="neu-flat" style={{ padding: '32px', display: 'flex', flexDirection: 'column' }}>
    <h3 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <Server size={22} color="#3b82f6"/> {title}
    </h3>
    <p style={{ color: '#8a94a5', fontSize: '14px', lineHeight: '1.6', margin: '0 0 32px 0', flex: 1 }}>{desc}</p>
    <a href={link} target="_blank" rel="noreferrer" className="neu-button" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '16px', textDecoration: 'none', fontSize: '14px', fontWeight: 700, color: '#E0E5EC' }}>
      Monitorear en Firebase <Play size={14} fill="#E0E5EC" />
    </a>
  </div>
);

export default Dashboard;
