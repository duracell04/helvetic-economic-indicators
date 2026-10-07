import { readFileSync } from 'node:fs';
import path from 'node:path';
import { productionAtlas } from '../../scripts/lib/atlas-data';
import type { AtlasData } from '../atlas/contracts';
export const atlas: AtlasData = process.env.HEI_DEMO === '1' ? JSON.parse(readFileSync('.cache/atlas-demo.json','utf8')) : await productionAtlas(process.cwd());
export const registry = atlas.registry;
export const topics = atlas.topics;
export function href(route = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${route.replace(/^\//, '')}`;
}
export type PublicDataset = { id: string; title: string; observation_count: number; coverage: { first: string; last: string }; files: { csv: string; json: string } };
export const manifest = (process.env.HEI_DEMO === '1' ? {schema_version:'2.0.0',datasets:[]} : JSON.parse(readFileSync(path.resolve('public/data/manifest.json'),'utf8'))) as { schema_version:string; datasets:PublicDataset[] };
