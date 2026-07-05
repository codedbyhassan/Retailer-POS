// Barcode Lookup Service with local caching and rate limiting
// Uses free Barcode Lookup API with fallback to local search

const BARCODE_API = 'https://api.barcodelookup.com/v2/products';
const API_KEY = import.meta.env.VITE_BARCODE_API_KEY || 'demo'; // Free tier key or user-provided
const CACHE_NAME = 'barcode_cache';
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const MAX_LOOKUPS_PER_MINUTE = 5;

class BarcodeLookupService {
  constructor() {
    this.requestTimestamps = [];
    this.cache = new Map();
    this.loadCacheFromStorage();
  }

  loadCacheFromStorage() {
    try {
      const stored = localStorage.getItem(CACHE_NAME);
      if (stored) {
        const data = JSON.parse(stored);
        this.cache = new Map(data);
      }
    } catch (err) {
      console.warn('[v0] Failed to load barcode cache:', err);
    }
  }

  saveCacheToStorage() {
    try {
      const data = Array.from(this.cache.entries());
      localStorage.setItem(CACHE_NAME, JSON.stringify(data));
    } catch (err) {
      console.warn('[v0] Failed to save barcode cache:', err);
    }
  }

  checkRateLimit() {
    const now = Date.now();
    // Remove timestamps older than the window
    this.requestTimestamps = this.requestTimestamps.filter(
      (ts) => now - ts < RATE_LIMIT_WINDOW
    );

    if (this.requestTimestamps.length >= MAX_LOOKUPS_PER_MINUTE) {
      const oldestRequest = this.requestTimestamps[0];
      const retryAfter = Math.ceil((RATE_LIMIT_WINDOW - (now - oldestRequest)) / 1000);
      throw new Error(`Rate limit exceeded. Try again in ${retryAfter}s`);
    }

    this.requestTimestamps.push(now);
  }

  async lookup(barcode) {
    if (!barcode || barcode.length < 8) {
      throw new Error('Invalid barcode format');
    }

    // Check cache first
    if (this.cache.has(barcode)) {
      console.log('[v0] Barcode found in cache:', barcode);
      return this.cache.get(barcode);
    }

    // Check rate limit
    try {
      this.checkRateLimit();
    } catch (err) {
      console.warn('[v0] Rate limit:', err.message);
      throw err;
    }

    // Only attempt API lookup if API key is configured (not demo)
    if (API_KEY !== 'demo') {
      try {
        console.log('[v0] Looking up barcode via API:', barcode);
        const response = await fetch(
          `${BARCODE_API}?barcode=${barcode}&key=${API_KEY}`,
          { timeout: 5000 }
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.products && data.products.length > 0) {
          const product = data.products[0];
          const result = {
            name: product.title || product.product_name || 'Unknown',
            barcode,
            found: true,
            source: 'api',
          };

          // Cache successful lookups
          this.cache.set(barcode, result);
          this.saveCacheToStorage();

          return result;
        }
      } catch (err) {
        console.warn('[v0] Barcode API lookup failed, using cache/local fallback:', err.message);
      }
    }

    // Return not found (will use local search as fallback in UI)
    return {
      name: null,
      barcode,
      found: false,
      source: 'local',
    };
  }

  // Clear old cache entries (older than 7 days)
  cleanupCache() {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let cleaned = 0;

    for (const [barcode, data] of this.cache.entries()) {
      if (data.timestamp && data.timestamp < oneWeekAgo) {
        this.cache.delete(barcode);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[v0] Cleaned ${cleaned} old barcode cache entries`);
      this.saveCacheToStorage();
    }
  }
}

export const barcodeLookup = new BarcodeLookupService();

// Cleanup cache on app startup
barcodeLookup.cleanupCache();
