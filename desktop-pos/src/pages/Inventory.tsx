import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, Truck, Edit, Trash2, ChevronDown, AlertTriangle, FileSpreadsheet, Download, Barcode } from 'lucide-react';
import * as XLSX from 'xlsx';
import { smartSearch } from '../utils/searchEngine';
import ProductFormModal from '../components/inventory/ProductFormModal';
import ConfirmDeleteModal from '../components/inventory/ConfirmDeleteModal';
import ImportExcelModal from '../components/inventory/ImportExcelModal';
import { useAuth } from '../context/AuthContext';
import { useBusiness } from '../context/BusinessContext';
import { addInventoryItem, updateInventoryItem, deleteInventoryItem } from '../firebase/inventoryService';

// Pintar miles de filas a la vez traba la entrada a la pantalla; la búsqueda sigue cubriendo todo.
const ROWS_PER_PAGE = 100;

const Inventory = ({ inventory, suppliers, showToast }: { inventory: any[], setInventory: (inv: any[]) => void, suppliers?: any[], showToast?: (m: string, t?: 'success'|'error'|'info') => void }) => {
  const { userData, companyId, firebaseUser } = useAuth();
  const { config } = useBusiness();
  const navigate = useNavigate();
  const location = useLocation();
  const currentCompanyId = userData?.companyId || companyId || (firebaseUser as any)?.uid || 'local';
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierTerm, setSupplierTerm] = useState('');
  const [stockFilter, setStockFilter] = useState(''); // 'low' | 'ok' | ''
  const [expirationFilter, setExpirationFilter] = useState(''); // 'soon' | 'expired' | ''
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = [stockFilter, expirationFilter].filter(Boolean).length;
  
  // Estados para el Modal de Formulario
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  // Estados para el Modal de Confirmación de Eliminación
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any | null>(null);
  const [visibleRows, setVisibleRows] = useState(ROWS_PER_PAGE);

  React.useEffect(() => {
    setVisibleRows(ROWS_PER_PAGE);
  }, [searchTerm, supplierTerm, stockFilter, expirationFilter]);

  // Producto nuevo pedido desde la pantalla de códigos de barras
  React.useEffect(() => {
    const draft = (location.state as { newProductDraft?: any } | null)?.newProductDraft;
    if (!draft) return;
    setEditingProduct({
      name: draft.name,
      code: draft.code,
      referenceCode: '',
      category: config.defaultCategories[0],
      supplier: '',
      price: draft.price ?? '',
      priceFrequent: '',
      priceWholesale: '',
      costPrice: '',
      stock: '',
      minStock: 5,
      location: '',
      unitsPerPackage: 1,
    });
    setIsModalOpen(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.state]);

  // Escáner Inteligente (Barcode + IA Fetch)
  React.useEffect(() => {
    let barcodeBuffer = '';
    let timeoutId: any;

    const handleKeyDown = async (e: KeyboardEvent) => {
      if (isModalOpen || isImportModalOpen || isDeleteModalOpen) return;
      // Ignorar si el usuario está escribiendo en un input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

      if (e.key === 'Enter' && barcodeBuffer.length > 5) {
        e.preventDefault();
        const scannedCode = barcodeBuffer;
        barcodeBuffer = '';
        
        // Verificar si ya existe
        const existing = inventory.find(p => p.code === scannedCode);
        if (existing) {
           if (showToast) showToast(`El producto ${existing.name} ya existe.`, 'info');
           handleOpenModal(existing);
           return;
        }

        // Producto nuevo -> Abrir modal y buscar
        setEditingProduct({ code: scannedCode, name: 'Buscando con IA...', price: 0, costPrice: 0, stock: 0, minStock: 10, category: config.defaultCategories[0] });
        setIsModalOpen(true);
        if (showToast) showToast('Escaneado. Buscando producto en la nube...', 'info');
        
        try {
          const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${scannedCode}.json`);
          const data = await res.json();
          if (data.status === 1 && data.product) {
            setEditingProduct((prev: any) => ({
              ...prev,
              name: data.product.product_name || data.product.generic_name || '',
            }));
            if (showToast) showToast('¡Producto autocompletado con éxito!', 'success');
          } else {
            setEditingProduct((prev: any) => ({ ...prev, name: '' }));
          }
        } catch (err) {
          console.error(err);
          setEditingProduct((prev: any) => ({ ...prev, name: '' }));
        }
        return;
      }

      // Si presiona números rápido (escáner USB simula teclado rápido)
      if (e.key.length === 1 && !isNaN(Number(e.key))) {
        barcodeBuffer += e.key;
        clearTimeout(timeoutId);
        // Si no se presiona nada en 150ms, limpiar buffer (para ignorar tipeo humano lento)
        timeoutId = setTimeout(() => { barcodeBuffer = ''; }, 150);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inventory, showToast, isModalOpen, isImportModalOpen, isDeleteModalOpen]);

  const handleOpenModal = (product: any | null = null) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const openBarcodeGenerator = (product: any | null = null) => {
    navigate('/barcode-generator', { state: { product } });
  };

  const handleSaveBatch = async (items: any[]) => {
    let addedCount = 0;
    
    for (const item of items) {
      if (!item.name || item.price === undefined) continue;
      
      const productData = {
        ...item,
        companyId: currentCompanyId,
        dateAdded: new Date().toISOString().split('T')[0]
      };
      
      try {
        await addInventoryItem(currentCompanyId, productData);
        addedCount++;
      } catch (err) {
        console.error("Error importing item:", err);
      }
    }
    
    if (showToast) {
      showToast(`¡Se importaron ${addedCount} productos con éxito!`, 'success');
    }
  };

  const handleSaveProduct = async (productData: any) => {
    // Validación de código de barras duplicado con normalización
    const cleanCode = (productData.code || '').trim();
    if (cleanCode !== '') {
      const duplicate = inventory.find(p => (p.code || '').trim() === cleanCode && p.id !== productData.id);
      if (duplicate) {
        if (showToast) showToast(`El código de barras "${cleanCode}" ya pertenece a: ${duplicate.name}`, 'error');
        return false;
      }
    }

    try {
      if (productData.id) {
        // Editar producto existente
        await updateInventoryItem(productData.id, productData);
        if (showToast) showToast('Producto actualizado correctamente', 'success');
      } else {
        // Guardar nuevo producto
        await addInventoryItem(currentCompanyId, productData);
        if (showToast) showToast('Producto agregado exitosamente al inventario', 'success');
      }
      setIsModalOpen(false);
      return true;
    } catch (error: any) {
      console.error('Error al guardar el producto:', error);
      const errorMsg = error?.message ? `Error: ${error.message}` : 'Error al guardar el producto';
      if (showToast) showToast(errorMsg, 'error');
      return false;
    }
  };

  const handleDeleteRequest = (product: any) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (productToDelete?.id) {
      try {
        await deleteInventoryItem(productToDelete.id);
        if (showToast) showToast('Producto eliminado', 'success');
      } catch (error) {
        console.error(error);
        if (showToast) showToast('Error al eliminar', 'error');
      }
    }
    setIsDeleteModalOpen(false);
    setProductToDelete(null);
  };

  const handleExportExcel = () => {
    const dataToExport = filteredInventory.map(p => ({
      'Código': p.code || '',
      'Ref': p.referenceCode || '',
      'Nombre': p.name || '',
      'Suplidor': p.supplier || '',
      'Stock': p.stock || 0,
      'Precio Costo': p.costPrice || 0,
      'Precio Venta': p.price || 0,
      'Ubicación': p.location || ''
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario");
    XLSX.writeFile(workbook, `Inventario_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSupplierTerm('');
    setStockFilter('');
    setExpirationFilter('');
  };

  // Lógica de filtrado con búsqueda mejorada
  const filteredInventory = useMemo(() => {
    let result = inventory;

    // Filtro por proveedor
    if (supplierTerm) {
      result = result.filter(p => p.supplier.toLowerCase().includes(supplierTerm.toLowerCase()));
    }

    // Filtro por estado de stock
    if (stockFilter === 'low') {
      result = result.filter(p => p.stock < (p.minStock || 20));
    } else if (stockFilter === 'ok') {
      result = result.filter(p => p.stock >= (p.minStock || 20));
    }

    // Filtro por caducidad
    if (expirationFilter) {
      const today = new Date();
      const thirtyDays = new Date();
      thirtyDays.setDate(today.getDate() + 30);
      if (expirationFilter === 'soon') {
        result = result.filter(p => {
          if (!p.expirationDate) return false;
          const exp = new Date(p.expirationDate);
          return exp > today && exp <= thirtyDays;
        });
      } else if (expirationFilter === 'expired') {
        result = result.filter(p => {
          if (!p.expirationDate) return false;
          return new Date(p.expirationDate) <= today;
        });
      }
    }

    // Búsqueda inteligente ultra-rápida y tolerante a fallos
    if (searchTerm) {
      result = smartSearch(result, searchTerm, ['name', 'code', 'referenceCode', 'supplier', 'category']);
    }

    return result;
  }, [inventory, searchTerm, supplierTerm, stockFilter, expirationFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Contenedor Principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', overflow: 'hidden' }}>
        
        {/* Cabecera del Inventario */}
        <div className="flex-between" style={{ marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Inventario</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Gestión de productos y existencias</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              className="btn btn-outline"
              onClick={() => openBarcodeGenerator(null)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)', fontWeight: 700 }}
            >
              <Barcode size={18} /> Crear Código de Barras
            </button>
            <button className="btn" onClick={() => setIsImportModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-app)', border: '1px solid var(--border-medium)' }}>
              <FileSpreadsheet size={18} /> Importar
            </button>
            <button className="btn" onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-app)', border: '1px solid var(--border-medium)' }}>
              <Download size={18} /> Exportar Excel
            </button>
            <button className="btn btn-primary" onClick={() => handleOpenModal()} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus size={18} /> Nuevo Producto
            </button>
          </div>
        </div>

        {/* Toolbar de Filtros y Búsqueda */}
        <div className="card" style={{ padding: '16px', marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          
          {/* Búsqueda por Nombre / Código */}
          <div className="search-bar" style={{ flex: '1 1 250px', display: 'flex', alignItems: 'center', background: 'var(--bg-app)', padding: '10px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)' }}>
            <Search size={18} style={{ color: 'var(--text-secondary)', marginRight: '12px' }} />
            <input 
              type="text" 
              placeholder="Buscar por código o nombre..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none' }}
            />
          </div>

          {/* Búsqueda por Proveedor (Suplidor) */}
          <div className="search-bar" style={{ flex: '1 1 200px', display: 'flex', alignItems: 'center', background: 'var(--bg-app)', padding: '10px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)' }}>
            <Truck size={18} style={{ color: 'var(--text-secondary)', marginRight: '12px' }} />
            <input 
              type="text" 
              placeholder="Buscar suplidor..." 
              value={supplierTerm}
              onChange={(e) => setSupplierTerm(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none' }}
            />
          </div>

          {/* Botón Filtros Avanzados */}
          <div style={{ position: 'relative' }}>
            <button 
              className="btn btn-outline" 
              style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px', borderColor: showFilters ? 'var(--accent-primary)' : undefined, color: showFilters ? 'var(--accent-primary)' : undefined }} 
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} /> Filtros
              {activeFilterCount > 0 && (
                <span style={{ background: 'var(--accent-primary)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{activeFilterCount}</span>
              )}
              <ChevronDown size={14} style={{ transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </button>

            {showFilters && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                background: 'var(--bg-card)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 50,
                padding: '16px',
                width: '280px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Filtros Avanzados</span>
                  <button 
                    onClick={clearAllFilters} 
                    style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    Limpiar Todo
                  </button>
                </div>

                {/* Filtro por Estado de Stock */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Estado de Stock</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                      { value: 'low', label: 'Stock Bajo', color: 'var(--accent-danger)' },
                      { value: 'ok', label: 'En Stock', color: '#10B981' }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setStockFilter(stockFilter === opt.value ? '' : opt.value)}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: '1px solid',
                          borderColor: stockFilter === opt.value ? opt.color : 'var(--border-medium)',
                          background: stockFilter === opt.value ? `${opt.color}15` : 'transparent',
                          color: stockFilter === opt.value ? opt.color : 'var(--text-secondary)',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        {opt.value === 'low' && <AlertTriangle size={12} />}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtro por Caducidad */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Caducidad</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                      { value: 'soon', label: 'Por Vencer (30d)', color: '#f59e0b' },
                      { value: 'expired', label: 'Vencido', color: 'var(--accent-danger)' }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setExpirationFilter(expirationFilter === opt.value ? '' : opt.value)}
                        style={{
                          flex: 1,
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: '1px solid',
                          borderColor: expirationFilter === opt.value ? opt.color : 'var(--border-medium)',
                          background: expirationFilter === opt.value ? `${opt.color}15` : 'transparent',
                          color: expirationFilter === opt.value ? opt.color : 'var(--text-secondary)',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resumen de filtros activos */}
                {activeFilterCount > 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-light)', paddingTop: '8px' }}>
                    {filteredInventory.length} producto{filteredInventory.length !== 1 ? 's' : ''} encontrado{filteredInventory.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tabla de Productos */}
        <div className="card" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ overflowX: 'auto', flex: 1 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                <tr>
                  <th style={{ padding: '16px', borderBottom: '1px solid var(--border-medium)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Código</th>
                  <th style={{ padding: '16px', borderBottom: '1px solid var(--border-medium)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Producto</th>
                  <th style={{ padding: '16px', borderBottom: '1px solid var(--border-medium)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem' }}>Suplidor</th>
                  <th style={{ padding: '16px', borderBottom: '1px solid var(--border-medium)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textAlign: 'right' }}>Precio</th>
                  <th style={{ padding: '16px', borderBottom: '1px solid var(--border-medium)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textAlign: 'center' }}>Margen</th>
                  <th style={{ padding: '16px', borderBottom: '1px solid var(--border-medium)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textAlign: 'center' }}>Stock</th>
                  <th style={{ padding: '16px', borderBottom: '1px solid var(--border-medium)', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No se encontraron productos con esos filtros.
                    </td>
                  </tr>
                ) : (
                  filteredInventory.slice(0, visibleRows).map(product => {
                    const margin = product.costPrice > 0 ? ((product.price - product.costPrice) / product.price) * 100 : 0;
                    const marginColor = margin >= 30 ? '#10B981' : margin >= 15 ? '#f59e0b' : 'var(--accent-danger)';
                    const isLowStock = product.stock < (product.minStock || 20);
                    return (
                    <tr key={product.id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s' }} className="table-row-hover">
                      <td style={{ padding: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{product.code}</td>
                      <td style={{ padding: '16px', fontWeight: 600 }}>{product.name}</td>
                      <td style={{ padding: '16px', fontSize: '0.9rem' }}>{product.supplier}</td>
                      <td style={{ padding: '16px', fontWeight: 700, color: 'var(--accent-primary)', textAlign: 'right' }}>${product.price.toFixed(2)}</td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: '20px', 
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          background: `${marginColor}18`,
                          color: marginColor
                        }}>
                          {margin > 0 ? `${margin.toFixed(0)}%` : '—'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '4px 12px', 
                          borderRadius: '20px', 
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          background: isLowStock ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: isLowStock ? 'var(--accent-danger)' : '#10B981'
                        }}>
                          {product.stock}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button className="btn btn-outline" onClick={() => openBarcodeGenerator(product)} style={{ padding: '6px', color: 'var(--accent-primary)' }} title="Crear / Imprimir Código de Barras">
                            <Barcode size={16} />
                          </button>
                          <button className="btn btn-outline" onClick={() => handleOpenModal(product)} style={{ padding: '6px', color: 'var(--text-primary)' }} title="Editar">
                            <Edit size={16} />
                          </button>
                          <button className="btn btn-outline" onClick={() => handleDeleteRequest(product)} style={{ padding: '6px', color: 'var(--accent-danger)' }} title="Eliminar">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            {filteredInventory.length > visibleRows && (
              <div style={{ padding: '16px', textAlign: 'center', borderTop: '1px solid var(--border-light)' }}>
                <button className="btn btn-outline" onClick={() => setVisibleRows(rows => rows + ROWS_PER_PAGE)}>
                  Mostrar más ({filteredInventory.length - visibleRows} restantes)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ProductFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        initialData={editingProduct}
        suppliers={suppliers}
        existingCodes={inventory.map(p => p.code || '')}
        onOpenBarcodeModal={openBarcodeGenerator}
      />

      <ConfirmDeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={productToDelete?.name || ''}
      />

      <ImportExcelModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSaveBatch={handleSaveBatch}
      />
    </div>
  );
};

export default Inventory;
