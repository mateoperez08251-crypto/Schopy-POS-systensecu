import React, { useState, useEffect } from 'react';
import { RefreshCcw } from 'lucide-react';

const OfflineOverlay = () => {
  // Para pruebas rápidas en local podemos forzar el estado, pero usaremos el estado real de red.
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Función temporal de test para el teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Si el usuario presiona CTRL + O, simulamos desconexión
      if (e.ctrlKey && e.key === 'o') {
        setIsOffline(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOffline) return null;

  return (
    <div className="my-custom-face-container">
      <svg className="face" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="8"/>
        
        <g className="face__eyes">
          <circle cx="65" cy="80" r="15" fill="none" stroke="currentColor" strokeWidth="6"/>
          <circle cx="135" cy="80" r="15" fill="none" stroke="currentColor" strokeWidth="6"/>
          
          <line className="face__pupil" x1="65" y1="80" x2="65" y2="80" stroke="currentColor" strokeWidth="15" strokeLinecap="round"/>
          <line className="face__pupil" x1="135" y1="80" x2="135" y2="80" stroke="currentColor" strokeWidth="15" strokeLinecap="round"/>
          
          <path className="face__eye-lid" d="M 50 65 Q 65 50 80 65" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
          <path className="face__eye-lid" d="M 120 65 Q 135 50 150 65" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
        </g>
        
        <path className="face__nose" d="M 100 95 L 100 115" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
        <path className="face__mouth-left" d="M 100 140 Q 80 150 60 135" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeDasharray="102" strokeDashoffset="-102"/>
        <path className="face__mouth-right" d="M 100 140 Q 120 150 140 135" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeDasharray="102" strokeDashoffset="102"/>
      </svg>
      
      <h2 style={{ marginTop: '32px', fontSize: '1.5rem', fontWeight: 700 }}>Conexión Inestable</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '300px', textAlign: 'center' }}>
        Servidor o conexión inestable.
      </p>
      
      <button 
        className="btn btn-primary" 
        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        onClick={() => {
          // Intentar reconectar simulado
          setIsOffline(false);
          // O reload: window.location.reload()
        }}
      >
        <RefreshCcw size={18} />
        Toca para reintentar
      </button>
    </div>
  );
};

export default OfflineOverlay;
