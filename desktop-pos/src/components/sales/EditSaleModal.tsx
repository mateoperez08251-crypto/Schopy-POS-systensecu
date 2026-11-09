import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Plus, Search, Trash2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useBusiness } from '../../context/BusinessContext';
import { subscribeToMechanics } from '../../firebase/localMechanicsService';
import { smartSearch } from '../../utils/searchEngine';
import { InvoiceItem, getInvoiceTotal, getItemsSubtotal, getLineTotal, getStockChanges, getTaxFactor } from '../../utils/invoice';

interface EditSaleModalProps {
  sale: any;
  inventory: any[];
  currency: string;
  onClose: () => void;
  onSave: (updates: Record<string, any>) => Promise<void>;
}

const PAYMENT_METHODS = ['Efectivo', 'Tarjeta', 'Transferencia'];
const MAX_RESULTS = 6;

const getProductPrice = (product: any, priceLevel?: string) => {
  if (priceLevel === 'frequent' && product.priceFrequent) return parseFloat(product.priceFrequent);
  if (priceLevel === 'wholesale' && product.priceWholesale) return parseFloat(product.priceWholesale);
  return parseFloat(product.price) || 0;
};

const EditSaleModal: React.FC<EditSaleModalProps> = ({ sale, inventory, currency, onClose, onSave }) => {
  const { userData, companyId } = useAuth();
  const { hasFeature } = useBusiness();
  const effectiveCompanyId = userData?.companyId || companyId || 'local';

  const originalItems: InvoiceItem[] = sale.items || [];
  const [items, setItems] = useState<InvoiceItem[]>(originalItems);
  const [client, setClient] = useState<string>(sale.client || '');
  const [clientRnc, setClientRnc] = useState<string>(sale.clientRnc || '');
  const [paymentMethod, setPaymentMethod] = useState<string>(sale.paymentMethod || 'Efectivo');
  const [mechanicId, setMechanicId] = useState<string>(sale.mechanicId || '');
  const [note, setNote] = useState<string>(sale.note || '');
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => subscribeToMechanics(effectiveCompanyId, setMechanics), [effectiveCompanyId]);

  const results = useMemo(
    () => (searchTerm.trim() ? smartSearch(inventory, searchTerm, ['name', 'code', 'referenceCode']).slice(0, MAX_RESULTS) : []),
    [inventory, searchTerm]
  );

  const subtotal = getItemsSubtotal(items);
  const total = getInvoiceTotal(items, getTaxFactor(originalItems, sale.total || 0));
  const unitsChange = Object.values(getStockChanges(originalItems, items)).reduce((sum, units) => sum + units, 0);

  const updateItem = (id: string, changes: Partial<InvoiceItem>) => {
    setItems(prev => prev.map(item => (item.id === id ? { ...item, ...changes } : item)));
  };

  const addProduct = (product: any) => {
    setItems(prev => {
      if (prev.some(item => item.id === product.id)) {
        return prev.map(item => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...prev, { ...product, price: getProductPrice(product, sale.priceLevel), quantity: 1, discount: 0, note: '' }];
    });
    setSearchTerm('');
  };

  const handleSave = async () => {
    if (sale.invoiceType === 'credito' && !clientRnc.trim()) {
      setError('Una factura de Crédito Fiscal debe tener RNC / Cédula.');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      await onSave({
        items,
        total,
        client: client.trim(),
        clientRnc: clientRnc.trim(),
        paymentMethod,
        mechanicId: mechanicId || null,
        note: note.trim()
      });
    } catch (e: any) {
      console.error(e);
      setError('No se pudo guardar la factura: ' + (e?.message || 'error desconocido'));
      setIsSaving(false);
    }
  };

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-medium)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' };
  const cellInput: React.CSSProperties = { ...inputStyle, padding: '6px 8px', textAlign: 'right' };
  const headerCell: React.CSSProperties = { padding: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', borderBottom: '2px solid var(--border-medium)' };

  return createPortal(
    <div className="checkout-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, padding: '24px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '860px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-medium)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-app)' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Editar Factura #{sale.id}</h2>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSaving} style={{ padding: '6px', border: 'none' }} aria-label="Cerrar"><X size={20} /></button>
        </div>

        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {sale.ncf && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
              <AlertTriangle size={16} color="#F59E0B" style={{ flexShrink: 0 }} />
              Esta factura tiene el NCF {sale.ncf}. Editarla no genera una nota de crédito; el NCF y el tipo de comprobante se mantienen.
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Cliente</label>
              <input type="text" placeholder="Público en General" value={client} onChange={e => setClient(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>RNC / Cédula</label>
              <input type="text" value={clientRnc} onChange={e => setClientRnc(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Método de Pago</label>
              <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={inputStyle}>
                {PAYMENT_METHODS.map(method => <option key={method} value={method}>{method}</option>)}
              </select>
            </div>
            {hasFeature('mechanics') && (
              <div>
                <label style={labelStyle}>Mecánico</label>
                <select value={mechanicId} onChange={e => setMechanicId(e.target.value)} style={inputStyle}>
                  <option value="">Ninguno</option>
                  {mechanics.map(mechanic => <option key={mechanic.id} value={mechanic.id}>{mechanic.name}</option>)}
                </select>
              </div>
            )}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Nota</label>
              <input type="text" value={note} onChange={e => setNote(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 8px' }}>Artículos</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={headerCell}>Artículo</th>
                  <th style={{ ...headerCell, width: '84px', textAlign: 'right' }}>Cant.</th>
                  <th style={{ ...headerCell, width: '116px', textAlign: 'right' }}>Precio</th>
                  <th style={{ ...headerCell, width: '84px', textAlign: 'right' }}>Desc. %</th>
                  <th style={{ ...headerCell, width: '110px', textAlign: 'right' }}>Importe</th>
                  <th aria-label="Eliminar" style={{ ...headerCell, width: '44px' }} />
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '8px', fontWeight: 600, fontSize: '0.875rem' }}>{item.name}</td>
                    <td style={{ padding: '8px' }}>
                      <input type="number" min="1" aria-label={`Cantidad de ${item.name}`} value={item.quantity} onWheel={e => e.currentTarget.blur()} onChange={e => updateItem(item.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })} style={cellInput} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input type="number" min="0" step="0.01" aria-label={`Precio de ${item.name}`} value={item.price} onWheel={e => e.currentTarget.blur()} onChange={e => updateItem(item.id, { price: Math.max(0, parseFloat(e.target.value) || 0) })} style={cellInput} />
                    </td>
                    <td style={{ padding: '8px' }}>
                      <input type="number" min="0" max="100" aria-label={`Descuento de ${item.name}`} value={item.discount || 0} onWheel={e => e.currentTarget.blur()} onChange={e => updateItem(item.id, { discount: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) })} style={cellInput} />
                    </td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, fontSize: '0.875rem' }}>{currency}{getLineTotal(item).toFixed(2)}</td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <button type="button" onClick={() => setItems(prev => prev.filter(other => other.id !== item.id))} title="Eliminar artículo" aria-label={`Eliminar ${item.name}`} style={{ background: 'none', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', display: 'inline-flex', padding: '4px' }}>
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      La factura debe tener al menos un artículo. Para anularla completa, usa Devolver Venta.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div style={{ position: 'relative', marginTop: '12px' }}>
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '19px', transform: 'translateY(-50%)' }} />
              <input type="text" placeholder="Añadir otro artículo (nombre o código)..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ ...inputStyle, paddingLeft: '36px' }} />
              {searchTerm.trim() !== '' && (
                <div style={{ marginTop: '4px', border: '1px solid var(--border-medium)', borderRadius: '8px', overflow: 'hidden' }}>
                  {results.length === 0 ? (
                    <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>No se encontraron productos</div>
                  ) : results.map(product => (
                    <button key={product.id} type="button" onClick={() => addProduct(product)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: 'none', borderBottom: '1px solid var(--border-light)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', textAlign: 'left' }}>
                      <Plus size={14} color="var(--accent-primary)" />
                      <span style={{ flex: 1, fontWeight: 600, fontSize: '0.875rem' }}>{product.name}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Stock: {product.stock || 0}</span>
                      <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{currency}{getProductPrice(product, sale.priceLevel).toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginLeft: 'auto', width: '280px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.9rem' }}>
            <div className="flex-between"><span style={{ color: 'var(--text-secondary)' }}>Subtotal</span><span>{currency}{subtotal.toFixed(2)}</span></div>
            <div className="flex-between"><span style={{ color: 'var(--text-secondary)' }}>ITBIS</span><span>{currency}{(total - subtotal).toFixed(2)}</span></div>
            <div className="flex-between" style={{ paddingTop: '6px', borderTop: '1px dashed var(--border-medium)', fontWeight: 800, fontSize: '1.15rem' }}>
              <span>Total</span><span style={{ color: 'var(--accent-primary)' }}>{currency}{total.toFixed(2)}</span>
            </div>
            <div className="flex-between" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}><span>Total anterior</span><span>{currency}{(sale.total || 0).toFixed(2)}</span></div>
            {unitsChange !== 0 && (
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                {unitsChange > 0 ? `Vuelven ${unitsChange} unidad(es) al inventario` : `Salen ${Math.abs(unitsChange)} unidad(es) del inventario`}
              </p>
            )}
          </div>

          {error && <p style={{ margin: 0, color: 'var(--accent-danger)', fontSize: '0.875rem', fontWeight: 600 }}>{error}</p>}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-medium)', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: 'var(--bg-app)' }}>
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSaving}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={isSaving || items.length === 0}>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EditSaleModal;
