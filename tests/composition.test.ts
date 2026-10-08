import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createDemo, validateAtlas, productionAtlas } from '../scripts/lib/atlas-data.ts';
import { initialState, emptyState, availableYearRange, panelYears, available, addSeries, removeSeries, separateSeries, combineAbove, movePanel, compatible, validateState, encodeState, decodeState, restoreState } from '../src/atlas/composition.ts';
import { chartGeometry, pointsFor } from '../src/atlas/geometry.ts';

const data = await createDemo(process.cwd());
test('new timelines start empty while saved and shared charts remain intact',()=>{
  const empty=emptyState(data),preset=initialState(data);
  assert.deepEqual(empty.panels,[]);assert.deepEqual(restoreState(data,'',null).state,empty);
  assert.deepEqual(restoreState(data,'',JSON.stringify(preset)).state,preset);
  assert.deepEqual(restoreState(data,'#chart='+encodeState(preset),null).state,preset);
  assert.deepEqual(restoreState(data,'#chart=invalid','invalid').state,empty);
  assert.deepEqual(restoreState(data,'',JSON.stringify(empty)).state,empty);
});
test('chart ranges use nonmissing annual observations and remain independent in saved layouts',async()=>{
  const production=await productionAtlas(process.cwd());
  assert.deepEqual(availableYearRange(production,['nominal-gdp']),{start_year:1948,end_year:2025});
  const current=addSeries(addSeries(emptyState(production),'nominal-gdp',production),'gmbf-3m-annual',production);
  assert.deepEqual(panelYears(current.panels[0],current),{start_year:1948,end_year:2025});
  assert.deepEqual(panelYears(current.panels[1],current),{start_year:1980,end_year:2026});
  current.panels[0].start_year=2000;current.panels[0].end_year=2020;
  const shortened=validateState(current,production);
  assert.deepEqual(panelYears(shortened.panels[1],shortened),{start_year:1980,end_year:2026});
  assert.deepEqual(decodeState(encodeState(shortened),production),shortened);
  const legacy={...initialState(production),start_year:1990,end_year:2010};
  for(const panel of legacy.panels){delete panel.start_year;delete panel.end_year;}
  assert.ok(validateState(legacy,production).panels.every(panel=>panel.start_year===1990&&panel.end_year===2010));
  const invalid=structuredClone(shortened);invalid.panels[0].start_year=2021;assert.throws(()=>validateState(invalid,production),/Chart years/);
  const single=structuredClone(shortened);single.panels[0].start_year=2020;single.panels[0].end_year=2020;
  const year=validateState(single,production);assert.equal(chartGeometry(year.panels[0],production,2020,2020,900).series[0].points.length,1);
  assert.throws(()=>availableYearRange(production,[production.registry.series.find(series=>series.frequency!=='annual')!.id]),/annual observations are unavailable/);
});
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
  const rates=state.panels.find(p=>p.id==='stability')!;
  const separated=separateSeries(state,rates.id,'demo-registered-unemployment-annual',data);
  assert.equal(separated.panels.length,state.panels.length+1);
  const newPanel=separated.panels.find(p=>p.series_ids.length===1&&p.series_ids[0]==='demo-registered-unemployment-annual')!;
  const combined=combineAbove(separated,newPanel.id,'demo-registered-unemployment-annual',data,{acknowledge:true});
  assert.deepEqual(combined,state);
  const added=addSeries(state,'demo-confederation-10y-annual',data);
  assert.equal(added.panels.length,state.panels.length+1);
  const last=added.panels.at(-1)!;
  assert.equal(movePanel(added,last.id,-1).panels.at(-2)!.id,last.id);
  assert.equal(removeSeries(added,last.id,'demo-confederation-10y-annual').panels.length,state.panels.length);
});
test('original axes require compatible units, aggregation, frequency and price basis',()=>{
  const state=initialState(data,'reference'),panel=structuredClone(state.panels[0]);
  panel.series_ids.push('demo-population');assert.equal(compatible(panel,data).kind,'separate');
  const rates=structuredClone(state.panels.find(p=>p.id==='stability')!);rates.conventions_acknowledged=false;assert.equal(compatible(rates,data).kind,'acknowledge');
  const invalid=structuredClone(state);invalid.panels[0].axis.base_year=1971;assert.throws(()=>validateState(invalid,data),/Native panels/);
  const period={...state,start_year:1980,end_year:2000};assert.ok(validateState(period,data).panels.every(p=>p.axis.mode==='native'&&p.axis.base_year===null));
  const changed=structuredClone(data);changed.registry.series.find(s=>s.id==='demo-real-gdp')!.price_basis='nominal';
  panel.series_ids=['demo-real-gdp','demo-real-gdp-per-capita'];assert.equal(compatible(panel,changed).kind,'separate');
  panel.series_ids=['demo-real-gdp','demo-population'];changed.registry.series.find(s=>s.id==='demo-population')!.frequency='monthly';assert.equal(compatible(panel,changed).kind,'separate');
  const unequal=structuredClone(data);unequal.registry.series.find(s=>s.id===rates.series_ids[1])!.unit.scale=100;assert.equal(compatible(rates,unequal).kind,'separate');
});
test('former indexed layouts restore in original units with incompatible quantities separated',()=>{
  const state=initialState(data,'reference');
  const old={...state,show_raw:true,panels:[{...state.panels[0],series_ids:['demo-real-gdp','demo-real-gdp-per-capita','demo-population'],axis:{mode:'indexed' as const,base_year:1960}},...state.panels.slice(3)]};
  const restored=restoreState(data,'',JSON.stringify(old)).state;
  assert.equal(restored.panels.length,5);assert.equal(restored.show_raw,false);
  assert.ok(restored.panels.every(p=>p.axis.mode==='native'&&p.axis.base_year===null));
  assert.deepEqual(restored.panels.slice(0,3).map(p=>p.series_ids),[['demo-real-gdp'],['demo-real-gdp-per-capita'],['demo-population']]);
  assert.deepEqual(decodeState(encodeState(old),data),restored);
  for(const panel of restored.panels)for(const id of panel.series_ids){
    const point=pointsFor(panel,id,data,1960,1960)[0];assert.equal(point.value,point.raw);
  }
  const collided={...old,panels:[...old.panels,{...state.panels.at(-1)!,id:'panel-1'}]};
  const migrated=validateState(collided,data);assert.equal(new Set(migrated.panels.map(p=>p.id)).size,migrated.panels.length);
});
test('geometry keeps absent years, break boundaries and status segments',()=>{
  const state=initialState(data,'reference');
  const points=pointsFor(state.panels[1],'demo-real-gdp-per-capita',data,1970,1972);
  assert.equal(points[1].value,null);
  const paths=chartGeometry(state.panels[1],data,1970,1972,900).paths.filter(p=>p.id==='demo-real-gdp-per-capita');assert.equal(paths.length,2);
  const policy=chartGeometry(state.panels.find(p=>p.id==='policy')!,data,1946,2026,900);
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
  const production=await productionAtlas(process.cwd());assert.equal(initialState(production).panels.length,3);
  assert.ok(production.observations.length>0);
  assert.ok(production.registry.series.every(s=>s.data_class==='real'));
  const candidate=structuredClone(production);candidate.registry.series.find(s=>s.id==='population')!.verification='candidate';
  assert.equal(available(candidate,'population'),false);
  assert.throws(()=>validateState(initialState(data),production));
  const again=await createDemo(process.cwd());assert.deepEqual(again,data);
});
