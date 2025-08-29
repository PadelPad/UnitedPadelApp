import { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from './client';

export default function TRQProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
