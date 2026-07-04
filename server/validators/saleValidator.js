export const validateSale = (req, res, next) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'At least one sale item is required' });
  }

  for (const item of items) {
    if (!item.productId || item.quantity === undefined || item.price === undefined) {
      return res.status(400).json({ error: 'Each sale item must have a productId, quantity, and price' });
    }
    if (isNaN(Number(item.quantity)) || Number(item.quantity) <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive number' });
    }
  }

  next();
};
