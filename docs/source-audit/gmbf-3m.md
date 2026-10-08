# Three-month GMBF auction yield — candidate source audit

Reviewed 8 October 2026. **Candidate; no observations imported.**

The [SNB service-to-the-Confederation page](https://www.snb.ch/en/the-snb/mandates-goals/services-to-the-confederation/book-claims) links the [FFA auction-results workbook](https://www.efv.admin.ch/dam/en/sd-web/d9FElh8dV0db/resultate-gmbf.xlsx). Inspection found yearly sheets for 2012–2026 with auction date, settlement date, maturity, duration, bids, price and annualized yield. Several maturities can be auctioned on the same date; three-month selection and a unique event identity need a separate audit.

The workbook is an FFA publication linked by SNB. SNB's own-data reuse terms do not grant rights over a third-party workbook. The open licence identified for the FFA FS/GFS aggregate CSV applies to that separate dataset; no grant covering this auction workbook was established. The [general federal terms](https://www.admin.ch/en/terms-and-conditions) do not provide an open-data exception. The workbook is not committed or registered as a snapshot.

Keep auction-event yields separate from secondary-market, interbank and annual-average measures. The existing `gmbf-3m-annual` baseline cannot stand in for individual auctions. Preserve original maturity and source quotation before importing event data.

Required before import: Establish reuse permission for the exact FFA auction workbook, then audit the three-month tranche selection, event-date identity, quotation and duplicate-auction handling.

Schema 2.0.0 and the existing series ID are preserved. This audit publishes metadata and source evidence only; it does not add a snapshot, canonical observation, derived output or verified coverage claim.
