import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { readObservations, writeObservations } from './csv.ts';
import { checksum, json, validate, validateMetadata, atomicWrite, registryPath } from './store.ts';
import { date, type Observation, type Series, type Snapshot } from './schema.ts';

export interface Importer {
  name: string;
  parse(contents: string, context: { series: Series; snapshot: Snapshot }): Observation[];
}

export const canonicalCsvImporter: Importer = {
  name: 'canonical-csv',
  parse(contents, { series, snapshot }) {
    const rows = readObservations(contents);
    if (rows.length === 0) throw new Error('Cannot import an empty source file');
    if (rows.some(row => row.series_id !== series.id)) throw new Error('Input contains a different series ID');
    return rows.map(row => ({ ...row, source_snapshot_ids: [snapshot.id] }));
  },
};

export async function importLocal(options: {
  root: string; file: string; seriesId: string; sourceId: string;
  retrievedOn: string; replace?: boolean; importer?: Importer;
}): Promise<string> {
  date.parse(options.retrievedOn);
  const { registry, observations } = await validate(options.root, false, false);
  const series = registry.series.find(s => s.id === options.seriesId);
  const source = registry.sources.find(s => s.id === options.sourceId);
  if (!series || series.verification !== 'verified' || registry.transformations.some(t => t.output_series_id === series.id)) throw new Error('Import requires a verified primary series');
  if (!source || !series.source_ids.includes(source.id) || source.audit_status !== 'verified' || source.rights.redistribution !== 'permitted') throw new Error('Import requires a verified source with permitted redistribution');
  const bytes = await readFile(options.file);
  const sha256 = checksum(bytes);
  const snapshotId = `${source.id}-${options.retrievedOn}-${sha256.slice(0, 16)}`;
  const snapshot: Snapshot = {
    id: snapshotId, source_id: source.id, retrieved_on: options.retrievedOn,
    sha256, file: `data/raw/${snapshotId}.csv`, source_url: source.data_url!,
  };
  const incoming = (options.importer ?? canonicalCsvImporter).parse(bytes.toString('utf8'), { series, snapshot });
  const old = observations.filter(row => row.series_id === series.id);
  const nextRows = options.replace ? incoming : [...old, ...incoming];
  const nextRegistry = { ...registry, snapshots: registry.snapshots.some(s => s.id === snapshotId) ? registry.snapshots : [...registry.snapshots, snapshot] };
  const combined = [...observations.filter(row => row.series_id !== series.id), ...nextRows];
  // Revisions may temporarily leave derived rows stale. The validation/export
  // gates require data:derive before those revisions can be published.
  validateMetadata(nextRegistry, combined, false, false);
  const raw = path.join(options.root, snapshot.file);
  try { await writeFile(raw, bytes, { flag: 'wx' }); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    if (checksum(await readFile(raw)) !== sha256) throw new Error('Refusing to overwrite an immutable source snapshot');
  }
  const { transformations: _transformations, ...primary } = nextRegistry;
  await atomicWrite(path.join(options.root, registryPath), json(primary));
  await atomicWrite(path.join(options.root, 'data/canonical', `${series.id}.csv`), writeObservations(nextRows));
  return snapshotId;
}
