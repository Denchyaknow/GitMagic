import { buildCard, formatAbility } from './card-engine.js';
import { fetchGitHubProfile } from './github-api.js';

const elements = {
  form: document.querySelector('#search-form'), username: document.querySelector('#username'), status: document.querySelector('#status'),
  card: document.querySelector('#card'), name: document.querySelector('#card-name'), mana: document.querySelector('#mana-cost'), type: document.querySelector('#type-line'),
  mechanics: document.querySelector('#mechanics'), flavor: document.querySelector('#flavor-text'), pt: document.querySelector('#pt'), rarity: document.querySelector('#rarity'),
  collector: document.querySelector('#collector-number'), snapshot: document.querySelector('#snapshot'), codex: document.querySelector('#codex-name'), identity: document.querySelector('#color-identity'),
  identitySummary: document.querySelector('#identity-summary'), art: document.querySelector('#art-scene'), download: document.querySelector('#download'), copy: document.querySelector('#copy-link'), flip: document.querySelector('#flip-card'),
  backHandle: document.querySelector('#back-handle'), backSnapshot: document.querySelector('#back-snapshot'), backOriginal: document.querySelector('#back-original'), backForked: document.querySelector('#back-forked'),
  backActive: document.querySelector('#back-active'), backAge: document.querySelector('#back-age'), backLongevity: document.querySelector('#back-longevity'), backDomains: document.querySelector('#back-domains'),
  backLanguages: document.querySelector('#back-languages'), backSignatures: document.querySelector('#back-signatures'), backGenerator: document.querySelector('#back-generator'), profileUrl: document.querySelector('#profile-url'),
};

const SVG_NS = 'http://www.w3.org/2000/svg';
let activeCard = null;

function setStatus(message, isError = false) {
  elements.status.textContent = message;
  elements.status.style.color = isError ? '#f0a393' : '';
}

function svgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  return element;
}

function manaSymbol(value) {
  const symbol = document.createElement('span');
  symbol.className = `mana-symbol ${value === 'generic' ? 'generic' : `mana-${value}`}`;
  if (value === 'generic') return symbol;

  const svg = svgElement('svg', { viewBox: '0 0 20 20', 'aria-hidden': 'true' });
  svg.append(svgElement('circle', { cx: 10, cy: 10, r: 8.7, fill: 'currentColor' }));
  const cutout = '#e8dfbd';
  const paths = {
    W: ['path', { d: 'M10 3.5v13M3.5 10h13M5.4 5.4l9.2 9.2M14.6 5.4l-9.2 9.2', stroke: cutout, 'stroke-width': 1.55, fill: 'none' }],
    U: ['path', { d: 'M10 3.6c-2.3 3.1-4.5 5.6-4.5 8a4.5 4.5 0 0 0 9 0c0-2.4-2.2-4.9-4.5-8Z', fill: cutout }],
    B: ['path', { d: 'M12.9 4.4A6.2 6.2 0 1 0 15 14.7 5 5 0 1 1 12.9 4.4Z', fill: cutout }],
    R: ['path', { d: 'm11 2.9-5.7 7h3.8L8.5 17l6.2-8H11z', fill: cutout }],
    G: ['path', { d: 'M15.4 4.4c-5.9.2-9.4 3-9.4 7.2 0 2.2 1.6 4 3.8 4 3.8 0 5.7-4.7 5.6-11.2ZM6.9 14.2c1.5-2.2 3.4-3.9 5.9-5.3', fill: cutout, stroke: cutout, 'stroke-width': 1 }],
  };
  const [tag, attributes] = paths[value] || paths.W;
  svg.append(svgElement(tag, attributes));
  symbol.append(svg);
  return symbol;
}

function renderMana(mana) {
  elements.mana.replaceChildren();
  if (mana.generic) {
    const generic = manaSymbol('generic');
    generic.textContent = mana.generic;
    generic.setAttribute('aria-label', `${mana.generic} generic mana`);
    elements.mana.append(generic);
  }
  for (const color of mana.colors) {
    const symbol = manaSymbol(color);
    symbol.setAttribute('aria-label', `${color} mana`);
    elements.mana.append(symbol);
  }
}

function renderIdentity(card) {
  elements.identity.replaceChildren();
  for (const color of card.colors) elements.identity.append(manaSymbol(color));
  const label = document.createElement('span');
  const domains = card.visualMotifs.domains.slice(0, 2).join(' + ') || 'general craft';
  label.textContent = `${domains} philosophy`;
  elements.identity.append(label);
}

function renderMechanics(mechanics) {
  elements.mechanics.replaceChildren();
  for (const mechanic of mechanics) {
    const line = document.createElement('p');
    line.className = `mechanic-${mechanic.kind}`;
    line.textContent = formatAbility(mechanic);
    elements.mechanics.append(line);
  }
}

