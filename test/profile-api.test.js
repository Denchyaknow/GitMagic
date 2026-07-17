import test from 'node:test';
import assert from 'node:assert/strict';
import { createProfileHandler } from '../api/profile.js';

function responseRecorder() {
  return { statusCode: 0, headers: {}, body: null, status(code) { this.statusCode = code; return this; }, setHeader(name, value) { this.headers[name] = value; }, json(value) { this.body = value; return this; } };
}

test('profile handler responds with public profile data and cache headers', async () => {
  const handler = createProfileHandler(async (username) => ({ profile: { login: username }, repos: [] }));
  const response = responseRecorder();
  await handler({ query: { username: 'mage' } }, response);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.profile.login, 'mage');
  assert.match(response.headers['Cache-Control'], /s-maxage/);
});

test('profile handler converts service failures into a safe 400 response', async () => {
  const handler = createProfileHandler(async () => { throw new Error('Not Found'); });
  const response = responseRecorder();
  await handler({ query: { username: 'missing' } }, response);
  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, { error: 'Not Found' });
});
