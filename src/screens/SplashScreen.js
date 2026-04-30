import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { assets, colors, globalStyles } from '../theme';

export default function SplashScreen({ navigation }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(async () => {
      const hasOnboarded = await AsyncStorage.getItem('lomi:onboarded');
      navigation.replace(hasOnboarded ? 'MainApp' : 'Onboarding');
    }, 2800);

    return () => clearTimeout(timer);
  }, [navigation, progress]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView edges={['top']} style={[globalStyles.screen, styles.container]}>
      <View style={styles.center}>
        <Image source={assets.logo} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>LOMI MARKET</Text>
        <Text style={styles.titleAr}>لومي ماركت</Text>
      </View>

      <View style={styles.bottom}>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width }]} />
        </View>
        <Text style={styles.tagline}>CURATING FRESHNESS</Text>
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
    justifyContent: 'center',
  },
  logo: {
    width: 180,
    height: 180,
  },
  title: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 3,
    marginTop: 16,
  },
  titleAr: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '400',
    marginTop: 4,
  },
  bottom: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    paddingHorizontal: 30,
  },
  tagline: {
    color: '#555555',
    fontSize: 11,
    letterSpacing: 4,
    textAlign: 'center',
    marginTop: 16,
  },
  progressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: colors.surface2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBar: {
    height: 3,
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
});
