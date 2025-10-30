import * as SecureStore from 'expo-secure-store';

type StorageAdapter = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

export const ExpoSecureStoreAdapter: StorageAdapter = {
  async getItem(key) {
    try { return await SecureStore.getItemAsync(key); } catch { return null; }
  },
  async setItem(key, value) {
    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key) {
    await SecureStore.deleteItemAsync(key);
  },
};
