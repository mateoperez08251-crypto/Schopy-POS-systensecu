import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeToMechanics } from '../firebase/localMechanicsService';
import { subscribeToSales } from '../firebase/localSalesService';
import { Wrench, DollarSign, Trophy, TrendingUp } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer
} from 'recharts';
import PeriodCalendar from '../components/mechanics/PeriodCalendar';
import {
  DateRange, PeriodView, fromDayKey, getPeriodRange, getSaleDayKey, listDays, normalizeRange, toDayKey
} from '../utils/dateRanges';

const VIEWS: { id: PeriodView; label: string }[] = [
  { id: 'day', label: 'Día' },
  { id: 'week', label: 'Semana' },
  { id: 'month', label: 'Mes' },
  { id: 'custom', label: 'Rango' }
];

// Por encima de este número de días, las barras se agrupan por mes para que sigan siendo legibles.
const MAX_DAILY_BARS = 62;

const formatDay = (day: string, options: Intl.DateTimeFormatOptions) =>
  fromDayKey(day).toLocaleDateString('es-DO', options);

const getPeriodLabel = (view: PeriodView, range: DateRange) => {
  if (view === 'day') return formatDay(range.from, { dateStyle: 'full' });
  if (view === 'month') return formatDay(range.from, { month: 'long', year: 'numeric' });
  const short: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  return `${formatDay(range.from, short)} – ${formatDay(range.to, short)}`;
};

