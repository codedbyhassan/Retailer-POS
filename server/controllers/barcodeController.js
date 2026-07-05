import { logger } from '../utils/logger.js';

const BARCODE_API = 'https://api.barcodelookup.com/v2/products';
const API_KEY = process.env.BARCODE_API_KEY || 'demo';

export async function handleBarcodeLookup(req, res) {
  try {
    const { barcode } = req.query;

    if (!barcode || barcode.trim().length === 0) {
      return res.status(400).json({ error: 'Barcode parameter is required' });
    }

    logger('info', 'Barcode lookup requested', { barcode });

    // Call external barcode API
    const url = `${BARCODE_API}?barcode=${encodeURIComponent(barcode)}&key=${API_KEY}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Retailer-POS/1.0' },
      timeout: 5000,
    });

    if (!response.ok) {
      logger('warn', 'Barcode API error', { status: response.status, barcode });
      return res.status(response.status).json({ error: 'Barcode lookup failed' });
    }

    const data = await response.json();

    // Return formatted response
    const result = {
      barcode,
      found: data.products && data.products.length > 0,
      products: data.products
        ? data.products.map((p) => ({
            name: p.title || p.product_name || 'Unknown',
            ean: p.ean || barcode,
            category: p.category || 'General',
            images: p.images || [],
          }))
        : [],
    };

    return res.json(result);
  } catch (err) {
    logger('error', 'Barcode lookup error', { message: err.message });

    // Graceful fallback - return not found instead of error
    return res.json({
      barcode: req.query.barcode,
      found: false,
      products: [],
      error: 'Service temporarily unavailable',
    });
  }
}
