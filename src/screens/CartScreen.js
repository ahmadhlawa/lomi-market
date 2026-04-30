import React from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { activeOpacity, colors, formatPrice, globalStyles, spacing } from '../theme';

function CartHeader({ count, onBack }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity activeOpacity={activeOpacity} style={styles.headerIcon} onPress={onBack}>
        <Ionicons name="arrow-back" size={25} color={colors.primary} />
      </TouchableOpacity>
      <Text style={styles.headerBrand}>LOMI MARKET</Text>
      <View style={styles.headerIcon}>
        <Ionicons name="cart" size={25} color={colors.primary} />
        {count > 0 && (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{count}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function CartItem({ item, onMinus, onPlus }) {
  const product = item.product;

  return (
    <View style={styles.itemCard}>
      <Image source={{ uri: product.image }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{product.nameEn}</Text>
        <Text style={styles.itemNameAr}>{product.nameAr}</Text>
        <Text style={styles.itemPrice}>{formatPrice(product.price)} ₪</Text>
      </View>
      <View style={styles.qtyControls}>
        <TouchableOpacity activeOpacity={activeOpacity} onPress={onMinus}>
          <Text style={styles.qtyMuted}>−</Text>
        </TouchableOpacity>
        <Text style={styles.qtyNumber}>{item.quantity}</Text>
        <TouchableOpacity activeOpacity={activeOpacity} onPress={onPlus}>
          <Text style={styles.qtyPlus}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function SummaryRow({ label, value, valueColor = colors.textPrimary }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

export default function CartScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { items, count, subtotal, deliveryFee, total, updateQuantity } = useCart();

  return (
    <SafeAreaView edges={['top']} style={globalStyles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <CartHeader count={count} onBack={() => navigation.goBack()} />
        <View style={styles.titleWrap}>
          <Text style={styles.title}>
            Your Cart <Text style={styles.titleDivider}>|</Text>{' '}
            <Text style={styles.titleAr}>سلة التسوق</Text>
          </Text>
        </View>

        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🛒</Text>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptySubtitle}>سلة التسوق فارغة</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.product.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.listContent, { paddingBottom: 24 }]}
            renderItem={({ item }) => (
              <CartItem
                item={item}
                onMinus={() => updateQuantity(item.product.id, item.quantity - 1)}
                onPlus={() => updateQuantity(item.product.id, item.quantity + 1)}
              />
            )}
            ListFooterComponent={
              <View>
                <View style={styles.promo}>
                  <Ionicons name="pricetag-outline" size={19} color="#555555" />
                  <TextInput
                    style={styles.promoInput}
                    placeholder="Promo Code | كود الخصم"
                    placeholderTextColor="#444"
                  />
                  <TouchableOpacity activeOpacity={activeOpacity} style={styles.applyButton}>
                    <Text style={styles.applyText}>APPLY</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.summary}>
                  <Text style={styles.summaryTitle}>
                    Order Summary <Text style={styles.summaryTitleDivider}>|</Text>{' '}
                    <Text style={styles.summaryTitleAr}>ملخص الطلب</Text>
                  </Text>
                  <View style={styles.summaryRows}>
                    <SummaryRow
                      label="Subtotal / المجموع الفرعي"
                      value={`${formatPrice(subtotal)} ₪`}
                    />
                    <SummaryRow
                      label="Delivery Fee / رسوم التوصيل"
                      value={`${formatPrice(deliveryFee)} ₪`}
                    />
                    <SummaryRow
                      label="Taxes / الضرائب"
                      value="Included"
                      valueColor={colors.success}
                    />
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total / الإجمالي</Text>
                    <Text style={styles.totalValue}>{formatPrice(total)} ₪</Text>
                  </View>
                </View>
              </View>
            }
          />
        )}

        <View style={[styles.checkoutWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TouchableOpacity
            activeOpacity={activeOpacity}
            disabled={items.length === 0}
            style={[styles.checkoutButton, items.length === 0 && styles.disabledButton]}
            onPress={() => navigation.navigate('Checkout')}
          >
            <Ionicons name="bag-outline" size={22} color={colors.dark} />
            <Text style={styles.checkoutText}>Proceed to Checkout</Text>
            <Text style={styles.checkoutDivider}>|</Text>
            <Text style={styles.checkoutTextAr}>إتمام الطلب</Text>
            <Ionicons name="arrow-forward" size={19} color={colors.dark} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  header: {
    height: 64,
    paddingHorizontal: spacing.screen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBrand: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  cartBadge: {
    position: 'absolute',
    top: 5,
    right: 2,
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
  titleWrap: {
    paddingHorizontal: spacing.screen,
    marginTop: 14,
    marginBottom: 12,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '900',
  },
  titleDivider: {
    color: colors.surface3,
    fontWeight: '400',
  },
  titleAr: {
    color: colors.textSecondary,
    fontSize: 19,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: spacing.screen,
    paddingBottom: 170,
  },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  itemImage: {
    width: 82,
    height: 82,
    borderRadius: 17,
    backgroundColor: colors.surface2,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  itemNameAr: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  itemPrice: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 10,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#161616',
    borderRadius: spacing.pill,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  qtyMuted: {
    color: colors.textSecondary,
    fontSize: 21,
    fontWeight: '700',
  },
  qtyPlus: {
    color: colors.textPrimary,
    fontSize: 21,
    fontWeight: '700',
  },
  qtyNumber: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    minWidth: 16,
    textAlign: 'center',
  },
  promo: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 52,
    marginTop: 4,
  },
  promoInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    marginLeft: 10,
  },
  applyButton: {
    backgroundColor: colors.surface2,
    borderRadius: spacing.pill,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  applyText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  summary: {
    marginTop: 20,
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 18,
  },
  summaryTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  summaryTitleDivider: {
    color: colors.surface3,
  },
  summaryTitleAr: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  summaryRows: {
    marginTop: 15,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.surface2,
    marginVertical: 14,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  totalValue: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
  },
  checkoutWrap: {
    paddingTop: 12,
    paddingHorizontal: spacing.screen,
    backgroundColor: colors.dark,
    borderTopWidth: 1,
    borderTopColor: colors.surface,
  },
  checkoutButton: {
    height: 58,
    borderRadius: spacing.pill,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
  },
  disabledButton: {
    opacity: 0.45,
  },
  checkoutText: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: '900',
  },
  checkoutDivider: {
    color: 'rgba(0,0,0,0.32)',
    fontSize: 20,
    fontWeight: '300',
  },
  checkoutTextAr: {
    color: colors.dark,
    fontSize: 15,
    fontWeight: '700',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 120,
  },
  emptyEmoji: {
    fontSize: 50,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 12,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    marginTop: 5,
  },
});
