import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { trackingSteps } from '../data/mockData';
import {
  activeOpacity,
  colors,
  globalStyles,
  mapDarkStyle,
  mapRegion,
  spacing,
} from '../theme';

const driverImage =
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80';

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
        {!isLast && (
          <View
            style={[
              styles.stepLine,
              (item.state === 'done' || item.state === 'active') && styles.stepLineActive,
            ]}
          />
        )}
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

export default function OrderTrackingScreen({ navigation }) {
  return (
    <SafeAreaView edges={['top']} style={globalStyles.screen}>
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={activeOpacity} style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={25} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.brand}>LOMI MARKET</Text>
        <TouchableOpacity activeOpacity={activeOpacity} style={styles.helpButton}>
          <Text style={styles.helpText}>?</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.mapBackdrop}>
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
      </View>

      <View style={styles.topCard}>
        <View style={styles.arrivalRow}>
          <Text style={styles.arrival}>15 mins</Text>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>ON WAY</Text>
          </View>
        </View>
        <Text style={styles.estimated}>Estimated Arrival • الوقت المقدر</Text>

        <View style={styles.driverCard}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: driverImage }} style={styles.avatar} />
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingBadgeText}>★ 4.9</Text>
            </View>
          </View>
          <View style={styles.driverInfo}>
            <View style={styles.driverNameRow}>
              <Text style={styles.driverName}>Ahmad</Text>
              <Text style={styles.driverNameAr}>أحمد</Text>
            </View>
            <Text style={styles.car}>Toyota Camry • ABC 1234</Text>
          </View>
          <TouchableOpacity activeOpacity={activeOpacity} style={styles.callButton}>
            <Ionicons name="call" size={20} color={colors.dark} />
          </TouchableOpacity>
        </View>

        <View style={styles.stepper}>
          {trackingSteps.map((item, index) => (
            <TrackingStep
              key={item.en}
              item={item}
              isLast={index === trackingSteps.length - 1}
            />
          ))}
        </View>
      </View>
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
    zIndex: 2,
    backgroundColor: colors.dark,
  },
  headerButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  helpButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    color: colors.dark,
    fontSize: 20,
    fontWeight: '900',
  },
  mapBackdrop: {
    ...StyleSheet.absoluteFillObject,
    top: 64,
    opacity: 0.55,
  },
  topCard: {
    marginHorizontal: spacing.screen,
    marginTop: 22,
    backgroundColor: 'rgba(30,30,30,0.96)',
    borderRadius: 22,
    padding: 20,
    zIndex: 1,
  },
  arrivalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arrival: {
    color: colors.primary,
    fontSize: 44,
    fontWeight: '900',
  },
  statusPill: {
    backgroundColor: '#101010',
    borderRadius: spacing.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  statusText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
  estimated: {
    color: colors.textSecondary,
    fontSize: 15,
    marginTop: 4,
  },
  driverCard: {
    marginTop: 24,
    backgroundColor: '#111111',
    borderRadius: 26,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 54,
    height: 54,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  ratingBadge: {
    position: 'absolute',
    right: -5,
    bottom: -3,
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ratingBadgeText: {
    color: colors.dark,
    fontSize: 10,
    fontWeight: '900',
  },
  driverInfo: {
    flex: 1,
  },
  driverNameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  driverName: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '900',
  },
  driverNameAr: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  car: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  callButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepper: {
    marginTop: 28,
    paddingLeft: 10,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 16,
    minHeight: 84,
  },
  stepLeft: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepCircleActive: {
    borderColor: colors.primary,
  },
  stepInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  stepLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.surface3,
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  stepTextWrap: {
    flex: 1,
    paddingTop: 1,
  },
  stepText: {
    fontSize: 17,
    fontWeight: '800',
  },
  stepTextActive: {
    color: colors.textPrimary,
  },
  stepTextPending: {
    color: '#555555',
  },
  stepAr: {
    fontSize: 14,
    marginTop: 3,
  },
  stepArActive: {
    color: colors.textSecondary,
  },
  stepArPending: {
    color: '#444444',
  },
});
