import { 
  subscribeToLocal, 
  addAndNotify, 
  updateAndNotify, 
  deleteAndNotify,
  getLocalData
} from '../services/localDb';

const COLLECTION_NAME = 'staff';

export const subscribeToStaffLocal = (callback: (data: any[]) => void) => {
  return subscribeToLocal(COLLECTION_NAME, (items: any[]) => {
    callback(items);
  });
};

export const getStaffByPin = (pin: string) => {
  const staff = getLocalData<any>(COLLECTION_NAME);
  return staff.find(s => s.pin === pin);
};

export const getAllStaffLocal = () => {
  return getLocalData<any>(COLLECTION_NAME);
};

export const addStaffLocal = async (staffData: any) => {
  // Check if PIN already exists
  const existing = getLocalData<any>(COLLECTION_NAME);
  if (existing.some(s => s.pin === staffData.pin)) {
    throw new Error('Ese PIN ya está en uso. Por favor, elige otro.');
  }

  const newStaff = addAndNotify(COLLECTION_NAME, {
    ...staffData,
    createdAt: new Date().toISOString()
  });
  return newStaff.id;
};

export const updateStaffLocal = async (id: string, staffData: any) => {
  const { id: _, createdAt, ...updateData } = staffData;
  updateAndNotify(COLLECTION_NAME, id, updateData);
};

export const deleteStaffLocal = async (id: string) => {
  deleteAndNotify(COLLECTION_NAME, id);
};

export const hasAdminLocal = () => {
  const staff = getLocalData<any>(COLLECTION_NAME);
  return staff.some(s => s.role === 'admin');
};
