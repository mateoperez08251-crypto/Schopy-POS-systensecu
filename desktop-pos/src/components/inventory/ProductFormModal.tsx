import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Barcode, RefreshCw } from 'lucide-react';
import SupplierSelect from '../suppliers/SupplierSelect';
import { generateUniqueBarcode } from '../../utils/barcodeUtils';
import { createScanDetector } from '../../utils/scanDetector';
import { useBusiness } from '../../context/BusinessContext';
import { getCategoriesStorageKey, predictCategory } from '../../config/businessTypes';

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
  onSave: (product: any) => Promise<boolean | void> | boolean | void;
  initialData?: Product | null;
  suppliers?: any[];
  existingCodes?: string[];
  onOpenBarcodeModal?: (productDraft: any) => void;
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, onSave, initialData, suppliers = [], existingCodes = [], onOpenBarcodeModal }) => {
  const { config } = useBusiness();
  const categoriesKey = getCategoriesStorageKey(config.id);
  const productLabel = config.labels.product;
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Product>({
    name: '',
    code: '',
    referenceCode: '',
    category: config.defaultCategories[0],
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
    const savedCats = localStorage.getItem(categoriesKey);
    let loadedCats = config.defaultCategories;
    if (savedCats) {
      try {
        loadedCats = JSON.parse(savedCats);
      } catch (e) {}
    } else {
      localStorage.setItem(categoriesKey, JSON.stringify(config.defaultCategories));
    }
    setCategories(loadedCats);

    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        code: '',
        referenceCode: '',
        category: loadedCats.length > 0 ? loadedCats[0] : config.defaultCategories[0],
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

  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  // Con el formulario abierto, el lector llena el código sin importar dónde esté el cursor.
  useEffect(() => {
    if (!isOpen) return;
    const detector = createScanDetector();
    let formBeforeScan: Product | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.ctrlKey || e.altKey || e.metaKey) return;
      const { isFirstKey, code } = detector.push(e.key, e.timeStamp);
      if (isFirstKey) formBeforeScan = formDataRef.current;
      // Al editar un producto existente, un escaneo no debe cambiarle el código.
      if (code && formBeforeScan && !formBeforeScan.id) {
        e.preventDefault(); // Sin esto, el Enter del lector guardaría el producto.
        e.stopPropagation();
        // Volver al estado previo quita lo que el lector tecleó en el campo enfocado.
        setFormData({ ...formBeforeScan, code });
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const safeNum = (v: any, fallback = 0) => {
        if (v === '' || v === null || v === undefined) return fallback;
        const parsed = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
        return isNaN(parsed) ? fallback : parsed;
      };

      // Normalizar datos completos evitando campos undefined que rechazaría Firestore
      const normalizedProduct: any = {
        ...formData,
        name: (formData.name || '').trim(),
        code: (formData.code || '').trim(),
        referenceCode: (formData.referenceCode || '').trim(),
        category: formData.category || 'General',
        supplier: formData.supplier || '',
        price: safeNum(formData.price, 0),
        priceFrequent: safeNum(formData.priceFrequent, 0),
        priceWholesale: safeNum(formData.priceWholesale, 0),
        costPrice: safeNum(formData.costPrice, 0),
        stock: safeNum(formData.stock, 0),
        minStock: safeNum(formData.minStock, 5),
        expirationDate: formData.expirationDate || '',
        location: (formData.location || '').trim(),
        imageUrl: formData.imageUrl || '',
        unitsPerPackage: safeNum(formData.unitsPerPackage, 1)
      };

      if (formData.id) {
        normalizedProduct.id = formData.id;
      } else {
        delete normalizedProduct.id;
      }

      const result = await onSave(normalizedProduct);
      // Solo cerrar el modal si el guardado NO falló (evita que el usuario pierda lo que escribió)
      if (result !== false) {
        onClose();
      }
    } catch (err) {
      console.error("Error al procesar y guardar producto:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddCategory = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const updated = [...categories, newCategory.trim()];
      setCategories(updated);
      localStorage.setItem(categoriesKey, JSON.stringify(updated));
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
      localStorage.setItem(categoriesKey, JSON.stringify(updated));
      if (formData.category === catToRemove) {
        setFormData({...formData, category: updated[0] || ''});
      }
    }
  };

  const handleNameChange = (newName: string) => {
    setFormData({ ...formData, name: newName, category: predictCategory(config, newName, formData.category) });
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
            {initialData ? `Editar ${productLabel}` : `Nuevo ${productLabel}`}
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
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Nombre del {productLabel}</label>
              <input 
                type="text" 
                required
                value={formData.name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder={`Ej. ${config.labels.productExample}`}
                style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }} 
              />
            </div>

            {/* Código + Código Referencia + Categoría */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Código (SKU/Barras)</label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, code: generateUniqueBarcode(existingCodes, 'CODE128') })}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    title="Generar código único automáticamente"
                  >
                    <RefreshCw size={12} /> Generar
                  </button>
                </div>
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
              <SupplierSelect
                value={formData.supplier || ''}
                suppliers={suppliers}
                onChange={supplier => setFormData({...formData, supplier})}
              />
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
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{config.labels.wholesalePrice} ($)</label>
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
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-medium)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', background: 'var(--bg-app)' }}>
          <div>
            {onOpenBarcodeModal && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => onOpenBarcodeModal(formData)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)', fontWeight: 600 }}
                title="Abrir creador de etiquetas térmicas con este nombre y código"
              >
                <Barcode size={17} /> Etiqueta Térmica
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" form="product-form" className="btn btn-primary" disabled={isSubmitting} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={18} /> {isSubmitting ? 'Guardando...' : (initialData ? 'Guardar Cambios' : `Agregar ${productLabel}`)}
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default ProductFormModal;
