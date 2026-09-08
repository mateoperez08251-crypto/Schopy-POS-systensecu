import { getLocalData, addAndNotify, subscribeToLocal } from '../services/localDb';

export interface Receiving {
  id: string;
  date: string;
  supplier: string;
  items: number;
  totalCost: number;
  user: string;
}

const COLLECTION = 'receivings';

export const getReceivingsLocal = (): Receiving[] => {
  return getLocalData<Receiving>(COLLECTION);
};

export const addReceivingLocal = (receiving: Omit<Receiving, 'id'>): Receiving => {
  return addAndNotify<Receiving>(COLLECTION, receiving as unknown as Receiving);
};

export const subscribeToReceivings = (callback: (data: Receiving[]) => void) => {
  return subscribeToLocal<Receiving>(COLLECTION, callback);
};
