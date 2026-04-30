import React, { createContext, useContext, useMemo, useState } from 'react';
import { products } from '../data/mockData';

const CartContext = createContext(null);

const initialItems = [
  { product: products[0], quantity: 2 },
  { product: products[4], quantity: 1 },
  { product: products[5], quantity: 1 },
];

export function CartProvider({ children }) {
  const [items, setItems] = useState(initialItems);

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

  const clearCart = () => setItems([]);

  const value = useMemo(() => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const deliveryFee = count > 0 ? 5 : 0;
    const total = subtotal + deliveryFee;

    return {
      items,
      count,
      subtotal,
      deliveryFee,
      total,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return context;
}
