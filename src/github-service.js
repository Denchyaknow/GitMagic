const GITHUB_API = 'https://api.github.com';
const USERNAME_PATTERN = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i;

export class GitHubServiceError extends Error {
  constructor(message, status = 502) {
    super(message);
    this.status = status;
  }
}

export function normalizeUsername(value) {
  return String(value ?? '').trim().replace(/^@/, '');
}

export function validateUsername(value) {
  const username = normalizeUsername(value);
  if (!USERNAME_PATTERN.test(username)) {
    throw new GitHubServiceError('Enter a valid GitHub username.', 400);
  }
  return username;
}

async function jsonOrThrow(response) {
  const payload = await response.json().catch(() => ({}));
  if (response.ok) return payload;

  const message = payload.message || `GitHub returned ${response.status}`;
  const status = response.status === 403 && /rate limit/i.test(message) ? 429 : response.status;
  throw new GitHubServiceError(message, status);
}

export async function getPublicProfilePayload(input, fetchImpl = fetch, token = '') {
  const username = validateUsername(input);
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
