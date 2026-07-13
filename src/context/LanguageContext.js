import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import { I18n } from 'i18n-js';
import { translations } from '../i18n/translations';

const LanguageContext = createContext(null);
const i18n = new I18n(translations);
i18n.enableFallback = true;

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState('en');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem('lomi:language').then((stored) => setLanguageState(stored === 'ar' ? 'ar' : 'en')).finally(() => setReady(true));
  }, []);
  i18n.locale = language;
  const setLanguage = useCallback(async (next) => {
    const value = next === 'ar' ? 'ar' : 'en';
    setLanguageState(value);
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(value === 'ar');
    await AsyncStorage.setItem('lomi:language', value);
  }, []);
  const value = useMemo(() => ({ ready, language, isRTL: language === 'ar', t: (key, options) => i18n.t(key, options), setLanguage }), [ready, language, setLanguage]);
  if (!ready) return null;
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider');
  return value;
}

