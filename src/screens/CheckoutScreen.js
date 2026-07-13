import React, { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { demoAddress } from '../data/mockData';
import { useCart } from '../context/CartContext';
import {
  activeOpacity,
  colors,
  formatCurrency,
  globalStyles,
  mapDarkStyle,
  mapRegion,
  spacing,
} from '../theme';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { mapApiOrder } from '../hooks/useOrders';

function Header({ onBack }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity activeOpacity={activeOpacity} style={styles.headerButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={23} color={colors.primary} />
      </TouchableOpacity>
      <View style={styles.headerTitleWrap}>
        <Text style={styles.headerTitle}>Checkout</Text>
        <Text style={styles.headerSub}>Invoice and delivery details</Text>
      </View>
      <View style={styles.headerButton} />
    </View>
  );
}

function SectionTitle({ title, action }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {!!action && <Text style={styles.editText}>{action}</Text>}
    </View>
  );
}

function SafeMap() {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.mapFallback}>
        <Ionicons name="map-outline" size={30} color={colors.primary} />
        <Text style={styles.mapFallbackText}>Map preview</Text>
      </View>
    );
  }

  return (
    <MapView
      style={StyleSheet.absoluteFill}
      customMapStyle={mapDarkStyle}
      initialRegion={mapRegion}
      scrollEnabled={false}
      zoomEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
    >
      <Marker coordinate={mapRegion}>
        <Ionicons name="location" size={34} color={colors.primary} />
      </Marker>
    </MapView>
  );
}

