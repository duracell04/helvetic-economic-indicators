# Dataset-specific usage terms

The MIT software licence does **not** cover third-party economic datasets. Each source's terms are recorded independently in the registry and included with published downloads.

The initial broad candidate source records retain unknown redistribution terms. Four exact yield sources now have reviewed terms and attribution; see [the yield audit](docs/source-audit/yields.md). Public access to a download alone is not evidence of a redistribution grant.

- **SNB historical tables (2007):** the publication explicitly permits reproduction and publication of figures with reference to source. The committed CSV is a checked transcription of selected table cells.
- **OECD Swiss ten-year yields via FRED:** section 3 of [OECD Terms and Conditions](https://www.oecd.org/en/about/terms-conditions.html) permits reuse and redistribution with OECD attribution, subject to any underlying source restrictions. Preserve that acknowledgment in downstream distributions.
- **SNB EG3M monthly data:** [SNB data portal usage guidance](https://data.snb.ch/en/topics/texts/doc/introduction) permits non-commercial use compatible with the data purpose, with attribution. This educational atlas uses that permission. Commercial reuse may require SNB consent; these data are not MIT-licensed.

The spread inherits its input source terms. Full attribution and conditions are included in the registry and public exports.

Before importing, record the exact terms URL, licence name, review date, attribution and conditions for that specific dataset. Split source records when different tables carry different rights. If restrictions prohibit public redistribution, keep the source reference and permitted processing code, but keep raw and canonical observations outside tracked and published directories.

Test fixtures are original synthetic examples covered by the project's MIT licence. They are labelled synthetic, use reserved `example.invalid` source references, and are blocked from public exports. Their test metadata does not assert rights over real economic data.
