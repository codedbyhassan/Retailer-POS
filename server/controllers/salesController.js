import * as salesService from '../services/salesService.js';

export const getSales = (req, res) => {
  try {
    const sales = salesService.getSales();
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve sales' });
  }
};

export const createSale = (req, res) => {
  try {
    const user = req.user;
    const saleData = req.body;

    if (!saleData.items || !Array.isArray(saleData.items) || saleData.items.length === 0) {
      return res.status(400).json({ error: 'At least one sale item is required' });
    }

    const newSale = salesService.createSale(user, saleData);
    res.status(201).json(newSale);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process sale' });
  }
};
