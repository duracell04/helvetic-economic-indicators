# ILO unemployment rate

Verified 8 October 2026. [FSO workbook](https://dam-api.bfs.admin.ch/hub/api/dam/assets/36710104/master), table T03.03.01.14, published 18 August 2026. [Exact OPEN-BY catalogue record](https://opendata.swiss/en/dataset/erwerbslosenquote-gemass-ilo-nach-geschlecht-nationalitat-und-anderen-merkmalen12) and [FSO terms](https://www.bfs.admin.ch/bfs/en/home/bfs/bundesamt-statistik/nutzungsbedingungen.html).

The original XLSX is retained in `data/extractions/originals/ilo-unemployment.xlsx`. Its SHA-256 is `a2f571a26b71b62d7b3cb3d9ffd191ba1fa00f0b8110b1384106cbe8845ec876`. The extraction recipe pins it and the `Trimestriel` sheet, total row 8, periods on row 5. Values are read from published numeric cells with no rounding. The registered immutable CSV snapshot is this checked extraction, not an original publisher CSV.

85 rates: Q2 only for 1991–2009, then all quarters 2010-Q1–2026-Q2. Units are percent, scale 1. No missing quarters are generated. Survey estimates are observed, with final meaning the retained published vintage; history can be revised.

Workbook footnotes exclude diplomats/international officials after 2008. The [FSO comparison table](https://dam-api.bfs.admin.ch/hub/api/dam/assets/36346864/master) documents the 2017 weighting revision affecting 2009/2010 and the 2021 SLFS change. Keep these boundaries and the 2010 move to a continuous quarterly survey. ILO and SECO registered unemployment are distinct concepts.

Tests regenerate every cell from the retained XLSX and compare every extracted/canonical value, period and checksum. Identity, bounds, duplicate-period, invalid-value and incompatible-unit checks reject bad imports. Quarterly data remain in catalogue/downloads; annual-only charts keep their frequency restriction.

## Annual selection added on 8 October 2026

The retained workbook also contains published annual means in `Annuel`, 2010–2025. These are now imported under the separate `ilo-unemployment-annual` identity and are available in the annual chart picker. The original quarterly selection and this historical verification record remain unchanged. See [annual source evidence](ilo-unemployment-annual.md).
