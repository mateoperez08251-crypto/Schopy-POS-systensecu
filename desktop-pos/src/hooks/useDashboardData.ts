import { useState, useEffect } from 'react';

// Datos de Ingresos Brutos por mes (ventas totales)
const MOCK_REVENUE: any[] = [];

// Datos de Retención/IA
const MOCK_RETENTION: any[] = [];

// Comparativo financiero mensual: Ingresos vs Costos vs Ganancia Neta
const MOCK_FINANCIALS: any[] = [];

// Top 5 productos más vendidos del mes
const MOCK_TOP_PRODUCTS: any[] = [];

export const useDashboardData = () => {
  const [data, setData] = useState({
    revenue: MOCK_REVENUE,
    retention: MOCK_RETENTION,
    financials: MOCK_FINANCIALS,
    topProducts: MOCK_TOP_PRODUCTS,
    metrics: {
      invoices: '0',
      avgTicket: '$0.00',
      alerts: '0',
      totalRevenue: '$0.00',
      netProfit: '$0.00'
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
