# Contributing sources and observations

All updates are prepared manually and reviewed through pull requests. No scheduled data acquisition is enabled.

## Register an exact source

Start with the appropriate publisher checklist in `docs/source-audit/`. Broad starting-point records must be split into exact dataset records when definitions or usage terms differ. Use stable lowercase hyphenated IDs and the contract in `scripts/lib/schema.ts`.

Complete the source URL and identifier, statistical definition, coverage, revision practice, and rights evidence. Mark a source verified only after review. Permitted redistribution requires a licence, evidence URL, review date, attribution and conditions. If rights are unknown or restricted, leave the observations outside the repository.

Register a primary series with native frequency, explicit unit code/dimension/scale, measurement kind, price basis, coverage, structured aggregation kind and written convention, historical breaks, source IDs and source identifier. Mark it verified only after those definitions are evidenced. The six initial topics and presets are starting points; they do not establish continuous historical coverage.

## Import a supplied local file

The default importer accepts the canonical CSV contract. Agency-specific importers implement the `Importer` interface, receive a source snapshot, and emit the same observations without changing their meaning. Original supplied file bytes are retained unchanged; no network fetch occurs.

Select an importer with optional `--importer`; omitting it retains `canonical-csv`. The audited `fso-gdp` importer accepts the original FSO August 2026 long-series CSV and selects annual current-price GDP in CHF millions (`B1GQ/MCHF`). It rejects other series identities, source URLs, unit scales, duplicate periods, invalid values and unaudited status flags. See the [GDP source audit](source-audit/gdp.md) for reproduction and historical qualifications.

```sh
npm run data:import -- --importer fso-gdp --file /absolute/path/fso-gdp-long-series.csv --series nominal-gdp --source fso-gdp-long-series --retrieved-on 2026-10-07
```

```sh
npm run data:import -- --file /absolute/path/input.csv --series verified-series-id --source verified-source-id --retrieved-on 2026-10-07
npm run data:derive
npm run data:validate
```

The file contains one primary series. `source_snapshot_ids` must be a nonempty JSON array; the CSV importer replaces that input reference with the newly registered immutable snapshot ID. Use a placeholder ID when preparing a local canonical-format input. The parser validates all other fields.

An import appends non-overlapping observations by default and rejects duplicate periods. For a revision, supply the **complete replacement history** and add `--replace`; this replaces the primary canonical series, preserving all old raw snapshots. Review removed periods as well as changed values. Reusing identical file bytes with the same retrieval date reuses the snapshot. Run `data:derive` immediately afterward because existing derived outputs may be stale; publication rejects stale calculations.

The proposed rows and rights are validated before mutation. Canonical and registry files use individual atomic writes; they are not a multi-file transaction. If a process is interrupted, restore those files from Git together, remove any unregistered new raw snapshot, and retry. Never edit a registered raw file.

For an isolated worked example:

```sh
npm run demo
```

The printed directory contains a sample registry, original snapshot and canonical observations. It is ignored and its synthetic data cannot be exported publicly.

## Derive measures

Add the output series definition to `registry.json` and a calculation record to `transformations.json` with `id`, `output_series_id`, `method` (`growth`, `rebase` or `spread`), `inputs` and a human-readable `convention`. A rebase also fixes `base_period`. Derived source IDs must match the complete input lineage. In this milestone, all three transforms require annual inputs with matching coverage and data class; native monthly, quarterly and event observations remain separate.

Growth and rebasing require level inputs; spreads require percent inputs and percentage-point output. Mixed observation or revision statuses are rejected for an explicit methodological decision. The tools do not invent precedence between a provisional reading, a final reconstruction and a forecast.

```sh
npm run data:derive
```

Derivations run in dependency order. Their outputs retain input snapshot references. Publication validates stored calculations against recomputed values. No implicit annual aggregation or series splicing is provided.

## Review and publish

Keep a prior canonical CSV outside tracked data when a compact change report is useful:

```sh
npm run data:diff -- --before /absolute/path/previous.csv --after data/canonical/verified-series-id.csv
npm run check
```

Review the Git diff, observation report, source terms, breaks and derivation changes. Add a release note for substantive corrections in `docs/releases.md`. The pull-request template captures the evidence and validation performed.

After merge to `main`, GitHub Actions repeats checks and deploys static output. Failed validation or build stops deployment. For a correction rollback, revert the affected canonical and registry changes together through a reviewed pull request; retain historical source snapshots where permitted.

## Register topics and chart arrangements

Add memberships to `topics.json` and panels to `presets.json`; indicators can appear in multiple topics and visualizations. Keep presentation colours outside statistical definitions. See [composition contracts](composition.md) for unit compatibility, acknowledgment and fixed indexing bases. Run `npm run check:registries`, and check chart changes with `npm run build:demo` followed by `npm run test:browser`. Production inputs remain verified real observations only.

For the same audited long GDP CSV, `--importer fso-real-growth --series real-gdp-growth` selects published real annual changes (ACPP). It does not calculate growth from nominal levels.

`--importer fso-population --series population --source fso-population-long` imports the original POP_DEC (31 December) series in persons.

### ILO unemployment

Regenerate the checksum-pinned extraction with `python3 scripts/prepare-extract.py data/extractions/ilo-unemployment.json data/extractions/originals/ilo-unemployment.xlsx ../ilo-unemployment.csv`, then import using `--importer audited-extract --series ilo-unemployment --source fso-ilo-quarterly`. Review [the source audit](source-audit/ilo-unemployment.md) before updating a vintage.
