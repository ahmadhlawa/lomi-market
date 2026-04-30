import React, { useMemo, useState } from 'react';
import {
  FlatList,
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
import { Ionicons } from '@expo/vector-icons';
import { categories, products } from '../data/mockData';
import { useCart } from '../context/CartContext';
import { activeOpacity, colors, formatPrice, globalStyles, spacing } from '../theme';

function ProductRow({ item, onAdd, onOpen }) {
  return (
    <TouchableOpacity activeOpacity={activeOpacity} style={styles.productRow} onPress={onOpen}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.nameEn}</Text>
        <Text style={styles.productNameAr}>{item.nameAr}</Text>
        <Text style={styles.productSub}>
          {item.unit === 'kg' ? '1 kg' : `1 ${item.unit}`} • Fresh daily
        </Text>
        <Text style={styles.price}>{formatPrice(item.price)} ₪</Text>
      </View>
      <TouchableOpacity activeOpacity={activeOpacity} style={styles.addButton} onPress={onAdd}>
        <Ionicons name="cart-outline" size={17} color={colors.dark} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function ExploreScreen({ navigation }) {
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('1');
  const { addItem } = useCart();

  const filtered = useMemo(() => {
    const lower = query.toLowerCase();
    return products.filter((product) => {
      const inCategory = !categoryId || product.categoryId === categoryId;
      const inSearch =
        !lower ||
        product.nameEn.toLowerCase().includes(lower) ||
        product.nameAr.includes(query);
      return inCategory && inSearch;
    });
  }, [categoryId, query]);

  return (
    <SafeAreaView edges={['top']} style={globalStyles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Browse</Text>
          <Text style={styles.titleAr}>تصفح المنتجات</Text>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            placeholder="Search fresh produce / منتجات طازجة"
            placeholderTextColor="#444"
          />
          <Ionicons name="options-outline" size={20} color={colors.primary} />
        </View>

        <ScrollView
          horizontal
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          {categories.map((category) => {
            const selected = category.id === categoryId;
            return (
              <TouchableOpacity
                key={category.id}
                activeOpacity={activeOpacity}
                style={[styles.categoryPill, selected && styles.categoryPillActive]}
                onPress={() => setCategoryId(category.id)}
              >
                <Ionicons
                  name={category.icon}
                  size={18}
                  color={selected ? colors.dark : colors.primary}
                />
                <Text style={[styles.categoryText, selected && styles.categoryTextActive]}>
                  {category.en}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🛒</Text>
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySubtitle}>لا توجد منتجات مطابقة</Text>
            </View>
          }
          renderItem={({ item }) => (
            <ProductRow
              item={item}
              onOpen={() => navigation.navigate('HomeTab', {
                screen: 'ProductDetail',
                params: { product: item },
              })}
              onAdd={() => addItem(item)}
            />
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.screen,
    paddingTop: 20,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '800',
  },
  titleAr: {
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 4,
  },
  searchBar: {
    height: 52,
    marginHorizontal: spacing.screen,
    marginTop: 18,
    borderRadius: spacing.pill,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  categoryList: {
    paddingLeft: spacing.screen,
    paddingRight: 10,
    gap: 10,
    paddingTop: 16,
    paddingBottom: 12,
  },
  categoryPill: {
    height: 42,
    borderRadius: spacing.pill,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  categoryPillActive: {
    backgroundColor: colors.primary,
  },
  categoryText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  categoryTextActive: {
    color: colors.dark,
  },
  listContent: {
    paddingHorizontal: spacing.screen,
    paddingBottom: 110,
  },
  productRow: {
    minHeight: 126,
    borderRadius: 22,
    backgroundColor: colors.surface,
    marginBottom: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  productImage: {
    width: 92,
    height: 92,
    borderRadius: 16,
    backgroundColor: colors.surface2,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  productNameAr: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 3,
  },
  productSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 5,
  },
  price: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 8,
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 110,
  },
  emptyEmoji: {
    fontSize: 46,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 12,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
});
