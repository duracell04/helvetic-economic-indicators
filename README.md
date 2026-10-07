# Helvetic Economic Indicators

A lightweight interactive atlas for exploring Swiss economic history on one synchronized timeline. Indicators, topics, calculations and chart arrangements are independent, versioned records. Astro, TypeScript and npm; static GitHub Pages hosting; no backend or database.

**The local preview uses synthetic examples. No Swiss observations or historical coverage have been verified for publication.** The original `switzerland_macro_1946_2026.html` informed the warm colours, compact controls and synchronized inspection; its compiled observations and recession dates were not imported.

## Start the interactive demonstration

Use Node.js 24 LTS (minimum 22.12) and npm:

```sh
npm ci
npm run dev:demo
```

Open `http://localhost:4321/helvetic-economic-indicators/`. The demonstration defaults to 1946–2025 with deliberate gaps, different starting dates, reconstructions, forecasts, revised/provisional observations and illustrative annotations. Every demo page displaying observations identifies them as synthetic.

Use **Add indicator** to search by topic or name. Choose a new panel or an existing one. Each indicator has information, combine-above, separate-below and remove controls; panel arrows reorder the timeline. Compare compatible original units or explicitly choose **Index to 100** with a positive common base. The default three-panel arrangement fixes **1960 = 100**, independently of the displayed range.

Hover to inspect every panel at the same year. Click/tap to pin; Left/Right step, Home/End select endpoints, Escape releases. Pinned readouts scroll on phones. Save layouts locally or share configuration-only links. Demo and production have separate versioned browser storage.

```sh
npm run build:demo
npm run preview:demo
```

Demo inputs and output live only under ignored `.cache/`; they never replace production `public/data/` or `dist/`. If an Astro preview is already running, stop it with `npx astro preview stop` before switching preview modes.

## Production and checks

```sh
npm run check
npm run build:demo
npx playwright install chromium
npm run test:browser
npm run dev
```

`check` validates provenance and registries, runs pipeline/calculation/composition tests, checks TypeScript, builds production, and verifies Pages paths and publication isolation. Browser tests run the built demo and production artifacts at ports 4322/4323 with desktop and phone viewports. `npm run check:all` runs both check suites (install the browser first).

Production currently shows a concise availability message and candidate indicator definitions. Only verified, redistributable real observations may enter public downloads and the chart payload. Builds fetch no live economic data.

## Independent layers

| Location | Purpose |
| --- | --- |
| `data/registry/registry.json` | Series statistical identities, sources, rights and immutable snapshot references |
| `data/registry/topics.json` | Many-to-many topic memberships |
| `data/registry/transformations.json` | Calculation inputs, output, method and convention |
| `data/registry/presets.json` | Ordered panels, annual range, display indexing, annotations and presentation colours |
| `data/registry/annotations.json` | Sourced events and intervals, with verification and real/synthetic identity |
| `data/raw/` / `data/canonical/` | Permitted original source bytes / normalized observations |
| `scripts/` | Local imports, validation, calculations and deterministic exports |
| `src/atlas/` | Composition contracts, reusable D3 SVG geometry/renderer and browser controls |
| `src/pages/series/` | Catalogue and detail routes generated from metadata |
| `tests/` / `tests/browser/` | Synthetic meaningful checks / automated atlas interaction tests |

All registries and the public manifest use **schema 2.0.0**. Existing source records, series IDs and canonical CSV columns are preserved. A new sector requires a topic record, a series definition and validated observations. A new chart requires a preset record; the renderer and routing remain unchanged. See [composition contracts](docs/composition.md).

## Contributor workflow

1. Audit the exact source, definition, coverage, revision practice and redistribution evidence using [publisher templates](docs/source-audit/README.md).
2. Register the series and its topic memberships; retain native frequency.
3. Import a supplied permitted CSV; register any derived calculations separately.
4. Validate and review observation changes, breaks, terms and methodology.
5. Submit a manually prepared pull request with evidence and checks.

```sh
npm run data:import -- --file /absolute/path/input.csv --series verified-series-id --source verified-source-id --retrieved-on 2026-10-07
npm run data:derive
npm run data:validate
npm run check:registries
npm run data:export
npm run demo
```

The final `demo` command demonstrates the local importer in a separate ignored fixture directory. The [contributor guide](docs/contributing.md) explains revisions and [methodology](docs/methodology.md) defines the statistical contract. Restricted files stay outside tracked/published directories.

## Initial presets and later milestones

The default arrangement compares indexed GDP/GDP per capita/population, inflation/unemployment and policy rates. Reset returns to these three panels. A six-panel overview remains in the internal registry for future saved layouts. The toolbar has no preset selector; visitors compose their own arrangement directly.

Verified Swiss-data acquisition, native-frequency charts, additional chart types and Relationships/correlation analysis remain later milestones.

## GitHub Pages

Attach a GitHub destination and enable **Settings → Pages → GitHub Actions**. Pushes to `main` run checks including the demo browser suite, then deploy **only `dist/` production artifacts**. Pull requests validate without deploying.

The owner and repository name from `GITHUB_REPOSITORY` determine `https://<owner>.github.io/helvetic-economic-indicators/`; account sites use `/`. Optional local overrides are `SITE_URL` and `SITE_BASE` (use identical settings for build/path checks). The configuration follows [Astro's official deployment guide](https://docs.astro.build/en/guides/deploy/github/). No custom domain is configured. Hosted deployment awaits a GitHub destination.

## Licences

[MIT](LICENSE) covers the software and original documentation; datasets retain source-specific usage terms. See [DATA_LICENSES.md](DATA_LICENSES.md).
