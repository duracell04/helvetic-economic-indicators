# Release notes

## 2026-10-08 — Nominal GDP

- Added 78 annual FSO current-price GDP values for 1948–2025 in CHF millions, preserving published numeric precision and original source bytes.
- Documented the pre-1995 retropolation, marked historical values reconstructed and the 1995 methodological boundary, and left 1946–1947 and 2026 without GDP observations.
- Recorded the exact August 2026 dataset, immutable checksum, normal source-status mapping and FSO OPEN-BY attribution terms. Other GDP identities remain separate candidates.
- Added optional `--importer fso-gdp`, retaining `canonical-csv` as the default. Nominal GDP is selectable and downloadable; the existing production default layout is preserved.
- Replaced production-wide fixed observation totals with scoped dataset checks so subsequent indicator additions do not invalidate the existing yield and debt tests.
- Validation: source-row reproduction, importer rejection/atomicity and CLI compatibility checks, production GDP chart/indexing/gaps and downloads at desktop and phone sizes, plus the full `npm run check:all` suite.

## 2026-10-07 — General government gross debt / GDP

- Published 81 annual ratios for 1946–2026 in their own production panel; the default now has yields, completed-year spreads and broad gross debt.
- Kept the broad concept distinct from Maastricht debt and Confederation-only debt. Marked historical reconstruction and the 1988/1990 source-vintage boundaries; 2025 is provisional and 2026 is an IMF forecast with a dashed connector.
- Retained three checked CSV extractions: JST R6 fractional ratios, official IMF DataMapper readings and the cited two-decimal WEO transcription. Documented attribution and non-commercial/share-alike terms on the downloads page and in the manifest.
- Confirmed the Guex & Guex supplementary table is downloadable; its earlier reconstruction is reserved for a separately audited extension rather than silently merged into this composite.
- Validation: production data, registry and reproducibility checks, Astro/TypeScript, static build/link checks, isolated demo and all 14 desktop/mobile browser checks passed. The production artifact has 255 data points in four datasets and no synthetic observations. The pending equity preparation remains outside this commit.

## 2026-10-07 — First verified data: Confederation yields

- Added the supplied 1946–2026 annual long-yield history and 1980–2026 GMBF history, retaining three decimals, publisher terms and four immutable source snapshots.
- Identified 1946–1954 as the historical yield-by-maturity proxy; marked the 1955 change to the OECD benchmark and preserved the separate daily spot-rate candidate.
- Added the 10Y − 3M spread for matched completed years 1980–2025. Added optional explicit spread-period exclusions so unequal 2026 Jan–Aug / Jan–Sep averages cannot produce a misleading spread.
- Made financing yields and their spread the production default. Year inspection displays source-convention notes and both 2026 averaging windows; partial-year points are provisional observations, not forecasts. The synthetic local demonstration retains its original layout.
- Checked every OECD completed-year value against the source table and reproduced all 2007–2026 GMBF averages from SNB EG3M. Added source audit and reproducibility tests.
- Validation: 21 data/calculation/composition tests, zero TypeScript/Astro diagnostics, 31 production pages and 442 internal links, isolated demo build and all 14 desktop/mobile browser checks passed. Production contains 174 verified observations and no synthetic series.

## 0.2.0 — Interactive atlas

- Simplified the toolbar: removed preset selection and made the original three-panel arrangement the default and Reset destination. Internal preset records and saved/shared layouts remain supported.

- Replaced the portal homepage with synchronized configurable annual SVG charts inspired by the original HTML.
- Migrated registries/manifest to schema 2.0.0 with independent topics, transformations, presets and statistical metadata.
- Added indicator selection, overlay/separation/reordering, explicit fixed-base indexing, ranges, context and synchronized inspection.
- Added demo-only deterministic observations, status/gap/break styling, sourced-annotation contracts and isolated share/save state.
- Added extensibility, desktop/mobile interaction and publication-isolation checks; Pages deploys only checked production artifacts.

