import { db } from './config';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const COLLECTION_NAME = 'mechanics';

export const subscribeToMechanics = (companyId: string, callback: (data: any[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), where('companyId', '==', companyId));
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
    callback(items);
  }, (error) => {
    console.error("Error subscribing to mechanics:", error);
  });
};

export const addMechanic = async (companyId: string, mechanicData: any) => {
  const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const docRef = doc(db, COLLECTION_NAME, newId);
  await setDoc(docRef, {
    ...mechanicData,
    companyId,
    commissionRate: mechanicData.commissionRate || 5,
    createdAt: new Date().toISOString()
  });
  return newId;
};

export const updateMechanic = async (id: string, mechanicData: any) => {
  const { id: _, createdAt, companyId, ...updateData } = mechanicData;
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, updateData);
};

export const deleteMechanic = async (id: string) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};
