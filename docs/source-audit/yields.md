# Confederation yields — audit of 7 October 2026

The first real-data addition preserves the supplied three-decimal observations: 81 long-yield points (1946–2026), 47 GMBF points (1980–2026) and 46 derived spread points (1980–2025). All yields are percent per annum; spreads are percentage points. The two 2026 inputs are explicitly partial-year and excluded from the spread. Build and export commands use committed source snapshots and make no live economic-data requests.

## Exact sources and snapshots

| Registry source | Evidence | Retained CSV |
| --- | --- | --- |
| `snb-historical-yields` | [SNB, Interest rates and yields (November 2007)](https://www.snb.ch/public/publication/en/www-snb-ch/publications/statistical-publications/historical-time-series/2007/renditen_book/publications0_en/e_zinssaetze_u_renditen.book.pdf), table 3.1 column 2 (printed page 35) and table 2.1 column 1 (page 30) | Checked transcription: 1946–1954 yield-by-maturity and 1980–2006 GMBF table cells. This is an extracted table, not an original publisher CSV. |
| `oecd-swiss-10y-annual` | [OECD/FRED IRLTLT01CHA156N](https://fred.stlouisfed.org/data/IRLTLT01CHA156N), annual, percent, not seasonally adjusted | HTML table extracted to CSV, preserving all published numeric precision, 1955–2025. |
| `oecd-swiss-10y-monthly` | [OECD/FRED IRLTLT01CHM156N](https://fred.stlouisfed.org/data/IRLTLT01CHM156N), monthly, percent, not seasonally adjusted | HTML table extracted to CSV for Jan–Aug 2026. Eight observations: 0.270, 0.250, 0.400, 0.450, 0.440, 0.310, 0.480, 0.470. Mean 0.38375 → 0.384. |
| `snb-eg3m-monthly` | [SNB Money market rates](https://data.snb.ch/en/topics/ziredev/cube/zimoma), `EPB@SNB.zimoma{EG3M}` | Original downloaded CSV bytes, Jan 2007–Sep 2026. Source `PublishingDate`: 2026-10-01 14:30. |

Every snapshot has a SHA-256 checksum, retrieval date, exact source URL and immutable path in `registry.json`. FRED downloads were extracted from their public HTML tables because the graph CSV endpoint was unavailable. The SNB historical cells were checked against the printed table. The submitted table is retained numerically in the canonical yields; publisher precision remains available in the source snapshots.

## Definitions, averaging and precision

The 1946–1954 values are a long-term Confederation bond yield-by-maturity proxy. They do not measure a constant-maturity ten-year spot rate. To retain the requested historical extension, these rows are explicitly marked reconstructed and the title, definition, maturity, usage note and 1955 break identify the proxy. The source observations themselves were observed bond yields. This annual composite does not verify or replace the separate daily SNB spot-rate candidate.

From 1955, the source is the OECD ten-year government benchmark, including its own historical benchmark conventions. Do not infer that all pre-modern OECD observations are fitted SNB spot rates. Every supplied completed-year value is within 0.0005000001 percentage points of the published annual value, allowing for the source's ten-place decimal representation of half-way rounding cases. Canonical values preserve the submitted three decimals, including 2.983 in 1955 and 1.031 in 2023.

GMBF 1980–2006 comes directly from SNB table 2.1. Its footnote defines averages of month-end readings: yield at issue before 1990, auction yield since 1990, using the last issue/auction of a month. For 2007–2025, an unweighted mean of all twelve EG3M month-end readings reproduces every supplied value at three decimals. For 2026, nine readings produce −0.066111… → −0.066. No pre-1980 value is supplied or filled with zero. The actual 2009 zero remains a numeric observation.

2026 is observed/provisional, not a forecast. Long yield covers Jan–Aug (8 months); GMBF covers Jan–Sep (9 months). The chart title, per-series metadata, hollow markers and year-inspection notes identify those windows. No daily current-yield point is imported into the annual chart. Publication dates are left null where the exact release date of an annual observation was not established; retrieval date is not substituted for publication date.

## Spread

`confederation-10y-minus-gmbf-3m` is derived from the two stored annual yields. Its calculation registry explicitly excludes 2026 to prevent subtracting averages with unequal windows. It begins in 1980 and ends in 2025, retains both input snapshot lineages and subtracts the supplied rounded inputs without further display precision assumptions. Re-running `data:derive` is deterministic; stale derived observations fail validation.

Negative annual-average spreads occur in 1980–1981, 1989–1993 and 2023–2024. The supplied commentary omitted 1980 (4.763 − 5.171 = −0.408 pp). Annual averages do not establish every intrayear inversion episode or its duration. No recession annotations are inferred from these values.

## Rights and vintage

SNB's 2007 publication permits reproduction and publication of its figures with source attribution (printed copyright page 2). [OECD terms, section 3](https://www.oecd.org/en/about/terms-conditions.html), permit data reuse and distribution with citation and require downstream acknowledgment, subject to underlying source restrictions. The selected OECD/FRED tables display no additional restriction. [SNB portal guidance](https://data.snb.ch/en/topics/texts/doc/introduction) permits non-commercial use compatible with the data purpose, with attribution. The atlas is an educational, non-commercial use; commercial redistribution of the monthly SNB inputs or dependent results may require SNB consent. The data do not inherit the MIT software licence.

The historical book is a fixed 2007 vintage. FRED annual/monthly histories and SNB EG3M may be revised. A future revision must retain prior snapshots, replace the affected complete canonical history, rerun calculations and review changes. No claim is made that the 2026 partial observations are final.
