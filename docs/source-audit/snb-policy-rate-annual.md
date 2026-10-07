# Annual SNB policy rate

Verified 8 October 2026. Uses the exact LZ daily source retained for the [event policy-rate audit](snb-policy-rate.md), with the same SNB non-commercial attribution terms. The original source CSV and checksum are shared; a separate extraction recipe and immutable annual CSV record the calculation.

This annual companion is explicitly an atlas calculation: each calendar day receives the administered rate effective that day, with the latest published daily rate remaining in force across weekends/holidays. Sum rates and divide by the actual number of calendar days (365 or 366). Decimal arithmetic avoids rounding intermediate values; CSV retains the calculation precision and canonical values use the existing numeric representation.

Only complete years 2020–2025 are included. The source begins 13 June 2019 and ends 2 October 2026; no full-year average is claimed for either incomplete year. Negative values and zero are valid. Earlier Libor instruments are not spliced in. Publication date refers to the retained daily source vintage, not a separate SNB annual release.

Recipe `data/extractions/snb-policy-rate-annual.json` rejects duplicate/unordered original dates and incomplete annual windows. Tests reproduce every annual result from the retained daily source; a separate check counts the 2022 effective-rate intervals and verifies leap-year means. Annual chart selection, readouts and downloads are verified on desktop/mobile. Default panels are unchanged.
