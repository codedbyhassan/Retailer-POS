// In-memory rate limiting store
// Format: { key: { count: number, resetTime: timestamp } }
const rateLimitStore = new Map();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

function getUserKey(req) {
  // Use IP address or user ID if available
  return req.user?.id || req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
}

export function createRateLimiter(maxRequests, windowMs) {
  return (req, res, next) => {
    const key = `${getUserKey(req)}`;
    const now = Date.now();

    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    const data = rateLimitStore.get(key);

    if (data.resetTime < now) {
      // Window expired, reset
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    // Still in window
    data.count++;

    if (data.count > maxRequests) {
      const retryAfter = Math.ceil((data.resetTime - now) / 1000);
      return res.status(429).json({
        message: 'Too many requests. Please try again later.',
        retryAfter,
      });
    }

    // Add rate limit headers
    res.set('RateLimit-Limit', maxRequests.toString());
    res.set('RateLimit-Remaining', (maxRequests - data.count).toString());
    res.set('RateLimit-Reset', data.resetTime.toString());

    next();
  };
}

// Pre-configured limiters
export const syncRateLimiter = createRateLimiter(50, 60 * 1000); // 50 per minute
export const barcodeRateLimiter = createRateLimiter(10, 60 * 1000); // 10 per minute
