export type PeriodView = 'day' | 'week' | 'month' | 'custom';

export interface DateRange {
  from: string;
  to: string;
}

/** Fecha local en formato YYYY-MM-DD (toISOString usaría UTC y movería las ventas nocturnas al día siguiente). */
export const toDayKey = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

export const fromDayKey = (key: string): Date => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const addDays = (key: string, days: number): string => {
  const date = fromDayKey(key);
  date.setDate(date.getDate() + days);
  return toDayKey(date);
};

/** Día local en el que se registró una venta; vacío si no tiene una fecha válida. */
export const getSaleDayKey = (sale: { createdAt?: string; date?: string }): string => {
  if (sale.createdAt) {
    const created = new Date(sale.createdAt);
    if (!isNaN(created.getTime())) return toDayKey(created);
  }
  return sale.date || '';
};

/** Rango que cubre la vista elegida alrededor de una fecha. La semana va de lunes a domingo. */
export const getPeriodRange = (view: Exclude<PeriodView, 'custom'>, anchor: string): DateRange => {
  if (view === 'day') return { from: anchor, to: anchor };

  const date = fromDayKey(anchor);
  if (view === 'week') {
    const daysSinceMonday = (date.getDay() + 6) % 7;
    const from = addDays(anchor, -daysSinceMonday);
    return { from, to: addDays(from, 6) };
  }

  return {
    from: toDayKey(new Date(date.getFullYear(), date.getMonth(), 1)),
    to: toDayKey(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
  };
};

export const normalizeRange = (a: string, b: string): DateRange => (a <= b ? { from: a, to: b } : { from: b, to: a });

export const listDays = ({ from, to }: DateRange): string[] => {
  const days: string[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) days.push(day);
  return days;
};

/** Celdas de un mes en cuadrícula de lunes a domingo; incluye los días vecinos para completar las semanas. */
export const getCalendarDays = (year: number, month: number): string[] => {
  const first = toDayKey(new Date(year, month, 1));
  const last = toDayKey(new Date(year, month + 1, 0));
  return listDays({ from: getPeriodRange('week', first).from, to: getPeriodRange('week', last).to });
};
