import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { categories, products } from '../data/mockData';
import { useCart } from '../context/CartContext';
import { activeOpacity, colors, formatCurrency, globalStyles, spacing } from '../theme';

const visibleCategories = categories.filter(
  (category) => category.id === 'all' || products.some((product) => product.categoryId === category.id)
);

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

function ProductRow({ item, onAdd, onOpen }) {
  const hasDiscount = item.oldPrice && item.oldPrice > item.price;

  return (
    <TouchableOpacity activeOpacity={activeOpacity} style={styles.productRow} onPress={onOpen}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          {hasDiscount && <Text style={styles.discountText}>-{item.discountPercentage}%</Text>}
        </View>
        <Text style={styles.productNameAr} numberOfLines={1}>{item.nameAr}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="star" size={12} color={colors.primary} />
          <Text style={styles.productSub}>{item.rating}</Text>
          <Text style={styles.productSub}>•</Text>
          <Text style={styles.productSub}>{item.categoryName}</Text>
          <Text style={styles.productSub}>•</Text>
          <Text style={styles.productSub}>{item.unit}</Text>
        </View>
        <View style={styles.priceLine}>
          <Text style={styles.price}>{formatCurrency(item.price)}</Text>
          {hasDiscount && <Text style={styles.oldPrice}>{formatCurrency(item.oldPrice)}</Text>}
        </View>
      </View>
      <TouchableOpacity activeOpacity={activeOpacity} style={styles.addButton} onPress={onAdd}>
        <Ionicons name="add" size={19} color={colors.dark} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function ExploreScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const { addItem } = useCart();

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const inCategory = categoryId === 'all' || product.categoryId === categoryId;
      return inCategory && matchesSearch(product, query);
    });
  }, [categoryId, query]);

  return (
    <SafeAreaView edges={['top']} style={globalStyles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Search and filter the full demo catalog</Text>
      </View>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          style={styles.searchInput}
          placeholder="Search product, category, or description..."
          placeholderTextColor={colors.textMuted}
        />
        {!!query && (
          <TouchableOpacity activeOpacity={activeOpacity} onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={19} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        horizontal
        data={visibleCategories}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryList}
        renderItem={({ item }) => {
          const selected = item.id === categoryId;
          return (
            <TouchableOpacity
              activeOpacity={activeOpacity}
              style={[styles.categoryPill, selected && styles.categoryPillActive]}
              onPress={() => setCategoryId(item.id)}
            >
              <Ionicons name={item.icon} size={18} color={selected ? colors.dark : colors.primary} />
              <Text style={[styles.categoryText, selected && styles.categoryTextActive]}>{item.en}</Text>
            </TouchableOpacity>
          );
        }}
      />

      <View style={styles.resultHeader}>
        <Text style={styles.resultTitle}>{filtered.length} products</Text>
        <Text style={styles.resultSub}>
          {categoryId === 'all' ? 'All categories' : visibleCategories.find((item) => item.id === categoryId)?.en}
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search" size={44} color={colors.surface3} />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptySubtitle}>Try another category or search term.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ProductRow
            item={item}
            onOpen={() =>
              navigation.navigate('HomeTab', {
                screen: 'ProductDetail',
                params: { product: item },
              })
            }
            onAdd={() => addItem(item)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.screen, paddingTop: 20 },
  title: { color: colors.textPrimary, fontSize: 34, fontWeight: '900' },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 5 },
  searchBar: {
    height: 54,
    marginHorizontal: spacing.screen,
    marginTop: 18,
    borderRadius: spacing.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  categoryList: {
    paddingLeft: spacing.screen,
    paddingRight: spacing.screen,
    gap: 10,
    paddingTop: 16,
    paddingBottom: 12,
  },
  categoryPill: {
    height: 42,
    borderRadius: spacing.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  categoryPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryText: { color: colors.textPrimary, fontSize: 13, fontWeight: '800' },
  categoryTextActive: { color: colors.dark },
  resultHeader: {
    paddingHorizontal: spacing.screen,
    marginTop: 2,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  resultSub: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  listContent: { paddingHorizontal: spacing.screen, paddingBottom: 110 },
  productRow: {
    minHeight: 126,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  productImage: { width: 90, height: 90, borderRadius: 16, backgroundColor: colors.surface2 },
  productInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  productName: { flex: 1, color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  productNameAr: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, flexWrap: 'wrap' },
  productSub: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
  priceLine: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 8 },
  price: { color: colors.primary, fontSize: 18, fontWeight: '900' },
  oldPrice: { color: colors.textMuted, fontSize: 12, textDecorationLine: 'line-through' },
  discountText: {
    color: colors.white,
    backgroundColor: colors.error,
    borderRadius: 10,
    overflow: 'hidden',
    paddingHorizontal: 7,
    paddingVertical: 2,
    fontSize: 10,
    fontWeight: '900',
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { alignItems: 'center', paddingTop: 110 },
  emptyTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900', marginTop: 12 },
  emptySubtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 5 },
});
