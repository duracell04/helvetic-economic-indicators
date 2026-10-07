import type { Observation, Series, Transformation } from './schema.ts';

export function assertCompatible(target: Series, inputs: Series[], spec: Transformation): void {
  if (!spec) throw new Error(`${target.id}: missing calculation definition`);
  if (spec.output_series_id !== target.id) throw new Error('Calculation output does not match target');
  if (inputs.length !== spec.inputs.length || inputs.some((s, i) => s.id !== spec.inputs[i])) throw new Error(`${target.id}: incorrect input series`);
  if (target.frequency !== 'annual' || inputs.some(s => s.frequency !== 'annual')) throw new Error('Initial transforms require annual inputs; native frequencies are preserved separately');
  if (inputs.some(s => s.institutional_coverage !== target.institutional_coverage || s.data_class !== target.data_class)) throw new Error(`${target.id}: incompatible coverage or data class`);
  if (inputs.some(s => s.aggregation_kind === 'unknown' || s.price_basis === 'unknown')) throw new Error('Calculation requires known input conventions');
  if (spec.method === 'spread') {
    if (inputs.some(s => s.unit.code !== 'percent') || target.unit.code !== 'percentage_points') throw new Error('Spread requires percent inputs and a percentage-point output');
    if (inputs[0].unit.dimension !== inputs[1].unit.dimension || inputs[0].unit.scale !== inputs[1].unit.scale || inputs[0].aggregation_kind !== inputs[1].aggregation_kind || inputs[0].price_basis !== inputs[1].price_basis) throw new Error('Spread requires matching scales, price basis and annual aggregation conventions');
  } else {
    if (inputs[0].measurement !== 'level') throw new Error('Growth and rebasing require a level measurement');
    if (!['currency', 'count', 'index'].includes(inputs[0].unit.code)) throw new Error('Growth and rebasing require a level series');
    if (target.unit.code !== (spec.method === 'growth' ? 'percent' : 'index')) throw new Error('Incorrect derived output unit');
  }
}

function combine(target: Series, period: string, rows: Observation[], value: number | null): Observation {
  if (rows.some(row => row.value_kind !== rows[0].value_kind || row.revision_status !== rows[0].revision_status)) {
    throw new Error(`${target.id}/${period}: input statuses differ; resolve explicitly before deriving`);
  }
  if (value !== null && !Number.isFinite(value)) throw new Error(`${target.id}/${period}: non-finite result`);
  return {
    series_id: target.id, reference_period: period, value,
    source_snapshot_ids: [...new Set(rows.flatMap(row => row.source_snapshot_ids))].sort(),
    publication_date: rows.every(row => row.publication_date !== null) ? rows.map(row => row.publication_date!).sort().at(-1)! : null,
    value_kind: rows[0].value_kind, revision_status: rows[0].revision_status,
  };
}

export function derive(target: Series, inputs: Series[], observations: Observation[], spec: Transformation): Observation[] {
  assertCompatible(target, inputs, spec);
  const first = observations.filter(o => o.series_id === inputs[0].id).sort((a, b) => a.reference_period.localeCompare(b.reference_period));
  const second = new Map(observations.filter(o => o.series_id === inputs[1]?.id).map(o => [o.reference_period, o]));
  const lookup = new Map(first.map(o => [o.reference_period, o]));
  if (spec.method === 'growth') {
    return first.flatMap(row => {
      const previous = lookup.get(String(Number(row.reference_period) - 1));
      if (!previous) return [];
      if (previous.value !== null && previous.value <= 0) throw new Error('Growth requires a positive denominator');
      return [combine(target, row.reference_period, [previous, row], row.value === null || previous.value === null ? null : 100 * (row.value / previous.value - 1))];
    });
  }
  if (spec.method === 'rebase') {
    const base = lookup.get(spec.base_period);
    if (!base || base.value === null || base.value <= 0) throw new Error('Rebasing requires a present, positive base value');
    return first.map(row => combine(target, row.reference_period, [base, row], row.value === null ? null : 100 * row.value / base.value!));
  }
  return first.flatMap(row => {
    const other = second.get(row.reference_period);
    return other ? [combine(target, row.reference_period, [row, other], row.value === null || other.value === null ? null : row.value - other.value)] : [];
  });
}
