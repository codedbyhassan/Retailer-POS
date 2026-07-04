export const validateProduct = (req, res, next) => {
  const { name, sku, barcode, costPrice, sellingPrice } = req.body;
  if (!name || !sku || !barcode) {
    return res.status(400).json({ error: 'Name, SKU, and barcode are required' });
  }
  if (costPrice !== undefined && isNaN(Number(costPrice))) {
    return res.status(400).json({ error: 'Cost price must be a valid number' });
  }
  if (sellingPrice !== undefined && isNaN(Number(sellingPrice))) {
    return res.status(400).json({ error: 'Selling price must be a valid number' });
  }
  next();
};
