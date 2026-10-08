import { z } from 'zod';
import { id, SCHEMA_VERSION, type Registry, type Observation } from '../../scripts/lib/schema.ts';

const year = z.number().int().min(1800).max(2199);
// Former v2 indexed axes / show_raw flags remain parseable only for saved-layout migration.
// validateState converts them to original units and disables optional value labels.
export const panelSchema = z.object({
  id, title: z.string().min(1), series_ids: z.array(id).min(1),
  axis: z.object({ mode: z.enum(['native', 'indexed']), base_year: year.nullable() }).strict(),
  conventions_acknowledged: z.boolean(),
  start_year: year.optional(), end_year: year.optional(),
}).strict().refine(panel => (panel.start_year === undefined && panel.end_year === undefined) ||
  (panel.start_year !== undefined && panel.end_year !== undefined && panel.start_year <= panel.end_year), 'Chart years must be a complete, ordered range');
export const stateSchema = z.object({
  version: z.literal(SCHEMA_VERSION), preset_id: id,
  start_year: year, end_year: year, panels: z.array(panelSchema),
  show_events: z.boolean(), show_intervals: z.boolean(), show_raw: z.boolean(),
  annotation_ids: z.array(id),
}).strict().refine(s => s.start_year <= s.end_year, 'Start year must not be after end year');
export const topicRegistrySchema = z.object({ schema_version: z.literal(SCHEMA_VERSION), topics: z.array(z.object({ id, title: z.string().min(1), description: z.string(), series_ids: z.array(id) }).strict()) }).strict();
export const presetRegistrySchema = z.object({
  schema_version: z.literal(SCHEMA_VERSION), default_preset_id: id,
  presets: z.array(z.object({ id, title: z.string().min(1), config: stateSchema }).strict()),
  styles: z.record(id, z.string().regex(/^#[a-fA-F0-9]{6}$/)),
}).strict();
export const annotationRegistrySchema = z.object({
  schema_version: z.literal(SCHEMA_VERSION), annotations: z.array(z.object({
    id, type: z.enum(['event', 'interval']), start_year: year, end_year: year.nullable(),
    label: z.string().min(1), source_url: z.url().nullable(),
    verification: z.enum(['candidate', 'verified']), data_class: z.enum(['real', 'synthetic']),
  }).strict()),
}).strict();
export type Panel = z.infer<typeof panelSchema>;
export type ChartState = z.infer<typeof stateSchema>;
export type Topic = z.infer<typeof topicRegistrySchema>['topics'][number];
export type Preset = z.infer<typeof presetRegistrySchema>['presets'][number];
export type Annotation = z.infer<typeof annotationRegistrySchema>['annotations'][number];
export interface AtlasData {
  mode: 'demo' | 'production'; registry: Registry;
  topics: Topic[]; presets: Preset[]; default_preset_id: string;
  styles: Record<string, string>; annotations: Annotation[]; observations: Observation[];
}
