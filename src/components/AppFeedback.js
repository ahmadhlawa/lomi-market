import React, { Component } from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import { colors } from '../theme';

export function bindNetworkState() {
  return NetInfo.addEventListener((state) => onlineManager.setOnline(Boolean(state.isConnected)));
}

export function NetworkBanner() {
  const [offline, setOffline] = React.useState(false);
  React.useEffect(() => NetInfo.addEventListener((state) => setOffline(!state.isConnected)), []);
  if (!offline) return null;
  return <View accessibilityRole="alert" style={styles.banner}><Text style={styles.bannerText}>You are offline. Showing saved data where available.</Text></View>;
}

export class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return <View style={styles.error}><Text style={styles.errorTitle}>Lomi Market could not open this screen.</Text><TouchableOpacity style={styles.button} onPress={() => this.setState({ error: null })}><Text style={styles.buttonText}>Try again</Text></TouchableOpacity></View>;
  }
}

const styles = StyleSheet.create({
  banner: { position: 'absolute', zIndex: 999, top: 0, left: 0, right: 0, backgroundColor: colors.error, padding: 8 },
  bannerText: { color: colors.white, textAlign: 'center', fontSize: 12, fontWeight: '800' },
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.dark, padding: 24 },
  errorTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900', textAlign: 'center' },
  button: { marginTop: 18, borderRadius: 24, backgroundColor: colors.primary, paddingHorizontal: 22, paddingVertical: 12 },
  buttonText: { color: colors.dark, fontWeight: '900' },
});
