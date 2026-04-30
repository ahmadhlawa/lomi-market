import { Platform, StyleSheet } from 'react-native';

export const colors = {
  primary: '#fdca00',
  primaryDim: '#fdca0022',
  dark: '#111111',
  surface: '#1e1e1e',
  surface2: '#2a2a2a',
  surface3: '#333333',
  white: '#ffffff',
  textPrimary: '#ffffff',
  textSecondary: '#aaaaaa',
  textMuted: '#666666',
  success: '#22c55e',
  successDim: '#22c55e22',
  error: '#ef4444',
  errorDim: '#ef444422',
  border: 'rgba(255,255,255,0.07)',
};

export const spacing = {
  screen: 20,
  radius: 16,
  pill: 50,
  tabHeight: 70,
};

export const assets = {
  logo: require('../assets/logo.png'),
  onboarding1: require('../assets/onboarding1.jpg'),
  onboarding2: require('../assets/onboarding2.jpg'),
  onboarding3: require('../assets/onboarding3.jpg'),
};

export const formatPrice = (value) => Number(value || 0).toFixed(2);

export const activeOpacity = 0.75;

export const shadow = {
  ...Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.35,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
    },
    android: {
      elevation: 8,
    },
  }),
};

export const mapRegion = {
  latitude: 31.9038,
  longitude: 35.2034,
  latitudeDelta: 0.028,
  longitudeDelta: 0.028,
};

export const mapDarkStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a1a' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#767676' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#111111' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#333333' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#1f1f1f' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#18251c' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2b2b2b' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#151515' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3a3525' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#222222' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e171d' }] },
];

export const globalStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  screenPadding: {
    paddingHorizontal: spacing.screen,
  },
  brandText: {
    color: colors.primary,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1.4,
  },
});
