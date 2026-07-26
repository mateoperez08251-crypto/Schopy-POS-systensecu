import React, { useState } from 'react';
import { X, User, FileText, Phone, Mail, MapPin } from 'lucide-react';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    documentId: '',
    email: '',
    phone: '',
    address: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ name: '', documentId: '', email: '', phone: '', address: '' });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 9999
    }}>
      <div className="card animate-pop" style={{
        width: '100%', maxWidth: '600px', background: 'var(--bg-card)',
        borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        {/* Header con gradiente */}
        <div style={{
          background: 'linear-gradient(135deg, var(--accent-primary) 0%, #4F46E5 100%)',
          padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)'
            }}>
              <User size={24} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', margin: 0 }}>Nuevo Cliente</h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', marginTop: '4px' }}>Registra los datos del cliente</p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', width: '36px', height: '36px',
            borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'white', transition: 'all 0.2s'
          }} className="hover:bg-white/30">
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ padding: '32px' }}>
          <div style={{ display: 'grid', gap: '20px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Nombre Completo *
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    required type="text" placeholder="Ej. Juan Pérez"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    style={{
                      width: '100%', height: '50px', paddingLeft: '44px', paddingRight: '16px',
                      background: 'var(--bg-app)', border: '1px solid var(--border-medium)',
                      borderRadius: '12px', color: 'var(--text-primary)', outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border-medium)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Cédula / RNC *
                </label>
                <div style={{ position: 'relative' }}>
                  <FileText size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    required type="text" placeholder="000-0000000-0"
                    value={formData.documentId} onChange={e => setFormData({...formData, documentId: e.target.value})}
                    style={{
                      width: '100%', height: '50px', paddingLeft: '44px', paddingRight: '16px',
                      background: 'var(--bg-app)', border: '1px solid var(--border-medium)',
                      borderRadius: '12px', color: 'var(--text-primary)', outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border-medium)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Teléfono
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="tel" placeholder="809-000-0000"
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                    style={{
                      width: '100%', height: '50px', paddingLeft: '44px', paddingRight: '16px',
                      background: 'var(--bg-app)', border: '1px solid var(--border-medium)',
                      borderRadius: '12px', color: 'var(--text-primary)', outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border-medium)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Correo Electrónico
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="text" placeholder="cliente@correo.com (Opcional)"
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                    style={{
                      width: '100%', height: '50px', paddingLeft: '44px', paddingRight: '16px',
                      background: 'var(--bg-app)', border: '1px solid var(--border-medium)',
                      borderRadius: '12px', color: 'var(--text-primary)', outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'; }}
                    onBlur={e => { e.target.style.borderColor = 'var(--border-medium)'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Dirección
              </label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '20px' }} />
                <textarea 
                  placeholder="Dirección completa del cliente..." rows={3}
                  value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                  style={{
                    width: '100%', padding: '16px 16px 16px 44px',
                    background: 'var(--bg-app)', border: '1px solid var(--border-medium)',
                    borderRadius: '12px', color: 'var(--text-primary)', outline: 'none',
                    transition: 'all 0.2s', resize: 'none'
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border-medium)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>
            
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px' }}>
            <button type="button" onClick={onClose} style={{
              padding: '0 24px', height: '48px', borderRadius: '12px',
              background: 'var(--bg-app)', border: '1px solid var(--border-medium)',
              color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer'
            }}>
              Cancelar
            </button>
            <button type="submit" style={{
              padding: '0 24px', height: '48px', borderRadius: '12px',
              background: 'var(--accent-primary)', border: 'none',
              color: 'white', fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}>
              Guardar Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerFormModal;
