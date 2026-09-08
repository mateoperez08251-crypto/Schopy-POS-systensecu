import { 
  subscribeToLocal, 
  addAndNotify, 
  updateAndNotify, 
  deleteAndNotify 
} from '../services/localDb';

const COLLECTION_NAME = 'mechanics';

export const subscribeToMechanics = (callback: (data: any[]) => void) => {
  return subscribeToLocal(COLLECTION_NAME, (items: any[]) => {
    callback(items);
  });
};

export const addMechanic = async (mechanicData: any) => {
  const newMechanic = addAndNotify(COLLECTION_NAME, {
    ...mechanicData,
    commissionRate: mechanicData.commissionRate || 5, // Default 5%
    createdAt: new Date().toISOString()
  });
  return newMechanic.id;
};

export const updateMechanic = async (id: string, mechanicData: any) => {
  const { id: _, createdAt, ...updateData } = mechanicData;
  updateAndNotify(COLLECTION_NAME, id, updateData);
};

export const deleteMechanic = async (id: string) => {
  deleteAndNotify(COLLECTION_NAME, id);
};
