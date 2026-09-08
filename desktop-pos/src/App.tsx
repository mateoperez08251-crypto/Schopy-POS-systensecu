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
import LocalLogin from './pages/LocalLogin';
import Suppliers from './pages/Suppliers';
import Receivings from './pages/Receivings';
import NewReceiving from './pages/NewReceiving';
import Customers from './pages/Customers';
import Staff from './pages/Staff';
import Setup from './pages/Setup';
import Expired from './pages/Expired';
import BackupScreen from './pages/BackupScreen';
import Settings from './pages/Settings';
import MechanicDashboard from './pages/MechanicDashboard';
import Help from './pages/Help';
// Pantalla de Cierre de Caja
import CashRegister from './pages/CashRegister';
import RestockModal from './components/inventory/RestockModal';

import { useAuth } from './context/AuthContext';
import { subscribeToInventory } from './firebase/inventoryService';
import { subscribeToCustomers } from './firebase/customersService';

function App() {
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>(INITIAL_SUPPLIERS);
  const [customers, setCustomers] = useState<any[]>([]);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);

  const { currentUser, userData } = useAuth();

  React.useEffect(() => {
    // We can use a dummy companyId for local storage compatibility
    const dummyCompanyId = 'local';
    const unsubInventory = subscribeToInventory(dummyCompanyId, (items) => {
      setInventory(items);
    });
    const unsubCustomers = subscribeToCustomers(dummyCompanyId, (items) => {
      setCustomers(items);
    });
    return () => {
      unsubInventory();
      unsubCustomers();
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  if (!currentUser) {
    return <LocalLogin />;
  }

  return (
    <Router>
      <div className="app-layout">
        <OfflineOverlay />
        <Sidebar onOpenRestockModal={() => setIsRestockModalOpen(true)} />
        <div className="main-content">
          <TopNav title="" />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pos" element={<POS salesHistory={salesHistory} setSalesHistory={setSalesHistory} inventory={inventory} />} />
            <Route path="/voucher-pos" element={<VoucherPOS salesHistory={salesHistory} setSalesHistory={setSalesHistory} inventory={inventory} />} />
            <Route path="/sales-history" element={<SalesHistory salesHistory={salesHistory} />} />
            <Route path="/cash-register" element={<CashRegister salesHistory={salesHistory} setSalesHistory={setSalesHistory} showToast={showToast} />} />
            <Route path="/inventory" element={<Inventory inventory={inventory} setInventory={setInventory} showToast={showToast} />} />
            <Route path="/suppliers" element={<Suppliers suppliers={suppliers} setSuppliers={setSuppliers} showToast={showToast} />} />
            <Route path="/customers" element={<Customers customers={customers} setCustomers={setCustomers} showToast={showToast} />} />
            <Route path="/staff" element={<Staff showToast={showToast} />} />
            <Route path="/mechanics-dashboard" element={<MechanicDashboard />} />
            <Route path="/receivings/new" element={<NewReceiving inventory={inventory} setInventory={setInventory} suppliers={suppliers} showToast={showToast} />} />
            <Route path="/receivings" element={<Receivings suppliers={suppliers} />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/backup" element={<BackupScreen />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<Help />} />
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
        
        <RestockModal 
          isOpen={isRestockModalOpen} 
          onClose={() => setIsRestockModalOpen(false)} 
          inventory={inventory} 
          suppliers={suppliers} 
        />
      </div>
    </Router>
  );
}

export default App;
