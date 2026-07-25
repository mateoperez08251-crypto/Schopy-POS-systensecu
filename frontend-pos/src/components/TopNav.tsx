import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Search, Bell, Mail, Share2, ShieldAlert, CheckCircle2, AlertTriangle, BellOff } from 'lucide-react';

const initialNotifications = [
  {
    id: 1,
    type: 'danger',
    title: 'Alerta IA: Omisión de escaneo',
    desc: 'Caja Principal - Producto pasado sin registro al sistema.',
    time: 'Hace 2 min',
    icon: ShieldAlert
  },
  {
    id: 2,
    type: 'warning',
    title: 'Stock Crítico detectado',
    desc: 'Quedan solo 2 unidades de "Coca Cola 2L" en inventario.',
    time: 'Hace 15 min',
    icon: AlertTriangle
  },
  {
    id: 3,
    type: 'success',
    title: 'Cierre de Caja Exitoso',
    desc: 'El usuario Carlos finalizó su turno sin descuadres.',
    time: 'Hace 1 hora',
    icon: CheckCircle2
  }
];

const TopNav = ({ title = "Panel de Control" }: { title?: string }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Revisar si ya está en modo oscuro
    if (document.body.classList.contains('dark-mode')) {
      setIsDarkMode(true);
    }

    // Cerrar notificaciones al hacer clic fuera
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('dark-mode');
  };

  return (
    <header className="flex-between" style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <LayoutDashboard size={24} color="var(--accent-primary)" />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{title}</h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ position: 'relative', width: '260px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Buscar alertas, facturas o comandos IA..." style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: '100px', border: '1px solid var(--border-medium)', background: 'var(--bg-card)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem' }} />
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          
          {/* Botón de Modo Oscuro */}
          <div className="toggle-switch">
            <label className="switch-label">
              <input type="checkbox" className="checkbox" checked={isDarkMode} onChange={toggleTheme} />
              <span className="slider"></span>
            </label>
          </div>

          {/* Menú de Notificaciones */}
          <div style={{ position: 'relative' }} ref={notifRef}>
            <div 
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ padding: '8px', borderRadius: '50%', border: '1px solid var(--border-medium)', background: 'var(--bg-card)', position: 'relative', cursor: 'pointer' }}
            >
              <Bell size={18} color="var(--text-secondary)" />
              {notifications.length > 0 && (
                <div style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: 'var(--accent-danger)', borderRadius: '50%' }}></div>
              )}
            </div>
            
            {showNotifications && (
              <div style={{ position: 'absolute', top: '44px', right: 0, width: '340px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', zIndex: 100, animation: 'popIn 0.2s ease-out' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontWeight: 600, fontSize: '0.95rem' }}>Notificaciones ({notifications.length})</h4>
                  {notifications.length > 0 && (
                    <span 
                      onClick={() => setNotifications([])}
                      style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }}
                    >
                      Marcar leídas
                    </span>
                  )}
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  
                  {notifications.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <BellOff size={32} style={{ margin: '0 auto', marginBottom: '12px', opacity: 0.5 }} />
                      <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>No hay notificaciones nuevas</p>
                    </div>
                  ) : (
                    notifications.map((notif) => {
                      const Icon = notif.icon;
                      let bgColor = 'var(--accent-success)';
                      let highlightBg = 'transparent';
                      let titleColor = 'var(--text-primary)';
                      
                      if (notif.type === 'danger') {
                        bgColor = 'var(--accent-danger)';
                        highlightBg = 'var(--accent-danger-light)';
                        titleColor = 'var(--accent-danger)';
                      } else if (notif.type === 'warning') {
                        bgColor = '#F59E0B';
                      }

                      return (
                        <div key={notif.id} style={{ padding: '16px', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '12px', cursor: 'pointer', background: highlightBg }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: bgColor, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon size={16} />
                          </div>
                          <div>
                            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: titleColor, marginBottom: '4px' }}>{notif.title}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>{notif.desc}</p>
                            <span style={{ fontSize: '0.7rem', color: notif.type === 'danger' ? 'var(--accent-danger)' : 'var(--text-muted)', fontWeight: notif.type === 'danger' ? 600 : 400 }}>{notif.time}</span>
                          </div>
                        </div>
                      )
                    })
                  )}

                </div>
                <div style={{ padding: '12px', borderTop: '1px solid var(--border-light)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>
                  Ver todo el historial de alertas
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: '8px', borderRadius: '50%', border: '1px solid var(--border-medium)', background: 'var(--bg-card)', cursor: 'pointer' }}>
            <Mail size={18} color="var(--text-secondary)" />
          </div>
          <div style={{ padding: '8px', borderRadius: '50%', border: '1px solid var(--border-medium)', background: 'var(--bg-card)', cursor: 'pointer' }}>
            <Share2 size={18} color="var(--text-secondary)" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNav;
