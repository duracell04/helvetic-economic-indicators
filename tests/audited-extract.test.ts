import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {parse} from 'csv-parse/sync';
import {stringify} from 'csv-stringify/sync';
import {load,checksum} from '../scripts/lib/store.ts';
import {auditedExtractImporter,extractSpecs} from '../scripts/lib/audited-extract.ts';
const {registry,observations}=await load(process.cwd());
for(const [id,spec] of Object.entries(extractSpecs)) {
 test(`${id}: reproduces every retained publisher value and immutable extraction`,async()=>{
  const recipe=JSON.parse(await readFile(`data/extractions/${id}.json`,'utf8'));
  const series=registry.series.find(s=>s.id===id)!;
  const snapshot=registry.snapshots.find(s=>s.source_id===spec.source && observations.some(o=>o.series_id===id && o.source_snapshot_ids.includes(s.id)))!;
  const bytes=await readFile(snapshot.file);
  assert.equal(checksum(bytes),snapshot.sha256);
  assert.equal(checksum(await readFile(recipe.original_file)),recipe.original_sha256);
  const directory=await mkdtemp(path.join(tmpdir(),'audited-extract-'));
  try {
   const output=path.join(directory,'extract.csv');
   execFileSync('python3',['scripts/prepare-extract.py',`data/extractions/${id}.json`,recipe.original_file,output]);
   assert.deepEqual(await readFile(output),bytes);
  } finally {await rm(directory,{recursive:true,force:true});}
  const actual=observations.filter(o=>o.series_id===id);
  assert.equal(actual.length,recipe.expected_count);
  assert.equal(actual[0].reference_period,spec.first);assert.equal(actual.at(-1)!.reference_period,spec.last);
  assert.deepEqual(auditedExtractImporter.parse(bytes.toString('utf8'),{series,snapshot}),actual);
  const rows=parse(bytes,{columns:true}) as Record<string,string>[];
  for(const [i,row] of rows.entries()){assert.equal(actual[i].reference_period,row.reference_period);assert.equal(actual[i].value,Number(row.value));}
 });
 test(`${id}: rejects duplicate periods, invalid values, wrong selections, units and sources`,async()=>{
  const series=registry.series.find(s=>s.id===id)!;
  const snapshot=registry.snapshots.find(s=>s.source_id===spec.source && observations.some(o=>o.series_id===id && o.source_snapshot_ids.includes(s.id)))!;
  const raw=await readFile(snapshot.file,'utf8'),rows=parse(raw,{columns:true}) as Record<string,string>[];
  const encode=(r:Record<string,string>[])=>stringify(r,{header:true});const context={series,snapshot};
  assert.throws(()=>auditedExtractImporter.parse(encode([rows[0],rows[0]]),context),/Duplicate/);
  for(const value of ['','NaN','Infinity','abc',String(spec.minimum-1),String(spec.maximum+1)]) assert.throws(()=>auditedExtractImporter.parse(encode([{...rows[0],value}]),context),/Invalid/);
  assert.throws(()=>auditedExtractImporter.parse(encode([{...rows[0],reference_period:'invalid'}]),context),/period/);
  assert.throws(()=>auditedExtractImporter.parse(encode([{...rows[0],source_identifier:'wrong'}]),context),/selection/);
  assert.throws(()=>auditedExtractImporter.parse(raw,{...context,series:{...series,unit:{...series.unit,scale:10}}}),/Incompatible/);
  assert.throws(()=>auditedExtractImporter.parse(raw,{...context,snapshot:{...snapshot,source_url:'https://example.invalid'}}),/Incompatible/);
 });
}
