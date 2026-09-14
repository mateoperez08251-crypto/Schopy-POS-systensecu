import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { getLocalData } from './localDb';

const COLLECTIONS = ['inventory', 'customers', 'sales', 'mechanics', 'staff', 'suppliers', 'receivings'];
const backupId = 'local_store_backup'; 

let backupTimeout: ReturnType<typeof setTimeout> | null = null;

export const triggerAutoBackup = () => {
  if (backupTimeout) {
    clearTimeout(backupTimeout);
  }
  
  // Debounce 10 seconds (10000 ms)
  backupTimeout = setTimeout(async () => {
    try {
      // Solo hacer backup si el usuario conectó su cuenta de la nube
      if (!auth.currentUser) return;

      const backupData: Record<string, any> = {};
      COLLECTIONS.forEach(collection => {
        backupData[collection] = getLocalData(collection);
      });

      backupData.timestamp = new Date().toISOString();
      backupData.backedUpBy = auth.currentUser.email || 'Sistema (Auto)';
      backupData.autoBackup = true;

      const docRef = doc(db, 'backups', backupId);
      await setDoc(docRef, backupData);
      console.log('✅ Auto-backup en la nube completado exitosamente.');
    } catch (error) {
      console.error('❌ Error en el Auto-backup de la nube:', error);
    }
  }, 10000);
};
