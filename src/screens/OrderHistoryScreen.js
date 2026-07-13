import React, { useMemo, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { activeOpacity, colors, formatCurrency, globalStyles, spacing } from '../theme';
import { useOrders } from '../hooks/useOrders';
import { api } from '../api/client';
import { useQueryClient } from '@tanstack/react-query';

const tabs = [
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

const activeStatuses = ['placed', 'confirmed', 'preparing', 'picked_up', 'out_for_delivery'];

function statusInfo(status) {
  const map = {
    placed: { label: 'Placed', color: colors.primary, bg: colors.primaryDim },
    preparing: { label: 'Preparing', color: colors.primary, bg: colors.primaryDim },
    picked_up: { label: 'Picked up', color: colors.primary, bg: colors.primaryDim },
    on_the_way: { label: 'On the way', color: colors.primary, bg: colors.primaryDim },
    out_for_delivery: { label: 'Out for delivery', color: colors.primary, bg: colors.primaryDim },
    confirmed: { label: 'Confirmed', color: colors.primary, bg: colors.primaryDim },
    delivered: { label: 'Delivered', color: colors.success, bg: colors.successDim },
    cancelled: { label: 'Cancelled', color: colors.error, bg: colors.errorDim },
  };
  return map[status] || map.placed;
}

function StatusBadge({ status }) {
  const value = statusInfo(status);
  return (
    <View style={[styles.statusBadge, { backgroundColor: value.bg }]}>
      <Text style={[styles.statusText, { color: value.color }]}>{value.label}</Text>
    </View>
  );
}

function OrderCard({ item, onTrack, onReorder }) {
  const address = typeof item.address === 'string' ? item.address : item.address?.summary || item.address?.title;
  const firstImage = item.items?.[0]?.product?.image || item.image;

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderTop}>
        <Text style={styles.orderId}>#{item.orderId || item.id}</Text>
        <StatusBadge status={item.status} />
      </View>
      <Text style={styles.orderDate}>{item.date || item.createdAt}</Text>

      <View style={styles.productRow}>
        <View style={styles.imageStack}>
          <Image source={{ uri: firstImage }} style={styles.orderImage} />
          {!!item.extraCount && (
            <View style={styles.extraBadge}>
              <Text style={styles.extraText}>+{item.extraCount}</Text>
            </View>
          )}
        </View>
        <View style={styles.orderInfo}>
          <Text style={styles.orderName}>{item.name}</Text>
          <Text style={styles.orderNameAr}>{item.nameAr}</Text>
          <Text style={styles.orderItems}>{item.itemCount} items • {address}</Text>
        </View>
        <Text style={styles.orderTotal}>{formatCurrency(item.total)}</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity activeOpacity={activeOpacity} style={styles.trackButton} onPress={onTrack}>
          <Ionicons name={activeStatuses.includes(item.status) ? 'navigate' : 'receipt-outline'} size={18} color={colors.dark} />
          <Text style={styles.trackText}>{activeStatuses.includes(item.status) ? 'Track Order' : 'View Receipt'}</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={activeOpacity} style={styles.reorderButton} onPress={onReorder}>
          <Ionicons name="refresh" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function OrderHistoryScreen({ navigation }) {
  const [tab, setTab] = useState('active');
  const { count } = useCart();
  const queryClient = useQueryClient();
  const ordersQuery = useOrders();

  const allOrders = ordersQuery.data || [];

  const filteredOrders = useMemo(() => {
    if (tab === 'completed') return allOrders.filter((order) => order.status === 'delivered');
    if (tab === 'cancelled') return allOrders.filter((order) => order.status === 'cancelled');
    return allOrders.filter((order) => activeStatuses.includes(order.status));
  }, [allOrders, tab]);

  const reorder = (order) => {
    api(`/orders/${order.id}/reorder`, { method: 'POST' }).then(() => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      navigation.getParent()?.navigate('HomeTab', { screen: 'Cart' });
    });
  };

  return (
    <SafeAreaView edges={['top']} style={globalStyles.screen}>
      <View style={styles.header}>
        <Ionicons name="receipt-outline" size={24} color={colors.primary} />
        <Text style={styles.brand}>LOMI MARKET</Text>
        <TouchableOpacity
          activeOpacity={activeOpacity}
          style={styles.cartIcon}
          onPress={() => navigation.getParent()?.navigate('HomeTab', { screen: 'Cart' })}
        >
          <Ionicons name="cart-outline" size={24} color={colors.primary} />
          {count > 0 && <View style={styles.redDot} />}
        </TouchableOpacity>
      </View>

      <View style={styles.titleWrap}>
        <Text style={styles.title}>Orders</Text>
        <Text style={styles.subtitle}>Active deliveries, receipts, and quick reorder</Text>
      </View>

      <View style={styles.tabsWrap}>
        <View style={styles.tabs}>
          {tabs.map((item) => {
            const selected = tab === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={activeOpacity}
                style={[styles.tab, selected && styles.tabActive]}
                onPress={() => setTab(item.id)}
              >
                <Text style={[styles.tabText, selected && styles.tabTextActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FlatList
        data={filteredOrders}
        refreshing={ordersQuery.isRefetching}
        onRefresh={() => ordersQuery.refetch()}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={42} color={colors.surface3} />
            <Text style={styles.emptyTitle}>No orders in this tab</Text>
          </View>
        }
        renderItem={({ item }) => (
          <OrderCard
            item={item}
            onTrack={() => navigation.navigate('OrderTracking', { order: item })}
            onReorder={() => reorder(item)}
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    paddingHorizontal: spacing.screen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brand: { ...globalStyles.brandText, fontSize: 17 },
  cartIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  titleWrap: { paddingHorizontal: spacing.screen, marginTop: 24 },
  title: { color: colors.textPrimary, fontSize: 38, fontWeight: '900' },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: 5 },
  tabsWrap: { paddingHorizontal: spacing.screen, marginTop: 22 },
  tabs: { backgroundColor: colors.surface, borderRadius: spacing.pill, padding: 4, flexDirection: 'row' },
  tab: { flex: 1, height: 42, borderRadius: spacing.pill, alignItems: 'center', justifyContent: 'center' },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.textMuted, fontSize: 13, fontWeight: '900' },
  tabTextActive: { color: colors.dark },
  listContent: { paddingHorizontal: spacing.screen, paddingTop: 22, paddingBottom: 110 },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  orderTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderId: { color: colors.primary, fontSize: 16, fontWeight: '900' },
  statusBadge: { borderRadius: spacing.pill, paddingHorizontal: 11, paddingVertical: 5 },
  statusText: { fontSize: 12, fontWeight: '900' },
  orderDate: { color: colors.textMuted, fontSize: 12, marginTop: 6 },
  productRow: { marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  imageStack: { width: 58, height: 58 },
  orderImage: { width: 54, height: 54, borderRadius: 18, backgroundColor: colors.surface2 },
  extraBadge: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    backgroundColor: colors.surface2,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraText: { color: colors.white, fontSize: 10, fontWeight: '900' },
  orderInfo: { flex: 1 },
  orderName: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
  orderNameAr: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  orderItems: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  orderTotal: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  trackButton: {
    flex: 1,
    height: 48,
    borderRadius: spacing.pill,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  trackText: { color: colors.dark, fontSize: 14, fontWeight: '900' },
  reorderButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { alignItems: 'center', paddingTop: 70 },
  emptyTitle: { color: colors.textSecondary, fontSize: 15, fontWeight: '800', marginTop: 12 },
});
