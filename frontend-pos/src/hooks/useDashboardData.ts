import { useState, useEffect } from 'react';

// Fake Data para desarrollo inicial
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

const MOCK_RETENTION = [
  { name: 'Jun', falsosPositivos: 30, verificados: 40, pendientes: 30 },
  { name: 'Jul', falsosPositivos: 40, verificados: 30, pendientes: 30 },
  { name: 'Ago', falsosPositivos: 50, verificados: 30, pendientes: 20 },
  { name: 'Sep', falsosPositivos: 60, verificados: 20, pendientes: 20 },
  { name: 'Oct', falsosPositivos: 40, verificados: 30, pendientes: 30 },
  { name: 'Nov', falsosPositivos: 30, verificados: 40, pendientes: 30 },
  { name: 'Dic', falsosPositivos: 50, verificados: 30, pendientes: 20 },
];

export const useDashboardData = () => {
  const [data, setData] = useState({
    revenue: MOCK_REVENUE,
    retention: MOCK_RETENTION,
    metrics: {
      invoices: '1,129',
      avgTicket: '$24.50',
      alerts: '14',
      totalRevenue: '$32.2K'
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
