import { useState, useEffect } from 'react';
import { subscribeToSales } from '../firebase/localSalesService';
import { subscribeToMechanics } from '../firebase/localMechanicsService';

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Filter helpers
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const daysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return startOfDay(d); };

export type TimeFilter = '1 D' | '1 S' | '1 M' | '6 M' | '1 A' | 'TODO';

const getFilterDate = (filter: TimeFilter): Date | null => {
  const now = new Date();
  switch (filter) {
    case '1 D': return startOfDay(now);
    case '1 S': return daysAgo(7);
    case '1 M': return daysAgo(30);
    case '6 M': return daysAgo(180);
    case '1 A': return daysAgo(365);
    case 'TODO': return null;
  }
};

const parseSaleDate = (sale: any): Date => {
  if (sale.createdAt) return new Date(sale.createdAt);
  if (sale.date) return new Date(sale.date);
  return new Date();
};

const buildDashboard = (salesList: any[], mechanicsList: any[], filter: TimeFilter) => {
  const filterDate = getFilterDate(filter);
  const filtered = filterDate
    ? salesList.filter(s => parseSaleDate(s) >= filterDate)
    : salesList;

  // Mechanic stats
  const mechanicStats: Record<string, { salesCount: number; totalSales: number; name: string }> = {};
  mechanicsList.forEach(m => { mechanicStats[m.id] = { salesCount: 0, totalSales: 0, name: m.name }; });

  let totalRev = 0;
  const revenueByMonth: Record<string, number> = {};
  const costByMonth: Record<string, number> = {};
  const revenueByDay: Record<string, number> = {};
  const productStats: Record<string, { name: string; sold: number; revenue: number }> = {};
  const paymentMethods: Record<string, number> = { Efectivo: 0, Tarjeta: 0, Transferencia: 0 };
  const customerStats: Record<string, { name: string; purchases: number; totalSpent: number }> = {};
  let totalCost = 0;

  filtered.forEach(sale => {
    const saleTotal = sale.total || 0;
    totalRev += saleTotal;
    const d = parseSaleDate(sale);

    // Revenue by month
    const mk = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}`;
    revenueByMonth[mk] = (revenueByMonth[mk] || 0) + saleTotal;

    // Revenue by day (for short filters)
    const dk = d.toISOString().slice(0, 10);
    revenueByDay[dk] = (revenueByDay[dk] || 0) + saleTotal;

    // Products + costs
    if (sale.items && Array.isArray(sale.items)) {
      sale.items.forEach((item: any) => {
        const key = item.id || item.name;
        if (!productStats[key]) productStats[key] = { name: item.name || 'Sin nombre', sold: 0, revenue: 0 };
        const qty = item.quantity || 1;
        const price = item.price || 0;
        const cost = item.costPrice || 0;
        productStats[key].sold += qty;
        productStats[key].revenue += (price * qty);
        totalCost += (cost * qty);
        
        // Cost by month
        costByMonth[mk] = (costByMonth[mk] || 0) + (cost * qty);
      });
    }

    // Mechanics
    if (sale.mechanicId && mechanicStats[sale.mechanicId]) {
      mechanicStats[sale.mechanicId].salesCount += 1;
      mechanicStats[sale.mechanicId].totalSales += saleTotal;
    }

    // Payment method
    const method = sale.paymentMethod || 'Efectivo';
    paymentMethods[method] = (paymentMethods[method] || 0) + saleTotal;

    // Customer tracking
    const clientName = sale.client || sale.clientName;
    if (clientName && clientName.trim()) {
      if (!customerStats[clientName]) customerStats[clientName] = { name: clientName, purchases: 0, totalSpent: 0 };
      customerStats[clientName].purchases += 1;
      customerStats[clientName].totalSpent += saleTotal;
    }
  });

  // Choose granularity: day for 1D/1S, month otherwise
  let revenueArr: any[];
  if (filter === '1 D' || filter === '1 S') {
    revenueArr = Object.entries(revenueByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key]) => {
        const d = new Date(key + 'T00:00:00');
        return { name: filter === '1 D' ? `${d.getHours() || 0}h` : DAY_NAMES[d.getDay()], uv: revenueByDay[key] };
      });
  } else {
    revenueArr = Object.entries(revenueByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => {
        const month = parseInt(key.split('-')[1]);
        return { name: MONTH_NAMES[month], uv: val };
      });
  }
  if (revenueArr.length === 0) revenueArr.push({ name: MONTH_NAMES[new Date().getMonth()], uv: 0 });

  // Top products
  const topProducts = Object.values(productStats).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Financials (monthly, last 7 entries) - using real cost data
  const financialsArr = Object.entries(revenueByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7)
    .map(([key, val]) => {
      const month = parseInt(key.split('-')[1]);
      const costos = Math.round(costByMonth[key] || 0);
      return { name: MONTH_NAMES[month], ingresos: Math.round(val), costos, ganancia: Math.round(val - costos) };
    });

  // Top mechanic
  let topMechanic: any = null;
  let maxSales = 0;
  Object.values(mechanicStats).forEach(stat => {
    if (stat.totalSales > maxSales) { maxSales = stat.totalSales; topMechanic = stat; }
  });

  const totalInvoices = filtered.length;
  const netProfit = totalRev - totalCost;

  // Top customers (top 5)
  const topCustomers = Object.values(customerStats)
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  return {
    revenue: revenueArr,
    retention: [] as any[],
    financials: financialsArr,
    topProducts,
    topMechanic: topMechanic && topMechanic.totalSales > 0 ? topMechanic : null,
    mechanicSales: [] as any[],
    paymentMethods,
    topCustomers,
    metrics: {
      invoices: totalInvoices.toString(),
      totalRevenue: `$${totalRev.toFixed(2)}`,
      avgTicket: totalInvoices > 0 ? `$${(totalRev / totalInvoices).toFixed(2)}` : '$0.00',
      alerts: '0',
      netProfit: `$${netProfit.toFixed(2)}`
    }
  };
};

export const useDashboardData = (companyId: string | null, filter: TimeFilter = '1 A') => {
  const [rawSales, setRawSales] = useState<any[]>([]);
  const [rawMechanics, setRawMechanics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    const salesUnsub = subscribeToSales(companyId, (d) => { setRawSales(d); setLoading(false); });
    const mechUnsub = subscribeToMechanics(companyId, (d) => { setRawMechanics(d); });
    return () => { salesUnsub(); mechUnsub(); };
  }, [companyId]);

  const data = buildDashboard(rawSales, rawMechanics, filter);
  return { data, loading };
};
