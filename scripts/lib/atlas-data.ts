import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { load, validateMetadata, validate, checksum, json } from './store.ts';
import { writeObservations } from './csv.ts';
import { topicRegistrySchema, presetRegistrySchema, annotationRegistrySchema, type AtlasData } from '../../src/atlas/contracts.ts';
import { validateState } from '../../src/atlas/composition.ts';

export async function readAtlas(root: string): Promise<AtlasData> {
  const { registry, observations } = await load(root);
  const read = async (file: string) => JSON.parse(await readFile(path.join(root, 'data/registry', file), 'utf8'));
  const topics = topicRegistrySchema.parse(await read('topics.json')).topics;
  const presets = presetRegistrySchema.parse(await read('presets.json'));
  const annotations = annotationRegistrySchema.parse(await read('annotations.json')).annotations;
  return { mode: 'production', registry, observations, topics, ...presets, annotations };
}

export function validateAtlas(data: AtlasData, publication = false): void {
  validateMetadata(data.registry, data.observations, publication);
  topicRegistrySchema.parse({schema_version:'2.0.0',topics:data.topics});
  presetRegistrySchema.parse({schema_version:'2.0.0',presets:data.presets,default_preset_id:data.default_preset_id,styles:data.styles});
  annotationRegistrySchema.parse({schema_version:'2.0.0',annotations:data.annotations});
  const ids = new Set(data.registry.series.map(s => s.id));
  const unique = (values: string[], name: string) => { if (new Set(values).size !== values.length) throw new Error(`Duplicate ${name}`); };
  unique(data.topics.map(t => t.id), 'topic'); unique(data.presets.map(p => p.id), 'preset'); unique(data.annotations.map(a => a.id), 'annotation');
  if (!data.presets.some(p => p.id === data.default_preset_id)) throw new Error('Unknown default preset');
  for (const topic of data.topics) {
    unique(topic.series_ids, 'topic indicator');
    for (const id of topic.series_ids) if (!ids.has(id)) throw new Error(`${topic.id}: unknown indicator ${id}`);
  }
  for (const id of Object.keys(data.styles)) if (!ids.has(id)) throw new Error(`Unknown styled indicator: ${id}`);
  for (const preset of data.presets) {
    if (preset.id !== preset.config.preset_id) throw new Error('Preset ID does not match configuration');
    validateState(preset.config, data, false);
  }
  for (const annotation of data.annotations) {
    if (annotation.type === 'interval' && (annotation.end_year === null || annotation.end_year < annotation.start_year)) throw new Error('Invalid annotation interval');
    if (annotation.type === 'event' && annotation.end_year !== null) throw new Error('Event annotations have a single date');
    if (publication && (annotation.data_class !== 'real' || annotation.verification !== 'verified' || !annotation.source_url)) throw new Error('Public annotations require verified real references');
    if (annotation.data_class === 'synthetic' && !annotation.label.startsWith('Illustrative ')) throw new Error('Synthetic annotations must be labelled illustrative');
  }
}

export async function productionAtlas(root: string): Promise<AtlasData> {
  await validate(root, true);
  const data = await readAtlas(root);
  validateAtlas(data, true);
  return data;
}

