# Nominal GDP: verified FSO source audit

This addition publishes only `nominal-gdp`. Real GDP, real growth and per-capita measures retain their separate identities and will be audited in separate additions.

## Exact source and reproduction

- Publisher: Federal Statistical Office, National Accounts.
- Dataset: [Gross domestic product, long time series](https://www.bfs.admin.ch/asset/en/ts-x-04.02.01.08), identifier `ts-x-04.02.01.08`, published **25 August 2026**.
- Original [CSV asset 36813569](https://dam-api.bfs.admin.ch/hub/api/dam/assets/36813569/master), retrieved **7 October 2026**. Source and terms review completed **8 October 2026**.
- [Publisher appendix](https://dam-api.bfs.admin.ch/hub/api/dam/assets/36813569/appendix?width=1080&height=1920) defines the units and observation flags.
- Retained snapshot: `data/raw/fso-gdp-long-series-2026-10-07-16c49f1313335a64.csv`, 10,406 original bytes, including the UTF-8 BOM and CRLF line endings.
- SHA-256: `16c49f1313335a64a82dd01b00381633ab9edc2f3db72fb7c2b9487c2bbde042`.
- The file contains 234 rows. Select exactly the 78 rows with `VARIABLE=B1GQ` and `UNIT_MEAS=MCHF`; exclude `AC` (nominal growth) and `ACPP` (real growth).

The publisher page's displayed period is 1995–2025, while its description and original CSV include 1948 onward. Coverage is established from the retained CSV, with the publisher's historical warning preserved.

## Statistical definition and history

Calendar-year Swiss domestic GDP at current prices, in **CHF millions** (`currency`, dimension `CHF`, scale `1000000`, aggregation `sum`). Store the published numeric precision without display rounding or currency conversion. Chart indexing is a presentation transform; canonical values remain original levels.

The 78 selected periods are 1948–2025. There are no observations for 1946–1947 or 2026, and this addition contains no forecasts. Examples in source units:

| Year | GDP, CHF millions |
| --- | ---: |
| 1948 | 23033.5678702284 |
| 1960 | 45736.6860419998 |
| 1995 | 423515.355497934 |
| 2025 | 881571.800580975 |

FSO explicitly describes pre-1995 values as retropolated using evolution rates from older accounting systems (OECD 1952, ESA 1979, ESA 1995). Mark **1948–1994 as reconstructed** and **1995–2025 as observed**, with a documented boundary at 1995. The publisher does not guarantee conceptual and methodological consistency throughout the whole long series.

All selected rows carry source flag `A`, meaning normal. Map this to `revision_status=final` for this retained publication vintage, with `publication_date=2026-08-25`. This mapping does not claim that the historical values will never be revised. The importer rejects other status flags instead of silently replacing their meaning. A new vintage requires a new source audit/snapshot and a complete reviewed replacement import.

## Redistribution

The exact dataset links to **OPEN-BY**. The [FSO terms](https://www.bfs.admin.ch/bfs/en/home/bfs/bundesamt-statistik/nutzungsbedingungen.html) specify open use with source attribution. Keep the FSO attribution and the reconstruction caveat with reused data. These terms cover this GDP dataset; the broad FSO registry record remains a candidate for other unaudited datasets.

Attribution: Federal Statistical Office (2026), *Gross domestic product, long time series*, ts-x-04.02.01.08, CSV asset 36813569, published 25 August 2026, accessed 7 October 2026. Dataset terms are independent of the software MIT licence.

## Import and checks

```sh
npm run data:import -- --importer fso-gdp --file /absolute/path/fso-gdp-long-series.csv --series nominal-gdp --source fso-gdp-long-series --retrieved-on 2026-10-07
npm run data:derive
npm run check:all
```

`fso-gdp` implements the existing `Importer` interface and stores the original supplied bytes unchanged. Its selection requires the audited source URL and nominal GDP's annual frequency, price basis and unit scale. Checks independently compare every canonical observation with the selected original CSV rows, verify the checksum and historical labels, reject malformed values/duplicate periods/incompatible selections, and exercise the production chart and downloads at desktop and phone sizes.
