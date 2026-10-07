import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parse} from 'csv-parse/sync';
import {load} from '../scripts/lib/store.ts';
import {productionAtlas} from '../scripts/lib/atlas-data.ts';
import {initialState} from '../src/atlas/composition.ts';

test('published yields reproduce retained source tables and monthly averages',async()=>{
  const {registry,observations}=await load(process.cwd());
  const long=observations.filter(o=>o.series_id==='confederation-10y-annual');
  const short=observations.filter(o=>o.series_id==='gmbf-3m-annual');
  assert.equal(long.length,81);assert.equal(short.length,47);
  assert.deepEqual(long.slice(0,9).map(o=>o.value_kind),Array(9).fill('reconstructed'));
  assert.ok(long.slice(9).every(o=>o.value_kind==='observed'));
  assert.equal(short[0].reference_period,'1980');
  assert.equal(short.find(o=>o.reference_period==='2009')!.value,0);
  const snapshot=async(sourceId:string)=>readFile(registry.snapshots.find(s=>s.source_id===sourceId)!.file,'utf8');
  const annual=parse(await snapshot('oecd-swiss-10y-annual'),{columns:true}) as {DATE:string;IRLTLT01CHA156N:string}[];
  for(const row of annual){
    const stored=long.find(o=>o.reference_period===row.DATE.slice(0,4))!;
    assert.ok(Math.abs(stored.value!-Number(row.IRLTLT01CHA156N))<=.0005000001,row.DATE);
  }
  const historical=parse(await snapshot('snb-historical-yields'),{columns:true}) as {year:string;confederation_yield_by_maturity:string;gmbf_3m_yield:string}[];
  for(const row of historical){
    if(row.confederation_yield_by_maturity!=='NA')assert.equal(long.find(o=>o.reference_period===row.year)!.value,Number(row.confederation_yield_by_maturity));
    if(row.gmbf_3m_yield!=='NA')assert.equal(short.find(o=>o.reference_period===row.year)!.value,Number(row.gmbf_3m_yield));
  }
  const monthly=parse(await snapshot('oecd-swiss-10y-monthly'),{columns:true}) as {DATE:string;IRLTLT01CHM156N:string}[];
  assert.equal(monthly.length,8);
  assert.deepEqual(monthly.map(o=>o.DATE),Array.from({length:8},(_,i)=>`2026-${String(i+1).padStart(2,'0')}-01`));
  assert.equal(Number((monthly.reduce((sum,row)=>sum+Number(row.IRLTLT01CHM156N),0)/8).toFixed(3)),long.at(-1)!.value);
  const money=parse(await snapshot('snb-eg3m-monthly'),{bom:true,delimiter:';',columns:true,from_line:4,skip_empty_lines:true}) as {Date:string;D0:string;Value:string}[];
  for(let year=2007;year<=2026;year++){
    const rows=money.filter(row=>row.Date.startsWith(String(year)));
    assert.deepEqual(rows.map(row=>row.Date),Array.from({length:year===2026?9:12},(_,i)=>`${year}-${String(i+1).padStart(2,'0')}`));
    assert.ok(rows.every(row=>row.D0==='EG3M'));
    assert.equal(Number((rows.reduce((sum,row)=>sum+Number(row.Value),0)/rows.length).toFixed(3)),short.find(row=>row.reference_period===String(year))!.value);
  }
  for(const rows of [long,short]){
    assert.equal(rows.at(-1)!.revision_status,'provisional');
    assert.equal(rows.at(-1)!.value_kind,'observed');
    assert.ok(rows.slice(0,-1).every(o=>o.revision_status==='final'));
  }
});

test('production exposes real yields and completed-year spreads without importing synthetic observations',async()=>{
  const data=await productionAtlas(process.cwd());
  const spreads=data.observations.filter(o=>o.series_id==='confederation-10y-minus-gmbf-3m');
  assert.equal(spreads.length,46);assert.equal(spreads[0].reference_period,'1980');assert.equal(spreads.at(-1)!.reference_period,'2025');
  assert.deepEqual(spreads.filter(o=>o.value!<0).map(o=>o.reference_period),['1980','1981','1989','1990','1991','1992','1993','2023','2024']);
  assert.ok(spreads.every(o=>o.source_snapshot_ids.length===2));
  assert.ok(data.registry.series.every(s=>s.data_class==='real'));
  const yieldIds=new Set(['confederation-10y-annual','gmbf-3m-annual','confederation-10y-minus-gmbf-3m']);
  assert.equal(data.observations.filter(o=>yieldIds.has(o.series_id)).length,174);
  assert.deepEqual(initialState(data).panels.slice(0,2).map(p=>p.series_ids),[['confederation-10y-annual','gmbf-3m-annual'],['confederation-10y-minus-gmbf-3m']]);
});
