/**
 * Real-time Active Visitor & Online Customer Tracker
 * Tracks distinct visitor activity over a sliding 5-minute window
 */
const activeVisitors = new Map();
const ACTIVITY_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function recordVisitorActivity(req) {
  try {
    const url = req.originalUrl || req.url || '';
    // Ignore internal admin API calls and static assets from customer count
    if (url.startsWith('/api/admin') || url.startsWith('/uploads') || url.startsWith('/assets')) {
      return;
    }

    const visitorId =
      req.headers['x-visitor-id'] ||
      (req.headers['authorization'] ? req.headers['authorization'].slice(-16) : null) ||
      req.ip ||
      req.connection?.remoteAddress ||
      'store-visitor';

    activeVisitors.set(visitorId, Date.now());
  } catch (err) {
    // Fail silently
  }
}

function getOnlineCount() {
  const now = Date.now();
  // Clean up expired entries older than 5 minutes
  for (const [id, lastSeen] of activeVisitors.entries()) {
    if (now - lastSeen > ACTIVITY_WINDOW_MS) {
      activeVisitors.delete(id);
    }
  }

  // Always return at least 1 when customers are browsing the site
  return Math.max(1, activeVisitors.size);
}

module.exports = {
  recordVisitorActivity,
  getOnlineCount
};
