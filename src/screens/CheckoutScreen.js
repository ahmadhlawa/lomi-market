import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
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
import { useCart } from '../context/CartContext';
import {
  activeOpacity,
  colors,
  formatPrice,
  globalStyles,
  mapDarkStyle,
  mapRegion,
  spacing,
} from '../theme';

function Header({ onBack }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity activeOpacity={activeOpacity} style={styles.headerButton} onPress={onBack}>
        <Ionicons name="arrow-back" size={25} color={colors.primary} />
      </TouchableOpacity>
      <View style={styles.headerTitleWrap}>
        <Text style={styles.headerTitle}>CHECKOUT</Text>
        <Text style={styles.headerTitleAr}>الدفع</Text>
      </View>
      <View style={styles.headerButton} />
    </View>
  );
}

function SectionTitle({ title, ar, action }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionTitleAr}>{ar}</Text>
      </View>
      {action && (
        <TouchableOpacity activeOpacity={activeOpacity}>
          <Text style={styles.editText}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function PaymentOption({ selected, icon, title, subtitle, onPress }) {
  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      style={[styles.paymentOption, selected && styles.paymentOptionSelected]}
      onPress={onPress}
    >
      <View style={styles.paymentIcon}>
        <Ionicons name={icon} size={21} color={colors.primary} />
      </View>
      <View style={styles.paymentText}>
        <Text style={styles.paymentTitle}>{title}</Text>
        <Text style={styles.paymentSubtitle}>{subtitle}</Text>
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  );
}

export default function CheckoutScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { total } = useCart();
  const [payment, setPayment] = useState('card');

  const placeOrder = () => {
    navigation.getParent()?.navigate('OrdersTab', { screen: 'OrderTracking' });
  };

  return (
    <SafeAreaView edges={['top']} style={globalStyles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <Header onBack={() => navigation.goBack()} />
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: 26 + insets.bottom }]}
        >
          <View style={styles.section}>
            <SectionTitle title="Delivery Address" ar="عنوان التوصيل" action="Edit" />
            <View style={styles.mapPreview}>
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
                  <View style={styles.mapPin}>
                    <Ionicons name="location" size={32} color={colors.primary} />
                  </View>
                </Marker>
              </MapView>
            </View>
            <View style={styles.addressCard}>
              <Ionicons name="home" size={22} color={colors.primary} />
              <View style={styles.addressText}>
                <Text style={styles.addressTitle}>King Fahd Road, Ramallah</Text>
                <Text style={styles.addressLine}>Building 4, Apt 12</Text>
                <Text style={styles.addressAr}>شارع الملك فهد، رام الله - عمارة 4، شقة 12</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <SectionTitle title="Delivery Time" ar="وقت التوصيل" />
            <View style={styles.deliveryCard}>
              <View style={styles.deliveryIcon}>
                <Ionicons name="flash" size={21} color={colors.dark} />
              </View>
              <View style={styles.deliveryText}>
                <Text style={styles.deliveryTitle}>Immediate Delivery</Text>
                <Text style={styles.deliveryAr}>توصيل مباشر</Text>
              </View>
              <View style={styles.deliveryTime}>
                <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.deliveryTimeText}>25-35 mins • دقيقة 35-25</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <SectionTitle title="Payment Method" ar="طريقة الدفع" />
            <View style={styles.paymentList}>
              <PaymentOption
                selected={payment === 'card'}
                icon="card-outline"
                title="Credit Card"
                subtitle="**** **** **** 4242"
                onPress={() => setPayment('card')}
              />
              <PaymentOption
                selected={payment === 'cash'}
                icon="cash-outline"
                title="Cash on Delivery"
                subtitle="الدفع عند الاستلام"
                onPress={() => setPayment('cash')}
              />
            </View>
          </View>

          <View style={styles.section}>
            <SectionTitle title="Order Notes" ar="ملاحظات الطلب" />
            <TextInput
              multiline
              textAlignVertical="top"
              style={styles.notes}
              placeholder="Any special instructions for delivery?"
              placeholderTextColor="#444"
            />
          </View>

          <View style={styles.placeCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(total)} ₪</Text>
            </View>
            <TouchableOpacity activeOpacity={activeOpacity} style={styles.placeButton} onPress={placeOrder}>
              <Text style={styles.placeText}>PLACE ORDER</Text>
              <Text style={styles.placeTextAr}>تأكيد الطلب</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 2,
  },
  headerTitleAr: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  content: {
    paddingTop: 22,
  },
  section: {
    paddingHorizontal: spacing.screen,
    marginBottom: 24,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: '900',
  },
  sectionTitleAr: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 6,
  },
  editText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  mapPreview: {
    height: 120,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.surface2,
    marginTop: 14,
  },
  mapPin: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressCard: {
    marginTop: 10,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    gap: 12,
  },
  addressText: {
    flex: 1,
  },
  addressTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  addressLine: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  addressAr: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    writingDirection: 'rtl',
  },
  deliveryCard: {
    marginTop: 14,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: colors.primaryDim,
  },
  deliveryIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryText: {
    flex: 1,
  },
  deliveryTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  deliveryAr: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  deliveryTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 120,
  },
  deliveryTimeText: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  paymentList: {
    gap: 10,
    marginTop: 14,
  },
  paymentOption: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentOptionSelected: {
    backgroundColor: colors.surface2,
  },
  paymentIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentText: {
    flex: 1,
  },
  paymentTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  paymentSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    letterSpacing: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  notes: {
    height: 86,
    backgroundColor: colors.surface,
    borderRadius: 18,
    marginTop: 14,
    padding: 15,
    color: colors.textPrimary,
    fontSize: 14,
  },
  placeCard: {
    marginHorizontal: spacing.screen,
    backgroundColor: 'rgba(30,30,30,0.96)',
    borderRadius: 24,
    padding: 18,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
  },
  placeButton: {
    marginTop: 15,
    height: 60,
    borderRadius: spacing.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeText: {
    color: colors.dark,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1,
  },
  placeTextAr: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },
});
