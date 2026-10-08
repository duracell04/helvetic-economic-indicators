import {test,expect,type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import type {AtlasData} from '../../src/atlas/contracts.ts';
import {initialState,encodeState} from '../../src/atlas/composition.ts';
import {resolveSiteConfig} from '../../site.config.mjs';
const productionURL=`http://127.0.0.1:4323${resolveSiteConfig().base}`;
const ready=async(page:Page)=>{await page.goto('./');await expect(page.locator('#atlas')).toHaveAttribute('data-ready','true');};
const panel=(page:Page,index:number)=>page.locator('.chart-panel').nth(index);
const add=async(page:Page,title:string,target='')=>{
  await page.getByRole('button',{name:'+ Add indicator',exact:true}).click();
  await page.getByRole('searchbox',{name:'Search indicators'}).fill(title);
  await page.locator('#add-target').selectOption(target);
  await page.locator(`button[aria-label="Add ${title}"]:not([disabled])`).first().click();
};
test('production branding, saved layouts and navigation follow the configured Pages path',async({page},testInfo)=>{
  await page.goto(productionURL);await expect(page.locator('#atlas')).toHaveAttribute('data-ready','true');
  await expect(page.getByRole('heading',{name:'Swiss Economic Atlas',exact:true})).toBeVisible();
  await expect(page).toHaveTitle('Economic atlas · Swiss Economic Atlas');
  await expect(page.locator('.chart-panel select')).toHaveCount(0);await expect(page.locator('#toggle-raw')).toHaveCount(0);
  await page.locator('#start-year').fill('1980');await page.locator('#start-year').press('Tab');
  expect(await page.evaluate(()=>localStorage.getItem('hei-atlas-production-v2'))).not.toBeNull();
  await page.reload();await expect(page.locator('#start-year')).toHaveValue('1980');
  await page.getByRole('button',{name:'Share ↗',exact:true}).click();
  const shared=await page.locator('#share-link').inputValue();expect(shared.startsWith(productionURL+'#chart=')).toBe(true);
  await page.getByRole('button',{name:'Close share dialog'}).click();await page.getByRole('button',{name:'Reset',exact:true}).click();
  await page.goto(shared);await expect(page.locator('#start-year')).toHaveValue('1980');
  await page.getByRole('link',{name:'Indicators & topics',exact:true}).click();
  await expect(page).toHaveURL(productionURL+'series/');
  const navigation=page.getByRole('navigation',{name:'Main navigation'});
  await navigation.getByRole('link',{name:'Methodology',exact:true}).click();await expect(page).toHaveURL(productionURL+'methodology/');
  await navigation.getByRole('link',{name:'Downloads',exact:true}).click();await expect(page).toHaveURL(productionURL+'downloads/');
  await page.getByRole('link',{name:'Swiss Economic Atlas home',exact:true}).click();await expect(page).toHaveURL(productionURL);
  const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
  await page.screenshot({path:`.cache/evidence-branding-${testInfo.project.name}.png`,fullPage:true});
});
test('original-unit composition, reorder, ranges and saved/shared layouts',async({page})=>{
  await ready(page);await expect(page.locator('.chart-panel')).toHaveCount(5);
  await expect(page.locator('#demo-banner')).toContainText('Synthetic demonstration');
  await expect(page.locator('.chart-panel select')).toHaveCount(0);await expect(page.locator('#toggle-raw')).toHaveCount(0);
  await page.locator('[data-indicator="demo-registered-unemployment-annual"]').getByRole('button',{name:'Separate Annual registered unemployment',exact:true}).click();await expect(page.locator('.chart-panel')).toHaveCount(6);
  await page.locator('[data-indicator="demo-registered-unemployment-annual"]').getByRole('button',{name:'Combine Annual registered unemployment with panel above',exact:true}).click();await expect(page.locator('.chart-panel')).toHaveCount(5);
  await panel(page,0).getByRole('button',{name:/Move .* down/}).click();await expect(panel(page,0)).toContainText('Real GDP per capita');
  await panel(page,1).getByRole('button',{name:/Move .* up/}).click();
  await page.locator('#start-year').fill('1980');await page.locator('#start-year').press('Tab');
  await page.locator('#end-year').fill('2020');await page.locator('#end-year').press('Tab');
  await expect(page.locator('.chart-panel input[type="number"]')).toHaveCount(0);
  await add(page,'Population');await expect(page.locator('.chart-panel')).toHaveCount(6);
  await panel(page,5).getByRole('button',{name:/Remove Population/}).click();await expect(page.locator('.chart-panel')).toHaveCount(5);
  await page.reload();await expect(page.locator('#start-year')).toHaveValue('1980');
  await page.getByRole('button',{name:'Share ↗',exact:true}).click();const url=await page.locator('#share-link').inputValue();expect(url).toContain('#chart=');
  await page.getByRole('button',{name:'Close share dialog'}).click();await page.getByRole('button',{name:'Reset',exact:true}).click();await expect(page.locator('.chart-panel')).toHaveCount(5);await expect(page.locator('#start-year')).toHaveValue('1946');await expect(panel(page,0)).toHaveAttribute('data-panel','levels');
  await page.goto(url);await expect(page.locator('.chart-panel')).toHaveCount(5);await expect(page.locator('#start-year')).toHaveValue('1980');
});
test('unlike units stay separate and differing annual conventions require acknowledgment',async({page})=>{
  await ready(page);
  await page.locator('[data-indicator="demo-population"]').getByRole('button',{name:'Combine Population with panel above',exact:true}).click();
  await expect(page.locator('#atlas-status')).toContainText('separate synchronized panels');await expect(page.locator('.chart-panel')).toHaveCount(5);await expect(page.locator('#comparison-dialog')).not.toBeVisible();
  await add(page,'Annual CPI inflation');const targetId=await page.locator('.chart-panel').last().getAttribute('data-panel');
  await add(page,'Annual SNB policy rate',targetId!);await expect(page.locator('#comparison-dialog')).toBeVisible();await expect(page.locator('#comparison-description')).toContainText('different conventions');await page.locator('#approve-comparison').click();
  await expect(page.locator('.chart-panel').last()).toContainText('Different annual conventions acknowledged');
  await add(page,'Population',targetId!);await expect(page.locator('#atlas-status')).toContainText('separate synchronized panels');await expect(page.locator('.chart-panel')).toHaveCount(7);
});
test('former indexed saved and shared layouts render only original units without removed controls',async({page})=>{
  const data=JSON.parse(await readFile('.cache/atlas-demo.json','utf8')) as AtlasData;
  const current=initialState(data);
  const legacy={...current,start_year:1980,show_raw:true,panels:[{...current.panels[0],series_ids:['demo-real-gdp','demo-real-gdp-per-capita','demo-population'],axis:{mode:'indexed' as const,base_year:1960}},...current.panels.slice(3)]};
  await page.addInitScript(value=>localStorage.setItem('hei-atlas-demo-v2',JSON.stringify(value)),legacy);
  await ready(page);await expect(page.locator('.chart-panel')).toHaveCount(5);await expect(page.locator('#start-year')).toHaveValue('1980');
  await expect(page.locator('.chart-panel select')).toHaveCount(0);await expect(page.locator('#toggle-raw')).toHaveCount(0);await expect(page.locator('[data-raw-label]')).toHaveCount(0);
  await panel(page,0).locator('svg').focus();await panel(page,0).locator('svg').press('Home');await expect(page.locator('#readout')).not.toContainText('Index');
  await page.goto('./#chart='+encodeState(legacy));await expect(page.locator('.chart-panel')).toHaveCount(5);await expect(page.locator('#start-year')).toHaveValue('1980');
  await expect(page.locator('[data-raw-label]')).toHaveCount(0);await expect(page.locator('#panels')).not.toContainText('Index ·');
  await page.getByRole('button',{name:'Reset',exact:true}).click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('hei-atlas-demo-v2')!));expect(saved.show_raw).toBe(false);expect(saved.panels.every((p:{axis:{mode:string}})=>p.axis.mode==='native')).toBe(true);
});
test('synchronized cursor, missing values, pinning, keyboard, annotations and resizing',async({page},testInfo)=>{
  await ready(page);
  const chart=panel(page,0).locator('svg');await chart.focus();await chart.press('Home');await expect(page.locator('#year-label')).toContainText('1946 · pinned');await chart.press('End');await expect(page.locator('#year-label')).toContainText('2025 · pinned');await chart.press('ArrowLeft');await expect(page.locator('#readout')).toContainText('revised');
  await chart.press('Escape');await expect(page.locator('#readout')).toBeHidden();
  const overlay=panel(page,0).locator('[data-overlay]');const bounds=(await overlay.boundingBox())!;
  const x=bounds.x+bounds.width*(1971-1946)/(2025-1946),y=bounds.y+50;
  if(testInfo.project.name==='mobile')await page.touchscreen.tap(x,y);else await page.mouse.move(x,y);
  await expect(page.locator('#year-label')).toContainText('1971');await expect(page.locator('#readout')).toContainText('No observation');await expect(page.locator('#readout')).not.toContainText('Index');
  for(const line of await page.locator('[data-cursor]').all())await expect(line).toHaveAttribute('opacity','.6');
  if(testInfo.project.name==='desktop'){await page.mouse.click(x,y);await page.mouse.move(x+50,y);await expect(page.locator('#year-label')).toContainText('1971 · pinned');}
  await page.locator('#release-year').click();
  await expect(page.locator('[data-annotation]')).toHaveCount(10);
  await page.locator('#toggle-events').click();await expect(page.locator('[data-event-label]')).toHaveCount(0);
  await page.locator('#toggle-intervals').click();await expect(page.locator('[data-annotation]')).toHaveCount(0);
  await expect(page.locator('#toggle-raw')).toHaveCount(0);await expect(page.locator('[data-raw-label]')).toHaveCount(0);
  await page.locator('#end-year').fill('2026');await page.locator('#end-year').press('Tab');await expect(page.locator('[data-kind="forecast"]')).toHaveCount(6);
  await expect(page.locator('[data-statistical-break]')).toHaveCount(1);
  if(testInfo.project.name==='desktop'){await page.setViewportSize({width:1000,height:800});let b:{x:number;y:number}|null=null;await expect.poll(async()=>{b=await overlay.boundingBox();return Boolean(b);}).toBe(true);await page.mouse.move(b!.x+80,b!.y+40);await expect(page.locator('#readout')).toBeVisible();}
  const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
  await page.screenshot({path:`.cache/evidence-${testInfo.project.name}.png`,fullPage:true});
});
test('invalid shared layouts recover; new energy definitions render without code changes',async({page})=>{
  await page.goto('./#chart=invalid');await expect(page.locator('#atlas-status')).toContainText('invalid or unavailable');await expect(page.locator('.chart-panel')).toHaveCount(5);
  const data=JSON.parse(await readFile('.cache/atlas-demo.json','utf8')) as AtlasData;
  const source=data.registry.series.find(s=>s.id==='demo-population')!;
  data.registry.series.push({...source,id:'demo-energy',title:'Energy consumption',unit:{code:'count',label:'GWh',dimension:'energy',scale:1}});data.observations.push(...data.observations.filter(o=>o.series_id===source.id).map(o=>({...o,series_id:'demo-energy'})));
  data.topics.push({id:'energy',title:'Energy',description:'Synthetic test',series_ids:['demo-energy']});
  const config=initialState(data);config.preset_id='energy';config.panels=[{id:'energy-panel',title:'Energy',series_ids:['demo-energy'],axis:{mode:'native',base_year:null},conventions_acknowledged:false}];data.presets.push({id:'energy',title:'Energy',config});data.default_preset_id='energy';
  await page.route('**/data/atlas.json',route=>route.fulfill({json:data}));await ready(page);await expect(panel(page,0)).toContainText('Energy consumption');await expect(page.locator('[data-series-id="demo-energy"]')).toHaveCount(2);
  await page.locator('#add-indicator').click();await page.locator('#indicator-search').fill('energy');await expect(page.locator('#indicator-list')).toContainText('Energy');
});
test('production renders yields, debt and distinct 2026 statuses',async({page},testInfo)=>{
  await page.goto(productionURL);await expect(page.locator('#atlas')).toHaveAttribute('data-ready','true');await expect(page.locator('#demo-banner')).toBeHidden();await expect(page.locator('.chart-panel')).toHaveCount(3);await expect(page.locator('#empty-atlas')).toBeHidden();
  await expect(panel(page,0)).toContainText('2026 partial year');
  const chart=panel(page,0).locator('svg');await chart.focus();await chart.press('End');
  await expect(page.locator('#readout')).toContainText('Jan–Aug 2026 (8 months)');await expect(page.locator('#readout')).toContainText('Jan–Sep 2026 (9 months)');await expect(page.locator('#readout')).toContainText('provisional');await expect(page.locator('#readout')).toContainText('No observation');
  await chart.press('Home');await expect(page.locator('#readout')).toContainText('historical long-term');await expect(page.locator('#readout')).toContainText('reconstructed');await chart.press('Escape');
  await expect(panel(page,2)).toContainText('General government gross debt / GDP');
  await expect(panel(page,2).locator('path[data-kind="forecast"]')).toHaveAttribute('stroke-dasharray','8 5');
  const debtChart=panel(page,2).locator('svg');await debtChart.focus();await debtChart.press('End');
  await expect(page.locator('#readout')).toContainText('38.5%');await expect(page.locator('#readout')).toContainText('forecast');await debtChart.press('Escape');
  await page.locator('[data-indicator="general-government-debt-ratio"]').getByRole('button',{name:'Information about General government gross debt / GDP'}).click();await expect(page.locator('#info-dialog')).toContainText('Not Maastricht debt');await page.getByRole('button',{name:'Close indicator information'}).click();
  await page.locator('#add-indicator').click();
  for(const title of ['Annual Confederation 10Y yield / historical proxy','Annual three-month GMBF yield','Confederation 10Y − 3M spread','General government gross debt / GDP','Nominal GDP']){
    await expect(page.getByRole('button',{name:`Add ${title}`,exact:true}).first()).toBeEnabled();
  }
  await page.getByRole('button',{name:'Close indicator selector'}).click();
  const response=await page.request.get(`${productionURL}data/atlas.json`);const data=await response.json();expect(data.mode).toBe('production');
  const yieldIds=['confederation-10y-annual','gmbf-3m-annual','confederation-10y-minus-gmbf-3m'];
  expect(data.observations.filter((o:{series_id:string})=>yieldIds.includes(o.series_id))).toHaveLength(174);
  expect(data.observations.filter((o:{series_id:string})=>o.series_id==='general-government-debt-ratio')).toHaveLength(81);
  expect(data.registry.series.every((s:{data_class:string})=>s.data_class==='real')).toBe(true);
  const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
  await page.screenshot({path:`.cache/evidence-yields-${testInfo.project.name}.png`,fullPage:true});
});

