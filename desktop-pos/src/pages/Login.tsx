import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, Store } from 'lucide-react';
import './Login.css';

import { auth } from '../firebase/config';
import { signInWithEmailAndPassword } from 'firebase/auth';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Credenciales incorrectas o el usuario no existe.');
      } else {
        setError('Ocurrió un error al intentar iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-split-layout">
        {/* Lado Izquierdo: Visual */}
        <div className="login-visual-side">
          <div className="login-visual-overlay"></div>
          <div className="login-visual-content">
            <div className="brand-logo">
              <img src="/app-icon.png" alt="Schopy POS Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
            </div>
            <h1>Schopy POS</h1>
            <p>El sistema de punto de venta inteligente y moderno para potenciar tu negocio.</p>
          </div>
        </div>

        {/* Lado Derecho: Formulario */}
        <div className="login-form-side">
          <div className="login-form-wrapper">
            <div className="form-header">
              <h2>Bienvenido de nuevo</h2>
              <p>Ingresa tus credenciales para acceder a tu cuenta</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="input-group">
                <label>Correo Electrónico</label>
                <div className="input-icon-wrapper">
                  <Mail className="input-icon" size={20} />
                  <input 
                    type="email" 
                    placeholder="tucorreo@ejemplo.com"
                    required 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="input-group">
                <div className="password-header">
                  <label>Contraseña</label>
                  <a href="#" className="forgot-password">¿Olvidaste tu contraseña?</a>
                </div>
                <div className="input-icon-wrapper">
                  <Lock className="input-icon" size={20} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    required 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                  <button 
                    type="button" 
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="login-submit-btn" disabled={loading}>
                {loading ? (
                  <span className="loading-spinner"></span>
                ) : (
                  <>
                    <span>Iniciar Sesión</span>
                    <LogIn size={20} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
