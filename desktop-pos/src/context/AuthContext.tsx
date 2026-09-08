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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [needsSetup, setNeedsSetup] = useState<boolean>(false);
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState<boolean>(false);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          // Fetch additional user data like companyId from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserData;
            if (!data.companyId) {
              setNeedsSetup(true);
            } else {
              setNeedsSetup(false);
              setUserData(data);

              // Check subscription
              let companyData = data;
              if (data.role === 'cashier') {
                const companyDoc = await getDoc(doc(db, 'users', data.companyId));
                if (companyDoc.exists()) {
                  companyData = companyDoc.data() as UserData;
                }
              }

              if (companyData.status === 'suspendida') {
                setIsSubscriptionExpired(true);
                setDaysRemaining(0);
              } else if (companyData.subscriptionEnd) {
                const end = new Date(companyData.subscriptionEnd).getTime();
                const diff = end - Date.now();
                const days = Math.ceil(diff / (1000 * 3600 * 24));
                setDaysRemaining(days);
                
                // 3 days grace period
                if (days < -3) {
                  setIsSubscriptionExpired(true);
                } else {
                  setIsSubscriptionExpired(false);
                }
              } else {
                setIsSubscriptionExpired(false);
                setDaysRemaining(null);
              }
            }
          } else {
            setNeedsSetup(true);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUserData(null);
          // Don't set needsSetup to true on permission error to avoid loops
        }
      } else {
        setUserData(null);
        setNeedsSetup(false);
      }
      
      setLoading(false);
    });

    return unsubscribe;
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