test('production nominal GDP renders original units, audited history, gaps and downloads',async({page},testInfo)=>{
  const origin=productionURL;
  await page.goto(origin);await expect(page.locator('#atlas')).toHaveAttribute('data-ready','true');
  await add(page,'Nominal GDP');
  const gdp=page.locator('.chart-panel').filter({has:page.locator('[data-indicator="nominal-gdp"]')});
  await expect(gdp).toHaveCount(1);
  await expect(gdp.locator('path[data-kind="reconstructed"]')).toHaveAttribute('stroke-dasharray','2 4');
  await expect(gdp.locator('path[data-kind="observed"]')).toBeVisible();
  await expect(gdp.locator('[data-statistical-break="nominal-gdp"]')).toHaveCount(1);
  const chart=gdp.locator('svg');await chart.focus();await chart.press('Home');
  await expect(page.locator('#readout')).toContainText('Nominal GDP');
  await expect(page.locator('#readout')).toContainText('No observation');
  await chart.press('ArrowRight');await chart.press('ArrowRight');
  await expect(page.locator('#readout')).toContainText('CHF millions');
  await expect(page.locator('#readout')).toContainText('reconstructed');
  await chart.press('End');await expect(page.locator('#year-label')).toContainText('2026');
  const gdpReadout=page.locator('#readout .readout-row').filter({hasText:'Nominal GDP'});
  await expect(gdpReadout).toContainText('No observation');await chart.press('Escape');
  await expect(gdp.getByRole('combobox')).toHaveCount(0);
  await page.locator('#start-year').fill('1960');await page.locator('#start-year').press('Tab');
  await chart.focus();await chart.press('Home');await expect(gdpReadout).toContainText('CHF millions');
  await expect(gdpReadout).not.toContainText('Index');await chart.press('Escape');
  await page.locator('[data-indicator="nominal-gdp"]').getByRole('button',{name:'Information about Nominal GDP'}).click();
  await expect(page.locator('#info-dialog')).toContainText('1948–1994');
  await expect(page.locator('#info-dialog')).toContainText('current prices');
  await page.getByRole('button',{name:'Close indicator information'}).click();
  const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
  await page.screenshot({path:`.cache/evidence-gdp-${testInfo.project.name}.png`,fullPage:true});
  await page.goto(`${origin}series/`);await expect(page.getByRole('link',{name:'Nominal GDP ↗',exact:true}).first()).toBeVisible();
  await page.goto(`${origin}series/nominal-gdp/`);await expect(page.getByRole('heading',{name:'Nominal GDP',exact:true})).toBeVisible();
  await expect(page.locator('body')).toContainText('78 observations available.');
  for(const extension of ['csv','json']){
    const link=page.getByRole('link',{name:extension.toUpperCase()+' ↓',exact:true});
    const response=await page.request.get(new URL((await link.getAttribute('href'))!,origin).href);expect(response.ok()).toBe(true);
    if(extension==='json'){
      const rows=await response.json();expect(rows).toHaveLength(78);expect(rows[0].reference_period).toBe('1948');expect(rows.at(-1).reference_period).toBe('2025');
    }else expect(await response.text()).toContain('nominal-gdp,2025,881571.800580975');
  }
  await page.goto(`${origin}downloads/`);await expect(page.getByRole('heading',{name:'Nominal GDP',exact:true})).toBeVisible();
  await expect(page.locator('body')).toContainText('FSO OPEN-BY');
});

