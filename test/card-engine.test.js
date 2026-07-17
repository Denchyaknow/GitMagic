import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCard, classifyColorIdentity, formatAbility } from '../src/card-engine.js';

const profile = {
  login: 'arcane-dev',
  name: 'Arcane Developer',
  bio: 'Making worlds',
  avatar_url: 'https://example.test/avatar.png',
  public_repos: 12,
  followers: 42,
  following: 8,
  created_at: '2020-01-01T00:00:00Z',
};

const repos = [
  { stargazers_count: 120, forks_count: 25, language: 'TypeScript', description: 'Game systems' },
  { stargazers_count: 10, forks_count: 2, language: 'C#', description: 'Unity spells' },
  { stargazers_count: 3, forks_count: 1, language: 'TypeScript', description: 'Tools' },
];

test('classifyColorIdentity maps languages to a deterministic MTG color identity', () => {
  assert.deepEqual(classifyColorIdentity(['TypeScript', 'C#']), ['U', 'R']);
  assert.deepEqual(classifyColorIdentity(['Python']), ['G']);
  assert.deepEqual(classifyColorIdentity([]), ['C']);
});

test('formatAbility converts technical GitHub signals into readable card rules', () => {
  const text = formatAbility({ name: 'Forked Genius', type: 'triggered', value: 25 });
  assert.match(text, /25/);
  assert.match(text, /Fork/i);
});

test('buildCard produces a complete playable legendary developer card from public profile data', () => {
  const card = buildCard(profile, repos);

  assert.equal(card.name, 'Arcane Developer');
  assert.equal(card.typeLine, 'Legendary Creature — Developer Wizard');
  assert.deepEqual(card.colors, ['U', 'R']);
  assert.match(card.manaCost, /^\{\d+\}\{U\}\{R\}/);
  assert.ok(card.power >= 1 && card.power <= 12);
  assert.ok(card.toughness >= 1 && card.toughness <= 12);
  assert.equal(card.abilities.length, 3);
  assert.match(card.oracleText, /GitHub/i);
  assert.equal(card.flavorText, 'Making worlds');
  assert.equal(card.stats.stars, 133);
});
