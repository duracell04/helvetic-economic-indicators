import { readFile, readdir, mkdir, writeFile, rm, rename } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { registrySchema, seriesRegistrySchema, transformationRegistrySchema, observationSchema, validPeriod, type Registry, type Observation, type Series } from './schema.ts';
import { readObservations, writeObservations } from './csv.ts';
import { assertCompatible, derive } from './transforms.ts';

export const checksum = (bytes: string | Buffer): string => createHash('sha256').update(bytes).digest('hex');
export const json = (value: unknown): string => JSON.stringify(value, null, 2) + '\n';
export const registryPath = 'data/registry/registry.json';

export async function load(root: string): Promise<{ registry: Registry; observations: Observation[] }> {
  const primary = seriesRegistrySchema.parse(JSON.parse(await readFile(path.join(root, registryPath), 'utf8')));
  const transformations = transformationRegistrySchema.parse(JSON.parse(await readFile(path.join(root, 'data/registry/transformations.json'), 'utf8'))).transformations;
  const registry = registrySchema.parse({ ...primary, transformations });
  const files = (await readdir(path.join(root, 'data/canonical'))).filter(file => file.endsWith('.csv')).sort();
  const observations: Observation[] = [];
  for (const file of files) {
    const rows = readObservations(await readFile(path.join(root, 'data/canonical', file), 'utf8'));
    if (rows.some(row => file !== `${row.series_id}.csv`)) throw new Error(`${file}: each canonical file must contain only its named series`);
    observations.push(...rows);
  }
  return { registry, observations };
}

function unique(ids: string[], label: string): void {
  if (new Set(ids).size !== ids.length) throw new Error(`Duplicate ${label}`);
}

export function validateMetadata(registry: Registry, observations: Observation[], publication = false, checkDerived = true): void {
  registrySchema.parse(registry);
  unique(registry.sources.map(s => s.id), 'source ID');
  unique(registry.series.map(s => s.id), 'series ID');
  unique(registry.snapshots.map(s => s.id), 'snapshot ID');
  unique(registry.transformations.map(s => s.id), 'transformation ID');
  unique(registry.transformations.map(s => s.output_series_id), 'transformation output');
  const sources = new Map(registry.sources.map(s => [s.id, s]));
  const series = new Map(registry.series.map(s => [s.id, s]));
  const snapshots = new Map(registry.snapshots.map(s => [s.id, s]));
  const calculations = new Map(registry.transformations.map(s => [s.output_series_id, s]));
  for (const spec of calculations.values()) if (!series.has(spec.output_series_id)) throw new Error(`Unknown transformation output: ${spec.output_series_id}`);
  for (const source of sources.values()) {
    if (source.audit_status === 'verified' && (!source.data_url || !source.source_identifier || !source.coverage || !source.revision_practice)) throw new Error(`${source.id}: source audit is incomplete`);
    if (source.rights.redistribution === 'permitted' && (!source.rights.licence || !source.rights.evidence_url || !source.rights.reviewed_on || !source.rights.attribution)) throw new Error(`${source.id}: redistribution evidence is incomplete`);
  }
  function ancestors(s: Series, visiting = new Set<string>()): string[] {
    if (visiting.has(s.id)) throw new Error(`Cyclic derivation: ${s.id}`);
    const spec = calculations.get(s.id);
    if (!spec) return s.source_ids;
    const next = new Set([...visiting, s.id]);
    const inputs = spec.inputs.map(input => {
      const item = series.get(input);
      if (!item) throw new Error(`${s.id}: unknown input ${input}`);
      return item;
    });
    assertCompatible(s, inputs, spec);
    if (s.verification === 'verified' && inputs.some(input => input.verification !== 'verified')) throw new Error(`${s.id}: derived series has unverified inputs`);
    const sourceIds = [...new Set(inputs.flatMap(input => ancestors(input, next)))].sort();
    if (JSON.stringify(sourceIds) !== JSON.stringify([...s.source_ids].sort())) throw new Error(`${s.id}: derived source IDs must match the input lineage`);
    return sourceIds;
  }
  for (const s of series.values()) {
    unique(s.source_ids, `${s.id} source reference`);
    if (s.source_ids.length === 0 || s.source_ids.some(id => !sources.has(id))) throw new Error(`${s.id}: missing or unknown source reference`);
    if (s.verification === 'verified' && s.source_ids.some(id => sources.get(id)!.audit_status !== 'verified')) throw new Error(`${s.id}: source audit is incomplete`);
    ancestors(s);
  }
  for (const snap of snapshots.values()) {
    const source = sources.get(snap.source_id);
    if (!source || source.audit_status !== 'verified' || source.rights.redistribution !== 'permitted') throw new Error(`${snap.id}: tracked snapshots require verified redistribution terms`);
    if (snap.file !== `data/raw/${snap.id}.csv`) throw new Error(`${snap.id}: snapshot filename must match ID`);
  }
  unique(observations.map(o => `${o.series_id}/${o.reference_period}`), 'observation');
  for (const row of observations) {
    observationSchema.parse(row);
    const s = series.get(row.series_id);
    if (!s || s.verification !== 'verified') throw new Error(`${row.series_id}: observations require a verified series`);
    if (!validPeriod(row.reference_period, s.frequency)) throw new Error(`${row.series_id}: invalid reference period ${row.reference_period}`);
    unique(row.source_snapshot_ids, 'observation snapshot reference');
    if (row.source_snapshot_ids.length === 0) throw new Error(`${row.series_id}: missing provenance`);
    for (const snapshotId of row.source_snapshot_ids) {
      const snap = snapshots.get(snapshotId);
      if (!snap || !s.source_ids.includes(snap.source_id)) throw new Error(`${row.series_id}: missing or incompatible provenance ${snapshotId}`);
      const source = sources.get(snap.source_id)!;
      if (source.rights.redistribution !== 'permitted') throw new Error(`${source.id}: redistribution is not confirmed`);
    }
    if (publication && s.data_class !== 'real') throw new Error(`${s.id}: synthetic data cannot enter public exports`);
  }
  for (const s of series.values()) {
    const actual = observations.filter(o => o.series_id === s.id);
    const spec = calculations.get(s.id);
    if (!checkDerived || !spec || actual.length === 0) continue;
    const expected = derive(s, spec.inputs.map(id => series.get(id)!), observations, spec);
    if (writeObservations(actual) !== writeObservations(expected)) throw new Error(`${s.id}: derived observations are stale or incorrect; run data:derive`);
  }
}

