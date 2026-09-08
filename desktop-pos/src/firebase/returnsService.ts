import { db } from './config';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

const COLLECTION_NAME = 'returns';

export const subscribeToReturns = (companyId: string, callback: (data: any[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), where('companyId', '==', companyId));
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
    callback(items);
  }, (error) => {
    console.error("Error subscribing to returns:", error);
  });
};

export const addReturn = async (companyId: string, returnData: any) => {
  const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const docRef = doc(db, COLLECTION_NAME, newId);
  await setDoc(docRef, {
    ...returnData,
    id: newId,
    companyId,
    createdAt: new Date().toISOString()
  });
  return newId;
};

export const deleteReturn = async (id: string) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};
