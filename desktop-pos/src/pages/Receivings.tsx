import React, { useState } from 'react';
import { Search, Plus, Filter, PackagePlus, Calendar, ArrowRight, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
const INITIAL_RECEIVINGS = [
  { id: 'RCV-1001', date: '2026-07-25T09:30:00', supplier: 'Distribuidora Corripio', items: 4, totalCost: 12500, user: 'Admin' },
  { id: 'RCV-1002', date: '2026-07-24T14:15:00', supplier: 'Cervecería Nacional', items: 2, totalCost: 8300, user: 'Caja 1' },
  { id: 'RCV-1003', date: '2026-07-20T10:00:00', supplier: 'Mercasid', items: 15, totalCost: 45200, user: 'Admin' },
];

const Receivings = ({ suppliers }: { suppliers?: any[] }) => {
  const navigate = useNavigate();
  const [receivings, setReceivings] = useState(INITIAL_RECEIVINGS);
  const [searchTerm, setSearchTerm] = useState('');

  const handleAddReceiving = (data: any) => {
    const nextId = `RCV-${1000 + receivings.length + 1}`;
    
    const newReceiving = {
      id: nextId,
      date: new Date().toISOString(),
      supplier: data.supplier || 'Proveedor Desconocido',
      items: data.items?.length || 0,
      totalCost: data.totalCost || 0,
      user: 'Admin'
    };

    setReceivings([newReceiving, ...receivings]);
  };

  const filteredReceivings = receivings.filter(r => 
    r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <button className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} /> Filtrar Fecha
        </button>
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
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Receivings;
