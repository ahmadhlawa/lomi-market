import React, { useMemo } from 'react';
import { Image, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { demoAddress, driver as defaultDriver, getTrackingSteps } from '../data/mockData';
import {
  activeOpacity,
  colors,
  formatCurrency,
  globalStyles,
  mapDarkStyle,
  mapRegion,
  spacing,
} from '../theme';

function SafeMap() {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.mapFallback}>
        <Ionicons name="map-outline" size={40} color={colors.primary} />
        <Text style={styles.mapFallbackText}>Delivery map preview</Text>
      </View>
    );
  }

  return (
    <MapView
      style={StyleSheet.absoluteFill}
      initialRegion={mapRegion}
      customMapStyle={mapDarkStyle}
      scrollEnabled={false}
      zoomEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
    >
      <Marker coordinate={mapRegion}>
        <Ionicons name="location" size={36} color={colors.primary} />
      </Marker>
    </MapView>
  );
}

function StepIcon({ state }) {
  if (state === 'done') {
    return (
      <View style={[styles.stepCircle, styles.stepCircleDone]}>
        <Ionicons name="checkmark" size={14} color={colors.dark} />
      </View>
    );
  }
  if (state === 'active') {
    return (
      <View style={[styles.stepCircle, styles.stepCircleActive]}>
        <View style={styles.stepInner} />
      </View>
    );
  }
  return <View style={styles.stepCircle} />;
}

function TrackingStep({ item, isLast }) {
  const active = item.state === 'done' || item.state === 'active';
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepLeft}>
        <StepIcon state={item.state} />
        {!isLast && <View style={[styles.stepLine, active && styles.stepLineActive]} />}
      </View>
      <View style={styles.stepTextWrap}>
        <Text style={[styles.stepText, active ? styles.stepTextActive : styles.stepTextPending]}>
          {item.en}
        </Text>
        <Text style={[styles.stepAr, active ? styles.stepArActive : styles.stepArPending]}>
          {item.ar}
        </Text>
      </View>
    </View>
  );
}

