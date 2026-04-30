import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { assets, colors, globalStyles } from '../theme';

export default function SplashScreen({ navigation }) {
  const progress = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 650,
        useNativeDriver: true,
      }),
      Animated.timing(progress, {
        toValue: 1,
        duration: 2200,
        useNativeDriver: false,
      }),
    ]).start();

    const timer = setTimeout(async () => {
      const hasOnboarded = await AsyncStorage.getItem('lomi:onboarded');
      navigation.replace(hasOnboarded ? 'MainApp' : 'Onboarding');
    }, 2400);

    return () => clearTimeout(timer);
  }, [fade, navigation, progress]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView edges={['top']} style={[globalStyles.screen, styles.container]}>
      <Animated.View style={[styles.center, { opacity: fade }]}>
        <View style={styles.logoPlate}>
          <Image source={assets.logo} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.title}>LOMI MARKET</Text>
        <Text style={styles.subtitle}>Fresh groceries, delivered beautifully</Text>
      </Animated.View>

      <View style={styles.bottom}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width }]} />
        </View>
        <Text style={styles.tagline}>PREPARING YOUR MARKET</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
  },
  logoPlate: {
    width: 170,
    height: 170,
    borderRadius: 44,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  logo: {
    width: 132,
    height: 132,
  },
  title: {
    color: colors.primary,
    fontSize: 29,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 2,
    marginTop: 22,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  bottom: {
    position: 'absolute',
    bottom: 42,
    width: '100%',
    paddingHorizontal: 32,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: colors.surface2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 16,
  },
});
