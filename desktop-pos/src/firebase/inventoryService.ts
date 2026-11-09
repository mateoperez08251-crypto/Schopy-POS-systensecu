import { db } from './config';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getLocalData, saveLocalData } from '../services/localDb';
import { triggerAutoBackup } from '../services/autoBackup';

const COLLECTION_NAME = 'inventory';

/**
 * Sanitiza cualquier objeto de producto eliminando propiedades con valor undefined
 * y asegurando que los valores numéricos no sean NaN antes de llamar a Firestore.
 * Esto evita el error: "Unsupported field value: undefined"
 */
export const sanitizeProductData = (raw: Record<string, any>): Record<string, any> => {
  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(raw)) {
    if (val === undefined) continue;
    if (typeof val === 'number') {
      clean[key] = isNaN(val) ? 0 : val;
    } else {
      clean[key] = val;
    }
  }
  return clean;
};

export const subscribeToInventory = (companyId: string, callback: (data: any[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), where('companyId', '==', companyId));
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    // Sincronizar en caché local en tiempo real para disponibilidad offline y respaldos
    try {
      localStorage.setItem('schopy_inventory', JSON.stringify(items));
    } catch (e) {}
    callback(items);
  }, (error) => {
    console.error("Error subscribing to inventory:", error);
    // Si falla Firestore o está offline, usar la copia local guardada
    const local = getLocalData<any>('inventory');
    if (local && local.length > 0) {
      callback(local);
    }
  });
};

export const addInventoryItem = async (companyId: string, itemData: any) => {
  const sanitized = sanitizeProductData(itemData);
  delete sanitized.id; // Nunca guardar id: undefined o id interno en el cuerpo

  const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const docRef = doc(db, COLLECTION_NAME, newId);
  
  const payload = {
    ...sanitized,
    companyId: companyId || 'local',
    createdAt: new Date().toISOString()
  };

  await setDoc(docRef, payload);

  // Guardar en la base de datos local de inmediato
  try {
    const local = getLocalData<any>('inventory');
    local.push({ id: newId, ...payload });
    saveLocalData('inventory', local);
  } catch (e) {
    console.warn('Error sincronizando inventario local:', e);
  }

  // Ejecutar respaldo automático
  triggerAutoBackup(2000);

  return newId;
};

export const updateInventoryItem = async (id: string, itemData: any) => {
  const sanitized = sanitizeProductData(itemData);
  delete sanitized.id;
  delete sanitized.companyId;
  delete sanitized.createdAt;

  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, sanitized);

  // Actualizar en el almacenamiento local
  try {
    const local = getLocalData<any>('inventory');
    const index = local.findIndex(p => p.id === id);
    if (index !== -1) {
      local[index] = { ...local[index], ...sanitized };
      saveLocalData('inventory', local);
    }
  } catch (e) {
    console.warn('Error actualizando inventario local:', e);
  }

  // Ejecutar respaldo automático
  triggerAutoBackup(2000);
};

export const deleteInventoryItem = async (id: string) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);

  // Eliminar del almacenamiento local
  try {
    const local = getLocalData<any>('inventory');
    const filtered = local.filter(p => p.id !== id);
    saveLocalData('inventory', filtered);
  } catch (e) {
    console.warn('Error eliminando de inventario local:', e);
  }

  // Ejecutar respaldo automático
  triggerAutoBackup(2000);
};

