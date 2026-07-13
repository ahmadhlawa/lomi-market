import React from 'react';
import {
  FlatList,
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { activeOpacity, colors, formatCurrency, globalStyles, spacing } from '../theme';

function CartItem({ item, onMinus, onPlus, onRemove }) {
  const product = item.product;
  const lineTotal = product.price * item.quantity;

  return (
    <View style={styles.itemCard}>
      <Image source={{ uri: product.image }} style={styles.itemImage} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{product.name}</Text>
        <Text style={styles.itemNameAr} numberOfLines={1}>{product.nameAr}</Text>
        <Text style={styles.itemMeta}>{formatCurrency(product.price)} • {product.unit}</Text>
        <Text style={styles.itemPrice}>{formatCurrency(lineTotal)}</Text>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity activeOpacity={activeOpacity} style={styles.removeButton} onPress={onRemove}>
          <Ionicons name="trash-outline" size={16} color={colors.error} />
        </TouchableOpacity>
        <View style={styles.qtyControls}>
          <TouchableOpacity activeOpacity={activeOpacity} style={styles.qtyButton} onPress={onMinus}>
            <Ionicons name="remove" size={15} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.qtyNumber}>{item.quantity}</Text>
          <TouchableOpacity activeOpacity={activeOpacity} style={styles.qtyButton} onPress={onPlus}>
            <Ionicons name="add" size={15} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
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
  const {
    items,
    count,
    subtotal,
    deliveryFee,
    serviceFee,
    discount,
    total,
    promoCode,
    promoStatus,
    loading,
    error,
    refetch,
    updateQuantity,
    removeItem,
    applyPromoCode,
    setPromoCode,
    clearPromo,
  } = useCart();
  const isEmpty = items.length === 0;

  return (
    <SafeAreaView edges={['top']} style={globalStyles.screen}>
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={activeOpacity} style={styles.headerIcon} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={23} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Your Cart</Text>
          <Text style={styles.headerSub}>{count} items selected</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="cart" size={24} color={colors.primary} />
        </View>
      </View>

      {loading ? (
        <View style={styles.empty}><ActivityIndicator color={colors.primary} size="large" /><Text style={styles.emptySubtitle}>Loading your cart…</Text></View>
      ) : error ? (
        <View style={styles.empty}><Ionicons name="cloud-offline-outline" size={46} color={colors.error} /><Text style={styles.emptyTitle}>Cart unavailable</Text><Text style={styles.emptySubtitle}>{error.message}</Text><TouchableOpacity style={styles.continueButton} onPress={() => refetch()}><Text style={styles.continueText}>Try again</Text></TouchableOpacity></View>
      ) : isEmpty ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="basket-outline" size={46} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add products from Home or Explore to start your order.</Text>
          <TouchableOpacity activeOpacity={activeOpacity} style={styles.continueButton} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.continueText}>Continue shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.product.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContent, { paddingBottom: 172 + insets.bottom }]}
          renderItem={({ item }) => (
            <CartItem
              item={item}
              onMinus={() => updateQuantity(item.product.id, item.quantity - 1)}
              onPlus={() => updateQuantity(item.product.id, item.quantity + 1)}
              onRemove={() => removeItem(item.product.id)}
            />
          )}
          ListFooterComponent={
            <View>
              <View style={styles.promo}>
                <Ionicons name="pricetag-outline" size={19} color={colors.textMuted} />
                <TextInput
                  value={promoCode}
                  onChangeText={setPromoCode}
                  autoCapitalize="characters"
                  style={styles.promoInput}
                  placeholder="Promo code: LOMI10"
                  placeholderTextColor={colors.textMuted}
                />
                {discount > 0 ? (
                  <TouchableOpacity activeOpacity={activeOpacity} style={styles.applyButton} onPress={clearPromo}>
                    <Text style={styles.applyText}>CLEAR</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity activeOpacity={activeOpacity} style={styles.applyButton} onPress={() => applyPromoCode()}>
                    <Text style={styles.applyText}>APPLY</Text>
                  </TouchableOpacity>
                )}
              </View>
              {!!promoStatus && (
                <Text style={[styles.promoMessage, promoStatus.type === 'success' ? styles.promoSuccess : styles.promoError]}>
                  {promoStatus.message}
                </Text>
              )}

              <View style={styles.summary}>
                <Text style={styles.summaryTitle}>Order Summary</Text>
                <View style={styles.summaryRows}>
                  <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
                  <SummaryRow label="Delivery fee" value={deliveryFee === 0 ? 'Free' : formatCurrency(deliveryFee)} valueColor={deliveryFee === 0 ? colors.success : colors.textPrimary} />
                  <SummaryRow label="Service fee" value={formatCurrency(serviceFee)} />
                  {discount > 0 && <SummaryRow label="Promo discount" value={`-${formatCurrency(discount)}`} valueColor={colors.success} />}
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
                </View>
              </View>
            </View>
          }
        />
      )}

      {!isEmpty && (
        <View style={[styles.checkoutWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TouchableOpacity activeOpacity={activeOpacity} style={styles.checkoutButton} onPress={() => navigation.navigate('Checkout')}>
            <Ionicons name="bag-check-outline" size={22} color={colors.dark} />
            <Text style={styles.checkoutText}>Proceed to checkout</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.dark} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 68,
    paddingHorizontal: spacing.screen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: { alignItems: 'center' },
  headerTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '900' },
  headerSub: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  listContent: { paddingHorizontal: spacing.screen, paddingTop: 16 },
  itemCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  itemImage: { width: 78, height: 78, borderRadius: 16, backgroundColor: colors.surface2 },
  itemInfo: { flex: 1 },
  itemName: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  itemNameAr: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  itemMeta: { color: colors.textMuted, fontSize: 11, marginTop: 6 },
  itemPrice: { color: colors.primary, fontSize: 17, fontWeight: '900', marginTop: 5 },
  itemActions: { alignItems: 'flex-end', gap: 10 },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.errorDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface2,
    borderRadius: spacing.pill,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  qtyButton: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyNumber: { color: colors.textPrimary, fontSize: 15, fontWeight: '900', minWidth: 18, textAlign: 'center' },
  promo: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 54,
    marginTop: 8,
  },
  promoInput: { flex: 1, color: colors.textPrimary, fontSize: 14, marginLeft: 10 },
  applyButton: {
    backgroundColor: colors.surface2,
    borderRadius: spacing.pill,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  applyText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  promoMessage: { fontSize: 12, fontWeight: '800', marginTop: 8, marginLeft: 4 },
  promoSuccess: { color: colors.success },
  promoError: { color: colors.error },
  summary: {
    marginTop: 18,
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },
  summaryTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
  summaryRows: { marginTop: 15, gap: 12 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryLabel: { color: colors.textSecondary, fontSize: 14 },
  summaryValue: { fontSize: 14, fontWeight: '800' },
  summaryDivider: { height: 1, backgroundColor: colors.surface2, marginVertical: 14 },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  totalValue: { color: colors.primary, fontSize: 24, fontWeight: '900' },
  checkoutWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: spacing.screen,
    backgroundColor: colors.dark,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  checkoutButton: {
    height: 58,
    borderRadius: spacing.pill,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  checkoutText: { color: colors.dark, fontSize: 16, fontWeight: '900' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
    paddingBottom: 80,
  },
  emptyIcon: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { color: colors.textPrimary, fontSize: 22, fontWeight: '900', marginTop: 18 },
  emptySubtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 7 },
  continueButton: {
    height: 50,
    borderRadius: spacing.pill,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  continueText: { color: colors.dark, fontSize: 15, fontWeight: '900' },
});
