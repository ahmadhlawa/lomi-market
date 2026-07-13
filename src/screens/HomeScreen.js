import React, { useMemo, useState } from 'react';
import {
  Image,
  ActivityIndicator,
  RefreshControl,
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
import { useCart } from '../context/CartContext';
import { activeOpacity, colors, formatCurrency, globalStyles, shadow, spacing } from '../theme';
import { useCategories, useProducts } from '../hooks/useCatalog';
import { useLanguage } from '../context/LanguageContext';

const bannerImage =
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=85';

function matchesSearch(product, query) {
  const lower = query.trim().toLowerCase();
  if (!lower) return true;
  return [
    product.name,
    product.nameAr,
    product.categoryName,
    product.categoryNameAr,
    product.description,
    product.descriptionAr,
    product.freshnessTag,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(lower));
}

function CartHeaderButton({ count, onPress }) {
  return (
    <TouchableOpacity activeOpacity={activeOpacity} style={styles.iconButton} onPress={onPress}>
      <Ionicons name="cart-outline" size={25} color={colors.primary} />
      {count > 0 && (
        <View style={styles.cartBadge}>
          <Text style={styles.cartBadgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function CategoryItem({ item, selected, onPress }) {
  return (
    <TouchableOpacity activeOpacity={activeOpacity} style={styles.categoryItem} onPress={onPress}>
      <View style={[styles.categoryCircle, selected && styles.categoryCircleActive]}>
        <Ionicons name={item.icon} size={22} color={selected ? colors.dark : colors.primary} />
      </View>
      <Text style={[styles.categoryLabel, selected && styles.categoryLabelActive]}>{item.en}</Text>
    </TouchableOpacity>
  );
}

function ProductCard({ product, onOpen, onAdd }) {
  const hasDiscount = product.oldPrice && product.oldPrice > product.price;

  return (
    <TouchableOpacity activeOpacity={activeOpacity} style={styles.productCard} onPress={onOpen}>
      <View style={styles.productImageWrap}>
        <Image source={{ uri: product.image }} style={styles.productImage} resizeMode="cover" />
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{product.discountPercentage}%</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.productNameAr} numberOfLines={1}>{product.nameAr}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="star" size={12} color={colors.primary} />
          <Text style={styles.metaText}>{product.rating}</Text>
          <Text style={styles.metaDot}>•</Text>
          <Text style={styles.metaText}>{product.unit}</Text>
        </View>
        <View style={styles.priceRow}>
          <View>
            {hasDiscount && <Text style={styles.oldPrice}>{formatCurrency(product.oldPrice)}</Text>}
            <Text style={styles.newPrice}>{formatCurrency(product.price)}</Text>
          </View>
          <TouchableOpacity activeOpacity={activeOpacity} style={styles.addCircle} onPress={onAdd}>
            <Ionicons name="add" size={19} color={colors.dark} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

function ProductSection({ title, subtitle, data, onOpen, onAdd }) {
  if (!data.length) return null;
  return (
    <View style={styles.section}>
      <SectionHeader title={title} subtitle={subtitle} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productScroll}>
        {data.slice(0, 10).map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onOpen={() => onOpen(product)}
            onAdd={() => onAdd(product)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const { count, addItem } = useCart();
  const { language, t } = useLanguage();
  const categoriesQuery = useCategories();
  const productsQuery = useProducts({ pageSize: 100 });
  const categories = categoriesQuery.data || [];
  const products = productsQuery.data?.items || [];
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [query, setQuery] = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const inCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
      return inCategory && matchesSearch(product, query);
    });
  }, [query, selectedCategory]);

  const flashDeals = useMemo(() => products.filter((product) => product.isFlashDeal), []);
  const bestSellers = useMemo(() => products.filter((product) => product.isBestSeller), []);
  const featured = useMemo(() => products.filter((product) => product.isFeatured), []);
  const offers = useMemo(
    () => products.filter((product) => product.oldPrice || product.discountPercentage > 0),
    []
  );
  const openProduct = (product) => navigation.navigate('ProductDetail', { product });
  const visibleCategories = categories;
  const selectedLabel = visibleCategories.find((category) => category.id === selectedCategory)?.[language === 'ar' ? 'ar' : 'en'] || 'All';

  if ((categoriesQuery.isLoading || productsQuery.isLoading) && !products.length) {
    return <SafeAreaView style={[globalStyles.screen, styles.loading]}><ActivityIndicator color={colors.primary} size="large" /><Text style={styles.loadingText}>{t('common.loading')}</Text></SafeAreaView>;
  }
  if (productsQuery.isError && !products.length) {
    return <SafeAreaView style={[globalStyles.screen, styles.loading]}><Ionicons name="cloud-offline-outline" color={colors.error} size={44} /><Text style={styles.loadingText}>{productsQuery.error.message}</Text><TouchableOpacity style={styles.shopButton} onPress={() => productsQuery.refetch()}><Text style={styles.shopButtonText}>{t('common.retry')}</Text></TouchableOpacity></SafeAreaView>;
  }

  return (
    <SafeAreaView edges={['top']} style={globalStyles.screen}>
      <ScrollView refreshControl={<RefreshControl tintColor={colors.primary} refreshing={productsQuery.isRefetching} onRefresh={() => { categoriesQuery.refetch(); productsQuery.refetch(); }} />} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color={colors.primary} />
              <Text style={styles.locationKicker}>{t('home.deliverTo')}</Text>
            </View>
            <Text style={styles.location}>{t('home.location')}</Text>
          </View>
          <View style={styles.headerActions}>
            <CartHeaderButton count={count} onPress={() => navigation.navigate('Cart')} />
          </View>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            placeholder={t('home.search')}
            placeholderTextColor={colors.textMuted}
          />
          {!!query && (
            <TouchableOpacity activeOpacity={activeOpacity} onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={19} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity activeOpacity={activeOpacity} style={[styles.banner, shadow]} onPress={() => navigation.getParent()?.navigate('Explore')}>
          <Image source={{ uri: bannerImage }} style={styles.bannerImage} resizeMode="cover" />
          <LinearGradient
            colors={['rgba(253,202,0,0.98)', 'rgba(253,202,0,0.78)', 'rgba(253,202,0,0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.bannerCopy}>
            <Text style={styles.bannerKicker}>LOMI10 DEMO OFFER</Text>
            <Text style={styles.bannerTitle}>Save 10%</Text>
            <Text style={styles.bannerSub}>plus free delivery over 99 ₪</Text>
            <View style={styles.shopButton}>
              <Text style={styles.shopButtonText}>Build your basket</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.white} />
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.categoriesHeader}>
          <Text style={styles.categoriesTitle}>{t('home.categories')}</Text>
          <Text style={styles.seeAll}>{filteredProducts.length} items</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {visibleCategories.map((item) => (
            <CategoryItem
              key={item.id}
              item={item}
              selected={item.id === selectedCategory}
              onPress={() => setSelectedCategory(item.id)}
            />
          ))}
        </ScrollView>

        <ProductSection
          title={selectedCategory === 'all' && !query ? t('home.recommended') : selectedLabel}
          subtitle={query ? `Search results for "${query}"` : 'Filtered from the live demo catalog'}
          data={filteredProducts}
          onOpen={openProduct}
          onAdd={addItem}
        />

        <ProductSection title={t('home.deals')} subtitle="Limited-time grocery offers" data={flashDeals} onOpen={openProduct} onAdd={addItem} />
        <ProductSection title={t('home.best')} subtitle="Customer favorites this week" data={bestSellers} onOpen={openProduct} onAdd={addItem} />
        <ProductSection title={t('home.featured')} subtitle="Fresh baskets selected by Lomi Market" data={featured} onOpen={openProduct} onAdd={addItem} />
        <ProductSection title={t('home.deals')} subtitle="Discounted essentials and pantry deals" data={offers} onOpen={openProduct} onAdd={addItem} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loading: { alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: colors.textSecondary, marginTop: 12, fontWeight: '700' },
  content: { paddingBottom: 110 },
  header: {
    paddingHorizontal: spacing.screen,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationKicker: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  location: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
    marginLeft: 22,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: { color: colors.dark, fontSize: 10, fontWeight: '900' },
  searchBar: {
    height: 54,
    backgroundColor: colors.surface,
    borderRadius: spacing.pill,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 18,
    marginHorizontal: spacing.screen,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  banner: {
    height: 148,
    marginHorizontal: spacing.screen,
    marginTop: 18,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.primary,
  },
  bannerImage: { position: 'absolute', right: 0, width: '70%', height: '100%', opacity: 0.76 },
  bannerCopy: { padding: 18, width: '72%' },
  bannerKicker: { color: 'rgba(0,0,0,0.62)', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  bannerTitle: { color: colors.dark, fontSize: 32, lineHeight: 36, fontWeight: '900', marginTop: 4 },
  bannerSub: { color: 'rgba(0,0,0,0.72)', fontSize: 14, fontWeight: '800' },
  shopButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    backgroundColor: colors.dark,
    borderRadius: spacing.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shopButtonText: { color: colors.white, fontSize: 12, fontWeight: '900' },
  categoriesHeader: {
    paddingHorizontal: spacing.screen,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoriesTitle: { color: colors.textPrimary, fontSize: 21, fontWeight: '900' },
  seeAll: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  categoryScroll: { paddingLeft: spacing.screen, paddingRight: spacing.screen, gap: 14, paddingTop: 14 },
  categoryItem: { width: 82, alignItems: 'center' },
  categoryCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCircleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8,
    textAlign: 'center',
  },
  categoryLabelActive: { color: colors.primary },
  section: { marginTop: 30 },
  sectionHeader: {
    paddingHorizontal: spacing.screen,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '900' },
  sectionSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  productScroll: { paddingLeft: spacing.screen, paddingRight: spacing.screen, paddingTop: 14, gap: 12 },
  productCard: {
    width: 162,
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  productImageWrap: { height: 138, backgroundColor: colors.surface2 },
  productImage: { width: '100%', height: '100%' },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: colors.error,
    borderRadius: 50,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountText: { color: colors.white, fontSize: 11, fontWeight: '900' },
  productInfo: { padding: 12 },
  productName: { color: colors.textPrimary, fontSize: 15, lineHeight: 19, fontWeight: '900' },
  productNameAr: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 7 },
  metaText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  metaDot: { color: colors.surface3, fontSize: 12 },
  priceRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  oldPrice: { color: colors.textMuted, fontSize: 11, textDecorationLine: 'line-through' },
  newPrice: { color: colors.primary, fontSize: 17, fontWeight: '900' },
  addCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
