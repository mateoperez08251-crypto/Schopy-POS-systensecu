import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save } from 'lucide-react';

interface Product {
  id?: string;
  name: string;
  code: string;
  category: string;
  supplier: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  expirationDate?: string;
  location?: string;
  imageUrl?: string;
  unitsPerPackage?: number;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  initialData?: Product | null;
}

const CATEGORIES = ['Bebidas', 'Snacks', 'Abarrotes', 'Limpieza', 'Electrónica'];

const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [formData, setFormData] = useState<Product>({
    name: '',
    code: '',
    category: 'Abarrotes',
    supplier: '',
    price: 0,
    costPrice: 0,
    stock: 0,
    minStock: 20,
    expirationDate: '',
    location: '',
    imageUrl: '',
    unitsPerPackage: 1
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        code: '',
        category: 'Abarrotes',
        supplier: '',
        price: 0,
        costPrice: 0,
        stock: 0,
        minStock: 20,
        expirationDate: '',
        location: '',
        imageUrl: '',
        unitsPerPackage: 1
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleNameChange = (newName: string) => {
    let predictedCategory = formData.category;
    const lowerName = newName.toLowerCase();

    // Diccionario de heurísticas (Nivel 1 de Inteligencia)
    if (lowerName.includes('cola') || lowerName.includes('agua') || lowerName.includes('jugo') || lowerName.includes('refresco')) {
      predictedCategory = 'Bebidas';
    } else if (lowerName.includes('papas') || lowerName.includes('sabritas') || lowerName.includes('galleta') || lowerName.includes('doritos')) {
      predictedCategory = 'Snacks';
    } else if (lowerName.includes('jabon') || lowerName.includes('cloro') || lowerName.includes('limpiador')) {
      predictedCategory = 'Limpieza';
    } else if (lowerName.includes('cable') || lowerName.includes('audifonos') || lowerName.includes('pila')) {
      predictedCategory = 'Electrónica';
    } else if (lowerName.includes('atun') || lowerName.includes('arroz') || lowerName.includes('frijol') || lowerName.includes('sopa')) {
      predictedCategory = 'Abarrotes';
    }

    setFormData({...formData, name: newName, category: predictedCategory});
  };

  return createPortal(
    <div className="checkout-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '24px' }} onClick={onClose}>
      <div className="card" style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-medium)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-app)' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
            {initialData ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button className="btn btn-outline" onClick={onClose} style={{ padding: '6px', border: 'none' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body (Formulario) */}
        <div style={{ padding: '24px', overflowY: 'auto', maxHeight: '70vh' }}>
          <form id="product-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Nombre del Producto */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Nombre del Producto</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="Ej. Refresco Cola 2L"
                style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }} 
              />
            </div>

            {/* Código + Categoría */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Código de Barras</label>
                <input 
                  type="text" 
                  required
                  value={formData.code}
                  onChange={e => setFormData({...formData, code: e.target.value})}
                  placeholder="Escanea o escribe"
                  style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }} 
                />
              </div>
              
              {/* Custom Category Dropdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Categoría</label>
                <div 
                  onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                  style={{ 
                    background: 'var(--bg-app)', 
                    border: isCategoryOpen ? '1px solid var(--accent-primary)' : '1px solid var(--border-medium)', 
                    color: 'var(--text-primary)', 
                    padding: '10px 12px', 
                    borderRadius: 'var(--radius-md)', 
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    userSelect: 'none'
                  }}
                >
                  <span>{formData.category}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isCategoryOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </div>

                {isCategoryOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 10,
                    overflow: 'hidden'
                  }}>
                    {CATEGORIES.map(cat => (
                      <div 
                        key={cat}
                        onClick={() => {
                          setFormData({...formData, category: cat});
                          setIsCategoryOpen(false);
                        }}
                        style={{
                          padding: '10px 12px',
                          cursor: 'pointer',
                          color: formData.category === cat ? 'var(--accent-primary)' : 'var(--text-primary)',
                          background: formData.category === cat ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (formData.category !== cat) {
                            e.currentTarget.style.background = 'var(--bg-app)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (formData.category !== cat) {
                            e.currentTarget.style.background = 'transparent';
                          }
                        }}
                      >
                        {cat}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Proveedor */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Proveedor / Suplidor</label>
              <input 
                type="text" 
                value={formData.supplier}
                onChange={e => setFormData({...formData, supplier: e.target.value})}
                placeholder="Nombre del proveedor"
                style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }} 
              />
            </div>

            {/* Precio de Costo + Precio de Venta */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Precio de Costo ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  value={formData.costPrice}
                  onChange={e => setFormData({...formData, costPrice: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                  style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Precio de Venta ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  required
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                  style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }} 
                />
              </div>
            </div>

            {/* Banner de Margen de Ganancia */}
            {formData.costPrice > 0 && formData.price > 0 && (() => {
              const margin = ((formData.price - formData.costPrice) / formData.price) * 100;
              const profit = formData.price - formData.costPrice;
              const isGood = margin >= 30;
              const isWarning = margin >= 15 && margin < 30;
              const color = isGood ? 'var(--accent-success)' : isWarning ? '#f59e0b' : 'var(--accent-danger)';
              return (
                <div style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: `${color}15`,
                  border: `1px solid ${color}40`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color }}>
                      Margen: {margin.toFixed(1)}%
                    </span>
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color }}>
                    +${profit.toFixed(2)} / unidad
                  </span>
                </div>
              );
            })()}

            {/* Stock + Stock Mínimo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Stock Inicial (Cant.)</label>
                <input 
                  type="number" 
                  min="0"
                  value={formData.stock}
                  onChange={e => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                  placeholder="0 (Opcional)"
                  style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Stock Mínimo (Alerta)</label>
                <input 
                  type="number" 
                  min="0"
                  value={formData.minStock}
                  onChange={e => setFormData({...formData, minStock: parseInt(e.target.value) || 0})}
                  placeholder="20"
                  style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }} 
                />
              </div>
            </div>

            {/* Configuración de Empaque */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Unidades por Empaque (Caja/Fardo)</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder="Ej. 24"
                  value={formData.unitsPerPackage || ''}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setFormData({...formData, unitsPerPackage: val ? parseInt(val) : 0});
                  }}
                  style={{ width: '120px', background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }} 
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  (Útil para multiplicar entradas al recibir cajas)
                </span>
              </div>
            </div>

            {/* Fecha Caducidad + Ubicación */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Fecha de Caducidad</label>
                <input 
                  type="date" 
                  value={formData.expirationDate || ''}
                  onChange={e => setFormData({...formData, expirationDate: e.target.value})}
                  style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Ubicación (Pasillo)</label>
                <input 
                  type="text" 
                  value={formData.location || ''}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  placeholder="Ej. Pasillo 3, Estante B"
                  style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }} 
                />
              </div>
            </div>

            {/* URL de Imagen */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Imagen del Producto (URL)</label>
              <input 
                type="url" 
                value={formData.imageUrl || ''}
                onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                placeholder="https://ejemplo.com/imagen.jpg"
                style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }} 
              />
              {formData.imageUrl && (
                <div style={{ marginTop: '8px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-light)', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
                  <img 
                    src={formData.imageUrl} 
                    alt="Preview" 
                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>

          </form>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-medium)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--bg-app)' }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="product-form" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={18} /> {initialData ? 'Guardar Cambios' : 'Agregar Producto'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default ProductFormModal;
