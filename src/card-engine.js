const LANGUAGE_COLORS = {
  JavaScript: ['R'],
  TypeScript: ['U'],
  Python: ['G'],
  'C#': ['R'],
  'C++': ['R'],
  C: ['R'],
  Rust: ['R'],
  Go: ['W'],
  Java: ['W'],
  Kotlin: ['W'],
  Swift: ['W'],
  Ruby: ['B'],
  PHP: ['B'],
  Shell: ['B'],
  HTML: ['W'],
  CSS: ['W'],
};

const COLOR_ORDER = ['W', 'U', 'B', 'R', 'G'];

export function classifyColorIdentity(languages) {
  const colors = new Set();
  for (const language of languages) {
    for (const color of LANGUAGE_COLORS[language] ?? []) colors.add(color);
  }
  const ordered = COLOR_ORDER.filter((color) => colors.has(color));
  return ordered.length ? ordered : ['C'];
}

export function formatAbility(ability) {
  if (ability.name === 'Forked Genius') {
    return `Whenever a repository you control gains a star, put a +1/+1 counter on GitMagic. This ability has forked ${ability.value} times.`;
  }
  if (ability.name === 'Commit Ritual') {
    return `At the beginning of your upkeep, scry ${Math.max(1, Math.min(3, ability.value))}.`;
  }
  return `${ability.name} — ${ability.value}`;
}

function integer(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function archetypeFor(repos, colors) {
  const languages = repos.map((repo) => repo.language).filter(Boolean);
  if (languages.some((language) => language === 'C#' || language === 'C++')) return 'Developer Wizard';
  if (colors.includes('G')) return 'Developer Druid';
  if (colors.includes('B')) return 'Developer Rogue';
  return 'Developer Wizard';
}

export function buildCard(profile, repos) {
  const safeRepos = Array.isArray(repos) ? repos : [];
  const stars = safeRepos.reduce((total, repo) => total + integer(repo.stargazers_count), 0);
  const forks = safeRepos.reduce((total, repo) => total + integer(repo.forks_count), 0);
  const languages = safeRepos.map((repo) => repo.language).filter(Boolean);
  const colors = classifyColorIdentity(languages);
  const followers = integer(profile.followers);
  const publicRepos = integer(profile.public_repos);
  const colorCost = colors.map((color) => `{${color}}`).join('');
  const genericCost = Math.max(1, Math.min(7, 1 + Math.floor((stars + followers + publicRepos) / 80)));
  const power = Math.max(1, Math.min(12, 1 + Math.floor((stars + followers) / 25)));
  const toughness = Math.max(1, Math.min(12, 2 + Math.floor((publicRepos + forks) / 10)));
  const commitValue = Math.max(1, Math.min(3, Math.ceil(publicRepos / 12)));
  const abilities = [
    { name: 'Commit Ritual', type: 'triggered', value: commitValue },
    { name: 'Forked Genius', type: 'triggered', value: forks },
    { name: 'Open Source', type: 'activated', value: followers },
  ];
  const displayName = profile.name?.trim() || profile.login || 'Unknown Planeswalker';

  return {
    name: displayName,
    login: profile.login ?? '',
    avatarUrl: profile.avatar_url ?? '',
    colors,
    manaCost: `{${genericCost}}${colorCost}`,
    typeLine: `Legendary Creature — ${archetypeFor(safeRepos, colors)}`,
    power,
    toughness,
    abilities,
    oracleText: `Forged from public GitHub signals: ${publicRepos} repositories, ${stars} stars, ${forks} forks, and ${followers} followers.`,
    flavorText: profile.bio?.trim() || 'Every pull request is a spell waiting to resolve.',
    stats: { stars, forks, followers, repos: publicRepos },
  };
}
