import React, { useState } from 'react';
import { ArrowLeft, Search, Building2, PackagePlus, FileText, Phone, User, Trash2, Save } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../context/AuthContext';
import { addReceivingLocal } from '../firebase/localReceivingsService';

const NewReceiving = ({ inventory, setInventory, suppliers, showToast }: { inventory: any[], setInventory: (inv: any[]) => void, suppliers: any[], showToast?: (m: string, t?: 'success'|'error') => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData } = useAuth();
  const [supplierSearch, setSupplierSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  
  const [items, setItems] = useState<any[]>([]);

  React.useEffect(() => {
    if (location.state) {
      if (location.state.supplier) {
        setSelectedSupplier(location.state.supplier);
      }
      if (location.state.itemsToOrder) {
        const formattedItems = location.state.itemsToOrder.map((item: any) => ({
          ...item,
          quantity: item.orderQuantity || 1,
          cost: item.costPrice || 0,
          entryType: 'unit'
        }));
        setItems(formattedItems);
      }
    }
  }, [location.state]);

  // Derived state
  const filteredSuppliers = suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()) || (s.rnc && s.rnc.includes(supplierSearch)));
  const filteredProducts = inventory.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.code && p.code.toLowerCase().includes(productSearch.toLowerCase())));

  const handleSelectSupplier = (supplier: any) => {
    setSelectedSupplier(supplier);
    setSupplierSearch('');
    setShowSupplierDropdown(false);
  };

  const handleSelectProduct = (product: any) => {
    const existing = items.find(item => item.id === product.id);
    if (existing) {
      setItems(items.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setItems([...items, { ...product, quantity: 1, cost: product.costPrice || 0, entryType: 'unit' }]);
    }
    setProductSearch('');
    setShowProductDropdown(false);
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const totalCost = items.reduce((sum, item) => sum + (item.quantity * item.cost), 0);

  const handleSave = async () => {
    if (!selectedSupplier) {
      alert("Debes seleccionar un proveedor.");
      return;
    }
    if (items.length === 0) {
      alert("Debes agregar al menos un producto.");
      return;
    }
    // Actualizar inventario (sumar stock real según la caja o unidad recibida)
    const updatedInventory = inventory.map(invProduct => {
      const receivedItem = items.find(i => i.id === invProduct.id);
      if (receivedItem) {
        const isPackage = receivedItem.entryType === 'package';
        const addedUnits = isPackage ? receivedItem.quantity * (receivedItem.unitsPerPackage || 1) : receivedItem.quantity;
        return {
          ...invProduct,
          stock: (invProduct.stock || 0) + addedUnits,
          // Actualizamos el costPrice al último costo recibido si es que cambió
          costPrice: isPackage ? receivedItem.cost / (receivedItem.unitsPerPackage || 1) : receivedItem.cost
        };
      }
      return invProduct;
    });
    setInventory(updatedInventory);

    // Guardar la recepción localmente
    addReceivingLocal({
      date: new Date().toISOString(),
      supplier: selectedSupplier.name,
      items: items.length,
      totalCost: totalCost,
      user: userData?.name || 'Admin'
    });

    // Generar PDF
    const doc = new jsPDF();
    
    // Cargar logo
    const img = new Image();
    img.src = '/app-icon.png';
    await new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = resolve;
    });
    
    // Configuración inicial y marca de agua / estilo corporativo
    doc.setFillColor(15, 23, 42); // Accent primary moderno
    doc.rect(0, 0, 210, 30, 'F');
    
    try {
      doc.addImage(img, 'PNG', 14, 6, 18, 18);
    } catch (e) {}

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(userData?.companyName || 'SCHOPY POS', 36, 18);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('COMPROBANTE DE ENTRADA', 196, 18, { align: 'right' });

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-DO')} ${new Date().toLocaleTimeString('es-DO')}`, 14, 40);

    // Datos del Proveedor
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS DEL PROVEEDOR', 14, 55);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Empresa: ${selectedSupplier.name}`, 14, 65);
    doc.text(`RNC / Cédula: ${selectedSupplier.rnc}`, 14, 72);
    doc.text(`Contacto: ${selectedSupplier.contact}`, 120, 65);
    doc.text(`Teléfono: ${selectedSupplier.phone}`, 120, 72);

    // Separador
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 80, 196, 80);

    // Tabla de Productos
    const tableData = items.map(item => {
      const isPackage = item.entryType === 'package';
      const quantityText = isPackage ? `${item.quantity} Cajas/Paq.` : `${item.quantity} Unidades`;
      const actualUnits = isPackage ? item.quantity * (item.unitsPerPackage || 1) : item.quantity;
      const displayTotal = item.quantity * item.cost;
      
      return [
        item.code || item.sku,
        item.name,
        quantityText,
        `$${item.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
        `$${displayTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
      ];
    });

    autoTable(doc, {
      startY: 90,
      head: [['Código/SKU', 'Producto', 'Cant.', 'Costo Unit.', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: {
        0: { cellWidth: 30 },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'right', cellWidth: 35 },
        4: { halign: 'right', cellWidth: 35 }
      }
    });

    // Totales en el Footer
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen de Entrada', 120, finalY + 15);
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(`Costo Total: $${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 120, finalY + 23);

    // Descargar en lugar de abrir pestaña
    const pdfFilename = `Comprobante_Entrada_${new Date().getTime()}.pdf`;
    doc.save(pdfFilename);
    
    if (showToast) showToast('Entrada guardada y PDF descargado correctamente', 'success');
    // Navegar
    navigate('/receivings');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%', paddingBottom: '100px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button onClick={() => navigate('/receivings')} style={{
          width: '40px', height: '40px', borderRadius: '12px', border: '1px solid var(--border-light)',
          background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.2s'
        }} className="hover:bg-[var(--bg-app)]">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Nueva Entrada</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Registra una recepción de mercancía al inventario</p>
        </div>
      </div>

      {/* Sección 1: Proveedor */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building2 size={20} color="var(--accent-primary)" /> 1. Datos del Proveedor
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: selectedSupplier ? '300px 1fr' : '1fr', gap: '24px' }}>
          
          {/* Buscador */}
          <div style={{ position: 'relative' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Buscar Proveedor Existente</label>
            <div style={{ position: 'relative' }}>
              <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
              <input 
                type="text" placeholder="Buscar por nombre o RNC..." 
                style={{ 
                  width: '100%', height: '54px', paddingLeft: '48px', paddingRight: '16px',
                  backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-light)',
                  borderRadius: '12px', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500,
                  transition: 'all 0.2s', outline: 'none'
                }}
                value={supplierSearch}
                onChange={(e) => {
                  setSupplierSearch(e.target.value);
                  setShowSupplierDropdown(true);
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = '0 0 0 2px var(--accent-primary), 0 0 20px rgba(79, 70, 229, 0.15)';
                  e.target.style.borderColor = 'var(--accent-primary)';
                  setShowSupplierDropdown(true);
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = 'none';
                  e.target.style.borderColor = 'var(--border-light)';
                  setTimeout(() => setShowSupplierDropdown(false), 200); // Delay for click
                }}
              />
            </div>
            
            {showSupplierDropdown && supplierSearch && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px',
                background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)', zIndex: 10, overflow: 'hidden'
              }}>
                {filteredSuppliers.length > 0 ? (
                  filteredSuppliers.map(s => (
                    <div key={s.id} onClick={() => handleSelectSupplier(s)} style={{
                      padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }} className="hover:bg-[var(--bg-app)]">
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>RNC: {s.rnc}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '16px', color: 'var(--text-secondary)', textAlign: 'center' }}>No se encontraron resultados</div>
                )}
              </div>
            )}
          </div>

          {/* Tarjetas de Info Auto-completadas */}
          {selectedSupplier && (
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              
              <div style={{ flex: 1, minWidth: '200px', background: 'var(--bg-app)', border: '1px solid var(--accent-primary)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={20} color="var(--accent-primary)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>EMPRESA</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{selectedSupplier.name}</div>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: '200px', background: 'var(--bg-app)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={20} color="var(--text-secondary)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>RNC / CÉDULA</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedSupplier.rnc || 'N/A'}</div>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: '200px', background: 'var(--bg-app)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={20} color="var(--text-secondary)" />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>CONTACTO</div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{selectedSupplier.contact}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{selectedSupplier.phone}</div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Sección 2: Productos */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-light)', background: 'linear-gradient(to right, rgba(79, 70, 229, 0.03), transparent)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PackagePlus size={20} color="var(--accent-primary)" /> 2. Agregar Productos a la Entrada
          </h2>
          
          <div style={{ position: 'relative', maxWidth: '500px' }}>
            <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
            <input 
              type="text" placeholder="Buscar producto por nombre o código..." 
              style={{ 
                width: '100%', height: '54px', paddingLeft: '48px', paddingRight: '16px',
                backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-light)',
                borderRadius: '12px', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500,
                transition: 'all 0.2s', outline: 'none'
              }}
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value);
                setShowProductDropdown(true);
              }}
              onFocus={(e) => {
                e.target.style.boxShadow = '0 0 0 2px var(--accent-primary), 0 0 20px rgba(79, 70, 229, 0.15)';
                e.target.style.borderColor = 'var(--accent-primary)';
                setShowProductDropdown(true);
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = 'none';
                e.target.style.borderColor = 'var(--border-light)';
                setTimeout(() => setShowProductDropdown(false), 200); // Delay for click
              }}
            />
            {showProductDropdown && productSearch && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px',
                background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)', zIndex: 10, overflow: 'hidden'
              }}>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(p => (
                    <div key={p.id} onClick={() => handleSelectProduct(p)} style={{
                      padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }} className="hover:bg-[var(--bg-app)]">
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>SKU: {p.code}</div>
                      </div>
                      <div style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                        Cost. Ref: ${p.costPrice}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ padding: '16px', color: 'var(--text-secondary)', textAlign: 'center' }}>Producto no encontrado</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tabla de ítems */}
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--border-light)' }}>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', width: '40%' }}>PRODUCTO</th>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>CANTIDAD RECIBIDA</th>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>COSTO UNITARIO ($)</th>
              <th style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>TOTAL</th>
              <th style={{ padding: '16px 24px', width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Aún no has agregado productos a esta entrada.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.code}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="number" min="1"
                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                        style={{ 
                          width: '80px', height: '40px', padding: '0 12px',
                          backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-light)',
                          borderRadius: '8px', color: 'var(--text-primary)', fontWeight: 600,
                          outline: 'none', textAlign: 'center'
                        }}
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      />
                      <select 
                        value={item.entryType}
                        onChange={(e) => updateItem(item.id, 'entryType', e.target.value)}
                        style={{ 
                          height: '40px', padding: '0 12px',
                          backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)',
                          borderRadius: '8px', color: 'var(--text-secondary)', fontWeight: 500,
                          outline: 'none', cursor: 'pointer'
                        }}
                      >
                        <option value="unit">Unidades</option>
                        <option value="package">Cajas/Paq.</option>
                      </select>
                      {item.entryType === 'package' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>de</span>
                          <input 
                            type="number" min="1"
                            onWheel={(e) => (e.target as HTMLInputElement).blur()}
                            value={item.unitsPerPackage || 1}
                            onChange={(e) => updateItem(item.id, 'unitsPerPackage', parseInt(e.target.value) || 1)}
                            style={{ 
                              width: '50px', height: '32px', padding: '0 4px',
                              backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-light)',
                              borderRadius: '6px', color: 'var(--text-primary)', fontWeight: 600,
                              outline: 'none', textAlign: 'center', fontSize: '0.85rem'
                            }}
                            title="Unidades por caja"
                          />
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>u.</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <input 
                      type="number" min="0" step="0.01"
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                      style={{ 
                        width: '120px', height: '40px', padding: '0 12px',
                        backgroundColor: 'var(--bg-app)', border: '1px solid var(--border-light)',
                        borderRadius: '8px', color: 'var(--text-primary)', fontWeight: 600,
                        outline: 'none'
                      }}
                      value={item.cost}
                      onChange={(e) => updateItem(item.id, 'cost', parseFloat(e.target.value) || 0)}
                    />
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right', fontWeight: 700, color: 'var(--accent-primary)', fontSize: '1.1rem' }}>
                    ${(item.quantity * item.cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <button onClick={() => removeItem(item.id)} style={{
                      background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer',
                      padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center'
                    }} className="hover:bg-red-500/10">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Totales y Botón Guardar */}
        {items.length > 0 && (
          <div style={{ padding: '24px', background: 'var(--bg-app)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Resumen de Entrada</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {items.reduce((sum, i) => sum + i.quantity, 0)} artículos en total
              </div>
            </div>
            
            <button 
              className="btn btn-primary" 
              onClick={handleSave}
              style={{ padding: '0 32px', height: '54px', fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Save size={20} /> Guardar Entrada
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default NewReceiving;
