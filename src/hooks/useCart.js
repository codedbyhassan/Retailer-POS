import { useState, useCallback } from 'react';

function generateIdempotencyKey(items, total) {
  const itemsStr = [...items]
    .sort((a, b) => a.product_id.localeCompare(b.product_id))
    .map(i => `${i.product_id}:${i.quantity}:${Number(i.price).toFixed(2)}`)
    .join('|');
  const key = `${itemsStr}:${Number(total).toFixed(2)}`;
  let hash = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `txn_${(hash >>> 0).toString(16)}`;
}

export function useCart() {
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [lastIdempotencyKey, setLastIdempotencyKey] = useState(null);

  const addItem = useCallback((product) => {
    const available = Math.max(0, Number(product.quantity) || 0);
    if (available < 1) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        if (existing.quantity >= existing.max_quantity) return prev;
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          price: Number(product.selling_price) || 0,
          cost_price: Number(product.cost_price) || 0,
          max_quantity: available,
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
          const requested = Number(quantity);
          const q = Number.isFinite(requested) ? Math.max(1, Math.min(Math.floor(requested), i.max_quantity)) : 1;
          return { ...i, quantity: q };
        })
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setDiscount(0);
  }, []);

  const setValidatedDiscount = useCallback((value) => {
    const numeric = Number(value);
    setDiscount(Number.isFinite(numeric) ? Math.max(0, Math.min(100, numeric)) : 0);
  }, []);

  const subtotal = items.reduce((sum, i) => sum + (Number(i.price) || 0) * i.quantity, 0);
  const discountAmount = subtotal * (discount / 100);
  const afterDiscount = Math.max(0, subtotal - discountAmount);

  const generateTransactionKey = useCallback(() => {
    const key = generateIdempotencyKey(items, afterDiscount);
    setLastIdempotencyKey(key);
    return key;
  }, [items, afterDiscount]);

  return {
    items,
    discount,
    setDiscount: setValidatedDiscount,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    subtotal,
    discountAmount,
    afterDiscount,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    lastIdempotencyKey,
    generateTransactionKey,
  };
}
