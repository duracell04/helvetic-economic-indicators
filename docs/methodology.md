# Data contract and methodological boundaries

Registry and public manifest schema version: **2.0.0**. This version identifies the wire format, independently of the software release. Incompatible field changes require a major schema-version change and a documented migration. Additive changes require a versioned schema update and tests.

## Series and sources

The authoritative contract is `scripts/lib/schema.ts`. A series defines its meaning, native frequency, unit and scale, institutional coverage, instrument, maturity, aggregation, source identity, historical breaks, verification and data class. A separate transformation record names each derived output, its inputs and calculation convention. Topics, visualization presets and sourced annotations have independent registries. Candidate records have no verified coverage or continuity claims.

Sources record exact dataset identity and rights evidence. A snapshot records source ID, retrieval date, URL, SHA-256 and an immutable `data/raw/<snapshot-id>.csv` filename. Retain the original download's bytes. Copyright or attribution conditions stay attached to sources in the manifest.

## Canonical CSV

One file per series: `data/canonical/<series-id>.csv`. Exact column order:

```csv
series_id,reference_period,value,source_snapshot_ids,publication_date,value_kind,revision_status
```

| Field | Convention |
| --- | --- |
| `series_id` | Stable registry identity; do not reuse when definitions change |
| `reference_period` | Annual `YYYY`, quarterly `YYYY-Qn`, monthly `YYYY-MM`, or daily/event `YYYY-MM-DD` |
| `value` | Finite number in the registered unit; literal `NA` means missing |
| `source_snapshot_ids` | JSON array of snapshot IDs; CSV-quoted when necessary |
| `publication_date` | ISO calendar date, or empty when unavailable |
| `value_kind` | `observed`, `reconstructed`, or `forecast` |
| `revision_status` | `final`, `provisional`, or `revised` |

For this initial Swiss-history catalogue, annual, quarterly and monthly periods support 1800–2199. Daily/event periods use validated ISO dates. Canonical data contain the current reviewed vintage; original snapshots and Git history preserve prior versions. There is one row per series and reference period. Multiple auctions on one date require distinct identifiers/series or a later schema extension, not silent aggregation.

Percent means percentage levels: a 2% rate is stored as `2`, not `0.02`. Changes in such rates use percentage points. CSV missing values are never blank or zero; JSON missing values use `null`. Neither interpolation nor forward filling is automatic.

## Initial transformations

- **Annual growth:** `100 × (value[t] / value[t−1] − 1)`. Require the preceding calendar year and a positive denominator. Missing input produces a missing result; absent prior years produce no comparison row.
- **Rebasing:** `100 × value[t] / value[base]`. The fixed base must exist and be positive. Missing later input remains missing.
- **Spread:** aligned left yield minus right yield, both stored in percent. Output is percentage points. Keep only matched periods; no asynchronous pairing or filling. Optional explicit `exclude_periods` omits documented non-comparable annual periods; the Confederation spread excludes 2026 because its two partial-year windows differ.

Growth/rebasing require level inputs. All initial calculations require annual frequency, matching institutional coverage and matching real/synthetic class. Combined rows require equal value-kind and revision-status fields. If all input publication dates are known, the derived date is their latest date; otherwise it remains unknown. Source snapshot references are unioned and checked against registered lineage.

Unsupported annual aggregations are deliberately deferred to source-specific work: annual-average CPI levels, calendar-day administered-rate averages, auction conventions and matched trading endpoints require distinct definitions. No debt ratio, real-return or correlation calculation is implied by the foundation tooling.

## Publication

Only verified series with verified, redistributable source snapshots may have committed observations. Synthetic rows can be used in isolated development roots, but cannot enter public exports. Restricted raw files and normalized observations stay outside tracked directories.

Exports are deterministically ordered and contain no build-time clock value. The manifest includes schema version, definitions, units, coverage, observation/missing counts, observed statuses, source terms, snapshot references, filenames and content checksums. It records the actual periods present, not a claim of complete uninterrupted history.

Current readings, annual forecasts and reconstructions must remain distinguishable. The annual preview defaults through 2025; extending to 2026 exposes clearly dashed synthetic forecast examples. Published forecasts remain explicit through paths, markers and readouts. Statistical breaks belong to their affected series; event annotations need independent evidence.

## Version 2 migration

Removed required numbered `band` and embedded `derivation` fields. Added independent topics, transformation outputs/dependencies, presets and annotations. Units now declare dimension and scale; series declare measurement kind, price basis and aggregation kind. Existing series/source identities and the seven canonical observation columns remain unchanged. The manifest also carries relevant transformation records.

[Atlas composition contracts](composition.md) define compatibility, stable indexing, missing-year/break handling, browser state and annotation eligibility. Display indexing changes no canonical values and original observations remain available in synchronized readouts.
