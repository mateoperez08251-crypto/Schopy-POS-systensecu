import { normalizeString } from './searchEngine';

const normalize = (value: unknown) => normalizeString(String(value ?? ''));

export const sortSuppliers = <T extends { name?: string }>(suppliers: T[]): T[] =>
  [...suppliers].sort((a, b) =>
    (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base', numeric: true })
  );

/** Filtra sin distinguir tildes ni mayúsculas y conserva el orden recibido. */
export const filterSuppliers = <T extends Record<string, any>>(suppliers: T[], term: string): T[] => {
  const query = normalize(term.trim());
  if (!query) return suppliers;
  return suppliers.filter(supplier =>
    [supplier.name, supplier.contact, supplier.rnc, supplier.phone].some(field => normalize(field).includes(query))
  );
};
