import { db } from './config';
import { collection, query, where, onSnapshot, doc, setDoc } from 'firebase/firestore';

export interface Receiving {
  id: string;
  date: string;
  supplier: string;
  items: number;
  totalCost: number;
  user: string;
  notes?: string;
  companyId?: string;
}

const COLLECTION_NAME = 'receivings';

export const subscribeToReceivings = (companyId: string, callback: (data: Receiving[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), where('companyId', '==', companyId));
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    } as Receiving));
    callback(items);
  }, (error) => {
    console.error("Error subscribing to receivings:", error);
  });
};

export const addReceivingLocal = async (companyId: string, receiving: Omit<Receiving, 'id'>): Promise<Receiving> => {
  const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const docRef = doc(db, COLLECTION_NAME, newId);
  const newReceiving = { ...receiving, companyId, id: newId };
  await setDoc(docRef, newReceiving);
  return newReceiving;
};

// Keep old name for compatibility
export const getReceivingsLocal = (): Receiving[] => {
  // This is no longer used - data comes from subscription
  return [];
};
