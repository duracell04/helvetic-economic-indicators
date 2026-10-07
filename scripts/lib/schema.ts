import { z } from 'zod';

export const SCHEMA_VERSION = '2.0.0';
export const id = z.string().regex(/^[a-z][a-z0-9-]*$/);
const text = z.string().trim().min(1);
export const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const time = Date.parse(value);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}, 'Invalid calendar date');
export const rights = z.object({
  redistribution: z.enum(['unknown', 'permitted', 'restricted']),
  licence: text.nullable(), evidence_url: z.url().nullable(),
  reviewed_on: date.nullable(), attribution: text.nullable(),
  conditions: text,
}).strict();
export const source = z.object({
  id, publisher: text, title: text, landing_url: z.url(),
  data_url: z.url().nullable(), source_identifier: text.nullable(),
  audit_status: z.enum(['candidate', 'verified']),
  definition: text, coverage: text.nullable(), revision_practice: text.nullable(),
  rights,
}).strict();
export const derivation = z.discriminatedUnion('method', [
  z.object({ id, output_series_id: id, method: z.literal('growth'), inputs: z.array(id).length(1), convention: text }).strict(),
  z.object({ id, output_series_id: id, method: z.literal('rebase'), inputs: z.array(id).length(1), base_period: z.string().regex(/^\d{4}$/), convention: text }).strict(),
  z.object({ id, output_series_id: id, method: z.literal('spread'), inputs: z.array(id).length(2), convention: text }).strict(),
]);
export const series = z.object({
  id, title: text,
  verification: z.enum(['candidate', 'verified']),
  data_class: z.enum(['real', 'synthetic']), definition: text,
  unit: z.object({ code: z.enum(['currency', 'count', 'index', 'percent', 'percentage_points']), label: text, dimension: text, scale: z.number().positive().finite() }).strict(),
  measurement: z.enum(['level', 'growth', 'rate', 'yield', 'return', 'spread']),
  price_basis: z.enum(['nominal', 'real', 'not_applicable', 'unknown']),
  aggregation_kind: z.enum(['annual_average', 'end_of_period', 'annual_change', 'sum', 'native', 'unknown']),
  frequency: z.enum(['annual', 'quarterly', 'monthly', 'daily', 'event']),
  institutional_coverage: text, instrument: text.nullable(), maturity: text.nullable(),
  aggregation: text, source_ids: z.array(id),
  source_identifier: text.nullable(),
  breaks: z.array(z.object({ period: text, description: text }).strict()),
  usage_notes: text,
}).strict();
export const snapshot = z.object({
  id, source_id: id, retrieved_on: date,
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  file: z.string().regex(/^data\/raw\/[a-z0-9-]+\.csv$/),
  source_url: z.url(),
}).strict();
export const seriesRegistrySchema = z.object({
  schema_version: z.literal(SCHEMA_VERSION),
  sources: z.array(source), series: z.array(series), snapshots: z.array(snapshot),
}).strict();
export const transformationRegistrySchema = z.object({ schema_version: z.literal(SCHEMA_VERSION), transformations: z.array(derivation) }).strict();
export const registrySchema = seriesRegistrySchema.extend({ transformations: z.array(derivation) });
export const observationSchema = z.object({
  series_id: id, reference_period: text, value: z.number().finite().nullable(),
  source_snapshot_ids: z.array(id).min(1), publication_date: date.nullable(),
  value_kind: z.enum(['observed', 'reconstructed', 'forecast']),
  revision_status: z.enum(['final', 'provisional', 'revised']),
}).strict();
export type Registry = z.infer<typeof registrySchema>;
export type Series = z.infer<typeof series>;
export type Observation = z.infer<typeof observationSchema>;
export type Snapshot = z.infer<typeof snapshot>;
export type Transformation = z.infer<typeof derivation>;

export function validPeriod(period: string, frequency: Series['frequency']): boolean {
  switch (frequency) {
    case 'annual': return /^(18|19|20|21)\d{2}$/.test(period);
    case 'quarterly': return /^(18|19|20|21)\d{2}-Q[1-4]$/.test(period);
    case 'monthly': return /^(18|19|20|21)\d{2}-(0[1-9]|1[0-2])$/.test(period);
    case 'daily': case 'event': return date.safeParse(period).success;
  }
}
