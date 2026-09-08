import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, AlertCircle, User, ArrowLeft, Unlock } from 'lucide-react';
import { getAllStaffLocal, updateStaffLocal } from '../firebase/localStaffService';

const LocalLogin = () => {
  const { localLogin, forceLogin, hasAdmin, createInitialAdmin } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [adminName, setAdminName] = useState('Administrador');
  
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  useEffect(() => {
    setIsFirstTime(!hasAdmin);
    if (hasAdmin) {
      const staffList = getAllStaffLocal();
      setUsers(staffList);
    }
  }, [hasAdmin]);

  const handleKeyPress = (key: string) => {
    if (pin.length < 4) {
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
    
    // Si el usuario no tiene PIN, permitir entrar sin escribir nada
    const needsPin = isFirstTime || (selectedUser && selectedUser.pin);
    
    if (needsPin && pin.length < 4) {
      setError('El PIN debe tener al menos 4 dígitos');
      return;
    }

    try {
      if (isFirstTime) {
        await createInitialAdmin(adminName, pin);
      } else {
        const success = await localLogin(pin, selectedUser?.id);
        if (!success) {
          setError('PIN incorrecto para este usuario');
          setPin('');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
      setPin('');
    }
  };

  const handleBypass = async () => {
    if (selectedUser) {
      try {
        await updateStaffLocal(selectedUser.id, { ...selectedUser, pin: '' });
        selectedUser.pin = '';
        forceLogin(selectedUser);
      } catch (err: any) {
        setError('Error al restablecer contraseña: ' + err.message);
      }
    }
  };

  if (!isFirstTime && !selectedUser) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-app)',
        padding: '24px'
      }}>
        <div style={{ maxWidth: '800px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', background: 'var(--accent-primary)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Shield size={40} color="white" />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>¿Quién está ingresando?</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '8px', fontSize: '1.1rem' }}>Selecciona tu usuario para acceder al sistema</p>
          </div>

          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {users.map(u => (
              <div 
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className="card hover:shadow-lg"
                style={{
                  width: '180px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '2px solid transparent'
                }}
              >
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: u.role === 'admin' ? 'var(--accent-primary)' : 'var(--bg-app)',
                  border: u.role === 'admin' ? 'none' : '2px solid var(--border-medium)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <User size={32} color={u.role === 'admin' ? 'white' : 'var(--text-secondary)'} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, textTransform: 'capitalize' }}>{u.name}</h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{u.role}</span>
                  <div style={{ marginTop: '8px', padding: '4px 8px', background: 'var(--accent-primary)', color: 'white', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    PIN: {u.pin}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
        gap: '24px',
        position: 'relative'
      }}>
        
        {!isFirstTime && selectedUser && (
          <button 
            onClick={() => { setSelectedUser(null); setPin(''); setError(''); }}
            style={{ position: 'absolute', top: '24px', left: '24px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft size={20} /> Volver
          </button>
        )}

        <div style={{ textAlign: 'center', marginTop: (!isFirstTime && selectedUser) ? '32px' : '0' }}>
          {!isFirstTime && selectedUser ? (
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: selectedUser.role === 'admin' ? 'var(--accent-primary)' : 'var(--bg-app)', border: selectedUser.role === 'admin' ? 'none' : '2px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <User size={32} color={selectedUser.role === 'admin' ? 'white' : 'var(--text-secondary)'} />
            </div>
          ) : (
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
          )}
          
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {isFirstTime ? 'Configuración Inicial' : `Hola, ${selectedUser?.name}`}
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
            {[0, 1, 2, 3].map(i => (
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
          
          {!isFirstTime && selectedUser && (
            <button
              type="button"
              onClick={handleBypass}
              style={{
                width: '100%',
                marginTop: '12px',
                height: '48px',
                fontSize: '0.9rem',
                background: 'transparent',
                border: '1px dashed var(--border-medium)',
                color: 'var(--text-secondary)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <Unlock size={16} /> Restablecer y entrar sin PIN
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default LocalLogin;
