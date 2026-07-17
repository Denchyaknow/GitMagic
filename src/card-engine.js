const COLOR_ORDER = ['W', 'U', 'B', 'R', 'G'];
const DOMAIN_MATCHES = {
  game: /\b(game|unity|unreal|gameplay|shader|graphics|vfx|render|animation|jam)\b/g,
  tooling: /\b(tool(?:s|ing)?|system(?:s)?|framework(?:s)?|librar(?:y|ies)|package(?:s)?|sdk|plugin(?:s)?|editor|engine)\b/g,
  ai: /\b(ai|machine learning|ml|llm|model|neural|data)\b/g,
  infrastructure: /\b(devops|cloud|docker|kubernetes|infra|server|network|database|deploy)\b/g,
  security: /\b(security|crypto|auth|privacy|exploit|pentest)\b/g,
  documentation: /\b(doc|guide|tutorial|readme|wiki|knowledge)\b/g,
};

const ARCHETYPES = {
  game: {
    type: 'Human Artificer',
    epithet: 'Prototype Conjurer',
    mechanics: [
      ['keyword', 'Haste'],
      ['triggered', 'Whenever one or more artifact creatures you control attack, create a Prototype artifact token.'],
      ['payoff', 'Sacrifice an artifact: Scry 1, then this creature gets +1/+0 until end of turn.'],
    ],
    flavor: 'Every prototype is a promise looking for a world to inhabit.',
  },
  tooling: {
    type: 'Human Artificer',
    epithet: 'Architect of Living Systems',
    mechanics: [
      ['keyword', 'Vigilance'],
      ['triggered', 'Whenever you cast your second noncreature spell each turn, investigate.'],
      ['payoff', 'Remove three build counters from this creature: Create a Prototype artifact creature token.'],
    ],
    flavor: 'Build it once to understand it. Build it again to make it survive.',
  },
  ai: {
    type: 'Human Wizard',
    epithet: 'Seer of Branching Paths',
    mechanics: [
      ['keyword', 'Ward {1}'],
      ['triggered', 'Whenever you cast a noncreature spell, surveil 1.'],
      ['payoff', 'Choose one — Draw a card; or create a 1/1 colorless Servo artifact creature token.'],
    ],
    flavor: 'The future is never predicted. It is iterated.',
  },
  infrastructure: {
    type: 'Human Engineer',
    epithet: 'Warden of the Stack',
    mechanics: [
      ['keyword', 'Vigilance'],
      ['triggered', 'At the beginning of your upkeep, put a stability counter on this creature.'],
      ['payoff', 'Remove a stability counter: Prevent the next 2 damage that would be dealt to any target.'],
    ],
    flavor: 'Reliability is a spell cast long before anyone needs it.',
  },
  security: {
    type: 'Human Rogue',
    epithet: 'Keeper of Closed Gates',
    mechanics: [
      ['keyword', 'Ward {2}'],
      ['triggered', 'Whenever an opponent targets you or a permanent you control, surveil 1.'],
      ['payoff', 'Pay 1 life: Counter target ability unless its controller pays {1}.'],
    ],
    flavor: 'Every safeguard begins with the question no one else asked.',
  },
  documentation: {
    type: 'Human Advisor',
    epithet: 'Scribe of Open Roads',
    mechanics: [
      ['keyword', 'Vigilance'],
      ['triggered', 'Whenever another creature enters, investigate.'],
      ['payoff', 'Sacrifice a Clue: Creatures you control gain ward {1} until end of turn.'],
    ],
    flavor: 'A clear path is the kindest kind of magic.',
  },
};

function integer(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function date(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
}

function countMatches(text, matcher) {
  return (text.match(matcher) || []).length;
}

function domainScores(repos) {
  const scores = Object.fromEntries(Object.keys(DOMAIN_MATCHES).map((key) => [key, 0]));
  for (const repo of repos) {
    const text = [repo.name, repo.description, ...(repo.topics || [])].filter(Boolean).join(' ').toLowerCase();
    for (const [domain, matcher] of Object.entries(DOMAIN_MATCHES)) scores[domain] += countMatches(text, matcher);
  }
  return scores;
}

function rankedDomains(scores) {
  return Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([domain]) => domain);
}

function signalColorScores({ domains, languageDiversity, activeRatio, longevityYears, forkRatio }) {
  return {
    W: domains.documentation * 2 + Math.min(2, forkRatio * 4),
    U: domains.tooling * 2.5 + domains.ai * 2 + Math.min(3, languageDiversity),
    B: domains.security * 3 + domains.infrastructure + Math.min(1, forkRatio * 2),
    R: domains.game * 2 + Math.min(2, activeRatio * 2),
    G: domains.tooling + Math.min(3, longevityYears / 2) + (activeRatio > 0.45 ? 1 : 0),
  };
}

