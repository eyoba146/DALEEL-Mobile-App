import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CartCheckoutPayload, contentApi, Product } from './api';
import { useAuth } from './auth-context';
import { useNotifications } from './notifications-context';

export interface CartItem {
  product: Product;
  quantity: number;
  addedAt: string;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotalETB: number;
  subtotalUSD: number;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  checkout: (details: Omit<CartCheckoutPayload, 'items'>) => Promise<{
    success: boolean;
    message: string;
    count: number;
    totalETB: number;
  }>;
  isCheckingOut: boolean;
}

const CART_STORAGE_KEY = '@daleel_artisan_cart_v1';
const ETB_TO_USD_RATE = 125; // Approximate diaspora peg

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const { triggerAlert } = useNotifications();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Restore cart on mount
  useEffect(() => {
    async function loadCart() {
      try {
        const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setItems(parsed);
          }
        }
      } catch (e) {
        console.warn('Failed to restore cart from storage:', e);
      } finally {
        setIsLoaded(true);
      }
    }
    loadCart();
  }, []);

  // Save cart changes to storage
  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items)).catch((err) => {
      console.warn('Failed to save cart to storage:', err);
    });
  }, [items, isLoaded]);

  const itemCount = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity, 0);
  }, [items]);

  const subtotalETB = useMemo(() => {
    return items.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  }, [items]);

  const subtotalUSD = useMemo(() => {
    return Math.round((subtotalETB / ETB_TO_USD_RATE) * 100) / 100;
  }, [subtotalETB]);

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    const qtyToAdd = Math.max(1, Math.floor(quantity));
    setItems((prev) => {
      const existingIndex = prev.findIndex((it) => it.product.id === product.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + qtyToAdd,
        };
        return updated;
      }
      return [
        ...prev,
        {
          product,
          quantity: qtyToAdd,
          addedAt: new Date().toISOString(),
        },
      ];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => prev.filter((it) => it.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((it) => it.product.id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((it) =>
        it.product.id === productId ? { ...it, quantity: Math.floor(quantity) } : it
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const checkout = useCallback(
    async (details: Omit<CartCheckoutPayload, 'items'>) => {
      if (items.length === 0) {
        throw new Error('Cart is empty');
      }

      setIsCheckingOut(true);
      try {
        const payload: CartCheckoutPayload = {
          ...details,
          items: items.map((it) => ({
            productId: it.product.id,
            quantity: it.quantity,
          })),
        };

        const res = await contentApi.cartCheckout(payload, token);

        // Clear cart on success
        clearCart();

        // Trigger in-app real-time notification alert
        triggerAlert({
          id: `order-alert-${Date.now()}`,
          title: 'Diaspora Order Request Received!',
          message: `Your order for ${items.length} item(s) (${res.totalETB.toLocaleString()} ETB) is being processed.`,
          type: 'order',
          actionUrl: '/activity',
          isRead: false,
          createdAt: new Date().toISOString(),
        });

        return {
          success: true,
          message: res.message,
          count: res.count,
          totalETB: res.totalETB,
        };
      } finally {
        setIsCheckingOut(false);
      }
    },
    [items, token, clearCart, triggerAlert]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotalETB,
        subtotalUSD,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        checkout,
        isCheckingOut,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
