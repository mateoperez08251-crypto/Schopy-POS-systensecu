import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ isOpen, onClose, onConfirm, itemName }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="checkout-modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '24px' }} onClick={onClose}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', padding: '24px', textAlign: 'center', gap: '16px' }} onClick={e => e.stopPropagation()}>
        
        <div style={{ margin: '0 auto', background: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '50%' }}>
          <AlertTriangle size={32} color="var(--accent-danger)" />
        </div>
        
        <div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700 }}>¿Eliminar Producto?</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Estás a punto de eliminar <strong>"{itemName}"</strong> del inventario. Esta acción no se puede deshacer.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" style={{ flex: 1, background: 'var(--accent-danger)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }} onClick={onConfirm}>
            <Trash2 size={18} /> Eliminar
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default ConfirmDeleteModal;
