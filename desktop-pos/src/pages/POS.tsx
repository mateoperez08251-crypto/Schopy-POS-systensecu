import React from 'react';
import POSInterface from '../components/POSInterface';

interface POSProps {
  salesHistory: any[];
  setSalesHistory: (val: any[]) => void;
  inventory: any[];
}

const POS: React.FC<POSProps> = ({ salesHistory, setSalesHistory, inventory }) => {
  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <POSInterface 
        salesHistory={salesHistory} 
        setSalesHistory={setSalesHistory} 
        inventory={inventory}
        isVoucherMode={false} 
      />
    </div>
  );
};

export default POS;
