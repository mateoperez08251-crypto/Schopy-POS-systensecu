import { useState } from 'react';
import { BUSINESS_TYPE_LIST, BusinessTypeId } from '../config/businessTypes';
import { useBusiness } from '../context/BusinessContext';

const BusinessTypeSetup = () => {
  const { setBusinessType } = useBusiness();
  const [selected, setSelected] = useState<BusinessTypeId | null>(null);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', background: 'var(--bg-app)' }}>
      <div style={{ width: '100%', maxWidth: '760px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, marginBottom: '8px' }}>¿Qué tipo de negocio tienes?</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Adaptaremos el programa a tu negocio. Podrás cambiarlo después en Configuración.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {BUSINESS_TYPE_LIST.map(type => {
            const Icon = type.icon;
            const isSelected = selected === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setSelected(type.id)}
                aria-pressed={isSelected}
                className="card"
                style={{
                  display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', textAlign: 'left', cursor: 'pointer',
                  color: 'var(--text-primary)',
                  border: `2px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-medium)'}`,
                  background: isSelected ? 'var(--accent-primary-light)' : 'var(--bg-card)'
                }}
              >
                <span style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-app)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={24} color="var(--accent-primary)" />
                </span>
                <span>
                  <span style={{ display: 'block', fontWeight: 700, fontSize: '1.05rem', marginBottom: '2px' }}>{type.label}</span>
                  <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{type.description}</span>
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="btn btn-primary"
          disabled={!selected}
          onClick={() => selected && setBusinessType(selected)}
          style={{ width: '100%', padding: '16px', fontSize: '1.05rem', fontWeight: 700, opacity: selected ? 1 : 0.5 }}
        >
          Continuar
        </button>
      </div>
    </div>
  );
};

export default BusinessTypeSetup;
