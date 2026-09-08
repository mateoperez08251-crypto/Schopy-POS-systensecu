import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, LogOut } from 'lucide-react';

const Expired = () => {
  const { logout } = useAuth();

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: 'white' }}>
      <div style={{ background: '#1e293b', padding: '40px', borderRadius: '16px', maxWidth: '400px', textAlign: 'center', border: '1px solid #ef4444' }}>
        <AlertTriangle size={64} color="#ef4444" style={{ marginBottom: '16px' }} />
        <h1 style={{ fontSize: '24px', margin: '0 0 16px 0' }}>Suscripción Vencida</h1>
        <p style={{ color: '#94a3b8', lineHeight: '1.5', marginBottom: '32px' }}>
          El acceso a este sistema ha sido suspendido porque la suscripción ha terminado o ha sido pausada por el administrador.
          Por favor, contacta a soporte para reactivar tu cuenta.
        </p>
        <button 
          onClick={logout}
          style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'transparent', border: '1px solid #334155', color: 'white', borderRadius: '8px', cursor: 'pointer' }}
        >
          <LogOut size={18} /> Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default Expired;
