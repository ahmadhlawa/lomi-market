import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, jsonOptions } from '../api/client';
import { useAuth } from './AuthContext';

const { mapApiProduct } = require('../domain/catalog.cjs');
const CartContext = createContext(null);
const emptyCart = { items: [], item_count: 0, subtotal: '0', delivery_fee: '0', service_fee: '0', discount: '0', total: '0' };

export function CartProvider({ children }) {
  const { authenticated } = useAuth();
  const queryClient = useQueryClient();
  const [promoCode, setPromoCode] = useState('');
  const [promoStatus, setPromoStatus] = useState(null);
  const cartQuery = useQuery({ queryKey: ['cart'], queryFn: () => api('/cart'), enabled: authenticated });
  const cart = cartQuery.data || emptyCart;
  const invalidate = useCallback(async () => { await queryClient.invalidateQueries({ queryKey: ['cart'] }); }, [queryClient]);

  const addMutation = useMutation({ mutationFn: ({ product, quantity }) => api('/cart/items', jsonOptions('POST', { product_id: product.id, quantity })), onSuccess: invalidate });
  const updateMutation = useMutation({ mutationFn: ({ itemId, quantity }) => api(`/cart/items/${itemId}`, jsonOptions('PATCH', { quantity })), onSuccess: invalidate });
  const removeMutation = useMutation({ mutationFn: (itemId) => api(`/cart/items/${itemId}`, { method: 'DELETE' }), onSuccess: invalidate });
  const clearMutation = useMutation({ mutationFn: () => api('/cart', { method: 'DELETE' }), onSuccess: invalidate });

  const items = useMemo(() => cart.items.map((item) => ({ id: item.id, product: mapApiProduct(item.product), quantity: item.quantity, available: item.available, lineTotal: Number(item.line_total) })), [cart.items]);
  const addItem = useCallback((product, quantity = 1) => addMutation.mutateAsync({ product, quantity }), [addMutation]);
  const updateQuantity = useCallback((productId, quantity) => {
    const item = items.find((entry) => entry.product.id === productId);
    if (!item) return Promise.resolve();
    return quantity <= 0 ? removeMutation.mutateAsync(item.id) : updateMutation.mutateAsync({ itemId: item.id, quantity });
  }, [items, removeMutation, updateMutation]);
  const removeItem = useCallback((productId) => {
    const item = items.find((entry) => entry.product.id === productId);
    return item ? removeMutation.mutateAsync(item.id) : Promise.resolve();
  }, [items, removeMutation]);
  const clearCart = useCallback(async () => { await clearMutation.mutateAsync(); setPromoCode(''); setPromoStatus(null); }, [clearMutation]);
  const applyPromoCode = useCallback(async (value = promoCode) => {
    const code = value.trim().toUpperCase();
    setPromoCode(code);
    if (!code) { setPromoStatus({ type: 'error', message: 'Enter a promo code.' }); return false; }
    try {
      await api('/cart/promo', jsonOptions('POST', { code }));
      setPromoStatus({ type: 'success', message: `${code} applied.` });
      await invalidate();
      return true;
    } catch (error) {
      setPromoStatus({ type: 'error', message: error.message });
      return false;
    }
  }, [promoCode, invalidate]);
  const clearPromo = useCallback(async () => { await api('/cart/promo', { method: 'DELETE' }); setPromoCode(''); setPromoStatus(null); await invalidate(); }, [invalidate]);
  const placeOrder = useCallback(async ({ addressId, deliverySlotId, notes } = {}) => {
    const order = await api('/orders', {
      ...jsonOptions('POST', { address_id: addressId, delivery_slot_id: deliverySlotId || null, payment_method: 'cash_on_delivery', notes: notes || '' }),
      headers: { 'Idempotency-Key': `mobile-${Date.now()}-${Math.random().toString(36).slice(2)}` },
    });
    await Promise.all([invalidate(), queryClient.invalidateQueries({ queryKey: ['orders'] })]);
    return order;
  }, [invalidate, queryClient]);

  const value = useMemo(() => ({
    items,
    promoCode,
    promoStatus,
    appliedPromo: cart.promo_code ? { code: cart.promo_code } : null,
    count: cart.item_count,
    subtotal: Number(cart.subtotal),
    deliveryFee: Number(cart.delivery_fee),
    serviceFee: Number(cart.service_fee),
    discount: Number(cart.discount),
    total: Number(cart.total),
    unavailableProductIds: cart.unavailable_product_ids || [],
    loading: cartQuery.isLoading,
    error: cartQuery.error,
    refetch: cartQuery.refetch,
    mutating: addMutation.isPending || updateMutation.isPending || removeMutation.isPending || clearMutation.isPending,
    addItem, updateQuantity, removeItem, clearCart, applyPromoCode, clearPromo, setPromoCode, placeOrder,
  }), [items, promoCode, promoStatus, cart, cartQuery, addMutation.isPending, updateMutation.isPending, removeMutation.isPending, clearMutation.isPending, addItem, updateQuantity, removeItem, clearCart, applyPromoCode, clearPromo, placeOrder]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside CartProvider');
  return value;
}
