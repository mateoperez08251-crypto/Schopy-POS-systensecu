import React, { useState } from 'react';
import { Search, Plus, Filter, MoreVertical, User, Mail, Phone, MapPin, Users, FileText } from 'lucide-react';
import CustomerFormModal from '../components/customers/CustomerFormModal';
import { useAuth } from '../context/AuthContext';
import { addCustomer, deleteCustomer } from '../firebase/customersService';

const Customers = ({ customers, showToast }: { customers: any[], setCustomers: (cust: any[]) => void, showToast?: (m: string, t?: 'success'|'error'|'info') => void }) => {
  const { userData } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [showFilters, setShowFilters] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const handleAddCustomer = async (data: any) => {
    if (!userData?.companyId) return;

    const newCustomer = {
      name: data.name,
      documentId: data.documentId,
      email: data.email,
      phone: data.phone,
      address: data.address,
      points: 0,
      status: 'Activo',
      registeredDate: new Date().toISOString().split('T')[0]
    };

    try {
      await addCustomer(userData.companyId, newCustomer);
      if (showToast) showToast('Cliente agregado exitosamente', 'success');
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      if (showToast) showToast('Error al agregar el cliente', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
      try {
        await deleteCustomer(id);
        if (showToast) showToast('Cliente eliminado', 'info');
      } catch (error) {
        console.error(error);
        if (showToast) showToast('Error al eliminar', 'error');
      }
      setActiveMenu(null);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.documentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === 'Todos' || c.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users size={28} color="var(--accent-primary)" /> Directorio de Clientes
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Gestiona los clientes registrados en tu negocio y su fidelización</p>
        </div>
        <button 
          className="btn btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={18} /> Nuevo Cliente
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
            placeholder="Buscar cliente por nombre o Cédula/RNC..." 
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
        </div>
        
        <div style={{ position: 'relative' }}>
          <button 
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', 
              padding: '0 24px', height: '54px',
              background: statusFilter !== 'Todos' ? 'var(--accent-primary)' : 'var(--bg-card)', 
              border: '1px solid',
              borderColor: statusFilter !== 'Todos' ? 'var(--accent-primary)' : 'var(--border-light)',
              borderRadius: '12px', color: statusFilter !== 'Todos' ? 'white' : 'var(--text-primary)',
              fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} /> {statusFilter !== 'Todos' ? statusFilter : 'Filtros'}
          </button>
          
          {showFilters && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: '8px',
              background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 10, width: '150px', overflow: 'hidden'
            }}>
              {['Todos', 'Activo', 'Inactivo'].map(status => (
                <div key={status} onClick={() => { setStatusFilter(status); setShowFilters(false); }}
                  style={{
                    padding: '12px 16px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 500,
                    color: statusFilter === status ? 'var(--accent-primary)' : 'var(--text-primary)',
                    background: statusFilter === status ? 'rgba(79, 70, 229, 0.05)' : 'transparent',
                    borderBottom: status !== 'Inactivo' ? '1px solid var(--border-light)' : 'none'
                  }}
                  className="hover:bg-[var(--bg-app)]"
                >
                  {status}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
        {filteredCustomers.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No se encontraron clientes con esos datos.
          </div>
        ) : (
          filteredCustomers.map(customer => (
            <div key={customer.id} className="card animate-item" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={24} color="var(--accent-primary)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{customer.name}</h3>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: customer.status === 'Activo' ? 'var(--accent-success)' : 'var(--text-muted)', background: 'var(--bg-app)', padding: '2px 8px', borderRadius: '12px', display: 'inline-block', marginTop: '4px' }}>
                      {customer.status}
                    </span>
                  </div>
                </div>
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setActiveMenu(activeMenu === customer.id ? null : customer.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <MoreVertical size={20} />
                  </button>
                  
                  {activeMenu === customer.id && (
                    <div style={{
                      position: 'absolute', top: '100%', right: 0, marginTop: '4px',
                      background: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-light)',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.1)', zIndex: 10, width: '120px', overflow: 'hidden'
                    }}>
                      <div 
                        onClick={() => {
                           if (showToast) showToast('Función de editar próximamente', 'info');
                           setActiveMenu(null);
                        }}
                        style={{ padding: '10px 16px', fontSize: '0.85rem', cursor: 'pointer', borderBottom: '1px solid var(--border-light)' }} className="hover:bg-[var(--bg-app)]"
                      >
                        Editar
                      </div>
                      {userData?.role === 'admin' && (
                        <div 
                          onClick={() => handleDelete(customer.id)}
                          style={{ padding: '10px 16px', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--accent-danger)' }} className="hover:bg-[var(--bg-app)]"
                        >
                          Eliminar
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '20px' }}><FileText size={14} /></div>
                  <span>Doc: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{customer.documentId}</span></span>
                </div>
                {customer.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '20px' }}><Phone size={14} /></div>
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '20px' }}><Mail size={14} /></div>
                    <span>{customer.email}</span>
                  </div>
                )}
                {customer.address && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '20px' }}><MapPin size={14} /></div>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{customer.address}</span>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Puntos de Fidelidad</p>
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
                    {customer.points.toLocaleString()} pts
                  </p>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Desde {new Date(customer.registeredDate).toLocaleDateString('es-DO')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <CustomerFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleAddCustomer} 
      />
    </div>
  );
};

export default Customers;
