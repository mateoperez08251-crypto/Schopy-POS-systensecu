// Generic Local Storage Database Manager
import { triggerAutoBackup } from './autoBackup';
export const getLocalData = <T>(collectionName: string): T[] => {
  try {
    const data = localStorage.getItem(`schopy_${collectionName}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading ${collectionName} from localStorage`, error);
    return [];
  }
};

export const saveLocalData = <T>(collectionName: string, data: T[]): void => {
  try {
    localStorage.setItem(`schopy_${collectionName}`, JSON.stringify(data));
    // Trigger auto backup in the background
    triggerAutoBackup();
  } catch (error) {
    console.error(`Error saving ${collectionName} to localStorage`, error);
  }
};

export const addLocalItem = <T extends { id?: string }>(collectionName: string, item: T): T => {
  const data = getLocalData<T>(collectionName);
  const newItem = { ...item, id: item.id || Date.now().toString() + Math.random().toString(36).substr(2, 9) };
  data.push(newItem);
  saveLocalData(collectionName, data);
  return newItem;
};

export const updateLocalItem = <T extends { id: string }>(collectionName: string, id: string, updates: Partial<T>): void => {
  const data = getLocalData<T>(collectionName);
  const index = data.findIndex(item => item.id === id);
  if (index !== -1) {
    data[index] = { ...data[index], ...updates };
    saveLocalData(collectionName, data);
  }
};

export const deleteLocalItem = <T extends { id: string }>(collectionName: string, id: string): void => {
  const data = getLocalData<T>(collectionName);
  const newData = data.filter(item => item.id !== id);
  saveLocalData(collectionName, newData);
};

// Publisher/Subscriber for reactive components (like App.tsx replacing onSnapshot)
type Listener<T> = (data: T[]) => void;
const listeners: Record<string, Listener<any>[]> = {};

export const subscribeToLocal = <T>(collectionName: string, callback: Listener<T>) => {
  if (!listeners[collectionName]) {
    listeners[collectionName] = [];
  }
  listeners[collectionName].push(callback);
  
  // Initial call
  callback(getLocalData<T>(collectionName));
  
  return () => {
    listeners[collectionName] = listeners[collectionName].filter(cb => cb !== callback);
  };
};

export const notifyLocalChange = (collectionName: string) => {
  if (listeners[collectionName]) {
    const data = getLocalData(collectionName);
    listeners[collectionName].forEach(cb => cb(data));
  }
};

// Wrappers that also notify listeners
export const addAndNotify = <T extends { id?: string }>(collectionName: string, item: T): T => {
  const result = addLocalItem(collectionName, item);
  notifyLocalChange(collectionName);
  return result;
};

export const updateAndNotify = <T extends { id: string }>(collectionName: string, id: string, updates: Partial<T>): void => {
  updateLocalItem(collectionName, id, updates);
  notifyLocalChange(collectionName);
};

export const deleteAndNotify = <T extends { id: string }>(collectionName: string, id: string): void => {
  deleteLocalItem(collectionName, id);
  notifyLocalChange(collectionName);
};

export const getLocalStoreSettings = () => {
  try {
    const stored = localStorage.getItem('schopy_store_settings');
    if (stored) return JSON.parse(stored);
  } catch(e) {}
  return {};
};
