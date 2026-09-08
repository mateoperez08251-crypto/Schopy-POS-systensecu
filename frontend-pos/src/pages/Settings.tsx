import React, { useState, useEffect } from 'react';
import { Store, Settings as SettingsIcon, Printer, Shield, Save, Percent, MapPin, Phone, FileText } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Config States
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [taxId, setTaxId] = useState('');
  
  const [currency, setCurrency] = useState('$');
  const [taxRate, setTaxRate] = useState('16');
  
  const [ticketFooter, setTicketFooter] = useState('¡Gracias por su compra!');
  
  const [requirePinForDiscount, setRequirePinForDiscount] = useState(false);
  const [requirePinForDelete, setRequirePinForDelete] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.companyName) setCompanyName(data.companyName);
          if (data.address) setAddress(data.address);
          if (data.phone) setPhone(data.phone);
          if (data.taxId) setTaxId(data.taxId);
          if (data.currency) setCurrency(data.currency);
          if (data.taxRate !== undefined) setTaxRate(data.taxRate.toString());
          if (data.ticketFooter) setTicketFooter(data.ticketFooter);
          if (data.requirePinForDiscount !== undefined) setRequirePinForDiscount(data.requirePinForDiscount);
          if (data.requirePinForDelete !== undefined) setRequirePinForDelete(data.requirePinForDelete);
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      }
      setLoading(false);
    };
    loadSettings();
  }, [currentUser]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setIsSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const docRef = doc(db, 'users', currentUser.uid);
      await updateDoc(docRef, {
        companyName,
        address,
        phone,
        taxId,
        currency,
        taxRate: parseFloat(taxRate) || 0,
        ticketFooter,
        requirePinForDiscount,
        requirePinForDelete
      });
      setMessage({ type: 'success', text: 'Configuración guardada exitosamente.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al guardar la configuración.' });
    }
    
    setIsSaving(false);
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div className="loader"><svg viewBox="0 0 80 80"><circle r="32" cy="40" cx="40" id="test"></circle></svg></div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <SettingsIcon size={28} color="var(--accent-primary)" /> Configuración
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Personaliza tu punto de venta y tickets</p>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Save size={18} /> {isSaving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      {message.text && (
        <div style={{ 
          padding: '12px 16px', 
          marginBottom: '24px', 
          borderRadius: '8px',
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          color: message.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)',
          border: `1px solid ${message.type === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)'}`
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Sección: Datos de la Empresa */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
            <Store size={20} color="var(--accent-primary)" /> Datos de la Empresa (Para el Ticket)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Nombre de la Tienda</label>
              <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>RNC / Cédula</label>
              <div style={{ position: 'relative' }}>
                <FileText size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" value={taxId} onChange={e => setTaxId(e.target.value)} placeholder="Ej. 130123456" style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Dirección</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Calle Principal 123..." style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Teléfono</label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 234 567 890" style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Sección: Preferencias del Sistema */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
            <SettingsIcon size={20} color="var(--accent-primary)" /> Preferencias del Sistema
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Símbolo de Moneda</label>
              <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }}>
                <option value="$">$ (Dólares / Pesos)</option>
                <option value="€">€ (Euros)</option>
                <option value="£">£ (Libras)</option>
                <option value="Bs">Bs (Bolívares)</option>
                <option value="S/">S/ (Soles)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>ITBIS / Impuesto (%)</label>
              <div style={{ position: 'relative' }}>
                <Percent size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="number" step="0.1" min="0" value={taxRate} onChange={e => setTaxRate(e.target.value)} placeholder="Ej. 18" style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Sección: Impresión */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
            <Printer size={20} color="var(--accent-primary)" /> Configuración de Impresión
          </h2>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Mensaje de Pie de Página en Ticket</label>
            <input type="text" value={ticketFooter} onChange={e => setTicketFooter(e.target.value)} placeholder="Ej. ¡Gracias por su compra! Síganos en Instagram" style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-medium)', background: 'var(--bg-app)', color: 'var(--text-primary)', outline: 'none' }} />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>Este texto aparecerá al final de todos los recibos impresos.</p>
          </div>
        </div>

        {/* Sección: Seguridad */}
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
            <Shield size={20} color="var(--accent-primary)" /> Seguridad en Caja
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input type="checkbox" checked={requirePinForDiscount} onChange={e => setRequirePinForDiscount(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }} />
              <div>
                <span style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem' }}>Exigir PIN para aplicar descuentos</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>El cajero deberá ingresar un PIN de supervisor para dar descuentos.</span>
              </div>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <input type="checkbox" checked={requirePinForDelete} onChange={e => setRequirePinForDelete(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }} />
              <div>
                <span style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem' }}>Exigir PIN para eliminar productos</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>El cajero deberá ingresar un PIN de supervisor para sacar algo del carrito.</span>
              </div>
            </label>
          </div>
        </div>

      </form>
    </div>
  );
};

export default Settings;
