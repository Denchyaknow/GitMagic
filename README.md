# GitMagic

**Forge a public GitHub profile into an original fantasy trading card.**

GitMagic turns public GitHub signals into a playable, Magic-inspired card: language mix becomes color identity; repositories, stars, forks, and followers become power, toughness, rarity, and abilities.

![License: MIT](https://img.shields.io/badge/license-MIT-e8bd59.svg)

## Features

- Search any public GitHub profile through a same-origin serverless endpoint—no client-side token or backend to operate.
- Original card rules derived from public repositories, stars, forks, followers, languages, and profile bio.
- Five-color identity mapping with developer archetypes and rarity tiers.
- Foil-style card treatment, responsive layout, sharable `?user=<github-login>` URLs, and PNG export.
- Dependency-free application logic with focused Node tests.

## Deploy on Vercel

GitMagic is a Vercel-ready serverless app. The browser calls its same-origin `/api/profile` function, which reads GitHub data on the server and caches responses for five minutes. The current production deployment is **[gitmagic.vercel.app](https://gitmagic.vercel.app)**.

1. Push this repository to GitHub, then import it into Vercel to enable automatic deploys on `main`.
2. The API validates GitHub usernames, responds with upstream-safe status codes, and applies a per-client, per-instance rate limit (12 requests/minute). If you add an optional `GITHUB_TOKEN` in Vercel for more GitHub API headroom, also enable Vercel WAF/rate limiting for production traffic; use a fine-grained read-only token and never commit it.
3. The accompanying `GitSite_Dencho` site uses a Netlify redirect so `https://dencho.dev/GitMagic` forwards to this deployment.

The included `vercel.json` also supports `https://<deployment>/GitMagic` as an entry route.

## Run locally

```bash
git clone https://github.com/<your-account>/GitMagic.git
cd GitMagic
npx vercel dev
```

`vercel dev` requires signing into Vercel once. For static styling-only work, any local static server is fine, but profile generation requires the serverless API.

## Test

```bash
npm test
npm run check
```

## Signal mapping

| GitHub signal | Card mechanic |
| --- | --- |
| Primary languages | Color identity |
| Stars + followers | Power and mana value |
| Repositories + forks | Toughness and triggered abilities |
| Profile bio | Flavor text |
| Combined impact | Common → Mythic rarity |

## Inspiration and attribution

GitMagic is a clean, original implementation inspired by the **profile-to-card** interaction pattern of [GitFut](https://gitfut.com/) and [Gitmon Card Generator](https://github.com/Aebel-Shajan/gitmon-card-generator), plus the stat-rich developer-card approach of [GitDex](https://github.com/samueldervishii/gitdex). It does not copy their code, branding, or assets.

GitMagic is unofficial fan-style software, is **not affiliated with GitHub or Wizards of the Coast**, and uses no official Magic: The Gathering artwork, card templates, or game text.

## License

[MIT](LICENSE)
