import { getPublicProfilePayload, validateUsername } from '../src/github-service.js';

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 12;

export function createRateLimiter({ limit = RATE_LIMIT_MAX_REQUESTS, windowMs = RATE_LIMIT_WINDOW_MS, now = Date.now } = {}) {
  const clients = new Map();

  return {
    consume(clientKey) {
      const currentTime = now();
      const record = clients.get(clientKey);
      if (!record || currentTime - record.startedAt >= windowMs) {
        clients.set(clientKey, { startedAt: currentTime, count: 1 });
        return { allowed: true, retryAfterSeconds: 0 };
      }
      if (record.count >= limit) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (currentTime - record.startedAt)) / 1_000)),
        };
      }
      record.count += 1;
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}

function getClientKey(request) {
  const forwardedFor = request.headers?.['x-forwarded-for'];
  return typeof forwardedFor === 'string' && forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
}

export function createProfileHandler(getPayload = getPublicProfilePayload, { rateLimiter = createRateLimiter() } = {}) {
  return async function profileHandler(request, response) {
    try {
      const username = validateUsername(request.query?.username);
      const limit = rateLimiter.consume(getClientKey(request));
      if (!limit.allowed) {
        response.setHeader('Retry-After', String(limit.retryAfterSeconds));
        return response.status(429).json({ error: 'Too many profile requests. Try again shortly.' });
      }

      const payload = await getPayload(username, fetch, process.env.GITHUB_TOKEN);
      response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
      return response.status(200).json(payload);
    } catch (error) {
      const status = Number.isInteger(error.status) ? error.status : 502;
      const message = status >= 500 ? 'Unable to reach GitHub. Try again shortly.' : error.message || 'Unable to forge this profile.';
      return response.status(status).json({ error: message });
    }
  };
}

export default createProfileHandler();
