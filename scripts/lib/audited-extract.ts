import { parse } from 'csv-parse/sync';
import type { Importer } from './importer.ts';
import { validPeriod, type Series } from './schema.ts';
export type ExtractSpec = {
 source: string; url: string; key: string; frequency: Series['frequency']; unit: Series['unit'];
 first: string; last: string; minimum: number; maximum: number; publication: string | null;
};
export const extractSpecs: Record<string, ExtractSpec> = {
 'snb-lombard-rate': {"source":"snb-historical-lombard","url":"https://www.snb.ch/public/publication/en/www-snb-ch/publications/statistical-publications/historical-time-series/2007/renditen_book/publications0_en/e_zinssaetze_u_renditen.book.pdf","key":"Historical time series 4/Table 1.1/lombard/end-year","frequency":"annual","unit":{"code":"percent","label":"Percent","dimension":"percent","scale":1},"first":"1907","last":"2005","minimum":-100,"maximum":100,"publication":null},
 'snb-discount-rate': {"source":"snb-historical-discount","url":"https://www.snb.ch/public/publication/en/www-snb-ch/publications/statistical-publications/historical-time-series/2007/renditen_book/publications0_en/e_zinssaetze_u_renditen.book.pdf","key":"Historical time series 4/Table 1.1/discount/end-year","frequency":"annual","unit":{"code":"percent","label":"Percent","dimension":"percent","scale":1},"first":"1907","last":"1998","minimum":-100,"maximum":100,"publication":null},
 'confederation-10y': {"source":"snb-confederation-spot-daily","url":"https://data.snb.ch/api/cube/rendeiduebd/data/csv/en?dimSel=D0(CHF),D1(10J)&fromDate=1988-01-04&toDate=2026-09-30","key":"rendeiduebd/CHF/10J","frequency":"daily","unit":{"code":"percent","label":"Percent per annum","dimension":"percent","scale":1},"first":"1988-01-04","last":"2026-09-30","minimum":-100,"maximum":100,"publication":"2026-10-01"},
 'snb-libor-target-upper': {"source":"snb-libor-upper-daily","url":"https://data.snb.ch/api/cube/snbband/data/csv/en?dimSel=D0(OG)&fromDate=2000-01-03&toDate=2019-06-12","key":"snbband/OG/effective-changes","frequency":"event","unit":{"code":"percent","label":"Percent","dimension":"percent","scale":1},"first":"2000-01-03","last":"2015-01-15","minimum":-100,"maximum":100,"publication":"2019-06-21"},
 'snb-libor-target-lower': {"source":"snb-libor-lower-daily","url":"https://data.snb.ch/api/cube/snbband/data/csv/en?dimSel=D0(UG)&fromDate=2000-01-03&toDate=2019-06-12","key":"snbband/UG/effective-changes","frequency":"event","unit":{"code":"percent","label":"Percent","dimension":"percent","scale":1},"first":"2000-01-03","last":"2015-01-15","minimum":-100,"maximum":100,"publication":"2019-06-21"},
 'snb-policy-rate-annual': {"source":"snb-policy-daily","url":"https://data.snb.ch/api/cube/snbgwdzid/data/csv/en?dimSel=D0(LZ)&fromDate=2019-06-13&toDate=2026-10-02","key":"snbgwdzid/LZ/calendar-day-mean","frequency":"annual","unit":{"code":"percent","label":"Percent","dimension":"percent","scale":1},"first":"2020","last":"2025","minimum":-100,"maximum":100,"publication":"2026-10-05"},
 'snb-policy-rate': {"source":"snb-policy-daily","url":"https://data.snb.ch/api/cube/snbgwdzid/data/csv/en?dimSel=D0(LZ)&fromDate=2019-06-13&toDate=2026-10-02","key":"snbgwdzid/LZ/effective-changes","frequency":"event","unit":{"code":"percent","label":"Percent","dimension":"percent","scale":1},"first":"2019-06-13","last":"2025-06-20","minimum":-100,"maximum":100,"publication":"2026-10-05"},
 'cpi-inflation': {"source":"fso-cpi-2025","url":"https://dam-api.bfs.admin.ch/hub/api/dam/assets/36878067/master","key":"LIK25B25/VAR_y-1/100_100","frequency":"annual","unit":{"code":"percent","label":"Percent","dimension":"percent","scale":1},"first":"1984","last":"2025","minimum":-100,"maximum":100,"publication":"2026-10-01"},
 'cpi': {"source":"fso-cpi-2025","url":"https://dam-api.bfs.admin.ch/hub/api/dam/assets/36878067/master","key":"LIK25B25/INDEX_m/100_100","frequency":"monthly","unit":{"code":"index","label":"December 2025 = 100","dimension":"cpi-index","scale":1},"first":"1982-12","last":"2026-09","minimum":1e-06,"maximum":1000000,"publication":"2026-10-01"},
 'ilo-unemployment': {"source":"fso-ilo-quarterly","url":"https://dam-api.bfs.admin.ch/hub/api/dam/assets/36710104/master","key":"T03.03.01.14/quarterly/total/rate","frequency":"quarterly","unit":{"code":"percent","label":"Percent","dimension":"percent","scale":1},"first":"1991-Q2","last":"2026-Q2","minimum":0,"maximum":100,"publication":"2026-08-18"},
 'ilo-unemployment-annual': {"source":"fso-ilo-annual","url":"https://dam-api.bfs.admin.ch/hub/api/dam/assets/36710104/master","key":"T03.03.01.14/annual/total/rate","frequency":"annual","unit":{"code":"percent","label":"Percent","dimension":"percent","scale":1},"first":"2010","last":"2025","minimum":0,"maximum":100,"publication":"2026-08-18"},
};
/** Verified, explicitly documented publisher extracts. Source bytes are checked before extraction. */
export const auditedExtractImporter: Importer = {
 name:'audited-extract',
 parse(contents,{series,snapshot}){
  const spec=extractSpecs[series.id];
  if(!spec || series.frequency!==spec.frequency || series.unit.code!==spec.unit.code || series.unit.dimension!==spec.unit.dimension || series.unit.scale!==spec.unit.scale || series.source_identifier!==spec.key || !series.source_ids.includes(spec.source) || snapshot.source_id!==spec.source || snapshot.source_url!==spec.url)throw new Error('Incompatible audited extract identity or source');
  const rows=parse(contents,{bom:true,columns:true,skip_empty_lines:true}) as Record<string,string>[];
  if(!rows.length || Object.keys(rows[0]).join(',')!=='reference_period,source_identifier,value')throw new Error('Unexpected audited extract header');
  const seen=new Set<string>();
  return rows.map(row=>{
   const period=row.reference_period;
   if(row.source_identifier!==spec.key)throw new Error('Incompatible source selection');
   if(!validPeriod(period,spec.frequency) || period<spec.first || period>spec.last)throw new Error('Unaudited extract period');
   if(seen.has(period))throw new Error('Duplicate extract period');seen.add(period);
   if(!/^-?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(row.value) || !Number.isFinite(Number(row.value)) || Number(row.value)<spec.minimum || Number(row.value)>spec.maximum)throw new Error('Invalid extract value');
   return {series_id:series.id,reference_period:period,value:Number(row.value),source_snapshot_ids:[snapshot.id],publication_date:spec.publication,value_kind:'observed' as const,revision_status:'final' as const};
  });
 },
};
