import type { Series } from '../../scripts/lib/schema.ts';
import { stateSchema, type AtlasData, type ChartState, type Panel } from './contracts.ts';

export const definition = (data: AtlasData, id: string): Series => {
  const s = data.registry.series.find(s => s.id === id);
  if (!s) throw new Error(`Unknown indicator: ${id}`);
  return s;
};
export function available(data: AtlasData, id: string): boolean {
  const s = definition(data, id);
  return s.frequency === 'annual' && s.verification === 'verified' &&
    (data.mode === 'demo' || s.data_class === 'real') &&
    data.observations.some(row => row.series_id === id && row.value !== null);
}
export function compatible(panel: Panel, data: AtlasData): { kind: 'compatible' | 'acknowledge' | 'index' | 'separate'; reason: string } {
  const items = panel.series_ids.map(id => definition(data, id));
  if (items.some(s => s.frequency !== 'annual')) return { kind: 'separate', reason: 'This view uses annual observations. No frequency conversion is automatic.' };
  if (items.length < 2 && panel.axis.mode === 'native') return { kind: 'compatible', reason: '' };
  if (items.some(s => s.aggregation_kind === 'unknown' || s.price_basis === 'unknown')) return { kind: 'separate', reason: 'Measurement conventions need to be established before these series can be combined.' };
  const bases = new Set(items.map(s => s.price_basis).filter(b => b !== 'not_applicable'));
  if (bases.size > 1) return { kind: 'separate', reason: 'Nominal and real values need distinct panels or a documented price adjustment.' };
  if (panel.axis.mode === 'indexed') {
    if (items.some(s => s.measurement !== 'level')) return { kind: 'separate', reason: 'Indexing compares level variables, not rates, yields or returns.' };
  } else {
    const first = items[0];
    const unitsMatch = items.every(s => s.unit.code === first.unit.code && s.unit.dimension === first.unit.dimension && s.unit.scale === first.unit.scale);
    const measurementMatch = first.unit.code === 'percent' || items.every(s => s.measurement === first.measurement);
    if (!unitsMatch || !measurementMatch) return items.every(s => s.measurement === 'level') ? { kind: 'index', reason: 'These level variables use different units. Explicitly index them to a common year, or keep them separate.' + (new Set(items.map(s=>s.aggregation_kind)).size > 1 ? ' Annual conventions also differ: ' + items.map(s=>`${s.title}: ${s.aggregation_kind.replaceAll("_"," ")}`).join('; ') + '. Indexing preserves these conventions; confirm this comparison explicitly.' : '') } : { kind: 'separate', reason: 'These quantities use different units or measurements. Keep them in separate synchronized panels.' };
  }
  if (new Set(items.map(s => s.aggregation_kind)).size > 1 && !panel.conventions_acknowledged) return { kind: 'acknowledge', reason: 'These annual measures use different conventions: ' + items.map(s => `${s.title}: ${s.aggregation_kind.replaceAll('_', ' ')}`).join('; ') + '. Combining does not convert or average them.' };
  return { kind: 'compatible', reason: '' };
}

export function validateState(input: unknown, data: AtlasData, requireAvailable = true): ChartState {
  const state = stateSchema.parse(input);
  const unique = (values: string[], name: string) => { if (new Set(values).size !== values.length) throw new Error(`Duplicate ${name}`); };
  unique(state.panels.map(p => p.id), 'panel ID');
  if (!data.presets.some(p => p.id === state.preset_id)) throw new Error('This chart preset is unavailable.');
  unique(state.annotation_ids, 'annotation');
  for (const id of state.annotation_ids) if (!data.annotations.some(a => a.id === id)) throw new Error(`Unknown annotation: ${id}`);
  for (const panel of state.panels) {
    unique(panel.series_ids, 'indicator within panel');
    if (panel.axis.mode === 'native' && panel.axis.base_year !== null) throw new Error('Native panels must not specify an index base');
    if (panel.axis.mode === 'indexed' && panel.axis.base_year === null) throw new Error('Select an index base year');
    const result = compatible(panel, data);
    if (result.kind !== 'compatible') throw new Error(result.reason);
    for (const id of panel.series_ids) {
      definition(data, id);
      if (requireAvailable && !available(data, id)) throw new Error(`${id}: annual observations are unavailable in this view.`);
      if (requireAvailable && panel.axis.mode === 'indexed') {
        const base = data.observations.find(o => o.series_id === id && o.reference_period === String(panel.axis.base_year));
        if (base?.value == null || base.value <= 0) throw new Error(`${definition(data, id).title}: no positive observation in base year ${panel.axis.base_year}.`);
      }
    }
  }
  return state;
}

