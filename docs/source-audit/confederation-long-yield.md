# Historical long-term Confederation yield — candidate source audit

Reviewed 8 October 2026. **Candidate; no observations imported.**

[SNB Historical time series 4, November 2007](https://www.snb.ch/public/publication/en/www-snb-ch/publications/statistical-publications/historical-time-series/2007/renditen_book/publications0_en/e_zinssaetze_u_renditen.book.pdf) prints annual historical bond-yield figures and discusses companion statistical tables. This catalogue entry calls for the original **monthly historical yield** concept. A usable exact monthly companion was not located in the audit.

The verified `confederation-10y` series is a fitted zero-coupon ten-year spot rate. The monthly spot cube is also a spot-rate concept and cannot fill the older coupon-yield series. The existing annual financing baseline is separately documented; annual values cannot become monthly observations by repetition or interpolation.

The book discusses changes in historical yield calculations, including 1970, 1977 and 1981–1982. Those changes must be mapped to the exact monthly table before assigning reconstruction labels or break periods. Its figures have an attribution-based reproduction grant, but that does not identify the missing companion file. Preserve this candidate at native monthly frequency and retain gaps.

Required before import: Locate and retrieve the original SNB monthly historical long-term yield table; verify its exact series identity, method transitions, native periods and source-specific reuse terms.

Schema 2.0.0 and the existing series ID are preserved. This audit publishes metadata and source evidence only; it does not add a snapshot, canonical observation, derived output or verified coverage claim.
