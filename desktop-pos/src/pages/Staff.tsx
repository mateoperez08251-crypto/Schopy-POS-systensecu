import React, { useState, useEffect } from 'react';
import { Search, Plus, Shield, User, Trash2, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribeToStaffLocal, addStaffLocal, deleteStaffLocal } from '../firebase/localStaffService';
import { subscribeToMechanics, addMechanic, deleteMechanic } from '../firebase/localMechanicsService';

const StaffFormModal = ({ isOpen, onClose, onSubmit }: { isOpen: boolean, onClose: () => void, onSubmit: (data: any) => Promise<void> }) => {
  const [formData, setFormData] = useState({ name: '', pin: '', role: 'cashier' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.pin.trim().length > 0 && formData.pin.length !== 4) {
      setError('Si ingresas un PIN, debe tener exactamente 4 dígitos');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSubmit(formData);
      setFormData({ name: '', pin: '', role: 'cashier' });
      onClose();
    } catch (err: any) {
      setError(`Error: ${err.message || 'Desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '24px' }} onClick={onClose}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-medium)', background: 'var(--bg-app)' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Nuevo Usuario (Local)</h2>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
              {error}
            </div>
          )}
          
          <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Nombre Completo</label>
            <input 
              type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Ej. Juan Pérez"
              style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }} 
            />
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Rol</label>
            <select
              value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
              style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }}
            >
              <option value="cashier">Cajero</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>PIN de Acceso</label>
            <input 
              type="password" value={formData.pin} onChange={e => setFormData({...formData, pin: e.target.value.replace(/\D/g, '').slice(0, 4)})}
              placeholder="4 dígitos numéricos (Opcional)"
              style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }} 
            />
          </div>

          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const MechanicFormModal = ({ isOpen, onClose, onSubmit }: { isOpen: boolean, onClose: () => void, onSubmit: (data: any) => Promise<void> }) => {
  const [formData, setFormData] = useState({ name: '', commissionRate: 5 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onSubmit(formData);
      setFormData({ name: '', commissionRate: 5 });
      onClose();
    } catch (err: any) {
      setError(`Error: ${err.message || 'Desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '24px' }} onClick={onClose}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-medium)', background: 'var(--bg-app)' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Nuevo Mecánico</h2>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
              {error}
            </div>
          )}
          
          <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Nombre del Mecánico</label>
            <input 
              type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Ej. Pedro Mecánico"
              style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }} 
            />
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Comisión por Servicio (%)</label>
            <input 
              type="number" min="0" max="100" required value={formData.commissionRate} onChange={e => setFormData({...formData, commissionRate: Number(e.target.value)})}
              onWheel={(e) => e.currentTarget.blur()}
              placeholder="Ej. 10"
              style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }} 
            />
          </div>

          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Mecánico'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


