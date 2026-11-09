export interface InvoiceItem {
  id: string;
  price: number;
  quantity: number;
  discount?: number;
  [key: string]: any;
}

const round2 = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export const getLineTotal = (item: InvoiceItem): number =>
  item.price * item.quantity * (1 - (item.discount || 0) / 100);

export const getItemsSubtotal = (items: InvoiceItem[]): number =>
  items.reduce((sum, item) => sum + getLineTotal(item), 0);

/**
 * La venta no guarda su tasa de ITBIS, así que se deduce de la factura original.
 * Así una edición respeta el impuesto con el que se emitió aunque la configuración haya cambiado.
 */
export const getTaxFactor = (originalItems: InvoiceItem[], originalTotal: number): number => {
  const subtotal = getItemsSubtotal(originalItems);
  return subtotal > 0 && originalTotal > 0 ? originalTotal / subtotal : 1;
};

export const getInvoiceTotal = (items: InvoiceItem[], taxFactor: number): number =>
  round2(getItemsSubtotal(items) * taxFactor);

/** Unidades a devolver al inventario por producto (negativo si hay que descontar más). */
export const getStockChanges = (originalItems: InvoiceItem[], newItems: InvoiceItem[]): Record<string, number> => {
  const changes: Record<string, number> = {};
  originalItems.forEach(item => { changes[item.id] = (changes[item.id] || 0) + item.quantity; });
  newItems.forEach(item => { changes[item.id] = (changes[item.id] || 0) - item.quantity; });
  Object.keys(changes).forEach(id => { if (changes[id] === 0) delete changes[id]; });
  return changes;
};
