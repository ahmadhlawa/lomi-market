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
import { activeOpacity, assets, colors, globalStyles } from '../theme';

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

  const verify = () => {
    navigation.replace('MainApp');
  };

  const renderLanguageToggle = () => (
    <View style={styles.languageRow}>
      <TouchableOpacity activeOpacity={activeOpacity} onPress={() => toggleLanguage('en')}>
        <Text style={[styles.language, language === 'en' && styles.languageActive]}>
          ENGLISH
        </Text>
      </TouchableOpacity>
      <Text style={styles.languageSeparator}> • </Text>
      <TouchableOpacity activeOpacity={activeOpacity} onPress={() => toggleLanguage('ar')}>
        <Text style={[styles.language, language === 'ar' && styles.languageActive]}>العربية</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPhone = () => (
    <>
      {renderLanguageToggle()}
      <View style={styles.logoSection}>
        <View style={styles.logoCircle}>
          <Image source={assets.logo} style={styles.logoImage} resizeMode="contain" />
        </View>
        <Text style={styles.logoText}>LOMI</Text>
        <Text style={styles.logoTextSecond}>MARKET</Text>
      </View>

      <View style={styles.welcome}>
        <Text style={styles.welcomeTitle}>Welcome to Lomi Market</Text>
        <Text style={styles.welcomeTitleAr}>أهلاً بك في لومي ماركت</Text>
        <Text style={styles.subtitle}>Enter your phone number to continue</Text>
        <Text style={styles.subtitleAr}>أدخل رقم هاتفك للمتابعة</Text>
      </View>

      <View style={styles.phoneContainer}>
        <TouchableOpacity activeOpacity={activeOpacity} style={styles.countryPicker}>
          <Text style={styles.flag}>🇵🇸</Text>
          <Text style={styles.countryCode}>+970</Text>
          <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
        </TouchableOpacity>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          style={styles.phoneInput}
          placeholder="599 123 456"
          placeholderTextColor="#444"
          keyboardType="phone-pad"
        />
      </View>

      <TouchableOpacity
        activeOpacity={activeOpacity}
        style={styles.mainButton}
        onPress={() => setStep('otp')}
      >
        <Text style={styles.mainButtonText}>Send OTP</Text>
        <Text style={styles.mainButtonSub}>إرسال رمز التحقق</Text>
      </TouchableOpacity>
    </>
  );

  const renderOtp = () => (
    <>
      <View style={styles.otpTop}>
        <TouchableOpacity
          activeOpacity={activeOpacity}
          style={styles.backButton}
          onPress={() => setStep('phone')}
        >
          <Ionicons name="arrow-back" size={25} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.otpBlock}>
        <Text style={styles.otpTitle}>Verify Phone</Text>
        <Text style={styles.otpSubtitle}>Enter the 6-digit code sent to</Text>
        <Text style={styles.otpPhone}>+970 {phone || '599 123 456'}</Text>
        <Text style={styles.otpSubtitleAr}>أدخل الرمز المكون من 6 أرقام</Text>

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
          <Text style={styles.mainButtonText}>Verify</Text>
          <Text style={styles.mainButtonSub}>تحقق</Text>
        </TouchableOpacity>

        <Text style={styles.resend}>
          Didn't receive the code? <Text style={styles.resendLink}>Resend</Text>
        </Text>
      </View>
    </>
  );

  return (
    <SafeAreaView edges={['top']} style={globalStyles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <View style={styles.content}>{step === 'phone' ? renderPhone() : renderOtp()}</View>
        <View style={[styles.terms, { bottom: Math.max(insets.bottom, 20) + 10 }]}>
          <Text style={styles.termsText}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms & Conditions</Text>
          </Text>
          <Text style={styles.termsTextAr}>
            بالمتابعة، أنت توافق على <Text style={styles.termsLink}>الشروط والأحكام</Text>
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
    paddingHorizontal: 24,
  },
  languageRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 18,
  },
  language: {
    color: '#555555',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  languageActive: {
    color: colors.primary,
  },
  languageSeparator: {
    color: '#555555',
    fontSize: 13,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 48,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 22,
    elevation: 8,
  },
  logoImage: {
    width: 70,
    height: 70,
  },
  logoText: {
    color: colors.primary,
    fontSize: 42,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 2,
    marginTop: 18,
  },
  logoTextSecond: {
    color: colors.primary,
    fontSize: 42,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 2,
    marginTop: -8,
  },
  welcome: {
    marginTop: 32,
    alignItems: 'center',
  },
  welcomeTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  welcomeTitleAr: {
    color: colors.textSecondary,
    fontSize: 17,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 22,
    textAlign: 'center',
  },
  subtitleAr: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  phoneContainer: {
    flexDirection: 'row',
    height: 58,
    borderRadius: 14,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    marginTop: 34,
  },
  countryPicker: {
    width: 120,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 7,
    borderRightWidth: 1,
    borderRightColor: colors.surface2,
  },
  flag: {
    fontSize: 20,
  },
  countryCode: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  phoneInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 18,
    paddingHorizontal: 18,
    letterSpacing: 2,
  },
  mainButton: {
    height: 58,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    shadowColor: colors.primary,
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  mainButtonText: {
    color: colors.dark,
    fontSize: 18,
    fontWeight: '800',
  },
  mainButtonSub: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  terms: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
  },
  termsText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  termsTextAr: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  termsLink: {
    color: colors.primary,
  },
  otpTop: {
    paddingTop: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBlock: {
    marginTop: 50,
  },
  otpTitle: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
  },
  otpSubtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    marginTop: 12,
  },
  otpPhone: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 5,
  },
  otpSubtitleAr: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 10,
  },
  otpBoxes: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 28,
    justifyContent: 'center',
  },
  otpBox: {
    width: 46,
    height: 54,
    borderRadius: 12,
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
    fontWeight: '800',
  },
  hiddenOtpInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  resend: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 18,
  },
  resendLink: {
    color: colors.primary,
    fontWeight: '700',
  },
});
