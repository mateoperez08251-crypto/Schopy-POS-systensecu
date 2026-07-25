import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, Receipt, Printer, Calendar as CalendarIcon, Download, Edit, ShoppingCart } from 'lucide-react';

interface SalesHistoryProps {
  salesHistory: any[];
}

const AnimatedCheckbox = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
  <div className="checkbox-wrapper">
    <input type="checkbox" checked={checked} onChange={onChange} />
    <svg viewBox="0 0 40 40">
      <rect className="background" width="40" height="40" rx="8" />
      <rect className="stroke" width="40" height="40" rx="8" />
      <path className="check" d="M12,20 l6,6 l12,-12" />
    </svg>
  </div>
);

const SalesHistory: React.FC<SalesHistoryProps> = ({ salesHistory }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const filteredSales = salesHistory.filter(sale => {
    const clientName = sale.client || 'Público en General';
    const matchesSearch = sale.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          clientName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredSales.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSales.map(s => s.id));
    }
  };

  return (
    <div style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div className="flex-between">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Historial de Ventas</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Consulta, edita y reimprime transacciones</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn btn-primary" onClick={() => navigate('/pos')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingCart size={18} /> Ir a Ventas (POS)
          </button>
          {selectedIds.length > 0 && (
            <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--accent-primary)' }}>
              <Printer size={18} /> Imprimir ({selectedIds.length})
            </button>
          )}
          <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={18} /> Exportar
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>Total Ventas (Filtradas)</p>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>${filteredSales.reduce((acc, s) => acc + s.total, 0).toFixed(2)}</h2>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>Transacciones</p>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{filteredSales.length}</h2>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>Ticket Promedio</p>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            ${filteredSales.length > 0 ? (filteredSales.reduce((acc, s) => acc + s.total, 0) / filteredSales.length).toFixed(2) : '0.00'}
          </h2>
        </div>
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
        
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', paddingBottom: '10px' }}>
             <button 
                onClick={handleSelectAll} 
                className="btn btn-outline" 
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px' }}
             >
                <div style={{ transform: 'scale(0.6)', transformOrigin: 'left center' }}>
                  <AnimatedCheckbox checked={selectedIds.length > 0 && selectedIds.length === filteredSales.length} onChange={() => {}} />
                </div>
                Seleccionar Todo
             </button>
          </div>

          <div style={{ flex: 1, minWidth: '250px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Buscar Transacción</label>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="ID de ticket o Cliente..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%', padding: '10px 16px 10px 42px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)', background: 'var(--bg-app)',
                  fontSize: '0.9rem', color: 'var(--text-primary)', outline: 'none',
                }}
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Fecha Desde</label>
            <div style={{ position: 'relative' }}>
              <CalendarIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="date" 
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{
                  padding: '10px 16px 10px 36px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)', background: 'var(--bg-app)',
                  fontSize: '0.9rem', color: 'var(--text-primary)', outline: 'none',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>Fecha Hasta</label>
            <div style={{ position: 'relative' }}>
              <CalendarIcon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="date" 
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{
                  padding: '10px 16px 10px 36px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-light)', background: 'var(--bg-app)',
                  fontSize: '0.9rem', color: 'var(--text-primary)', outline: 'none',
                }}
              />
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {filteredSales.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
              <Receipt size={64} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '8px' }}>No hay transacciones</h3>
              <p>No se encontraron ventas con los filtros actuales.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              {filteredSales.map((sale) => {
                const isSelected = selectedIds.includes(sale.id);
                return (
                  <div key={sale.id} onClick={() => handleSelect(sale.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: isSelected ? 'rgba(24, 94, 224, 0.05)' : 'var(--bg-app)', border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-light)'}`, borderRadius: 'var(--radius-lg)', cursor: 'pointer', transition: 'all 0.2s' }}>
                    
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                      <div onClick={(e) => { e.stopPropagation(); handleSelect(sale.id); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AnimatedCheckbox checked={isSelected} onChange={() => handleSelect(sale.id)} />
                      </div>
                      <div style={{ width: '48px', height: '48px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
                        <Clock size={24} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{sale.id}</h4>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-primary)', background: 'rgba(59,130,246,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                            {sale.time}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
                          {sale.items.length} productos • Cliente: <b>{sale.client || 'Público en General'}</b> • Pago: {sale.paymentMethod}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '2px' }}>Total</p>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-success)', margin: 0 }}>
                          ${sale.total.toFixed(2)}
                        </h3>
                      </div>
                      <div style={{ width: '1px', height: '40px', background: 'var(--border-light)' }}></div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={(e) => e.stopPropagation()} className="btn btn-outline" title="Re-imprimir Ticket" style={{ padding: '10px' }}>
                          <Printer size={18} />
                        </button>
                        <button onClick={(e) => e.stopPropagation()} className="btn btn-outline" title="Editar Venta" style={{ padding: '10px', color: 'var(--accent-warning)', borderColor: 'var(--border-light)' }}>
                          <Edit size={18} />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesHistory;
