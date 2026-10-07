import {test} from 'node:test';
import assert from 'node:assert/strict';
import {load} from '../scripts/lib/store.ts';
const {observations}=await load(process.cwd());
test('policy averages use effective calendar-day weights and exclude incomplete years',()=>{
 const rows=observations.filter(o=>o.series_id==='snb-policy-rate-annual');
 assert.deepEqual(rows.map(o=>o.reference_period),['2020','2021','2022','2023','2024','2025']);
 assert.equal(rows[0].value,-0.75);assert.equal(rows[1].value,-0.75);
 assert.ok(Math.abs(rows[2].value!-((-0.75*167-0.25*98+0.5*84+1*16)/365))<1e-14);
 const events=observations.filter(o=>o.series_id==='snb-policy-rate');
 for(const row of rows){
  const year=Number(row.reference_period);const start=Date.UTC(year,0,1),end=Date.UTC(year+1,0,1);let total=0;
  for(let day=start;day<end;day+=86400000){const date=new Date(day).toISOString().slice(0,10);total+=events.filter(o=>o.reference_period<=date).at(-1)!.value!;}
  assert.ok(Math.abs(row.value!-total/((end-start)/86400000))<1e-14);
 }
});
