# Real GDP — candidate source audit

Reviewed 8 October 2026. **Candidate; no observations imported.**

The [official SECO GDP page](https://www.seco.admin.ch/en/gross-domestic-product) links the [unadjusted production workbook](https://www.seco.admin.ch/dam/en/sd-web/SaAbXCUZ5Fj8/qna_p_na.xlsx) for the September 2026 vintage. Inspection identifies the `real_y` sheet, annual years in column A and GDP in column C, rows 12–57 (1980–2025). Units are CHF millions, chain-linked volumes at reference-year 2020 prices. Its annual rows must not be mistaken for the quarterly sheets or sport-event-adjusted measures.

The [general federal terms](https://www.admin.ch/en/terms-and-conditions) require written consent for reproduction unless an applicable dataset-specific grant is established. No grant covering this workbook's public source snapshots and downloads was found in this audit. Public availability is insufficient evidence for the repository's redistribution gate. The workbook is not committed.

The FSO long GDP CSV imported for nominal GDP contains current-price MCHF levels and real growth percentages, not real-volume levels. Do not relabel its nominal values as real GDP or turn chain-linked growth into an invented official level. Available official historical coverage may be shorter than the chart window; leave earlier years absent when an eligible volume series is imported.

Required before import: Establish a dataset-specific redistribution grant for the annual real-volume workbook, or obtain a compatible FSO OPEN-BY real-volume dataset.

Schema 2.0.0 and the existing series ID are preserved. This audit publishes metadata and source evidence only; it does not add a snapshot, canonical observation, derived output or verified coverage claim.
