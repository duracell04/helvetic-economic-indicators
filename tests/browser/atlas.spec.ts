import {test,expect,type Page} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import type {AtlasData} from '../../src/atlas/contracts.ts';
import {initialState} from '../../src/atlas/composition.ts';
const ready=async(page:Page)=>{await page.goto('./');await expect(page.locator('#atlas')).toHaveAttribute('data-ready','true');};
const panel=(page:Page,index:number)=>page.locator('.chart-panel').nth(index);
const add=async(page:Page,title:string,target='')=>{
  await page.getByRole('button',{name:'+ Add indicator',exact:true}).click();
  await page.getByRole('searchbox',{name:'Search indicators'}).fill(title);
  await page.locator('#add-target').selectOption(target);
  await page.locator(`button[aria-label="Add ${title}"]:not([disabled])`).click();
};
test('composition, indexing, reorder, ranges and saved/shared layouts',async({page})=>{
  await ready(page);await expect(page.locator('.chart-panel')).toHaveCount(3);
  await expect(page.locator('#demo-banner')).toContainText('Synthetic demonstration');await expect(page.getByRole('combobox',{name:'Preset',exact:true})).toHaveCount(0);
  await expect(page.locator('.chart-panel')).toHaveCount(3);
  const population=page.locator('[data-indicator="demo-population"]');
  await population.getByRole('button',{name:'Separate Population',exact:true}).click();await expect(page.locator('.chart-panel')).toHaveCount(4);
  await page.locator('[data-indicator="demo-population"]').getByRole('button',{name:'Combine Population with panel above',exact:true}).click();await expect(page.locator('.chart-panel')).toHaveCount(3);
  await panel(page,0).getByRole('button',{name:/Move .* down/}).click();await expect(panel(page,0)).toContainText('Macro stability');
  await panel(page,1).getByRole('button',{name:/Move .* up/}).click();
  await page.locator('#start-year').fill('1980');await page.locator('#start-year').press('Tab');
  await page.locator('#end-year').fill('2020');await page.locator('#end-year').press('Tab');
  await expect(panel(page,0).getByRole('spinbutton')).toHaveValue('1960');
  await panel(page,0).getByRole('spinbutton').fill('1971');await panel(page,0).getByRole('spinbutton').press('Tab');await expect(page.locator('#atlas-status')).toContainText('no positive observation');await expect(panel(page,0).getByRole('spinbutton')).toHaveValue('1960');
  await add(page,'Population');await expect(page.locator('.chart-panel')).toHaveCount(4);
  await panel(page,3).getByRole('button',{name:/Remove Population/}).click();await expect(page.locator('.chart-panel')).toHaveCount(3);
  await page.reload();await expect(page.locator('#start-year')).toHaveValue('1980');
  await page.getByRole('button',{name:'Share ↗',exact:true}).click();const url=await page.locator('#share-link').inputValue();expect(url).toContain('#chart=');
  await page.getByRole('button',{name:'Close share dialog'}).click();await page.getByRole('button',{name:'Reset',exact:true}).click();await expect(page.locator('.chart-panel')).toHaveCount(3);await expect(page.locator('#start-year')).toHaveValue('1946');await expect(panel(page,0)).toHaveAttribute('data-panel','levels');
  await page.goto(url);await expect(page.locator('.chart-panel')).toHaveCount(3);await expect(page.locator('#start-year')).toHaveValue('1980');
});
test('compatibility requires explicit indexing and convention acknowledgment',async({page})=>{
  await ready(page);
  await page.locator('[data-indicator="demo-population"]').getByRole('button',{name:'Separate Population',exact:true}).click();
  await panel(page,1).getByRole('button',{name:/Move .* up/}).click();
  await page.locator('[data-indicator="demo-real-gdp"]').getByRole('button',{name:/Combine .* above/}).click();
  await expect(page.locator('#comparison-dialog')).toBeVisible();await expect(page.locator('#comparison-description')).toContainText('different units');
  await page.locator('#approve-comparison').click();await expect(panel(page,0).getByRole('spinbutton')).toHaveValue('1960');
  await add(page,'Annual SNB policy rate');await page.locator('.chart-panel').last().getByRole('button',{name:/Move .* up/}).click();
  // A fresh inflation panel has annual-change conventions; adding annual-average policy requires acknowledgment.
  await add(page,'Annual CPI inflation');const targetId=await page.locator('.chart-panel').last().getAttribute('data-panel');
  await add(page,'Annual SNB policy rate',targetId!);await expect(page.locator('#comparison-dialog')).toBeVisible();await expect(page.locator('#comparison-description')).toContainText('different conventions');await page.locator('#approve-comparison').click();
  await expect(page.locator('.chart-panel').last()).toContainText('Different annual conventions acknowledged');
  await add(page,'Population',targetId!);await expect(page.locator('#atlas-status')).toContainText('separate synchronized panels');
});
test('synchronized cursor, missing values, pinning, keyboard, annotations and resizing',async({page},testInfo)=>{
  await ready(page);
  const chart=panel(page,0).locator('svg');await chart.focus();await chart.press('Home');await expect(page.locator('#year-label')).toContainText('1946 · pinned');await chart.press('End');await expect(page.locator('#year-label')).toContainText('2025 · pinned');await chart.press('ArrowLeft');await expect(page.locator('#readout')).toContainText('revised');
  await chart.press('Escape');await expect(page.locator('#readout')).toBeHidden();
  const overlay=panel(page,0).locator('[data-overlay]');const bounds=(await overlay.boundingBox())!;
  const x=bounds.x+bounds.width*(1971-1946)/(2025-1946),y=bounds.y+50;
  if(testInfo.project.name==='mobile')await page.touchscreen.tap(x,y);else await page.mouse.move(x,y);
  await expect(page.locator('#year-label')).toContainText('1971');await expect(page.locator('#readout')).toContainText('No observation');await expect(page.locator('#readout')).toContainText('Index 1960 = 100');
  for(const line of await page.locator('[data-cursor]').all())await expect(line).toHaveAttribute('opacity','.6');
  if(testInfo.project.name==='desktop'){await page.mouse.click(x,y);await page.mouse.move(x+50,y);await expect(page.locator('#year-label')).toContainText('1971 · pinned');}
  await page.locator('#release-year').click();
  await expect(page.locator('[data-annotation]')).toHaveCount(6);
  await page.locator('#toggle-events').click();await expect(page.locator('[data-event-label]')).toHaveCount(0);
  await page.locator('#toggle-intervals').click();await expect(page.locator('[data-annotation]')).toHaveCount(0);
  await page.locator('#toggle-raw').click();await expect(page.locator('[data-raw-label]')).toHaveCount(6);
  await page.locator('#end-year').fill('2026');await page.locator('#end-year').press('Tab');await expect(page.locator('[data-kind="forecast"]')).toHaveCount(6);
  await expect(page.locator('[data-statistical-break]')).toHaveCount(1);
  if(testInfo.project.name==='desktop'){await page.setViewportSize({width:1000,height:800});const b=(await overlay.boundingBox())!;await page.mouse.move(b.x+80,b.y+40);await expect(page.locator('#readout')).toBeVisible();}
  const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
  await page.screenshot({path:`.cache/evidence-${testInfo.project.name}.png`,fullPage:true});
});
test('invalid shared layouts recover; new energy definitions render without code changes',async({page})=>{
  await page.goto('./#chart=invalid');await expect(page.locator('#atlas-status')).toContainText('invalid or unavailable');await expect(page.locator('.chart-panel')).toHaveCount(3);
  const data=JSON.parse(await readFile('.cache/atlas-demo.json','utf8')) as AtlasData;
  const source=data.registry.series.find(s=>s.id==='demo-population')!;
  data.registry.series.push({...source,id:'demo-energy',title:'Energy consumption',unit:{code:'count',label:'GWh',dimension:'energy',scale:1}});data.observations.push(...data.observations.filter(o=>o.series_id===source.id).map(o=>({...o,series_id:'demo-energy'})));
  data.topics.push({id:'energy',title:'Energy',description:'Synthetic test',series_ids:['demo-energy']});
  const config=initialState(data);config.preset_id='energy';config.panels=[{id:'energy-panel',title:'Energy',series_ids:['demo-energy'],axis:{mode:'native',base_year:null},conventions_acknowledged:false}];data.presets.push({id:'energy',title:'Energy',config});data.default_preset_id='energy';
  await page.route('**/data/atlas.json',route=>route.fulfill({json:data}));await ready(page);await expect(panel(page,0)).toContainText('Energy consumption');await expect(page.locator('[data-series-id="demo-energy"]')).toHaveCount(2);
  await page.locator('#add-indicator').click();await page.locator('#indicator-search').fill('energy');await expect(page.locator('#indicator-list')).toContainText('Energy');
});
test('production remains empty and isolated from demo layouts',async({page})=>{
  await page.goto('http://127.0.0.1:4323/helvetic-economic-indicators/');await expect(page.locator('#atlas')).toHaveAttribute('data-ready','true');await expect(page.locator('#demo-banner')).toBeHidden();await expect(page.locator('.chart-panel')).toHaveCount(0);await expect(page.locator('#empty-atlas')).toBeVisible();
  await page.locator('#add-indicator').click();await expect(page.locator('#indicator-list button:not([disabled])')).toHaveCount(0);
  const response=await page.request.get('http://127.0.0.1:4323/helvetic-economic-indicators/data/atlas.json');const data=await response.json();expect(data.mode).toBe('production');expect(data.observations).toHaveLength(0);expect(data.registry.series.every((s:{data_class:string})=>s.data_class==='real')).toBe(true);
});

