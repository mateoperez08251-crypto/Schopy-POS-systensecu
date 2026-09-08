import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Key, AlertCircle, LogIn } from 'lucide-react';

const LocalLogin = () => {
  const { localLogin, hasAdmin, createInitialAdmin } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [adminName, setAdminName] = useState('Administrador');

  useEffect(() => {
    // Verificar si existe al menos un admin en la base local
    setIsFirstTime(!hasAdmin);
  }, [hasAdmin]);

  const handleKeyPress = (key: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + key);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length < 4) {
      setError('El PIN debe tener al menos 4 dígitos');
      return;
    }

    try {
      if (isFirstTime) {
        await createInitialAdmin(adminName, pin);
      } else {
        const success = await localLogin(pin);
        if (!success) {
          setError('PIN incorrecto');
          setPin('');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
      setPin('');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-app)',
      padding: '24px'
    }}>
      <div className="card" style={{
        maxWidth: '400px',
        width: '100%',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'var(--accent-primary)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Shield size={32} color="white" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {isFirstTime ? 'Configuración Inicial' : 'Iniciar Sesión'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '0.9rem' }}>
            {isFirstTime 
              ? 'Crea un PIN maestro para el administrador' 
              : 'Ingresa tu PIN de acceso'}
          </p>
        </div>

        {error && (
          <div style={{
            width: '100%',
            padding: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--accent-danger)',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          {isFirstTime && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Nombre del Administrador</label>
              <input 
                type="text" 
                value={adminName}
                onChange={e => setAdminName(e.target.value)}
                required
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-app)',
                  color: 'var(--text-primary)'
                }} 
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: i < pin.length ? 'var(--accent-primary)' : 'var(--border-medium)',
                transition: 'all 0.2s'
              }} />
            ))}
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '12px',
            maxWidth: '280px',
            margin: '0 auto'
          }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyPress(num.toString())}
                style={{
                  height: '60px',
                  borderRadius: '50%',
                  border: '1px solid var(--border-medium)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {num}
              </button>
            ))}
            <div />
            <button
              type="button"
              onClick={() => handleKeyPress('0')}
              style={{
                height: '60px',
                borderRadius: '50%',
                border: '1px solid var(--border-medium)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '1.25rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              style={{
                height: '60px',
                borderRadius: '50%',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-secondary)',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Borrar
            </button>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '24px', height: '48px', fontSize: '1.1rem' }}
          >
            {isFirstTime ? 'Crear Administrador' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LocalLogin;
