# Release notes

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
