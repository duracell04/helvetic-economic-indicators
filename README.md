# Swiss Economic Atlas

A lightweight interactive atlas for exploring Swiss economic history with independent chart ranges and synchronized year inspection. Indicators, topics, calculations and chart arrangements are independent, versioned records. Astro, TypeScript and npm; static GitHub Pages hosting; no backend or database.

**Production publishes verified nominal GDP, Confederation yields, the 10Y − 3M spread and general government gross debt / GDP.** The long yield includes a labeled historical proxy for 1946–1954; 2026 yields are partial-year observations with different month coverage and no derived spread. Broad gross debt covers 1946–2026, with explicit source breaks and a 2026 IMF forecast; it is not the Maastricht ratio. See the [yield audit](docs/source-audit/yields.md) and [debt audit](docs/source-audit/debt.md). Nominal GDP covers 1948–2025 in current CHF millions, with pre-1995 reconstructions identified; see the [GDP audit](docs/source-audit/gdp.md). The local demonstration remains synthetic. The original `switzerland_macro_1946_2026.html` informed the warm colours, compact controls and synchronized inspection; its compiled observations and recession dates were not imported.

## Start the interactive demonstration

Use Node.js 24 LTS (minimum 22.12) and npm:

```sh
npm ci
npm run dev:demo
```

Open `http://localhost:4321/swiss-economic-atlas/`. New workspaces start empty. The demonstration includes deliberate gaps, different starting dates, reconstructions, forecasts, revised/provisional observations and illustrative annotations. Every demo page displaying observations identifies them as synthetic.

Use **Add indicator** in the empty card to search by topic or name. The picker selects the full available annual range for the chosen indicator; shorten it before adding if desired. Each chart has its own editable years, and a new Add indicator card remains below the charts. Choose a new panel or an existing compatible one. Each indicator has information, combine-above, separate-below and remove controls; panel arrows reorder the workspace. Charts always use original units. Indicators with different units stay in separate panels; compatible units can share a panel. Reset clears the workspace.

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

Production starts with government financing yields, their spread and broad public debt: verified annual additions available through **Add indicator**, plus native-frequency datasets in the catalogue and downloads. Other indicator definitions remain candidates. Only verified, redistributable real data may enter public downloads and the chart payload. Forecast and reconstructed points retain their explicit statuses. Builds fetch no live economic data. Historical debt data and adaptations use CC BY-NC-SA 4.0; modern debt data retain IMF and ecolod terms. These data do not inherit the MIT software licence.

## Independent layers

| Location | Purpose |
| --- | --- |
| `data/registry/registry.json` | Series statistical identities, sources, rights and immutable snapshot references |
| `data/registry/topics.json` | Many-to-many topic memberships |
| `data/registry/transformations.json` | Calculation inputs, output, method and convention |
| `data/registry/presets.json` | Reusable panel arrangements, annual ranges, annotations and presentation colours |
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

The production default arrangement shows government yields, their spread and broad government gross debt / GDP in three separate panels. Add nominal GDP through **Add indicator**; its native display uses CHF millions, and its verified positive 1960 value supports explicit indexing. Reset returns to this arrangement. The local synthetic demonstration uses separate original-unit panels for GDP, GDP per capita and population, followed by macro stability and monetary policy. The previous financing arrangement, original reference and six-panel overview remain in the registry for saved layouts and later data additions. The toolbar has no preset selector; visitors compose their own arrangement directly.

Further verified Swiss-data acquisition, native-frequency charts, additional chart types and Relationships/correlation analysis remain later milestones.

## GitHub Pages

The repository is hosted at [duracell04/swiss-economic-atlas](https://github.com/duracell04/swiss-economic-atlas), with **Settings → Pages → GitHub Actions** enabled. Pushes to `main` run checks including the demo browser suite, then deploy **only `dist/` production artifacts**. Pull requests validate without deploying.

The owner and repository name from `GITHUB_REPOSITORY` determine `https://<owner>.github.io/swiss-economic-atlas/`; account sites use `/`. Optional local overrides are `SITE_URL` and `SITE_BASE` (use identical settings for build/path checks). The configuration follows [Astro's official deployment guide](https://docs.astro.build/en/guides/deploy/github/). No custom domain is configured. The repository was renamed from `helvetic-economic-indicators`; GitHub redirects repository links, but the old Pages website address does not redirect. Update bookmarks and shared URLs to `/swiss-economic-atlas/`, retaining any `#chart=` fragment. The [production website](https://duracell04.github.io/swiss-economic-atlas/) publishes committed, validated observations; the synthetic demonstration remains a local preview.

## Licences

[MIT](LICENSE) covers the software and original documentation; datasets retain source-specific usage terms. See [DATA_LICENSES.md](DATA_LICENSES.md).

Published real GDP growth (1949–2025) is selectable with historical reconstruction and the 1995 methodology boundary.

Population is available for 1861–2025 as published year-end counts in persons.
