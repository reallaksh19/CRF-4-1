# Misc Calc hardening overview

## Phase 1 — Source-data scaffolding
- Add `Source data` subtabs for PSV Open, Bursting Disc Liquid, Blast, and Flange Check.
- Store editable JSON table structures for all pending workbook/master data.
- Add `Save to public...` workflow that persists runtime data and writes JSON into a user-selected `public/misc-calc-source-data` folder when browser file access is available.

## Phase 2 — Runtime wiring
- Wire source-data tables into resolvers and formulas up front.
- Use dynamic orifice/K-Ro data for PSV Open.
- Use runtime flange allowable tables before falling back to shipped master data or placeholders.
- Surface source-data table counts and benchmark configuration in result output and console.

## Phase 3 — Unit-system completion
- Replace the stub `UnitSystem` with real conversion helpers for length, area, force, pressure, stress, moment, density, velocity, mass flow, and temperature.
- Respect `Native`, `SI`, and `Imperial` input modes.
- Update affected calculators and result rendering to show correct units.

## Phase 4 — Benchmark coverage
- Add benchmark case structures to each source-data JSON file.
- Introduce a generic benchmark evaluator that can compare calculator outputs against populated expected values once workbook extraction is complete.
- Keep incomplete calculators explicitly flagged as `PENDING_SOURCE_EXTRACTION` / `PENDING_ACCESS_PARITY` until source data is populated.

## Phase 5 — Workbook parity follow-up
- Populate pending tables from source spreadsheets.
- Replace placeholder PSV Open / Blast / Bursting Disc Liquid equations with workbook-exact formulas.
- Replace simplified flange force/moment placeholders with real allowable tables.