test('comparison cancellation keeps different conventions in a separate new panel',async({page})=>{
 await ready(page);
 await add(page,'Annual CPI inflation');const id=(await page.locator('.chart-panel').last().getAttribute('data-panel'))!;
 await add(page,'Annual SNB policy rate',id);await expect(page.locator('#comparison-dialog')).toBeVisible();await page.locator('#keep-separate').click();await expect(page.locator('.chart-panel')).toHaveCount(7);await expect(page.locator('.chart-panel').last()).toContainText('Annual SNB policy rate');
 await page.locator('[data-indicator="demo-snb-policy-rate-annual"]').last().getByRole('button',{name:'Information about Annual SNB policy rate'}).click();await expect(page.locator('#info-dialog')).toContainText('Synthetic example');await page.getByRole('button',{name:'Close indicator information'}).click();
});

test('demo storage cannot restore into production on the same origin',async({page})=>{
 await ready(page);await add(page,'Population');
 const production=JSON.parse(await readFile('public/data/atlas.json','utf8'));
 await page.route('**/data/atlas.json',route=>route.fulfill({json:production}));await page.reload();await expect(page.locator('#atlas')).toHaveAttribute('data-ready','true');await expect(page.locator('.chart-panel')).toHaveCount(3);await expect(page.locator('#demo-banner')).toBeHidden();await expect(page.locator('[data-indicator^="demo-"]')).toHaveCount(0);
 await page.unroute('**/data/atlas.json');await page.reload();await expect(page.locator('.chart-panel')).toHaveCount(6);
});


