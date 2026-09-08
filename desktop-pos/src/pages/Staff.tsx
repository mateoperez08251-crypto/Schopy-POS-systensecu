import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, Shield, User, Mail, Calendar, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribeToStaff, createCashier, deleteCashier } from '../firebase/staffService';
import { createPortal } from 'react-dom';

const StaffFormModal = ({ isOpen, onClose, onSubmit }: { isOpen: boolean, onClose: () => void, onSubmit: (data: any) => Promise<void> }) => {
  const [formData, setFormData] = useState({ name: '', email: '', uid: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.uid.length < 5) {
      setError('El UID debe ser válido');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onSubmit(formData);
      setFormData({ name: '', email: '', uid: '' });
      onClose();
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este correo electrónico ya está en uso');
      } else {
        setError(`Ocurrió un error: ${err.message || 'Desconocido'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="checkout-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '24px' }} onClick={onClose}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-medium)', background: 'var(--bg-app)' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Nuevo Cajero</h2>
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
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Correo Electrónico</label>
            <input 
              type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
              placeholder="juan@tienda.com"
              style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }} 
            />
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>ID de Autenticación (UID de Firebase)</label>
            <input 
              type="text" required value={formData.uid} onChange={e => setFormData({...formData, uid: e.target.value})}
              placeholder="Ej. Yk3j8L... (Copiar desde Firebase Auth)"
              style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }} 
            />
          </div>

          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Cajero'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};


const Staff = ({ showToast }: { showToast?: (m: string, t?: 'success'|'error'|'info') => void }) => {
  const { userData } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);

  useEffect(() => {
    if (userData?.companyId) {
      const unsub = subscribeToStaff(userData.companyId, (items) => {
        setStaffList(items);
      }, (err) => {
        if (showToast) showToast('Error al cargar personal. Verifica las reglas de Firestore.', 'error');
      });
      return () => unsub();
    }
  }, [userData]);

  const handleAddCashier = async (data: any) => {
    // Si por alguna razón userData.companyId sigue sin llegar, forzamos el de por defecto
    const companyId = userData?.companyId || 'tienda_01';
    
    try {
      await createCashier(companyId, data.name, data.email, data.uid);
      if (showToast) showToast('Cajero registrado exitosamente', 'success');
    } catch (error: any) {
      console.error(error);
      if (showToast) showToast(`Error: ${error.message || 'No se pudo crear'}`, 'error');
      throw error; // Re-throw to be caught by the modal
    }
  };

  const handleDeleteCashier = async (uid: string) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este cajero? Esto le revocará el acceso al sistema.')) {
      try {
        await deleteCashier(uid);
        if (showToast) showToast('Cajero eliminado del sistema', 'info');
      } catch (error: any) {
        console.error(error);
        if (showToast) showToast(`Error al eliminar: ${error.message}`, 'error');
      }
    }
  };

  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div className="flex-between" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Shield size={28} color="var(--accent-primary)" /> Personal y Cajeros
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Gestiona los accesos y cajeros de tu empresa</p>
        </div>
        <button 
          className="btn btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          onClick={() => setIsModalOpen(true)}
        >
          <Plus size={18} /> Nuevo Cajero
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
            placeholder="Buscar por nombre o correo..." 
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
        {filteredStaff.length === 0 ? (
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
                  {userData?.role === 'admin' && staff.role !== 'admin' && (
                    <button 
                      onClick={() => handleDeleteCashier(staff.id)}
                      style={{ 
                        background: 'none', border: 'none', color: 'var(--accent-danger)', 
                        cursor: 'pointer', padding: '8px', borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}
                      title="Eliminar Cajero"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {staff.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '20px' }}><Mail size={14} /></div>
                    <span>{staff.email}</span>
                  </div>
                )}
                {staff.createdAt && !isNaN(new Date(staff.createdAt).getTime()) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '20px' }}><Calendar size={14} /></div>
                    <span>Creado el {new Date(staff.createdAt).toLocaleDateString('es-DO')}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <StaffFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleAddCashier} 
      />
    </div>
  );
};

export default Staff;
