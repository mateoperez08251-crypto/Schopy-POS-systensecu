import React from 'react';
import POSInterface from '../components/POSInterface';

interface POSProps {
  salesHistory: any[];
  setSalesHistory: (val: any[]) => void;
}

const POS: React.FC<POSProps> = ({ salesHistory, setSalesHistory }) => {
  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <POSInterface 
        salesHistory={salesHistory} 
        setSalesHistory={setSalesHistory} 
        isVoucherMode={false} 
      />
    </div>
  );
};

export default POS;
