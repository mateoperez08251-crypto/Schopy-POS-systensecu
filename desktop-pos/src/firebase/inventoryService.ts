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
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...itemData,
      companyId, // Etiqueta obligatoria para el SaaS
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
    const docRef = doc(db, COLLECTION_NAME, id);
    // Extraemos campos que no deben actualizarse
    const { id: _, companyId, createdAt, ...updateData } = itemData;
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
