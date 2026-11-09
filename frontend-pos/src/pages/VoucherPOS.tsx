import React from 'react';
import POSInterface from '../components/POSInterface';

interface VoucherPOSProps {
  salesHistory: any[];
  setSalesHistory: (val: any[]) => void;
  inventory?: any[];
}

const VoucherPOS: React.FC<VoucherPOSProps> = ({ salesHistory, setSalesHistory, inventory }) => {
  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <POSInterface 
        salesHistory={salesHistory} 
        setSalesHistory={setSalesHistory} 
        isVoucherMode={true} 
        inventory={inventory}
      />
    </div>
  );
};

export default VoucherPOS;
