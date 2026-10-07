import type { AtlasData, ChartState, Panel } from './contracts.ts';
import { available, definition, initialState, validateState, compatible, removeSeries, separateSeries, movePanel, restoreState, encodeState, newPanelId } from './composition.ts';
import { colorFor, formatValue, pointsFor } from './geometry.ts';
import { drawChart, drawCursor } from './renderer.ts';

const element = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;
const make = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag); node.className = className; node.textContent = text; return node;
};
const button = (text: string, label: string, action: () => void, disabled = false): HTMLButtonElement => {
  const node = make('button', '', text); node.type = 'button'; node.setAttribute('aria-label', label); node.title = label; node.disabled = disabled; node.addEventListener('click', action); return node;
};

async function boot(): Promise<void> {
  const workspace = element('atlas');
  const response = await fetch(workspace.dataset.url!);
  if (!response.ok) throw new Error('Chart definitions could not be loaded. Reload to try again.');
  const data = await response.json() as AtlasData;
  const storageKey = `hei-atlas-${data.mode}-v2`;
  let stored: string | null = null;
  try { stored = localStorage.getItem(storageKey); } catch { /* Storage is optional. */ }
  const restored = restoreState(data, location.hash, stored);
  let state = restored.state;
  let selectedYear: number | null = null, pinned = false;
  let pending: (() => void) | null = null;
  let pendingFallback: ChartState | null = null;
  const panels = element('panels'), selector = element<HTMLDialogElement>('indicator-dialog');
  const comparison = element<HTMLDialogElement>('comparison-dialog'), info = element<HTMLDialogElement>('info-dialog');
  const readout = element('readout'), inspect = element<HTMLInputElement>('inspect-year');
  const start = element<HTMLInputElement>('start-year'), end = element<HTMLInputElement>('end-year');
  const target = element<HTMLSelectElement>('add-target');
  const search = element<HTMLInputElement>('indicator-search');
  const message = (text: string) => { element('atlas-status').textContent = text; };
  element('demo-banner').hidden = data.mode !== 'demo';

  function save(): void {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { message('This browser cannot save layouts. You can still use a share link.'); }
    if (location.hash.startsWith('#chart=')) history.replaceState(null, '', `${location.pathname}${location.search}#chart=${encodeState(state)}`);
  }
  function commit(next: ChartState, announcement = 'Chart arrangement updated.'): void {
    try { state = validateState(next, data); save(); render(); message(announcement); }
    catch (error) { message(error instanceof Error ? error.message : 'This arrangement could not be applied.'); render(); }
  }
  function propose(next: ChartState, fallback?: ChartState): void {
    const problem = next.panels.find(panel => compatible(panel, data).kind !== 'compatible');
    if (!problem) { commit(next); return; }
    const result = compatible(problem, data);
    if (result.kind === 'separate') { if (fallback) commit(fallback, result.reason + ' Added below instead.'); else message(result.reason); return; }
    element('comparison-description').textContent = result.reason;
    element('comparison-title').textContent = result.kind === 'index' ? 'Compare with a common index' : 'Different annual conventions';
    element('comparison-base').hidden = result.kind !== 'index';
    element<HTMLInputElement>('comparison-year').value = '1960';
    element('approve-comparison').textContent = result.kind === 'index' ? 'Index and combine' : 'Combine with these conventions';
    pendingFallback=fallback ?? null;
    pending = () => {
      if (result.kind === 'index') problem.axis = { mode: 'indexed', base_year: Number(element<HTMLInputElement>('comparison-year').value) };
      problem.conventions_acknowledged = true;
      commit(next);
    };
    comparison.showModal();
  }
  element('approve-comparison').addEventListener('click', () => { comparison.close(); pending?.(); pending = null; pendingFallback=null; });
  function cancelComparison():void { comparison.close();pending=null;const fallback=pendingFallback;pendingFallback=null;if(fallback)commit(fallback,'Indicator added in a separate panel.');else{render();message('Indicators kept in separate panels.');} }
  element('keep-separate').addEventListener('click',cancelComparison);
  comparison.querySelector('[data-close]')!.addEventListener('click',()=>{comparison.close();pending=null;pendingFallback=null;render();});
  comparison.addEventListener('cancel',()=>{pending=null;pendingFallback=null;render();});

  function showInfo(id: string): void {
    const s = definition(data, id), content = element('info-content');
    content.replaceChildren(make('h2', '', s.title), make('p', '', s.definition));
    const dl = make('dl');
    const fields = [['Unit', s.unit.label], ['Measurement', s.measurement], ['Price basis', s.price_basis.replaceAll('_', ' ')], ['Frequency', s.frequency], ['Coverage', s.institutional_coverage], ['Aggregation', s.aggregation], ['Historical breaks', s.breaks.map(b => `${b.period}: ${b.description}`).join('; ') || 'No breaks recorded; candidate definitions remain subject to audit.'], ['Usage', s.usage_notes]];
    for (const [label, value] of fields) dl.append(make('dt', '', label), make('dd', '', value));
    content.append(dl);
    for (const source of data.registry.sources.filter(source => s.source_ids.includes(source.id))) {
      const p = make('p', '', `${source.publisher} · redistribution ${source.rights.redistribution}`);
      const a = make('a', '', 'Source reference ↗'); a.href = source.data_url ?? source.landing_url; p.append(make('br'), a); content.append(p);
    }
    info.showModal();
  }
  for (const dialog of [selector, info, element<HTMLDialogElement>('share-dialog')]) dialog.querySelector<HTMLButtonElement>('[data-close]')?.addEventListener('click', () => dialog.close());

  function renderSelector(): void {
    const listing = element('indicator-list'); listing.replaceChildren();
    const term = search.value.trim().toLowerCase();
    const groups = [...data.topics, { id: 'other', title: 'Other indicators', description: '', series_ids: data.registry.series.filter(s => !data.topics.some(t => t.series_ids.includes(s.id))).map(s => s.id) }];
    let matches = 0;
    for (const topic of groups) {
      const ids = topic.series_ids.filter(id => { const s = definition(data, id); return `${s.title} ${s.id} ${topic.title}`.toLowerCase().includes(term); });
      if (!ids.length) continue;
      const section = make('section'); section.append(make('h3', '', topic.title));
      for (const id of ids) {
        const s = definition(data, id), canAdd = available(data, id);
        const node = button(`+ ${s.title}`, `Add ${s.title}`, () => {
          const next = structuredClone(state), targetPanel = next.panels.find(p => p.id === target.value);
          const single: Panel = { id: newPanelId(next), title: s.title, series_ids: [id], axis: { mode: 'native', base_year: null }, conventions_acknowledged: false };
          if (targetPanel) {
            if (targetPanel.series_ids.includes(id)) { message('This indicator is already in that panel.'); return; }
            targetPanel.series_ids.push(id);
            const fallback = structuredClone(state); fallback.panels.push(single); selector.close(); propose(next, fallback);
          } else { next.panels.push(single); selector.close(); commit(next); }
        }, !canAdd);
        const detail = make('small', '', canAdd ? `${s.unit.label} · annual${s.data_class === 'synthetic' ? ' · synthetic example' : ''}` : s.frequency !== 'annual' ? `${s.frequency} · unavailable in this annual view` : 'Awaiting verified observations');
        const row = make('div', 'indicator-option'); row.append(node, detail); section.append(row); matches++;
      }
      listing.append(section);
    }
    if (!matches) listing.append(make('p', 'muted', 'No matching indicators.'));
  }
  element('add-indicator').addEventListener('click', () => {
    target.replaceChildren(); const option = make('option', '', 'New panel below'); option.value = ''; target.append(option);
    for (const panel of state.panels) { const option = make('option', '', panel.title); option.value = panel.id; target.append(option); }
    search.value = ''; renderSelector(); selector.showModal(); search.focus();
  });
  search.addEventListener('input', renderSelector);

  function updateCursor(year: number | null, isPinned = pinned, position?: { x: number; y: number }): void {
    selectedYear = year; pinned = isPinned;
    element('year-label').textContent = year === null ? 'Hover or tap a year' : `${year}${pinned ? ' · pinned' : ''}`;
    element<HTMLButtonElement>('release-year').disabled = !pinned;
    if (year !== null) inspect.value = String(year);
    for (const panel of state.panels) {
      const svg = panels.querySelector<SVGSVGElement>(`svg[data-panel-id="${panel.id}"]`);
      if (svg) drawCursor(svg, panel, state, data, year);
    }
    readout.hidden = year === null; readout.dataset.pinned=String(pinned);
    if (year === null) return;
    readout.replaceChildren(make('h3', '', `${year}${pinned ? ' · pinned' : ''}`));
    if(pinned) readout.append(button('×','Release selected year',()=>updateCursor(null,false)));
    for (const panel of state.panels) {
      const group = make('div', 'readout-group'); group.append(make('h4', '', panel.title));
      for (const id of panel.series_ids) {
        const s = definition(data, id), point = pointsFor(panel, id, data, year, year)[0];
        const row = make('div', 'readout-row');
        const label = make('span', '', s.title); label.style.color = colorFor(data,id);
        row.append(label, make('strong', '', formatValue(point.raw, s.unit.label)));
        if (point.value !== null && panel.axis.mode === 'indexed') row.append(make('small', '', `Index ${panel.axis.base_year} = 100: ${formatValue(point.value)}`));
        if (point.observation) row.append(make('small', '', `${point.observation.value_kind} · ${point.observation.revision_status} · ${s.aggregation_kind.replaceAll('_',' ')}`));
        group.append(row);
      }
      readout.append(group);
    }
    if (position && window.innerWidth > 760) {
      readout.style.left = `${Math.max(10, Math.min(position.x + 16, window.innerWidth - readout.offsetWidth - 14))}px`;
      readout.style.top = `${Math.max(10, Math.min(position.y + 16, window.innerHeight - readout.offsetHeight - 14))}px`;
    } else { readout.style.left = ''; readout.style.top = ''; }
  }
  function keyboard(event: KeyboardEvent): void {
    const current = selectedYear ?? Math.min(state.end_year, Math.max(state.start_year, 1960));
    const steps: Record<string, number> = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: state.start_year, End: state.end_year };
    if (event.key in steps) { event.preventDefault(); updateCursor(Math.max(state.start_year, Math.min(state.end_year, steps[event.key])), true); }
    if (event.key === 'Escape') { event.preventDefault(); updateCursor(null, false); }
  }
  inspect.addEventListener('input', () => updateCursor(Number(inspect.value), true)); inspect.addEventListener('keydown', keyboard);
  element('release-year').addEventListener('click', () => updateCursor(null, false));

  function render(): void {
    start.value = String(state.start_year); end.value = String(state.end_year);
    inspect.min = String(state.start_year); inspect.max = String(state.end_year); inspect.value = String(selectedYear ?? Math.min(state.end_year, Math.max(state.start_year,1960)));
    for (const [id, value] of [['toggle-events',state.show_events],['toggle-intervals',state.show_intervals],['toggle-raw',state.show_raw]] as const) element(id).setAttribute('aria-pressed',String(value));
    element('empty-atlas').hidden = state.panels.length !== 0;
    panels.replaceChildren();
    for (const [index, panel] of state.panels.entries()) {
      const section = make('section', 'chart-panel'); section.dataset.panel = panel.id; section.setAttribute('aria-label', panel.title);
      const header = make('div', 'panel-header'); header.append(make('h2', '', `${String(index+1).padStart(2,'0')}  ${panel.title}`));
      const settings = make('div', 'panel-settings');
      const mode = make('select'); mode.setAttribute('aria-label', `Scale for ${panel.title}`);
      for (const [value, text] of [['native','Original units'],['indexed','Index to 100']]) { const option=make('option','',text); option.value=value; option.disabled=value==='indexed'&&panel.series_ids.some(id=>definition(data,id).measurement!=='level'); mode.append(option); }
      mode.value = panel.axis.mode;
      mode.addEventListener('change', () => { const next=structuredClone(state); next.panels[index].axis={mode:mode.value as 'native'|'indexed',base_year:mode.value==='indexed'?1960:null}; propose(next); }); settings.append(mode);
      if (panel.axis.mode === 'indexed') {
        const base=make('input'); base.type='number';base.min='1800';base.max='2199';base.value=String(panel.axis.base_year);base.setAttribute('aria-label',`Base year for ${panel.title}`);
        base.addEventListener('change',()=>{const next=structuredClone(state);next.panels[index].axis.base_year=Number(base.value);commit(next);});settings.append(base);
      }
      settings.append(button('↑',`Move ${panel.title} up`,()=>commit(movePanel(state,panel.id,-1)),index===0),button('↓',`Move ${panel.title} down`,()=>commit(movePanel(state,panel.id,1)),index===state.panels.length-1)); header.append(settings); section.append(header);
      const legend=make('div','panel-legend');
      for (const id of panel.series_ids) {
        const s=definition(data,id),item=make('div','series-chip');item.dataset.indicator=id;
        const swatch=make('span','swatch');swatch.style.background=colorFor(data,id);swatch.setAttribute('aria-hidden','true');
        item.append(swatch,make('span','series-title',s.title),button('i',`Information about ${s.title}`,()=>showInfo(id)));
        item.append(button('⇧',`Combine ${s.title} with panel above`,()=>{
          const next=removeSeries(state,panel.id,id),above=next.panels.find(p=>p.id===state.panels[index-1].id)!;
          if (above.series_ids.includes(id)) {message('This indicator is already in the panel above.');return;} above.series_ids.push(id);propose(next);
        },index===0));
        item.append(button('⇩',`Separate ${s.title}`,()=>commit(separateSeries(state,panel.id,id,data)),panel.series_ids.length===1));
        item.append(button('×',`Remove ${s.title} from ${panel.title}`,()=>commit(removeSeries(state,panel.id,id))));legend.append(item);
      }
      section.append(legend);
      const unit=make('p','axis-note',panel.axis.mode==='indexed'?`Index · ${panel.axis.base_year} = 100`:`${definition(data,panel.series_ids[0]).unit.label} · annual observations`);
      if (new Set(panel.series_ids.map(id=>definition(data,id).aggregation_kind)).size>1) unit.append(make('span','',' · Different annual conventions acknowledged'));
      section.append(unit);
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('role','group');svg.setAttribute('aria-label',`${panel.title}, interactive annual chart`);svg.setAttribute('tabindex','0');
      section.append(svg);panels.append(section);drawChart(svg,panel,state,data,section.clientWidth);
      const pick=(event:PointerEvent)=>Math.max(state.start_year,Math.min(state.end_year,Math.round(state.start_year+(event.clientX-svg.getBoundingClientRect().left-64)/(svg.clientWidth-88)*(state.end_year-state.start_year))));
      svg.addEventListener('pointermove',event=>{const e=event as PointerEvent;if((e.target as Element).hasAttribute('data-overlay')&&!pinned&&e.pointerType!=='touch')updateCursor(pick(e),false,{x:e.clientX,y:e.clientY});});
      svg.addEventListener('pointerdown',event=>{const e=event as PointerEvent;if(!(e.target as Element).hasAttribute('data-overlay'))return;const year=pick(e);updateCursor(year,!(pinned&&selectedYear===year),{x:e.clientX,y:e.clientY});});
      svg.addEventListener('pointerleave',()=>{if(!pinned)updateCursor(null,false);});svg.addEventListener('keydown',keyboard);
    }
    if (selectedYear!==null&&(selectedYear<state.start_year||selectedYear>state.end_year)) selectedYear=null;
    updateCursor(selectedYear,pinned);
  }
  function rangeChange(): void { commit({...state,start_year:Number(start.value),end_year:Number(end.value)},'Historical period updated. Index base years are unchanged.'); }
  start.addEventListener('change',rangeChange);end.addEventListener('change',rangeChange);
  element('reset-layout').addEventListener('click',()=>{selectedYear=null;pinned=false;commit(initialState(data),'Default layout restored.');});
  for(const [id,key] of [['toggle-events','show_events'],['toggle-intervals','show_intervals'],['toggle-raw','show_raw']] as const) element(id).addEventListener('click',()=>commit({...state,[key]:!state[key]},'Display updated.'));
  element('share-layout').addEventListener('click',async()=>{
    const url=`${location.origin}${location.pathname}${location.search}#chart=${encodeState(state)}`;history.replaceState(null,'',url);
    element<HTMLInputElement>('share-link').value=url;element<HTMLDialogElement>('share-dialog').showModal();
    try{await navigator.clipboard.writeText(url);element('share-message').textContent='Link copied. It contains your layout, not the observations.';}catch{element('share-message').textContent='Copy this link to share the arrangement. It contains no observations.';}
  });
  window.addEventListener('hashchange',()=>{const result=restoreState(data,location.hash,null);state=result.state;render();save();if(result.message)message(result.message);});
  new ResizeObserver(()=>{for(const panel of state.panels){const section=panels.querySelector<HTMLElement>(`[data-panel="${panel.id}"]`);const svg=section?.querySelector<SVGSVGElement>('svg');if(svg){drawChart(svg,panel,state,data,section!.clientWidth);drawCursor(svg,panel,state,data,selectedYear);}}}).observe(panels);
  render();if(restored.message)message(restored.message);workspace.dataset.ready='true';
}
boot().catch(error=>{element('atlas-status').textContent=error instanceof Error?error.message:'The chart workspace could not be loaded.';});