const MechanicDashboard = () => {
  const { userData, companyId } = useAuth();
  const currency = (userData as any)?.currency || '$';

  const [mechanics, setMechanics] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [selectedMechanicId, setSelectedMechanicId] = useState<string>('');

  const [view, setView] = useState<PeriodView>('week');
  const [anchorDay, setAnchorDay] = useState(() => toDayKey(new Date()));
  const [customRange, setCustomRange] = useState<DateRange>(() => getPeriodRange('week', toDayKey(new Date())));
  const [isPickingRangeEnd, setIsPickingRangeEnd] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const effectiveCompanyId = userData?.companyId || companyId || 'local';

  useEffect(() => {
    if (!effectiveCompanyId) return;
    const unsubMechanics = subscribeToMechanics(effectiveCompanyId, (data) => {
      setMechanics(data);
      setSelectedMechanicId(current => current || data[0]?.id || '');
    });

    const unsubSales = subscribeToSales(effectiveCompanyId, (data) => {
      setSales(data);
    });

    return () => {
      unsubMechanics();
      unsubSales();
    };
  }, [effectiveCompanyId]);

  const selectedMechanic = mechanics.find(m => m.id === selectedMechanicId);
  const commRate = (selectedMechanic?.commissionRate || 0) / 100;
  const range = view === 'custom' ? customRange : getPeriodRange(view, anchorDay);

  const mechanicSales = useMemo(
    () => sales.filter(s => s.mechanicId === selectedMechanicId && s.status !== 'returned'),
    [sales, selectedMechanicId]
  );

  const servicesPerDay = useMemo(() => {
    const counts: Record<string, number> = {};
    mechanicSales.forEach(sale => {
      const day = getSaleDayKey(sale);
      if (day) counts[day] = (counts[day] || 0) + 1;
    });
    return counts;
  }, [mechanicSales]);

  const periodSales = useMemo(
    () => mechanicSales
      .filter(sale => {
        const day = getSaleDayKey(sale);
        return day >= range.from && day <= range.to;
      })
      .sort((a, b) => (b.createdAt || b.date || '').localeCompare(a.createdAt || a.date || '')),
    [mechanicSales, range.from, range.to]
  );

  const totalVentas = periodSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const totalGanancias = totalVentas * commRate;
  const totalServicios = periodSales.length;

  const chartData = useMemo(() => {
    const buckets = new Map<string, { name: string; ventas: number; ganancias: number }>();
    const days = listDays(range);
    const addBucket = (key: string, name: string) => buckets.set(key, { name, ventas: 0, ganancias: 0 });
    let getKey: (sale: any) => string;

    if (view === 'day') {
      const getHour = (sale: any) => (sale.createdAt ? new Date(sale.createdAt).getHours() : NaN);
      const hours = periodSales.map(getHour).filter(hour => !isNaN(hour));
      const firstHour = Math.min(8, ...hours);
      const lastHour = Math.max(18, ...hours);
      for (let hour = firstHour; hour <= lastHour; hour++) addBucket(String(hour), `${hour}:00`);
      getKey = sale => String(getHour(sale));
    } else if (days.length > MAX_DAILY_BARS) {
      days.forEach(day => {
        const key = day.slice(0, 7);
        if (!buckets.has(key)) addBucket(key, formatDay(day, { month: 'short', year: '2-digit' }));
      });
      getKey = sale => getSaleDayKey(sale).slice(0, 7);
    } else {
      days.forEach(day => addBucket(day, formatDay(day, view === 'week' ? { weekday: 'short', day: 'numeric' } : { day: 'numeric', month: 'short' })));
      getKey = sale => getSaleDayKey(sale);
    }

    periodSales.forEach(sale => {
      const bucket = buckets.get(getKey(sale));
      if (bucket) {
        bucket.ventas += sale.total || 0;
        bucket.ganancias += (sale.total || 0) * commRate;
      }
    });

    return Array.from(buckets.values()).map(bucket => ({
      ...bucket,
      ventas: Number(bucket.ventas.toFixed(2)),
      ganancias: Number(bucket.ganancias.toFixed(2))
    }));
  }, [periodSales, view, range.from, range.to, commRate]);

  const showMonthOf = (day: string) => {
    const date = fromDayKey(day);
    setCalendarMonth({ year: date.getFullYear(), month: date.getMonth() });
  };

  const handleViewChange = (nextView: PeriodView) => {
    if (nextView === 'custom') setCustomRange(range);
    setIsPickingRangeEnd(false);
    setView(nextView);
  };

  const handleDayClick = (day: string) => {
    if (view !== 'custom') {
      setAnchorDay(day);
      showMonthOf(day);
      return;
    }
    // Primer clic marca el inicio del rango; el segundo lo cierra.
    setCustomRange(isPickingRangeEnd ? normalizeRange(customRange.from, day) : { from: day, to: day });
    setIsPickingRangeEnd(!isPickingRangeEnd);
  };

  const handleMonthChange = (delta: number) => {
    const first = new Date(calendarMonth.year, calendarMonth.month + delta, 1);
    setCalendarMonth({ year: first.getFullYear(), month: first.getMonth() });
    if (view === 'month') setAnchorDay(toDayKey(first));
  };

  const handleToday = () => {
    const today = toDayKey(new Date());
    showMonthOf(today);
    if (view === 'custom') {
      setCustomRange({ from: today, to: today });
      setIsPickingRangeEnd(false);
    } else {
      setAnchorDay(today);
    }
  };

  const handleRangeInput = (field: keyof DateRange, value: string) => {
    if (!value) return;
    const next = { ...customRange, [field]: value };
    setCustomRange(normalizeRange(next.from, next.to));
    setIsPickingRangeEnd(false);
    showMonthOf(value);
  };

  const dateInputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border-medium)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' };
  const tableHeader: React.CSSProperties = { padding: '10px 12px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-medium)', position: 'sticky', top: 0, background: 'var(--bg-card)' };
  const tableCell: React.CSSProperties = { padding: '10px 12px', fontSize: '0.875rem', borderBottom: '1px solid var(--border-light)' };

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
          <div className="flex-between" style={{ marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
            <div role="group" aria-label="Periodo" style={{ display: 'flex', background: 'var(--bg-card)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-medium)', gap: '4px' }}>
              {VIEWS.map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleViewChange(option.id)}
                  aria-pressed={view === option.id}
                  style={{
                    padding: '8px 18px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '0.875rem',
                    background: view === option.id ? 'var(--accent-primary)' : 'transparent',
                    color: view === option.id ? 'white' : 'var(--text-secondary)',
                    fontWeight: view === option.id ? 700 : 500,
                    transition: 'background 0.15s ease, color 0.15s ease'
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p style={{ margin: 0, fontWeight: 600, textTransform: 'capitalize' }}>{getPeriodLabel(view, range)}</p>
          </div>

          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: '0 1 320px', minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <PeriodCalendar
                year={calendarMonth.year}
                month={calendarMonth.month}
                range={range}
                daysWithSales={servicesPerDay}
                onDayClick={handleDayClick}
                onMonthChange={handleMonthChange}
                onToday={handleToday}
              />

              {view === 'custom' && (
                <div className="card" style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Desde</label>
                    <input type="date" value={customRange.from} onChange={e => handleRangeInput('from', e.target.value)} style={dateInputStyle} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Hasta</label>
                    <input type="date" value={customRange.to} onChange={e => handleRangeInput('to', e.target.value)} style={dateInputStyle} />
                  </div>
                  <p style={{ gridColumn: '1 / -1', margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {isPickingRangeEnd ? 'Elige el último día en el calendario.' : 'También puedes marcar el primer y el último día en el calendario.'}
                  </p>
                </div>
              )}
            </div>

            <div style={{ flex: '1 1 520px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                <div className="card animate-pop" style={{ padding: '24px', borderLeft: '4px solid var(--accent-primary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: 'var(--accent-primary)' }}>
                      <TrendingUp size={24} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 600 }}>Total de Ventas</p>
                      <h3 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>{currency}{totalVentas.toFixed(2)}</h3>
                    </div>
                  </div>
                </div>

                <div className="card animate-pop" style={{ padding: '24px', borderLeft: '4px solid var(--accent-success)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: 'var(--accent-success)' }}>
                      <DollarSign size={24} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 600 }}>Ganancias (Comisión {selectedMechanic.commissionRate}%)</p>
                      <h3 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: 'var(--accent-success)' }}>{currency}{totalGanancias.toFixed(2)}</h3>
                    </div>
                  </div>
                </div>

                <div className="card animate-pop" style={{ padding: '24px', borderLeft: '4px solid var(--accent-warning, #F59E0B)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '12px', color: '#F59E0B' }}>
                      <Wrench size={24} />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, fontWeight: 600 }}>Servicios Realizados</p>
                      <h3 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>{totalServicios}</h3>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card animate-item" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '24px' }}>Rendimiento - {selectedMechanic.name}</h3>
                <div style={{ height: '300px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
                      <RechartsTooltip
                        cursor={{ fill: 'var(--bg-app)' }}
                        contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '8px', color: 'var(--text-primary)' }}
                        formatter={(value: any) => `${currency}${Number(value).toFixed(2)}`}
                      />
                      <Bar dataKey="ventas" name="Ventas" fill="#6366F1" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="ganancias" name="Ganancias" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Servicios del Periodo</h3>
                {periodSales.length === 0 ? (
                  <p style={{ margin: 0, padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Este mecánico no tiene servicios en el periodo elegido.
                  </p>
                ) : (
                  <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr>
                          <th style={tableHeader}>Fecha</th>
                          <th style={tableHeader}>Ticket</th>
                          <th style={tableHeader}>Cliente</th>
                          <th style={{ ...tableHeader, textAlign: 'right' }}>Total</th>
                          <th style={{ ...tableHeader, textAlign: 'right' }}>Comisión</th>
                        </tr>
                      </thead>
                      <tbody>
                        {periodSales.map(sale => (
                          <tr key={sale.docId || sale.id}>
                            <td style={tableCell}>{formatDay(getSaleDayKey(sale), { day: 'numeric', month: 'short', year: 'numeric' })} {sale.time}</td>
                            <td style={tableCell}>{sale.id}</td>
                            <td style={tableCell}>{sale.client || 'Público en General'}</td>
                            <td style={{ ...tableCell, textAlign: 'right' }}>{currency}{(sale.total || 0).toFixed(2)}</td>
                            <td style={{ ...tableCell, textAlign: 'right', fontWeight: 700, color: 'var(--accent-success)' }}>{currency}{((sale.total || 0) * commRate).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
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
