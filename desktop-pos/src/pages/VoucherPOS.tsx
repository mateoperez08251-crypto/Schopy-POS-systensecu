import React, { useState } from 'react';
import POSInterface from '../components/POSInterface';
import { useAuth } from '../context/AuthContext';

interface VoucherPOSProps {
  salesHistory: any[];
  setSalesHistory: (val: any[]) => void;
  inventory: any[];
}

const VoucherPOS: React.FC<VoucherPOSProps> = ({ salesHistory, setSalesHistory, inventory }) => {
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const { userData } = useAuth();
  const taxRate = userData?.taxRate || 18;

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <POSInterface 
        salesHistory={salesHistory} 
        setSalesHistory={setSalesHistory} 
        inventory={inventory}
        isVoucherMode={true}
        onOpenVoucher={() => setIsVoucherModalOpen(true)}
        onCloseVoucher={() => setIsVoucherModalOpen(false)}
      />
    </div>
  );
};

export default VoucherPOS;