export async function validate(root: string, publication = false, checkDerived = true): Promise<Awaited<ReturnType<typeof load>>> {
  const data = await load(root);
  validateMetadata(data.registry, data.observations, publication, checkDerived);
  const listed = new Set(data.registry.snapshots.map(s => path.basename(s.file)));
  for (const file of await readdir(path.join(root, 'data/raw'))) {
    if (file !== '.gitkeep' && !listed.has(file)) throw new Error(`Unregistered source material: data/raw/${file}`);
  }
  for (const snapshot of data.registry.snapshots) {
    if (checksum(await readFile(path.join(root, snapshot.file))) !== snapshot.sha256) throw new Error(`${snapshot.id}: raw snapshot checksum mismatch`);
  }
  return data;
}

export async function atomicWrite(file: string, content: string): Promise<void> {
  await mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp-${process.pid}`;
  await writeFile(temporary, content);
  await rename(temporary, file);
}

export async function exportPublic(root: string): Promise<number> {
  const { registry, observations } = await validate(root, true);
  const stage = path.join(root, '.cache/public-data');
  await rm(stage, { recursive: true, force: true });
  await mkdir(stage, { recursive: true });
  const datasets: (Series & {coverage:{first:string;last:string}; observation_count:number; missing_count:number; value_kinds:string[];revision_statuses:string[];source_snapshot_ids:string[];files:{csv:string;json:string};sha256:{csv:string;json:string}})[] = [];
  for (const s of [...registry.series].sort((a, b) => a.id.localeCompare(b.id, 'en'))) {
    const rows = observations.filter(o => o.series_id === s.id).sort((a, b) => a.reference_period.localeCompare(b.reference_period, 'en'));
    if (rows.length === 0) continue;
    const csv = writeObservations(rows);
    const serialized = json(rows);
    await writeFile(path.join(stage, `${s.id}.csv`), csv);
    await writeFile(path.join(stage, `${s.id}.json`), serialized);
    datasets.push({
      ...s, coverage: { first: rows[0].reference_period, last: rows.at(-1)!.reference_period },
      observation_count: rows.length, missing_count: rows.filter(row => row.value === null).length,
      value_kinds: [...new Set(rows.map(row => row.value_kind))].sort(),
      revision_statuses: [...new Set(rows.map(row => row.revision_status))].sort(),
      source_snapshot_ids: [...new Set(rows.flatMap(row => row.source_snapshot_ids))].sort(),
      files: { csv: `${s.id}.csv`, json: `${s.id}.json` },
      sha256: { csv: checksum(csv), json: checksum(serialized) },
    });
  }
  const usedSources = new Set(datasets.flatMap(d => d.source_ids));
  const usedSnapshots = new Set(datasets.flatMap(d => d.source_snapshot_ids));
  await writeFile(path.join(stage, 'manifest.json'), json({
    schema_version: registry.schema_version,
    datasets,
    transformations: registry.transformations.filter(t => datasets.some(d => d.id === t.output_series_id)),
    sources: registry.sources.filter(s => usedSources.has(s.id)).sort((a, b) => a.id.localeCompare(b.id, 'en')),
    snapshots: registry.snapshots.filter(s => usedSnapshots.has(s.id)).sort((a, b) => a.id.localeCompare(b.id, 'en')),
  }));
  const destination = path.join(root, 'public/data');
  await mkdir(path.dirname(destination), { recursive: true });
  await rm(destination, { recursive: true, force: true });
  await rename(stage, destination);
  return datasets.length;
}
