import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  QueryClient,
  focusManager,
  onlineManager,
} from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

export const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

// Keep queries “fresh” when app foregrounds
focusManager.setEventListener((handleFocus) => {
  const sub = AppState.addEventListener('change', (state) => {
    handleFocus(state === 'active');
  });
  return () => sub.remove();
});

// Web online/offline awareness
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  const goOnline = () => onlineManager.setOnline(true);
  const goOffline = () => onlineManager.setOnline(false);
  window.addEventListener('online', goOnline);
  window.addEventListener('offline', goOffline);
  onlineManager.setOnline(navigator.onLine);
}
