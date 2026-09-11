import React, { createContext, useContext, useState, useEffect } from 'react';
import type { FC, ReactNode } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, setDoc } from 'firebase/firestore';

export interface UserData {
  id: string;
  role: 'admin' | 'cashier';
  name: string;
  pin: string;
  companyId?: string;
  email?: string;
  uid?: string;
  currency?: string;
  taxRate?: number;
  taxEnabled?: boolean;
  companyName?: string;
  taxId?: string;
  address?: string;
  phone?: string;
  ticketFooter?: string;
  printerName?: string;
  autoOpenDrawer?: boolean;
}

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  companyId: string | null;
  currentUser: UserData | null;
  userData: UserData | null;
  hasAdmin: boolean;
  loading: boolean;
  staffList: UserData[];
  localLogin: (pin: string, expectedUserId?: string) => Promise<boolean>;
  forceLogin: (user: UserData) => void;
  refreshSettings: () => void;
  logout: () => void;
  firebaseLogout: () => void;
  createInitialAdmin: (name: string, pin: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  companyId: null,
  currentUser: null,
  userData: null,
  hasAdmin: false,
  loading: true,
  staffList: [],
  localLogin: async () => false,
  forceLogin: () => {},
  refreshSettings: () => {},
  logout: () => {},
  firebaseLogout: () => {},
  createInitialAdmin: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [staffList, setStaffList] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Escuchar autenticación de Firebase
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        setCompanyId(user.uid); // Usamos el UID del usuario principal como companyId
      } else {
        setCompanyId(null);
        setStaffList([]);
        setCurrentUser(null);
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // 2. Si hay companyId, suscribirse al staff de Firestore
  useEffect(() => {
    if (!companyId) return;
    
    const q = query(collection(db, 'users'), where('companyId', '==', companyId));
    const unsub = onSnapshot(q, (snapshot) => {
      const staff = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
      setStaffList(staff);
      
      // Auto-login si ya había sesión local
      const savedPin = sessionStorage.getItem('schopy_active_pin');
      if (savedPin && !currentUser) {
        const user = staff.find(s => s.pin === savedPin);
        if (user) {
          let storeSettings = {};
          try {
            const stored = localStorage.getItem('schopy_store_settings');
            if (stored) storeSettings = JSON.parse(stored);
          } catch(e) {
            console.error(e);
          }
          setCurrentUser({ ...user, ...storeSettings });
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Error cargando staff:", error);
      setLoading(false);
    });
    
    return () => unsub();
  }, [companyId]);

  const hasAdmin = staffList.some(s => s.role === 'admin');

  const localLogin = async (pin: string, expectedUserId?: string): Promise<boolean> => {
    const user = staffList.find(s => s.pin === pin);
    if (user) {
      if (expectedUserId && user.id !== expectedUserId) return false;
      let storeSettings = {};
      try {
        const stored = localStorage.getItem('schopy_store_settings');
        if (stored) storeSettings = JSON.parse(stored);
      } catch(e) {
        console.error(e);
      }
      setCurrentUser({ ...user, ...storeSettings });
      sessionStorage.setItem('schopy_active_pin', pin);
      return true;
    }
    return false;
  };

  const forceLogin = (user: UserData) => {
    let storeSettings = {};
    try {
      const stored = localStorage.getItem('schopy_store_settings');
      if (stored) storeSettings = JSON.parse(stored);
    } catch(e) {
      console.error(e);
    }
    setCurrentUser({ ...user, ...storeSettings });
    sessionStorage.setItem('schopy_active_pin', user.pin || '');
  };

  const refreshSettings = () => {
    if (!currentUser) return;
    let storeSettings = {};
    try {
      const stored = localStorage.getItem('schopy_store_settings');
      if (stored) storeSettings = JSON.parse(stored);
    } catch(e) {
      console.error(e);
    }
    setCurrentUser({ ...currentUser, ...storeSettings });
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('schopy_active_pin');
  };

  const firebaseLogout = () => {
    auth.signOut();
    logout();
  };

  const createInitialAdmin = async (name: string, pin: string) => {
    if (!companyId) return;
    const newAdminId = Date.now().toString();
    const adminRef = doc(db, 'users', newAdminId);
    const newAdmin = {
      name,
      pin,
      role: 'admin',
      companyId,
      createdAt: new Date().toISOString()
    };
    await setDoc(adminRef, newAdmin);
    await localLogin(pin);
  };

  const value = {
    firebaseUser,
    companyId,
    currentUser,
    userData: currentUser,
    hasAdmin,
    loading,
    staffList,
    localLogin,
    forceLogin,
    refreshSettings,
    logout,
    firebaseLogout,
    createInitialAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
