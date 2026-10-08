# Confederation gross debt — candidate source audit

Reviewed 8 October 2026. **Candidate; no observations imported.**

The [FFA financial-statistics overview](https://www.efv.admin.ch/en/overview-financial-statistics-data) and [exact opendata.swiss FS/GFS main-aggregates record](https://opendata.swiss/en/dataset/hauptaggregate-und-prognosen-im-fs-und-gfs-modell) identify the [CSV resource](https://www.data.finance.admin.ch/static/assets/datasets/fs_dashboard/main_extern.csv) and [dimension codelist](https://www.data.finance.admin.ch/static/assets/datasets/fs_dashboard/main_extern_codelist.csv). The catalogue marks this resource **OPEN**, and [FFA's OGD page](https://www.efv.admin.ch/en/open-government-data-en) describes reuse of its data-portal datasets.

On 8 October 2026, the exact CSV, codelist and alternate linked XLSX requests returned a 245-byte HTML **Request Rejected** page rather than usable source data, despite HTTP 200. These responses are not statistical files and are not registered as source snapshots. A browser fetch was also unavailable in the audit environment. The source remains candidate because the data and row selection could not be verified, not because the identified aggregate CSV lacks open terms.

Confirm the `hh` institutional sector and `variable` debt concept using the original codelist. Preserve FS versus GFS model identity, consolidation, valuation and currency scale; do not assume Maastricht gross debt and broader liabilities are interchangeable.

Federal gross debt is distinct from consolidated general-government debt. Verify federal coverage and historical accounting changes from the selected data; do not populate this series from a whole-government debt ratio.

Required before import: Retrieve usable original FFA data and codelists; verify Confederation, debt valuation/consolidation and the FS/GFS debt definition and currency scale.

Schema 2.0.0 and the existing series ID are preserved. This audit publishes metadata and source evidence only; it does not add a snapshot, canonical observation, derived output or verified coverage claim.
