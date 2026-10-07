# Historical SNB Libor target range: upper bound

Verified 8 October 2026. [Official SNB historical target cube](https://data.snb.ch/en/topics/snb/cube/snbband), [exact OG CSV](https://data.snb.ch/api/cube/snbband/data/csv/en?dimSel=D0(OG)&fromDate=2000-01-03&toDate=2019-06-12), archived publishing date 21 June 2019. This is the administered upper target bound, not an observed Libor fixing.

Retained original `data/extractions/originals/snb-libor-target-upper.csv`, SHA-256 `f52e321c8ed2f5ff95e7e790be1bd2ca7c34996fbb40c602d91b97974b79a12b`. It has 5,073 non-empty daily observations, 3 January 2000–12 June 2019. The checksum-pinned recipe retains the first target and each changed value, yielding 28 effective-date events. Percent, scale 1. No unchanged daily repetition, interpolation or prior instrument is emitted.

SNB policy rate replaced this framework on 13 June 2019. Lower and upper target bounds receive independent series and PRs; do not join either into the modern policy-rate line. [SNB non-commercial reuse terms](https://www.snb.ch/en/srv/disclaimer_copyright) apply with source attribution. The original selection excludes third-party Libor market data.

Tests reproduce all events, source bytes, checksums and canonical values; identity/unit/period/value/duplicate rejection and native-frequency desktop/mobile catalogue/download checks apply. Final is the retained archived vintage, subject to corrections.
