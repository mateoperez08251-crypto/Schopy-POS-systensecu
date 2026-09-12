import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Download, Save, Trash2, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveBatch: (items: any[]) => void;
}

const ImportExcelModal: React.FC<ImportExcelModalProps> = ({ isOpen, onClose, onSaveBatch }) => {
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const template = [
      {
        "Código": "SKU-001",
        "Nombre": "Producto de Ejemplo",
        "Categoría": "Frenos",
        "Proveedor": "Distribuidora Principal",
        "Costo": 150,
        "Precio_Venta": 300,
        "Precio_Frecuente": 280,
        "Precio_Mayorista": 250,
        "Stock": 10,
        "Ubicación": "Pasillo 1"
      }
    ];
    
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Plantilla Inventario");
    XLSX.writeFile(wb, "Plantilla_Schopy.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        const getVal = (row: any, possibleKeys: string[]) => {
          const keys = Object.keys(row);
          for (const pk of possibleKeys) {
            const foundKey = keys.find(k => k.toLowerCase().includes(pk.toLowerCase()));
            if (foundKey) return row[foundKey];
          }
          return '';
        };

        const mappedData = data.map((row: any, index: number) => ({
          _id: `temp-${index}`,
          code: getVal(row, ['código', 'codigo', 'sku', 'code']) || '',
          name: getVal(row, ['nombre', 'producto', 'artículo', 'articulo', 'descripción', 'descripcion', 'name']) || '',
          category: getVal(row, ['categoría', 'categoria', 'category', 'familia']) || 'General',
          supplier: getVal(row, ['proveedor', 'suplidor', 'supplier', 'marca']) || '',
          costPrice: parseFloat(getVal(row, ['costo', 'cost', 'precio de compra', 'precio compra'])) || 0,
          price: parseFloat(getVal(row, ['precio de venta', 'precio venta', 'precio', 'price'])) || 0,
          priceFrequent: parseFloat(getVal(row, ['precio frecuente', 'frecuente', 'precio_frecuente'])) || 0,
          priceWholesale: parseFloat(getVal(row, ['precio mayorista', 'mayorista', 'precio_mayorista', 'al por mayor'])) || 0,
          stock: parseInt(getVal(row, ['stock', 'cantidad', 'inventario', 'qty'])) || 0,
          location: getVal(row, ['ubicación', 'ubicacion', 'location', 'estante', 'pasillo']) || '',
          minStock: 5
        }));

        setParsedData(mappedData);
      } catch (error) {
        console.error("Error parsing Excel:", error);
        alert("Error al leer el archivo Excel. Asegúrate de usar la plantilla correcta.");
      }
    };
    reader.readAsBinaryString(file);
    
    // reset input so the same file can be uploaded again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFieldChange = (id: string, field: string, value: any) => {
    setParsedData(prev => prev.map(item => item._id === id ? { ...item, [field]: value } : item));
  };

  const handleRemoveItem = (id: string) => {
    setParsedData(prev => prev.filter(item => item._id !== id));
  };

  const handleSave = async () => {
    if (parsedData.length === 0) return;
    
    setIsProcessing(true);
    try {
      // Remover _id interno antes de guardar
      const itemsToSave = parsedData.map(({ _id, ...rest }) => rest);
      await onSaveBatch(itemsToSave);
      setParsedData([]);
      onClose();
    } catch (error) {
      console.error("Error guardando lote:", error);
      alert("Ocurrió un error al guardar los productos.");
    } finally {
      setIsProcessing(false);
    }
  };

  return createPortal(
    <div className="checkout-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '24px' }} onClick={onClose}>
      <div className="card" style={{ width: '100%', maxWidth: '1000px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-medium)', background: 'var(--bg-app)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet size={24} color="var(--accent-primary)" /> Importación Masiva (Excel)
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Revisa y completa los datos antes de guardarlos en tu inventario</p>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>
        
        {/* Acciones de carga */}
        {parsedData.length === 0 ? (
          <div style={{ padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', flex: 1 }}>
            <div style={{ textAlign: 'center', maxWidth: '400px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <Upload size={40} color="var(--text-muted)" />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Sube tu archivo de productos</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Para que el sistema lea correctamente tu archivo, te recomendamos descargar y usar nuestra plantilla.</p>
              
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <button onClick={handleDownloadTemplate} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-app)', border: '1px solid var(--border-medium)' }}>
                  <Download size={18} /> Descargar Plantilla
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileSpreadsheet size={18} /> Subir Excel
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept=".xlsx, .xls, .csv" 
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
            {/* Toolbar con estadísticas */}
            <div style={{ padding: '16px 24px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>{parsedData.length} productos detectados</span>
              <button onClick={() => setParsedData([])} className="btn" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                Descartar Archivo
              </button>
            </div>
            
            {/* Tabla de revisión */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '0 24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '16px', marginBottom: '16px' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 10 }}>
                  <tr style={{ borderBottom: '2px solid var(--border-medium)' }}>
                    <th style={{ padding: '12px 8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Código</th>
                    <th style={{ padding: '12px 8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Nombre</th>
                    <th style={{ padding: '12px 8px', fontSize: '0.8rem', color: 'var(--text-secondary)', width: '90px' }}>Costo</th>
                    <th style={{ padding: '12px 8px', fontSize: '0.8rem', color: 'var(--accent-primary)', width: '100px' }}>Precio Venta</th>
                    <th style={{ padding: '12px 8px', fontSize: '0.8rem', color: 'var(--text-secondary)', width: '100px' }}>Precio Frec.</th>
                    <th style={{ padding: '12px 8px', fontSize: '0.8rem', color: 'var(--text-secondary)', width: '100px' }}>Precio Mayor.</th>
                    <th style={{ padding: '12px 8px', fontSize: '0.8rem', color: 'var(--text-secondary)', width: '70px' }}>Stock</th>
                    <th style={{ padding: '12px 8px', fontSize: '0.8rem', color: 'var(--text-secondary)', width: '120px' }}>Ubicación</th>
                    <th style={{ padding: '12px 8px', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.map(item => (
                    <tr key={item._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '8px' }}>
                        <input type="text" value={item.code} onChange={e => handleFieldChange(item._id, 'code', e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-light)', borderRadius: '4px', fontSize: '0.85rem' }} />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input type="text" value={item.name} onChange={e => handleFieldChange(item._id, 'name', e.target.value)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-light)', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }} />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input type="number" step="0.01" value={item.costPrice} onChange={e => handleFieldChange(item._id, 'costPrice', parseFloat(e.target.value) || 0)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-light)', borderRadius: '4px', fontSize: '0.85rem' }} />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input type="number" step="0.01" value={item.price} onChange={e => handleFieldChange(item._id, 'price', parseFloat(e.target.value) || 0)} style={{ width: '100%', padding: '6px', border: '2px solid var(--accent-primary)', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)' }} />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input type="number" step="0.01" value={item.priceFrequent} onChange={e => handleFieldChange(item._id, 'priceFrequent', parseFloat(e.target.value) || 0)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-light)', borderRadius: '4px', fontSize: '0.85rem' }} />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input type="number" step="0.01" value={item.priceWholesale} onChange={e => handleFieldChange(item._id, 'priceWholesale', parseFloat(e.target.value) || 0)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-light)', borderRadius: '4px', fontSize: '0.85rem' }} />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input type="number" value={item.stock} onChange={e => handleFieldChange(item._id, 'stock', parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '6px', border: '1px solid var(--border-light)', borderRadius: '4px', fontSize: '0.85rem', textAlign: 'center' }} />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input type="text" value={item.location} onChange={e => handleFieldChange(item._id, 'location', e.target.value)} placeholder="Ej. Pasillo A" style={{ width: '100%', padding: '6px', border: '1px solid var(--border-light)', borderRadius: '4px', fontSize: '0.85rem' }} />
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <button onClick={() => handleRemoveItem(item._id)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer con botón de guardado */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-medium)', background: 'var(--bg-app)', display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
              <button onClick={onClose} className="btn" disabled={isProcessing}>Cancelar</button>
              <button onClick={handleSave} className="btn btn-primary" disabled={isProcessing} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isProcessing ? 'Guardando...' : <><Save size={18} /> Guardar {parsedData.length} Productos</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ImportExcelModal;
