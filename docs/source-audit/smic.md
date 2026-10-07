# SMIC total-return index — candidate source audit

Reviewed 8 October 2026. **Candidate; no observations imported.**

The [official SIX SMI family page](https://www.six-group.com/en/market-data/indices/switzerland/equity/smi.html) identifies **SMIC, ISIN CH0000222130**, as the total-return variant, with base 30 June 1988 = 1500. SMIC is distinct from the SMIN net-return variant.

The [SIX licensing page](https://www.six-group.com/en/market-data/indices/licensing.html) describes historical data as restricted and licences as purpose-specific. No agreement covering this project's public chart and download use was established. SNB republication of SIX data does not remove the third-party rights requirement. Do not copy values from the synthetic HTML, secondary benchmark reports or the unfinished local equity work.

Keep native daily trading dates. Do not backfill before the index launch or treat a partial 2026 quote as a year-end close. Require an immutable original extract with exact identifiers, precision and applicable licence before promoting this series.

Required before import: Obtain an authorized SIX historical SMIC closing-level dataset and a licence covering public website display and CSV/JSON redistribution; verify trading-date closes and original historical precision.

Schema 2.0.0 and the existing series ID are preserved. This audit publishes metadata and source evidence only; it does not add a snapshot, canonical observation, derived output or verified coverage claim.
