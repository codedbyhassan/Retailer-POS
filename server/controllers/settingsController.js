import { serverDb } from '../config/db.js';

export const getSettings = (req, res) => {
  try {
    const settings = serverDb.getSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve settings' });
  }
};

export const updateSettings = (req, res) => {
  try {
    const { businessName, currency, currencySymbol, taxRate, receiptFooter } = req.body;
    const settings = {
      businessName: businessName || 'Retailer Shop',
      currency: currency || 'USD',
      currencySymbol: currencySymbol || '$',
      taxRate: taxRate !== undefined ? Number(taxRate) : 15,
      receiptFooter: receiptFooter || ''
    };

    serverDb.updateSettings(settings);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
};
