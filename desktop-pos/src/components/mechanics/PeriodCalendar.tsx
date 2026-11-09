import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DateRange, fromDayKey, getCalendarDays, toDayKey } from '../../utils/dateRanges';

const WEEK_DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

interface PeriodCalendarProps {
  year: number;
  month: number;
  range: DateRange;
  daysWithSales: Record<string, number>;
  onDayClick: (day: string) => void;
  onMonthChange: (delta: number) => void;
  onToday: () => void;
}

const PeriodCalendar: React.FC<PeriodCalendarProps> = ({ year, month, range, daysWithSales, onDayClick, onMonthChange, onToday }) => {
  const today = toDayKey(new Date());
  const monthLabel = new Date(year, month, 1).toLocaleDateString('es-DO', { month: 'long', year: 'numeric' });
  const navButton: React.CSSProperties = { padding: '6px', border: 'none', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', borderRadius: '6px' };

  return (
    <div className="card" style={{ padding: '20px' }}>
      <div className="flex-between" style={{ marginBottom: '16px' }}>
        <button type="button" onClick={() => onMonthChange(-1)} style={navButton} aria-label="Mes anterior"><ChevronLeft size={20} /></button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, textTransform: 'capitalize' }}>{monthLabel}</div>
          <button type="button" onClick={onToday} style={{ border: 'none', background: 'transparent', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}>Ir a hoy</button>
        </div>
        <button type="button" onClick={() => onMonthChange(1)} style={navButton} aria-label="Mes siguiente"><ChevronRight size={20} /></button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {WEEK_DAYS.map(day => (
          <div key={day} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', paddingBottom: '6px' }}>{day}</div>
        ))}

        {getCalendarDays(year, month).map(day => {
          const date = fromDayKey(day);
          const inRange = day >= range.from && day <= range.to;
          const isEdge = day === range.from || day === range.to;
          const isOtherMonth = date.getMonth() !== month;
          const hasSales = (daysWithSales[day] || 0) > 0;

          let color = isOtherMonth ? 'var(--text-muted)' : 'var(--text-primary)';
          if (inRange) color = 'var(--accent-primary)';
          if (isEdge) color = 'white';

          return (
            <button
              key={day}
              type="button"
              onClick={() => onDayClick(day)}
              aria-pressed={inRange}
              aria-label={date.toLocaleDateString('es-DO', { dateStyle: 'full' })}
              title={hasSales ? `${daysWithSales[day]} servicio(s)` : undefined}
              style={{
                position: 'relative',
                aspectRatio: '1',
                border: day === today ? '1px solid var(--accent-primary)' : '1px solid transparent',
                borderRadius: '8px',
                background: isEdge ? 'var(--accent-primary)' : inRange ? 'var(--accent-primary-light)' : 'transparent',
                color,
                fontSize: '0.85rem',
                fontWeight: inRange ? 700 : 500,
                opacity: isOtherMonth && !inRange ? 0.5 : 1,
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
            >
              {date.getDate()}
              {hasSales && (
                <span style={{
                  position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)',
                  width: '4px', height: '4px', borderRadius: '50%',
                  background: isEdge ? 'white' : 'var(--accent-success)'
                }} />
              )}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-success)' }} />
        Días con servicios de este mecánico
      </div>
    </div>
  );
};

export default PeriodCalendar;
