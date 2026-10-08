import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { fsoGdpImporter } from '../scripts/lib/fso-gdp.ts';
import { importLocal } from '../scripts/lib/importer.ts';
import { checksum, load, registryPath, validate } from '../scripts/lib/store.ts';
import { productionAtlas } from '../scripts/lib/atlas-data.ts';
import { available, addSeries, initialState } from '../src/atlas/composition.ts';
import { pointsFor, chartGeometry } from '../src/atlas/geometry.ts';
import { emptyFixture, writeFixtureRegistry } from './helpers.ts';

const { registry, observations } = await load(process.cwd());
const series = registry.series.find(s => s.id === 'nominal-gdp')!;
const source = registry.sources.find(s => s.id === 'fso-gdp-long-series')!;
const snapshot = registry.snapshots.find(s => s.source_id === source.id)!;
const bytes = await readFile(snapshot.file);
const raw = bytes.toString('utf8');
const context = { series, snapshot };
const sourceRows = parse(raw, { bom: true, columns: true }) as Record<string, string>[];
const encode = (rows: Record<string, string>[]) => stringify(rows, { header: true });
const run = promisify(execFile);
const cli = path.resolve('scripts/cli.ts');

test('all nominal GDP values and their provenance reproduce the original FSO CSV', () => {
  assert.equal(checksum(bytes), '16c49f1313335a64a82dd01b00381633ab9edc2f3db72fb7c2b9487c2bbde042');
  assert.equal(snapshot.sha256, checksum(bytes));
  assert.deepEqual([...bytes.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
  assert.ok(raw.includes('\r\n'));
  const selected = sourceRows.filter(row => row.VARIABLE === 'B1GQ' && row.UNIT_MEAS === 'MCHF');
  const actual = observations.filter(o => o.series_id === series.id);
  assert.equal(selected.length, 78);assert.equal(actual.length, 78);
  assert.deepEqual(actual.map(o => o.reference_period), Array.from({ length: 78 }, (_, i) => String(1948 + i)));
  for (const row of selected) {
    const stored = actual.find(o => o.reference_period === row.PERIOD)!;
    assert.equal(stored.value, Number(row.VALUE), row.PERIOD);
    assert.deepEqual(stored.source_snapshot_ids, [snapshot.id]);
    assert.equal(stored.publication_date, '2026-08-25');
    assert.equal(stored.value_kind, Number(row.PERIOD) < 1995 ? 'reconstructed' : 'observed');
    assert.equal(stored.revision_status, 'final');assert.equal(row.STATUS, 'A');
  }
  assert.deepEqual(fsoGdpImporter.parse(raw, context), actual);
  assert.equal(actual.find(o => o.reference_period === '1960')!.value, 45736.6860419998);
  assert.equal(actual.at(-1)!.value, 881571.800580975);
  assert.equal(series.unit.scale, 1_000_000);assert.equal(series.price_basis, 'nominal');
  assert.equal(source.rights.licence, 'FSO OPEN-BY');assert.equal(source.rights.redistribution, 'permitted');
});

test('FSO GDP importer rejects incompatible statistical identities and sources', () => {
  for (const changed of [
    { ...series, id: 'real-gdp' }, { ...series, price_basis: 'real' as const },
    { ...series, frequency: 'quarterly' as const }, { ...series, aggregation_kind: 'annual_average' as const },
    { ...series, unit: { ...series.unit, scale: 1 } }, { ...series, source_ids: ['fso'] },
  ]) assert.throws(() => fsoGdpImporter.parse(raw, { series: changed, snapshot }), /requires nominal-gdp/);
  for (const changed of [{ ...snapshot, source_id: 'fso' }, { ...snapshot, source_url: 'https://example.invalid/wrong.csv' }]) {
    assert.throws(() => fsoGdpImporter.parse(raw, { series, snapshot: changed }), /audited FSO/);
  }
  assert.throws(() => fsoGdpImporter.parse(raw.replace('PERIOD', 'YEAR'), context), /header/);
  assert.throws(() => fsoGdpImporter.parse(encode(sourceRows.filter(row => row.UNIT_MEAS !== 'MCHF')), context), /no B1GQ\/MCHF/);
  assert.throws(() => fsoGdpImporter.parse(encode([{ ...sourceRows[0], VARIABLE: 'GDPPC' }]), context), /variable or unit/);
  assert.throws(() => fsoGdpImporter.parse(encode([{ ...sourceRows[0], UNIT_MEAS: 'CHF' }]), context), /variable or unit/);
});

test('FSO GDP importer rejects duplicates, invalid periods, numeric coercions and unaudited flags', () => {
  assert.throws(() => fsoGdpImporter.parse(encode([sourceRows[0], sourceRows[0]]), context), /duplicate period/);
  for (const PERIOD of ['1946', '2026', '2020-Q1', '2020-01', '20']) {
    assert.throws(() => fsoGdpImporter.parse(encode([{ ...sourceRows[0], PERIOD }]), context), /period/);
  }
  for (const VALUE of ['', 'NA', 'NaN', 'Infinity', '0x10', '1e309', '0', '-100']) {
    assert.throws(() => fsoGdpImporter.parse(encode([{ ...sourceRows[0], VALUE }]), context), /finite positive/);
  }
  for (const STATUS of ['P', 'F', 'E', 'O', '']) {
    assert.throws(() => fsoGdpImporter.parse(encode([{ ...sourceRows[0], STATUS }]), context), /unaudited observation status/);
  }
});

test('a rejected FSO import leaves the registry, snapshots and canonical data untouched', async t => {
  const fixture = await emptyFixture();t.after(() => rm(fixture.root, { recursive: true, force: true }));
  fixture.registry.sources = [source];fixture.registry.series = [series];
  await writeFixtureRegistry(fixture.root, fixture.registry);
  const before = await readFile(path.join(fixture.root, registryPath), 'utf8');
  const file = path.join(fixture.root, 'bad-gdp.csv');
  await writeFile(file, encode([sourceRows[0], sourceRows[0]]));
  await assert.rejects(importLocal({ root: fixture.root, file, seriesId: series.id, sourceId: source.id,
    retrievedOn: '2026-10-07', importer: fsoGdpImporter }), /duplicate period/);
  assert.equal(await readFile(path.join(fixture.root, registryPath), 'utf8'), before);
  assert.deepEqual(await readdir(path.join(fixture.root, 'data/raw')), []);
  assert.deepEqual(await readdir(path.join(fixture.root, 'data/canonical')), []);
});

test('CLI selects FSO GDP, preserves original bytes and reuses immutable replacement snapshots', async t => {
  const fixture = await emptyFixture();t.after(() => rm(fixture.root, { recursive: true, force: true }));
  fixture.registry.sources = [source];fixture.registry.series = [series];
  await writeFixtureRegistry(fixture.root, fixture.registry);
  const args = ['--import', 'tsx', cli, 'import', '--root', fixture.root, '--file', path.resolve(snapshot.file),
    '--series', series.id, '--source', source.id, '--retrieved-on', '2026-10-07', '--importer', 'fso-gdp'];
  await run(process.execPath, args);await run(process.execPath, [...args, '--replace']);
  const result = await validate(fixture.root);
  assert.equal(result.observations.length, 78);assert.equal(result.registry.snapshots.length, 1);
  assert.deepEqual(await readFile(path.join(fixture.root, result.registry.snapshots[0].file)), bytes);
});

test('CLI retains the canonical CSV default and rejects an unknown importer before writing', async t => {
  const fixture = await emptyFixture();t.after(() => rm(fixture.root, { recursive: true, force: true }));
  const args = ['--import', 'tsx', cli, 'import', '--root', fixture.root, '--file', fixture.file,
    '--series', 'example-output', '--source', 'example-source', '--retrieved-on', '2026-10-07'];
  await assert.rejects(run(process.execPath, [...args, '--importer', 'unknown']), /Unknown importer/);
  assert.deepEqual(await readdir(path.join(fixture.root, 'data/raw')), []);
  await run(process.execPath, args);assert.equal((await validate(fixture.root)).observations.length, 3);
});

test('production GDP preserves original values, empty years and reconstruction boundaries', async () => {
  const data = await productionAtlas(process.cwd());assert.equal(available(data, 'nominal-gdp'), true);
  const state = addSeries(initialState(data), 'nominal-gdp', data);const panel = state.panels.at(-1)!;
  const points = pointsFor(panel, 'nominal-gdp', data, 1946, 2026);
  assert.deepEqual(points.filter(p => p.value === null).map(p => p.year), [1946, 1947, 2026]);
  const chart = chartGeometry(panel, data, 1946, 2026, 900);
  assert.deepEqual(chart.paths.map(p => p.kind), ['reconstructed', 'observed']);
  assert.ok(!chart.paths.some(p => p.points.some(p => p.year === 1994) && p.points.some(p => p.year === 1995)));
  assert.equal(pointsFor(panel, 'nominal-gdp', data, 1960, 1960)[0].value, data.observations.find(o=>o.series_id==='nominal-gdp'&&o.reference_period==='1960')!.value);
  assert.ok(data.topics.find(t => t.id === 'output')!.series_ids.includes('nominal-gdp'));
  assert.ok(data.topics.find(t => t.id === 'public-finances')!.series_ids.includes('nominal-gdp'));
});