test('production published real growth is selectable with metadata and downloadable observations',async({page})=>{
 const origin=productionURL;
 await page.goto(origin);await expect(page.locator('#atlas')).toHaveAttribute('data-ready','true');
 await add(page,'Real GDP growth');
 const growth=page.locator('.chart-panel').filter({has:page.locator('[data-indicator="real-gdp-growth"]')});
 await expect(growth.locator('path[data-kind="reconstructed"]')).toBeVisible();
 await expect(growth.locator('path[data-kind="observed"]')).toBeVisible();
 await growth.locator('svg').focus();await growth.locator('svg').press('End');
 await expect(page.locator('#readout .readout-row').filter({hasText:'Real GDP growth'})).toContainText('No observation');
 await page.goto(`${origin}series/real-gdp-growth/`);await expect(page.locator('body')).toContainText('77 observations available.');
 const rows=await (await page.request.get(`${origin}data/real-gdp-growth.json`)).json();
 expect(rows).toHaveLength(77);expect(rows[0].value).toBe(-3.49393473432399);expect(rows.at(-1).value).toBe(1.60786486422242);
 const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
});


test('every verified dataset is catalogued, downloadable and selectable at its supported frequency',async({page})=>{
 test.setTimeout(120000);
 const origin=productionURL;
 const data=await (await page.request.get(`${origin}data/atlas.json`)).json() as AtlasData;
 const baseline=new Set(['confederation-10y-annual','gmbf-3m-annual','confederation-10y-minus-gmbf-3m','general-government-debt-ratio','nominal-gdp','real-gdp-growth']);
 for(const series of data.registry.series.filter(s=>s.verification==='verified'&&!baseline.has(s.id))){
  const expected=data.observations.filter(o=>o.series_id===series.id);
  if(!expected.length)continue;
  await page.goto(`${origin}series/${series.id}/`);
  await expect(page.getByRole('heading',{name:series.title,exact:true})).toBeVisible();
  await expect(page.locator('body')).toContainText(`${expected.length} observations available.`);
  for(const extension of ['json','csv']){
   const link=page.getByRole('link',{name:extension.toUpperCase()+' ↓',exact:true});
   const response=await page.request.get(new URL((await link.getAttribute('href'))!,origin).href);expect(response.ok()).toBe(true);
   if(extension==='json')expect(await response.json()).toEqual(expected);else expect(await response.text()).toContain('series_id,reference_period,value,source_snapshot_ids,publication_date,value_kind,revision_status');
  }
  await page.goto(origin);await expect(page.locator('#atlas')).toHaveAttribute('data-ready','true');
  await page.locator('#add-indicator').click();
  const button=page.getByRole('button',{name:`Add ${series.title}`,exact:true}).first();
  if(series.frequency==='annual'){
   await expect(button).toBeEnabled();await button.click();
   const chart=page.locator('.chart-panel').filter({has:page.locator(`[data-indicator="${series.id}"]`)}).last();
   await expect(chart).toBeVisible();await chart.locator('svg').focus();await chart.locator('svg').press('End');
   await expect(page.locator('#readout .readout-row').filter({hasText:series.title}).first()).toBeVisible();
  }else{await expect(button).toBeDisabled();await page.getByRole('button',{name:'Close indicator selector'}).click();}
  const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
 }
});
