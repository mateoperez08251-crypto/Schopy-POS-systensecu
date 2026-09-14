import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save } from 'lucide-react';

export interface Product {
  id?: string;
  name: string;
  code: string;
  referenceCode?: string;
  category: string;
  supplier: string;
  price: number | ''; // Permite vacío
  priceFrequent: number | '';
  priceWholesale: number | '';
  costPrice: number | '';
  stock: number | '';
  minStock: number | '';
  expirationDate?: string;
  location?: string;
  imageUrl?: string;
  unitsPerPackage?: number | '';
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: any) => void;
  initialData?: Product | null;
  suppliers?: any[];
}

const DEFAULT_CATEGORIES = ['Frenos', 'Suspensión y Dirección', 'Motor', 'Eléctrico', 'Líquidos y Lubricantes', 'Accesorios', 'Gomas', 'Tubos'];

const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, onSave, initialData, suppliers = [] }) => {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');

  const [formData, setFormData] = useState<Product>({
    name: '',
    code: '',
    referenceCode: '',
    category: 'Frenos',
    supplier: '',
    price: '',
    priceFrequent: '',
    priceWholesale: '',
    costPrice: '',
    stock: '',
    minStock: 5,
    expirationDate: '',
    location: '',
    imageUrl: '',
    unitsPerPackage: 1
  });

  useEffect(() => {
    const savedCats = localStorage.getItem('inventoryCategories');
    let loadedCats = DEFAULT_CATEGORIES;
    if (savedCats) {
      try {
        loadedCats = JSON.parse(savedCats);
      } catch (e) {}
    } else {
      localStorage.setItem('inventoryCategories', JSON.stringify(DEFAULT_CATEGORIES));
    }
    setCategories(loadedCats);

    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        code: '',
        referenceCode: '',
        category: loadedCats.length > 0 ? loadedCats[0] : 'Frenos',
        supplier: '',
        price: '',
        priceFrequent: '',
        priceWholesale: '',
        costPrice: '',
        stock: '',
        minStock: 5,
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
    
    // Normalizar datos (vacío -> 0)
    const normalizedProduct = {
      ...formData,
      referenceCode: formData.referenceCode || '',
      price: Number(formData.price) || 0,
      priceFrequent: Number(formData.priceFrequent) || 0,
      priceWholesale: Number(formData.priceWholesale) || 0,
      costPrice: Number(formData.costPrice) || 0,
      stock: Number(formData.stock) || 0,
      minStock: Number(formData.minStock) || 0,
      unitsPerPackage: Number(formData.unitsPerPackage) || 1
    };

    onSave(normalizedProduct);
    onClose();
  };

  const handleAddCategory = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const updated = [...categories, newCategory.trim()];
      setCategories(updated);
      localStorage.setItem('inventoryCategories', JSON.stringify(updated));
      setFormData({...formData, category: newCategory.trim()});
      setNewCategory('');
      setIsCategoryOpen(false);
    }
  };

  const handleDeleteCategory = (e: React.MouseEvent, catToRemove: string) => {
    e.stopPropagation();
    if (window.confirm(`¿Eliminar la categoría "${catToRemove}"?`)) {
      const updated = categories.filter(c => c !== catToRemove);
      setCategories(updated);
      localStorage.setItem('inventoryCategories', JSON.stringify(updated));
      if (formData.category === catToRemove) {
        setFormData({...formData, category: updated[0] || ''});
      }
    }
  };

  const handleNameChange = (newName: string) => {
    let predictedCategory = formData.category;
    const lowerName = newName.toLowerCase();

    // Heurísticas enfocadas en repuestos automotrices
    if (lowerName.includes('pastilla') || lowerName.includes('disco') || lowerName.includes('balata') || lowerName.includes('freno')) {
      predictedCategory = 'Frenos';
    } else if (lowerName.includes('amortiguador') || lowerName.includes('rotula') || lowerName.includes('buje')) {
      predictedCategory = 'Suspensión y Dirección';
    } else if (lowerName.includes('bujia') || lowerName.includes('piston') || lowerName.includes('correa') || lowerName.includes('valvula')) {
      predictedCategory = 'Motor';
    } else if (lowerName.includes('aceite') || lowerName.includes('refrigerante') || lowerName.includes('anticongelante')) {
      predictedCategory = 'Líquidos y Lubricantes';
    } else if (lowerName.includes('foco') || lowerName.includes('bateria') || lowerName.includes('alternador') || lowerName.includes('sensor')) {
      predictedCategory = 'Eléctrico';
    }

    setFormData({...formData, name: newName, category: predictedCategory});
  };

  const parseNumberInput = (value: string) => {
    if (value === '') return '';
    return parseFloat(value);
  };

  return createPortal(
    <div className="checkout-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '24px' }} onClick={onClose}>
      <div className="card" style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-medium)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-app)' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
            {initialData ? 'Editar Repuesto' : 'Nuevo Repuesto'}
          </h2>
          <button type="button" className="btn btn-outline" onClick={onClose} style={{ padding: '6px', border: 'none' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body (Formulario) */}
        <div style={{ padding: '24px', overflowY: 'auto', maxHeight: '70vh' }}>
          <form id="product-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Nombre del Producto */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Nombre del Repuesto</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="Ej. Pastillas de Freno Cerámicas"
                style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }} 
              />
            </div>

            {/* Código + Código Referencia + Categoría */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Código (SKU/Barras)</label>
                <input 
                  type="text" 
                  required
                  value={formData.code}
                  onChange={e => setFormData({...formData, code: e.target.value})}
                  placeholder="Escanea o escribe"
                  style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }} 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Cód. Referencia (Opcional)</label>
                <input 
                  type="text" 
                  value={formData.referenceCode || ''}
                  onChange={e => setFormData({...formData, referenceCode: e.target.value})}
                  placeholder="Ej. OEM-12345"
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
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{formData.category}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isCategoryOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
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
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {categories.map(cat => (
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
                            transition: 'background 0.2s',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                          onMouseEnter={(e) => {
                            if (formData.category !== cat) e.currentTarget.style.background = 'var(--bg-app)';
                          }}
                          onMouseLeave={(e) => {
                            if (formData.category !== cat) e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat}</span>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCategory(e, cat)}
                            style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                            title="Eliminar categoría"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: '8px', borderTop: '1px solid var(--border-medium)', display: 'flex', gap: '8px' }}>
                      <input 
                        type="text" 
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Nueva categoría..."
                        style={{ flex: 1, background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '6px 8px', borderRadius: '4px', outline: 'none', fontSize: '0.8rem' }}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCategory(e as any);
                          }
                        }}
                      />
                      <button 
                        type="button"
                        onClick={handleAddCategory}
                        style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '4px', padding: '0 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Suplidor */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Suplidor / Proveedor (Opcional)</label>
              <select 
                value={formData.supplier || ''}
                onChange={e => setFormData({...formData, supplier: e.target.value})}
                style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }} 
              >
                <option value="">Seleccione un proveedor...</option>
                {suppliers.map(sup => (
                  <option key={sup.id} value={sup.name}>
                    {sup.name} {sup.rnc ? `(RNC: ${sup.rnc})` : ''} {sup.phone ? `- Tel: ${sup.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* PRECIOS Y COSTO */}
            <div style={{ padding: '16px', background: 'var(--bg-app)', borderRadius: '12px', border: '1px solid var(--border-medium)' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', color: 'var(--text-primary)' }}>Niveles de Precio</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Precio de Costo ($)</label>
                  <input 
                    type="number" step="0.01" min="0"
                    value={formData.costPrice}
                    onChange={e => setFormData({...formData, costPrice: parseNumberInput(e.target.value)})}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="0.00"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-primary)' }}>Precio Normal ($)</label>
                  <input 
                    type="number" step="0.01" min="0" required
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: parseNumberInput(e.target.value)})}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="0.00"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--accent-primary)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Cliente Frecuente ($)</label>
                  <input 
                    type="number" step="0.01" min="0"
                    value={formData.priceFrequent}
                    onChange={e => setFormData({...formData, priceFrequent: parseNumberInput(e.target.value)})}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="Opcional"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Mayorista / Talleres ($)</label>
                  <input 
                    type="number" step="0.01" min="0"
                    value={formData.priceWholesale}
                    onChange={e => setFormData({...formData, priceWholesale: parseNumberInput(e.target.value)})}
                    onWheel={(e) => e.currentTarget.blur()}
                    placeholder="Opcional"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }} 
                  />
                </div>
              </div>

              {/* Banner de Margen de Ganancia (respecto al normal) */}
              {typeof formData.costPrice === 'number' && typeof formData.price === 'number' && formData.costPrice > 0 && formData.price > 0 && (() => {
                const margin = ((formData.price - formData.costPrice) / formData.price) * 100;
                const profit = formData.price - formData.costPrice;
                const isGood = margin >= 30;
                const isWarning = margin >= 15 && margin < 30;
                const color = isGood ? 'var(--accent-success)' : isWarning ? '#f59e0b' : 'var(--accent-danger)';
                return (
                  <div style={{
                    marginTop: '16px',
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
                        Margen Normal: {margin.toFixed(1)}%
                      </span>
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color }}>
                      +${profit.toFixed(2)} / unidad
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Stock + Stock Mínimo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Stock Inicial (Cant.)</label>
                <input 
                  type="number" min="0"
                  value={formData.stock}
                  onChange={e => setFormData({...formData, stock: parseNumberInput(e.target.value)})}
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="0 (Libre)"
                  style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Stock Mínimo (Alerta)</label>
                <input 
                  type="number" min="0"
                  value={formData.minStock}
                  onChange={e => setFormData({...formData, minStock: parseNumberInput(e.target.value)})}
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="5"
                  style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }} 
                />
              </div>
            </div>

            {/* Ubicación */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Ubicación Física</label>
              <input 
                type="text" 
                value={formData.location || ''}
                onChange={e => setFormData({...formData, location: e.target.value})}
                placeholder="Ej. Pasillo 3, Estante B"
                style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }} 
              />
            </div>

          </form>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-medium)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--bg-app)' }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form="product-form" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Save size={18} /> {initialData ? 'Guardar Cambios' : 'Agregar Repuesto'}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default ProductFormModal;
