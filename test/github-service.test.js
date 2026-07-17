import test from 'node:test';
import assert from 'node:assert/strict';
import { getPublicProfilePayload } from '../src/github-service.js';

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

test('getPublicProfilePayload exposes upstream GitHub errors safely', async () => {
  const fetchImpl = async () => new Response(JSON.stringify({ message: 'API rate limit exceeded' }), { status: 403 });
  await assert.rejects(() => getPublicProfilePayload('mage', fetchImpl), /API rate limit exceeded/);
});
