import { db } from './config';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const COLLECTION_NAME = 'inventory';

export const subscribeToInventory = (companyId: string, callback: (data: any[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), where('companyId', '==', companyId));
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(items);
  }, (error) => {
    console.error("Error subscribing to inventory:", error);
  });
};

export const addInventoryItem = async (companyId: string, itemData: any) => {
  const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const docRef = doc(db, COLLECTION_NAME, newId);
  await setDoc(docRef, {
    ...itemData,
    companyId,
    createdAt: new Date().toISOString()
  });
  return newId;
};

export const updateInventoryItem = async (id: string, itemData: any) => {
  const { id: _, companyId, createdAt, ...updateData } = itemData;
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, updateData);
};

export const deleteInventoryItem = async (id: string) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};
