import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { categories, products } from '../data/mockData';
import { useCart } from '../context/CartContext';
import {
  activeOpacity,
  colors,
  formatPrice,
  globalStyles,
  shadow,
  spacing,
} from '../theme';

const bannerImage =
  'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=1000&q=85';

function SkeletonBlock({ style }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.skeleton, style, { opacity }]} />;
}

function CartHeaderButton({ count, onPress }) {
  return (
    <TouchableOpacity activeOpacity={activeOpacity} style={styles.iconButton} onPress={onPress}>
      <Ionicons name="cart" size={25} color={colors.primary} />
      {count > 0 && (
        <View style={styles.cartBadge}>
          <Text style={styles.cartBadgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function CategoryItem({ item }) {
  return (
    <TouchableOpacity activeOpacity={activeOpacity} style={styles.categoryItem}>
      <View style={styles.categoryCircle}>
        <Ionicons name={item.icon} size={25} color={colors.primary} />
      </View>
      <Text style={styles.categoryLabel}>{item.en}</Text>
      <Text style={styles.categoryLabelAr}>{item.ar}</Text>
    </TouchableOpacity>
  );
}

function SectionHeader({ title, titleAr, showTimer }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleWrap}>
        {showTimer && (
          <View style={styles.flashIcon}>
            <Ionicons name="flash" size={18} color={colors.dark} />
          </View>
        )}
        <View>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionTitleAr}>{titleAr}</Text>
        </View>
      </View>
      {showTimer ? (
        <View style={styles.timerWrap}>
          <Text style={styles.timerLabel}>Ends in:</Text>
          <Text style={styles.timer}>02 : 45 : 12</Text>
        </View>
      ) : (
        <TouchableOpacity activeOpacity={activeOpacity}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function ProductCard({ product, onOpen, onAdd, showRating = false }) {
  const stars = Array.from({ length: 5 }).map((_, index) => {
    if (product.rating >= index + 1) return 'star';
    if (product.rating > index) return 'star-half';
    return 'star-outline';
  });

  return (
    <TouchableOpacity activeOpacity={activeOpacity} style={styles.productCard} onPress={onOpen}>
      <View style={styles.productImageWrap}>
        <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="cover" />
        {product.discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{product.discount}%</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.nameEn}
        </Text>
        <Text style={styles.productNameAr} numberOfLines={1}>
          {product.nameAr}
        </Text>
        {showRating ? (
          <View style={styles.cardRatingRow}>
            {stars.map((star, index) => (
              <Ionicons key={`${star}-${index}`} name={star} size={11} color={colors.primary} />
            ))}
            <Text style={styles.cardRatingText}>{product.rating}</Text>
          </View>
        ) : (
          <Text style={styles.productSub} numberOfLines={1}>
            {product.unit === 'kg' ? '1 kg' : `1 ${product.unit}`} • Farm fresh
          </Text>
        )}
        <View style={styles.priceRow}>
          <View>
            {product.originalPrice > product.price && (
              <Text style={styles.oldPrice}>{formatPrice(product.originalPrice)} ₪</Text>
            )}
            <Text style={styles.newPrice}>{formatPrice(product.price)} ₪</Text>
          </View>
          <TouchableOpacity activeOpacity={activeOpacity} style={styles.addCircle} onPress={onAdd}>
            <Ionicons name="cart-outline" size={16} color={colors.dark} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen({ navigation }) {
  const { count, addItem } = useCart();
  const [loading, setLoading] = useState(true);
  const flashDeals = products.filter((product) => product.isFlashDeal);
  const bestSellers = products.filter((product) => product.isBestSeller);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(timer);
  }, []);

  const openProduct = (product) => navigation.navigate('ProductDetail', { product });

  return (
    <SafeAreaView edges={['top']} style={globalStyles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <View>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={16} color={colors.primary} />
                <Text style={styles.locationKicker}>DELIVER TO • توصيل إلى</Text>
              </View>
              <Text style={styles.location}>Ramallah, PS</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity activeOpacity={activeOpacity} style={styles.iconButton}>
                <Ionicons name="notifications-outline" size={25} color={colors.textSecondary} />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
              <CartHeaderButton count={count} onPress={() => navigation.navigate('Cart')} />
            </View>
          </View>

          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#555555" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search fresh groceries... • بقالة الطازجة..."
              placeholderTextColor="#444"
            />
            <Ionicons name="mic-outline" size={21} color={colors.primary} />
          </View>

          <TouchableOpacity activeOpacity={activeOpacity} style={[styles.banner, shadow]}>
            <LinearGradient
              colors={[colors.primary, '#f0a500']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Image source={{ uri: bannerImage }} style={styles.bannerImage} resizeMode="cover" />
            <LinearGradient
              colors={['rgba(253,202,0,0.98)', 'rgba(253,202,0,0.74)', 'rgba(253,202,0,0.1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.bannerCopy}>
              <Text style={styles.bannerKicker}>WEEKEND SPECIAL • عرض نهاية الأسبوع</Text>
              <Text style={styles.bannerTitle}>50% Off</Text>
              <Text style={styles.bannerTitle}>Fresh Fruits</Text>
              <View style={styles.shopButton}>
                <Text style={styles.shopButtonText}>Shop Now</Text>
                <Ionicons name="arrow-forward" size={15} color={colors.white} />
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.bannerDots}>
            <View style={styles.bannerDotActive} />
            <View style={styles.bannerDot} />
            <View style={styles.bannerDot} />
          </View>

          <View style={styles.categoriesHeader}>
            <View style={styles.categoryTitleInline}>
              <Text style={styles.categoriesTitle}>Categories</Text>
              <Text style={styles.categoriesTitleAr}>الفئات</Text>
            </View>
            <TouchableOpacity activeOpacity={activeOpacity}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categories.map((item) => (
              <CategoryItem key={item.id} item={item} />
            ))}
          </ScrollView>

          <View style={styles.dealPanel}>
            <SectionHeader title="Flash Deals" titleAr="عروض سريعة" showTimer />
            {loading ? (
              <View style={styles.skeletonRow}>
                <SkeletonBlock style={styles.skeletonCard} />
                <SkeletonBlock style={styles.skeletonCard} />
              </View>
            ) : (
              <ScrollView
                horizontal
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.productScroll}
              >
                {flashDeals.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onOpen={() => openProduct(product)}
                    onAdd={() => addItem(product)}
                  />
                ))}
              </ScrollView>
            )}
          </View>

          <View style={styles.bestSection}>
            <SectionHeader title="Best Sellers 🔥" titleAr="الأكثر مبيعاً" />
            <ScrollView
              horizontal
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productScroll}
            >
              {bestSellers.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  showRating
                  onOpen={() => openProduct(product)}
                  onAdd={() => addItem(product)}
                />
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  content: {
    paddingBottom: 110,
  },
  header: {
    paddingHorizontal: spacing.screen,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationKicker: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  location: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 3,
    marginLeft: 22,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 3,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  cartBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: colors.dark,
    fontSize: 10,
    fontWeight: '900',
  },
  searchBar: {
    height: 50,
    backgroundColor: colors.surface,
    borderRadius: spacing.pill,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 18,
    marginHorizontal: spacing.screen,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  banner: {
    height: 130,
    marginHorizontal: spacing.screen,
    marginTop: 18,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.primary,
  },
  bannerImage: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '68%',
    opacity: 0.78,
  },
  bannerCopy: {
    padding: 16,
    width: '65%',
  },
  bannerKicker: {
    color: 'rgba(0,0,0,0.62)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bannerTitle: {
    color: colors.dark,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '900',
  },
  shopButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: colors.dark,
    borderRadius: spacing.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shopButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
  },
  bannerDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    marginTop: 9,
  },
  bannerDotActive: {
    width: 20,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  bannerDot: {
    width: 4,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.surface3,
  },
  categoriesHeader: {
    paddingHorizontal: spacing.screen,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryTitleInline: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  categoriesTitle: {
    color: colors.textPrimary,
    fontSize: 21,
    fontWeight: '800',
  },
  categoriesTitleAr: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  seeAll: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  categoryScroll: {
    paddingLeft: spacing.screen,
    paddingRight: spacing.screen,
    gap: 16,
    paddingTop: 14,
  },
  categoryItem: {
    width: 72,
    alignItems: 'center',
  },
  categoryCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  categoryLabelAr: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  dealPanel: {
    marginTop: 34,
    paddingTop: 24,
    paddingBottom: 24,
    borderTopLeftRadius: 42,
    borderTopRightRadius: 42,
    backgroundColor: '#131313',
  },
  bestSection: {
    marginTop: 8,
  },
  sectionHeader: {
    paddingHorizontal: spacing.screen,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flashIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  sectionTitleAr: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 3,
  },
  timerWrap: {
    alignItems: 'flex-end',
  },
  timerLabel: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  timer: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  productScroll: {
    paddingLeft: spacing.screen,
    paddingRight: spacing.screen,
    paddingTop: 14,
    gap: 12,
  },
  productCard: {
    width: 160,
    backgroundColor: colors.surface,
    borderRadius: 18,
    overflow: 'hidden',
  },
  productImageWrap: {
    height: 140,
    backgroundColor: colors.surface2,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: colors.error,
    borderRadius: 50,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  discountText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '800',
  },
  productNameAr: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  productSub: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 6,
  },
  cardRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    marginTop: 6,
  },
  cardRatingText: {
    color: colors.textMuted,
    fontSize: 11,
    marginLeft: 4,
  },
  priceRow: {
    marginTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  oldPrice: {
    color: '#555555',
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  newPrice: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  addCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skeleton: {
    backgroundColor: colors.surface2,
    borderRadius: 18,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: 12,
    paddingLeft: spacing.screen,
    paddingTop: 14,
  },
  skeletonCard: {
    width: 160,
    height: 245,
  },
});
