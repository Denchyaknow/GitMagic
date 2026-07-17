import { buildCard, formatAbility } from './card-engine.js';
import { fetchGitHubProfile } from './github-api.js';

const elements = {
  form: document.querySelector('#search-form'), username: document.querySelector('#username'), status: document.querySelector('#status'),
  card: document.querySelector('#card'), name: document.querySelector('#card-name'), mana: document.querySelector('#mana-cost'),
  avatar: document.querySelector('#avatar'), type: document.querySelector('#type-line'), oracle: document.querySelector('#oracle-text'),
  abilities: document.querySelector('#abilities'), flavor: document.querySelector('#flavor-text'), pt: document.querySelector('#pt'),
  rarity: document.querySelector('#rarity'), set: document.querySelector('#set-code'), codex: document.querySelector('#codex-name'),
  identity: document.querySelector('#color-identity'), download: document.querySelector('#download'), copy: document.querySelector('#copy-link'),
  stars: document.querySelector('#stat-stars'), followers: document.querySelector('#stat-followers'), repos: document.querySelector('#stat-repos'), forks: document.querySelector('#stat-forks'),
};

let activeCard = null;

function rarityFor(card) {
  const score = card.stats.stars + card.stats.followers * 2 + card.stats.repos * 3;
  if (score > 20000) return 'mythic';
  if (score > 2000) return 'rare';
  if (score > 300) return 'uncommon';
  return 'common';
}

function identityMarkup(colors) {
  return `${colors.map((color) => `<span class="color-dot color-${color}">${color}</span>`).join('')}<span>${colors.join(' / ')} identity · derived from top languages</span>`;
}

function setStatus(message, isError = false) {
  elements.status.textContent = message;
  elements.status.style.color = isError ? '#ff9e94' : '';
}

function renderCard(card) {
  const rarity = rarityFor(card);
  activeCard = card;
  elements.card.dataset.rarity = rarity;
  elements.name.textContent = card.name;
  elements.mana.textContent = card.manaCost;
  elements.avatar.src = card.avatarUrl || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png';
  elements.avatar.alt = `${card.name}'s GitHub avatar`;
  elements.type.textContent = card.typeLine;
  elements.oracle.textContent = card.oracleText;
  elements.abilities.textContent = card.abilities.map(formatAbility).join('\n\n');
  elements.abilities.style.whiteSpace = 'pre-line';
  elements.flavor.textContent = `“${card.flavorText}”`;
  elements.pt.textContent = `${card.power} / ${card.toughness}`;
  elements.rarity.textContent = rarity.toUpperCase();
  elements.set.textContent = `GIT · ${String(card.stats.repos).padStart(3, '0')}`;
  elements.codex.textContent = `${card.name}, ${rarity} developer legend.`;
  elements.identity.innerHTML = identityMarkup(card.colors);
  elements.stars.textContent = card.stats.stars.toLocaleString();
  elements.followers.textContent = card.stats.followers.toLocaleString();
  elements.repos.textContent = card.stats.repos.toLocaleString();
  elements.forks.textContent = card.stats.forks.toLocaleString();
  elements.download.disabled = false;
  elements.copy.disabled = false;
}

async function forge(username) {
  setStatus(`Consulting the public archive for @${username}…`);
  elements.form.querySelector('button').disabled = true;
  try {
    const { profile, repos } = await fetchGitHubProfile(username);
    renderCard(buildCard(profile, repos));
    const canonical = profile.login || username;
    history.replaceState({}, '', `?user=${encodeURIComponent(canonical)}`);
    setStatus(`@${canonical} has been forged into a ${rarityFor(activeCard)} card.`);
  } catch (error) {
    setStatus(error.message.includes('rate limit') ? 'GitHub rate limit reached. Wait a minute, then try again.' : error.message, true);
  } finally {
    elements.form.querySelector('button').disabled = false;
  }
}

async function downloadCard() {
  if (!activeCard) return;
  if (!window.html2canvas) {
    setStatus('The card renderer is still loading. Please try Download again.', true);
    return;
  }
  const canvas = await window.html2canvas(elements.card, { backgroundColor: null, scale: 2, useCORS: true });
  const link = document.createElement('a');
  link.download = `${activeCard.login || 'gitmagic'}-card.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

elements.form.addEventListener('submit', (event) => {
  event.preventDefault();
  forge(elements.username.value);
});

document.querySelectorAll('[data-example]').forEach((button) => button.addEventListener('click', () => {
  elements.username.value = button.dataset.example;
  forge(button.dataset.example);
}));

elements.download.addEventListener('click', downloadCard);
elements.copy.addEventListener('click', async () => {
  if (!activeCard) return;
  await navigator.clipboard.writeText(`https://github.com/${activeCard.login}`);
  setStatus('GitHub profile link copied to clipboard.');
});

const initialUser = new URLSearchParams(location.search).get('user');
if (initialUser) {
  elements.username.value = initialUser;
  forge(initialUser);
}
