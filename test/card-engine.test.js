import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCard } from '../src/card-engine.js';

const profile = {
  login: 'arcane-dev',
  name: 'Arcane Developer',
  bio: 'Making reusable Unity game systems and experimental tools.',
  avatar_url: 'https://example.test/avatar.png',
  public_repos: 12,
  followers: 42,
  created_at: '2020-01-01T00:00:00Z',
};

const repos = [
  { name: 'scene-forge', fork: false, stargazers_count: 120, forks_count: 25, language: 'TypeScript', description: 'Game tools and reusable systems', topics: ['game-development', 'tooling'], created_at: '2020-01-01T00:00:00Z', pushed_at: '2026-07-10T00:00:00Z' },
  { name: 'unity-spells', fork: false, stargazers_count: 10, forks_count: 2, language: 'C#', description: 'Unity gameplay prototypes', topics: ['unity', 'game-dev'], created_at: '2021-01-01T00:00:00Z', pushed_at: '2026-07-01T00:00:00Z' },
  { name: 'upstream-tool', fork: true, stargazers_count: 3, forks_count: 1, language: 'TypeScript', description: 'Adapted tool', topics: ['tooling'], created_at: '2023-01-01T00:00:00Z', pushed_at: '2025-01-01T00:00:00Z' },
];

test('buildCard derives a readable behavioral identity instead of exposing profile totals as rules text', () => {
  const card = buildCard(profile, repos, { now: new Date('2026-07-17T00:00:00Z') });

  assert.deepEqual(card.colors, ['U', 'R', 'G']);
  assert.equal(card.mana.generic, 1);
  assert.equal(card.typeLine, 'Legendary Creature — Human Artificer');
  assert.match(card.name, /^Arcane Developer, /);
  assert.equal(card.mechanics.length, 3);
  assert.equal(card.mechanics[0].kind, 'keyword');
  assert.ok(card.mechanics.map((mechanic) => mechanic.text).join(' ').split(/\s+/).length < 70);
  assert.doesNotMatch(card.mechanics.map((mechanic) => mechanic.text).join(' '), /12 repositories|133 stars|28 forks/i);
  assert.doesNotMatch(card.identitySummary, /\d/);
  assert.ok(['uncommon', 'rare', 'mythic'].includes(card.rarity));
  assert.ok(card.power >= 2 && card.power <= 6);
  assert.ok(card.toughness >= 2 && card.toughness <= 7);
  assert.equal(card.provenance.originalRepos, 2);
  assert.equal(card.provenance.forkedRepos, 1);
  assert.deepEqual(card.visualMotifs.domains.slice(0, 2), ['game', 'tooling']);
});

test('tooling payoff creates and spends its own build counters', () => {
  const card = buildCard(profile, [{
    name: 'framework-forge', fork: false, language: 'TypeScript',
    description: 'Reusable framework tooling, packages, plugins, systems and libraries',
    topics: ['tooling', 'framework', 'library'], created_at: '2020-01-01T00:00:00Z', pushed_at: '2026-07-10T00:00:00Z',
  }], { now: new Date('2026-07-17T00:00:00Z') });

  assert.match(card.mechanics[2].text, /put a build counter/i);
  assert.match(card.mechanics[2].text, /remove three build counters/i);
});
