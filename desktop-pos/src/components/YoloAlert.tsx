import React from 'react';

interface YoloAlertProps {
  message?: string;
  type?: 'error' | 'warning';
  onClose?: () => void;
}

const YoloAlert: React.FC<YoloAlertProps> = ({ 
  message = "Apertura de caja sin venta",
  type = 'error',
  onClose 
}) => {
  const color = type === 'warning' ? '#d29922' : '#f85149';
  const bg = type === 'warning' ? 'rgba(210, 153, 34, 0.1)' : 'rgba(248, 81, 73, 0.1)';
  const shadow = type === 'warning' ? 'rgba(210, 153, 34, 0.15)' : 'rgba(248, 81, 73, 0.15)';
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: '300px',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px 56px 12px 16px', 
      borderRadius: '8px', 
      fontSize: '1rem', 
      fontWeight: 500, 
      transition: 'all 0.5s ease',
      borderStyle: 'solid',
      borderWidth: '1px',
      borderColor: color,
      color: color, 
      background: `linear-gradient(${bg}, ${bg})`,
      boxShadow: `0 4px 12px ${shadow}`,
      zIndex: 9999
    }}>
      <button
        type="button"
        aria-label="close-error"
        onClick={onClose}
        style={{
          position: 'absolute',
          right: '16px', 
          padding: '4px', 
          borderRadius: '6px', 
          transition: 'opacity 0.2s',
          color: color,
          border: `1px solid ${color}`,
          opacity: 0.6,
          cursor: 'pointer',
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
      >
        <svg
          stroke="currentColor"
          fill="none"
          strokeWidth="2"
          viewBox="0 0 24 24"
          strokeLinecap="round"
          strokeLinejoin="round"
          height="16"
          width="16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M18 6 6 18"></path>
          <path d="m6 6 12 12"></path>
        </svg>
      </button>
      <p style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', marginRight: 'auto', gap: '8px', margin: 0 }}>
        <svg
          stroke="currentColor"
          fill="none"
          strokeWidth="2"
          viewBox="0 0 24 24"
          strokeLinecap="round"
          strokeLinejoin="round"
          height="28"
          width="28"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
          <path d="M12 9v4"></path>
          <path d="M12 17h.01"></path>
        </svg>
        {message}
      </p>
    </div>
  );
};

export default YoloAlert;
