# Files Changed

| File | Description |
| --- | --- |
| `viewer/calc/source-data-manager.js` | New shared runtime manager for source/master data, benchmark case storage, and Save-to-public workflow. |
| `viewer/calc/units/unit-system.js` | Replaced stub with real unit conversion helpers and input-mode support. |
| `viewer/calc/formulas/psv-open.js` | Wired source data, benchmark evaluation, and unit-aware display values. |
| `viewer/calc/formulas/bursting-disc-liquid.js` | Wired pending source data structure and benchmark evaluation into calculator output. |
| `viewer/calc/formulas/blast.js` | Wired pending source data structure and benchmark evaluation into calculator output. |
| `viewer/calc/formulas/flange-check.js` | Added runtime source-data usage for missing allowables and benchmark evaluation. |
| `viewer/calc/formulas/liquid-relief.js` | Updated result formatting to use explicit source units. |
| `viewer/calc/formulas/relief-valve.js` | Updated result formatting to use explicit source units. |
| `viewer/calc/formulas/trunnion.js` | Updated normalization/formatting calls to use unit-mode aware conversions. |
| `viewer/calc/resolvers/psv-open-resolver.js` | Changed PSV lookup resolution to read dynamic source data instead of hard-coded static arrays. |
| `viewer/calc/resolvers/flange-resolver.js` | Added source-data payload wiring to flange normalization. |
| `viewer/tabs/misc-calc-tab.js` | Injects Source data subtabs, Save-to-public buttons, runtime source-data editing, unit-mode wiring, and updated result rendering for target calculators. |
| `public/misc-calc-source-data/psv-open.json` | Seed JSON structure for PSV Open lookup/benchmark data. |
| `public/misc-calc-source-data/bursting-disc-liquid.json` | Seed JSON structure for Bursting Disc Liquid source data. |
| `public/misc-calc-source-data/blast.json` | Seed JSON structure for Blast source data. |
| `public/misc-calc-source-data/flange-check.json` | Seed JSON structure for missing flange allowable / benchmark data. |
| `test_misccalc.js` | Expanded with unit-conversion and source-data-manager checks. |
| `SMOKE_TEST_RESULTS.md` | Added smoke-test status summary for this patch package. |
| `OVERVIEW.md` | Added phased overview of planned follow-up work. |
