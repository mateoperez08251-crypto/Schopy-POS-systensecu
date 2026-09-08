import { db } from './config';
import { collection, query, where, onSnapshot, doc, setDoc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';

const COLLECTION_NAME = 'staff';

export const subscribeToStaffLocal = (companyId: string, callback: (data: any[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), where('companyId', '==', companyId));
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
    callback(items);
  }, (error) => {
    console.error("Error subscribing to staff:", error);
  });
};

export const getStaffByPin = (pin: string): any | undefined => {
  // This is now handled by AuthContext using staffList
  return undefined;
};

export const getAllStaffLocal = (): any[] => {
  // This is now handled by AuthContext using staffList
  return [];
};

export const addStaffLocal = async (companyId: string, staffData: any) => {
  const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
  const docRef = doc(db, COLLECTION_NAME, newId);
  await setDoc(docRef, {
    ...staffData,
    companyId,
    createdAt: new Date().toISOString()
  });
  return newId;
};

export const updateStaffLocal = async (id: string, staffData: any) => {
  const { id: _, createdAt, companyId, ...updateData } = staffData;
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, updateData);
};

export const deleteStaffLocal = async (id: string) => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};

export const hasAdminLocal = (): boolean => {
  // This is now handled by AuthContext
  return false;
};
