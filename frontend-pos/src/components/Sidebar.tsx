import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingBag, Package, Calendar as CalendarIcon, 
  BarChart2, ShieldAlert, MoreHorizontal, Settings, HelpCircle, 
  ArrowUpRight, LogOut 
} from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Panel de Control', path: '/' },
    { icon: ShoppingBag, label: 'Ventas', path: '/pos' },
    { icon: Package, label: 'Inventario', path: '/inventory' },
    { icon: ShieldAlert, label: 'Auditoría IA', path: '/audit' },
    { icon: BarChart2, label: 'Reportes', path: '/reports' },
    { icon: CalendarIcon, label: 'Calendario', path: '/calendar' }
  ];

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
        <div style={{ width: '32px', height: '32px', background: 'var(--accent-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '4px', transform: 'rotate(45deg)' }}></div>
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Schopy</h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: 'auto', background: 'var(--bg-app)', padding: '2px 6px', borderRadius: '4px' }}>POS & IA</span>
      </div>

      {/* Perfil de Usuario */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', marginBottom: '32px' }}>
        <img src="https://ui-avatars.com/api/?name=Admin+POS&background=random" alt="Usuario" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
        <div>
          <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>admin@schopy.com</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Administrador</p>
        </div>
      </div>

      {/* Enlaces de Navegación */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        {navItems.map(item => (
          <NavLink 
            key={item.label} 
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{ textDecoration: 'none' }}
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}

        {/* Accesos Rápidos */}
        <div style={{ marginTop: '24px', marginBottom: '8px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 12px' }}>
          ACCESOS RÁPIDOS
          <MoreHorizontal size={14} />
        </div>
        <div className="nav-item"><div style={{width:'8px',height:'8px',borderRadius:'50%',border:'2px solid var(--text-muted)'}}></div> Proveedores <span style={{marginLeft:'auto',fontSize:'0.75rem',color:'var(--text-muted)'}}>122</span></div>
        <div className="nav-item"><div style={{width:'8px',height:'8px',borderRadius:'50%',border:'2px solid var(--text-muted)'}}></div> Clientes Frecuentes <span style={{marginLeft:'auto',fontSize:'0.75rem',color:'var(--text-muted)'}}>89</span></div>
        <div className="nav-item"><div style={{width:'8px',height:'8px',borderRadius:'50%',border:'2px solid var(--text-muted)'}}></div> Cortes de Caja <span style={{marginLeft:'auto',fontSize:'0.75rem',color:'var(--text-muted)'}}>32</span></div>
      </nav>

      {/* Almacenamiento y Footer */}
      <div style={{ marginTop: 'auto' }}>
        <div style={{ background: 'var(--bg-app)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
          <div className="flex-between" style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Clips de Video (IA)</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>90%</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>1.8 GB de 2 GB usados</p>
          <div style={{ height: '6px', background: '#FCA5A5', borderRadius: '3px', width: '100%', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--accent-danger)', width: '90%' }}></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', color: 'var(--text-primary)' }}>
            <ArrowUpRight size={16} /> Ampliar Almacenamiento
          </div>
        </div>

        <div className="nav-item"><Settings size={18} /> Configuración</div>
        <div className="nav-item"><HelpCircle size={18} /> Centro de Ayuda</div>
        
        <div style={{ marginTop: '16px' }}>
          <button className="logout-btn">
            <div className="sign"><LogOut size={18} strokeWidth={2.5} /></div>
            <div className="text">Salir</div>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
