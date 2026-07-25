import { useState, useEffect } from 'react';

// Datos de Ingresos Brutos por mes (ventas totales)
const MOCK_REVENUE = [
  { name: 'Mar', uv: 23000 },
  { name: 'Abr', uv: 16000 },
  { name: 'May', uv: 20000 },
  { name: 'Jun', uv: 12000 },
  { name: 'Jul', uv: 20000 },
  { name: 'Ago', uv: 6000 },
  { name: 'Sep', uv: 20000 },
  { name: 'Oct', uv: 16000 },
  { name: 'Nov', uv: 18202 },
  { name: 'Dic', uv: 10000 },
  { name: 'Ene', uv: 6000 },
  { name: 'Feb', uv: 8000 },
];

// Datos de Retención/IA
const MOCK_RETENTION = [
  { name: 'Jun', falsosPositivos: 30, verificados: 40, pendientes: 30 },
  { name: 'Jul', falsosPositivos: 40, verificados: 30, pendientes: 30 },
  { name: 'Ago', falsosPositivos: 50, verificados: 30, pendientes: 20 },
  { name: 'Sep', falsosPositivos: 60, verificados: 20, pendientes: 20 },
  { name: 'Oct', falsosPositivos: 40, verificados: 30, pendientes: 30 },
  { name: 'Nov', falsosPositivos: 30, verificados: 40, pendientes: 30 },
  { name: 'Dic', falsosPositivos: 50, verificados: 30, pendientes: 20 },
];

// Comparativo financiero mensual: Ingresos vs Costos vs Ganancia Neta
const MOCK_FINANCIALS = [
  { name: 'Ene', ingresos: 28500, costos: 17100, ganancia: 11400 },
  { name: 'Feb', ingresos: 26200, costos: 15720, ganancia: 10480 },
  { name: 'Mar', ingresos: 31800, costos: 19080, ganancia: 12720 },
  { name: 'Abr', ingresos: 29400, costos: 17640, ganancia: 11760 },
  { name: 'May', ingresos: 33500, costos: 20100, ganancia: 13400 },
  { name: 'Jun', ingresos: 27900, costos: 16740, ganancia: 11160 },
  { name: 'Jul', ingresos: 35200, costos: 21120, ganancia: 14080 },
];

// Top 5 productos más vendidos del mes
const MOCK_TOP_PRODUCTS = [
  { name: 'Coca Cola 2L', sold: 342, revenue: 855 },
  { name: 'Sabritas 45g', sold: 298, revenue: 357.60 },
  { name: 'Agua Ciel 1L', sold: 276, revenue: 276 },
  { name: 'Pan Bimbo', sold: 215, revenue: 537.50 },
  { name: 'Atún Dolores', sold: 189, revenue: 340.20 },
];

export const useDashboardData = () => {
  const [data, setData] = useState({
    revenue: MOCK_REVENUE,
    retention: MOCK_RETENTION,
    financials: MOCK_FINANCIALS,
    topProducts: MOCK_TOP_PRODUCTS,
    metrics: {
      invoices: '1,129',
      avgTicket: '$24.50',
      alerts: '14',
      totalRevenue: '$32.2K',
      netProfit: '$18.5K'
    }
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulando fetch a la API del backend
    const fetchTimer = setTimeout(() => {
      setLoading(false);
    }, 800);

    return () => clearTimeout(fetchTimer);
  }, []);

  return { data, loading };
};
