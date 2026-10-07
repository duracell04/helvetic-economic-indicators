import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parse} from 'csv-parse/sync';
import {stringify} from 'csv-stringify/sync';
import {load,checksum} from '../scripts/lib/store.ts';
import {fsoPopulationImporter} from '../scripts/lib/fso-population.ts';
const {registry,observations}=await load(process.cwd());
const series=registry.series.find(s=>s.id==='population')!;
const snapshot=registry.snapshots.find(s=>s.source_id==='fso-population-long')!;
const bytes=await readFile(snapshot.file),raw=bytes.toString('utf8');
const rows=(parse(raw,{bom:true,columns:true}) as Record<string,string>[]).filter(r=>r.REFERENCE_POPULATION==='POP_DEC');
const encode=(r:Record<string,string>[])=>stringify(r,{header:true});
const context={series,snapshot};
test('population reproduces all year-end source counts and historical labels',()=>{
 const actual=observations.filter(o=>o.series_id===series.id);assert.equal(actual.length,165);
 assert.equal(checksum(bytes),snapshot.sha256);assert.deepEqual(fsoPopulationImporter.parse(raw,context),actual);
 for(const r of rows){const o=actual.find(o=>o.reference_period===r.YEAR)!;assert.equal(o.value,Number(r.VALUE));assert.equal(o.value_kind,Number(r.YEAR)<=1980?'reconstructed':'observed');}
 assert.equal(actual.at(-1)!.reference_period,'2025');assert.equal(series.aggregation_kind,'end_of_period');assert.equal(series.unit.scale,1);
});
test('population rejects duplicate periods, noninteger values and wrong selection or source',()=>{
 assert.throws(()=>fsoPopulationImporter.parse(encode([rows[0],rows[0]]),context),/Duplicate/);
 for(const VALUE of ['', 'NaN','2.5','-1','0','1e5'])assert.throws(()=>fsoPopulationImporter.parse(encode([{...rows[0],VALUE}]),context),/integer/);
 assert.throws(()=>fsoPopulationImporter.parse(encode([{...rows[0],REFERENCE_POPULATION:'POP_JAN'}]),context),/No year-end/);
 assert.throws(()=>fsoPopulationImporter.parse(raw,{...context,series:{...series,aggregation_kind:'annual_average'}}),/Incompatible/);
 assert.throws(()=>fsoPopulationImporter.parse(raw,{...context,snapshot:{...snapshot,source_url:'https:\/\/example.invalid'}}),/Incompatible/);
});
