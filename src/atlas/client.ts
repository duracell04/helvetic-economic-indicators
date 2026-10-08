import type { AtlasData, ChartState, Panel } from './contracts.ts';
import { available, availableYearRange, definition, emptyState, panelYears, validateState, removeSeries, separateSeries, overlaySeries, movePanel, restoreState, encodeState, newPanelId } from './composition.ts';
import { colorFor, formatValue, pointsFor } from './geometry.ts';
import { drawChart, drawCursor } from './renderer.ts';

const element = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;
const make = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag); node.className = className; node.textContent = text; return node;
};
const button = (text: string, label: string, action: () => void, disabled = false): HTMLButtonElement => {
  const node = make('button', '', text); node.type = 'button'; node.setAttribute('aria-label', label); node.title = label; node.disabled = disabled; node.addEventListener('click', action); return node;
};
let toastTimer: ReturnType<typeof setTimeout> | undefined;
let clearToastTimer: ReturnType<typeof setTimeout> | undefined;
function message(text: string): void {
  clearTimeout(toastTimer); clearTimeout(clearToastTimer);
  const status = element('atlas-status');
  status.textContent = text; status.dataset.visible = 'true';
  toastTimer = setTimeout(() => {
    status.dataset.visible = 'false';
    clearToastTimer = setTimeout(() => { status.textContent = ''; }, 200);
  }, 2000);
}

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
  const panels = element('panels'), selector = element<HTMLDialogElement>('indicator-dialog');
  const overlay = element<HTMLDialogElement>('overlay-dialog'), info = element<HTMLDialogElement>('info-dialog');
  const readout = element('readout');
  const start = element<HTMLInputElement>('start-year'), end = element<HTMLInputElement>('end-year');
  const target = element<HTMLSelectElement>('add-target');
  const search = element<HTMLInputElement>('indicator-search');
  const config = element<HTMLFormElement>('indicator-config');
  let chosenId: string | null = null;
  let editingPanelId: string | null = null;
  let fullRange = { start_year: state.start_year, end_year: state.end_year };
  element('demo-banner').hidden = data.mode !== 'demo';

  function save(): void {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch { message('This browser cannot save layouts. You can still use a share link.'); }
    if (location.hash.startsWith('#chart=')) history.replaceState(null, '', `${location.pathname}${location.search}#chart=${encodeState(state)}`);
  }
  function commit(next: ChartState, announcement = 'Chart arrangement updated.'): void {
    try { state = validateState(next, data); save(); render(); message(announcement); }
    catch (error) { message(error instanceof Error ? error.message : 'This arrangement could not be applied.'); render(); }
  }
  function chooseOverlay(source: Panel, ids = source.series_ids): void {
    element('overlay-title').textContent = ids.length === 1 ? `Overlay ${definition(data,ids[0]).title}` : `Overlay ${source.title}`;
    const listing = element('overlay-targets'); listing.replaceChildren();
    for (const [index, destination] of state.panels.entries()) {
      if (destination.id === source.id) continue;
      listing.append(button(`${String(index+1).padStart(2,'0')}  ${destination.title}`,`Overlay on ${destination.title}`,()=>{
        overlay.close(); commit(overlaySeries(state,source.id,destination.id,ids,data));
      }));
    }
    overlay.showModal();
  }

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
  for (const dialog of [selector, overlay, info, element<HTMLDialogElement>('share-dialog')]) dialog.querySelector<HTMLButtonElement>('[data-close]')?.addEventListener('click', () => dialog.close());

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
        const node = button(`+ ${s.title}`, `Add ${s.title}`, () => configure(id), !canAdd);
        const detail = make('small', '', canAdd ? `${s.unit.label} · annual${s.data_class === 'synthetic' ? ' · synthetic example' : ''}` : s.frequency !== 'annual' ? `${s.frequency} · unavailable in this annual view` : 'Awaiting verified observations');
        const row = make('div', 'indicator-option'); row.append(node, detail); section.append(row); matches++;
      }
      listing.append(section);
    }
    if (!matches) listing.append(make('p', 'muted', 'No matching indicators.'));
  }
  function setRange(range: Pick<ChartState, 'start_year' | 'end_year'>): void {
    start.value=String(range.start_year);end.value=String(range.end_year);end.setCustomValidity('');
  }
  function configure(id: string | null, panelId: string | null = null): void {
    chosenId=id;editingPanelId=panelId;
    const panel=state.panels.find(panel=>panel.id===(panelId ?? target.value));
    fullRange=availableYearRange(data,[...(panel?.series_ids ?? []),...(id ? [id] : [])]);
    for(const input of [start,end]){input.min=String(fullRange.start_year);input.max=String(fullRange.end_year);}
    const current=id ? fullRange : panelYears(panel!,state);
    const clipped={start_year:Math.max(fullRange.start_year,current.start_year),end_year:Math.min(fullRange.end_year,current.end_year)};
    setRange(clipped.start_year<=clipped.end_year ? clipped : fullRange);
    element('available-years').textContent=`Available years: ${fullRange.start_year}–${fullRange.end_year}`;
    element('picker-title').textContent=id ? 'Add an indicator' : 'Chart years';
    element('chosen-indicator').textContent=id ? definition(data,id).title : panel!.title;
    element('indicator-picker').hidden=true;config.hidden=false;
    element('add-target-label').hidden=id===null;element('back-to-indicators').hidden=id===null;
    element('confirm-indicator').textContent=id ? 'Add chart' : 'Apply years';
    start.focus();
  }
  function openPicker(): void {
    chosenId=null;editingPanelId=null;config.hidden=true;element('indicator-picker').hidden=false;element('picker-title').textContent='Add an indicator';
    target.replaceChildren(); const option = make('option', '', 'New panel below'); option.value = ''; target.append(option);
    for (const panel of state.panels) { const option = make('option', '', panel.title); option.value = panel.id; target.append(option); }
    search.value = ''; renderSelector(); selector.showModal(); search.focus();
  }
  element('add-indicator').addEventListener('click',openPicker);
  element('back-to-indicators').addEventListener('click',()=>{chosenId=null;config.hidden=true;element('indicator-picker').hidden=false;search.focus();});
  target.addEventListener('change',()=>{if(chosenId)configure(chosenId);});
  element('use-full-range').addEventListener('click',()=>setRange(fullRange));
  for(const input of [start,end])input.addEventListener('input',()=>end.setCustomValidity(''));
  config.addEventListener('submit',event=>{
    event.preventDefault();
    if(Number(start.value)>Number(end.value)){end.setCustomValidity('Choose an end year on or after the start year.');end.reportValidity();return;}
    const range={start_year:Number(start.value),end_year:Number(end.value)},next=structuredClone(state);
    if(!chosenId){Object.assign(next.panels.find(panel=>panel.id===editingPanelId)!,range);selector.close();commit(next,'Chart years updated.');return;}
    const s=definition(data,chosenId),targetPanel=next.panels.find(panel=>panel.id===target.value);
    const single: Panel={id:newPanelId(next),title:s.title,series_ids:[chosenId],axis:{mode:'native',base_year:null},conventions_acknowledged:false,...range};
    if(targetPanel){
      if(targetPanel.series_ids.includes(chosenId)){message('This indicator is already in that panel.');return;}
      targetPanel.series_ids.push(chosenId);
      Object.assign(targetPanel,range);
      selector.close();commit(next);
    }else{next.panels.push(single);selector.close();commit(next);}
  });
  search.addEventListener('input', renderSelector);

  function updateCursor(year: number | null, isPinned = pinned, position?: { x: number; y: number }): void {
    selectedYear = year; pinned = isPinned;
    for (const panel of state.panels) {
      const svg = panels.querySelector<SVGSVGElement>(`svg[data-panel-id="${panel.id}"]`);
      if (svg) drawCursor(svg, panel, state, data, year);
    }
    readout.hidden = year === null; readout.dataset.pinned=String(pinned);
    if (year === null) return;
    readout.replaceChildren(make('h3', '', `${year}${pinned ? ' · pinned' : ''}`));
    if(pinned) readout.append(button('×','Release selected year',()=>updateCursor(null,false)));
    for (const panel of state.panels) {
      const range=panelYears(panel,state);
      if(year<range.start_year||year>range.end_year)continue;
      const group = make('div', 'readout-group'); group.append(make('h4', '', panel.title));
      for (const id of panel.series_ids) {
        const s = definition(data, id), point = pointsFor(panel, id, data, year, year)[0];
        const row = make('div', 'readout-row');
        const label = make('span', '', s.title); label.style.color = colorFor(data,id);
        row.append(label, make('strong', '', formatValue(point.raw, s.unit.label)));
        if (point.observation) row.append(make('small', '', `${point.observation.value_kind} · ${point.observation.revision_status} · ${s.aggregation_kind.replaceAll('_',' ')}`));
        for (const note of s.breaks.filter(note => note.period === String(year))) row.append(make('small', '', note.description));
        group.append(row);
      }
      readout.append(group);
    }
    if (position && window.innerWidth > 760) {
      readout.style.left = `${Math.max(10, Math.min(position.x + 16, window.innerWidth - readout.offsetWidth - 14))}px`;
      readout.style.top = `${Math.max(10, Math.min(position.y + 16, window.innerHeight - readout.offsetHeight - 14))}px`;
    } else { readout.style.left = ''; readout.style.top = ''; }
  }
  function keyboard(event: KeyboardEvent, panel: Panel): void {
    const range=panelYears(panel,state),current=Math.min(range.end_year,Math.max(range.start_year,selectedYear ?? 1960));
    const steps: Record<string, number> = { ArrowLeft: current - 1, ArrowRight: current + 1, Home: range.start_year, End: range.end_year };
    if (event.key in steps) { event.preventDefault(); updateCursor(Math.max(range.start_year, Math.min(range.end_year, steps[event.key])), true); }
    if (event.key === 'Escape') { event.preventDefault(); updateCursor(null, false); }
  }

  function render(): void {
    for (const [id, value] of [['toggle-events',state.show_events],['toggle-intervals',state.show_intervals]] as const) element(id).setAttribute('aria-pressed',String(value));
    const hasCharts = state.panels.length > 0;
    for (const id of ['atlas-toolbar','display-controls','atlas-help']) element(id).hidden = !hasCharts;
    element('empty-intro').hidden = hasCharts;
    element('empty-atlas').dataset.hasCharts = String(hasCharts);
    panels.replaceChildren();
    for (const [index, panel] of state.panels.entries()) {
      const section = make('section', 'chart-panel'); section.dataset.panel = panel.id; section.setAttribute('aria-label', panel.title);
      const header = make('div', 'panel-header'); header.append(make('h2', '', `${String(index+1).padStart(2,'0')}  ${panel.title}`));
      const settings = make('div', 'panel-settings');
      const range=panelYears(panel,state);
      settings.append(button(`${range.start_year}–${range.end_year}`,`Change years for ${panel.title}`,()=>{selector.showModal();configure(null,panel.id);}));
      settings.append(button('Overlay',`Overlay chart ${panel.title}`,()=>chooseOverlay(panel),state.panels.length<2));
      settings.append(button('↑',`Move ${panel.title} up`,()=>commit(movePanel(state,panel.id,-1)),index===0),button('↓',`Move ${panel.title} down`,()=>commit(movePanel(state,panel.id,1)),index===state.panels.length-1)); header.append(settings); section.append(header);
      const legend=make('div','panel-legend');
      for (const id of panel.series_ids) {
        const s=definition(data,id),item=make('div','series-chip');item.dataset.indicator=id;
        const swatch=make('span','swatch');swatch.style.background=colorFor(data,id);swatch.setAttribute('aria-hidden','true');
        item.append(swatch,make('span','series-title',s.title),button('i',`Information about ${s.title}`,()=>showInfo(id)));
        item.append(button('↗',`Overlay ${s.title} on another chart`,()=>chooseOverlay(panel,[id]),state.panels.length<2));
        item.append(button('⇩',`Separate ${s.title}`,()=>commit(separateSeries(state,panel.id,id,data)),panel.series_ids.length===1));
        item.append(button('×',`Remove ${s.title} from ${panel.title}`,()=>commit(removeSeries(state,panel.id,id))));legend.append(item);
      }
      section.append(legend);
      const unit=make('p','axis-note',`${[...new Set(panel.series_ids.map(id=>definition(data,id).unit.label))].join(' / ')} · annual observations`);
      section.append(unit);
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('role','group');svg.setAttribute('aria-label',`${panel.title}, interactive annual chart`);svg.setAttribute('tabindex','0');
      const scroll=make('div','chart-scroll');scroll.append(svg);section.append(scroll);panels.append(section);drawChart(svg,panel,state,data,section.clientWidth);
      const pick=(event:PointerEvent)=>{
        const bounds=svg.getBoundingClientRect(),width=svg.viewBox.baseVal.width,left=Number(svg.dataset.plotLeft),right=Number(svg.dataset.plotRight);
        const position=(event.clientX-bounds.left)*width/bounds.width;
        return Math.max(range.start_year,Math.min(range.end_year,Math.round(range.start_year+(position-left)/(width-left-right)*(range.end_year-range.start_year))));
      };
      svg.addEventListener('pointermove',event=>{const e=event as PointerEvent;if((e.target as Element).hasAttribute('data-overlay')&&!pinned&&e.pointerType!=='touch')updateCursor(pick(e),false,{x:e.clientX,y:e.clientY});});
      svg.addEventListener('pointerdown',event=>{const e=event as PointerEvent;if(!(e.target as Element).hasAttribute('data-overlay'))return;const year=pick(e);updateCursor(year,!(pinned&&selectedYear===year),{x:e.clientX,y:e.clientY});});
      svg.addEventListener('pointerleave',()=>{if(!pinned)updateCursor(null,false);});svg.addEventListener('keydown',event=>keyboard(event,panel));
    }
    if(!hasCharts || (selectedYear!==null&&!state.panels.some(panel=>{const range=panelYears(panel,state);return selectedYear!>=range.start_year&&selectedYear!<=range.end_year;}))){selectedYear=null;pinned=false;}
    updateCursor(selectedYear,pinned);
  }
  element('reset-layout').addEventListener('click',()=>{selectedYear=null;pinned=false;commit(emptyState(data),'Timeline cleared.');element('add-indicator').focus();});
  for(const [id,key] of [['toggle-events','show_events'],['toggle-intervals','show_intervals']] as const) element(id).addEventListener('click',()=>commit({...state,[key]:!state[key]},'Display updated.'));
  element('share-layout').addEventListener('click',async()=>{
    const url=`${location.origin}${location.pathname}${location.search}#chart=${encodeState(state)}`;history.replaceState(null,'',url);
    element<HTMLInputElement>('share-link').value=url;element<HTMLDialogElement>('share-dialog').showModal();
    try{await navigator.clipboard.writeText(url);element('share-message').textContent='Link copied. It contains your layout, not the observations.';}catch{element('share-message').textContent='Copy this link to share the arrangement. It contains no observations.';}
  });
  window.addEventListener('hashchange',()=>{const result=restoreState(data,location.hash,null);state=result.state;render();save();if(result.message)message(result.message);});
  new ResizeObserver(()=>{
    for(const panel of state.panels){
      const section=panels.querySelector<HTMLElement>(`[data-panel="${panel.id}"]`);
      const svg=section?.querySelector<SVGSVGElement>('svg');
      // Hidden panels, including during navigation, have no drawable plot area.
      if(svg && section!.clientWidth>88){drawChart(svg,panel,state,data,section!.clientWidth);drawCursor(svg,panel,state,data,selectedYear);}
    }
  }).observe(panels);
  render();if(restored.message)message(restored.message);workspace.dataset.ready='true';
}
boot().catch(error=>{message(error instanceof Error?error.message:'The chart workspace could not be loaded.');});