const Staff = ({ showToast }: { showToast?: (m: string, t?: 'success'|'error'|'info') => void }) => {
  const { userData, companyId } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isMechanicModalOpen, setIsMechanicModalOpen] = useState(false);
  
  const [staffList, setStaffList] = useState<any[]>([]);
  const [mechanicsList, setMechanicsList] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<'staff' | 'mechanics'>('staff');

  useEffect(() => {
    if (!companyId) return;
    const unsubStaff = subscribeToStaffLocal(companyId, (items) => setStaffList(items));
    const unsubMechanics = subscribeToMechanics(companyId, (items) => setMechanicsList(items));
    return () => {
      unsubStaff();
      unsubMechanics();
    };
  }, [companyId]);

  const handleAddStaff = async (data: any) => {
    try {
      if (!companyId) throw new Error('No hay empresa conectada');
      await addStaffLocal(companyId, data);
      if (showToast) showToast('Usuario registrado exitosamente', 'success');
    } catch (error: any) {
      throw error; 
    }
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (window.confirm(`¿Eliminar al usuario ${name}?`)) {
      try {
        await deleteStaffLocal(id);
        if (showToast) showToast('Usuario eliminado', 'info');
      } catch (error: any) {
        if (showToast) showToast(`Error al eliminar: ${error.message}`, 'error');
      }
    }
  };

  const handleAddMechanic = async (data: any) => {
    try {
      if (!companyId) throw new Error('No hay empresa conectada');
      await addMechanic(companyId, data);
      if (showToast) showToast('Mecánico registrado exitosamente', 'success');
    } catch (error: any) {
      throw error;
    }
  };

  const handleDeleteMechanic = async (id: string, name: string) => {
    if (window.confirm(`¿Eliminar al mecánico ${name}?`)) {
      try {
        await deleteMechanic(id);
        if (showToast) showToast('Mecánico eliminado', 'info');
      } catch (error: any) {
        if (showToast) showToast(`Error al eliminar: ${error.message}`, 'error');
      }
    }
  };

  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredMechanics = mechanicsList.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Shield size={28} color="var(--accent-primary)" /> Gestión de Personal
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Administra usuarios locales y mecánicos</p>
        </div>
        {userData?.role === 'admin' && (
          <button 
            className="btn btn-primary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={() => activeTab === 'staff' ? setIsStaffModalOpen(true) : setIsMechanicModalOpen(true)}
          >
            <Plus size={18} /> {activeTab === 'staff' ? 'Nuevo Usuario' : 'Nuevo Mecánico'}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid var(--border-medium)' }}>
        <button 
          onClick={() => setActiveTab('staff')}
          style={{ 
            padding: '12px 24px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'staff' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: activeTab === 'staff' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'staff' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <User size={18} /> Cajeros / Admins
        </button>
        <button 
          onClick={() => setActiveTab('mechanics')}
          style={{ 
            padding: '12px 24px', 
            background: 'none', 
            border: 'none', 
            borderBottom: activeTab === 'mechanics' ? '2px solid var(--accent-primary)' : '2px solid transparent',
            color: activeTab === 'mechanics' ? 'var(--accent-primary)' : 'var(--text-secondary)',
            fontWeight: activeTab === 'mechanics' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Wrench size={18} /> Mecánicos
        </button>
      </div>

      <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <div style={{ 
            position: 'absolute', left: 0, top: 0, bottom: 0, width: '48px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Search size={20} color="var(--text-muted)" />
          </div>
          <input 
            type="text" 
            placeholder={`Buscar ${activeTab === 'staff' ? 'usuarios' : 'mecánicos'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', padding: '16px 20px 16px 48px', 
              fontSize: '1rem', color: 'var(--text-primary)', 
              background: 'var(--bg-card)', 
              border: '1px solid var(--border-light)', 
              borderRadius: '12px',
              outline: 'none',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {activeTab === 'staff' && (
          filteredStaff.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No se encontró personal registrado.
            </div>
          ) : (
            filteredStaff.map(staff => (
              <div key={staff.id} className="card animate-item" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {staff.role === 'admin' ? <Shield size={24} color="#f59e0b" /> : <User size={24} color="var(--accent-primary)" />}
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{staff.name}</h3>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: staff.role === 'admin' ? '#f59e0b' : 'var(--accent-primary)', background: 'var(--bg-app)', padding: '2px 8px', borderRadius: '12px', display: 'inline-block', marginTop: '4px' }}>
                        {staff.role === 'admin' ? 'Administrador' : 'Cajero'}
                      </span>
                    </div>
                    {userData?.role === 'admin' && staff.id !== userData.id && (
                      <button 
                        onClick={() => handleDeleteStaff(staff.id, staff.name)}
                        style={{ 
                          background: 'none', border: 'none', color: 'var(--accent-danger)', 
                          cursor: 'pointer', padding: '8px', borderRadius: '8px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="Eliminar Usuario"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )
        )}

        {activeTab === 'mechanics' && (
          filteredMechanics.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No se encontraron mecánicos registrados.
            </div>
          ) : (
            filteredMechanics.map(mechanic => (
              <div key={mechanic.id} className="card animate-item" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="flex-between" style={{ alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Wrench size={24} color="var(--accent-success)" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{mechanic.name}</h3>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-success)', background: 'var(--bg-app)', padding: '2px 8px', borderRadius: '12px', display: 'inline-block', marginTop: '4px' }}>
                        Comisión: {mechanic.commissionRate}%
                      </span>
                    </div>
                    {userData?.role === 'admin' && (
                      <button 
                        onClick={() => handleDeleteMechanic(mechanic.id, mechanic.name)}
                        style={{ 
                          background: 'none', border: 'none', color: 'var(--accent-danger)', 
                          cursor: 'pointer', padding: '8px', borderRadius: '8px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="Eliminar Mecánico"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>

      <StaffFormModal 
        isOpen={isStaffModalOpen} 
        onClose={() => setIsStaffModalOpen(false)} 
        onSubmit={handleAddStaff} 
      />

      <MechanicFormModal
        isOpen={isMechanicModalOpen}
        onClose={() => setIsMechanicModalOpen(false)}
        onSubmit={handleAddMechanic}
      />
    </div>
  );
};

export default Staff;
