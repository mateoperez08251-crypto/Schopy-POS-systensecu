import React, { useState } from 'react';
import { Store, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Setup = () => {
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError('Por favor, ingresa el nombre de tu empresa');
      return;
    }
    if (!currentUser) {
      setError('No hay sesión activa. Por favor, recarga la página.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Usaremos el propio UID del creador como companyId para garantizar que sea único mundialmente
      const companyId = currentUser.uid || currentUser.id;
      const settingsData = {
        companyName: companyName, // Guardamos el nombre para el header
      };

      // Guardamos la configuración en localStorage
      localStorage.setItem('schopy_store_settings', JSON.stringify(settingsData));
      
      // Forzamos recarga de la página para que el contexto re-evalúe el documento
      window.location.href = '/';

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error al configurar la empresa');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--bg-color) 0%, #1e293b 100%)',
      padding: '24px'
    }}>
      <div style={{
        background: 'var(--card-bg)',
        padding: '48px',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        width: '100%',
        maxWidth: '480px',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'rgba(99, 102, 241, 0.1)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            color: 'var(--accent-primary)'
          }}>
            <Store size={40} />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '12px' }}>
            Bienvenido a Schopy
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: '1.5' }}>
            Para comenzar a usar el sistema, necesitamos configurar tu espacio de trabajo.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#ef4444',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSetup}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>
              Nombre de tu Empresa / Tienda
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ej. Mi Supermercado"
              style={{
                width: '100%',
                padding: '14px',
                background: 'var(--bg-color)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                color: 'white',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              required
            />
          </div>

          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px dashed rgba(16, 185, 129, 0.3)',
            padding: '16px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '32px'
          }}>
            <ShieldCheck style={{ color: '#10b981', flexShrink: 0 }} size={20} />
            <p style={{ fontSize: '13px', color: '#10b981', lineHeight: '1.4', margin: 0 }}>
              Al configurar tu tienda, se te asignarán permisos de <strong>Administrador Supremo</strong> para este espacio de trabajo de forma automática.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, #4f46e5 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'transform 0.2s',
              transform: loading ? 'none' : 'translateY(0)',
            }}
          >
            {loading ? 'Configurando...' : 'Crear mi Empresa'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Setup;
