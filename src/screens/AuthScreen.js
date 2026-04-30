import React, { useRef, useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { activeOpacity, assets, colors, globalStyles, spacing } from '../theme';

export default function AuthScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const otpInput = useRef(null);
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [language, setLanguage] = useState('en');

  const toggleLanguage = async (value) => {
    setLanguage(value);
    await AsyncStorage.setItem('lomi:language', value);
  };

  const sendOtp = () => {
    setStep('otp');
    setTimeout(() => otpInput.current?.focus(), 250);
  };

  const verify = () => {
    navigation.replace('MainApp');
  };

  const phoneLabel = phone.trim() || '599 123 456';

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
                onPress={() => toggleLanguage(item)}
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
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>
                Enter your phone number to open the customer demo.
              </Text>

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

              <TouchableOpacity activeOpacity={activeOpacity} style={styles.mainButton} onPress={sendOtp}>
                <Text style={styles.mainButtonText}>Send demo code</Text>
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

              <Text style={styles.title}>Verify phone</Text>
              <Text style={styles.subtitle}>
                Use any 6 digits. This is a safe demo verification for +970 {phoneLabel}.
              </Text>

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

              <TouchableOpacity activeOpacity={activeOpacity} style={styles.mainButton} onPress={verify}>
                <Text style={styles.mainButtonText}>Verify and continue</Text>
                <Ionicons name="checkmark" size={21} color={colors.dark} />
              </TouchableOpacity>
              <Text style={styles.resend}>Did not receive a code? Resend demo code</Text>
            </View>
          )}
        </View>

        <View style={[styles.terms, { bottom: Math.max(insets.bottom, 18) + 8 }]}>
          <Text style={styles.termsText}>
            Demo only. No real verification, payment, or order is submitted.
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
