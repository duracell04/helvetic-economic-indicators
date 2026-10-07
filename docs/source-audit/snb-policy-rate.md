# SNB policy rate

Verified 8 October 2026. [Official daily cube](https://data.snb.ch/en/topics/snb/cube/snbgwdzid), exact LZ selection [CSV](https://data.snb.ch/api/cube/snbgwdzid/data/csv/en?dimSel=D0(LZ)&fromDate=2019-06-13&toDate=2026-10-02), publishing date 5 October 2026. Only SNB own policy-rate data are retained; the selection excludes third-party SARON.

Original publisher CSV `data/extractions/originals/snb-policy-rate.csv`, SHA-256 `f87d5245cb0e4f509ad618167f2b2fe3ff84899cc09332a8b86e1a7b91a18cdf`, 1,907 non-empty daily LZ readings from 13 June 2019 to 2 October 2026. The extraction recipe checks cube/selection, retains the first rate and each change, and removes only unchanged repetitions. This produces 12 event observations ending 20 June 2025 at 0%. Values stay in percent, scale 1. Dates are first effective business-day dates in the source, not monetary-policy announcement dates. No extrapolated or synthetic observations are added.

The [13 June 2019 SNB assessment](https://www.snb.ch/public/asset/en/www-snb-ch/publications/communication/press-releases/2019/pre_20190613/publications0_en/pre_20190613.en.pdf) introduced the policy rate in place of the three-month Libor target range. Separate historical-instrument series preserve that distinction.

[SNB copyright terms](https://www.snb.ch/en/srv/disclaimer_copyright) permit non-commercial compatible reuse with source attribution, excluding automatic rights over third-party data. This educational atlas uses that permission; these data are not MIT-licensed. Canonical final status means the retained published vintage, subject to later correction.

Tests reproduce every event from the retained original source and compare canonical rows/checksums. Duplicate, numeric, period, selection and unit/source checks reject incompatible inputs. Native event catalogue/downloads are verified on desktop and mobile.