function years(value) {
  return value < 1 ? '< 1 year' : `${Math.floor(value)} years`;
}

function readableDomains(domains) {
  return domains.length ? domains.map((domain) => domain.replace(/\b\w/g, (letter) => letter.toUpperCase())).join(' · ') : 'General craft';
}

function renderProvenance(card) {
  const data = card.provenance;
  elements.backHandle.textContent = `@${card.login}`;
  elements.backSnapshot.textContent = data.snapshotDate;
  elements.backOriginal.textContent = data.originalRepos.toLocaleString();
  elements.backForked.textContent = data.forkedRepos.toLocaleString();
  elements.backActive.textContent = `${data.activeRepos} / 180d`;
  elements.backAge.textContent = years(data.accountAgeYears);
  elements.backLongevity.textContent = years(data.longevityYears);
  elements.backDomains.textContent = readableDomains(data.rankedDomains);
  elements.backLanguages.textContent = data.languages.join(' · ') || 'Unclassified';
  elements.backSignatures.textContent = data.signatureRepos.join(' · ') || 'No public signature work';
  elements.backGenerator.textContent = `GMG • GENERATOR ${data.generatorVersion} • ${data.snapshotDate}`;
  elements.profileUrl.href = `https://github.com/${encodeURIComponent(card.login)}`;
}

function renderCard(card) {
  activeCard = card;
  const data = card.provenance;
  const collector = String((card.visualMotifs.seed % 250) + 1).padStart(3, '0');
  elements.card.dataset.colors = card.colors.join('');
  elements.card.dataset.domain = card.visualMotifs.primaryDomain;
  elements.name.textContent = card.name;
  renderMana(card.mana);
  elements.type.firstChild.textContent = card.typeLine;
  renderMechanics(card.mechanics);
  elements.flavor.textContent = `“${card.flavorText}”`;
  elements.pt.textContent = `${card.power} / ${card.toughness}`;
  elements.rarity.textContent = card.rarity.toUpperCase();
  elements.collector.textContent = `GMG • ${collector}/250`;
  elements.snapshot.textContent = `FORGE ${data.generatorVersion}`;
  elements.codex.textContent = `${card.name} emerges from a ${readableDomains(card.visualMotifs.domains).toLowerCase()} practice.`;
  renderIdentity(card);
  elements.identitySummary.textContent = `This ${card.rarity} identity weighs ${data.activeRepos ? 'current momentum' : 'long-term pattern'}, ${data.languageDiversity} working language${data.languageDiversity === 1 ? '' : 's'}, and ${data.originalRepos} original public work${data.originalRepos === 1 ? '' : 's'}—not raw fame.`;
  renderProvenance(card);
  elements.download.disabled = false;
  elements.copy.disabled = false;
}

async function forge(username) {
  setStatus(`Reading the public shape of @${username}…`);
  elements.form.querySelector('button').disabled = true;
  try {
    const { profile, repos } = await fetchGitHubProfile(username);
    renderCard(buildCard(profile, repos));
    const canonical = profile.login || username;
    history.replaceState({}, '', `?user=${encodeURIComponent(canonical)}`);
    setStatus(`@${canonical} has been forged as a ${activeCard.rarity} legend.`);
  } catch (error) {
    setStatus(error.message.includes('rate limit') ? 'GitHub rate limit reached. Wait a minute, then try again.' : error.message, true);
  } finally {
    elements.form.querySelector('button').disabled = false;
  }
}

async function downloadCard() {
  if (!activeCard) return;
  if (!window.html2canvas) return setStatus('The card renderer is still loading. Please try Download again.', true);
  const canvas = await window.html2canvas(elements.card, { backgroundColor: null, scale: 2, useCORS: true });
  const link = document.createElement('a');
  link.download = `${activeCard.login || 'gitmagic'}-card.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

elements.form.addEventListener('submit', (event) => { event.preventDefault(); forge(elements.username.value); });
document.querySelectorAll('[data-example]').forEach((button) => button.addEventListener('click', () => { elements.username.value = button.dataset.example; forge(button.dataset.example); }));
elements.download.addEventListener('click', downloadCard);
elements.copy.addEventListener('click', async () => { if (!activeCard) return; await navigator.clipboard.writeText(`https://github.com/${activeCard.login}`); setStatus('GitHub profile link copied to clipboard.'); });
elements.flip.addEventListener('click', () => { const flipped = elements.card.classList.toggle('is-flipped'); elements.flip.setAttribute('aria-pressed', String(flipped)); elements.flip.textContent = flipped ? 'Show playable front' : 'Reveal provenance'; });

const initialUser = new URLSearchParams(location.search).get('user');
if (initialUser) { elements.username.value = initialUser; forge(initialUser); }
