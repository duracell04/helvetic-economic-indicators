import { defineConfig } from 'astro/config';

const repository = process.env.GITHUB_REPOSITORY;
const [owner, repo] = repository?.split('/') ?? [];
const isAccountSite = repo === `${owner}.github.io`;

export default defineConfig({
  output: 'static',
  publicDir: process.env.HEI_DEMO === '1' ? './.cache/atlas-preview/public' : './public',
  outDir: process.env.HEI_DEMO === '1' ? './.cache/atlas-preview/dist' : './dist',
  site: process.env.SITE_URL ?? (owner ? `https://${owner}.github.io` : 'http://localhost:4321'),
  base: process.env.SITE_BASE ?? (isAccountSite ? '/' : `/${repo ?? 'helvetic-economic-indicators'}/`),
  trailingSlash: 'always',
  devToolbar: { enabled: false },
});
