import { db } from './config';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getLocalData, saveLocalData } from '../services/localDb';
import { triggerAutoBackup } from '../services/autoBackup';

const COLLECTION_NAME = 'sales';

/**
 * Sanitiza el objeto de venta evitando cualquier propiedad con valor undefined
 */
const sanitizeSaleData = (raw: Record<string, any>): Record<string, any> => {
  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(raw)) {
    if (val === undefined) continue;
    clean[key] = val;
  }
  return clean;
};

export const subscribeToSales = (companyId: string, callback: (data: any[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), where('companyId', '==', companyId));
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      ...doc.data(),
      docId: doc.id
    }));
    try {
      localStorage.setItem('schopy_sales', JSON.stringify(items));
    } catch (e) {}
    callback(items);
  }, (error) => {
    console.error("Error subscribing to sales:", error);
    const local = getLocalData<any>('sales');
    if (local && local.length > 0) callback(local);
  });
};

export const addSale = async (companyId: string, saleData: any) => {
  const sanitized = sanitizeSaleData(saleData);
  const newId = saleData.id ? String(saleData.id) : (Date.now().toString() + Math.random().toString(36).substr(2, 9));
  const docRef = doc(db, COLLECTION_NAME, newId);
  
  const payload = {
    ...sanitized,
    companyId: companyId || 'local',
    createdAt: saleData.createdAt || new Date().toISOString()
  };

  await setDoc(docRef, payload);

  // Guardar en la base de datos local
  try {
    const local = getLocalData<any>('sales');
    local.unshift({ ...payload, docId: newId });
    saveLocalData('sales', local);
  } catch (e) {
    console.warn('Error guardando venta local:', e);
  }

  // Respaldar automáticamente después de cada venta
  triggerAutoBackup(2000);

  return newId;
};

export const updateSale = async (id: string, saleData: any) => {
  const sanitized = sanitizeSaleData(saleData);
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, sanitized);

  try {
    const local = getLocalData<any>('sales');
    const index = local.findIndex(s => s.id === id || s.docId === id);
    if (index !== -1) {
      local[index] = { ...local[index], ...sanitized };
      saveLocalData('sales', local);
    }
  } catch (e) {
    console.warn('Error actualizando venta local:', e);
  }

  triggerAutoBackup(2000);
};

export const deleteSale = async (id: string) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);

  try {
    const local = getLocalData<any>('sales');
    const filtered = local.filter(s => s.id !== id && s.docId !== id);
    saveLocalData('sales', filtered);
  } catch (e) {
    console.warn('Error eliminando venta local:', e);
  }

  triggerAutoBackup(2000);
};

