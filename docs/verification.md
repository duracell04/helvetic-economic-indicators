# Interactive atlas verification

## Broad government gross debt addition — 7 October 2026

`npm run check`, the isolated demo build and all 14 desktop/mobile browser cases passed. Production has 255 data points in four datasets, 31 pages and 446 checked internal links. Source-specific checks reproduce the historical percent conversion and submitted rounding, compare the two-decimal modern transcription against official IMF readings, preserve provenance and reject inclusion of JST's earlier central-government history.

Chart checks confirm the debt ratio has its own panel, source breaks at 1988/1990 and a dashed 2025–2026 forecast connector. Year inspection identifies 2026 as forecast/provisional, while yields remain partial-year observed/provisional and the spread has no 2026 value. Definition information distinguishes Maastricht debt; downloads communicate dataset attribution and reuse terms. A resize check waits for the replacement overlay before reading its coordinates.

## Foundation verification

Verified locally on 7 October 2026 using Node 24.

| Check | Result |
| --- | --- |
| Clean source installation with `npm ci --offline` | Passed; 291 packages installed |
| Complete `npm run check` | Passed in source repository and clean source copy |
| Statistical and composition registries | Schema 2.0.0; 26 candidate real definitions; 6 topics; 2 presets |
| Pipeline, calculations, compatibility and state tests | 18 passed |
| Automated desktop and phone browser interactions | 14 passed |
| Astro and tooling TypeScript | Zero errors, warnings or hints |
| Production / isolated demo builds | 30 / 43 static pages |
| Production Pages-subpath checks | 417 internal links, assets and data references passed |
| Clean-copy exports | Manifest and atlas payload byte-identical to source build |
| Production isolation | Zero observations; no synthetic series; demo artifacts remain outside `dist/` |
| Metadata extensibility | Synthetic energy topic, indicator and preset validate/render without core changes |
| Browser console during visual review | No warnings or errors observed |
| Responsive review | Desktop 1280px and phone 390px; readable axes and no horizontal page overflow |
| Interactive evidence | Desktop, full phone layout and pinned phone readout saved beside the repository |

Browser tests exercise add/remove, overlays, explicit indexing, positive/nonmissing bases, separation, reordering, range changes, resets, convention acknowledgment and cancellation. They also cover synchronized hover, indexed/original readouts, unavailable years, pinned selections, Home/End/arrows/Escape, annotation and raw-value toggles, forecast/break markers, resize handling, saved/share restoration, invalid-state recovery and demo/production storage isolation on the same origin.

Synthetic observations are deterministic development examples with differing starts and explicit gaps. Reconstruction/forecast kind and final/provisional/revised status remain independent. The original HTML's observations, spliced historical policy series and recession intervals were not imported. Public data remain subject to verified provenance, immutable checksums and confirmed redistribution terms.

Production export checksums:

- `manifest.json`: `c619b33ffef6f251310c7f4ddd7534d6e111e7f58d09c7cc03cef66d3db5b321`
- `atlas.json`: `4ee92755b1d970c6d12b5da29c3b0942bf4476d6c0d4e27032af83c4720c9ef7`

