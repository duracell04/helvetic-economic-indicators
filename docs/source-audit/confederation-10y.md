# Daily Confederation ten-year spot rate

Verified 8 October 2026. [Official SNB cube](https://data.snb.ch/en/topics/ziredev/cube/rendeiduebd), exact CHF / 10J [CSV](https://data.snb.ch/api/cube/rendeiduebd/data/csv/en?dimSel=D0(CHF),D1(10J)&fromDate=1988-01-04&toDate=2026-09-30), publishing date 1 October 2026. SNB non-commercial compatible reuse with attribution applies under [copyright terms](https://www.snb.ch/en/srv/disclaimer_copyright).

Original publisher CSV `data/extractions/originals/confederation-10y.csv`, SHA-256 `8cdf2e59966f8037d88c283cf41578fc0953e333d6d5459866e69b5da71c93f8`. The pinned recipe checks cube and both dimensions. It preserves 7,826 non-empty dated values, 4 January 1988–30 September 2026, including negative yields. Unit percent per annum, scale 1. Raw values retain published three-decimal precision; canonical numeric values use the existing schema. Missing source values are omitted rather than turned into zero or filled.

These are model-estimated zero-coupon spot rates at a constant ten-year maturity. The [SNB historical methods publication](https://www.snb.ch/public/publication/en/www-snb-ch/publications/statistical-publications/historical-time-series/2007/renditen_book/publications0_en/e_zinssaetze_u_renditen.book.pdf), table 3.2 note 1, documents Monday/month-end data through 1997. The 1998 availability boundary is recorded. Estimates are observed statistics, not forecasts; no unsupported historical reconstruction status is invented.

Do not splice average yields to maturity or the annual OECD benchmark into this measure. No annual average is derived. Exact native dates and gaps remain in catalogue/downloads; the annual-only chart restriction stays in place. Final refers to the retained published vintage, subject to later correction.

Tests regenerate every retained source value, period and checksum, reject duplicates/invalid/mismatched selections and units, and verify all public rows/downloads at desktop/mobile sizes.
