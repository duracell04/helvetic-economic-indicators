/** Resolve the same deployment paths for Astro, artifact checks and browser tests. */
export function resolveSiteConfig(env = process.env) {
  const [owner, repo] = env.GITHUB_REPOSITORY?.split('/') ?? [];
  const isAccountSite = repo === `${owner}.github.io`;
  const configuredBase = env.SITE_BASE ?? (isAccountSite ? '/' : `/${repo ?? 'swiss-economic-atlas'}/`);
  const base = `/${configuredBase.replace(/^\/+|\/+$/g, '')}`.replace(/\/$/, '') + '/';
  return {
    site: env.SITE_URL ?? (owner ? `https://${owner}.github.io` : 'http://localhost:4321'),
    base,
  };
}
