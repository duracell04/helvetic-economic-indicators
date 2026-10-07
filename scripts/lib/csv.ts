import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { observationSchema, type Observation } from './schema.ts';

export const columns = ['series_id', 'reference_period', 'value', 'source_snapshot_ids', 'publication_date', 'value_kind', 'revision_status'];

export function readObservations(contents: string): Observation[] {
  let header: string[] = [];
  const rows = parse(contents, {
    bom: true, skip_empty_lines: true,
    columns: (names: string[]) => { header = names; return names; },
  }) as Record<string, string>[];
  if (header.join(',') !== columns.join(',')) throw new Error(`CSV header must be: ${columns.join(',')}`);
  return rows.map((row, index) => {
    if (row.value !== 'NA' && !/^-?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(row.value)) {
      throw new Error(`Row ${index + 2}: value must be numeric or NA (never an empty value)`);
    }
    return observationSchema.parse({
      ...row,
      value: row.value === 'NA' ? null : Number(row.value),
      source_snapshot_ids: JSON.parse(row.source_snapshot_ids),
      publication_date: row.publication_date === '' ? null : row.publication_date,
    });
  });
}

export function writeObservations(rows: Observation[]): string {
  return stringify([...rows].sort((a, b) => a.series_id.localeCompare(b.series_id, 'en') || a.reference_period.localeCompare(b.reference_period, 'en')).map(row => ({
    ...row, value: row.value ?? 'NA',
    source_snapshot_ids: JSON.stringify([...row.source_snapshot_ids].sort()),
    publication_date: row.publication_date ?? '',
  })), { header: true, columns, record_delimiter: '\n' });
}
