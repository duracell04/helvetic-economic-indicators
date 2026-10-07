# General government gross debt / GDP — 7 October 2026

Published composite: 81 annual ratios, 1946–2026, in percent of nominal GDP. This is broad gross debt, not Maastricht debt or Confederation-only debt. All supplied values were checked against the downloaded sources. No interpolation or missing-value filling is applied.

## Sources and reproduction

- [JST Release 6](https://www.macrohistory.net/database/), `JSTdatasetR6.xlsx`, `Sheet1`, `iso=CHE`, `debtgdp`, 1946–1989. The retained CSV is an extracted Swiss slice of the workbook, preserving its full fractional precision. Multiply by 100 and round to one decimal to reproduce the supplied historical values. Original workbook SHA-256: `c1bb91fe56ea50d4f27af5c0fc897d481e89ae38ce41eaecab62134c9354981d`.
- [IMF DataMapper](https://www.imf.org/external/datamapper/GGXWDG_NGDP@WEO/CHE), April 2026 WEO, `GGXWDG_NGDP`, Switzerland. The retained CSV extracts 1990–2026 from the official [API](https://www.imf.org/external/datamapper/api/v1/GGXWDG_NGDP/CHE). Its one-decimal values independently verify every modern observation within 0.050000001 percentage points. Original JSON SHA-256: `ee29ce0c80bcfda6875be68930b6b6d31c9b67d1834aa5c4e9aebec13a3cefd3`.
- [ecolod's April 2026 WEO table](https://en.ecolod.org/country/CHE/gov-debt-gdp.html), via ecodb.net. The retained CSV extracts all 37 year/value/status rows. This is the source of the supplied two-decimal precision, which DataMapper does not expose. The table labels 1990–2025 Actual and 2026 Forecast. Original HTML SHA-256: `0b81f27ee4e84a43402e5f75a67930c13b03e81603433ff63af59e7a8ad864b0`.

The three extracted CSV snapshots are explicitly extractions, not original publisher CSV downloads. Registry records retain exact source URLs, retrieval date and immutable CSV checksums. Builds use these committed snapshots, with no live economic-data queries. `tests/debt.test.ts` checks source precision, coverage, lineage, statuses and chart segmentation.

## Definition changes and statuses

[JST documentation, pages 176–177](https://sfff5b3ac9317c4be.jimcontent.com/download/version/1676279836/module/9834516169/name/JST_documentationR6.pdf) identifies the 1946–1987 numerator as HSSO U.45, *Totale Schulden*, divided by JST historical GDP. Those compiled historical ratios are marked reconstructed. In 1988–1989, JST uses its IMF WEO vintage. The current April 2026 WEO history starts in 1990; the vintage and precision change is another explicit break.

The chart leaves a break at both 1988 and 1990. Historical aggregation and modern IMF liability/coverage/consolidation conventions are not asserted to be identical. The 1989–1990 movement must not be interpreted as pure economic change without examining the source-vintage boundary. The Maastricht series is never used in the composite.

2025 is observed/provisional: the latest completed-year WEO reading may still be estimated or revised. 2026 is forecast/provisional, not an annual observation or a current reading. Its value is 38.50% of GDP and its connector is dashed. Earlier rows are final in the retained vintage; this does not prohibit later source revisions. Exact observation publication dates are left unknown rather than substituting retrieval dates.

JST warns that before 1946 its Swiss debt covers central government only, so no pre-1946 JST points are included. The [Guex & Guex article](https://link.springer.com/article/10.1186/s41937-017-0007-6) and its downloadable ZIP supplement were found. Table SA.1 contains a separately constructed 1894–2014 aggregation with its own interpolation and internal-debt conventions. It is not silently spliced into this composite; an earlier extension needs its own audit and identity.

## Attribution and reuse

[JST's terms](https://www.macrohistory.net/database/licence-terms/) permit non-commercial sharing under CC BY-NC-SA 4.0 with the prescribed Jordà, Schularick and Taylor (2017) citation. The full citation and extraction/conversion/rounding disclosure appear in the registry, manifest and downloads page. The historical component and its adaptations retain those terms; distribute the combined file for non-commercial purposes under CC BY-NC-SA 4.0, preserving all source attributions.

[IMF statistical-data terms](https://www.imf.org/en/about/copyright-and-terms) permit accurate extraction, transformation and redistribution with IMF attribution and disclosure of changes. This atlas is non-commercial; potential commercial reuse requires contacting the IMF. The ecolod table declares [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); both its attribution and underlying IMF terms are retained. These dataset terms are separate from the MIT software licence. Downstream users receive the conditions on the downloads page and in the manifest.
