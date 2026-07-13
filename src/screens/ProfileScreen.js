import React, { useState } from 'react';
import { Image, Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { activeOpacity, colors, globalStyles, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api, jsonOptions } from '../api/client';

const avatarUrl =
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80';

function MenuRow({ icon, title, subtitle, danger = false, right, onPress }) {
  const Container = onPress ? TouchableOpacity : View;
  return (
    <Container {...(onPress ? { activeOpacity, onPress } : {})} style={styles.menuRow}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Ionicons name={icon} size={19} color={danger ? colors.error : colors.primary} />
      </View>
      <View style={styles.menuText}>
        <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>{title}</Text>
        {!!subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {right || <Ionicons name="chevron-forward" size={20} color={colors.surface3} />}
    </Container>
  );
}

function LanguagePill({ value, onChange }) {
  return (
    <View style={styles.languagePill}>
      {['en', 'ar'].map((item) => (
        <TouchableOpacity
          key={item}
          activeOpacity={activeOpacity}
          style={[styles.languageSide, value === item && styles.languageSideActive]}
          onPress={() => onChange(item)}
        >
          <Text style={[styles.languageText, value === item && styles.languageTextActive]}>
            {item.toUpperCase()}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const auth = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [notifications, setNotifications] = useState(auth.user?.notifications_enabled ?? true);
  const [loggedOut, setLoggedOut] = useState(false);

  const changeLanguage = async (value) => {
    await setLanguage(value);
    await api('/auth/me', jsonOptions('PATCH', { language: value }));
  };

  const logout = async () => {
    setLoggedOut(true);
    await auth.logout();
    navigation.getParent()?.replace('Auth');
  };

  const changeNotifications = async (value) => {
    setNotifications(value);
    try { await api('/auth/me', jsonOptions('PATCH', { notifications_enabled: value })); } catch { setNotifications(!value); }
  };

  return (
    <SafeAreaView edges={['top']} style={globalStyles.screen}>
      <View style={styles.header}>
        <Ionicons name="settings-outline" size={22} color={colors.textMuted} />
        <Text style={styles.headerTitle}>Profile</Text>
        <Ionicons name="person-circle-outline" size={25} color={colors.primary} />
      </View>

      {loggedOut && (
        <View style={styles.toast}>
          <Ionicons name="information-circle" size={17} color={colors.primary} />
          <Text style={styles.toastText}>Signing out…</Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          </View>
          <Text style={styles.name}>{auth.user?.full_name || 'Lomi Customer'}</Text>
          <Text style={styles.phone}>{auth.user?.phone}</Text>
          <Text style={styles.demoBadge}>Lomi Market customer</Text>
        </View>

        <View style={styles.menuGroup}>
          <MenuRow icon="location-outline" title={t('profile.addresses')} subtitle="Home and saved delivery spots" onPress={() => navigation.navigate('HomeTab', { screen: 'Addresses' })} />
          <MenuRow icon="cash-outline" title="Payment method" subtitle="Cash on delivery" right={<Ionicons name="checkmark-circle" size={22} color={colors.success} />} />
        </View>

        <View style={styles.menuGroup}>
          <MenuRow
            icon="notifications-outline"
            title="Notifications"
            subtitle="Order alerts and market offers"
            right={
              <Switch
                value={notifications}
                onValueChange={changeNotifications}
                trackColor={{ false: colors.surface2, true: colors.primary }}
                thumbColor={colors.white}
              />
            }
          />
          <MenuRow
            icon="globe-outline"
            title={t('profile.language')}
            subtitle="English / العربية"
            right={<LanguagePill value={language} onChange={changeLanguage} />}
          />
        </View>

        <View style={styles.menuGroup}>
          <MenuRow icon="document-text-outline" title="Terms & privacy" subtitle="Store policies" onPress={() => navigation.navigate('HomeTab', { screen: 'Legal' })} />
          <MenuRow icon="help-circle-outline" title={t('profile.support')} subtitle="Call customer care" onPress={() => Linking.openURL('tel:+970599000000')} />
          <MenuRow icon="log-out-outline" title={t('profile.logout')} subtitle="Sign out on this device" danger onPress={logout} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>LOMI MARKET</Text>
          <Text style={styles.version}>Version 1.0.2</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    paddingHorizontal: spacing.screen,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: '900',
    textAlign: 'center',
  },
  toast: {
    position: 'absolute',
    zIndex: 4,
    top: 74,
    alignSelf: 'center',
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  toastText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  content: {
    paddingBottom: 115,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 26,
  },
  avatarWrap: {
    width: 108,
    height: 108,
    position: 'relative',
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  editAvatar: {
    position: 'absolute',
    bottom: 4,
    right: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    color: colors.textPrimary,
    fontSize: 25,
    fontWeight: '900',
    marginTop: 12,
  },
  phone: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 6,
  },
  demoBadge: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 7,
  },
  menuGroup: {
    marginHorizontal: spacing.screen,
    marginTop: 22,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
  },
  menuRow: {
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDanger: {
    backgroundColor: colors.errorDim,
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
  },
  menuTitleDanger: {
    color: colors.error,
  },
  menuSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  languagePill: {
    width: 108,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface2,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
  },
  languageSide: {
    flex: 1,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageSideActive: {
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
  footer: {
    marginTop: 34,
    alignItems: 'center',
  },
  footerBrand: {
    ...globalStyles.brandText,
    fontSize: 18,
    letterSpacing: 2,
  },
  version: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
});
