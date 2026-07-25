import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';

// Componentes
import Sidebar from './components/Sidebar';

// Páginas
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Audit from './pages/Audit';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loader">
          <svg viewBox="0 0 80 80">
            <circle r="32" cy="40" cx="40" id="test"></circle>
          </svg>
        </div>
        <div className="loader triangle">
          <svg viewBox="0 0 86 80">
            <polygon points="43 8 79 72 7 72"></polygon>
          </svg>
        </div>
        <div className="loader">
          <svg viewBox="0 0 80 80">
            <rect height="64" width="64" y="8" x="8"></rect>
          </svg>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-layout">
        <Sidebar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/audit" element={<Audit />} />
          <Route path="*" element={<div style={{padding: '40px', flex:1}}><h2>Página en construcción</h2></div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
