import * as productService from '../services/productService.js';

export const getProducts = (req, res) => {
  try {
    const products = productService.getAllProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
};
