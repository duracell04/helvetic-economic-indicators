import { scaleLinear } from 'd3-scale';
import { line } from 'd3-shape';
import type { Observation } from '../../scripts/lib/schema.ts';
import type { AtlasData, Panel } from './contracts.ts';
import { axisKey, definition } from './composition.ts';

export interface Point { year: number; value: number | null; raw: number | null; observation: Observation | null; breakBefore: boolean; }
export function pointsFor(_panel: Panel, id: string, data: AtlasData, start: number, end: number): Point[] {
  const s = definition(data, id);
  const lookup = new Map(data.observations.filter(o => o.series_id === id).map(o => [Number(o.reference_period), o]));
  return Array.from({ length: end - start + 1 }, (_, i) => {
    const year = start + i, row = lookup.get(year) ?? null, raw = row?.value ?? null;
    return { year, raw, value: raw,
      observation: row, breakBefore: s.breaks.some(b => Number(b.period.slice(0, 4)) === year) };
  });
}
export function chartGeometry(panel: Panel, data: AtlasData, start: number, end: number, width: number) {
  const groups = new Map<string, string[]>();
  for (const id of panel.series_ids) {
    const key = axisKey(definition(data, id));
    groups.set(key, [...(groups.get(key) ?? []), id]);
  }
  const left = 64 * Math.ceil(groups.size / 2), right = groups.size > 1 ? 64 * Math.floor(groups.size / 2) : 24;
  const top = 35, bottom = 211, height = 245;
  // Additional unit axes scroll within their chart on narrow screens.
  width = Math.max(width, left + right + 220);
  const x = scaleLinear().domain([start, end]).range([left, width - right]);
  const points = new Map(panel.series_ids.map(id => [id, pointsFor(panel, id, data, start, end)]));
  const axes = [...groups.entries()].map(([key, ids], index) => {
    const values = ids.flatMap(id => points.get(id)!.flatMap(p => p.value === null ? [] : [p.value]));
    let low = values.length ? Math.min(...values) : 0, high = values.length ? Math.max(...values) : 1;
    if (ids.some(id => definition(data, id).measurement !== 'level')) { low = Math.min(low, 0); high = Math.max(high, 0); }
    const padding = (high - low || Math.abs(high) || 1) * .09;
    const y = scaleLinear().domain([low - padding, high + padding]).nice(5).range([bottom, top]);
    const side = index % 2 === 0 ? 'left' : 'right';
    const position = side === 'left' ? left - 64 * Math.floor(index / 2) : width - right + 64 * Math.floor(index / 2);
    const s = definition(data, ids[0]);
    const unitLabel = ids.length > 1 && s.unit.code === 'percent' ? 'Percent' : s.unit.label;
    const label = unitLabel + (s.price_basis === 'nominal' || s.price_basis === 'real' ? ` (${s.price_basis})` : '');
    return { key, ids, y, side, position, label };
  });
  const series = panel.series_ids.map(id => ({ id, points: points.get(id)!, axis: axes.find(axis => axis.ids.includes(id))! }));
  const y = axes[0].y;
  const paths = series.flatMap(s => {
    const groups: { kind: Observation['value_kind']; points: Point[] }[] = [];
    let current: typeof groups[number] | null = null;
    let previous: Point | null = null;
    for (const point of s.points) {
      if (point.value === null) { current = null; previous = null; continue; }
      const kind = point.observation!.value_kind;
      if (!current || current.kind !== kind || point.breakBefore) {
        current = { kind, points: [] }; groups.push(current);
        if (previous && !point.breakBefore && previous.observation?.value_kind !== kind) current.points.push(previous);
      }
      current.points.push(point); previous = point;
    }
    const generator = line<Point>().defined(p => p.value !== null).x(p => x(p.year)).y(p => s.axis.y(p.value!));
    return groups.map(group => ({ id: s.id, kind: group.kind, path: generator(group.points) ?? '', points: group.points }));
  });
  return { x, y, axes, series, paths, left, right, top, bottom, height, width };
}
export function colorFor(data: AtlasData, id: string): string {
  const palette = ['#111111', '#8b2f2f', '#667085', '#b45309', '#2563eb', '#6b21a8', '#047857'];
  let hash = 0; for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
  return data.styles[id] ?? palette[hash % palette.length];
}
export function formatValue(value: number | null, label = ''): string {
  if (value === null) return 'No observation';
  return new Intl.NumberFormat('en-CH', { maximumFractionDigits: Math.abs(value) >= 1000 ? 0 : 2 }).format(value) + (label === 'Percent' ? '%' : label ? ` ${label}` : '');
}
export function formatTick(value: number): string {
  return Math.abs(value) >= 10_000 ? new Intl.NumberFormat('en-CH', { notation: 'compact', maximumFractionDigits: 1 }).format(value) : formatValue(value);
}
