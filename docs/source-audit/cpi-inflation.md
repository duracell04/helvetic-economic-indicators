# Annual CPI inflation

Verified 8 October 2026. The [exact FSO LIK25B25 workbook](https://www.bfs.admin.ch/asset/en/su-e-05.02.66), published 1 October 2026, is retained with the checksum described in the [CPI audit](cpi.md). FSO OPEN-BY applies with attribution.

Recipe `data/extractions/cpi-inflation.json` selects `VAR_y-1`, total `100_100`, row 5 and year headers row 4, columns 15–56. It preserves all 42 published annual-average changes for 1984–2025, including negative and zero inflation. The source publishes this measure at one decimal place; numeric cell values are retained without additional rounding.

This is the change in annual-average CPI, not December-on-December inflation. Do not recalculate it from the rounded monthly table. No value for incomplete 2026 is supplied. Later releases can revise history. The immutable registered CSV is a reproducible extraction, not an original publisher CSV.

Tests regenerate every observation from the original workbook, compare canonical rows and checksums, and reject duplicate/invalid/incompatible input. Annual inflation is selectable in the chart; catalogue detail and downloads are verified on desktop and mobile. Default production panels remain unchanged.
