import { db } from './config';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  onSnapshot
} from 'firebase/firestore';

const COLLECTION_NAME = 'inventory';

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
  const q = query(collection(db, COLLECTION_NAME), where("companyId", "==", companyId));
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(items);
  }, (error) => {
    console.error("Error subscribing to inventory: ", error);
  });
};

export const addInventoryItem = async (companyId: string, itemData: any) => {
  try {
    const sanitized = sanitizeProductData(itemData);
    delete sanitized.id;

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...sanitized,
      companyId: companyId || 'local',
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding document: ", error);
    throw error;
  }
};

export const updateInventoryItem = async (id: string, itemData: any) => {
  try {
    const sanitized = sanitizeProductData(itemData);
    const { id: _, companyId, createdAt, ...updateData } = sanitized;
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("Error updating document: ", error);
    throw error;
  }
};

export const deleteInventoryItem = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error("Error deleting document: ", error);
    throw error;
  }
};

