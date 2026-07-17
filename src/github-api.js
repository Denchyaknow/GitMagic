export async function fetchGitHubProfile(username, fetchImpl = fetch) {
  const login = String(username || '').trim().replace(/^@/, '');
  if (!login) throw new Error('Enter a GitHub username.');

  const response = await fetchImpl(`/api/profile?username=${encodeURIComponent(login)}`, {
    headers: { Accept: 'application/json' },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || body.message || `Profile service returned ${response.status}`);
  return body;
}
