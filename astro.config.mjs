import { defineConfig } from 'astro/config';
import { resolveSiteConfig } from './site.config.mjs';

export default defineConfig({
  output: 'static',
  publicDir: process.env.HEI_DEMO === '1' ? './.cache/atlas-preview/public' : './public',
  outDir: process.env.HEI_DEMO === '1' ? './.cache/atlas-preview/dist' : './dist',
  ...resolveSiteConfig(),
  trailingSlash: 'always',
  devToolbar: { enabled: false },
});
