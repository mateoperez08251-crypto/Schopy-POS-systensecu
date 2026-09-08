import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from './config';

export type AuditSeverity = 'info' | 'warning' | 'danger';

export interface AuditEvent {
  id?: string;
  companyId: string;
  userId: string;
  userName: string;
  action: string; // Ej. "Venta Completada", "Cajón Abierto"
  details: string; // Ej. "Total: $500. Método: Efectivo"
  severity: AuditSeverity;
  timestamp?: any;
}

export const logAuditEvent = async (
  companyId: string, 
  userId: string, 
  userName: string, 
  action: string, 
  details: string, 
  severity: AuditSeverity = 'info'
) => {
  if (!companyId) return;
  try {
    const auditRef = collection(db, 'audit_logs');
    await addDoc(auditRef, {
      companyId,
      userId,
      userName,
      action,
      details,
      severity,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error("Error logging audit event:", error);
  }
};

export const subscribeToAuditLogs = (companyId: string, callback: (logs: AuditEvent[]) => void) => {
  if (!companyId) return () => {};
  
  const q = query(
    collection(db, 'audit_logs'),
    where('companyId', '==', companyId),
    orderBy('timestamp', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AuditEvent[];
    callback(logs);
  });
};
