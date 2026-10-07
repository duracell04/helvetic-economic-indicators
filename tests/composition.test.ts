import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDemo, validateAtlas, productionAtlas } from '../scripts/lib/atlas-data.ts';
import { initialState, addSeries, removeSeries, separateSeries, combineAbove, movePanel, compatible, validateState, encodeState, decodeState, restoreState } from '../src/atlas/composition.ts';
import { chartGeometry, pointsFor } from '../src/atlas/geometry.ts';

const data = await createDemo(process.cwd());
test('new sector, indicator and preset are metadata additions', () => {
  const energy = structuredClone(data);
  const source = energy.registry.series.find(s=>s.id==='demo-population')!;
  energy.registry.series.push({...source,id:'demo-energy',title:'Energy consumption',unit:{code:'count',label:'GWh',dimension:'energy',scale:1}});
  energy.observations.push(...energy.observations.filter(o=>o.series_id===source.id).map(o=>({...o,series_id:'demo-energy'})));
  energy.topics.push({id:'energy',title:'Energy',description:'Synthetic extensibility test',series_ids:['demo-energy','demo-population']});
  const config=initialState(energy);config.preset_id='energy';config.panels=[{id:'energy-panel',title:'Energy',series_ids:['demo-energy'],axis:{mode:'native',base_year:null},conventions_acknowledged:false}];
  energy.presets.push({id:'energy',title:'Energy',config});
  validateAtlas(energy);
  const state=initialState(energy,'energy');
  assert.equal(chartGeometry(state.panels[0],energy,1946,2025,900).paths.length,2);
  assert.equal(energy.topics.at(-1)!.series_ids.length,2);
});
test('composition adds, removes empty panels, separates, combines and reorders',()=>{
  const state=initialState(data,'reference');
  const separated=separateSeries(state,state.panels[0].id,'demo-population',data);
  assert.equal(separated.panels.length,4);
  const combined=combineAbove(separated,separated.panels[1].id,'demo-population',data,{index:1960,acknowledge:true});
  assert.deepEqual(combined,state);
  const added=addSeries(state,'demo-confederation-10y-annual',data);
  assert.equal(added.panels.length,4);
  assert.equal(movePanel(added,added.panels[3].id,-1).panels[2].id,added.panels[3].id);
  assert.equal(removeSeries(added,added.panels[3].id,'demo-confederation-10y-annual').panels.length,3);
});
test('units, aggregation, frequency, price basis and positive index bases are explicit',()=>{
  const state=initialState(data,'reference'), panel=structuredClone(state.panels[0]);
  panel.axis={mode:'native',base_year:null};assert.equal(compatible(panel,data).kind,'index');
  const rates=structuredClone(state.panels[1]);rates.conventions_acknowledged=false;assert.equal(compatible(rates,data).kind,'acknowledge');
  const invalid=structuredClone(state);invalid.panels[0].axis.base_year=1971;assert.throws(()=>validateState(invalid,data),/positive observation/);
  const period={...state,start_year:1980,end_year:2000};assert.equal(validateState(period,data).panels[0].axis.base_year,1960);
  const changed=structuredClone(data);changed.registry.series.find(s=>s.id==='demo-real-gdp')!.price_basis='nominal';assert.equal(compatible(state.panels[0],changed).kind,'separate');
  changed.registry.series.find(s=>s.id==='demo-population')!.frequency='monthly';assert.equal(compatible(state.panels[0],changed).kind,'separate');
  const unequal=structuredClone(data);unequal.registry.series.find(s=>s.id===rates.series_ids[1])!.unit.scale=100;assert.equal(compatible(rates,unequal).kind,'separate');
});
test('geometry keeps absent years, break boundaries and status segments',()=>{
  const state=initialState(data,'reference');
  const points=pointsFor(state.panels[0],'demo-real-gdp-per-capita',data,1970,1972);
  assert.equal(points[1].value,null);
  const paths=chartGeometry(state.panels[0],data,1970,1972,900).paths.filter(p=>p.id==='demo-real-gdp-per-capita');assert.equal(paths.length,2);
  const policy=chartGeometry(state.panels[2],data,1946,2026,900);
  assert.ok(policy.paths.some(p=>p.kind==='forecast'));assert.ok(policy.paths.some(p=>p.kind==='reconstructed'));
  assert.ok(policy.series[0].points.find(p=>p.year===1999)!.breakBefore);
  assert.ok(!policy.paths.some(p=>p.points.some(p=>p.year===1998)&&p.points.some(p=>p.year===1999)));
});
test('shared configurations round-trip, take priority and recover from invalid states',()=>{
  const state=initialState(data,'reference');
  assert.deepEqual(decodeState(encodeState(state),data),state);
  assert.deepEqual(restoreState(data,'#chart='+encodeState(state),JSON.stringify(initialState(data))).state,state);
  assert.deepEqual(restoreState(data,'',JSON.stringify(state)).state,state);
  assert.ok(restoreState(data,'#chart=invalid',JSON.stringify(state)).message);
  assert.deepEqual(restoreState(data,'#chart=invalid',JSON.stringify(state)).state,state);
  assert.equal(restoreState(data,'#chart=','invalid').state.preset_id,data.default_preset_id);
  const wrong=structuredClone(state);wrong.version='1.0.0' as '2.0.0';assert.throws(()=>validateState(wrong,data));
});
test('synthetic production rejection, candidate unavailability and deterministic demo',async()=>{
  assert.throws(()=>validateAtlas({...data,mode:'production'},true),/synthetic/);
  const production=await productionAtlas(process.cwd());assert.equal(initialState(production).panels.length,0);assert.equal(production.observations.length,0);
  assert.throws(()=>validateState(initialState(data),production));
  const again=await createDemo(process.cwd());assert.deepEqual(again,data);
});
