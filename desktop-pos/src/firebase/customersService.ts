import { db } from './config';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const COLLECTION_NAME = 'customers';

export const subscribeToCustomers = (companyId: string, callback: (data: any[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), where('companyId', '==', companyId));
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(items);
  }, (error) => {
    console.error("Error subscribing to customers:", error);
  });
};

export const addCustomer = async (companyId: string, customerData: any) => {
  const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const docRef = doc(db, COLLECTION_NAME, newId);
  await setDoc(docRef, {
    ...customerData,
    companyId,
    createdAt: new Date().toISOString()
  });
  return newId;
};

export const updateCustomer = async (id: string, customerData: any) => {
  const { id: _, companyId, createdAt, ...updateData } = customerData;
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, updateData);
};

export const deleteCustomer = async (id: string) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};
