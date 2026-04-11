# Known Limitations

1. **Workbook-exact formulas are still pending** for PSV Open, Bursting Disc Liquid, and Blast. This patch exposes the data structures required to finish them, but it does not invent missing engineering equations.
2. **Save-to-public depends on browser capabilities.** In a normal static browser context there is no automatic write access to `../public`. The implemented workflow uses the File System Access API when available and otherwise falls back to runtime/local-storage persistence.
3. **Flange Check still contains placeholder force/moment allowables** until those tables are populated in the new flange Source data subtab or transcribed from the workbook/app source.
4. **Patch package is still a slice of the full repo.** The uploaded archive does not include every host module imported by `misc-calc-tab.js`, so browser-level end-to-end execution still depends on the full repository.
5. **Benchmark pass/fail depends on populated expected values.** The evaluator is wired, but empty benchmark tables will intentionally remain `PENDING_SOURCE_EXTRACTION` / `PENDING_ACCESS_PARITY`.
