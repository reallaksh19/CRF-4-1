# Benchmark Results

| Calculator | Current runtime benchmark status | Notes |
| --- | --- | --- |
| PSV Open | `PENDING_SOURCE_EXTRACTION` until benchmark cases are populated in Source data | Source-data table structures exist and are wired into the formula/resolver path. |
| Bursting Disc Liquid | `PENDING_SOURCE_EXTRACTION` until workbook coefficients and benchmark rows are populated | Template tables now exist under `public/misc-calc-source-data/bursting-disc-liquid.json`. |
| Blast | `PENDING_SOURCE_EXTRACTION` until workbook coefficient tables and benchmark rows are populated | Template tables now exist under `public/misc-calc-source-data/blast.json`. |
| Flange Check | `PENDING_ACCESS_PARITY` / benchmark-driven once runtime allowables are populated | Runtime source-data tables now exist for missing pressure/force/moment allowables. |

## Coverage changes in this update
- Benchmark case structures are now part of each pending source-data JSON file.
- Calculators call a shared benchmark evaluator at runtime.
- Once expected values are entered in the relevant `benchmarkCases` table and saved, the evaluator can return `PASS` or `FAIL` without more UI changes.
