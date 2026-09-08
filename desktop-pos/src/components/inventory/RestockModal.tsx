import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, PackageSearch, X, ShoppingCart, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: any[];
  suppliers: any[];
}

const RestockModal: React.FC<RestockModalProps> = ({ isOpen, onClose, inventory, suppliers }) => {
  const navigate = useNavigate();
  // Almacena las cantidades a pedir por producto ID
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Agrupar productos con stock bajo (stock <= minStock) por proveedor
  const lowStockGroups = useMemo(() => {
    const groups: Record<string, { supplier: any, items: any[] }> = {};
    
    inventory.forEach(product => {
      const stock = product.stock || 0;
      const minStock = product.minStock || 0;
      
      // Si el stock está bajo o en el límite mínimo
      if (stock <= minStock) {
        const supName = product.supplier || 'Sin Proveedor';
        
        if (!groups[supName]) {
          const supplierObj = suppliers.find((s:any) => s.name === supName) || { name: supName };
          groups[supName] = { supplier: supplierObj, items: [] };
        }
        groups[supName].items.push(product);
      }
    });
    
    return Object.values(groups);
  }, [inventory, suppliers]);

  const handleQuantityChange = (productId: string, val: number) => {
    setQuantities(prev => ({ ...prev, [productId]: val }));
  };

  const getQuantity = (product: any) => {
    if (quantities[product.id] !== undefined) return quantities[product.id];
    // Por defecto sugerimos la cantidad necesaria para alcanzar el stock mínimo, o al menos 1
    const diff = (product.minStock || 0) - (product.stock || 0);
    return diff > 0 ? diff : 1;
  };

  const handleGenerateOrder = (group: any) => {
    const itemsToOrder = group.items.map((item: any) => ({
      ...item,
      orderQuantity: getQuantity(item)
    })).filter((item: any) => item.orderQuantity > 0);

    if (itemsToOrder.length === 0) {
      alert("Debes indicar una cantidad mayor a 0 para al menos un producto.");
      return;
    }

    onClose();
    // Navegamos a la recepción con el estado pre-cargado
    navigate('/receivings/new', { state: { supplier: group.supplier, itemsToOrder } });
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="checkout-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '24px' }} onClick={onClose}>
      <div className="card" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-medium)', background: 'var(--bg-app)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PackageSearch size={24} color="var(--accent-primary)" /> Planificador de Compras
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Productos con stock bajo agrupados por proveedor</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>
        
        {/* Contenido */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {lowStockGroups.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <PackageSearch size={32} color="var(--accent-success)" />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Todo bajo control</h3>
              <p>No hay productos con stock por debajo del mínimo actualmente.</p>
            </div>
          ) : (
            lowStockGroups.map((group, index) => (
              <div key={index} style={{ border: '1px solid var(--border-medium)', borderRadius: '12px', overflow: 'hidden' }}>
                {/* Header del Proveedor */}
                <div style={{ background: 'var(--bg-app)', padding: '16px 24px', borderBottom: '1px solid var(--border-medium)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShoppingCart size={20} color="var(--accent-primary)" />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{group.supplier.name}</h3>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{group.items.length} productos requieren atención</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleGenerateOrder(group)}
                    className="btn btn-primary" 
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
                  >
                    Generar Pedido <ArrowRight size={16} />
                  </button>
                </div>
                
                {/* Lista de Productos */}
                <div style={{ padding: '0' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-light)', background: 'var(--bg-card)' }}>
                        <th style={{ padding: '12px 24px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>PRODUCTO</th>
                        <th style={{ padding: '12px 24px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>STOCK ACTUAL</th>
                        <th style={{ padding: '12px 24px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>MÍNIMO</th>
                        <th style={{ padding: '12px 24px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', textAlign: 'right' }}>CANTIDAD A PEDIR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-light)' }} className="hover:bg-[var(--bg-app)]">
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>SKU: {item.code || 'N/A'}</div>
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-danger)', fontWeight: 600 }}>
                              <AlertTriangle size={14} /> {item.stock || 0}
                            </div>
                          </td>
                          <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {item.minStock || 0}
                          </td>
                          <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                            <input 
                              type="number" 
                              min="0"
                              value={getQuantity(item)}
                              onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                              onWheel={e => e.currentTarget.blur()}
                              style={{ 
                                width: '80px', padding: '8px 12px', borderRadius: '8px', 
                                border: '1px solid var(--accent-primary)', background: 'var(--bg-app)', 
                                color: 'var(--text-primary)', outline: 'none', fontWeight: 700, textAlign: 'center' 
                              }} 
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RestockModal;
