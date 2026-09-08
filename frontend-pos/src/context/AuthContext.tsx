import { createContext, useContext, useEffect, useState } from 'react';
import type { FC, ReactNode } from 'react';
import { auth, db } from '../firebase/config';
import { 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface UserData {
  companyId: string;
  role: 'admin' | 'cashier';
  name: string;
  subscriptionEnd?: string;
  status?: string;
  companyName?: string;
  address?: string;
  phone?: string;
  taxId?: string;
  currency?: string;
  taxRate?: number;
  ticketFooter?: string;
  requirePinForDiscount?: boolean;
  requirePinForDelete?: boolean;
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  needsSetup: boolean;
  isSubscriptionExpired: boolean;
  daysRemaining: number | null;
  setNeedsSetup: (value: boolean) => void;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userData: null,
  needsSetup: false,
  isSubscriptionExpired: false,
  daysRemaining: null,
  setNeedsSetup: () => {},
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>({ uid: 'mock-user', email: 'mock@example.com' } as unknown as User);
  const [userData, setUserData] = useState<UserData | null>({
    companyId: 'mock-company',
    role: 'admin',
    name: 'Admin Local',
  });
  const [needsSetup, setNeedsSetup] = useState<boolean>(false);
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState<boolean>(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(9999);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Auth bypass: login disabled temporarily
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  const value = {
    currentUser,
    userData,
    needsSetup,
    isSubscriptionExpired,
    daysRemaining,
    setNeedsSetup,
    loading,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
