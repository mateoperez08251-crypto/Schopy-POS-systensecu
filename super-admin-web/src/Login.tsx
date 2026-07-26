import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';
import { Shield } from 'lucide-react';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email !== 'mateoperez08251@gmail.com') {
      setError('Acceso denegado. Solo el Super Admin puede entrar.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (err: any) {
      setError('Credenciales incorrectas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0f172a', color: 'white', fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        background: '#1e293b', padding: '40px', borderRadius: '16px',
        width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Shield size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
          <h1 style={{ margin: 0, fontSize: '24px' }}>Super Admin Panel</h1>
          <p style={{ color: '#94a3b8', margin: '8px 0 0 0' }}>Acceso Restringido</p>
        </div>

        {error && <div style={{ background: '#ef444422', color: '#ef4444', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '14px' }}>Correo Maestro</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', boxSizing: 'border-box' }}
              required 
            />
          </div>
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1', fontSize: '14px' }}>Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: 'white', boxSizing: 'border-box' }}
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: '14px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Verificando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