Published to the existing public [GitHub repository](https://github.com/duracell04/helvetic-economic-indicators) on 7 October 2026, preserving its initial commit and `.gitattributes`. For source commit `b7a6d2b8bf6e9f6ca6833641a6d1e5626de4e7f4`, [repository validation](https://github.com/duracell04/helvetic-economic-indicators/actions/runs/37686245940) and [Pages deployment](https://github.com/duracell04/helvetic-economic-indicators/actions/runs/37686245925) both passed, including production checks and the demo browser suite. The live homepage and atlas payload returned successfully from [GitHub Pages](https://duracell04.github.io/helvetic-economic-indicators/); the payload reports production mode, 26 candidate definitions and zero observations. The workflows upload only production `dist/`. Verified Swiss-data acquisition remains later work.

Toolbar refinement: removed the preset dropdown; the original three-panel arrangement is now the default and Reset destination. Re-ran 18 unit/pipeline checks, 14 desktop/mobile browser cases, TypeScript, both builds and Pages-path/publication checks successfully. The clean-source installation and comparison above preceded this UI refinement.

## First yield data addition — 7 October 2026

Re-ran `npm run check`, `npm run build:demo` and `npm run test:browser` after adding verified yields. All 21 unit/data/calculation tests and 14 desktop/mobile browser cases passed; Astro/TypeScript reported zero errors, warnings or hints. Production has 31 static pages, 442 checked internal references, 27 real series definitions and 174 observations in three published datasets. Four immutable source snapshots retain source data, dates, exact URLs and SHA-256 hashes; the historical and FRED table snapshots are documented CSV extractions, while EG3M retains original downloaded bytes.

Browser checks verify the real yields and spread render by default, both 2026 partial-year windows appear during inspection, the 1946 proxy is identified, the 2026 spread is absent, charts fit desktop/phone screens, and synthetic saved layouts cannot enter production. The demo still defaults to three original macro panels and stays isolated. Source-specific tests reproduce the annual GMBF means from all monthly inputs, check OECD values against their preserved precision, and verify missing pre-1980 GMBF observations remain absent.

Source matching also identifies 1980 as a negative annual-average spread (−0.408 pp), alongside 1981, 1989–1993 and 2023–2024. No recession or intrayear-duration claim is inferred.

Current production checksums:

- `manifest.json`: `dcd85fba1af4cd844e18633a602183efea75290b02f20fb4e85af5fcf7b945e2`
- `atlas.json`: `303187beb3b10ef1e9693d84d68579d419d6ce87828f2282090d5190f13d31d6`

## Swiss Economic Atlas migration preparation — 8 October 2026

Prepared from `main` commit `48b78824864f13921d189951a33d01d503534be2` in an isolated checkout. Earlier data pull requests had already been merged before this migration began. No data, source attribution, licence, statistical identifier or browser-storage key was changed.

With `GITHUB_REPOSITORY=duracell04/swiss-economic-atlas`, a clean `npm ci` installation and `npm run check:all` passed using Node 24: 58 unit/data/configuration cases, zero Astro/TypeScript diagnostics, 35 production pages, 555 internal references and 22 desktop/mobile browser cases. Production contains 9,317 permitted observations and no synthetic definitions. The isolated demo remains outside production `dist/`.

Configuration tests cover both repository names, account-site roots, local defaults and explicit site/base overrides. Browser checks cover the new branding, navigation, existing `hei-atlas-production-v2` saved layouts, shared-layout restoration and phone overflow. The same repository-derived configuration allows the prepared commit to validate under the former name before the GitHub rename and subsequent deployment at `/swiss-economic-atlas/`.

Historical verification entries above describe their original release state and URLs. The new project website is https://duracell04.github.io/swiss-economic-atlas/; GitHub redirects renamed repository links, but the former Pages website address does not redirect.

The live migration completed successfully for implementation commit `a96ba4167fd4c83bab9639934db1e2515f0934f8`: [repository validation](https://github.com/duracell04/swiss-economic-atlas/actions/runs/37706158088), [deployment before renaming](https://github.com/duracell04/swiss-economic-atlas/actions/runs/37706158103) and [deployment at the new Pages path](https://github.com/duracell04/swiss-economic-atlas/actions/runs/37706368090) passed. Repository ID `1409369245`, history, branches and Pages settings were preserved; all three known checkout remotes were updated without changing their working state. Pages uses GitHub Actions from `main` with HTTPS enforced.

Live verification checked 74 page/asset/download URLs, 17 published datasets and byte-identical atlas, manifest and dataset exports. Desktop and phone checks passed for navigation, chart composition and inspection, forecast/provisional/reconstruction labels, saved layouts and shared fragments captured from the former URL, and new shared URLs. There were no browser errors, failed requests or horizontal overflow.

## Original-unit controls simplification — 8 October 2026

Removed display indexing and optional original-value chart labels. All 59 unit/data/configuration cases and 24 desktop/mobile browser cases passed, with zero Astro/TypeScript errors or warnings. Production still has 35 pages, 555 checked internal references and 9,317 permitted observations. Statistical source records, canonical data and downloadable observations are unchanged.

Checks verify that scale/base selectors and optional value labels are absent, chart geometry retains original values, incompatible quantities cannot share an axis, and former indexed saved/shared layouts migrate without losing indicators or colliding with existing panel IDs. The demo now has separate original-unit GDP, GDP-per-capita and population panels; the three-panel production default is preserved.

Live navigation exposed a zero-width resize callback while the atlas is hidden. The observer now waits for a drawable plot area. A desktop/phone regression reproduces the earlier invalid SVG widths when panels are hidden and verifies error-free rendering after they become visible again.

## Compact atlas feedback — 8 October 2026

Removed the axes-fit note and separate year-inspection row. Chart hover/tap inspection, pinning, keyboard year selection and readout dismissal remain available. Update messages now appear as small bottom-right status toasts, fade after two seconds and clear automatically; repeated actions replace the message and restart its duration without shifting the panels.

All 59 unit/data/configuration cases and 26 desktop/mobile browser cases passed. Browser checks cover toast placement, expiry, replacement, stable panel position and retained keyboard/touch inspection. Astro/TypeScript reported zero errors or warnings, and production safeguards still verify 9,317 permitted observations with no synthetic series.

## Empty workspace and independent chart years — 8 October 2026

New workspaces and Reset show only an Add indicator card. A compact next-indicator card stays below existing charts. The picker defaults to the full nonmissing annual data range for the chosen chart; shortening or editing that chart leaves other chart windows unchanged. One-year windows are supported. Existing saved/shared layouts retain their arrangements and inherit their former shared years into individual panels.

All 61 unit/data/configuration cases and 28 desktop/mobile browser cases passed, with zero Astro/TypeScript errors or warnings. Tests cover the first addition, the next-card position, invalid years, automatic full ranges, independent edits, one-year rendering, last-chart removal with a pinned readout, Reset, saved/shared restoration and legacy migration. Production still contains 35 pages, 555 checked internal references and 9,317 verified permitted observations; economic source records and downloads are unchanged.
