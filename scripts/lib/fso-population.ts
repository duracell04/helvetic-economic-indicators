import { parse } from 'csv-parse/sync';
import type { Importer } from './importer.ts';
export const POPULATION_URL = 'https://dam-api.bfs.admin.ch/hub/api/dam/assets/36681960/master';
export const fsoPopulationImporter: Importer = {
 name: 'fso-population',
 parse(contents, { series, snapshot }) {
  if (series.id !== 'population' || series.frequency !== 'annual' || series.unit.code !== 'count' || series.unit.dimension !== 'persons' || series.unit.scale !== 1 || series.aggregation_kind !== 'end_of_period' || !series.source_ids.includes('fso-population-long') || snapshot.source_id !== 'fso-population-long' || snapshot.source_url !== POPULATION_URL) throw new Error('Incompatible population identity or source');
  const rows = parse(contents,{bom:true,columns:true,skip_empty_lines:true}) as Record<string,string>[];
  if (!rows.length || Object.keys(rows[0]).join(',') !== 'YEAR,REFERENCE_POPULATION,VALUE') throw new Error('Unexpected population CSV header');
  if (rows.some(r => !['POP_JAN','POP_DEC'].includes(r.REFERENCE_POPULATION))) throw new Error('Unexpected reference population');
  const selected=rows.filter(r => r.REFERENCE_POPULATION === 'POP_DEC');
  if (!selected.length) throw new Error('No year-end population values');
  const seen=new Set<string>();
  return selected.map(r => {
   if (!/^\d{4}$/.test(r.YEAR) || Number(r.YEAR)<1861 || Number(r.YEAR)>2025) throw new Error('Unaudited population year');
   if (seen.has(r.YEAR)) throw new Error('Duplicate population year');seen.add(r.YEAR);
   if (!/^\d+$/.test(r.VALUE) || !Number.isSafeInteger(Number(r.VALUE)) || Number(r.VALUE)<=0) throw new Error('Population must be a positive integer');
   return {series_id:series.id,reference_period:r.YEAR,value:Number(r.VALUE),source_snapshot_ids:[snapshot.id],publication_date:'2026-08-20',value_kind:Number(r.YEAR)<=1980?'reconstructed' as const:'observed' as const,revision_status:'final' as const};
  });
 },
};
