import React, { useState } from 'react';
import { CloudUpload, Download, ShieldCheck, AlertTriangle } from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { getLocalData, saveLocalData } from '../services/localDb';

const COLLECTIONS = ['inventory', 'customers', 'sales', 'mechanics', 'staff', 'suppliers', 'receivings'];

const BackupScreen = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // Usaremos un ID de compañía fijo o el ID del primer admin para el respaldo.
  // En un sistema multi-tienda, este ID debería ser ingresado por el usuario.
  const backupId = 'local_store_backup'; 

  const handleBackup = async () => {
    if (currentUser?.role !== 'admin') {
      setMessage({ type: 'error', text: 'Solo un administrador puede realizar copias de seguridad.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const backupData: Record<string, any> = {};
      
      COLLECTIONS.forEach(collection => {
        backupData[collection] = getLocalData(collection);
      });

      backupData.timestamp = new Date().toISOString();
      backupData.backedUpBy = currentUser.name;

      const docRef = doc(db, 'backups', backupId);
      await setDoc(docRef, backupData);

      setMessage({ type: 'success', text: 'Copia de seguridad subida a la nube exitosamente.' });
    } catch (error) {
      console.error("Error al subir copia de seguridad:", error);
      setMessage({ type: 'error', text: 'Ocurrió un error al subir los datos a la nube.' });
    }

    setLoading(false);
  };

  const handleRestore = async () => {
    if (currentUser?.role !== 'admin') {
      setMessage({ type: 'error', text: 'Solo un administrador puede restaurar copias de seguridad.' });
      return;
    }

    if (!window.confirm('¿Estás seguro de que deseas restaurar desde la nube? Esto SOBREESCRIBIRÁ todos tus datos locales actuales.')) {
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const docRef = doc(db, 'backups', backupId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        
        COLLECTIONS.forEach(collection => {
          if (data[collection]) {
            saveLocalData(collection, data[collection]);
          }
        });

        setMessage({ type: 'success', text: 'Datos restaurados exitosamente. Por favor, recarga la página para aplicar los cambios.' });
      } else {
        setMessage({ type: 'error', text: 'No se encontró ninguna copia de seguridad en la nube.' });
      }
    } catch (error) {
      console.error("Error al restaurar copia de seguridad:", error);
      setMessage({ type: 'error', text: 'Ocurrió un error al descargar los datos desde la nube.' });
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CloudUpload size={28} color="var(--accent-primary)" /> Respaldo en la Nube
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Sincroniza y protege tus datos locales subiéndolos a Firebase.</p>
      </div>

      {message.text && (
        <div style={{ 
          padding: '12px 16px', 
          marginBottom: '24px', 
          borderRadius: '8px',
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: message.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)',
          border: `1px solid ${message.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)'}`,
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          {message.type === 'success' ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}
          <span style={{ fontWeight: 600 }}>{message.text}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Tarjeta de Respaldo */}
        <div className="card" style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <CloudUpload size={32} />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Subir a la Nube</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', flex: 1 }}>
            Guarda una copia segura de tu inventario, ventas, clientes y configuración en los servidores seguros.
          </p>
          <button 
            onClick={handleBackup} 
            disabled={loading || currentUser?.role !== 'admin'} 
            className="btn btn-primary" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', padding: '12px' }}
          >
            <CloudUpload size={18} /> {loading ? 'Procesando...' : 'Crear Respaldo Ahora'}
          </button>
        </div>

        {/* Tarjeta de Restauración */}
        <div className="card" style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Download size={32} />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>Restaurar Datos</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', flex: 1 }}>
            Descarga el último respaldo guardado en la nube. <b>Atención:</b> Esto reemplazará todos los datos locales actuales.
          </p>
          <button 
            onClick={handleRestore} 
            disabled={loading || currentUser?.role !== 'admin'} 
            className="btn" 
            style={{ 
              width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', padding: '12px',
              background: 'transparent', border: '1px solid #F59E0B', color: '#F59E0B', fontWeight: 600
            }}
          >
            <Download size={18} /> {loading ? 'Procesando...' : 'Restaurar desde Nube'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default BackupScreen;
