# Historical SNB discount rate

Verified 8 October 2026. [SNB Historical time series 4, November 2007](https://www.snb.ch/public/publication/en/www-snb-ch/publications/statistical-publications/historical-time-series/2007/renditen_book/publications0_en/e_zinssaetze_u_renditen.book.pdf), table 1.1 column 1, printed pages 24–25. These are year-end readings, not annual averages. 92 values, 1907–1998; later blank discount entries are absent.

Publisher PDF SHA-256 `b4b27a0e8b1f861106f6f3442187064ffefc6c174075207fd9f1fe8f38363610`. All 100 rows of table 1.1 were compared independently using pypdf and pdfplumber; both extractions agreed exactly, and rendered pages were inspected for column headings and notes. The checked figures are retained in `data/extractions/checked/snb-official-rates.csv` with SHA-256 `6503d28eec294f6eb4908d63f34bd149e70fffff1103690acc2491ec7016792c`. Recipe identifies this as a transcription, not an original publisher CSV. The full PDF is not redistributed.

To repeat the PDF comparison, supply the original PDF to `scripts/verify-historical-rates.py` using pypdf/pdfplumber. The standard-library extraction recipe then selects the discount column and skips only publisher missing markers. Tests reproduce every selected canonical value and checksum from the checked figure table. Percent, scale 1, published three-decimal precision retained. Publication month is known but day is not, so observation publication date remains null.

The publication expressly permits reproducing figures with source reference. Keep this historical instrument separate from the Libor target and modern policy-rate frameworks. No daily/event dates are manufactured. Annual year-end data are available through chart selection, catalogue and downloads, verified at desktop/mobile sizes.
