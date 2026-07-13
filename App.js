import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { bindNetworkState, ErrorBoundary, NetworkBanner } from './src/components/AppFeedback';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, gcTime: 1000 * 60 * 60, retry: 1, networkMode: 'offlineFirst' },
    mutations: { retry: 0, networkMode: 'online' },
  },
});

export default function App() {
  useEffect(() => bindNetworkState(), []);
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={colors.dark} />
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <AuthProvider>
              <CartProvider>
                <AppNavigator />
                <NetworkBanner />
              </CartProvider>
            </AuthProvider>
          </LanguageProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
