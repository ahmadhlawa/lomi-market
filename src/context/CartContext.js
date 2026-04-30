import React, { createContext, useContext, useMemo, useState } from 'react';
import { demoAddress, driver, getTrackingSteps, products } from '../data/mockData';

const CartContext = createContext(null);

const initialItems = [
  { product: products[0], quantity: 2 },
  { product: products[12], quantity: 1 },
  { product: products[18], quantity: 1 },
];

const PROMO_CODE = 'LOMI10';

export function CartProvider({ children }) {
  const [items, setItems] = useState(initialItems);
  const [promoCode, setPromoCode] = useState('');
  const [promoStatus, setPromoStatus] = useState(null);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [lastOrder, setLastOrder] = useState(null);
  const [orderSequence, setOrderSequence] = useState(1);

  const addItem = (product, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...current, { product, quantity }];
    });
  };

  const updateQuantity = (productId, quantity) => {
    setItems((current) => {
      if (quantity <= 0) {
        return current.filter((item) => item.product.id !== productId);
      }
      return current.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      );
    });
  };

  const removeItem = (productId) => {
    setItems((current) => current.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setItems([]);
    setPromoCode('');
    setPromoStatus(null);
    setAppliedPromo(null);
  };

  const applyPromoCode = (value = promoCode) => {
    const normalized = value.trim().toUpperCase();
    setPromoCode(value);

    if (!normalized) {
      setPromoStatus({ type: 'error', message: 'Enter promo code LOMI10 for demo discount.' });
      setAppliedPromo(null);
      return false;
    }

    if (normalized === PROMO_CODE) {
      setAppliedPromo({ code: PROMO_CODE, percentage: 10 });
      setPromoStatus({ type: 'success', message: 'LOMI10 applied. You saved 10%.' });
      return true;
    }

    setAppliedPromo(null);
    setPromoStatus({ type: 'error', message: 'Promo code not valid for this demo.' });
    return false;
  };

  const clearPromo = () => {
    setPromoCode('');
    setPromoStatus(null);
    setAppliedPromo(null);
  };

  const calculateTotals = (cartItems = items) => {
    const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const deliveryFee = count > 0 ? (subtotal >= 99 ? 0 : 7) : 0;
    const serviceFee = count > 0 ? 2 : 0;
    const discount = appliedPromo ? subtotal * (appliedPromo.percentage / 100) : 0;
    const total = Math.max(0, subtotal + deliveryFee + serviceFee - discount);
    return { count, subtotal, deliveryFee, serviceFee, discount, total };
  };

  const placeOrder = ({ payment, notes, delivery, address = demoAddress } = {}) => {
    const snapshot = items.map((item) => ({ ...item }));
    const totals = calculateTotals(snapshot);
    const orderId = `LM-2026-${String(orderSequence).padStart(4, '0')}`;
    const deliveryLabel =
      delivery === 'evening'
        ? 'Today evening'
        : delivery === 'tomorrow'
          ? 'Tomorrow morning'
          : 'ASAP: 30-45 min';
    const paymentMethod = payment === 'cash' ? 'Cash on delivery' : 'Card ending 4242';

    const order = {
      id: orderId,
      orderId,
      date: 'Just now',
      createdAt: new Date().toISOString(),
      name: 'Fresh Grocery Delivery',
      nameAr: 'طلب بقالة طازج',
      items: snapshot,
      itemCount: totals.count,
      extraCount: Math.max(0, snapshot.length - 1),
      subtotal: totals.subtotal,
      deliveryFee: totals.deliveryFee,
      serviceFee: totals.serviceFee,
      discount: totals.discount,
      total: totals.total,
      promoCode: appliedPromo?.code || null,
      status: 'placed',
      eta: delivery === 'asap' || !delivery ? '35 mins' : deliveryLabel,
      address,
      paymentMethod,
      deliveryTime: deliveryLabel,
      notes: notes || '',
      trackingSteps: getTrackingSteps('placed'),
      driver,
      image: snapshot[0]?.product.image || products[0].image,
    };

    setOrderSequence((value) => value + 1);
    setLastOrder(order);
    clearCart();
    return order;
  };

  const value = useMemo(() => {
    const totals = calculateTotals(items);

    return {
      items,
      promoCode,
      promoStatus,
      appliedPromo,
      count: totals.count,
      subtotal: totals.subtotal,
      deliveryFee: totals.deliveryFee,
      serviceFee: totals.serviceFee,
      discount: totals.discount,
      total: totals.total,
      lastOrder,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      applyPromoCode,
      clearPromo,
      setPromoCode,
      placeOrder,
    };
  }, [items, promoCode, promoStatus, appliedPromo, lastOrder]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return context;
}
