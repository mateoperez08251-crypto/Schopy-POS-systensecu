import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose, duration = 4000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for fade out animation
  };

  const styles = {
    success: { bg: '#F0FDF4', border: '#16A34A', text: '#166534', icon: <CheckCircle2 color="#16A34A" size={22} /> },
    error: { bg: '#FEF2F2', border: '#DC2626', text: '#991B1B', icon: <AlertCircle color="#DC2626" size={22} /> },
    warning: { bg: '#FFFBEB', border: '#D97706', text: '#92400E', icon: <AlertTriangle color="#D97706" size={22} /> },
    info: { bg: '#EFF6FF', border: '#2563EB', text: '#1E40AF', icon: <Info color="#2563EB" size={22} /> },
  };

  const currentStyle = styles[type];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '16px 20px',
      backgroundColor: currentStyle.bg,
      borderLeft: `4px solid ${currentStyle.border}`,
      borderRadius: '10px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      minWidth: '320px',
      maxWidth: '450px',
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(-15px) scale(0.95)',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      position: 'relative'
    }}>
      <div style={{ flexShrink: 0, marginTop: '2px' }}>
        {currentStyle.icon}
      </div>
      <div style={{ flex: 1, color: currentStyle.text, fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.4 }}>
        {message}
      </div>
      <button 
        onClick={handleClose}
        style={{
          background: 'none',
          border: 'none',
          padding: '4px',
          cursor: 'pointer',
          color: currentStyle.text,
          opacity: 0.6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          borderRadius: '6px',
          marginTop: '-2px',
          marginRight: '-4px'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.06)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.backgroundColor = 'transparent'; }}
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default Toast;
