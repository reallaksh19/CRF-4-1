# Smoke Test Results

## Scope
Manual/structural smoke review of the extracted `misc` patch package.

## Completed checks
- `misc/test_misccalc.js` executes successfully with Node and reports **All calculator unit tests passed**.
- `viewer/tabs/misc-calc-tab.js` passes `node --check` syntax validation.
- Source-data subtabs are injected for:
  - `mc-psvopen`
  - `mc-bdliquid`
  - `mc-blast`
  - `mc-flange-check`
- `Save to public...` workflow is wired through `viewer/calc/source-data-manager.js` and always persists runtime/local-storage data; when File System Access API is available, it also writes JSON into a selected `public/misc-calc-source-data` folder.
- Public JSON templates exist for pending source/master tables under `public/misc-calc-source-data/`.
- Updated calculators use the shared `UnitSystem` conversion helper and expose benchmark status from the runtime source-data model.

## Not fully executable in this patch-only package
- Browser-level end-to-end smoke run of the full Misc Calc tab cannot be completed from this partial extracted package because the host repo modules imported by `misc-calc-tab.js` (for example `../core/state.js`, `../calc/core/calc-engine.js`) are outside the uploaded patch slice.
- Workbook-exact benchmark comparisons remain pending until workbook/source-data rows are populated.
