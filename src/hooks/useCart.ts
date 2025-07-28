import { useState, useCallback, useMemo } from 'react';
import type { MenuItem, OrderItem } from '@/types';
import { calculateOrderTotal } from '@/utils';
import { VALIDATION } from '@/constants';

interface UseCartReturn {
  cart: OrderItem[];
  cartTotal: number;
  addToCart: (menuItem: MenuItem) => void;
  removeFromCart: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (menuItemId: string) => number;
  isItemInCart: (menuItemId: string) => boolean;
  getCartItemCount: () => number;
}

export const useCart = (): UseCartReturn => {
  const [cart, setCart] = useState<OrderItem[]>([]);

  const cartTotal = useMemo(() => calculateOrderTotal(cart), [cart]);

  const addToCart = useCallback((menuItem: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.menuItem.id === menuItem.id);
      if (existing) {
        const newQuantity = Math.min(existing.quantity + 1, VALIDATION.MAX_ORDER_QUANTITY);
        return prev.map(item => 
          item.menuItem.id === menuItem.id 
            ? { ...item, quantity: newQuantity }
            : item
        );
      }
      return [...prev, { menuItem, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((menuItemId: string) => {
    setCart(prev => {
      return prev.map(item => 
        item.menuItem.id === menuItemId 
          ? { ...item, quantity: Math.max(0, item.quantity - 1) }
          : item
      ).filter(item => item.quantity > 0);
    });
  }, []);

  const updateQuantity = useCallback((menuItemId: string, quantity: number) => {
    const clampedQuantity = Math.max(0, Math.min(quantity, VALIDATION.MAX_ORDER_QUANTITY));
    
    setCart(prev => {
      if (clampedQuantity === 0) {
        return prev.filter(item => item.menuItem.id !== menuItemId);
      }
      
      const existing = prev.find(item => item.menuItem.id === menuItemId);
      if (existing) {
        return prev.map(item => 
          item.menuItem.id === menuItemId 
            ? { ...item, quantity: clampedQuantity }
            : item
        );
      }
      
      return prev;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const getItemQuantity = useCallback((menuItemId: string): number => {
    const item = cart.find(item => item.menuItem.id === menuItemId);
    return item?.quantity || 0;
  }, [cart]);

  const isItemInCart = useCallback((menuItemId: string): boolean => {
    return cart.some(item => item.menuItem.id === menuItemId);
  }, [cart]);

  const getCartItemCount = useCallback((): number => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  return {
    cart,
    cartTotal,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemQuantity,
    isItemInCart,
    getCartItemCount
  };
}; 