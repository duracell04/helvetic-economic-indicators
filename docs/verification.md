# Interactive atlas verification

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
