import { test } from 'node:test';
import assert from 'node:assert/strict';
import { derive as calculate, assertCompatible as compatible } from '../scripts/lib/transforms.ts';
import { validateMetadata } from '../scripts/lib/store.ts';
import { fixtureSeries, populatedFixture } from './helpers.ts';
import { rm } from 'node:fs/promises';
import type { Observation, Series, Transformation } from '../scripts/lib/schema.ts';

const specs = new Map<string,Transformation>();
const derive = (target:Series,inputs:Series[],rows:Observation[]) => calculate(target,inputs,rows,specs.get(target.id)!);
const assertCompatible = (target:Series,inputs:Series[]) => compatible(target,inputs,specs.get(target.id)!);
const input = fixtureSeries();
const row = (reference_period: string, value: number | null, series_id = input.id): Observation => ({ series_id, reference_period, value, source_snapshot_ids: ['snapshot-example'], publication_date: null, value_kind: 'observed', revision_status: 'final' });
const growth: Series = {...input,id:'example-growth',measurement:'growth',unit:{code:'percent',label:'Percent',dimension:'percent',scale:1}};
const growthSpec: Transformation = {id:'calculate-growth',output_series_id:growth.id,method:'growth',inputs:[input.id],convention:'100 × (current / prior calendar year − 1)'};
const rebase: Series = {...input,id:'example-rebased'};
const rebaseSpec: Transformation = {id:'calculate-rebase',output_series_id:rebase.id,method:'rebase',inputs:[input.id],base_period:'2020',convention:'2020 = 100'};

specs.set(growth.id,growthSpec);specs.set(rebase.id,rebaseSpec);

test('growth uses the previous calendar year, preserves nulls and does not bridge gaps', () => {
  const result = derive(growth, [input], [row('2020', 100), row('2021', 110), row('2022', null), row('2024', 140)]);
  assert.equal(result.length, 2);
  assert.ok(Math.abs(result[0].value! - 10) < 1e-10);
  assert.equal(result[1].value, null);
  assert.throws(() => derive(growth, [input], [row('2020', 0), row('2021', 1)]), /positive denominator/);
});

test('rebasing uses a fixed valid base and preserves missing values', () => {
  assert.deepEqual(derive(rebase, [input], [row('2020', 50), row('2021', 60), row('2022', null)]).map(o => o.value), [100, 120, null]);
  assert.throws(() => derive(rebase, [input], [row('2021', 60)]), /base value/);
  assert.throws(() => derive(rebase, [input], [row('2020', -2)]), /base value/);
});

test('spreads align periods and produce percentage points, not relative percentage changes', () => {
  const long = { ...input, id: 'example-long', unit: { code: 'percent' as const, label: 'Percent', dimension:'percent', scale:1 } };
  const short = { ...long, id: 'example-short' };
  const target: Series = {...long,id:'example-spread',measurement:'spread',unit:{code:'percentage_points',label:'Percentage points',dimension:'percentage_points',scale:1}};
  specs.set(target.id,{id:'calculate-spread',output_series_id:target.id,method:'spread',inputs:[long.id,short.id],convention:'Long minus short in percentage points'});
  const result = derive(target, [long, short], [row('2020', 2, long.id), row('2021', 3, long.id), row('2020', 0.5, short.id), row('2022', 4, short.id)]);
  assert.deepEqual(result.map(o => [o.reference_period, o.value]), [['2020', 1.5]]);
  assert.throws(() => assertCompatible(target, [long, input]), /incorrect input/);
  assert.throws(() => assertCompatible(target, [long, { ...short, unit: { code: 'index', label: 'Index', dimension:'index', scale:1 } }]), /percent inputs/);
  assert.throws(() => assertCompatible(target, [long, { ...short, unit:{...short.unit,scale:100} }]), /matching scales/);
  assert.throws(() => assertCompatible(target, [long, { ...short, aggregation_kind:'annual_average' }]), /annual aggregation/);
  assert.throws(() => assertCompatible(target, [long, { ...short, frequency: 'monthly' }]), /annual/);
  assert.throws(() => assertCompatible(target, [long, { ...short, institutional_coverage: 'Other economy' }]), /coverage/);
});

test('mixed observation statuses require an explicit decision', () => {
  assert.throws(() => derive(growth, [input], [row('2020', 100), { ...row('2021', 110), value_kind: 'forecast' }]), /statuses differ/);
  assert.throws(() => derive(growth, [input], [row('2020', 100), { ...row('2021', 110), revision_status: 'provisional' }]), /statuses differ/);
});

test('validation detects stale derived values and cycles', async t => {
  const { root, registry, rows } = await populatedFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  registry.series.push(growth);
  registry.transformations.push(growthSpec);
  const derived = derive(growth, [registry.series[0]], rows);
  validateMetadata(registry, [...rows, ...derived]);
  assert.throws(() => validateMetadata(registry, [...rows, { ...derived[0], value: 999 }, ...derived.slice(1)]), /stale or incorrect/);
  registry.transformations.push({id:'cycle-input',output_series_id:input.id,method:'rebase',inputs:[rebase.id],base_period:'2020',convention:'Cycle test'},rebaseSpec);
  registry.series.push(rebase);
  assert.throws(() => validateMetadata(registry, rows), /Cyclic/);
});
