import { parse } from 'csv-parse/sync';
import type { Importer } from './importer.ts';
import type { Observation } from './schema.ts';

export const FSO_GDP_SOURCE_ID = 'fso-gdp-long-series';
export const FSO_GDP_DATA_URL = 'https://dam-api.bfs.admin.ch/hub/api/dam/assets/36813569/master';
export const FSO_GDP_PUBLICATION_DATE = '2026-08-25';

/** FSO ts-x-04.02.01.08, August 2026 vintage; current-price levels only. */
export const fsoGdpImporter: Importer = {
  name: 'fso-gdp',
  parse(contents, { series, snapshot }) {
    if (series.id !== 'nominal-gdp' || series.frequency !== 'annual' || series.measurement !== 'level' ||
        series.price_basis !== 'nominal' || series.aggregation_kind !== 'sum' ||
        series.unit.code !== 'currency' || series.unit.dimension !== 'CHF' || series.unit.scale !== 1_000_000 ||
        !series.source_ids.includes(FSO_GDP_SOURCE_ID)) {
      throw new Error('fso-gdp requires nominal-gdp: annual current-price GDP in CHF millions');
    }
    if (snapshot.source_id !== FSO_GDP_SOURCE_ID || snapshot.source_url !== FSO_GDP_DATA_URL) {
      throw new Error('fso-gdp requires the audited FSO long-series source and CSV URL');
    }
    const rows = parse(contents, {
      bom: true, skip_empty_lines: true,
      columns: (names: string[]) => {
        if (names.join(',') !== 'PERIOD,VARIABLE,VALUE,STATUS,UNIT_MEAS') {
          throw new Error('fso-gdp: unexpected source CSV header');
        }
        return names;
      },
    }) as Record<string, string>[];
    if (rows.some(row => row.VARIABLE !== 'B1GQ' || !['MCHF', 'AC', 'ACPP'].includes(row.UNIT_MEAS))) {
      throw new Error('fso-gdp: unexpected variable or unit in the audited source');
    }
    const selected = rows.filter(row => row.VARIABLE === 'B1GQ' && row.UNIT_MEAS === 'MCHF');
    if (!selected.length) throw new Error('fso-gdp: no B1GQ/MCHF observations');
    const periods = new Set<string>();
    return selected.map((row): Observation => {
      if (!/^\d{4}$/.test(row.PERIOD) || Number(row.PERIOD) < 1948 || Number(row.PERIOD) > 2025) {
        throw new Error('fso-gdp: period is outside the audited 1948–2025 vintage');
      }
      if (periods.has(row.PERIOD)) throw new Error(`fso-gdp: duplicate period ${row.PERIOD}`);
      periods.add(row.PERIOD);
      // A means normal. Do not silently flatten new flags into final observations.
      if (row.STATUS !== 'A') throw new Error(`fso-gdp/${row.PERIOD}: unaudited observation status ${row.STATUS}`);
      if (!/^-?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(row.VALUE) ||
          !Number.isFinite(Number(row.VALUE)) || Number(row.VALUE) <= 0) {
        throw new Error(`fso-gdp/${row.PERIOD}: GDP must be a finite positive numeric value`);
      }
      return {
        series_id: series.id, reference_period: row.PERIOD, value: Number(row.VALUE),
        source_snapshot_ids: [snapshot.id], publication_date: FSO_GDP_PUBLICATION_DATE,
        value_kind: Number(row.PERIOD) < 1995 ? 'reconstructed' : 'observed', revision_status: 'final',
      };
    });
  },
};

/** Published real annual change; nominal changes (AC) are never selected. */
export const fsoRealGrowthImporter: Importer = {
  name: 'fso-real-growth',
  parse(contents, { series, snapshot }) {
    if (series.id !== 'real-gdp-growth' || series.frequency !== 'annual' || series.measurement !== 'growth' ||
        series.price_basis !== 'real' || series.aggregation_kind !== 'annual_change' ||
        series.unit.code !== 'percent' || series.unit.scale !== 1 || !series.source_ids.includes(FSO_GDP_SOURCE_ID) ||
        snapshot.source_id !== FSO_GDP_SOURCE_ID || snapshot.source_url !== FSO_GDP_DATA_URL) {
      throw new Error('fso-real-growth requires the audited annual real GDP growth identity and source');
    }
    const rows = parse(contents, { bom: true, columns: true, skip_empty_lines: true }) as Record<string, string>[];
    if (!rows.length || Object.keys(rows[0]).join(',') !== 'PERIOD,VARIABLE,VALUE,STATUS,UNIT_MEAS') throw new Error('Unexpected FSO growth header');
    const selected = rows.filter(row => row.VARIABLE === 'B1GQ' && row.UNIT_MEAS === 'ACPP');
    if (!selected.length) throw new Error('No B1GQ/ACPP observations');
    const periods = new Set<string>();
    return selected.flatMap(row => {
      if (!/^\d{4}$/.test(row.PERIOD) || Number(row.PERIOD) < 1948 || Number(row.PERIOD) > 2025) throw new Error('Unaudited growth period');
      if (periods.has(row.PERIOD)) throw new Error('Duplicate growth period');
      periods.add(row.PERIOD);
      if (row.PERIOD === '1948' && row.STATUS === 'O' && row.VALUE === '') return [];
      if (row.STATUS !== 'A') throw new Error('Unaudited growth status');
      if (!/^-?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(row.VALUE) || !Number.isFinite(Number(row.VALUE)) || Number(row.VALUE) <= -100) throw new Error('Invalid real growth value');
      return [{ series_id: series.id, reference_period: row.PERIOD, value: Number(row.VALUE), source_snapshot_ids: [snapshot.id],
        publication_date: FSO_GDP_PUBLICATION_DATE, value_kind: Number(row.PERIOD) < 1995 ? 'reconstructed' as const : 'observed' as const, revision_status: 'final' as const }];
    });
  },
};
