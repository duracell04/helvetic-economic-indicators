export type SiteEnvironment = {
  GITHUB_REPOSITORY?: string;
  SITE_URL?: string;
  SITE_BASE?: string;
};
export function resolveSiteConfig(env?: SiteEnvironment): { site: string; base: string };
