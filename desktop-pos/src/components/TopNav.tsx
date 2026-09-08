import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Search, Bell, Mail, Share2, ShieldAlert, CheckCircle2, AlertTriangle, BellOff, ShoppingCart, FileText, History, Package, X } from 'lucide-react';

const initialNotifications: any[] = [];

// Variable global a nivel de módulo para que solo suene una vez por sesión
let hasPlayedNotificationDing = false;

const TopNav = ({ title = "" }: { title?: string }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMails, setShowMails] = useState(false);
  const [showPopupNotification, setShowPopupNotification] = useState(false);
  const [showSubscriptionWarning, setShowSubscriptionWarning] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const notifRef = useRef<HTMLDivElement>(null);
  const mailRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { daysRemaining = null } = useAuth();

  const playDing = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5); // Drop to A4
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1);
    } catch(e) {}
  };



  useEffect(() => {
    if (daysRemaining !== null && daysRemaining <= 3 && daysRemaining >= -3) {
      // Show warning modal on initial load if within 3 days before OR 3 days after (grace period)
      setShowSubscriptionWarning(true);
    }
  }, [daysRemaining]);

  useEffect(() => {
    // Revisar si ya está en modo oscuro
    if (document.body.classList.contains('dark-mode')) {
      setIsDarkMode(true);
    }

    // Cerrar notificaciones y correos al hacer clic fuera
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (mailRef.current && !mailRef.current.contains(event.target as Node)) {
        setShowMails(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('dark-mode');
  };

  // Determinar ícono y título dinámico según la ruta
  let currentTitle = title;
  let CurrentIcon = LayoutDashboard;

  switch (location.pathname) {
    case '/':
      currentTitle = 'Panel de Control';
      CurrentIcon = LayoutDashboard;
      break;
    case '/pos':
      currentTitle = 'Punto de Venta';
      CurrentIcon = ShoppingCart;
      break;
    case '/voucher-pos':
      currentTitle = 'Venta con Comprobante';
      CurrentIcon = FileText;
      break;
    case '/sales-history':
      currentTitle = 'Historial de Ventas';
      CurrentIcon = History;
      break;
    case '/inventory':
      currentTitle = 'Inventario';
      CurrentIcon = Package;
      break;
    case '/audit':
      currentTitle = 'Auditoría';
      CurrentIcon = ShieldAlert;
      break;
    default:
      currentTitle = title || 'Schopy POS';
      CurrentIcon = LayoutDashboard;
  }

  // Si estamos en POS o Voucher, podemos decidir ocultar el título superior ya que el componente tiene el suyo propio
  // O podemos mantenerlo. Mantengámoslo para consistencia de la UI.
  if (location.pathname === '/pos' || location.pathname === '/voucher-pos' || location.pathname === '/inventory') {
    // El POS y el Inventory tienen su propio encabezado grande H1, por lo que este pequeño del TopNav puede ser redundante.
    // Sin embargo, si queremos mantener el layout exacto, podemos dejarlo o borrarlo.
    // Dejaremos el ícono y título para consistencia en la esquina superior izquierda.
  }

  return (
    <header className="flex-between" style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <CurrentIcon size={24} color="var(--accent-primary)" />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>{currentTitle}</h1>
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
              className="bell-button"
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ padding: '8px', borderRadius: '50%', border: '1px solid var(--border-medium)', background: 'var(--bg-card)', position: 'relative', cursor: 'pointer' }}
              title={notifications.length > 0 ? `${notifications.length} nueva(s): ${notifications[0].title}` : 'Notificaciones'}
            >
              <Bell className="bell-icon" size={18} color="var(--text-secondary)" />
              {/* Red dot for unread notifications */}
              {notifications.length > 0 && (
                <div style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: 'var(--accent-danger)', borderRadius: '50%' }}></div>
              )}
              
              {/* Burbuja Flotante Animada y con Sonido */}
              {showPopupNotification && notifications.length > 0 && (
                <div className="animate-pop" style={{ 
                  position: 'absolute', top: '100%', right: '50%', transform: 'translateX(50%)', marginTop: '14px',
                  background: 'var(--bg-card)', color: 'var(--text-primary)', 
                  border: '1px solid var(--border-medium)',
                  borderRadius: '12px', padding: '12px 16px', 
                  whiteSpace: 'nowrap', display: 'flex', gap: '12px', alignItems: 'center',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)', zIndex: 110,
                  cursor: 'default'
                }} onClick={(e) => e.stopPropagation()}>
                  <div style={{
                     position: 'absolute', top: '-6px', right: '50%', transform: 'translateX(50%)',
                     width: '12px', height: '12px', background: 'var(--bg-card)',
                     borderLeft: '1px solid var(--border-medium)', borderTop: '1px solid var(--border-medium)',
                     rotate: '45deg'
                  }}></div>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-danger)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                     <Bell size={16} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--accent-danger)', fontWeight: 800, marginBottom: '2px' }}>NUEVA ALERTA</p>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{notifications[0].title}</p>
                  </div>
                </div>
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

          {/* Menú de Correos */}
          <div style={{ position: 'relative' }} ref={mailRef}>
            <div 
              className="bell-button"
              onClick={() => setShowMails(!showMails)}
              style={{ padding: '8px', borderRadius: '50%', border: '1px solid var(--border-medium)', background: 'var(--bg-card)', position: 'relative', cursor: 'pointer' }}
              title="Bandeja de Entrada"
            >
              <Mail className="bell-icon" size={18} color="var(--text-secondary)" />
              {daysRemaining !== null && daysRemaining <= 3 && daysRemaining >= -3 && (
                <div style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: 'var(--accent-danger)', borderRadius: '50%' }}></div>
              )}
            </div>

            {showMails && (
              <div style={{ position: 'absolute', top: '44px', right: 0, width: '340px', background: 'var(--bg-card)', border: '1px solid var(--border-medium)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)', zIndex: 100, animation: 'popIn 0.2s ease-out' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontWeight: 600, fontSize: '0.95rem' }}>Bandeja de Entrada</h4>
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {daysRemaining !== null && daysRemaining <= 3 && daysRemaining >= -3 ? (
                    <div 
                      onClick={() => {
                        setShowMails(false);
                        setShowSubscriptionWarning(true);
                      }}
                      style={{ padding: '16px', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '12px', cursor: 'pointer', background: 'var(--accent-danger-light)' }}
                    >
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-danger)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Mail size={16} />
                      </div>
                      <div>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-danger)', marginBottom: '4px' }}>Aviso del Sistema</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>Tienes un mensaje importante sobre tu suscripción.</p>
                        <span style={{ fontSize: '0.7rem', color: 'var(--accent-danger)', fontWeight: 600 }}>Hace un momento</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Mail size={32} style={{ margin: '0 auto', marginBottom: '12px', opacity: 0.5 }} />
                      <p style={{ fontSize: '0.85rem', fontWeight: 500 }}>No hay correos nuevos</p>
                    </div>
                  )}
                </div>
                <div style={{ padding: '12px', borderTop: '1px solid var(--border-light)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600 }}>
                  Ver todos los mensajes
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: '8px', borderRadius: '50%', border: '1px solid var(--border-medium)', background: 'var(--bg-card)', cursor: 'pointer' }}>
            <Share2 size={18} color="var(--text-secondary)" />
          </div>
        </div>
      </div>

      {/* Subscription Warning Modal */}
      {showSubscriptionWarning && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'var(--bg-card)', width: '90%', maxWidth: '400px',
            borderRadius: '16px', padding: '32px', position: 'relative',
            border: '1px solid var(--accent-danger)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            textAlign: 'center', animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}>
            <button 
              onClick={() => setShowSubscriptionWarning(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <AlertTriangle size={56} color="var(--accent-danger)" style={{ margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-danger)', marginBottom: '12px' }}>
              ¡Aviso Importante!
            </h2>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '24px' }}>
              {daysRemaining !== null && daysRemaining > 0 ? (
                <>
                  Tu suscripción al sistema vencerá en <strong>{daysRemaining} días</strong>. 
                  Para evitar interrupciones en tu servicio, por favor contacta a soporte o al administrador para renovar a tiempo.
                </>
              ) : daysRemaining === 0 || daysRemaining === null ? (
                <>
                  <strong style={{color: 'var(--accent-danger)'}}>¡Advertencia!</strong> Tu suscripción vence el día de hoy. 
                  Pronto caducará definitivamente. Para evitar el corte de tu servicio, por favor pagar tu renovación inmediatamente.
                </>
              ) : (
                <>
                  Tu suscripción al sistema ha vencido. Te hemos otorgado un período de gracia de <strong>{3 + (daysRemaining || 0)} días</strong>. 
                  Para evitar el bloqueo total de tu cuenta, por favor contacta a soporte o al administrador urgentemente.
                </>
              )}
            </p>
            <button 
              onClick={() => setShowSubscriptionWarning(false)}
              style={{
                background: 'var(--accent-danger)', color: 'white', border: 'none',
                padding: '12px 24px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', width: '100%'
              }}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default TopNav;
