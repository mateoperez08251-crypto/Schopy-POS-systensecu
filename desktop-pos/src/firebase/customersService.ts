import { db } from './config';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot
} from 'firebase/firestore';

const COLLECTION_NAME = 'customers';

export const subscribeToCustomers = (companyId: string, callback: (data: any[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), where("companyId", "==", companyId));
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(items);
  }, (error) => {
    console.error("Error subscribing to customers: ", error);
  });
};

export const addCustomer = async (companyId: string, customerData: any) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...customerData,
      companyId, // Etiqueta obligatoria para el SaaS
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding customer: ", error);
    throw error;
  }
};

export const updateCustomer = async (id: string, customerData: any) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    // Extraemos campos que no deben actualizarse
    const { id: _, companyId, createdAt, ...updateData } = customerData;
    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("Error updating customer: ", error);
    throw error;
  }
};

export const deleteCustomer = async (id: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    console.error("Error deleting customer: ", error);
    throw error;
  }
};
