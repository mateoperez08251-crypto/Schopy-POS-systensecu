import React, { useState } from 'react';
import './Login.css';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(); // Entrar directamente como prueba
  };

  return (
    <div className="login-page-wrapper">
      <div className="container">
        
        <div className="left">
          <form className="form" onSubmit={handleSubmit}>
            <div className="input-block">
              <input 
                type="email" 
                className="input" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <label>Correo</label>
            </div>
            
            <div className="input-block">
              <input 
                type="password" 
                className="input" 
                required 
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <label>Contraseña</label>
            </div>
            
            <a href="#" className="forgot">¿Olvidaste tu contraseña?</a>
            
            <button type="submit">Entrar</button>
          </form>
        </div>

        <div className="right">
          <div className="img"></div>
        </div>

      </div>
    </div>
  );
};

export default Login;
