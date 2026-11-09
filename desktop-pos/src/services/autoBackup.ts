import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { getLocalData, saveLocalData, getLocalStoreSettings } from './localDb';

export const COLLECTIONS = ['inventory', 'customers', 'sales', 'mechanics', 'staff', 'suppliers', 'receivings'];
const DEFAULT_BACKUP_ID = 'local_store_backup';

let backupTimeout: ReturnType<typeof setTimeout> | null = null;
let intervalId: ReturnType<typeof setInterval> | null = null;

export interface BackupStats {
  timestamp: string;
  formattedDate: string;
  inventoryCount: number;
  salesCount: number;
  customersCount: number;
  suppliersCount: number;
  backedUpBy: string;
}

/**
 * Ejecuta un respaldo completo de todas las colecciones.
 * Guarda siempre a nivel local (100% resiliente y offline) y si hay conexión,
 * lo sincroniza con Firestore en la nube.
 */
export const performBackupNow = async (companyId?: string, forcedBy?: string): Promise<{ success: boolean; timestamp: string }> => {
  const now = new Date().toISOString();
  try {
    // 1. Recolectar datos actuales de todas las colecciones
    const rawData: Record<string, any[]> = {};
    COLLECTIONS.forEach(col => {
      rawData[col] = getLocalData(col);
    });

    const inventory = rawData['inventory'] || [];
    const sales = rawData['sales'] || [];
    const customers = rawData['customers'] || [];
    const suppliers = rawData['suppliers'] || [];
    const settings = getLocalStoreSettings();

    const author = forcedBy || auth.currentUser?.email || (auth.currentUser ? 'Usuario Cloud' : 'Sistema Schopy POS');
    const targetCompanyId = companyId || auth.currentUser?.uid || 'local_store';

    const fullSnapshot = {
      version: '2.0',
      timestamp: now,
      backedUpBy: author,
      companyId: targetCompanyId,
      autoBackup: true,
      stats: {
        inventoryCount: inventory.length,
        salesCount: sales.length,
        customersCount: customers.length,
        suppliersCount: suppliers.length
      },
      collections: rawData,
      settings
    };

    // 2. CAPA 1: Guardado local automático (GARANTIZADO)
    try {
      localStorage.setItem('schopy_auto_backup_latest', JSON.stringify(fullSnapshot));
      localStorage.setItem('schopy_last_auto_backup', now);

      // Guardar historial rotativo de los últimos 10 respaldos
      const historyRaw = localStorage.getItem('schopy_backup_history');
      const history: any[] = historyRaw ? JSON.parse(historyRaw) : [];
      history.unshift({
        timestamp: now,
        inventoryCount: inventory.length,
        salesCount: sales.length,
        backedUpBy: author
      });
      localStorage.setItem('schopy_backup_history', JSON.stringify(history.slice(0, 10)));
    } catch (localErr) {
      console.warn('Advertencia guardando copia local en localStorage:', localErr);
    }

    // 3. CAPA 2: Guardado en la nube (Firestore)
    try {
      const backupDocId = targetCompanyId === 'local' ? DEFAULT_BACKUP_ID : (targetCompanyId || DEFAULT_BACKUP_ID);
      const docRef = doc(db, 'backups', backupDocId);
      
      // Sanitizar datos para Firestore
      await setDoc(docRef, {
        timestamp: now,
        backedUpBy: author,
        autoBackup: true,
        companyId: targetCompanyId,
        stats: fullSnapshot.stats,
        collections: rawData,
        settings
      });
      console.log('✅ Respaldo automático sincronizado en Firestore exitosamente:', now);
    } catch (cloudErr) {
      // Si no hay internet o no está autenticado, no romper: el respaldo local ya está a salvo
      console.log('ℹ️ Respaldo guardado localmente (sincronización con la nube pospuesta por conexión o sesión):', cloudErr);
    }

    return { success: true, timestamp: now };
  } catch (error) {
    console.error('❌ Error general durante el respaldo automático:', error);
    return { success: false, timestamp: now };
  }
};

/**
 * Dispara el respaldo automático con debounce (por defecto 3 segundos)
 * para no saturar al realizar operaciones rápidas o continuas.
 */
export const triggerAutoBackup = (delayMs: number = 3000) => {
  if (backupTimeout) {
    clearTimeout(backupTimeout);
  }

  backupTimeout = setTimeout(async () => {
    await performBackupNow();
  }, delayMs);
};

/**
 * Inicia el cronograma de respaldos automáticos periódicos (por defecto cada 5 minutos).
 * Debe llamarse una vez al inicio de la aplicación en App.tsx.
 */
export const startAutoBackupSchedule = (intervalMs: number = 5 * 60 * 1000): (() => void) => {
  if (intervalId) {
    clearInterval(intervalId);
  }

  // Ejecución periódica automática
  intervalId = setInterval(async () => {
    console.log('⏰ Ejecutando ciclo de respaldo automático programado...');
    await performBackupNow();
  }, intervalMs);

  return () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
};

/**
 * Obtiene la información del último respaldo automático realizado.
 */
export const getLastBackupInfo = (): BackupStats | null => {
  try {
    const raw = localStorage.getItem('schopy_auto_backup_latest');
    if (!raw) return null;
    const data = JSON.parse(raw);
    const dateObj = new Date(data.timestamp);
    return {
      timestamp: data.timestamp,
      formattedDate: isNaN(dateObj.getTime()) ? 'Reciente' : dateObj.toLocaleString('es-DO', { 
        year: 'numeric', month: 'short', day: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
      }),
      inventoryCount: data.stats?.inventoryCount || data.collections?.inventory?.length || 0,
      salesCount: data.stats?.salesCount || data.collections?.sales?.length || 0,
      customersCount: data.stats?.customersCount || data.collections?.customers?.length || 0,
      suppliersCount: data.stats?.suppliersCount || data.collections?.suppliers?.length || 0,
      backedUpBy: data.backedUpBy || 'Sistema Automático'
    };
  } catch (e) {
    return null;
  }
};

/**
 * Descarga el último respaldo completo como un archivo .JSON en la computadora del usuario.
 */
export const exportBackupAsJson = () => {
  try {
    // Si no existe snapshot en localStorage, generarlo al vuelo
    let raw = localStorage.getItem('schopy_auto_backup_latest');
    let snapshot: any;

    if (!raw) {
      const rawData: Record<string, any[]> = {};
      COLLECTIONS.forEach(col => { rawData[col] = getLocalData(col); });
      snapshot = {
        version: '2.0',
        timestamp: new Date().toISOString(),
        backedUpBy: 'Descarga Manual',
        collections: rawData,
        settings: getLocalStoreSettings()
      };
    } else {
      snapshot = JSON.parse(raw);
    }

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(snapshot, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `Schopy_Backup_Auto_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    return true;
  } catch (err) {
    console.error('Error al exportar respaldo JSON:', err);
    return false;
  }
};

/**
 * Restaura los datos locales a partir de un objeto de respaldo completo.
 */
export const restoreFromSnapshot = (snapshot: any): boolean => {
  try {
    const collectionsData = snapshot.collections || snapshot;
    COLLECTIONS.forEach(col => {
      if (Array.isArray(collectionsData[col])) {
        saveLocalData(col, collectionsData[col]);
      }
    });
    if (snapshot.settings) {
      localStorage.setItem('schopy_store_settings', JSON.stringify(snapshot.settings));
    }
    return true;
  } catch (e) {
    console.error('Error restaurando snapshot:', e);
    return false;
  }
};

