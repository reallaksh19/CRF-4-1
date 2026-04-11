# Phase Summary

This update extends the previous misc-calc patch in four specific ways.

1. **Source-data subtabs added** — `PSV Open`, `Bursting Disc Liquid`, `Blast`, and `Flange Check` now get an internal `Source data` subtab injected at runtime. Each subtab exposes editable JSON table structures for pending workbook/master data and benchmark cases.
2. **Save-to-public workflow added** — a shared source-data manager now persists edited source data into runtime/local storage and, when the browser supports the File System Access API, writes JSON files into a user-selected `public/misc-calc-source-data` folder.
3. **Unit-system upgrade** — the old stub `UnitSystem` was replaced with real conversion helpers for length, area, force, pressure, stress, moment, density, velocity, mass flow, and temperature. The updated calculators now use the shared unit system for input normalization and result formatting.
4. **Benchmark scaffolding improved** — benchmark case structures are now part of each pending source-data JSON file, and a generic evaluator returns `PASS`, `FAIL`, or `PENDING_SOURCE_EXTRACTION` depending on configured expected values.

The work intentionally remains explicit about engineering gaps: where workbook formulas or real allowable tables are still missing, the UI now exposes those data structures directly instead of hiding them behind placeholders.