test('comparison cancellation preserves axis controls and offers a separate new panel',async({page})=>{
 await ready(page);
 await panel(page,0).getByRole('combobox').selectOption('native');await expect(page.locator('#comparison-dialog')).toBeVisible();await page.locator('#keep-separate').click();await expect(panel(page,0).getByRole('combobox')).toHaveValue('indexed');
 await add(page,'Annual CPI inflation');const id=(await page.locator('.chart-panel').last().getAttribute('data-panel'))!;
 await add(page,'Annual SNB policy rate',id);await expect(page.locator('#comparison-dialog')).toBeVisible();await page.locator('#keep-separate').click();await expect(page.locator('.chart-panel')).toHaveCount(5);await expect(page.locator('.chart-panel').last()).toContainText('Annual SNB policy rate');
 await page.locator('[data-indicator="demo-snb-policy-rate-annual"]').last().getByRole('button',{name:'Information about Annual SNB policy rate'}).click();await expect(page.locator('#info-dialog')).toContainText('Synthetic example');await page.getByRole('button',{name:'Close indicator information'}).click();
});

test('demo storage cannot restore into production on the same origin',async({page})=>{
 await ready(page);await page.locator('[data-indicator="demo-population"]').getByRole('button',{name:'Separate Population',exact:true}).click();
 const production=JSON.parse(await readFile('public/data/atlas.json','utf8'));
 await page.route('**/data/atlas.json',route=>route.fulfill({json:production}));await page.reload();await expect(page.locator('#atlas')).toHaveAttribute('data-ready','true');await expect(page.locator('.chart-panel')).toHaveCount(0);await expect(page.locator('#demo-banner')).toBeHidden();
 await page.unroute('**/data/atlas.json');await page.reload();await expect(page.locator('.chart-panel')).toHaveCount(4);
});
