import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { activeOpacity, colors, globalStyles, spacing } from '../theme';

const avatarUrl =
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80';

function MenuRow({
  icon,
  title,
  subtitle,
  danger = false,
  right,
  onPress,
}) {
  return (
    <TouchableOpacity activeOpacity={activeOpacity} style={styles.menuRow} onPress={onPress}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Ionicons name={icon} size={19} color={danger ? colors.error : colors.primary} />
      </View>
      <View style={styles.menuText}>
        <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>{title}</Text>
        {!!subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {right || <Ionicons name="chevron-back" size={20} color={colors.surface3} />}
    </TouchableOpacity>
  );
}

function LanguagePill({ value, onChange }) {
  return (
    <View style={styles.languagePill}>
      <TouchableOpacity
        activeOpacity={activeOpacity}
        style={[styles.languageSide, value === 'en' && styles.languageSideActive]}
        onPress={() => onChange('en')}
      >
        <Text style={[styles.languageText, value === 'en' && styles.languageTextActive]}>EN</Text>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={activeOpacity}
        style={[styles.languageSide, value === 'ar' && styles.languageSideActive]}
        onPress={() => onChange('ar')}
      >
        <Text style={[styles.languageText, value === 'ar' && styles.languageTextActive]}>عربي</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ProfileScreen() {
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    AsyncStorage.getItem('lomi:language').then((stored) => {
      if (stored) setLanguage(stored);
    });
  }, []);

  const changeLanguage = async (value) => {
    setLanguage(value);
    await AsyncStorage.setItem('lomi:language', value);
  };

  return (
    <SafeAreaView edges={['top']} style={globalStyles.screen}>
      <View style={styles.header}>
        <Ionicons name="ellipsis-vertical" size={22} color="#555555" />
        <Text style={styles.headerTitle}>Profile</Text>
        <Ionicons name="arrow-forward" size={23} color={colors.primary} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            <TouchableOpacity activeOpacity={activeOpacity} style={styles.editAvatar}>
              <Ionicons name="pencil" size={14} color={colors.dark} />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>Sami Ahmad</Text>
          <Text style={styles.phone}>+966 50 123 4567</Text>
        </View>

        <View style={styles.menuGroup}>
          <MenuRow
            icon="location-outline"
            title="My Addresses"
            subtitle="Manage delivery locations"
          />
          <MenuRow icon="card-outline" title="Payment" subtitle="Cards and wallet balance" />
        </View>

        <View style={styles.menuGroup}>
          <MenuRow
            icon="notifications-outline"
            title="Notifications"
            subtitle="Alerts and promotional emails"
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
          <MenuRow
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="FAQ and customer service"
          />
          <MenuRow icon="log-out-outline" title="Logout" danger />
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
    fontWeight: '800',
    textAlign: 'center',
  },
  content: {
    paddingBottom: 115,
  },
  avatarSection: {
    alignItems: 'center',
    marginTop: 28,
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
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },
  menuGroup: {
    marginHorizontal: spacing.screen,
    marginTop: 22,
    backgroundColor: '#151515',
    borderRadius: 24,
    paddingVertical: 6,
  },
  menuRow: {
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row-reverse',
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
    alignItems: 'flex-end',
  },
  menuTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
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
    width: 110,
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
    fontWeight: '700',
  },
  languageTextActive: {
    color: colors.dark,
  },
  footer: {
    marginTop: 36,
    alignItems: 'center',
  },
  footerBrand: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 2,
  },
  version: {
    color: '#444444',
    fontSize: 12,
    marginTop: 6,
  },
});
