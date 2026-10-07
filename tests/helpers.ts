import { mkdtemp, mkdir, writeFile, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { checksum, json, registryPath } from '../scripts/lib/store.ts';
import { readObservations } from '../scripts/lib/csv.ts';
import type { Registry, Series, Observation } from '../scripts/lib/schema.ts';

export function fixtureSeries(id = 'example-output'): Series {
  return {
    id, title: 'Synthetic example, not Swiss statistics',
    verification: 'verified', data_class: 'synthetic', definition: 'Test-only constructed values.',
    unit: { code: 'index', label: 'Synthetic index', dimension:'index', scale:1 }, frequency: 'annual', measurement:'level', price_basis:'not_applicable', aggregation_kind:'end_of_period',
    institutional_coverage: 'Synthetic economy', instrument: null, maturity: null,
    aggregation: 'Synthetic annual levels', source_ids: ['example-source'], source_identifier: id,
    breaks: [], usage_notes: 'Development fixture only; never publish as economic data.',
  };
}
export function fixtureRegistry(): Registry {
  return {
    schema_version: '2.0.0', transformations: [], series: [fixtureSeries()], snapshots: [],
    sources: [{
      id: 'example-source', publisher: 'Project test fixtures', title: 'Synthetic importer fixture',
      landing_url: 'https://example.invalid/synthetic', data_url: 'https://example.invalid/synthetic.csv',
      source_identifier: 'synthetic-fixture-v1', audit_status: 'verified',
      definition: 'Constructed values for software checks only.', coverage: 'Synthetic 2020–2022',
      revision_practice: 'Changed only in tests', rights: {
        redistribution: 'permitted', licence: 'MIT (synthetic fixture only)',
        evidence_url: 'https://example.invalid/synthetic-licence', reviewed_on: '2026-10-07',
        attribution: 'Helvetic Economic Indicators test fixture', conditions: 'Synthetic example only; not real statistics.',
      },
    }],
  };
}
export async function emptyFixture(): Promise<{ root: string; registry: Registry; file: string }> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'hei-test-'));
  await mkdir(path.join(root, 'data/registry'), { recursive: true });
  await mkdir(path.join(root, 'data/raw'), { recursive: true });
  await mkdir(path.join(root, 'data/canonical'), { recursive: true });
  const registry = fixtureRegistry();
  await writeFixtureRegistry(root, registry);
  const file = new URL('./fixtures/source.csv', import.meta.url).pathname;
  return { root, registry, file };
}
export async function populatedFixture(): Promise<{ root: string; registry: Registry; rows: Observation[] }> {
  const { root, registry, file } = await emptyFixture();
  const raw = await readFile(file);
  const id = `example-source-2026-10-07-${checksum(raw).slice(0, 16)}`;
  registry.snapshots.push({ id, source_id: 'example-source', retrieved_on: '2026-10-07', sha256: checksum(raw), file: `data/raw/${id}.csv`, source_url: 'https://example.invalid/synthetic.csv' });
  await writeFile(path.join(root, `data/raw/${id}.csv`), raw);
  await writeFixtureRegistry(root, registry);
  const rows = readObservations(raw.toString()).map(row => ({ ...row, source_snapshot_ids: [id] }));
  return { root, registry, rows };
}

export async function writeFixtureRegistry(root: string, registry: Registry): Promise<void> {
  const {transformations,...primary} = registry;
  await writeFile(path.join(root, registryPath), json(primary));
  await writeFile(path.join(root,'data/registry/transformations.json'), json({schema_version:'2.0.0',transformations}));
}
