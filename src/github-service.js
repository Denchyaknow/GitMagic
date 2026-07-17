const GITHUB_API = 'https://api.github.com';

export function normalizeUsername(value) {
  return String(value ?? '').trim().replace(/^@/, '');
}

async function jsonOrThrow(response) {
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message || `GitHub returned ${response.status}`);
  return payload;
}

export async function getPublicProfilePayload(input, fetchImpl = fetch, token = '') {
  const username = normalizeUsername(input);
  if (!username) throw new Error('Enter a GitHub username.');
  const headers = { Accept: 'application/vnd.github+json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const profileUrl = `${GITHUB_API}/users/${encodeURIComponent(username)}`;
  const reposUrl = `${profileUrl}/repos?per_page=100&sort=updated`;
  const [profileResponse, reposResponse] = await Promise.all([
    fetchImpl(profileUrl, { headers }),
    fetchImpl(reposUrl, { headers }),
  ]);
  const [profile, repos] = await Promise.all([jsonOrThrow(profileResponse), jsonOrThrow(reposResponse)]);
  return { profile, repos };
}
