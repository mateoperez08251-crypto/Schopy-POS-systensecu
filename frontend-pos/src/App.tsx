import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import { INITIAL_SUPPLIERS } from './mockData';

// Componentes
import Sidebar from './components/Sidebar';
import OfflineOverlay from './components/OfflineOverlay';
import TopNav from './components/TopNav';

// Páginas
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import VoucherPOS from './pages/VoucherPOS';
import Inventory from './pages/Inventory';
import Audit from './pages/Audit';
import SalesHistory from './pages/SalesHistory';
import Login from './pages/Login';
import Suppliers from './pages/Suppliers';
import Receivings from './pages/Receivings';
import NewReceiving from './pages/NewReceiving';
import Customers from './pages/Customers';
import Staff from './pages/Staff';
import Setup from './pages/Setup';
import Expired from './pages/Expired';

import { useAuth } from './context/AuthContext';
import { subscribeToInventory } from './firebase/inventoryService';
import { subscribeToCustomers } from './firebase/customersService';

function App() {
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>(INITIAL_SUPPLIERS);
  const [customers, setCustomers] = useState<any[]>([]);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

  const { currentUser, userData, needsSetup, isSubscriptionExpired } = useAuth();

  React.useEffect(() => {
    if (userData?.companyId) {
      const unsubInventory = subscribeToInventory(userData.companyId, (items) => {
        setInventory(items);
      });
      const unsubCustomers = subscribeToCustomers(userData.companyId, (items) => {
        setCustomers(items);
      });
      return () => {
        unsubInventory();
        unsubCustomers();
      };
    } else {
      setInventory([]);
      setCustomers([]);
    }
  }, [userData]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (!currentUser) {
    return <Login onLogin={() => {}} />;
  }

  if (needsSetup) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<Setup />} />
        </Routes>
      </Router>
    );
  }

  if (isSubscriptionExpired) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<Expired />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="app-layout">
        <OfflineOverlay />
        <Sidebar />
        <div className="main-content">
          <TopNav title="" />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pos" element={<POS salesHistory={salesHistory} setSalesHistory={setSalesHistory} />} />
            <Route path="/voucher-pos" element={<VoucherPOS salesHistory={salesHistory} setSalesHistory={setSalesHistory} />} />
            <Route path="/sales-history" element={<SalesHistory salesHistory={salesHistory} />} />
            <Route path="/inventory" element={<Inventory inventory={inventory} setInventory={setInventory} showToast={showToast} />} />
            <Route path="/suppliers" element={<Suppliers suppliers={suppliers} setSuppliers={setSuppliers} showToast={showToast} />} />
            <Route path="/customers" element={<Customers customers={customers} setCustomers={setCustomers} showToast={showToast} />} />
            <Route path="/staff" element={<Staff showToast={showToast} />} />
            <Route path="/receivings/new" element={<NewReceiving inventory={inventory} setInventory={setInventory} suppliers={suppliers} showToast={showToast} />} />
            <Route path="/receivings" element={<Receivings suppliers={suppliers} />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="*" element={<div style={{padding: '40px', flex:1}}><h2>Página en construcción</h2></div>} />
          </Routes>
        </div>

        
        {toast && (
          <div style={{
            position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
            background: toast.type === 'success' ? '#10B981' : (toast.type === 'error' ? '#EF4444' : '#6366F1'),
            color: 'white', padding: '12px 24px', borderRadius: '12px', fontWeight: 600,
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 10000,
            animation: 'toastSlideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            {toast.message}
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;
