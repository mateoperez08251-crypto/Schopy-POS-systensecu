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
  localLogin: (pin: string) => Promise<boolean>;
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
        setCurrentUser(user);
      }
    }
    setLoading(false);
  }, []);

  const localLogin = async (pin: string): Promise<boolean> => {
    const user = getStaffByPin(pin);
    if (user) {
      setCurrentUser(user);
      sessionStorage.setItem('schopy_active_pin', pin);
      return true;
    }
    return false;
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
    logout,
    createInitialAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
