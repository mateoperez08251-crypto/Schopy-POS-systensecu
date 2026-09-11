import React, { useState, useEffect } from 'react';
import { CloudUpload, Download, ShieldCheck, AlertTriangle, X } from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { getLocalData, saveLocalData } from '../services/localDb';
import { createPortal } from 'react-dom';

const COLLECTIONS = ['inventory', 'customers', 'sales', 'mechanics', 'staff', 'suppliers', 'receivings'];

const FirebaseLoginModal = ({ isOpen, onClose, onLogin }: { isOpen: boolean, onClose: () => void, onLogin: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (err: any) {
      console.error(err);
      setError('Credenciales incorrectas o problema de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="checkout-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '24px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-medium)', background: 'var(--bg-app)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CloudUpload size={24} color="var(--accent-primary)" /> Conectar con la Nube
          </h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
            Inicia sesión con tu cuenta de Firebase para habilitar los respaldos en la nube. Solo necesitas hacerlo una vez.
          </p>

          {error && (
            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
              {error}
            </div>
          )}
          
          <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Correo Electrónico</label>
            <input 
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="ejemplo@correo.com"
              style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }} 
            />
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Contraseña</label>
            <input 
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ background: 'var(--bg-app)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: 'var(--radius-md)', outline: 'none' }} 
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: '8px', height: '48px' }}>
            {loading ? 'Conectando...' : 'Iniciar Sesión en la Nube'}
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
};

const BackupScreen = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [isFirebaseUser, setIsFirebaseUser] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'backup' | 'restore' | null>(null);

  // Usaremos un ID de compañía fijo o el ID del primer admin para el respaldo.
  const backupId = 'local_store_backup'; 

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsFirebaseUser(!!user);
      if (user && showLoginModal) {
        setShowLoginModal(false);
        if (pendingAction === 'backup') executeBackup();
        if (pendingAction === 'restore') executeRestore();
      }
    });
    return () => unsub();
  }, [showLoginModal, pendingAction]);

  const handleBackup = async () => {
    if (currentUser?.role !== 'admin') {
      setMessage({ type: 'error', text: 'Solo un administrador puede realizar copias de seguridad.' });
      return;
    }
    if (!isFirebaseUser) {
      setPendingAction('backup');
      setShowLoginModal(true);
      return;
    }
    executeBackup();
  };

  const executeBackup = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const backupData: Record<string, any> = {};
      
      COLLECTIONS.forEach(collection => {
        backupData[collection] = getLocalData(collection);
      });

      backupData.timestamp = new Date().toISOString();
      backupData.backedUpBy = currentUser?.name || 'Admin';

      const docRef = doc(db, 'backups', backupId);
      await setDoc(docRef, backupData);

      setMessage({ type: 'success', text: 'Copia de seguridad subida a la nube exitosamente.' });
    } catch (error) {
      console.error("Error al subir copia de seguridad:", error);
      setMessage({ type: 'error', text: 'Ocurrió un error al subir los datos a la nube.' });
    }

    setLoading(false);
    setPendingAction(null);
  };

  const handleRestore = async () => {
    if (currentUser?.role !== 'admin') {
      setMessage({ type: 'error', text: 'Solo un administrador puede restaurar copias de seguridad.' });
      return;
    }

    if (!window.confirm('¿Estás seguro de que deseas restaurar desde la nube? Esto SOBREESCRIBIRÁ todos tus datos locales actuales.')) {
      return;
    }

    if (!isFirebaseUser) {
      setPendingAction('restore');
      setShowLoginModal(true);
      return;
    }
    executeRestore();
  };

  const executeRestore = async () => {
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
    setPendingAction(null);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CloudUpload size={28} color="var(--accent-primary)" /> Respaldo en la Nube
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Sincroniza y protege tus datos locales subiéndolos a Firebase.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '24px', background: isFirebaseUser ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: isFirebaseUser ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
          {isFirebaseUser ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            {isFirebaseUser ? 'Nube Conectada' : 'Nube Desconectada'}
          </span>
        </div>
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

      <FirebaseLoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        onLogin={() => {
          // El useEffect onAuthStateChanged se encargará de continuar
        }} 
      />
    </div>
  );
};

export default BackupScreen;
