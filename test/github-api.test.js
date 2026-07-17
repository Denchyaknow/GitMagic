import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchGitHubProfile } from '../src/github-api.js';

test('fetchGitHubProfile uses the same-origin serverless profile endpoint', async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    return new Response(JSON.stringify({
      profile: { login: 'mage', public_repos: 1 },
      repos: [{ name: 'starred', stargazers_count: 99, language: 'Rust' }],
    }), { status: 200 });
  };

  const result = await fetchGitHubProfile(' mage ', fetchImpl);

  assert.equal(result.profile.login, 'mage');
  assert.equal(result.repos[0].name, 'starred');
  assert.equal(calls.length, 1);
  assert.match(calls[0], /^\/api\/profile\?username=mage$/);
});

test("fetchGitHubProfile rejects missing users with GitHub's message", async () => {
  const fetchImpl = async () => new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 });
  await assert.rejects(() => fetchGitHubProfile('missing', fetchImpl), /Not Found/);
});
