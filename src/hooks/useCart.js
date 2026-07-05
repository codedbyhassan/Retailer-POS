import { useState, useCallback } from 'react';

export function useCart() {
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);

  const addItem = useCallback((product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) return prev;
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price: product.selling_price,
          cost_price: product.cost_price,
          max_quantity: product.quantity,
          quantity: 1,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.product_id !== productId) return i;
          const q = Math.max(1, Math.min(quantity, i.max_quantity));
          return { ...i, quantity: q };
        })
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setDiscount(0);
  }, []);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discountAmount = subtotal * (discount / 100);
  const afterDiscount = subtotal - discountAmount;

  return {
    items,
    discount,
    setDiscount,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    discountAmount,
    afterDiscount,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
  };
}
