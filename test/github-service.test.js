import test from 'node:test';
import assert from 'node:assert/strict';
import { getPublicProfilePayload, validateUsername } from '../src/github-service.js';

test('getPublicProfilePayload trims a username and returns profile plus repositories', async () => {
  const requested = [];
  const fetchImpl = async (url) => {
    requested.push(url);
    return new Response(JSON.stringify(url.endsWith('/users/mage') ? { login: 'mage' } : [{ name: 'spellbook' }]), { status: 200 });
  };

  const payload = await getPublicProfilePayload(' @mage ', fetchImpl);

  assert.equal(payload.profile.login, 'mage');
  assert.equal(payload.repos[0].name, 'spellbook');
  assert.match(requested[0], /\/users\/mage$/);
  assert.match(requested[1], /\/repos\?per_page=100&sort=updated$/);
});

test('validateUsername rejects malformed GitHub usernames before calling GitHub', () => {
  assert.throws(() => validateUsername('mage/../../admin'), /valid GitHub username/);
  assert.throws(() => validateUsername('a'.repeat(40)), /valid GitHub username/);
});

test('getPublicProfilePayload preserves useful upstream status information', async () => {
  const fetchImpl = async () => new Response(JSON.stringify({ message: 'API rate limit exceeded' }), { status: 403 });
  await assert.rejects(
    () => getPublicProfilePayload('mage', fetchImpl),
    (error) => error.status === 429 && /rate limit/i.test(error.message),
  );
});

test('getPublicProfilePayload handles non-JSON upstream failures', async () => {
  const fetchImpl = async () => new Response('not-json', { status: 502 });
  await assert.rejects(
    () => getPublicProfilePayload('mage', fetchImpl),
    (error) => error.status === 502 && /GitHub returned 502/.test(error.message),
  );
});

test('getPublicProfilePayload sends an optional token only in the server request headers', async () => {
  const headers = [];
  const fetchImpl = async (_url, options) => {
    headers.push(options.headers);
    return new Response(JSON.stringify({ login: 'mage' }), { status: 200 });
  };
  await getPublicProfilePayload('mage', fetchImpl, 'server-token');
  assert.deepEqual(headers, [
    { Accept: 'application/vnd.github+json', Authorization: 'Bearer server-token' },
    { Accept: 'application/vnd.github+json', Authorization: 'Bearer server-token' },
  ]);
});
