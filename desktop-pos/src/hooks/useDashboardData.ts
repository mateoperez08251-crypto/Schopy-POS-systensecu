import { useState, useEffect } from 'react';
import { subscribeToSales } from '../firebase/localSalesService';
import { subscribeToMechanics } from '../firebase/localMechanicsService';

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
    topMechanic: null as any,
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
    let salesUnsub = () => {};
    let mechanicsUnsub = () => {};

    const loadData = () => {
      let salesList: any[] = [];
      let mechanicsList: any[] = [];

      salesUnsub = subscribeToSales((salesData) => {
        salesList = salesData;
        updateData(salesList, mechanicsList);
      });

      mechanicsUnsub = subscribeToMechanics((mechData) => {
        mechanicsList = mechData;
        updateData(salesList, mechanicsList);
      });
      
      setLoading(false);
    };

    const updateData = (salesList: any[], mechanicsList: any[]) => {
      // Calculate top mechanic
      const mechanicStats: Record<string, { salesCount: number; totalSales: number; name: string }> = {};
      
      mechanicsList.forEach(m => {
        mechanicStats[m.id] = { salesCount: 0, totalSales: 0, name: m.name };
      });

      let totalInvoices = salesList.length;
      let totalRev = 0;

      salesList.forEach(sale => {
        totalRev += (sale.total || 0);
        if (sale.mechanicId && mechanicStats[sale.mechanicId]) {
          mechanicStats[sale.mechanicId].salesCount += 1;
          mechanicStats[sale.mechanicId].totalSales += (sale.total || 0);
        }
      });

      let topMechanic: any = null;
      let maxSales = -1;
      
      Object.values(mechanicStats).forEach(stat => {
        if (stat.totalSales > maxSales) {
          maxSales = stat.totalSales;
          topMechanic = stat;
        }
      });

      setData(prev => ({
        ...prev,
        topMechanic,
        metrics: {
          ...prev.metrics,
          invoices: totalInvoices.toString(),
          totalRevenue: `$${totalRev.toFixed(2)}`,
          avgTicket: totalInvoices > 0 ? `$${(totalRev / totalInvoices).toFixed(2)}` : '$0.00'
        }
      }));
    };

    loadData();

    return () => {
      salesUnsub();
      mechanicsUnsub();
    };
  }, []);

  return { data, loading };
};
