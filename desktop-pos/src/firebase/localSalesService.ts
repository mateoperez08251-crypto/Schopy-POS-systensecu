import { 
  subscribeToLocal, 
  addAndNotify, 
  updateAndNotify, 
  deleteAndNotify 
} from '../services/localDb';

const COLLECTION_NAME = 'sales';

export const subscribeToSales = (callback: (data: any[]) => void) => {
  return subscribeToLocal(COLLECTION_NAME, (items: any[]) => {
    callback(items);
  });
};

export const addSale = async (saleData: any) => {
  const newSale = addAndNotify(COLLECTION_NAME, {
    ...saleData,
    createdAt: new Date().toISOString()
  });
  return newSale.id;
};

export const updateSale = async (id: string, saleData: any) => {
  updateAndNotify(COLLECTION_NAME, id, saleData);
};

export const deleteSale = async (id: string) => {
  deleteAndNotify(COLLECTION_NAME, id);
};
