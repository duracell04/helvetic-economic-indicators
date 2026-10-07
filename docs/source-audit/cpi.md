# Consumer price index

Verified 8 October 2026. [Exact FSO dataset](https://www.bfs.admin.ch/asset/en/su-e-05.02.66), LIK25B25, issued 1 October 2026. [OPEN-BY record](https://opendata.swiss/en/dataset/lik-dezember-2025100-detailresultate-seit-1982-warenkorbstruktur-2025-inkl-sondergliederungen-l); [FSO terms](https://www.bfs.admin.ch/bfs/en/home/bfs/bundesamt-statistik/nutzungsbedingungen.html).

Original [workbook](https://dam-api.bfs.admin.ch/hub/api/dam/assets/36878067/master) retained as `data/extractions/originals/cpi.xlsx`, SHA-256 `7019d8273a93ab1de240d378c84f7705b924fbb054541f6e33c79340d343c2a7`. Recipe `data/extractions/cpi.json` pins the workbook, `INDEX_m` total key `100_100` on row 5 and Excel month headers on row 4. Read published numeric cells without rounding. The registered immutable CSV is this explicitly documented extraction.

526 monthly observations, December 1982–September 2026, December 2025 = 100, scale 1. All are published observations; final refers to this retained vintage. The CPI basket is reweighted over time; this table restates the history on one base. Rebasing changes the numerical levels without redefining annual inflation. No older bases are spliced and no absent observations are generated. No purported homogeneous fixed basket is implied.

Tests regenerate every selected workbook cell and compare all periods, values, checksums and canonical metadata. Native monthly data appear in catalogue/downloads; annual charts keep their existing frequency restriction. Annual inflation is imported separately from `VAR_y-1`, rather than calculated from rounded index values.
