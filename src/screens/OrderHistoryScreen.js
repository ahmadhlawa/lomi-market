import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { orders } from '../data/mockData';
import { useCart } from '../context/CartContext';
import { activeOpacity, colors, globalStyles, spacing } from '../theme';

const tabs = [
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

function Header({ count, onCart }) {
  return (
    <View style={styles.header}>
      <Ionicons name="location-outline" size={24} color={colors.primary} />
      <Text style={styles.brand}>LOMI MARKET</Text>
      <TouchableOpacity activeOpacity={activeOpacity} style={styles.cartIcon} onPress={onCart}>
        <Ionicons name="cart" size={25} color={colors.primary} />
        {count > 0 && <View style={styles.redDot} />}
      </TouchableOpacity>
    </View>
  );
}

function StatusBadge({ status }) {
  const isDelivered = status === 'delivered';
  return (
    <View style={[styles.statusBadge, !isDelivered && styles.statusCancelled]}>
      <Text style={[styles.statusText, !isDelivered && styles.statusTextCancelled]}>
        • {isDelivered ? 'Delivered' : 'Cancelled'}
      </Text>
    </View>
  );
}

function OrderCard({ item, onPress }) {
  return (
    <TouchableOpacity activeOpacity={activeOpacity} style={styles.orderCard} onPress={onPress}>
      <View style={styles.orderTop}>
        <Text style={styles.orderId}>#{item.id}</Text>
        <StatusBadge status={item.status} />
      </View>
      <Text style={styles.orderDate}>{item.date}</Text>

      <View style={styles.productRow}>
        <View style={styles.imageStack}>
          <Image source={{ uri: item.image }} style={styles.orderImage} />
          <View style={styles.extraBadge}>
            <Text style={styles.extraText}>+{item.extraCount}</Text>
          </View>
        </View>
        <View style={styles.orderInfo}>
          <Text style={styles.orderName}>{item.name}</Text>
          <Text style={styles.orderNameAr}>{item.nameAr}</Text>
          <Text style={styles.orderItems}>{item.itemCount} Items</Text>
        </View>
        <View style={styles.priceBlock}>
          <Text style={styles.currency}>₪</Text>
          <Text style={styles.orderTotal}>{item.total}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity activeOpacity={activeOpacity} style={styles.reorderButton}>
          <Ionicons name="refresh" size={18} color={colors.dark} />
          <Text style={styles.reorderText}>Reorder | إعادة طلب</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={activeOpacity} style={styles.receiptButton}>
          <Ionicons name="receipt-outline" size={21} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function OrderHistoryScreen({ navigation }) {
  const [tab, setTab] = useState('completed');
  const { count } = useCart();

  const filteredOrders = useMemo(() => {
    if (tab === 'completed') return orders.filter((order) => order.status === 'delivered');
    if (tab === 'cancelled') return orders.filter((order) => order.status === 'cancelled');
    return [];
  }, [tab]);

  return (
    <SafeAreaView edges={['top']} style={globalStyles.screen}>
      <Header
        count={count}
        onCart={() => navigation.getParent()?.navigate('HomeTab', { screen: 'Cart' })}
      />
      <View style={styles.titleWrap}>
        <Text style={styles.title}>Order History</Text>
        <Text style={styles.titleAr}>سجل الطلبات</Text>
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
                <Text style={[styles.tabText, selected && styles.tabTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyTitle}>No active orders</Text>
            <Text style={styles.emptySub}>لا توجد طلبات نشطة</Text>
          </View>
        }
        renderItem={({ item }) => (
          <OrderCard item={item} onPress={() => navigation.navigate('OrderTracking')} />
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
  brand: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  cartIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redDot: {
    position: 'absolute',
    top: 8,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
  titleWrap: {
    paddingHorizontal: spacing.screen,
    marginTop: 28,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 0,
  },
  titleAr: {
    color: colors.textSecondary,
    fontSize: 18,
    marginTop: 8,
  },
  tabsWrap: {
    paddingHorizontal: spacing.screen,
    marginTop: 26,
  },
  tabs: {
    backgroundColor: colors.surface,
    borderRadius: spacing.pill,
    padding: 4,
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    height: 42,
    borderRadius: spacing.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.surface2,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  tabTextActive: {
    color: colors.textPrimary,
  },
  listContent: {
    paddingHorizontal: spacing.screen,
    paddingTop: 24,
    paddingBottom: 110,
  },
  orderCard: {
    backgroundColor: colors.surface,
    borderRadius: 26,
    padding: 18,
    marginBottom: 18,
  },
  orderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderId: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '900',
  },
  statusBadge: {
    backgroundColor: colors.successDim,
    borderRadius: spacing.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusCancelled: {
    backgroundColor: colors.errorDim,
  },
  statusText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '800',
  },
  statusTextCancelled: {
    color: colors.error,
  },
  orderDate: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
  productRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  imageStack: {
    width: 58,
    height: 58,
  },
  orderImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  extraBadge: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    backgroundColor: colors.surface2,
    borderRadius: 50,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '900',
  },
  orderInfo: {
    flex: 1,
  },
  orderName: {
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: '900',
  },
  orderNameAr: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  orderItems: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  priceBlock: {
    alignItems: 'flex-end',
  },
  currency: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  orderTotal: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '900',
  },
  actions: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.surface2,
    flexDirection: 'row',
    gap: 12,
  },
  reorderButton: {
    flex: 1,
    height: 48,
    borderRadius: spacing.pill,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  reorderText: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: '900',
  },
  receiptButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 90,
  },
  emptyEmoji: {
    fontSize: 50,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 14,
  },
  emptySub: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 5,
  },
});
