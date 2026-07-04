import { useState, useCallback, useMemo } from 'react';
import { Product, SaleItem } from '../types';

export interface CartItem {
  product: Product;
  quantity: number;
  price: number; // sellingPrice
  subtotal: number;
}

export function useCart(taxRatePercent: number = 15) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  const addItem = useCallback((product: Product) => {
    if (product.quantity <= 0) {
      alert(`Warning: ${product.name} is currently out of stock. You can still add it if needed, but consider checking inventory.`);
    }

    setItems((prevItems) => {
      const existing = prevItems.find((item) => item.product.id === product.id);
      if (existing) {
        return prevItems.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.price,
              }
            : item
        );
      }
      return [
        ...prevItems,
        {
          product,
          quantity: 1,
          price: product.sellingPrice,
          subtotal: product.sellingPrice,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.price,
            }
          : item
      )
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setDiscountPercent(0);
  }, []);

  const applyDiscount = useCallback((percent: number) => {
    const validPercent = Math.max(0, Math.min(100, percent));
    setDiscountPercent(validPercent);
  }, []);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const discountAmount = Number(((subtotal * discountPercent) / 100).toFixed(2));
    const subtotalAfterDiscount = subtotal - discountAmount;
    
    // Calculate tax based on the discounted amount
    const taxAmount = Number(((subtotalAfterDiscount * taxRatePercent) / 100).toFixed(2));
    const total = Number((subtotalAfterDiscount + taxAmount).toFixed(2));

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total,
      discountPercent,
    };
  }, [items, discountPercent, taxRatePercent]);

  return {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    applyDiscount,
    totals,
  };
}
