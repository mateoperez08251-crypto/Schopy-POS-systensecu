import { 
  subscribeToLocal, 
  addAndNotify, 
  updateAndNotify, 
  deleteAndNotify 
} from '../services/localDb';

const COLLECTION_NAME = 'customers';

export const subscribeToCustomers = (companyId: string, callback: (data: any[]) => void) => {
  return subscribeToLocal(COLLECTION_NAME, (items: any[]) => {
    callback(items);
  });
};

export const addCustomer = async (companyId: string, customerData: any) => {
  const newItem = addAndNotify(COLLECTION_NAME, {
    ...customerData,
    companyId,
    createdAt: new Date().toISOString()
  });
  return newItem.id;
};

export const updateCustomer = async (id: string, customerData: any) => {
  const { id: _, companyId, createdAt, ...updateData } = customerData;
  updateAndNotify(COLLECTION_NAME, id, updateData);
};

export const deleteCustomer = async (id: string) => {
  deleteAndNotify(COLLECTION_NAME, id);
};
