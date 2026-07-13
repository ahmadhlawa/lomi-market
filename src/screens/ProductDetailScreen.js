import React, { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { activeOpacity, colors, formatCurrency, globalStyles, spacing } from '../theme';
import { useProducts } from '../hooks/useCatalog';

function RatingStars({ rating }) {
  return (
    <View style={styles.ratingStars}>
      {Array.from({ length: 5 }).map((_, index) => {
        const icon = rating >= index + 1 ? 'star' : rating > index ? 'star-half' : 'star-outline';
        return <Ionicons key={index} name={icon} size={17} color={colors.primary} />;
      })}
    </View>
  );
}

function RelatedCard({ item, onPress, onAdd }) {
  return (
    <TouchableOpacity activeOpacity={activeOpacity} style={styles.relatedCard} onPress={onPress}>
      <Image source={{ uri: item.image }} style={styles.relatedImage} />
      <Text style={styles.relatedName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.relatedMeta}>{item.unit}</Text>
      <Text style={styles.relatedPrice}>{formatCurrency(item.price)}</Text>
      <TouchableOpacity activeOpacity={activeOpacity} style={styles.relatedAdd} onPress={onAdd}>
        <Ionicons name="add" size={16} color={colors.dark} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function ProductDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const product = route.params?.product;
  const { count, addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const relatedQuery = useProducts({ categoryId: product?.categoryId || 'all', pageSize: 8 });
  const hasDiscount = product?.oldPrice && product.oldPrice > product.price;

  const related = useMemo(
    () => (relatedQuery.data?.items || []).filter((item) => item.id !== product?.id).slice(0, 6),
    [product?.id, relatedQuery.data]
  );

  if (!product) {
    return <SafeAreaView style={[globalStyles.screen, styles.missing]}><Text style={styles.descriptionTitle}>Product unavailable</Text><TouchableOpacity style={styles.addToCartButton} onPress={() => navigation.goBack()}><Text style={styles.addToCartText}>Go back</Text></TouchableOpacity></SafeAreaView>;
  }

  const addToCart = () => {
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <SafeAreaView edges={['top']} style={globalStyles.screen}>
      <View style={[styles.header, { top: insets.top + 8 }]}>
        <TouchableOpacity activeOpacity={activeOpacity} style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={21} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={activeOpacity} style={styles.headerButton} onPress={() => navigation.navigate('Cart')}>
          <Ionicons name="cart-outline" size={22} color={colors.primary} />
          {count > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{count}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {added && (
        <View style={[styles.toast, { top: insets.top + 58 }]}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={styles.toastText}>Added to cart</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: 132 + insets.bottom }]}
      >
        <View style={styles.hero}>
          <Image source={{ uri: product.image }} style={styles.heroImage} />
          <LinearGradient
            colors={['transparent', 'rgba(17,17,17,0.72)', colors.dark]}
            style={styles.heroGradient}
          />
          {hasDiscount && (
            <View style={styles.heroDiscount}>
              <Text style={styles.heroDiscountText}>{product.discountPercentage}% off</Text>
            </View>
          )}
        </View>

        <View style={styles.body}>
          <Text style={styles.category}>{product.categoryName}</Text>
          <Text style={styles.nameEn}>{product.name}</Text>
          <Text style={styles.nameAr}>{product.nameAr}</Text>

          <View style={styles.priceLine}>
            <Text style={styles.price}>{formatCurrency(product.price)}</Text>
            {hasDiscount && <Text style={styles.oldPrice}>{formatCurrency(product.oldPrice)}</Text>}
            <Text style={styles.unit}>/ {product.unit}</Text>
          </View>

          <View style={styles.ratingRow}>
            <RatingStars rating={product.rating} />
            <Text style={styles.reviews}>{product.rating} • {product.reviews} reviews</Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoPill}>
              <Ionicons name={product.inStock ? 'checkmark-circle' : 'close-circle'} size={17} color={product.inStock ? colors.success : colors.error} />
              <Text style={styles.infoText}>{product.inStock ? `${product.stock} in stock` : 'Out of stock'}</Text>
            </View>
            <View style={styles.infoPill}>
              <Ionicons name="bicycle-outline" size={17} color={colors.primary} />
              <Text style={styles.infoText}>{product.deliveryTag}</Text>
            </View>
            <View style={styles.infoPill}>
              <Ionicons name="sparkles-outline" size={17} color={colors.primary} />
              <Text style={styles.infoText}>{product.freshnessTag}</Text>
            </View>
          </View>

          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionTitle}>Product details</Text>
            <Text style={styles.descriptionEn}>{product.description}</Text>
            <Text style={styles.descriptionAr}>{product.descriptionAr}</Text>
          </View>

          {!!related.length && (
            <>
              <Text style={styles.relatedTitle}>Related products</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedScroll}>
                {related.map((item) => (
                  <RelatedCard
                    key={item.id}
                    item={item}
                    onPress={() => navigation.push('ProductDetail', { product: item })}
                    onAdd={() => addItem(item)}
                  />
                ))}
              </ScrollView>
            </>
          )}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.qtySelector}>
          <TouchableOpacity
            activeOpacity={activeOpacity}
            style={styles.qtyButton}
            onPress={() => setQuantity((value) => Math.max(1, value - 1))}
          >
            <Ionicons name="remove" size={18} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.qtyNumber}>{quantity}</Text>
          <TouchableOpacity
            activeOpacity={activeOpacity}
            style={styles.qtyButton}
            onPress={() => setQuantity((value) => value + 1)}
          >
            <Ionicons name="add" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          activeOpacity={activeOpacity}
          disabled={!product.inStock}
          style={[styles.addToCartButton, !product.inStock && styles.disabledButton]}
          onPress={addToCart}
        >
          <Ionicons name="cart" size={20} color={colors.dark} />
          <Text style={styles.addToCartText}>{product.inStock ? 'Add to cart' : 'Out of stock'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  missing: { alignItems: 'center', justifyContent: 'center', padding: spacing.screen, gap: 16 },
  header: {
    position: 'absolute',
    zIndex: 10,
    left: spacing.screen,
    right: spacing.screen,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.overlay,
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
  headerBadgeText: { color: colors.dark, fontSize: 9, fontWeight: '900' },
  toast: {
    position: 'absolute',
    zIndex: 11,
    alignSelf: 'center',
    height: 38,
    borderRadius: 19,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  toastText: { color: colors.textPrimary, fontSize: 13, fontWeight: '800' },
  content: { backgroundColor: colors.dark },
  hero: { height: 330, backgroundColor: colors.surface },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 150 },
  heroDiscount: {
    position: 'absolute',
    left: spacing.screen,
    bottom: 28,
    backgroundColor: colors.error,
    borderRadius: spacing.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroDiscountText: { color: colors.white, fontSize: 12, fontWeight: '900' },
  body: { paddingHorizontal: spacing.screen, paddingTop: 12 },
  category: { color: colors.primary, fontSize: 13, fontWeight: '900', marginBottom: 6 },
  nameEn: { color: colors.textPrimary, fontSize: 31, lineHeight: 37, fontWeight: '900' },
  nameAr: {
    color: colors.textSecondary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  priceLine: { marginTop: 18, flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' },
  price: { color: colors.primary, fontSize: 32, fontWeight: '900' },
  oldPrice: { color: colors.textMuted, fontSize: 16, textDecorationLine: 'line-through' },
  unit: { color: colors.textSecondary, fontSize: 16, fontWeight: '800' },
  ratingRow: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  ratingStars: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  reviews: { color: colors.textSecondary, fontSize: 13, fontWeight: '700' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 },
  infoPill: {
    borderRadius: spacing.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  descriptionCard: {
    marginTop: 24,
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 12,
  },
  descriptionTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  descriptionEn: { color: colors.textPrimary, fontSize: 15, lineHeight: 23 },
  descriptionAr: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  relatedTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '900', marginTop: 28 },
  relatedScroll: { gap: 14, paddingTop: 14, paddingRight: spacing.screen },
  relatedCard: {
    width: 132,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  relatedImage: { width: '100%', height: 102, borderRadius: 14, backgroundColor: colors.surface2 },
  relatedName: { color: colors.textPrimary, fontSize: 13, fontWeight: '900', marginTop: 8 },
  relatedMeta: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  relatedPrice: { color: colors.primary, fontSize: 14, fontWeight: '900', marginTop: 6 },
  relatedAdd: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.dark,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
    paddingHorizontal: spacing.screen,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  qtySelector: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: spacing.pill,
    paddingHorizontal: 8,
    gap: 8,
  },
  qtyButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyNumber: { color: colors.white, fontSize: 18, fontWeight: '900', minWidth: 24, textAlign: 'center' },
  addToCartButton: {
    flex: 1,
    height: 56,
    borderRadius: spacing.pill,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  disabledButton: { opacity: 0.45 },
  addToCartText: { color: colors.dark, fontSize: 17, fontWeight: '900' },
});
