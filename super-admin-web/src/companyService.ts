import { db } from './firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';

export interface Company {
  id: string; // Document ID (UID)
  companyId: string;
  companyName: string;
  email: string;
  createdAt: string;
  plan: 'mensual' | 'anual';
  monthlyFee: number;
  status: 'activa' | 'suspendida' | 'prueba';
  subscriptionStart: string;
  subscriptionEnd: string;
}

export const getCompanies = async (): Promise<Company[]> => {
  const q = query(collection(db, 'users'), where('role', '==', 'admin'));
  const snapshot = await getDocs(q);
  
  const companies: Company[] = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    companies.push({
      id: doc.id,
      companyId: data.companyId || '',
      companyName: data.companyName || 'Sin Nombre',
      email: data.email || '',
      createdAt: data.createdAt || new Date().toISOString(),
      plan: data.plan || 'mensual',
      monthlyFee: data.monthlyFee || 0,
      status: data.status || 'prueba',
      subscriptionStart: data.subscriptionStart || new Date().toISOString(),
      subscriptionEnd: data.subscriptionEnd || new Date().toISOString(),
    });
  });
  
  return companies;
};

export const updateCompanyStatus = async (uid: string, status: 'activa' | 'suspendida') => {
  await updateDoc(doc(db, 'users', uid), { status });
};

export const renewSubscription = async (uid: string, daysToAdd: number) => {
  const newEndDate = new Date();
  newEndDate.setDate(newEndDate.getDate() + daysToAdd);
  
  await updateDoc(doc(db, 'users', uid), { 
    subscriptionEnd: newEndDate.toISOString(),
    status: 'activa' 
  });
};
