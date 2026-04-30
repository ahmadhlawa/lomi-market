import React, { useRef, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { activeOpacity, assets, colors, globalStyles, shadow, spacing } from '../theme';

const slides = [
  {
    image: assets.onboarding1,
    title: 'Fresh groceries',
    subtitle: 'Hand-picked produce, dairy, bakery, and daily essentials in one premium market.',
  },
  {
    image: assets.onboarding2,
    title: 'Fast delivery',
    subtitle: 'Choose your basket and get it delivered across Ramallah in minutes.',
  },
  {
    image: assets.onboarding3,
    title: 'Easy tracking',
    subtitle: 'Follow every step from preparation to arrival with a live-style demo flow.',
  },
];

export default function OnboardingScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);
  const [index, setIndex] = useState(0);

  const finish = async () => {
    await AsyncStorage.setItem('lomi:onboarded', '1');
    navigation.replace('Auth');
  };

  const next = () => {
    if (index === slides.length - 1) {
      finish();
      return;
    }
    const nextIndex = index + 1;
    listRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    setIndex(nextIndex);
  };

  return (
    <SafeAreaView edges={['top']} style={globalStyles.screen}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>LOMI MARKET</Text>
        <TouchableOpacity activeOpacity={activeOpacity} onPress={finish}>
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.title}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.imageCard, shadow]}>
              <Image source={item.image} style={styles.image} resizeMode="cover" />
            </View>
            <View style={styles.copy}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.subtitle}</Text>
            </View>
          </View>
        )}
      />

      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 18) + 8 }]}>
        <View style={styles.dots}>
          {slides.map((slide, dotIndex) => (
            <View
              key={slide.title}
              style={[styles.dot, dotIndex === index ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>
        <TouchableOpacity activeOpacity={activeOpacity} style={styles.button} onPress={next}>
          <Text style={styles.buttonText}>
            {index === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons name="arrow-forward" size={21} color={colors.dark} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: 68,
    paddingHorizontal: spacing.screen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    ...globalStyles.brandText,
    fontSize: 25,
  },
  skip: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '800',
  },
  slide: {
    alignItems: 'center',
    paddingTop: 10,
  },
  imageCard: {
    width: '88%',
    height: 365,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  copy: {
    paddingHorizontal: 28,
    paddingTop: 34,
    alignItems: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 38,
    lineHeight: 43,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 14,
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.screen,
    backgroundColor: colors.dark,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 22,
  },
  dot: {
    height: 6,
    borderRadius: 999,
  },
  dotActive: {
    width: 48,
    backgroundColor: colors.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: colors.surface3,
  },
  button: {
    height: 58,
    borderRadius: spacing.pill,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: {
    color: colors.dark,
    fontSize: 18,
    fontWeight: '900',
  },
});
