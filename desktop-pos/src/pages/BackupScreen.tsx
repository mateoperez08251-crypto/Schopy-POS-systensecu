import React, { useState, useEffect } from 'react';
import { CloudUpload, Download, ShieldCheck, AlertTriangle, X, CheckCircle2, FileDown, RefreshCw, Database } from 'lucide-react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { getLocalData, saveLocalData } from '../services/localDb';
import { 
  performBackupNow, 
  getLastBackupInfo, 
  exportBackupAsJson, 
  restoreFromSnapshot, 
  BackupStats,
  COLLECTIONS 
} from '../services/autoBackup';
import { createPortal } from 'react-dom';

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
  const { currentUser, companyId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [isFirebaseUser, setIsFirebaseUser] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'backup' | 'restore' | null>(null);
  const [backupStats, setBackupStats] = useState<BackupStats | null>(null);

  const backupId = companyId || 'local_store_backup'; 

  const refreshStats = () => {
    const stats = getLastBackupInfo();
    setBackupStats(stats);
  };

  useEffect(() => {
    refreshStats();
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
    executeBackup();
  };

  const executeBackup = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await performBackupNow(companyId || undefined, currentUser?.name);
      refreshStats();
      if (res.success) {
        setMessage({ type: 'success', text: '¡Respaldo automático y en la nube completado exitosamente!' });
      } else {
        setMessage({ type: 'error', text: 'Hubo un error al generar el respaldo.' });
      }
    } catch (error) {
      console.error("Error al realizar respaldo:", error);
      setMessage({ type: 'error', text: 'Ocurrió un error al procesar el respaldo.' });
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
        restoreFromSnapshot(data);
        refreshStats();
        setMessage({ type: 'success', text: 'Datos restaurados exitosamente. Por favor, reinicia o recarga la aplicación.' });
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

  const handleExportJson = () => {
    const ok = exportBackupAsJson();
    if (ok) {
      setMessage({ type: 'success', text: 'Archivo de respaldo .JSON descargado a tu computadora.' });
    } else {
      setMessage({ type: 'error', text: 'No se pudo generar el archivo de descarga.' });
    }
  };

  const handleRestoreLocalSnapshot = () => {
    if (!window.confirm('¿Deseas restaurar la última copia automática local? Esto restaurará el último estado guardado en este equipo.')) {
      return;
    }
    const raw = localStorage.getItem('schopy_auto_backup_latest');
    if (!raw) {
      setMessage({ type: 'error', text: 'No hay copia de seguridad local disponible para restaurar.' });
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      restoreFromSnapshot(parsed);
      refreshStats();
      setMessage({ type: 'success', text: 'Datos restaurados desde la copia local. Recarga la aplicación para visualizar los cambios.' });
    } catch (e) {
      setMessage({ type: 'error', text: 'El archivo de respaldo local está dañado.' });
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Database size={28} color="var(--accent-primary)" /> Copia de Seguridad y Respaldo
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Tus datos se respaldan automáticamente de forma continua.</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '24px', background: isFirebaseUser ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: isFirebaseUser ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
          {isFirebaseUser ? <ShieldCheck size={18} /> : <AlertTriangle size={18} />}
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
            {isFirebaseUser ? 'Nube Conectada' : 'Modo Respaldo Local'}
          </span>
        </div>
      </div>

      {/* Banner de Respaldo Automático Permanente */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(99, 102, 241, 0.08) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'var(--accent-success)', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
          }}>
            <CheckCircle2 size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Respaldo Automático Permanente Activo</h3>
              <span style={{ 
                fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', 
                background: '#10B981', color: 'white', textTransform: 'uppercase' 
              }}>SIEMPRE ENCENDIDO</span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              El sistema guarda automáticamente cada 5 minutos y después de cada venta o cambio en el inventario.
            </p>
          </div>
        </div>

        {backupStats && (
          <div style={{ background: 'var(--bg-app)', padding: '8px 16px', borderRadius: '10px', border: '1px solid var(--border-medium)', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Último respaldo: </span>
            <strong style={{ color: 'var(--accent-success)' }}>{backupStats.formattedDate}</strong>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              📦 {backupStats.inventoryCount} productos | 🧾 {backupStats.salesCount} ventas protegidas
            </div>
          </div>
        )}
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

      {/* Grid de Acciones */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        
        {/* Tarjeta 1: Forzar Respaldo Manual Ahora */}
        <div className="card" style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <RefreshCw size={28} />
          </div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>Respaldar Ahora</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px', flex: 1 }}>
            Guarda una instantánea inmediata tanto en tu equipo como en los servidores en la nube.
          </p>
          <button 
            onClick={handleBackup} 
            disabled={loading || currentUser?.role !== 'admin'} 
            className="btn btn-primary" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', padding: '12px' }}
          >
            <CloudUpload size={18} /> {loading ? 'Respaldando...' : 'Respaldar Todo Ahora'}
          </button>
        </div>

        {/* Tarjeta 2: Descargar Respaldo JSON a la PC */}
        <div className="card" style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <FileDown size={28} />
          </div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>Descargar Archivo (.JSON)</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px', flex: 1 }}>
            Descarga una copia completa de tu base de datos a un archivo en tu computadora o pendrive USB.
          </p>
          <button 
            onClick={handleExportJson} 
            className="btn" 
            style={{ 
              width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', padding: '12px',
              background: 'transparent', border: '1px solid var(--accent-success)', color: 'var(--accent-success)', fontWeight: 600
            }}
          >
            <FileDown size={18} /> Descargar Archivo JSON
          </button>
        </div>

        {/* Tarjeta 3: Restaurar desde la Nube */}
        <div className="card" style={{ padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Download size={28} />
          </div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px' }}>Restaurar desde Nube</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px', flex: 1 }}>
            Recupera la copia guardada en Firebase. Reemplaza todos los datos locales existentes.
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
            <Download size={18} /> {loading ? 'Restaurando...' : 'Restaurar de la Nube'}
          </button>
        </div>

      </div>

      {/* Tarjeta de Restaurar Copia Automática Local */}
      <div className="card" style={{ marginTop: '20px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-app)', border: '1px solid var(--border-medium)' }}>
        <div>
          <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>¿Problemas con los datos recientes?</strong>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Puedes restaurar rápidamente el snapshot local automático más reciente generado por este equipo.
          </p>
        </div>
        <button 
          onClick={handleRestoreLocalSnapshot}
          className="btn btn-outline"
          style={{ fontSize: '0.85rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} /> Restaurar Copia Local
        </button>
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

