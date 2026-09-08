import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingBag, Package, Calendar as CalendarIcon, 
  BarChart2, ShieldAlert, MoreHorizontal, Settings, HelpCircle, 
  ArrowUpRight, LogOut, Menu, X, Truck, Users, Wallet, Wrench, Cloud
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ onOpenRestockModal }: { onOpenRestockModal?: () => void }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { logout, userData } = useAuth();
  
  const navItems = [
    { icon: LayoutDashboard, label: 'Panel de Control', path: '/' },
    { 
      icon: ShoppingBag, 
      label: 'Ventas', 
      path: '/pos',
      subItems: [
        { label: 'Punto de Venta', path: '/pos' },
        { label: 'Venta con Comprobante', path: '/voucher-pos' },
        { label: 'Historial', path: '/sales-history' }
      ]
    },
    { icon: Wallet, label: 'Caja & Cortes', path: '/cash-register' },
    { icon: Package, label: 'Inventario', path: '/inventory' },
    {
      icon: Truck,
      label: 'Proveedores',
      path: '/suppliers',
      subItems: [
        { label: 'Directorio', path: '/suppliers' },
        { label: 'Recepción Mercancía', path: '/receivings' },
        { label: 'Planificador de Compras', action: 'restock' }
      ]
    },
    { icon: Users, label: 'Clientes', path: '/customers' },
    { icon: Wrench, label: 'Mecánicos (Dashboard)', path: '/mechanics-dashboard' },
    { icon: ShieldAlert, label: 'Personal (Cajeros)', path: '/staff' },
    { icon: Cloud, label: 'Respaldo a Nube', path: '/backup' },
    { icon: ShieldAlert, label: 'Auditoría IA', path: '/audit' }
  ];

  const [expandedMenu, setExpandedMenu] = useState<string | null>('Ventas');

  return (
    <aside className="sidebar" style={{ 
      width: isCollapsed ? '72px' : '260px', 
      minWidth: isCollapsed ? '72px' : '260px',
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      overflowX: 'hidden',
      overflowY: 'auto'
    }}>
      {/* Logo + Hamburguesa */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <div style={{ width: '32px', height: '32px', background: 'var(--accent-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }} onClick={() => setIsCollapsed(!isCollapsed)}>
          <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '4px', transform: 'rotate(45deg)' }}></div>
        </div>
        {!isCollapsed && (
          <>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, whiteSpace: 'nowrap' }}>Schopy</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: 'auto', background: 'var(--bg-app)', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap' }}>POS & IA</span>
          </>
        )}
      </div>

      {/* Botón Hamburguesa */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: isCollapsed ? 'center' : 'flex-start',
          gap: '12px', padding: isCollapsed ? '10px' : '10px 12px', marginBottom: '16px',
          background: 'var(--bg-app)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)',
          cursor: 'pointer', color: 'var(--text-secondary)', transition: '0.2s'
        }}
      >
        {isCollapsed ? <Menu size={18} /> : <><Menu size={18} /><span style={{ fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap' }}>Colapsar menú</span></>}
      </button>

      {/* Perfil de Usuario */}
      {!isCollapsed && userData ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', marginBottom: '32px' }}>
          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name || 'User')}&background=random`} alt="Usuario" style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }} />
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{userData.name}</p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{userData.role === 'admin' ? 'Administrador' : 'Cajero'}</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'User')}&background=random`} alt="Usuario" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
        </div>
      )}

      {/* Enlaces de Navegación */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {navItems.map(item => (
          <div key={item.label}>
            {item.subItems ? (
              <div 
                className={`nav-item ${expandedMenu === item.label ? 'active' : ''}`}
                style={{ cursor: 'pointer', justifyContent: isCollapsed ? 'center' : 'flex-start' }}
                onClick={() => {
                  if (isCollapsed) setIsCollapsed(false);
                  setExpandedMenu(expandedMenu === item.label ? null : item.label);
                }}
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon size={18} style={{ flexShrink: 0 }} />
                {!isCollapsed && (
                  <>
                    <span style={{ whiteSpace: 'nowrap', flex: 1 }}>{item.label}</span>
                    <span style={{ fontSize: '0.7rem', transform: expandedMenu === item.label ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }}>▼</span>
                  </>
                )}
              </div>
            ) : (
              <NavLink 
                to={item.path}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                style={{ textDecoration: 'none', justifyContent: isCollapsed ? 'center' : 'flex-start' }}
                title={isCollapsed ? item.label : undefined}
                onClick={() => {
                  setExpandedMenu(null);
                  setIsCollapsed(true);
                }}
              >
                <item.icon size={18} style={{ flexShrink: 0 }} />
                {!isCollapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
              </NavLink>
            )}

            {/* SubItems */}
            {item.subItems && expandedMenu === item.label && !isCollapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '32px', marginTop: '4px', marginBottom: '8px' }}>
                {item.subItems.map((sub: any) => (
                  sub.action ? (
                    <button
                      key={sub.label}
                      onClick={() => {
                        if (sub.action === 'restock' && onOpenRestockModal) onOpenRestockModal();
                        setIsCollapsed(true);
                      }}
                      className="nav-item"
                      style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', padding: '8px 12px', fontSize: '0.85rem', color: 'var(--text-primary)' }}
                    >
                      {sub.label}
                    </button>
                  ) : (
                    <NavLink
                      key={sub.label}
                      to={sub.path!}
                      className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                      style={{ textDecoration: 'none', padding: '8px 12px', fontSize: '0.85rem' }}
                      onClick={() => setIsCollapsed(true)}
                    >
                      {sub.label}
                    </NavLink>
                  )
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Accesos Rápidos (solo expandido) */}
        {!isCollapsed && (
          <>
            <div style={{ marginTop: '24px', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 12px' }}>
              ACCESOS RÁPIDOS
              <MoreHorizontal size={14} />
            </div>
            <NavLink to="/suppliers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ textDecoration: 'none' }} onClick={() => { setExpandedMenu(null); setIsCollapsed(true); }}>
              <div style={{width:'8px',height:'8px',borderRadius:'50%',border:'2px solid var(--text-muted)', flexShrink: 0}}></div> 
              Proveedores 
              <span style={{marginLeft:'auto',fontSize:'0.75rem',color:'var(--text-muted)'}}>122</span>
            </NavLink>
            <NavLink to="/customers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ textDecoration: 'none' }} onClick={() => { setExpandedMenu(null); setIsCollapsed(true); }}>
              <div style={{width:'8px',height:'8px',borderRadius:'50%',border:'2px solid var(--text-muted)', flexShrink: 0}}></div> 
              Clientes Frecuentes 
              <span style={{marginLeft:'auto',fontSize:'0.75rem',color:'var(--text-muted)'}}>89</span>
            </NavLink>
            <NavLink to="/sales-history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ textDecoration: 'none' }} onClick={() => { setExpandedMenu(null); setIsCollapsed(true); }}>
              <div style={{width:'8px',height:'8px',borderRadius:'50%',border:'2px solid var(--text-muted)', flexShrink: 0}}></div> 
              Cortes de Caja 
              <span style={{marginLeft:'auto',fontSize:'0.75rem',color:'var(--text-muted)'}}>32</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* Footer */}
      <div style={{ marginTop: 'auto' }}>

        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ textDecoration: 'none', justifyContent: isCollapsed ? 'center' : 'flex-start' }} title={isCollapsed ? 'Configuración' : undefined} onClick={() => { setExpandedMenu(null); setIsCollapsed(true); }}>
          <Settings size={18} style={{ flexShrink: 0 }} />
          {!isCollapsed && 'Configuración'}
        </NavLink>
        <a 
          href="https://wa.me/18296324220"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-item" 
          style={{ textDecoration: 'none', justifyContent: isCollapsed ? 'center' : 'flex-start' }} 
          title={isCollapsed ? 'Soporte de WhatsApp' : undefined} 
          onClick={() => { setExpandedMenu(null); setIsCollapsed(true); }}
        >
          <HelpCircle size={18} style={{ flexShrink: 0 }} />
          {!isCollapsed && 'Soporte'}
        </a>
        
        <div style={{ marginTop: '16px' }}>
          <button 
            className="logout-btn" 
            style={{ justifyContent: isCollapsed ? 'center' : undefined }}
            onClick={async () => {
              if (!navigator.onLine) {
                alert("Sin conexión a internet. No puedes cerrar sesión para evitar pérdida de datos locales.");
                return;
              }
              try {
                await logout();
              } catch (e) {
                console.error("Logout error", e);
              }
            }}
          >
            <div className="sign"><LogOut size={18} strokeWidth={2.5} /></div>
            {!isCollapsed && <div className="text">Salir</div>}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
