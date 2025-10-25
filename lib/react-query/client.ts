import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, Platform } from 'react-native';
import { focusManager } from '@tanstack/react-query';

AppState.addEventListener('change', (state) => {
  focusManager.setFocused(state === 'active');
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 86_400_000,
      retry: 2,
      refetchOnReconnect: true,
      refetchOnWindowFocus: true
    },
    mutations: { retry: 0 }
  }
});

const persister = Platform.OS === 'web'
  ? createSyncStoragePersister({ storage: typeof window !== 'undefined' ? window.localStorage : undefined, key: 'up__rq' })
  : createAsyncStoragePersister({ storage: AsyncStorage, key: 'up__rq' });

persistQueryClient({ queryClient, persister, maxAge: 7 * 24 * 60 * 60 * 1000 });

export default queryClient;
