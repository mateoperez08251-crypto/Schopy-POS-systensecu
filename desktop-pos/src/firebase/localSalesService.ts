import { db } from './config';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const COLLECTION_NAME = 'sales';

export const subscribeToSales = (companyId: string, callback: (data: any[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), where('companyId', '==', companyId));
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      ...doc.data(),
      docId: doc.id
    }));
    callback(items);
  }, (error) => {
    console.error("Error subscribing to sales:", error);
  });
};

export const addSale = async (companyId: string, saleData: any) => {
  const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const docRef = doc(db, COLLECTION_NAME, newId);
  await setDoc(docRef, {
    ...saleData,
    companyId,
    createdAt: new Date().toISOString()
  });
  return newId;
};

export const updateSale = async (id: string, saleData: any) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, saleData);
};

export const deleteSale = async (id: string) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};
