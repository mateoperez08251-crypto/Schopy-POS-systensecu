import React from 'react';
import POSInterface from '../components/POSInterface';

interface VoucherPOSProps {
  salesHistory: any[];
  setSalesHistory: (val: any[]) => void;
}

const VoucherPOS: React.FC<VoucherPOSProps> = ({ salesHistory, setSalesHistory }) => {
  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <POSInterface 
        salesHistory={salesHistory} 
        setSalesHistory={setSalesHistory} 
        isVoucherMode={true} 
      />
    </div>
  );
};

export default VoucherPOS;