export default function OrderTrackingScreen({ navigation, route }) {
  const order = route.params?.order;
  const steps = useMemo(
    () => order ? (order.trackingSteps || getTrackingSteps(order.status)) : [],
    [order]
  );
  if (!order) {
    return <SafeAreaView style={[globalStyles.screen, styles.missing]}><Text style={styles.receiptTitle}>Order unavailable</Text><TouchableOpacity style={styles.helpButton} onPress={() => navigation.goBack()}><Ionicons name="arrow-back" size={18} color={colors.dark} /></TouchableOpacity></SafeAreaView>;
  }
  const driver = order.driver || defaultDriver;
  const address = typeof order.address === 'string' ? { ...demoAddress, title: order.address } : order.address || demoAddress;
  const currentStep = steps.find((step) => step.state === 'active')?.en || 'Order placed';

  return (
    <SafeAreaView edges={['top']} style={globalStyles.screen}>
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={activeOpacity} style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={23} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.brand}>LOMI MARKET</Text>
        <TouchableOpacity accessibilityLabel="Call Lomi Market support" activeOpacity={activeOpacity} style={styles.helpButton} onPress={() => Linking.openURL('tel:+970599000000')}>
          <Ionicons name="call-outline" size={18} color={colors.dark} />
        </TouchableOpacity>
      </View>

      <View style={styles.mapBackdrop}>
        <SafeMap />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.topCard}>
          <View style={styles.arrivalRow}>
            <View>
              <Text style={styles.arrival}>{order.eta || '35 mins'}</Text>
              <Text style={styles.estimated}>Estimated arrival</Text>
            </View>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>{currentStep.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.orderStrip}>
            <View>
              <Text style={styles.orderId}>#{order.orderId || order.id}</Text>
              <Text style={styles.orderMeta}>
                {order.itemCount} items • {formatCurrency(order.total)}
              </Text>
            </View>
            <Ionicons name="receipt-outline" size={24} color={colors.primary} />
          </View>

          <View style={styles.driverCard}>
            <View style={styles.avatarWrap}>
              <Image source={{ uri: driver.image }} style={styles.avatar} />
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingBadgeText}>{driver.rating}</Text>
              </View>
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{driver.name}</Text>
              <Text style={styles.car}>{driver.vehicle}</Text>
              <Text style={styles.driverPhone}>{driver.phone}</Text>
            </View>
            <TouchableOpacity accessibilityLabel={`Call ${driver.name}`} activeOpacity={activeOpacity} style={styles.callButton} onPress={() => Linking.openURL(`tel:${driver.phone.replace(/\s/g, '')}`)}>
              <Ionicons name="call" size={20} color={colors.dark} />
            </TouchableOpacity>
          </View>

          <View style={styles.addressCard}>
            <Ionicons name="location" size={21} color={colors.primary} />
            <View style={styles.addressText}>
              <Text style={styles.addressTitle}>{address.title}</Text>
              <Text style={styles.addressLine}>{address.line}</Text>
            </View>
          </View>

          <View style={styles.stepper}>
            {steps.map((item, index) => (
              <TrackingStep key={item.key || item.en} item={item} isLast={index === steps.length - 1} />
            ))}
          </View>

          <View style={styles.receiptCard}>
            <Text style={styles.receiptTitle}>Order receipt</Text>
            {order.items?.map((item) => (
              <View key={item.product.id} style={styles.receiptItem}>
                <Text style={styles.receiptName} numberOfLines={1}>
                  {item.product.name} x{item.quantity}
                </Text>
                <Text style={styles.receiptValue}>{formatCurrency(item.product.price * item.quantity)}</Text>
              </View>
            ))}
            <View style={styles.receiptDivider} />
            <View style={styles.receiptItem}>
              <Text style={styles.receiptMuted}>Subtotal</Text>
              <Text style={styles.receiptValue}>{formatCurrency(order.subtotal || 0)}</Text>
            </View>
            <View style={styles.receiptItem}>
              <Text style={styles.receiptMuted}>Delivery</Text>
              <Text style={styles.receiptValue}>{order.deliveryFee ? formatCurrency(order.deliveryFee) : 'Free'}</Text>
            </View>
            {!!order.discount && (
              <View style={styles.receiptItem}>
                <Text style={styles.receiptMuted}>Discount</Text>
                <Text style={[styles.receiptValue, { color: colors.success }]}>-{formatCurrency(order.discount)}</Text>
              </View>
            )}
            <View style={styles.receiptDivider} />
            <View style={styles.receiptItem}>
              <Text style={styles.receiptTotal}>Total</Text>
              <Text style={styles.receiptTotal}>{formatCurrency(order.total)}</Text>
            </View>
            <Text style={styles.receiptFoot}>
              {order.paymentMethod} • {order.deliveryTime}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  missing: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  header: {
    height: 64,
    paddingHorizontal: spacing.screen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 2,
    backgroundColor: colors.dark,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { ...globalStyles.brandText, fontSize: 19 },
  helpButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapBackdrop: { ...StyleSheet.absoluteFillObject, top: 64, opacity: 0.58 },
  mapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
    gap: 8,
  },
  mapFallbackText: { color: colors.textSecondary, fontSize: 13, fontWeight: '800' },
  scrollContent: { paddingBottom: 28 },
  topCard: {
    marginHorizontal: spacing.screen,
    marginTop: 22,
    backgroundColor: 'rgba(30,30,30,0.97)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    zIndex: 1,
  },
  arrivalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrival: { color: colors.primary, fontSize: 42, fontWeight: '900' },
  estimated: { color: colors.textSecondary, fontSize: 14, marginTop: 2 },
  statusPill: {
    maxWidth: 145,
    backgroundColor: colors.dark,
    borderRadius: spacing.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  statusText: { color: colors.white, fontSize: 10, fontWeight: '900' },
  orderStrip: {
    marginTop: 18,
    backgroundColor: colors.dark,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderId: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  orderMeta: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  driverCard: {
    marginTop: 16,
    backgroundColor: colors.dark,
    borderRadius: 22,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: { width: 54, height: 54 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  ratingBadge: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ratingBadgeText: { color: colors.dark, fontSize: 10, fontWeight: '900' },
  driverInfo: { flex: 1 },
  driverName: { color: colors.textPrimary, fontSize: 19, fontWeight: '900' },
  car: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  driverPhone: { color: colors.primary, fontSize: 12, fontWeight: '800', marginTop: 3 },
  callButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressCard: {
    marginTop: 14,
    borderRadius: 18,
    backgroundColor: colors.surface,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addressText: { flex: 1 },
  addressTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  addressLine: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  stepper: { marginTop: 24, paddingLeft: 8 },
  stepRow: { flexDirection: 'row', gap: 14, minHeight: 70 },
  stepLeft: { alignItems: 'center' },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepCircleActive: { borderColor: colors.primary },
  stepInner: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.primary },
  stepLine: { width: 2, flex: 1, backgroundColor: colors.surface3 },
  stepLineActive: { backgroundColor: colors.primary },
  stepTextWrap: { flex: 1 },
  stepText: { fontSize: 16, fontWeight: '900' },
  stepTextActive: { color: colors.textPrimary },
  stepTextPending: { color: colors.textMuted },
  stepAr: { fontSize: 13, marginTop: 3, textAlign: 'right', writingDirection: 'rtl' },
  stepArActive: { color: colors.textSecondary },
  stepArPending: { color: colors.textMuted },
  receiptCard: {
    marginTop: 20,
    backgroundColor: colors.dark,
    borderRadius: 20,
    padding: 16,
  },
  receiptTitle: { color: colors.textPrimary, fontSize: 17, fontWeight: '900', marginBottom: 8 },
  receiptItem: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 5 },
  receiptName: { flex: 1, color: colors.textPrimary, fontSize: 13, fontWeight: '800' },
  receiptMuted: { color: colors.textSecondary, fontSize: 13 },
  receiptValue: { color: colors.textPrimary, fontSize: 13, fontWeight: '800' },
  receiptDivider: { height: 1, backgroundColor: colors.surface2, marginVertical: 9 },
  receiptTotal: { color: colors.primary, fontSize: 17, fontWeight: '900' },
  receiptFoot: { color: colors.textSecondary, fontSize: 12, marginTop: 10 },
});
