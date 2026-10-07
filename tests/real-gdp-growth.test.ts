import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { fsoRealGrowthImporter } from '../scripts/lib/fso-gdp.ts';
import { load } from '../scripts/lib/store.ts';
const { registry, observations } = await load(process.cwd());
const series = registry.series.find(s => s.id === 'real-gdp-growth')!;
const snapshot = registry.snapshots.find(s => s.source_id === 'fso-gdp-long-series')!;
const raw = await readFile(snapshot.file, 'utf8');
const context = { series, snapshot };
const selected = (parse(raw, { bom: true, columns: true }) as Record<string,string>[]).filter(r => r.UNIT_MEAS === 'ACPP');
const csv = (rows: Record<string,string>[]) => stringify(rows, { header: true });
test('published real growth matches every source value with gaps and reconstruction labels', () => {
 const actual = observations.filter(o => o.series_id === series.id);
 assert.equal(actual.length, 77);assert.deepEqual(fsoRealGrowthImporter.parse(raw, context), actual);
 for (const row of selected.filter(r => r.STATUS === 'A')) {
  const value = actual.find(o => o.reference_period === row.PERIOD)!;
  assert.equal(value.value, Number(row.VALUE));assert.equal(value.value_kind, Number(row.PERIOD) < 1995 ? 'reconstructed' : 'observed');
 }
 assert.equal(actual[0].reference_period, '1949');assert.equal(actual.at(-1)!.reference_period, '2025');
 assert.equal(series.price_basis, 'real');assert.ok(actual.some(o => o.value! < 0));
});
test('real growth rejects duplicate years, invalid values, flags and nominal/source selections', () => {
 const row = selected[1];
 assert.throws(() => fsoRealGrowthImporter.parse(csv([row,row]),context),/Duplicate/);
 for (const value of ['', 'NaN','0x10','Infinity','-100']) assert.throws(() => fsoRealGrowthImporter.parse(csv([{...row,VALUE:value}]),context),/Invalid/);
 assert.throws(() => fsoRealGrowthImporter.parse(csv([{...row,STATUS:'P'}]),context),/status/);
 assert.throws(() => fsoRealGrowthImporter.parse(csv([{...row,UNIT_MEAS:'AC'}]),context),/No B1GQ/);
 assert.throws(() => fsoRealGrowthImporter.parse(raw,{...context,series:{...series,price_basis:'nominal'}}),/identity/);
 assert.throws(() => fsoRealGrowthImporter.parse(raw,{...context,snapshot:{...snapshot,source_id:'fso'}}),/source/);
});