export async function createDemo(root: string): Promise<AtlasData> {
  const original = await readAtlas(root);
  const referenced = new Set(original.presets.flatMap(p => p.config.panels.flatMap(p => p.series_ids)));
  const demoDefinitions = original.registry.series.filter(s => referenced.has(s.id)).map(s => ({ ...s,
    id: `demo-${s.id}`, title: s.title, verification: 'verified' as const, data_class: 'synthetic' as const,
    definition: `Synthetic example for interaction testing. Not a Swiss historical observation. ${s.definition}`,
    source_ids: ['demo-source'], source_identifier: `demo-${s.id}`,
    breaks: s.id === 'snb-policy-rate-annual' ? [{ period: '1999', description: 'Illustrative methodological break; no historical claim.' }] : [],
  }));
  const demoIds = new Set(demoDefinitions.map(s => s.id));
  const rows = demoDefinitions.flatMap((s, index) => Array.from({ length: 81 }, (_, offset) => {
    const year = 1946 + offset, t = year - 1960;
    const level = s.unit.code === 'count' ? 5_000_000 * Math.exp(t * .008) : s.unit.code === 'currency' ? (s.unit.dimension === 'CHF/person' ? 20_000 : 100_000) * Math.exp(t * (s.id === 'demo-real-gdp-per-capita' ? .014 : .022)) :
      s.measurement === 'return' ? 6 + 16 * Math.sin(t * .6 + index) : s.title.includes('debt') ? 40 + 15 * Math.sin(t * .065 + index) :
      s.measurement === 'growth' ? 2 + 3 * Math.sin(t * .35) : s.id.includes('unemployment') ? 3 + 2.2 * Math.sin(t * .13 + index * .5) : 2.5 + 2.7 * Math.sin(t * .13 + index * .5);
    const start = s.measurement === 'return' ? 1988 : s.measurement === 'yield' ? 1979 : 1946;
    return { series_id: s.id, reference_period: String(year), value: year < start || (s.id === 'demo-real-gdp-per-capita' && year === 1971) ? null : Number(level.toFixed(4)),
      source_snapshot_ids: ['demo-input'], publication_date: null,
      value_kind: (year === 2026 ? 'forecast' : year < 1960 ? 'reconstructed' : 'observed') as 'forecast' | 'reconstructed' | 'observed',
      revision_status: (year === 2025 ? 'provisional' : year === 2024 ? 'revised' : 'final') as 'provisional' | 'revised' | 'final',
    };
  }));
  const bytes = writeObservations(rows);
  const source = { id: 'demo-source', publisher: 'Synthetic development fixtures', title: 'Deterministic illustrative observations',
    landing_url: 'https://example.invalid/demo', data_url: 'https://example.invalid/demo.csv', source_identifier: 'synthetic-demo-v2', audit_status: 'verified' as const,
    definition: 'Constructed software examples, not economic evidence.', coverage: 'Illustrative annual periods 1946–2026', revision_practice: 'Versioned development fixture',
    rights: { redistribution: 'permitted' as const, licence: 'MIT (synthetic fixture)', evidence_url: 'https://example.invalid/fixture-licence', reviewed_on: '2026-10-07', attribution: 'Project synthetic fixtures', conditions: 'Local demonstration only; never publish as historical observations.' },
  };
  const registry = { ...original.registry, series: [...original.registry.series, ...demoDefinitions], sources: [...original.registry.sources, source], transformations: [], snapshots: [
    { id: 'demo-input', source_id: source.id, retrieved_on: '2026-10-07', sha256: checksum(bytes), file: 'data/raw/demo-input.csv', source_url: source.data_url },
  ] };
  const rename = (id: string) => demoIds.has(`demo-${id}`) ? `demo-${id}` : id;
  const annotations: AtlasData['annotations'] = [
    { id: 'demo-event', type: 'event', start_year: 1975, end_year: null, label: 'Illustrative event', source_url: null, verification: 'candidate', data_class: 'synthetic' },
    { id: 'demo-interval', type: 'interval', start_year: 2000, end_year: 2002, label: 'Illustrative contraction', source_url: null, verification: 'candidate', data_class: 'synthetic' },
  ];
  const data: AtlasData = { ...original, mode: 'demo', default_preset_id: 'reference', registry, observations: rows, annotations,
    topics: original.topics.map(t => ({ ...t, series_ids: [...new Set(t.series_ids.flatMap(id => rename(id) === id ? [id] : [rename(id), id]))] })),
    presets: original.presets.map(p => ({ ...p, config: { ...p.config, annotation_ids: annotations.map(a => a.id), panels: p.config.panels.map(panel => ({ ...panel, series_ids: panel.series_ids.map(rename) })) } })),
    styles: { ...original.styles, ...Object.fromEntries(Object.entries(original.styles).map(([id, color]) => [rename(id), color])) },
  };
  validateAtlas(data);
  const demoRoot = path.join(root, '.cache/demo-data');
  for (const dir of ['data/registry', 'data/raw', 'data/canonical']) await mkdir(path.join(demoRoot, dir), { recursive: true });
  const { transformations, ...primary } = registry;
  await writeFile(path.join(demoRoot, 'data/registry/registry.json'), json(primary));
  await writeFile(path.join(demoRoot, 'data/registry/transformations.json'), json({ schema_version: '2.0.0', transformations }));
  await writeFile(path.join(demoRoot, 'data/raw/demo-input.csv'), bytes);
  for (const s of demoDefinitions) await writeFile(path.join(demoRoot, `data/canonical/${s.id}.csv`), writeObservations(rows.filter(o => o.series_id === s.id)));
  await validate(demoRoot);
  await writeFile(path.join(root, '.cache/atlas-demo.json'), json(data));
  const publicRoot = path.join(root, '.cache/atlas-preview/public');
  await mkdir(path.join(publicRoot, 'data'), {recursive:true});
  await writeFile(path.join(publicRoot, 'data/atlas.json'), json(data));
  await copyFile(path.join(root, 'public/favicon.svg'), path.join(publicRoot, 'favicon.svg'));
  await writeFile(path.join(publicRoot, '.nojekyll'), '');
  return data;
}
