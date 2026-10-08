import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSiteConfig } from '../site.config.mjs';

test('repository rename changes the Pages path without changing its owner site', () => {
  for (const repo of ['helvetic-economic-indicators', 'swiss-economic-atlas']) {
    assert.deepEqual(resolveSiteConfig({ GITHUB_REPOSITORY: `duracell04/${repo}` }), {
      site: 'https://duracell04.github.io', base: `/${repo}/`,
    });
  }
});

test('local defaults and account sites retain their distinct roots', () => {
  assert.deepEqual(resolveSiteConfig({}), { site: 'http://localhost:4321', base: '/swiss-economic-atlas/' });
  assert.deepEqual(resolveSiteConfig({ GITHUB_REPOSITORY: 'duracell04/duracell04.github.io' }), {
    site: 'https://duracell04.github.io', base: '/',
  });
});

test('explicit overrides consistently normalize root and nested paths', () => {
  for (const [configured, base] of [['/', '/'], ['', '/'], ['/preview/atlas', '/preview/atlas/'], ['/preview/atlas/', '/preview/atlas/']]) {
    assert.deepEqual(resolveSiteConfig({ GITHUB_REPOSITORY: 'duracell04/swiss-economic-atlas', SITE_URL: 'https://example.org', SITE_BASE: configured }), {
      site: 'https://example.org', base,
    });
  }
});
