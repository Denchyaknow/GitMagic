import test from 'node:test';
import assert from 'node:assert/strict';
import { createProfileHandler, createRateLimiter } from '../api/profile.js';

function responseRecorder() {
  return {
    statusCode: 0,
    headers: {},
    body: null,
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name] = value; },
    json(value) { this.body = value; return this; },
  };
}

test('profile handler responds with public profile data and cache headers', async () => {
  const handler = createProfileHandler(async (username) => ({ profile: { login: username }, repos: [] }));
  const response = responseRecorder();
  await handler({ query: { username: 'mage' }, headers: {} }, response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.profile.login, 'mage');
  assert.match(response.headers['Cache-Control'], /s-maxage/);
});

test('profile handler preserves safe upstream response statuses', async () => {
  const handler = createProfileHandler(async () => { const error = new Error('Not Found'); error.status = 404; throw error; });
  const response = responseRecorder();
  await handler({ query: { username: 'missing' }, headers: {} }, response);
  assert.equal(response.statusCode, 404);
  assert.deepEqual(response.body, { error: 'Not Found' });
});

test('profile handler rate-limits an individual forwarded client address', async () => {
  let now = 1_000;
  const rateLimiter = createRateLimiter({ limit: 1, windowMs: 60_000, now: () => now });
  const handler = createProfileHandler(async (username) => ({ profile: { login: username }, repos: [] }), { rateLimiter });
  const first = responseRecorder();
  await handler({ query: { username: 'mage' }, headers: { 'x-forwarded-for': '203.0.113.8' } }, first);
  const second = responseRecorder();
  await handler({ query: { username: 'mage' }, headers: { 'x-forwarded-for': '203.0.113.8' } }, second);
  assert.equal(first.statusCode, 200);
  assert.equal(second.statusCode, 429);
  assert.equal(second.headers['Retry-After'], '60');
  now += 60_001;
  const third = responseRecorder();
  await handler({ query: { username: 'mage' }, headers: { 'x-forwarded-for': '203.0.113.8' } }, third);
  assert.equal(third.statusCode, 200);
});
