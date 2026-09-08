import React, { useState } from 'react';
import { Search, Plus, Filter, MoreVertical, Building2, Mail, Phone, MapPin, Truck } from 'lucide-react';
import SupplierFormModal from '../components/suppliers/SupplierFormModal';

const Suppliers = ({ suppliers, setSuppliers, showToast }: { suppliers: any[], setSuppliers: (sups: any[]) => void, showToast?: (m: string, t?: 'success'|'error') => void }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleAddSupplier = (data: any) => {
    const newSupplier = {
      id: suppliers.length + 1,
      name: data.name,
      contact: data.contact,
      phone: data.phone,
      email: data.email,
      category: data.category,
      status: 'Activo',
      pendingBalance: 0
    };
    setSuppliers([...suppliers, newSupplier]);
    if (showToast) showToast('Proveedor agregado exitosamente', 'success');
    setIsModalOpen(false);
  };

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Truck size={28} color="var(--accent-primary)" /> Directorio de Proveedores
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Gestiona las empresas que suplen mercancía a tu negocio</p>
        </div>
        <button 
          className="btn btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={18} /> Nuevo Proveedor
        </button>
      </div>

      <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <div style={{ 
            position: 'absolute', left: 0, top: 0, bottom: 0, width: '48px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px'
          }}>
            <Search size={20} color="var(--text-muted)" />
          </div>
          <input 
            type="text" 
            placeholder="Buscar proveedor por empresa o contacto (Ej. Corripio)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', padding: '16px 20px 16px 48px', 
              fontSize: '1rem', color: 'var(--text-primary)', 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-light)', 
              borderRadius: '12px',
              outline: 'none',
              boxShadow: searchTerm ? '0 0 0 2px var(--accent-primary)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => e.target.style.boxShadow = '0 0 0 2px var(--accent-primary), 0 0 20px rgba(79, 70, 229, 0.15)'}
            onBlur={(e) => e.target.style.boxShadow = searchTerm ? '0 0 0 2px var(--accent-primary)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'}
          />
          <div style={{ 
            position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)',
            display: 'flex', gap: '4px'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-app)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>Ctrl</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-app)', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>F</span>
          </div>
        </div>
        
        <button 
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            padding: '0 24px', height: '54px',
            background: 'var(--bg-card)', border: '1px solid var(--border-light)', 
            borderRadius: '12px', color: 'var(--text-primary)',
            fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--accent-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
        >
          <Filter size={20} /> Filtros Avanzados
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {filteredSuppliers.map(supplier => (
          <div key={supplier.id} className="card animate-item" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="flex-between" style={{ alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Building2 size={24} color="var(--accent-primary)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{supplier.name}</h3>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: supplier.status === 'Activo' ? 'var(--accent-success)' : 'var(--text-muted)', background: 'var(--bg-app)', padding: '2px 8px', borderRadius: '12px', display: 'inline-block', marginTop: '4px' }}>
                    {supplier.status}
                  </span>
                </div>
              </div>
              <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <MoreVertical size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '20px' }}><Mail size={14} /></div>
                <span>{supplier.email}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '20px' }}><Phone size={14} /></div>
                <span>{supplier.phone}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '20px' }}><MapPin size={14} /></div>
                <span>Contacto: {supplier.contact}</span>
              </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Deuda Pendiente</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: supplier.pendingBalance > 0 ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
                  ${supplier.pendingBalance.toLocaleString()}
                </p>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', background: 'var(--bg-app)', padding: '4px 10px', borderRadius: '6px' }}>
                {supplier.category}
              </span>
            </div>
          </div>
        ))}
      </div>

      <SupplierFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleAddSupplier} 
      />
    </div>
  );
};

export default Suppliers;
