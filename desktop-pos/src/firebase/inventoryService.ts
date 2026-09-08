import { 
  subscribeToLocal, 
  addAndNotify, 
  updateAndNotify, 
  deleteAndNotify 
} from '../services/localDb';

const COLLECTION_NAME = 'inventory';

export const subscribeToInventory = (companyId: string, callback: (data: any[]) => void) => {
  return subscribeToLocal(COLLECTION_NAME, (items: any[]) => {
    callback(items); // En modo local, todos los items son de esta instancia
  });
};

export const addInventoryItem = async (companyId: string, itemData: any) => {
  const newItem = addAndNotify(COLLECTION_NAME, {
    ...itemData,
    companyId,
    createdAt: new Date().toISOString()
  });
  return newItem.id;
};

export const updateInventoryItem = async (id: string, itemData: any) => {
  // Extraemos campos que no deben actualizarse para mantener consistencia
  const { id: _, companyId, createdAt, ...updateData } = itemData;
  updateAndNotify(COLLECTION_NAME, id, updateData);
};

export const deleteInventoryItem = async (id: string) => {
  deleteAndNotify(COLLECTION_NAME, id);
};
