import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, PackagePlus, Calendar, ArrowRight, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { subscribeToReceivings, Receiving } from '../firebase/localReceivingsService';
import { useAuth } from '../context/AuthContext';

const Receivings = ({ suppliers }: { suppliers?: any[] }) => {
  const navigate = useNavigate();
  const { companyId } = useAuth();
  const [receivings, setReceivings] = useState<Receiving[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    if (!companyId) return;
    const unsub = subscribeToReceivings(companyId, (data) => {
      setReceivings(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });
    return () => unsub();
  }, [companyId]);

  // La creación se hace desde NewReceiving.tsx
  const handleAddReceiving = (data: any) => {
    // Deprecated for direct add, use NewReceiving
  };

  const filteredReceivings = receivings.filter(r => {
    const matchesSearch = r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.supplier.toLowerCase().includes(searchTerm.toLowerCase());
                          
    let matchesDate = true;
    if (dateFrom || dateTo) {
      const rDate = r.date ? r.date.split('T')[0] : '';
      if (rDate) {
        if (dateFrom && rDate < dateFrom) matchesDate = false;
        if (dateTo && rDate > dateTo) matchesDate = false;
      }
    }
    
    return matchesSearch && matchesDate;
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <PackagePlus size={28} color="var(--accent-primary)" /> Recepción de Mercancía
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Registra e inspecciona el historial de entradas al inventario</p>
        </div>
        <button 
          className="btn btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={() => navigate('/receivings/new')}
        >
          <Plus size={18} /> Registrar Entrada
        </button>
      </div>

      <div className="card" style={{ padding: '20px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            className="input" 
            placeholder="Buscar por ID, proveedor o usuario..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', paddingLeft: '44px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Desde:</span>
            <input 
              type="date" 
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input"
              style={{ padding: '8px 12px', width: '140px' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Hasta:</span>
            <input 
              type="date" 
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input"
              style={{ padding: '8px 12px', width: '140px' }}
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--border-light)' }}>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>ID RECEPCIÓN</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>FECHA Y HORA</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>PROVEEDOR</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>CANT. ÍTEMS</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>COSTO TOTAL</th>
              <th style={{ padding: '16px 20px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>REGISTRADO POR</th>
              <th style={{ padding: '16px 20px' }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredReceivings.map((rcv) => (
              <tr key={rcv.id} style={{ borderBottom: '1px solid var(--border-light)', transition: '0.2s', cursor: 'pointer' }} className="hover:bg-[var(--bg-app)]">
                <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--text-primary)' }}>{rcv.id}</td>
                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {new Date(rcv.date).toLocaleString('es-DO')}
                </td>
                <td style={{ padding: '16px 20px', fontWeight: 500, color: 'var(--text-primary)' }}>{rcv.supplier}</td>
                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                  <span style={{ background: 'var(--bg-app)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600 }}>
                    {rcv.items} productos
                  </span>
                </td>
                <td style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--accent-primary)' }}>
                  ${rcv.totalCost.toLocaleString()}
                </td>
                <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={12} color="var(--text-muted)" />
                  </div>
                  {rcv.user}
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                    Detalles <ArrowRight size={14} style={{ marginLeft: '4px' }} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredReceivings.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No hay recepciones registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Receivings;
