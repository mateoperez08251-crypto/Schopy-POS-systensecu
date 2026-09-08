import React, { createContext, useContext, useState, useEffect } from 'react';
import type { FC, ReactNode } from 'react';
import { getStaffByPin, addStaffLocal, hasAdminLocal } from '../firebase/localStaffService';

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
}

interface AuthContextType {
  currentUser: UserData | null;
  userData: UserData | null;
  hasAdmin: boolean;
  loading: boolean;
  localLogin: (pin: string, expectedUserId?: string) => Promise<boolean>;
  forceLogin: (user: UserData) => void;
  logout: () => void;
  createInitialAdmin: (name: string, pin: string) => Promise<void>;
  setNeedsSetup?: (value: boolean) => void;
  daysRemaining?: number | null;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userData: null,
  hasAdmin: false,
  loading: true,
  localLogin: async () => false,
  forceLogin: () => {},
  logout: () => {},
  createInitialAdmin: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [hasAdmin, setHasAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if there is an admin locally
    setHasAdmin(hasAdminLocal());
    
    // Check if user was previously logged in this session
    const savedPin = sessionStorage.getItem('schopy_active_pin');
    if (savedPin) {
      const user = getStaffByPin(savedPin);
      if (user) {
        let storeSettings = {};
        try {
          const stored = localStorage.getItem('schopy_store_settings');
          if (stored) storeSettings = JSON.parse(stored);
        } catch(e) {}
        setCurrentUser({ ...user, ...storeSettings });
      }
    }
    setLoading(false);
  }, []);

  const localLogin = async (pin: string, expectedUserId?: string): Promise<boolean> => {
    const user = getStaffByPin(pin);
    if (user) {
      if (expectedUserId && user.id !== expectedUserId) {
        return false;
      }
      let storeSettings = {};
      try {
        const stored = localStorage.getItem('schopy_store_settings');
        if (stored) storeSettings = JSON.parse(stored);
      } catch(e) {}
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
    } catch(e) {}
    setCurrentUser({ ...user, ...storeSettings });
    sessionStorage.setItem('schopy_active_pin', user.pin || '');
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('schopy_active_pin');
  };

  const createInitialAdmin = async (name: string, pin: string) => {
    await addStaffLocal({
      name,
      pin,
      role: 'admin'
    });
    setHasAdmin(true);
    await localLogin(pin);
  };

  const value = {
    currentUser,
    userData: currentUser, // mapped for compatibility
    hasAdmin,
    loading,
    localLogin,
    forceLogin,
    logout,
    createInitialAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
