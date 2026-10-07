import path from 'node:path';
import { productionAtlas } from './lib/atlas-data.ts';
import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { importLocal } from './lib/importer.ts';
import { validate, load, validateMetadata, exportPublic, atomicWrite, json } from './lib/store.ts';
import { derive } from './lib/transforms.ts';
import { readObservations, writeObservations } from './lib/csv.ts';

const { values, positionals } = parseArgs({ allowPositionals: true, options: {
  root: { type: 'string' }, file: { type: 'string' }, series: { type: 'string' }, source: { type: 'string' },
  'retrieved-on': { type: 'string' }, replace: { type: 'boolean' }, before: { type: 'string' }, after: { type: 'string' },
} });
const root = path.resolve(values.root ?? '.');
function required(name: keyof typeof values): string {
  const value = values[name];
  if (typeof value !== 'string' || !value) throw new Error(`Required: --${name}`);
  return value;
}

try {
  switch (positionals[0]) {
    case 'validate': {
      const data = await validate(root);
      console.log(`Validated ${data.registry.series.length} series definitions and ${data.observations.length} observations.`);
      break;
    }
    case 'import': {
      const id = await importLocal({ root, file: path.resolve(required('file')), seriesId: required('series'), sourceId: required('source'), retrievedOn: required('retrieved-on'), replace: values.replace });
      console.log(`Imported immutable snapshot ${id}. Review registry and canonical changes before publication.`);
      break;
    }
    case 'derive': {
      const { registry, observations } = await load(root);
      const outputs = new Set(registry.transformations.map(t => t.output_series_id));
      let next = observations.filter(row => !outputs.has(row.series_id));
      validateMetadata(registry, next);
      const remaining = [...registry.transformations];
      const finished = new Set(registry.series.filter(s => !outputs.has(s.id)).map(s => s.id));
      while (remaining.length) {
        const index = remaining.findIndex(s => s.inputs.every(id => finished.has(id)));
        if (index === -1) throw new Error('Unresolvable derivation dependencies');
        const [spec] = remaining.splice(index, 1);
        const target = registry.series.find(s => s.id === spec.output_series_id)!;
        const rows = derive(target, spec.inputs.map(id => registry.series.find(s => s.id === id)!), next, spec);
        next = [...next, ...rows];
        finished.add(target.id);
      }
      validateMetadata(registry, next);
      for (const target of registry.series.filter(s => outputs.has(s.id))) {
        await atomicWrite(path.join(root, 'data/canonical', `${target.id}.csv`), writeObservations(next.filter(row => row.series_id === target.id)));
      }
      await validate(root);
      console.log('Derived observations regenerated from registered calculations.');
      break;
    }
    case 'export': {
      const data = await productionAtlas(root);
      const count = await exportPublic(root);
      await atomicWrite(path.join(root, 'public/data/atlas.json'), json(data));
      console.log(`Exported ${count} verified datasets and production chart definitions.`); break;
    }
    case 'diff': {
      const before = readObservations(await readFile(required('before'), 'utf8'));
      const after = readObservations(await readFile(required('after'), 'utf8'));
      const key = (row: typeof before[number]) => `${row.series_id}/${row.reference_period}`;
      const old = new Map(before.map(row => [key(row), row]));
      const current = new Map(after.map(row => [key(row), row]));
      const changes = [...new Set([...old.keys(), ...current.keys()])].sort().flatMap(id => JSON.stringify(old.get(id)) === JSON.stringify(current.get(id)) ? [] : [{ id, before: old.get(id) ?? null, after: current.get(id) ?? null }]);
      console.log(json(changes)); break;
    }
    default: throw new Error('Use import, validate, derive, export, or diff. See docs/contributing.md.');
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
