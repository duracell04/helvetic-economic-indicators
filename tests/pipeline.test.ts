import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { emptyFixture, populatedFixture, fixtureSeries, writeFixtureRegistry } from './helpers.ts';
import { importLocal } from '../scripts/lib/importer.ts';
import { readObservations, writeObservations } from '../scripts/lib/csv.ts';
import { validate, validateMetadata, exportPublic, json, registryPath } from '../scripts/lib/store.ts';

test('local import preserves immutable bytes, nulls and independent statuses', async t => {
  const { root, file } = await emptyFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const id = await importLocal({ root, file, seriesId: 'example-output', sourceId: 'example-source', retrievedOn: '2026-10-07' });
  const { registry, observations } = await validate(root);
  assert.equal(observations.length, 3);
  assert.equal(observations[2].value, null);
  assert.equal(observations[0].value_kind, 'observed');
  assert.equal(observations[0].revision_status, 'final');
  assert.equal(await readFile(path.join(root, registry.snapshots[0].file), 'utf8'), await readFile(file, 'utf8'));
  assert.deepEqual(observations[0].source_snapshot_ids, [id]);
  const second = await importLocal({ root, file, seriesId: 'example-output', sourceId: 'example-source', retrievedOn: '2026-10-07', replace: true });
  assert.equal(second, id);
  assert.equal((await validate(root)).registry.snapshots.length, 1);
  await assert.rejects(exportPublic(root), /synthetic/);
});

test('CSV does not coerce missing, malformed or non-finite values into zeros', () => {
  const rows = [{ series_id: 'example-output', reference_period: '2020', value: null, source_snapshot_ids: ['snapshot-id'], publication_date: null, value_kind: 'forecast' as const, revision_status: 'provisional' as const }];
  const csv = writeObservations(rows);
  assert.deepEqual(readObservations(csv), rows);
  for (const value of ['', 'NaN', 'Infinity', '0x10']) assert.throws(() => readObservations(csv.replace(',NA,', `,${value},`)));
  assert.throws(() => readObservations(csv.replace('reference_period', 'year')), /header/);
});

test('metadata gates duplicates, periods, provenance, definitions and rights', async t => {
  const { root, registry, rows } = await populatedFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  assert.throws(() => validateMetadata(registry, [...rows, rows[0]]), /Duplicate observation/);
  assert.throws(() => validateMetadata(registry, [{ ...rows[0], reference_period: '2020-13' }]), /invalid reference period/);
  assert.throws(() => validateMetadata(registry, [{ ...rows[0], source_snapshot_ids: ['unknown-snapshot'] }]), /provenance/);
  assert.throws(() => validateMetadata(registry, [{ ...rows[0], source_snapshot_ids: [] }]), /provenance|small/);
  assert.throws(() => validateMetadata(registry, [{ ...rows[0], publication_date: '2021-02-29' }]), /calendar date/);
  const candidate = structuredClone(registry);
  candidate.series[0].verification = 'candidate';
  assert.throws(() => validateMetadata(candidate, rows), /verified series/);
  for (const rights of ['unknown', 'restricted'] as const) {
    const blocked = structuredClone(registry);
    blocked.sources[0].rights.redistribution = rights;
    assert.throws(() => validateMetadata(blocked, rows, true), /redistribution/);
  }
  const incomplete = structuredClone(registry);
  incomplete.sources[0].rights.evidence_url = null;
  assert.throws(() => validateMetadata(incomplete, rows), /evidence/);
  const monthly = structuredClone(registry);
  monthly.series[0].frequency = 'daily';
  assert.throws(() => validateMetadata(monthly, [{ ...rows[0], reference_period: '2021-02-29' }]), /reference period/);
});

test('bad imports leave canonical and source registry untouched', async t => {
  const { root, file } = await emptyFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  const before = await readFile(path.join(root, registryPath), 'utf8');
  const badFile = path.join(root, 'bad.csv');
  const contents = await readFile(file, 'utf8');
  await writeFile(badFile, contents.replace('2020,100', '2020-13,100'));
  await assert.rejects(importLocal({ root, file: badFile, seriesId: 'example-output', sourceId: 'example-source', retrievedOn: '2026-10-07' }), /period/);
  assert.equal(await readFile(path.join(root, registryPath), 'utf8'), before);
  assert.deepEqual(await readdir(path.join(root, 'data/raw')), []);
  assert.deepEqual(await readdir(path.join(root, 'data/canonical')), []);
});

test('raw snapshot edits and unregistered raw files are detected', async t => {
  const { root, registry } = await populatedFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(path.join(root, registry.snapshots[0].file), 'tampered');
  await assert.rejects(validate(root), /checksum mismatch/);
  await writeFile(path.join(root, 'data/raw/unregistered.csv'), 'test');
  await assert.rejects(validate(root), /Unregistered/);
});

test('exports are byte-identical, carry context and remove stale generated files', async t => {
  const { root, registry, rows } = await populatedFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  // Exercise the real-data publication branch only in an isolated test directory.
  // Values and source addresses remain explicitly synthetic test fixtures.
  registry.series[0].data_class = 'real';
  await writeFixtureRegistry(root, registry);
  await writeFile(path.join(root, 'data/canonical/example-output.csv'), writeObservations(rows));
  await exportPublic(root);
  const first = await readFile(path.join(root, 'public/data/manifest.json'), 'utf8');
  const csv = await readFile(path.join(root, 'public/data/example-output.csv'), 'utf8');
  await writeFile(path.join(root, 'public/data/stale.csv'), 'old');
  await exportPublic(root);
  assert.equal(await readFile(path.join(root, 'public/data/manifest.json'), 'utf8'), first);
  assert.equal(await readFile(path.join(root, 'public/data/example-output.csv'), 'utf8'), csv);
  assert.equal((await readdir(path.join(root, 'public/data'))).includes('stale.csv'), false);
  const manifest = JSON.parse(first);
  assert.deepEqual(manifest.datasets[0].coverage, { first: '2020', last: '2022' });
  assert.equal(manifest.datasets[0].missing_count, 1);
  assert.equal(manifest.sources[0].rights.redistribution, 'permitted');
  assert.equal(manifest.snapshots.length, 1);
});

test('a registered verified source can import another distinct series', async t => {
  const { root, registry, file } = await emptyFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  registry.series.push(fixtureSeries('example-population'));
  await writeFixtureRegistry(root, registry);
  const supplied = path.join(root, 'population.csv');
  await writeFile(supplied, (await readFile(file, 'utf8')).replaceAll('example-output', 'example-population'));
  await importLocal({ root, file: supplied, seriesId: 'example-population', sourceId: 'example-source', retrievedOn: '2026-10-07' });
  assert.equal((await validate(root)).observations[0].series_id, 'example-population');
});
