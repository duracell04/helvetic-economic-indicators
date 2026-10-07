import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parse} from 'csv-parse/sync';
import {load} from '../scripts/lib/store.ts';
import {productionAtlas} from '../scripts/lib/atlas-data.ts';
import {initialState} from '../src/atlas/composition.ts';
import {chartGeometry} from '../src/atlas/geometry.ts';

test('debt composite reproduces its historical fraction and current WEO table without importing central-government history',async()=>{
  const {registry,observations}=await load(process.cwd());
  const rows=observations.filter(row=>row.series_id==='general-government-debt-ratio');
  assert.deepEqual(rows.map(row=>row.reference_period),Array.from({length:81},(_,i)=>String(1946+i)));
  const snapshot=async(id:string)=>readFile(registry.snapshots.find(s=>s.source_id===id)!.file,'utf8');
  const historical=parse(await snapshot('jst-swiss-public-debt'),{columns:true}) as {year:string;iso:string;debtgdp:string}[];
  assert.equal(historical.length,44);
  for(const source of historical){
    const row=rows.find(row=>row.reference_period===source.year)!;
    assert.equal(source.iso,'CHE');
    assert.ok(Math.abs(Number(source.debtgdp)*100-row.value!)<=.050000001,source.year);
    assert.equal(row.value_kind,Number(source.year)<=1987?'reconstructed':'observed');
    assert.equal(row.source_snapshot_ids.length,1);
  }
  const official=parse(await snapshot('imf-weo-swiss-gross-debt'),{columns:true}) as {year:string;value:string}[];
  const current=parse(await snapshot('ecolod-imf-swiss-gross-debt'),{columns:true}) as {year:string;value:string;status:string}[];
  assert.equal(current.length,37);assert.equal(official.length,37);
  for(const source of current){
    const row=rows.find(row=>row.reference_period===source.year)!;
    assert.equal(row.value,Number(source.value));
    assert.ok(Math.abs(row.value!-Number(official.find(o=>o.year===source.year)!.value))<=.050000001,source.year);
    assert.equal(row.value_kind,source.status==='Forecast'?'forecast':'observed');
    assert.equal(row.source_snapshot_ids.length,2);
  }
  assert.equal(rows.at(-1)!.value,38.5);
  assert.equal(rows.at(-1)!.revision_status,'provisional');
  assert.equal(rows.at(-2)!.value,39.42);
  assert.equal(rows.at(-2)!.revision_status,'provisional');
  assert.ok(rows.slice(0,-2).every(row=>row.revision_status==='final'));
  assert.ok(registry.sources.find(s=>s.id==='jst-swiss-public-debt')!.rights.licence!.includes('BY-NC-SA'));
});

test('debt is a separate production panel with explicit source breaks and a forecast connector',async()=>{
  const data=await productionAtlas(process.cwd());
  const panel=initialState(data).panels.find(p=>p.series_ids.includes('general-government-debt-ratio'))!;
  assert.deepEqual(panel.series_ids,['general-government-debt-ratio']);
  assert.equal(panel.axis.mode,'native');
  const geometry=chartGeometry(panel,data,1946,2026,1000);
  assert.deepEqual(geometry.series[0].points.filter(p=>p.breakBefore).map(p=>p.year),[1988,1990]);
  assert.ok(geometry.paths.every(segment=>!segment.points.some(p=>p.year===1987)||!segment.points.some(p=>p.year===1988)));
  const forecast=geometry.paths.find(segment=>segment.kind==='forecast')!;
  assert.deepEqual(forecast.points.map(p=>p.year),[2025,2026]);
  const definition=data.registry.series.find(s=>s.id==='general-government-debt-ratio')!;
  assert.equal(definition.title,'General government gross debt / GDP');
  assert.ok(definition.definition.includes('not the narrower Maastricht'));
  assert.ok(!data.observations.some(o=>o.series_id==='confederation-debt-ratio'));
});
