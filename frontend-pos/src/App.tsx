import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';

// Componentes
import Sidebar from './components/Sidebar';
import OfflineOverlay from './components/OfflineOverlay';
import TopNav from './components/TopNav';

// Páginas
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Audit from './pages/Audit';
import SalesHistory from './pages/SalesHistory';
import Login from './pages/Login';

function App() {
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
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
            <Route path="/sales-history" element={<SalesHistory salesHistory={salesHistory} />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="*" element={<div style={{padding: '40px', flex:1}}><h2>Página en construcción</h2></div>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
