import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { resolveSiteConfig } from '../site.config.mjs';

const root = path.resolve('dist');
async function htmlFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? htmlFiles(path.join(directory, entry.name)) : entry.name.endsWith('.html') ? [path.join(directory, entry.name)] : []))).flat();
}
const { base } = resolveSiteConfig();
const pages = await htmlFiles(root);
let checked = 0;
for (const page of pages) {
  const html = await readFile(page, 'utf8');
  if (!html.includes('lang="en"') || !html.includes('id="main"') || !html.includes('Skip to content')) throw new Error(`${page}: missing accessibility landmarks`);
  for (const match of html.matchAll(/(?:href|src|data-url)="([^"]+)"/g)) {
    const href = match[1].replaceAll('&amp;', '&');
    if (/^(https?:|mailto:)/.test(href)) continue;
    let target = page;
    let fragment = '';
    if (href.startsWith('#')) fragment = href.slice(1);
    else {
      const url = new URL(href, 'https://example.invalid');
      if (!url.pathname.startsWith(base)) throw new Error(`${page}: link escapes configured Pages base: ${href}`);
      target = path.join(root, decodeURIComponent(url.pathname.slice(base.length)));
      if ((await stat(target)).isDirectory()) target = path.join(target, 'index.html');
      fragment = url.hash.slice(1);
    }
    await stat(target);
    if (fragment && !(await readFile(target, 'utf8')).includes(`id="${fragment}"`)) throw new Error(`${page}: missing fragment ${href}`);
    checked++;
  }
}
const manifest = JSON.parse(await readFile(path.join(root, 'data/manifest.json'), 'utf8'));
for (const dataset of manifest.datasets) {
  await stat(path.join(root, 'data', dataset.files.csv));
  await stat(path.join(root, 'data', dataset.files.json));
}
console.log(`Verified ${pages.length} static pages and ${checked} internal links under ${base}.`);

const atlas = JSON.parse(await readFile(path.join(root,'data/atlas.json'),'utf8'));
if(atlas.mode !== 'production' || atlas.observations.some((o:{series_id:string})=>atlas.registry.series.find((s:{id:string})=>s.id===o.series_id)?.data_class !== 'real')) throw new Error('Production artifact contains demo or unverified observations');
if(atlas.registry.series.some((s:{data_class:string})=>s.data_class==='synthetic'))throw new Error('Production definitions contain synthetic examples');
console.log(`Production artifact contains ${atlas.observations.length} verified, permitted observations and no synthetic series.`);
