# Real GDP per capita — candidate source audit

Reviewed 8 October 2026. **Candidate; no observations imported.**

The real-volume numerator is the [SECO annual workbook](https://www.seco.admin.ch/dam/en/sd-web/SaAbXCUZ5Fj8/qna_p_na.xlsx) described in [the real-GDP audit](real-gdp.md). Its reuse grant remains unresolved.

The verified `population` series measures permanent residents at **31 December**. It is not an audited annual-average denominator. Dividing annual GDP by those year-end counts would introduce a convention that this series has not authorized. An official per-capita publication may specify a different population concept; audit that denominator and historical reconstructions before adding observations.

Preserve real versus nominal identity. Nominal GDP per capita, if added later to match the original HTML, requires its own series and PR. Do not derive real per-capita values from nominal GDP or manufacture volume levels by chaining the available growth rates.

Required before import: Resolve the real-GDP source reuse grant and verify a compatible published annual-average population denominator, or obtain an official real-GDP-per-capita series with documented methodology and permission.

Schema 2.0.0 and the existing series ID are preserved. This audit publishes metadata and source evidence only; it does not add a snapshot, canonical observation, derived output or verified coverage claim.
