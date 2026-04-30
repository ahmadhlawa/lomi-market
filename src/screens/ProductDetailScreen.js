import React, { useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { products } from '../data/mockData';
import { useCart } from '../context/CartContext';
import { activeOpacity, colors, formatPrice, globalStyles, spacing } from '../theme';

function RatingStars({ rating }) {
  return (
    <View style={styles.ratingStars}>
      {Array.from({ length: 5 }).map((_, index) => {
        const icon = rating >= index + 1 ? 'star' : rating > index ? 'star-half' : 'star-outline';
        return <Ionicons key={index} name={icon} size={18} color={colors.primary} />;
      })}
    </View>
  );
}

function RelatedCard({ item, onPress, onAdd }) {
  return (
    <TouchableOpacity activeOpacity={activeOpacity} style={styles.relatedCard} onPress={onPress}>
      <View style={styles.relatedImageWrap}>
        <Image source={{ uri: item.image }} style={styles.relatedImage} />
        <TouchableOpacity activeOpacity={activeOpacity} style={styles.relatedAdd} onPress={onAdd}>
          <Ionicons name="add" size={14} color={colors.white} />
        </TouchableOpacity>
      </View>
      <Text style={styles.relatedNameAr} numberOfLines={1}>
        {item.nameAr}
      </Text>
      <Text style={styles.relatedName} numberOfLines={1}>
        {item.nameEn}
      </Text>
      <Text style={styles.relatedPrice}>{formatPrice(item.price)} ₪</Text>
    </TouchableOpacity>
  );
}

export default function ProductDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const product = route.params?.product || products[0];
  const { count, addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const related = useMemo(
    () => products.filter((item) => item.id !== product.id).slice(0, 4),
    [product.id]
  );

  const increase = () => setQuantity((value) => value + 1);
  const decrease = () => setQuantity((value) => Math.max(1, value - 1));

  return (
    <SafeAreaView edges={['top']} style={globalStyles.screen}>
      <View style={[styles.header, { top: insets.top + 8 }]}>
        <TouchableOpacity
          activeOpacity={activeOpacity}
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={21} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={activeOpacity}
          style={styles.headerButton}
          onPress={() => navigation.navigate('Cart')}
        >
          <Ionicons name="cart-outline" size={22} color={colors.primary} />
          {count > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{count}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: 140 + insets.bottom }]}
      >
        <View style={styles.hero}>
          <Image source={{ uri: product.image }} style={styles.heroImage} />
          <LinearGradient
            colors={['transparent', 'rgba(17,17,17,0.75)', colors.dark]}
            style={styles.heroGradient}
          />
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={styles.titleText}>
              <Text style={styles.nameAr}>{product.nameAr}</Text>
              <Text style={styles.nameEn}>{product.nameEn}</Text>
            </View>
            <TouchableOpacity activeOpacity={activeOpacity} style={styles.heartButton}>
              <Ionicons name="heart" size={23} color={colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.priceLine}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            <Text style={styles.currency}>₪</Text>
            <Text style={styles.unit}>/ {product.unit}</Text>
          </View>

          <View style={styles.ratingRow}>
            <RatingStars rating={product.rating} />
            <Text style={styles.reviews}>({product.reviews} reviews)</Text>
          </View>

          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionAr}>{product.descAr}</Text>
            <View style={styles.descriptionDivider} />
            <Text style={styles.descriptionEn}>{product.descEn}</Text>
          </View>

          <Text style={styles.relatedTitle}>You might also like</Text>
          <ScrollView
            horizontal
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.relatedScroll}
          >
            {related.map((item) => (
              <RelatedCard
                key={item.id}
                item={item}
                onPress={() => navigation.push('ProductDetail', { product: item })}
                onAdd={() => addItem(item)}
              />
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.qtySelector}>
          <TouchableOpacity activeOpacity={activeOpacity} style={styles.qtyButton} onPress={decrease}>
            <Text style={styles.qtyText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyNumber}>{quantity}</Text>
          <TouchableOpacity activeOpacity={activeOpacity} style={styles.qtyButton} onPress={increase}>
            <Text style={styles.qtyText}>+</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          activeOpacity={activeOpacity}
          style={styles.addToCartButton}
          onPress={() => addItem(product, quantity)}
        >
          <Ionicons name="cart" size={20} color={colors.dark} />
          <Text style={styles.addToCartText}>Add{'\n'}to{'\n'}Cart</Text>
          <View style={styles.addSeparator} />
          <Text style={styles.addToCartTextAr}>أضف{'\n'}للسلة</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    zIndex: 10,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  headerBadgeText: {
    color: colors.dark,
    fontSize: 9,
    fontWeight: '900',
  },
  content: {
    backgroundColor: colors.dark,
  },
  hero: {
    height: 320,
    backgroundColor: colors.surface,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 150,
  },
  body: {
    paddingHorizontal: spacing.screen,
    paddingTop: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },
  titleText: {
    flex: 1,
  },
  nameAr: {
    color: colors.textPrimary,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 42,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  nameEn: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 4,
  },
  heartButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  priceLine: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  price: {
    color: colors.primary,
    fontSize: 34,
    fontWeight: '900',
  },
  currency: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '800',
  },
  unit: {
    color: colors.textSecondary,
    fontSize: 17,
    fontWeight: '700',
  },
  ratingRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reviews: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  descriptionCard: {
    marginTop: 28,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 22,
  },
  descriptionAr: {
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 28,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  descriptionDivider: {
    height: 1,
    backgroundColor: colors.surface2,
    marginVertical: 18,
  },
  descriptionEn: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 24,
  },
  relatedTitle: {
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: '800',
    marginTop: 28,
  },
  relatedScroll: {
    gap: 16,
    paddingTop: 14,
    paddingRight: 20,
  },
  relatedCard: {
    width: 132,
    borderRadius: 20,
    backgroundColor: colors.surface,
    padding: 12,
  },
  relatedImageWrap: {
    width: '100%',
    height: 108,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface2,
  },
  relatedImage: {
    width: '100%',
    height: '100%',
  },
  relatedAdd: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatedNameAr: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
    textAlign: 'right',
  },
  relatedName: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  relatedPrice: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.dark,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
    paddingTop: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  qtySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#050505',
    borderRadius: spacing.pill,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 10,
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#050505',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    color: colors.white,
    fontSize: 22,
    lineHeight: 23,
    fontWeight: '700',
  },
  qtyNumber: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
    minWidth: 24,
    textAlign: 'center',
  },
  addToCartButton: {
    flex: 1,
    minHeight: 64,
    borderRadius: 50,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  addToCartText: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 20,
    textAlign: 'center',
  },
  addSeparator: {
    width: 1,
    height: 42,
    backgroundColor: 'rgba(0,0,0,0.24)',
  },
  addToCartTextAr: {
    color: colors.dark,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'center',
  },
});
