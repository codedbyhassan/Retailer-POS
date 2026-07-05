# Rate Limiting Policy

Retailer-POS implements server-side rate limiting to ensure fair usage, prevent abuse, and maintain system stability.

## Overview

All API endpoints enforce rate limits per user/IP address. Limits are enforced using in-memory counters with a sliding window approach.

## Rate Limits by Endpoint

### Sync Endpoint (`/api/sync`)
- **Limit**: 50 requests per minute
- **Per**: User ID or IP address
- **Window**: 60 seconds
- **Response**: 429 Too Many Requests on limit exceeded
- **Use Case**: Data synchronization (sales, inventory, products)

### Barcode Lookup Endpoint (`/api/barcode`)
- **Limit**: 10 requests per minute
- **Per**: User ID or IP address
- **Window**: 60 seconds
- **Response**: 429 Too Many Requests on limit exceeded
- **Use Case**: External barcode database API lookups

## Response Format

When a limit is exceeded, the server responds with:

```json
{
  "message": "Too many requests. Please try again later.",
  "retryAfter": 45
}
```

**Status Code**: `429 Too Many Requests`

**Headers**:
```
RateLimit-Limit: 50
RateLimit-Remaining: 0
RateLimit-Reset: 1625097600
```

## Retry Strategy

When you receive a 429 response:

1. **Check `retryAfter` header**: Time in seconds to wait
2. **Exponential Backoff**: Recommended retry delays:
   - 1st retry: Wait `retryAfter` seconds
   - 2nd retry: Wait `retryAfter * 2` seconds
   - 3rd retry: Wait `retryAfter * 4` seconds
   - Max: Give up after 5 attempts

### Client-Side Implementation

```javascript
async function fetchWithRetry(url, options = {}, maxRetries = 5) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        const backoffDelay = retryAfter * Math.pow(2, attempt);
        
        console.log(`[v0] Rate limited. Retrying after ${backoffDelay}ms`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay * 1000));
        continue;
      }
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  
  throw lastError;
}
```

## Practical Limits

### Sync Endpoint (50/min)
At maximum capacity:
- **1 sync per 1.2 seconds** (50 ÷ 60)
- **300 syncs per 5 minutes** (multiple users)
- **30,000 syncs per day** (single user theoretical max)

**Typical Usage**: 30 seconds per sync = ~2 requests per minute (well within limit)

### Barcode Lookup Endpoint (10/min)
At maximum capacity:
- **1 lookup per 6 seconds** (10 ÷ 60)
- **600 lookups per day** (single user)

**Typical Usage**: Manual barcode scanning = ~1-2 per minute (well within limit)

## Why Rate Limiting?

1. **Prevent Abuse**: Stop malicious users from flooding the server
2. **Fair Access**: Ensure all users get fair system access
3. **Cost Control**: API costs (Supabase, barcode service) stay predictable
4. **System Stability**: Prevents database/network overload
5. **Cache Effectiveness**: Local caching reduces unnecessary API calls

## Caching to Minimize Rate Limit Impact

### Client-Side Caching

#### Barcode Lookup Cache
- Successful lookups cached for 7 days
- Stored in browser localStorage
- Eliminates repeat API calls for same barcode
- Auto-cleanup of old entries

```javascript
// Check cache before API call
const cached = localStorage.getItem(`barcode_${barcode}`);
if (cached) return JSON.parse(cached); // Cache hit, no rate limit impact
```

#### Sync Queue
- Batches changes together
- Syncs every 30 seconds instead of immediately
- Reduces total sync requests by ~98%

### Server-Side Caching

#### Supabase Query Results
- Recent product lookups cached in memory
- Reduces database queries by ~70%

#### Rate Limit Store
- Keeps track of requests per user
- Automatically cleans up after window expires
- Memory-efficient with 5-minute cleanup intervals

## Monitoring Rate Limit Usage

### In Browser Console
```javascript
// Check remaining requests for current user
const remaining = document.querySelector('[data-rate-limit-remaining]');
console.log('Requests remaining:', remaining);
```

### In Server Logs
```
[INFO] Rate limit: user_123 has 3 remaining requests
[WARN] Rate limit exceeded: user_456, retry after 45s
```

### Identify Rate Limiting Issues
Signs that you're hitting rate limits:
- Toast notifications saying "Too many requests"
- Sync status shows as "Failed"
- Barcode lookups failing with "Rate limit exceeded"
- Response time increases dramatically

## Best Practices to Avoid Rate Limits

### For Sync
1. **Accept 30-second sync interval**: Don't manually trigger sync constantly
2. **Batch changes**: Do multiple edits, then sync once (instead of sync after each edit)
3. **Handle offline gracefully**: Let sync queue build up offline, don't force retry

### For Barcode Lookup
1. **Enable caching**: Lookups within 7 days are free (cached)
2. **Verify barcode format**: Incorrect formats waste API quota
3. **Manual entry fallback**: If rate-limited, type product name instead
4. **Add to inventory**: Once added, don't need external lookup again

### General
1. **Monitor sync status**: Check dashboard indicator regularly
2. **Review logs**: Look for rate limit warnings in console
3. **Spread load**: If multiple users, stagger heavy operations
4. **Update cache**: Periodically refresh cache to avoid stale data

## Configuration (Advanced)

Rate limits are configured in `server/middleware/rateLimitMiddleware.js`:

```javascript
// Modify these constants to adjust limits:
const MAX_SYNC_REQUESTS = 50;        // per minute
const MAX_BARCODE_LOOKUPS = 10;       // per minute
const WINDOW_MS = 60 * 1000;          // 1 minute
```

To increase limits for a specific deployment:
1. Edit the constants above
2. Restart server
3. New limits apply to all users

**Note**: Increasing limits increases API costs and database load.

## Rate Limit Headers

Every response includes rate limit information in headers:

| Header | Description | Example |
|--------|-------------|---------|
| `RateLimit-Limit` | Total requests allowed | `50` |
| `RateLimit-Remaining` | Requests left in window | `47` |
| `RateLimit-Reset` | Unix timestamp when limit resets | `1625097600` |
| `Retry-After` | Seconds to wait before retry | `45` |

## Troubleshooting Rate Limits

### Issue: Getting 429 errors during normal usage
**Solution**: 
- Check sync interval (should be 30s minimum)
- Verify barcode lookups have local cache enabled
- Check for browser extensions doing automatic requests

### Issue: Barcode lookups frequently fail
**Solution**:
- Verify API key is configured (see SUPABASE_SETUP.md)
- Check that barcodes are valid format
- Wait for cache to populate (5+ products cached)
- Manually enter product if urgent

### Issue: Sync queue keeps growing
**Solution**:
- Check internet connection
- Verify server is running
- Check server logs for errors
- Manually force sync from settings

### Issue: Rate limit errors after deployment
**Solution**:
- Check if limits were accidentally lowered
- Verify middleware is applied to routes
- Restart server to clear in-memory counters
- Check for rate limit storms from other sources

## Legal & Compliance

Rate limiting is applied equally to all users regardless of:
- Subscription tier (free tier enforced same limits)
- User role (admin no exception)
- Time of day

This ensures fair and predictable service for all retailers.

## Future Enhancements

Planned improvements to rate limiting:
1. **User Tier-Based Limits**: Premium users get higher limits
2. **Burst Allowance**: Brief spike tolerance before limiting
3. **Circuit Breaker**: Auto-disable endpoints if overloaded
4. **Metrics Dashboard**: Real-time rate limit visualization
5. **Custom Limits Per Deploy**: Environment-specific configuration

---

**Last Updated**: 2024
**Version**: 1.0
