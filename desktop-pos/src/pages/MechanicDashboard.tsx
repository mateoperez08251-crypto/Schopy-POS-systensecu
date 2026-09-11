import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToMechanics } from '../firebase/localMechanicsService';
import { subscribeToSales } from '../firebase/localSalesService';
import { Wrench, DollarSign, Trophy, TrendingUp, Search } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';

const MechanicDashboard = () => {
  const { userData, companyId } = useAuth();
  const currency = (userData as any)?.currency || '$';
  
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [selectedMechanicId, setSelectedMechanicId] = useState<string>('');

  const effectiveCompanyId = userData?.companyId || companyId || 'local';

  useEffect(() => {
    if (!effectiveCompanyId) return;
    const unsubMechanics = subscribeToMechanics(effectiveCompanyId, (data) => {
      setMechanics(data);
      if (data.length > 0 && !selectedMechanicId) {
        setSelectedMechanicId(data[0].id);
      }
    });
    
    const unsubSales = subscribeToSales(effectiveCompanyId, (data) => {
      setSales(data);
    });

    return () => {
      unsubMechanics();
      unsubSales();
    };
  }, [companyId]);

  const selectedMechanic = mechanics.find(m => m.id === selectedMechanicId);

  // Calculate stats for the selected mechanic
  const mechanicSales = sales.filter(s => s.mechanicId === selectedMechanicId);
  
  const totalVentas = mechanicSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const totalGanancias = totalVentas * ((selectedMechanic?.commissionRate || 0) / 100);
  const totalServicios = mechanicSales.length;

  // Gráfico real de últimos 7 días usando fechas reales
  const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const commRate = (selectedMechanic?.commissionRate || 0) / 100;
  const chartData = (() => {
    const days: Record<string, { ventas: number; ganancias: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days[key] = { ventas: 0, ganancias: 0 };
    }
    mechanicSales.forEach(sale => {
      const sd = sale.createdAt ? new Date(sale.createdAt) : (sale.date ? new Date(sale.date) : new Date());
      const key = sd.toISOString().slice(0, 10);
      if (days[key] !== undefined) {
        days[key].ventas += (sale.total || 0);
        days[key].ganancias += (sale.total || 0) * commRate;
      }
    });
    return Object.entries(days).map(([key, val]) => ({
      name: DAY_NAMES[new Date(key + 'T00:00:00').getDay()],
      ventas: Math.round(val.ventas),
      ganancias: Math.round(val.ganancias)
    }));
  })();

  return (
    <div style={{ padding: '24px', height: '100%', overflowY: 'auto' }}>
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Dashboard de Mecánicos</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Métricas y comisiones</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 600 }}>Seleccionar Mecánico:</label>
          <select 
            value={selectedMechanicId} 
            onChange={(e) => setSelectedMechanicId(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-medium)', background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none' }}
          >
            {mechanics.length === 0 && <option value="">No hay mecánicos registrados</option>}
            {mechanics.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedMechanic ? (
        <>
          <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '24px' }}>
            <div className="card animate-pop" style={{ padding: '24px', borderLeft: '4px solid var(--accent-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: 'var(--accent-primary)' }}>
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 600 }}>Total de Ventas</p>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>{currency}{totalVentas.toFixed(2)}</h3>
                </div>
              </div>
            </div>
            
            <div className="card animate-pop" style={{ padding: '24px', borderLeft: '4px solid var(--accent-success)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: 'var(--accent-success)' }}>
                  <DollarSign size={24} />
                </div>
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 600 }}>Ganancias (Comisión {selectedMechanic.commissionRate}%)</p>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, color: 'var(--accent-success)' }}>{currency}{totalGanancias.toFixed(2)}</h3>
                </div>
              </div>
            </div>

            <div className="card animate-pop" style={{ padding: '24px', borderLeft: '4px solid var(--accent-warning, #F59E0B)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', color: '#F59E0B' }}>
                  <Wrench size={24} />
                </div>
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 600 }}>Servicios Realizados</p>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>{totalServicios}</h3>
                </div>
              </div>
            </div>
          </div>

          <div className="card animate-item" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '24px' }}>Rendimiento Semanal - {selectedMechanic.name}</h3>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                  <RechartsTooltip cursor={{ fill: 'var(--bg-app)' }} />
                  <Bar dataKey="ventas" name="Ventas" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ganancias" name="Ganancias" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-muted)' }}>
          <Trophy size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
          <h3>Selecciona un mecánico para ver sus métricas</h3>
        </div>
      )}
    </div>
  );
};

export default MechanicDashboard;
