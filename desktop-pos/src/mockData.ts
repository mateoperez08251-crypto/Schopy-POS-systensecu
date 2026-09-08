export const INITIAL_INVENTORY = [
  { id: 1, name: 'Coca Cola 2L', price: 2.50, costPrice: 1.40, code: '7501055310883', category: 'Bebidas', stock: 45, minStock: 20, supplier: 'Coca Cola Femsa', dateAdded: '2023-10-15', expirationDate: '2026-12-01', location: 'Pasillo 1, Estante A', unitsPerPackage: 1 },
  { id: 2, name: 'Sabritas Original 45g', price: 1.20, costPrice: 0.65, code: '7501011133906', category: 'Snacks', stock: 12, minStock: 25, supplier: 'PepsiCo', dateAdded: '2023-10-20', expirationDate: '2026-08-15', location: 'Pasillo 2, Estante C', unitsPerPackage: 1 },
  { id: 3, name: 'Atún Dolores en Agua', price: 1.80, costPrice: 1.10, code: '7501041810502', category: 'Abarrotes', stock: 100, minStock: 30, supplier: 'Grupo Pinsa', dateAdded: '2023-09-01', expirationDate: '2027-03-01', location: 'Pasillo 3, Estante B', unitsPerPackage: 1 },
  { id: 'P001', name: 'Arroz Premium (Saco)', price: 1800, costPrice: 1500, code: 'ARR-01', category: 'Abarrotes', stock: 20, minStock: 10, supplier: 'Distribuidora Corripio', dateAdded: '2023-10-01', location: 'Almacén', unitsPerPackage: 1 },
  { id: 'P002', name: 'Aceite de Soya (Galón)', price: 1100, costPrice: 800, code: 'ACE-01', category: 'Abarrotes', stock: 15, minStock: 5, supplier: 'Mercasid', dateAdded: '2023-10-02', location: 'Almacén', unitsPerPackage: 4 },
  { id: 'P003', name: 'Presidente Light', price: 1800, costPrice: 1200, code: 'CER-01', category: 'Bebidas', stock: 120, minStock: 48, supplier: 'Cervecería Nacional', dateAdded: '2023-10-03', location: 'Nevera 1', unitsPerPackage: 24 },
  { id: 'P004', name: 'Salami Super Especial', price: 600, costPrice: 450, code: 'SAL-01', category: 'Abarrotes', stock: 30, minStock: 10, supplier: 'Induveca', dateAdded: '2023-10-04', location: 'Nevera 2', unitsPerPackage: 1 },
];

export const INITIAL_SUPPLIERS = [
  { id: 1, name: 'Distribuidora Corripio', contact: 'Juan Pérez', category: 'Abarrotes', phone: '(809) 555-0100', email: 'ventas@corripio.do', status: 'Activo', rnc: '130000000', pendingBalance: 0 },
  { id: 2, name: 'Cervecería Nacional', contact: 'María García', category: 'Bebidas', phone: '(809) 555-0200', email: 'pedidos@cnd.com.do', status: 'Activo', rnc: '130000001', pendingBalance: 15000 },
  { id: 3, name: 'Mercasid', contact: 'Carlos López', category: 'Abarrotes', phone: '(809) 555-0300', email: 'info@mercasid.com.do', status: 'Inactivo', rnc: '130000002', pendingBalance: 0 },
  { id: 4, name: 'Importadora del Sur', contact: 'María Fernández', phone: '809-555-1010', email: 'ventas@importadorasur.com', category: 'General', status: 'Inactivo', pendingBalance: 0 },
];

export const INITIAL_CUSTOMERS = [
  { id: 1, name: 'Consumidor Final', documentId: '000-0000000-0', email: '', phone: '', address: '', points: 0, status: 'Activo', registeredDate: '2023-01-01' },
  { id: 2, name: 'Juan Pérez', documentId: '402-1234567-8', email: 'juan.perez@email.com', phone: '809-555-0123', address: 'Av. Winston Churchill #10', points: 150, status: 'Activo', registeredDate: '2023-10-15' },
  { id: 3, name: 'Colmado La Bendición', documentId: '131-0987654-3', email: 'labendicion@email.com', phone: '809-555-9876', address: 'C/ Duarte Esq. Mella', points: 450, status: 'Activo', registeredDate: '2023-09-20' }
];
