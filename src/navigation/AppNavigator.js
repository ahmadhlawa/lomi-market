import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors, spacing } from '../theme';
import { useCart } from '../context/CartContext';
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import AuthScreen from '../screens/AuthScreen';
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import OrderTrackingScreen from '../screens/OrderTrackingScreen';
import ProfileScreen from '../screens/ProfileScreen';

const RootStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const OrdersStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.dark,
    card: colors.surface,
    border: colors.surface2,
    text: colors.textPrimary,
    primary: colors.primary,
  },
};

function Badge({ count }) {
  if (!count) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

function TabIcon({ focused, routeName, count }) {
  const iconMap = {
    HomeTab: focused ? 'home' : 'home-outline',
    Explore: focused ? 'search' : 'search-outline',
    OrdersTab: focused ? 'receipt' : 'receipt-outline',
    Profile: focused ? 'person' : 'person-outline',
  };

  return (
    <View style={[styles.tabIconWrap, focused && styles.tabIconActive]}>
      <Ionicons
        name={iconMap[routeName]}
        size={focused ? 24 : 23}
        color={focused ? colors.dark : colors.textMuted}
      />
      {routeName === 'OrdersTab' ? null : routeName === 'HomeTab' ? null : null}
      {routeName === 'OrdersTab' && <Badge count={0} />}
      {routeName === 'HomeTab' && <Badge count={0} />}
      {routeName === 'Explore' && <Badge count={0} />}
      {routeName === 'Profile' && <Badge count={0} />}
      {routeName === 'Cart' && <Badge count={count} />}
    </View>
  );
}

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <HomeStack.Screen name="Cart" component={CartScreen} />
      <HomeStack.Screen name="Checkout" component={CheckoutScreen} />
    </HomeStack.Navigator>
  );
}

function OrdersStackNavigator() {
  return (
    <OrdersStack.Navigator screenOptions={{ headerShown: false }}>
      <OrdersStack.Screen name="OrderHistory" component={OrderHistoryScreen} />
      <OrdersStack.Screen name="OrderTracking" component={OrderTrackingScreen} />
    </OrdersStack.Navigator>
  );
}

function MainTabs() {
  const { count } = useCart();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => (
          <View style={styles.tabIconShell}>
            <TabIcon focused={focused} routeName={route.name} count={count} />
            {route.name === 'HomeTab' && count > 0 && (
              <View style={styles.cartMiniBadge}>
                <Text style={styles.cartMiniBadgeText}>{count}</Text>
              </View>
            )}
          </View>
        ),
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ title: 'Home' }}
      />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStackNavigator}
        options={{ title: 'Orders' }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <RootStack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
          contentStyle: { backgroundColor: colors.dark },
        }}
      >
        <RootStack.Screen name="Splash" component={SplashScreen} />
        <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        <RootStack.Screen name="Auth" component={AuthScreen} />
        <RootStack.Screen name="MainApp" component={MainTabs} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: spacing.tabHeight,
    paddingTop: 7,
    paddingBottom: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.surface2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tabIconShell: {
    width: 48,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconWrap: {
    width: 44,
    height: 34,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.dark,
    fontSize: 10,
    fontWeight: '800',
  },
  cartMiniBadge: {
    position: 'absolute',
    top: -2,
    right: -1,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartMiniBadgeText: {
    color: colors.dark,
    fontSize: 9,
    fontWeight: '800',
  },
});
