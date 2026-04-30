import React, { useEffect, useState } from 'react';
import { I18n } from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { CartProvider } from './src/context/CartContext';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme';

const i18n = new I18n({
  en: {
    appName: 'Lomi Market',
  },
  ar: {
    appName: 'لومي ماركت',
  },
});

i18n.enableFallback = true;

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('lomi:language')
      .then((language) => {
        i18n.locale = language || 'en';
      })
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={colors.dark} />
      <CartProvider>
        <AppNavigator />
      </CartProvider>
    </SafeAreaProvider>
  );
}
