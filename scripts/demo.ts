import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fixtureRegistry, writeFixtureRegistry } from '../tests/helpers.ts';
import { importLocal } from './lib/importer.ts';
import { json, registryPath, validate } from './lib/store.ts';

await mkdir('.cache', { recursive: true });
const root = await mkdtemp(path.resolve('.cache/synthetic-demo-'));
for (const directory of ['data/registry', 'data/raw', 'data/canonical']) await mkdir(path.join(root, directory), { recursive: true });
await writeFixtureRegistry(root, fixtureRegistry());
const file = path.join(root, 'input.csv');
await writeFile(file, await readFile(new URL('../tests/fixtures/source.csv', import.meta.url)));
await importLocal({ root, file, seriesId: 'example-output', sourceId: 'example-source', retrievedOn: '2026-10-07' });
const { observations } = await validate(root);
console.log(`Imported and validated ${observations.length} synthetic observations in ${root}.`);
console.log('This isolated demo is ignored by Git and intentionally rejected by the public export gate.');
