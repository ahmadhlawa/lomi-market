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
import { activeOpacity, assets, colors, globalStyles, shadow } from '../theme';

const slides = [
  {
    image: assets.onboarding1,
    titleEn: 'Fresh groceries\ndelivered fast',
    titleAr: 'خضروات طازجة تصلك بسرعة',
  },
  {
    image: assets.onboarding2,
    titleEn: 'Track your order\nin real time',
    titleAr: 'تتبع طلبك في الوقت الفعلي',
  },
  {
    image: assets.onboarding3,
    titleEn: 'Exclusive deals\nevery day',
    titleAr: 'عروض حصرية كل يوم',
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
        horizontal
        pagingEnabled
        bounces={false}
        data={slides}
        keyExtractor={(item) => item.titleEn}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setIndex(nextIndex);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <View style={[styles.imageCard, shadow]}>
              <Image source={item.image} style={styles.slideImage} resizeMode="cover" />
            </View>
            <View style={styles.copy}>
              <Text style={styles.slideTitle}>{item.titleEn}</Text>
              <Text style={styles.slideTitleAr}>{item.titleAr}</Text>
            </View>
          </View>
        )}
      />

      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 18) + 6 }]}>
        <View style={styles.dots}>
          {slides.map((slide, dotIndex) => (
            <View
              key={slide.titleEn}
              style={[styles.dot, dotIndex === index ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>
        <TouchableOpacity activeOpacity={activeOpacity} style={styles.button} onPress={next}>
          <Text style={styles.buttonText}>Get Started</Text>
          <Text style={styles.buttonTextAr}>ابدأ الآن</Text>
          <Ionicons name="arrow-forward" size={22} color={colors.dark} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: 72,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 0,
  },
  skip: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
  },
  slide: {
    alignItems: 'center',
    paddingTop: 12,
  },
  imageCard: {
    width: '86%',
    height: 360,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  copy: {
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: 'center',
  },
  slideTitle: {
    color: colors.textPrimary,
    fontSize: 38,
    lineHeight: 46,
    fontWeight: '900',
    textAlign: 'center',
  },
  slideTitleAr: {
    color: colors.textSecondary,
    fontSize: 19,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 14,
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    backgroundColor: colors.dark,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    height: 6,
    borderRadius: 999,
  },
  dotActive: {
    width: 58,
    backgroundColor: colors.primary,
  },
  dotInactive: {
    width: 8,
    backgroundColor: colors.surface,
  },
  button: {
    width: '100%',
    height: 58,
    borderRadius: 50,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  buttonText: {
    color: colors.dark,
    fontSize: 20,
    fontWeight: '800',
  },
  buttonTextAr: {
    color: colors.dark,
    fontSize: 18,
    fontWeight: '400',
  },
});
