import React, { useState, useEffect } from 'react';
import { X, Building2, User, Phone, Mail, Tag, Save, FileText } from 'lucide-react';

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

const SupplierFormModal: React.FC<SupplierFormModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    rnc: '',
    contact: '',
    phone: '',
    email: '',
    category: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
      } else {
        setFormData({
          name: '',
          rnc: '',
          contact: '',
          phone: '',
          email: '',
          category: ''
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '20px'
    }}>
      <div className="card" style={{
        width: '100%', maxWidth: '600px', backgroundColor: 'var(--bg-card)',
        borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        display: 'flex', flexDirection: 'column', animation: 'scaleIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px', borderBottom: '1px solid var(--border-light)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          background: 'linear-gradient(to right, rgba(79, 70, 229, 0.05), transparent)',
          borderTopLeftRadius: '16px', borderTopRightRadius: '16px'
        }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ 
              width: '48px', height: '48px', borderRadius: '12px', 
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, #4338ca 100%)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
            }}>
              <Building2 size={24} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Nuevo Proveedor</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Registra una nueva empresa en tu directorio
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'var(--bg-app)', border: 'none', width: '32px', height: '32px',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text-muted)'
          }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Nombre de la Empresa</label>
              <div style={{ position: 'relative' }}>
                <Building2 size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                <input type="text" placeholder="Ej. Distribuidora Corripio" 
                  style={{ 
                    width: '100%', height: '54px', paddingLeft: '48px', paddingRight: '16px',
                    backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-light)',
                    borderRadius: '12px', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', outline: 'none', position: 'relative'
                  }}
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
                  onFocus={(e) => {
                    e.target.style.boxShadow = '0 0 0 2px var(--accent-primary), 0 0 20px rgba(79, 70, 229, 0.15)';
                    e.target.style.borderColor = 'var(--accent-primary)';
                    e.target.style.backgroundColor = 'var(--bg-card)';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'none';
                    e.target.style.borderColor = 'var(--border-light)';
                    e.target.style.backgroundColor = 'var(--bg-app)';
                  }}
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>RNC / Cédula</label>
              <div style={{ position: 'relative' }}>
                <FileText size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                <input type="text" placeholder="Ej. 130000000" 
                  style={{ 
                    width: '100%', height: '54px', paddingLeft: '48px', paddingRight: '16px',
                    backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-light)',
                    borderRadius: '12px', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', outline: 'none', position: 'relative'
                  }}
                  value={formData.rnc} onChange={e => setFormData({...formData, rnc: e.target.value})} 
                  onFocus={(e) => {
                    e.target.style.boxShadow = '0 0 0 2px var(--accent-primary), 0 0 20px rgba(79, 70, 229, 0.15)';
                    e.target.style.borderColor = 'var(--accent-primary)';
                    e.target.style.backgroundColor = 'var(--bg-card)';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'none';
                    e.target.style.borderColor = 'var(--border-light)';
                    e.target.style.backgroundColor = 'var(--bg-app)';
                  }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Nombre del Contacto</label>
              <div style={{ position: 'relative' }}>
                <User size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                <input type="text" placeholder="Ej. Juan Pérez" 
                  style={{ 
                    width: '100%', height: '54px', paddingLeft: '48px', paddingRight: '16px',
                    backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-light)',
                    borderRadius: '12px', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', outline: 'none', position: 'relative'
                  }}
                  value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})}
                  onFocus={(e) => {
                    e.target.style.boxShadow = '0 0 0 2px var(--accent-primary), 0 0 20px rgba(79, 70, 229, 0.15)';
                    e.target.style.borderColor = 'var(--accent-primary)';
                    e.target.style.backgroundColor = 'var(--bg-card)';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'none';
                    e.target.style.borderColor = 'var(--border-light)';
                    e.target.style.backgroundColor = 'var(--bg-app)';
                  }}
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Categoría Principal</label>
              <div style={{ position: 'relative' }}>
                <Tag size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                <input 
                  type="text"
                  list="category-options"
                  placeholder="Ej. Abarrotes"
                  style={{ 
                    width: '100%', height: '54px', paddingLeft: '48px', paddingRight: '16px',
                    backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-light)',
                    borderRadius: '12px', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', outline: 'none', position: 'relative'
                  }}
                  value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                  onFocus={(e) => {
                    e.target.style.boxShadow = '0 0 0 2px var(--accent-primary), 0 0 20px rgba(79, 70, 229, 0.15)';
                    e.target.style.borderColor = 'var(--accent-primary)';
                    e.target.style.backgroundColor = 'var(--bg-card)';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'none';
                    e.target.style.borderColor = 'var(--border-light)';
                    e.target.style.backgroundColor = 'var(--bg-app)';
                    
                    if (formData.category) {
                      const val = formData.category.trim();
                      const formatted = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
                      setFormData({...formData, category: formatted});
                    }
                  }}
                />
                <datalist id="category-options">
                  <option value="Abarrotes" />
                  <option value="Bebidas" />
                  <option value="Electrodomésticos" />
                  <option value="Embutidos" />
                  <option value="Limpieza" />
                  <option value="Tecnología" />
                  <option value="Otros" />
                </datalist>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Teléfono</label>
              <div style={{ position: 'relative' }}>
                <Phone size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                <input type="tel" placeholder="(000) 000-0000" 
                  style={{ 
                    width: '100%', height: '54px', paddingLeft: '48px', paddingRight: '16px',
                    backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-light)',
                    borderRadius: '12px', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', outline: 'none', position: 'relative'
                  }}
                  value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} 
                  onFocus={(e) => {
                    e.target.style.boxShadow = '0 0 0 2px var(--accent-primary), 0 0 20px rgba(79, 70, 229, 0.15)';
                    e.target.style.borderColor = 'var(--accent-primary)';
                    e.target.style.backgroundColor = 'var(--bg-card)';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'none';
                    e.target.style.borderColor = 'var(--border-light)';
                    e.target.style.backgroundColor = 'var(--bg-app)';
                  }}
                />
              </div>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Correo Electrónico</label>
              <div style={{ position: 'relative' }}>
                <Mail size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                <input type="email" placeholder="contacto@empresa.com" 
                  style={{ 
                    width: '100%', height: '54px', paddingLeft: '48px', paddingRight: '16px',
                    backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-light)',
                    borderRadius: '12px', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', outline: 'none', position: 'relative'
                  }}
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} 
                  onFocus={(e) => {
                    e.target.style.boxShadow = '0 0 0 2px var(--accent-primary), 0 0 20px rgba(79, 70, 229, 0.15)';
                    e.target.style.borderColor = 'var(--accent-primary)';
                    e.target.style.backgroundColor = 'var(--bg-card)';
                  }}
                  onBlur={(e) => {
                    e.target.style.boxShadow = 'none';
                    e.target.style.borderColor = 'var(--border-light)';
                    e.target.style.backgroundColor = 'var(--bg-app)';
                  }}
                />
              </div>
            </div>
          </div>
          
        </div>

        {/* Footer */}
        <div style={{
          padding: '24px', borderTop: '1px solid var(--border-light)',
          display: 'flex', justifyContent: 'flex-end', gap: '12px',
          backgroundColor: 'var(--bg-app)', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px'
        }}>
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => onSubmit(formData)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={18} /> Guardar Proveedor
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplierFormModal;