No Swiss observations or historical reference claims are verified in this release. The production shell is deployed at https://duracell04.github.io/helvetic-economic-indicators/ through GitHub Actions; synthetic preview observations are excluded.

## 0.1.0 — Foundation

- Established source and series contracts, immutable snapshots, canonical CSV and deterministic public exports.
- Added annual growth, rebasing and aligned spread calculations with validation.
- Added 18 candidate series in six planned analytical bands, with publisher audit templates.
- Added the static catalogue, methodology and download shell and GitHub Pages workflows.

No real observations, verified historical coverage, chart findings or unrestricted dataset licence are claimed.

## 8 October 2026 — real GDP growth

Add 77 published FSO real annual changes, 1949–2025, in a separate indicator commit. [Audit](source-audit/real-gdp-growth.md).

## 8 October 2026 — population

Add 165 published year-end counts, 1861–2025, preserving reconstructed census history and register transitions. [Audit](source-audit/population.md).

## 8 October 2026 — ILO unemployment

Add 85 published quarterly survey unemployment rates, preserving Q2-only historical coverage and survey transitions. [Audit](source-audit/ilo-unemployment.md).

## 8 October 2026 — Consumer price index

Add 526 monthly total CPI levels on the December 2025 base, preserving published precision and frequency. [Audit](source-audit/cpi.md).

## 8 October 2026 — Annual CPI inflation

Add 42 published complete-year annual-average CPI inflation rates, 1984–2025, as a separate indicator. [Audit](source-audit/cpi-inflation.md).

## 8 October 2026 — SNB policy rate

Add 12 SNB policy-rate effective-change events, with the exact daily source retained and earlier instruments kept separate. [Audit](source-audit/snb-policy-rate.md).

## 8 October 2026 — Annual SNB policy rate

Add six explicitly calculated complete-year calendar-day-weighted policy-rate averages, 2020–2025; omit partial 2019 and 2026. [Audit](source-audit/snb-policy-rate-annual.md).

## 8 October 2026 — Historical SNB Libor target range — lower bound

Add 26 historical lower Libor target-bound events, preserving the separate instrument identity. [Audit](source-audit/snb-libor-target-lower.md).

## 8 October 2026 — Historical SNB Libor target range — upper bound

Add 28 historical upper Libor target-bound events, preserving the separate instrument identity. [Audit](source-audit/snb-libor-target-upper.md).

## 8 October 2026 — Ten-year Confederation spot rate

Add 7,826 native-date ten-year Confederation spot-rate estimates, preserving historical sampling gaps and the 1998 availability boundary. [Audit](source-audit/confederation-10y.md).

## 8 October 2026 — Historical SNB discount rate — year end

Add 92 published year-end historical discount-rate readings, 1907–1998, in a separate instrument series. [Audit](source-audit/snb-discount-rate.md).

## 8 October 2026 — Historical SNB Lombard rate — year end

Add 99 published year-end historical Lombard readings, 1907–2005, with 1989 and 2004 instrument annotations. Keep historical instruments separate. [Audit](source-audit/snb-lombard-rate.md).

## 8 October 2026 — Real GDP source audit

Remains candidate: Establish a dataset-specific redistribution grant for the annual real-volume workbook, or obtain a compatible FSO OPEN-BY real-volume dataset. [Audit](source-audit/real-gdp.md).

## 8 October 2026 — Real GDP per capita source audit

Remains candidate: Resolve the real-GDP source reuse grant and verify a compatible published annual-average population denominator, or obtain an official real-GDP-per-capita series with documented methodology and permission. [Audit](source-audit/real-gdp-per-capita.md).

## 8 October 2026 — Registered unemployment source audit

Remains candidate: Obtain an auditable national SECO/FSO monthly rate export, its denominator and method history, and a dataset-specific public redistribution grant. [Audit](source-audit/registered-unemployment.md).
