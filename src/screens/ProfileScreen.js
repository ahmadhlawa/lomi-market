import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { activeOpacity, colors, globalStyles, spacing } from '../theme';

const avatarUrl =
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80';

function MenuRow({ icon, title, subtitle, danger = false, right, onPress }) {
  return (
    <TouchableOpacity activeOpacity={activeOpacity} style={styles.menuRow} onPress={onPress}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Ionicons name={icon} size={19} color={danger ? colors.error : colors.primary} />
      </View>
      <View style={styles.menuText}>
        <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>{title}</Text>
        {!!subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {right || <Ionicons name="chevron-forward" size={20} color={colors.surface3} />}
    </TouchableOpacity>
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

export default function ProfileScreen() {
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('en');
  const [loggedOut, setLoggedOut] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('lomi:language').then((stored) => {
      if (stored) setLanguage(stored);
    });
  }, []);

  const changeLanguage = async (value) => {
    setLanguage(value);
    await AsyncStorage.setItem('lomi:language', value);
  };

  const logoutDemo = () => {
    setLoggedOut(true);
    setTimeout(() => setLoggedOut(false), 1500);
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
          <Text style={styles.toastText}>Demo logout only</Text>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            <TouchableOpacity activeOpacity={activeOpacity} style={styles.editAvatar}>
              <Ionicons name="pencil" size={14} color={colors.dark} />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>Sami Ahmad</Text>
          <Text style={styles.phone}>+970 599 123 456</Text>
          <Text style={styles.demoBadge}>Customer demo profile</Text>
        </View>

        <View style={styles.menuGroup}>
          <MenuRow icon="location-outline" title="Addresses" subtitle="Home, office, and saved delivery spots" />
          <MenuRow icon="card-outline" title="Payment methods" subtitle="Cards, cash, and wallet settings" />
        </View>

        <View style={styles.menuGroup}>
          <MenuRow
            icon="notifications-outline"
            title="Notifications"
            subtitle="Order alerts and market offers"
            right={
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: colors.surface2, true: colors.primary }}
                thumbColor={colors.white}
              />
            }
          />
          <MenuRow
            icon="globe-outline"
            title="Language"
            subtitle="English / العربية"
            right={<LanguagePill value={language} onChange={changeLanguage} />}
          />
        </View>

        <View style={styles.menuGroup}>
          <MenuRow icon="help-circle-outline" title="Help & support" subtitle="FAQ and customer care" />
          <MenuRow icon="log-out-outline" title="Logout" subtitle="Safe demo action" danger onPress={logoutDemo} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerBrand}>LOMI MARKET</Text>
          <Text style={styles.version}>Demo version 1.0.0</Text>
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
