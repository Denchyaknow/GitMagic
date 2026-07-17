import { getPublicProfilePayload } from '../src/github-service.js';

export function createProfileHandler(getPayload = getPublicProfilePayload) {
  return async function profileHandler(request, response) {
    try {
      const payload = await getPayload(request.query?.username, fetch, process.env.GITHUB_TOKEN);
      response.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
      return response.status(200).json(payload);
    } catch (error) {
      return response.status(400).json({ error: error.message || 'Unable to forge this profile.' });
    }
  };
}

export default createProfileHandler();