export function initialState(data: AtlasData, presetId = data.default_preset_id): ChartState {
  const preset = data.presets.find(p => p.id === presetId);
  if (!preset) throw new Error('Unknown preset');
  const state = structuredClone(preset.config);
  state.panels = state.panels.map(p => ({ ...p, series_ids: p.series_ids.filter(id => available(data, id)) })).filter(p => p.series_ids.length > 0);
  return validateState(state, data);
}
export function newPanelId(state: ChartState): string {
  let index = 1;
  while (state.panels.some(p => p.id === `panel-${index}`)) index++;
  return `panel-${index}`;
}
export function addSeries(state: ChartState, id: string, data: AtlasData, targetId?: string): ChartState {
  const next = structuredClone(state);
  const target = next.panels.find(p => p.id === targetId);
  if (target) {
    if (target.series_ids.includes(id)) throw new Error('This indicator is already in that panel.');
    target.series_ids.push(id);
  } else next.panels.push({ id: newPanelId(next), title: definition(data, id).title, series_ids: [id], axis: { mode: 'native', base_year: null }, conventions_acknowledged: false });
  return validateState(next, data);
}
export function removeSeries(state: ChartState, panelId: string, id: string): ChartState {
  const next = structuredClone(state);
  next.panels = next.panels.map(p => p.id === panelId ? { ...p, series_ids: p.series_ids.filter(s => s !== id) } : p).filter(p => p.series_ids.length);
  return next;
}
export function separateSeries(state: ChartState, panelId: string, id: string, data: AtlasData): ChartState {
  const index = state.panels.findIndex(p => p.id === panelId);
  if (index < 0 || !state.panels[index].series_ids.includes(id)) throw new Error('Indicator is not in this panel');
  if (state.panels[index].series_ids.length === 1) return structuredClone(state);
  const next = removeSeries(state, panelId, id);
  next.panels.splice(index + 1, 0, { id: newPanelId(next), title: definition(data, id).title, series_ids: [id], axis: { mode: 'native', base_year: null }, conventions_acknowledged: false });
  return validateState(next, data);
}
export function combineAbove(state: ChartState, panelId: string, id: string, data: AtlasData, options?: { index?: number; acknowledge?: boolean }): ChartState {
  const position = state.panels.findIndex(p => p.id === panelId);
  if (position < 1) throw new Error('There is no panel above.');
  const targetId = state.panels[position - 1].id;
  const next = removeSeries(state, panelId, id);
  const target = next.panels.find(p => p.id === targetId)!;
  if (target.series_ids.includes(id)) throw new Error('This indicator is already in the panel above.');
  target.series_ids.push(id);
  if (options?.index !== undefined) target.axis = { mode: 'indexed', base_year: options.index };
  if (options?.acknowledge) target.conventions_acknowledged = true;
  return validateState(next, data);
}
export function movePanel(state: ChartState, id: string, direction: -1 | 1): ChartState {
  const next = structuredClone(state);
  const index = next.panels.findIndex(p => p.id === id);
  const target = index + direction;
  if (index >= 0 && target >= 0 && target < next.panels.length) [next.panels[index], next.panels[target]] = [next.panels[target], next.panels[index]];
  return next;
}

export function encodeState(state: ChartState): string {
  const bytes = new TextEncoder().encode(JSON.stringify(stateSchema.parse(state)));
  return btoa(Array.from(bytes, b => String.fromCharCode(b)).join('')).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}
export function decodeState(value: string, data: AtlasData): ChartState {
  if (value.length > 100_000) throw new Error('The shared layout is too large.');
  const binary = atob(value.replaceAll('-', '+').replaceAll('_', '/'));
  return validateState(JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, c => c.charCodeAt(0)))), data);
}
export function restoreState(data: AtlasData, fragment: string, stored: string | null): { state: ChartState; message?: string } {
  const shared = fragment.startsWith('#chart=') ? fragment.slice(7) : null;
  let invalid = false;
  if (shared !== null) {
    try { return {state:decodeState(shared,data)}; } catch { invalid=true; }
  }
  if (stored) {
    try { return {state:validateState(JSON.parse(stored),data), ...(invalid ? {message:'The shared layout is invalid or unavailable. Your saved layout has been restored. Reset returns to the default.'} : {})}; } catch {invalid=true;}
  }
  return {state:initialState(data), ...(invalid ? {message:'That saved or shared layout is invalid or unavailable. The default layout has been restored.'} : {})};
}