function OptionCard({ selected, icon, title, subtitle, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      style={[styles.optionCard, selected && styles.optionCardSelected]}
      onPress={onPress}
    >
      <View style={styles.optionIcon}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={styles.optionText}>
        <Text style={styles.optionTitle}>{title}</Text>
        <Text style={styles.optionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons
        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
        size={22}
        color={selected ? colors.primary : colors.surface3}
      />
    </TouchableOpacity>
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

export default function CheckoutScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const {
    items,
    count,
    subtotal,
    deliveryFee,
    serviceFee,
    discount,
    total,
    appliedPromo,
    placeOrder,
  } = useCart();
  const [payment, setPayment] = useState('cash');
  const [delivery, setDelivery] = useState(null);
  const [addressId, setAddressId] = useState(null);
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const addressesQuery = useQuery({ queryKey: ['addresses'], queryFn: () => api('/addresses') });
  const slotsQuery = useQuery({ queryKey: ['delivery-slots'], queryFn: () => api('/catalog/delivery-slots') });
  const deliveryOptions = useMemo(() => (slotsQuery.data || []).map((slot) => ({ id: slot.id, title: slot.label_en, subtitle: `${slot.start_time} - ${slot.end_time}` })), [slotsQuery.data]);
  useEffect(() => { if (!addressId && addressesQuery.data?.length) setAddressId((addressesQuery.data.find((item) => item.is_default) || addressesQuery.data[0]).id); }, [addressId, addressesQuery.data]);
  useEffect(() => { if (!delivery && deliveryOptions.length) setDelivery(deliveryOptions[0].id); }, [delivery, deliveryOptions]);
  const rawAddress = addressesQuery.data?.find((item) => item.id === addressId);
  const address = rawAddress ? { title: rawAddress.label, line: rawAddress.line1, ar: rawAddress.city } : demoAddress;

  const submitOrder = async () => {
    if (placing || count === 0 || !addressId) return;
    setPlacing(true);
    setSubmitError('');
    try {
      const order = mapApiOrder(await placeOrder({ addressId, deliverySlotId: delivery, notes }));
      navigation.getParent()?.navigate('OrdersTab', {
        screen: 'OrderTracking',
        params: { order },
      });
    } catch (error) {
      setSubmitError(error.message);
      setPlacing(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={globalStyles.screen}>
      <Header onBack={() => navigation.goBack()} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: 30 + insets.bottom }]}>
        <View style={styles.section}>
          <SectionTitle title="Delivery address" action={rawAddress ? rawAddress.label : 'Required'} />
          <View style={styles.mapPreview}>
            <SafeMap />
          </View>
          <View style={styles.addressCard}>
            <Ionicons name="home" size={22} color={colors.primary} />
            <View style={styles.addressText}>
              <Text style={styles.addressTitle}>{address.title}</Text>
              <Text style={styles.addressLine}>{address.line}</Text>
              <Text style={styles.addressAr}>{address.ar}</Text>
            </View>
          </View>
          {!rawAddress && <TouchableOpacity style={styles.addAddressButton} onPress={() => navigation.navigate('Addresses')}><Text style={styles.addAddressText}>Add a delivery address</Text></TouchableOpacity>}
          {!!addressesQuery.data?.length && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.addressChoices}>{addressesQuery.data.map((item) => <TouchableOpacity key={item.id} style={[styles.addressChoice, addressId === item.id && styles.addressChoiceActive]} onPress={() => setAddressId(item.id)}><Text style={styles.addressChoiceText}>{item.label}</Text></TouchableOpacity>)}</ScrollView>}
        </View>

        <View style={styles.section}>
          <SectionTitle title="Delivery time" />
          {deliveryOptions.map((option) => (
            <OptionCard
              key={option.id}
              selected={delivery === option.id}
              icon={option.id === 'asap' ? 'flash-outline' : 'calendar-outline'}
              title={option.title}
              subtitle={option.subtitle}
              onPress={() => setDelivery(option.id)}
            />
          ))}
        </View>

        <View style={styles.section}>
          <SectionTitle title="Payment method" />
          <OptionCard
            selected
            icon="cash-outline"
            title="Cash on delivery"
            subtitle="Pay when the order arrives"
            onPress={() => setPayment('cash')}
          />
        </View>

        <View style={styles.section}>
          <SectionTitle title="Order notes" />
          <TextInput
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
            style={styles.notes}
            placeholder="Any delivery instructions?"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.invoiceCard}>
          <View style={styles.invoiceHeader}>
            <Text style={styles.invoiceTitle}>Invoice preview</Text>
            {!!appliedPromo && <Text style={styles.promoPill}>{appliedPromo.code}</Text>}
          </View>
          {items.map((item) => (
            <View key={item.product.id} style={styles.invoiceItem}>
              <View style={styles.invoiceItemText}>
                <Text style={styles.invoiceName} numberOfLines={1}>{item.product.name}</Text>
                <Text style={styles.invoiceQty}>Qty {item.quantity} • {item.product.unit}</Text>
              </View>
              <Text style={styles.invoiceLineTotal}>{formatCurrency(item.product.price * item.quantity)}</Text>
            </View>
          ))}
          <View style={styles.summaryDivider} />
          <SummaryRow label="Items subtotal" value={formatCurrency(subtotal)} />
          <SummaryRow label="Delivery fee" value={deliveryFee === 0 ? 'Free' : formatCurrency(deliveryFee)} valueColor={deliveryFee === 0 ? colors.success : colors.textPrimary} />
          <SummaryRow label="Service fee" value={formatCurrency(serviceFee)} />
          {discount > 0 && <SummaryRow label="Promo discount" value={`-${formatCurrency(discount)}`} valueColor={colors.success} />}
          <View style={styles.summaryDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Final total</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </View>
          <Text style={styles.invoiceFoot}>
            Cash on delivery • {deliveryOptions.find((item) => item.id === delivery)?.title}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={activeOpacity}
          disabled={placing || count === 0 || !addressId}
          style={[styles.placeButton, (placing || count === 0 || !addressId) && styles.placeButtonDisabled]}
          onPress={submitOrder}
        >
          <Text style={styles.placeText}>{placing ? 'Creating order...' : 'Place order'}</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.dark} />
        </TouchableOpacity>
        {!!submitError && <Text accessibilityRole="alert" style={styles.submitError}>{submitError}</Text>}
      </ScrollView>
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
  headerButton: {
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
  content: { paddingTop: 20 },
  section: { paddingHorizontal: spacing.screen, marginBottom: 22 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.textPrimary, fontSize: 19, fontWeight: '900' },
  editText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  mapPreview: {
    height: 124,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.surface2,
    marginTop: 14,
  },
  mapFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  mapFallbackText: { color: colors.textSecondary, fontSize: 13, fontWeight: '800' },
  addressCard: {
    marginTop: 10,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 15,
    flexDirection: 'row',
    gap: 12,
  },
  addressText: { flex: 1 },
  addressTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  addressLine: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  addressAr: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  addAddressButton: { marginTop: 10, borderRadius: 16, borderWidth: 1, borderColor: colors.primary, padding: 13, alignItems: 'center' },
  addAddressText: { color: colors.primary, fontWeight: '900' },
  addressChoices: { gap: 8, paddingTop: 10 },
  addressChoice: { borderRadius: 20, backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: colors.border },
  addressChoiceActive: { borderColor: colors.primary },
  addressChoiceText: { color: colors.textPrimary, fontWeight: '800' },
  optionCard: {
    marginTop: 12,
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionCardSelected: { borderColor: colors.primary, backgroundColor: colors.surface2 },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1 },
  optionTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '900' },
  optionSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
  notes: {
    height: 88,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 14,
    padding: 15,
    color: colors.textPrimary,
    fontSize: 14,
  },
  invoiceCard: {
    marginHorizontal: spacing.screen,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },
  invoiceHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  invoiceTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900' },
  promoPill: {
    color: colors.dark,
    backgroundColor: colors.primary,
    borderRadius: 12,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '900',
  },
  invoiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    gap: 12,
  },
  invoiceItemText: { flex: 1 },
  invoiceName: { color: colors.textPrimary, fontSize: 14, fontWeight: '800' },
  invoiceQty: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  invoiceLineTotal: { color: colors.textPrimary, fontSize: 14, fontWeight: '900' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  summaryLabel: { color: colors.textSecondary, fontSize: 14 },
  summaryValue: { fontSize: 14, fontWeight: '800' },
  summaryDivider: { height: 1, backgroundColor: colors.surface2, marginVertical: 12 },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { color: colors.textPrimary, fontSize: 17, fontWeight: '900' },
  totalValue: { color: colors.primary, fontSize: 24, fontWeight: '900' },
  invoiceFoot: { color: colors.textSecondary, fontSize: 12, marginTop: 10 },
  placeButton: {
    marginHorizontal: spacing.screen,
    marginTop: 16,
    height: 58,
    borderRadius: spacing.pill,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  placeButtonDisabled: { opacity: 0.7 },
  placeText: { color: colors.dark, fontSize: 16, fontWeight: '900' },
  submitError: { color: colors.error, textAlign: 'center', marginHorizontal: spacing.screen, marginTop: 12, fontWeight: '700' },
});
