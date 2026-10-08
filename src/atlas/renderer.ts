import type { AtlasData, ChartState, Panel } from './contracts.ts';
import { definition, panelYears } from './composition.ts';
import { chartGeometry, colorFor, formatTick } from './geometry.ts';

const NS = 'http://www.w3.org/2000/svg';
export function svgElement(tag: string, attrs: Record<string, string | number> = {}, text?: string): SVGElement {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  if (text) node.textContent = text;
  return node;
}
export function drawChart(svg: SVGSVGElement, panel: Panel, state: ChartState, data: AtlasData, width: number): void {
  const range = panelYears(panel,state);
  const g = chartGeometry(panel, data, range.start_year, range.end_year, width);
  const availableWidth = width;
  width = g.width;
  svg.replaceChildren();
  svg.setAttribute('viewBox', `0 0 ${width} ${g.height}`);
  svg.style.width = width > availableWidth ? `${width}px` : '100%';
  svg.dataset.plotLeft = String(g.left); svg.dataset.plotRight = String(g.right);
  svg.setAttribute('height', String(g.height));
  svg.dataset.panelId = panel.id;
  svg.append(svgElement('title', {}, `${panel.title}. ${range.start_year} to ${range.end_year}. Arrow keys inspect years.`));
  const clipId = `clip-${panel.id}`;
  const defs = svgElement('defs');
  const clip = svgElement('clipPath', { id: clipId });
  clip.append(svgElement('rect', { x: g.left, y: g.top, width: width - g.left - g.right, height: g.bottom - g.top })); defs.append(clip); svg.append(defs);
  const plot = svgElement('g', { 'clip-path': `url(#${clipId})` });
  svg.append(plot);
  const annotations = data.annotations.filter(a => state.annotation_ids.includes(a.id));
  for (const a of annotations) {
    if (a.type === 'interval' && state.show_intervals) {
      const node = svgElement('rect', { x: g.x(a.start_year - .45), y: g.top, width: g.x(a.end_year! + .45) - g.x(a.start_year - .45), height: g.bottom - g.top, fill: '#e9e5dc', opacity: .72, 'data-annotation': a.id });
      node.append(svgElement('title', {}, a.label)); plot.append(node);
    }
    if (a.type === 'event' && state.show_events && a.start_year >= range.start_year && a.start_year <= range.end_year) {
      plot.append(svgElement('line', { x1: g.x(a.start_year), x2: g.x(a.start_year), y1: g.top, y2: g.bottom, stroke: '#161616', opacity: .32, 'stroke-dasharray': '3 5', 'data-annotation': a.id }));
      svg.append(svgElement('text', { x: g.x(a.start_year), y: 17, 'text-anchor': 'middle', fill: '#67645e', 'font-size': 10, 'data-event-label': a.id }, `${a.start_year} · ${a.label}`));
    }
  }
  for (const [index, axis] of g.axes.entries()) {
    const direction = axis.side === 'left' ? -1 : 1;
    const color = axis.ids.length === 1 ? colorFor(data, axis.ids[0]) : '#67645e';
    const group = svgElement('g', { 'data-unit-axis': axis.key, 'data-axis-series': axis.ids.join(' '), 'aria-label': axis.label });
    group.append(svgElement('line', { x1: axis.position, x2: axis.position, y1: g.top, y2: g.bottom, stroke: color, opacity: .45 }));
    for (const tick of axis.y.ticks(5)) {
      const yy = axis.y(tick);
      if (index === 0) plot.append(svgElement('line', { x1: g.left, x2: width - g.right, y1: yy, y2: yy, stroke: tick === 0 ? '#777268' : '#d9d5cc', 'stroke-width': tick === 0 ? 1.2 : .8 }));
      group.append(svgElement('text', { x: axis.position + direction * 8, y: yy + 4, 'text-anchor': direction < 0 ? 'end' : 'start', fill: color, 'font-size': 11 }, formatTick(tick)));
    }
    const labelX = axis.position + direction * 53, labelY = (g.top + g.bottom) / 2;
    group.append(svgElement('text', { x: labelX, y: labelY, transform: `rotate(${direction * 90} ${labelX} ${labelY})`, 'text-anchor': 'middle', fill: color, 'font-size': 10 }, axis.label));
    svg.append(group);
  }
  const ticks = g.x.ticks(width < 600 ? 4 : 10).filter(t => Number.isInteger(t));
  for (const tick of ticks) {
    plot.append(svgElement('line', { x1: g.x(tick), x2: g.x(tick), y1: g.top, y2: g.bottom, stroke: '#d9d5cc', 'stroke-width': .7, opacity: .7 }));
    svg.append(svgElement('text', { x: g.x(tick), y: g.bottom + 23, 'text-anchor': 'middle', fill: '#67645e', 'font-size': 11 }, String(tick)));
  }
  for (const segment of g.paths) {
    const color = colorFor(data, segment.id);
    plot.append(svgElement('path', { d: segment.path, fill: 'none', stroke: color, 'stroke-width': 2.35, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-dasharray': segment.kind === 'forecast' ? '8 5' : segment.kind === 'reconstructed' ? '2 4' : 'none', 'data-series-id': segment.id, 'data-kind': segment.kind }));
    if (segment.points.length === 1) plot.append(svgElement('circle', { cx: g.x(segment.points[0].year), cy: g.series.find(s => s.id === segment.id)!.axis.y(segment.points[0].value!), r: 2.5, fill: color }));
  }
  for (const s of g.series) {
    for (const point of s.points) {
      if (point.value === null) continue;
      const status=point.observation!.revision_status;
      if (status === 'revised') plot.append(svgElement('rect',{x:g.x(point.year)-3,y:s.axis.y(point.value)-3,width:6,height:6,fill:colorFor(data,s.id),'data-status-marker':status}));
      else if (point.observation!.value_kind === 'forecast' || status === 'provisional') plot.append(svgElement('circle', {cx:g.x(point.year),cy:s.axis.y(point.value),r:3,fill:'#fffefa',stroke:colorFor(data,s.id),'stroke-width':1.5,'data-status-marker':status}));
      if (point.breakBefore) {
        const marker = svgElement('path', { d: `M${g.x(point.year)-4},${g.top}l4,6l4,-6`, fill: colorFor(data,s.id), 'data-statistical-break': s.id });
        marker.append(svgElement('title', {}, definition(data, s.id).breaks.find(b => Number(b.period.slice(0,4)) === point.year)!.description)); plot.append(marker);
      }
    }

  }
  if (!g.series.some(s => s.points.some(p => p.value !== null))) svg.append(svgElement('text', { x: width / 2, y: 115, 'text-anchor': 'middle', fill: '#67645e', 'font-size': 13 }, 'No observations in the selected period'));
  const cursor = svgElement('line', { x1: 0, x2: 0, y1: g.top, y2: g.bottom, stroke: '#161616', 'stroke-width': 1, opacity: 0, 'data-cursor': panel.id, 'pointer-events': 'none' });
  svg.append(cursor);
  for (const id of panel.series_ids) svg.append(svgElement('circle', { r: 4, fill: '#fffefa', stroke: colorFor(data,id), 'stroke-width': 2, opacity: 0, 'data-highlight': id, 'pointer-events': 'none' }));
  svg.append(svgElement('rect', { x: g.left, y: g.top, width: width-g.left-g.right, height:g.bottom-g.top, fill:'transparent', 'data-overlay':panel.id, style:'cursor:crosshair' }));
}

export function drawCursor(svg: SVGSVGElement, panel: Panel, state: ChartState, data: AtlasData, year: number | null): void {
  const width = svg.viewBox.baseVal.width;
  const range = panelYears(panel,state);
  if(year!==null&&(year<range.start_year||year>range.end_year))year=null;
  const g = chartGeometry(panel, data, range.start_year, range.end_year, width);
  const cursor = svg.querySelector<SVGLineElement>('[data-cursor]')!;
  cursor.setAttribute('opacity', year === null ? '0' : '.6');
  if (year !== null) { cursor.setAttribute('x1', String(g.x(year))); cursor.setAttribute('x2', String(g.x(year))); }
  for (const s of g.series) {
    const dot = svg.querySelector<SVGCircleElement>(`[data-highlight="${s.id}"]`)!;
    const point = s.points.find(p => p.year === year);
    dot.setAttribute('opacity', point?.value != null ? '1' : '0');
    if (point?.value != null) { dot.setAttribute('cx', String(g.x(point.year))); dot.setAttribute('cy', String(s.axis.y(point.value))); }
  }
}