function colorsFromScores(scores) {
  const ranked = Object.entries(scores).sort((left, right) => right[1] - left[1] || COLOR_ORDER.indexOf(left[0]) - COLOR_ORDER.indexOf(right[0]));
  const strongest = ranked[0]?.[1] || 0;
  if (!strongest) return ['C'];
  const chosen = ranked.filter(([, score], index) => index === 0 || (index < 3 && score >= strongest * 0.55 && score >= 2)).map(([color]) => color);
  return COLOR_ORDER.filter((color) => chosen.includes(color));
}

function hash(value) {
  return Array.from(value).reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 7);
}

export function formatAbility(ability) {
  return ability.text;
}

export function analyzeProfile(profile, repos, { now = new Date() } = {}) {
  const safeRepos = Array.isArray(repos) ? repos : [];
  const original = safeRepos.filter((repo) => !repo.fork);
  const forked = safeRepos.filter((repo) => repo.fork);
  const relevant = original.length ? original : safeRepos;
  const languages = [...new Set(relevant.map((repo) => repo.language).filter(Boolean))];
  const cutoff = new Date(now.valueOf() - 180 * 24 * 60 * 60 * 1000);
  const active = relevant.filter((repo) => date(repo.pushed_at)?.valueOf() >= cutoff.valueOf());
  const accountStart = date(profile.created_at) || now;
  const longestRepo = relevant.reduce((oldest, repo) => {
    const created = date(repo.created_at);
    return created && created < oldest ? created : oldest;
  }, now);
  const longevityYears = Math.max(0, (now - longestRepo) / (365.25 * 24 * 60 * 60 * 1000));
  const domains = domainScores(relevant);
  const stars = relevant.reduce((total, repo) => total + integer(repo.stargazers_count), 0);
  const forks = relevant.reduce((total, repo) => total + integer(repo.forks_count), 0);
  const signals = {
    originalRepos: original.length,
    forkedRepos: forked.length,
    stars,
    forks,
    accountAgeYears: Math.max(0, (now - accountStart) / (365.25 * 24 * 60 * 60 * 1000)),
    longevityYears,
    activeRepos: active.length,
    activeRatio: relevant.length ? active.length / relevant.length : 0,
    forkRatio: safeRepos.length ? forked.length / safeRepos.length : 0,
    languageDiversity: languages.length,
    languages,
    domains,
    rankedDomains: rankedDomains(domains),
    signatureRepos: relevant.slice().sort((a, b) => integer(b.stargazers_count) - integer(a.stargazers_count)).slice(0, 3).map((repo) => repo.name).filter(Boolean),
  };
  signals.colorScores = signalColorScores(signals);
  return signals;
}

export function buildCard(profile, repos, options = {}) {
  const signals = analyzeProfile(profile, repos, options);
  const primaryDomain = signals.rankedDomains[0] || 'tooling';
  const archetype = ARCHETYPES[primaryDomain] || ARCHETYPES.tooling;
  const colors = colorsFromScores(signals.colorScores);
  const significantDomains = signals.rankedDomains.length;
  const rarityScore = significantDomains + (signals.activeRatio > 0.45 ? 1 : 0) + (signals.longevityYears > 4 ? 1 : 0) + (signals.languageDiversity > 3 ? 1 : 0);
  const rarity = rarityScore >= 6 ? 'mythic' : rarityScore >= 4 ? 'rare' : rarityScore >= 2 ? 'uncommon' : 'common';
  const genericCost = Math.max(1, Math.min(4, 1 + colors.length + (rarity === 'mythic' ? 1 : 0)));
  const displayName = profile.name?.trim() || profile.login || 'Unknown Artificer';
  const power = Math.max(2, Math.min(6, 2 + (signals.activeRatio > 0.45 ? 1 : 0) + (significantDomains > 2 ? 1 : 0)));
  const toughness = Math.max(2, Math.min(7, 3 + (signals.longevityYears > 3 ? 1 : 0) + (signals.accountAgeYears > 5 ? 1 : 0)));
  const snapshotDate = (options.now || new Date()).toISOString().slice(0, 10);

  return {
    name: `${displayName}, ${archetype.epithet}`,
    login: profile.login ?? '',
    colors,
    mana: { generic: genericCost, colors },
    typeLine: `Legendary Creature — ${archetype.type}`,
    mechanics: archetype.mechanics.map(([kind, text]) => ({ kind, text })),
    flavorText: archetype.flavor,
    power,
    toughness,
    rarity,
    visualMotifs: { domains: signals.rankedDomains, seed: hash(profile.login || displayName), primaryDomain },
    provenance: { ...signals, snapshotDate, generatorVersion: '2.0', handle: profile.login ?? '' },
  };
}
