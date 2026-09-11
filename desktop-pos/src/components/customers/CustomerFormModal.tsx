import React, { useState } from 'react';
import { X, User, FileText, Phone, Mail, MapPin } from 'lucide-react';
import { searchByRnc, searchByName } from '../../utils/rncLookup';
import Toast from '../Toast';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [isLoadingRnc, setIsLoadingRnc] = useState(false);
  const [isLoadingName, setIsLoadingName] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    documentId: '',
    email: '',
    phone: '',
    address: ''
  });

  const searchRNC = async (rncToSearch?: string) => {
    const targetRnc = rncToSearch || formData.documentId;
    if (!targetRnc || targetRnc.length < 9) return;
    setIsLoadingRnc(true);
    try {
      const result = await searchByRnc(targetRnc);
      if (result) {
        setFormData(prev => ({ ...prev, name: result.nombre_razon_social || result.nombre_comercial }));
      } else {
        setErrorMsg("No se encontró ningún contribuyente con ese RNC/Cédula.");
      }
    } catch (error) {
      setErrorMsg("Hubo un error al buscar el RNC.");
    } finally {
      setIsLoadingRnc(false);
    }
  };

  const searchName = async () => {
    if (!formData.name || formData.name.length < 3) {
      setErrorMsg("Por favor ingrese al menos 3 caracteres para buscar por nombre.");
      return;
    }
    setIsLoadingName(true);
    try {
      const result = await searchByName(formData.name);
      if (result) {
        setFormData(prev => ({ 
          ...prev, 
          documentId: result.cedula_rnc.replace(/[^0-9]/g, ''),
          name: result.nombre_razon_social || result.nombre_comercial || prev.name
        }));
      } else {
        setErrorMsg("No se encontró ningún RNC con ese nombre.");
      }
    } catch (error) {
      setErrorMsg("Hubo un error al buscar por nombre.");
    } finally {
      setIsLoadingName(false);
    }
  };

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
        <form onSubmit={handleSubmit} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>
          
          {errorMsg && (
            <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
              <Toast message={errorMsg} type="error" onClose={() => setErrorMsg(null)} />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
            {/* Nombre y Documento */}
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <span>Nombre Completo *</span>
                  <button 
                    onClick={searchName} 
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
                  >
                    {isLoadingName ? 'Buscando...' : 'Buscar RNC'}
                  </button>
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
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <span>Cédula / RNC *</span>
                  <button 
                    onClick={() => searchRNC()} 
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
                  >
                    {isLoadingRnc ? 'Buscando...' : 'Buscar'}
                  </button>
                </label>
                <div style={{ position: 'relative' }}>
                  <FileText size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    required type="text" placeholder="000-0000000-0"
                    value={formData.documentId} 
                    onChange={e => {
                      const val = e.target.value;
                      setFormData({...formData, documentId: val});
                      const clean = val.replace(/[^0-9]/g, '');
                      if (clean.length === 9 || clean.length === 11) {
                        // Debemos pasar el valor limpio a searchRNC si searchRNC no lee del formData actualizado inmediatamente.
                        // Wait, searchRNC uses formData.documentId. React state won't be updated yet.
                        // We call searchRNC(clean)
                        searchRNC(clean);
                      }
                    }}
                    style={{
                      width: '100%', height: '50px', paddingLeft: '44px', paddingRight: '16px',
                      background: 'var(--bg-app)', border: '1px solid var(--border-medium)',
                      borderRadius: '12px', color: 'var(--text-primary)', outline: 'none',
                      transition: 'all 0.2s',
                      opacity: isLoadingRnc ? 0.7 : 1
                    }}
                    onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'; }}
                    onBlur={e => { 
                      e.target.style.borderColor = 'var(--border-medium)'; 
                      e.target.style.boxShadow = 'none'; 
                      if(formData.documentId && formData.documentId.length >= 9 && !formData.name) {
                        searchRNC();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        searchRNC();
                      }
                    }}
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
