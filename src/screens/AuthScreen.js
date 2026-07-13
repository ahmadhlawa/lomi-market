import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { activeOpacity, assets, colors, globalStyles, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
const { normalizePalestinianPhone } = require('../domain/phone.cjs');

export default function AuthScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const auth = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const otpInput = useRef(null);
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [developmentCode, setDevelopmentCode] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (!resendSeconds) return undefined;
    const timer = setInterval(() => setResendSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  const sendOtp = async () => {
    setError('');
    let normalized;
    try { normalized = normalizePalestinianPhone(phone); } catch (issue) { setError(issue.message); return; }
    setLoading(true);
    try {
      const result = await auth.requestOtp(normalized);
      setNormalizedPhone(normalized);
      setDevelopmentCode(result.development_code || '');
      setResendSeconds(30);
      setStep('otp');
      setTimeout(() => otpInput.current?.focus(), 250);
    } catch (issue) { setError(issue.message); } finally { setLoading(false); }
  };

  const verify = async () => {
    if (otp.length !== 6) { setError('Enter the complete six-digit code.'); return; }
    setError('');
    setLoading(true);
    try { await auth.verifyOtp(normalizedPhone, otp); navigation.replace('MainApp'); }
    catch (issue) { setError(issue.message); }
    finally { setLoading(false); }
  };

  const phoneLabel = normalizedPhone || phone.trim() || '+970 599 123 456';

  return (
    <SafeAreaView edges={['top']} style={globalStyles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <View style={styles.content}>
          <View style={styles.languageRow}>
            {['en', 'ar'].map((item) => (
              <TouchableOpacity
                key={item}
                activeOpacity={activeOpacity}
                style={[styles.languagePill, language === item && styles.languagePillActive]}
                onPress={() => setLanguage(item)}
              >
                <Text
                  style={[styles.languageText, language === item && styles.languageTextActive]}
                >
                  {item === 'en' ? 'EN' : 'AR'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Image source={assets.logo} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Text style={styles.logoText}>LOMI MARKET</Text>
          </View>

          {step === 'phone' ? (
            <View style={styles.form}>
              <Text style={styles.title}>{t('auth.welcome')}</Text>
              <Text style={styles.subtitle}>{t('auth.phoneHelp')}</Text>

              <View style={styles.phoneContainer}>
                <View style={styles.countryPicker}>
                  <Text style={styles.countryCode}>+970</Text>
                  <Ionicons name="chevron-down" size={15} color={colors.textMuted} />
                </View>
                <TextInput
                  value={phone}
                  onChangeText={(value) => setPhone(value.replace(/[^0-9 ]/g, ''))}
                  style={styles.phoneInput}
                  placeholder="599 123 456"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>

              {!!error && <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>}
              <TouchableOpacity disabled={loading} activeOpacity={activeOpacity} style={[styles.mainButton, loading && styles.disabled]} onPress={sendOtp}>
                <Text style={styles.mainButtonText}>{loading ? t('common.loading') : t('auth.send')}</Text>
                <Ionicons name="arrow-forward" size={20} color={colors.dark} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <TouchableOpacity
                activeOpacity={activeOpacity}
                style={styles.backButton}
                onPress={() => setStep('phone')}
              >
                <Ionicons name="arrow-back" size={22} color={colors.primary} />
              </TouchableOpacity>

              <Text style={styles.title}>{t('auth.verify')}</Text>
              <Text style={styles.subtitle}>{t('auth.codeHelp', { phone: phoneLabel })}</Text>
              {!!developmentCode && <Text style={styles.devCode}>{t('auth.devCode', { code: developmentCode })}</Text>}

              <Pressable style={styles.otpBoxes} onPress={() => otpInput.current?.focus()}>
                {Array.from({ length: 6 }).map((_, boxIndex) => {
                  const digit = otp[boxIndex] || '';
                  return (
                    <View key={boxIndex} style={[styles.otpBox, digit && styles.otpBoxFilled]}>
                      <Text style={styles.otpDigit}>{digit}</Text>
                    </View>
                  );
                })}
              </Pressable>
              <TextInput
                ref={otpInput}
                value={otp}
                onChangeText={(value) => setOtp(value.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                style={styles.hiddenOtpInput}
                autoFocus
              />

              {!!error && <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>}
              <TouchableOpacity disabled={loading} activeOpacity={activeOpacity} style={[styles.mainButton, loading && styles.disabled]} onPress={verify}>
                <Text style={styles.mainButtonText}>{loading ? t('common.loading') : t('auth.continue')}</Text>
                <Ionicons name="checkmark" size={21} color={colors.dark} />
              </TouchableOpacity>
              <TouchableOpacity disabled={resendSeconds > 0 || loading} onPress={sendOtp}>
                <Text style={styles.resend}>{resendSeconds > 0 ? `${t('auth.resend')} (${resendSeconds}s)` : t('auth.resend')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={[styles.terms, { bottom: Math.max(insets.bottom, 18) + 8 }]}>
          <Text style={styles.termsText}>
            Verification codes are time-limited. Standard messaging rates may apply in production.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.screen,
  },
  languageRow: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },
  languagePill: {
    width: 42,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languagePillActive: {
    backgroundColor: colors.primary,
  },
  languageText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '900',
  },
  languageTextActive: {
    color: colors.dark,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 34,
  },
  logoCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 72,
    height: 72,
  },
  logoText: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1,
    marginTop: 18,
  },
  form: {
    marginTop: 38,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    textAlign: 'center',
  },
  phoneContainer: {
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    marginTop: 30,
  },
  countryPicker: {
    width: 104,
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: colors.surface2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  countryCode: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '900',
  },
  phoneInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: 16,
  },
  mainButton: {
    height: 58,
    borderRadius: spacing.pill,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 24,
  },
  mainButtonText: {
    color: colors.dark,
    fontSize: 17,
    fontWeight: '900',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  otpBoxes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  otpBox: {
    width: 46,
    height: 54,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: colors.primary,
  },
  otpDigit: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '900',
  },
  hiddenOtpInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  resend: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 18,
  },
  errorText: { color: colors.error, fontSize: 13, textAlign: 'center', marginTop: 14, fontWeight: '700' },
  devCode: { color: colors.primary, fontSize: 13, textAlign: 'center', marginTop: 12, fontWeight: '900' },
  disabled: { opacity: 0.6 },
  terms: {
    position: 'absolute',
    left: spacing.screen,
    right: spacing.screen,
    alignItems: 'center',
  },
  termsText: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
