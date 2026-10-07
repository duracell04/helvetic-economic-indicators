# Federal Statistical Office: source audit

Status: **candidate — not audited**. Start at [Federal Statistical Office](https://www.bfs.admin.ch/); this landing page is not an exact dataset citation or a redistribution grant.

Candidate scope: Output, population, consumer prices and ILO unemployment.

Complete a separate record for each exact dataset. Split broad registry source records before verification when tables have different rights or definitions.

| Audit field | Evidence to record |
| --- | --- |
| Exact source | Dataset URL, table/API identifier, download parameters and vintage |
| Definition | Unit and scale, coverage, instrument, maturity, adjustment and valuation |
| Timing | Native frequency, period convention, publication lag and coverage |
| History | Breaks, reconstructions, revisions and source replacements |
| Redistribution | Exact terms URL, licence, conditions, attribution and review date |
| Reproduction | Importer, input checksum and aggregation convention |

Decision: leave `audit_status` and series `verification` as `candidate` until every relevant field is evidenced. Leave rights `unknown` if publication terms remain unresolved. Restricted observations and original files must stay outside tracked directories.
