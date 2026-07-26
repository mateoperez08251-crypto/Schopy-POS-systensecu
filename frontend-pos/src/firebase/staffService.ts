import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, firebaseConfig } from './config';
import { doc, setDoc, query, collection, where, onSnapshot, deleteDoc } from 'firebase/firestore';

// Initialize a secondary app just for creating users so the admin doesn't get logged out
const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
const secondaryAuth = getAuth(secondaryApp);

export const subscribeToStaff = (companyId: string, callback: (data: any[]) => void, onError?: (err: any) => void) => {
  const q = query(collection(db, 'users'), where("companyId", "==", companyId));
  
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(items);
  }, (error) => {
    console.error("Error subscribing to staff: ", error);
    if (onError) onError(error);
  });
};

export const createCashier = async (companyId: string, name: string, email: string, uid: string) => {
  try {
    // Solo creamos el documento en Firestore (El usuario ya fue creado en la consola de Firebase)
    await setDoc(doc(db, 'users', uid), {
      name,
      companyId,
      role: 'cashier',
      email,
      createdAt: new Date().toISOString()
    });
    
    return uid;
  } catch (error) {
    console.error("Error creating cashier doc: ", error);
    throw error;
  }
};

export const deleteCashier = async (uid: string) => {
  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch (error) {
    console.error("Error deleting cashier doc: ", error);
    throw error;
  }
};
