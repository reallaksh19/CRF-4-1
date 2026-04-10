# Flange Check WI — Access source tables, staging tables, and JSON masters

## Scope
This WI is only for **Flange Check** in Misc Calc. It must support two methods:
- **NC**
- **UG44**

The current `CRF-4-1` flange misc calc is only an extraction/display feature, not a full calculator.
It shows parsed flange rows and passes them into a display-only calculator.
The new work must be a separate real calculator, not a patch over the extraction viewer.

## New calculator
- Internal id: `mc-flange-check`
- Sidebar label: `Flange Check`
- Keep old `mc-flange` as extraction viewer until parity is verified.

## Access source separation

### Staging / runtime / user-input tables
These are **not** master tables:
- `INPUT_FLANGES`
- `INPUT_ALLOWABLES`
- `tblFlangecheck`
- `FlangeCheckUG44`
- `tblflangemattally`
- `tblFlangeUG44Prinput`

These are pipeline or run-specific objects used by routines such as:
- `UpdateFlangedata`
- `UpdateflangeAllowable`
- `UpdateFlangecheck`
- `AppendFlangeUG44`
- `UpdateFlangeUG44Result`

### NC master source
Use these as NC-side reference/master source:
- `tblFlangeDetails`
- `tblFlangeMaterial`
- `Flange_Allowable`

### UG44 master source
Use these as UG44-side reference/master source:
- `tblFlangeDetails`
- `tblFlangeMaterial`
- `FlangeUG44bDB`

## Actual fields seen from Access reverse-engineering
These are the specific field names/string hits seen from the Access file and should be preserved during export mapping:

### `tblFlangeDetails`
- `Rating`
- `NB (INCH)`
- `Abinch2`
- `cinch`

### `tblFlangeMaterial`
- `SPECIFICATION`

### `FlangeUG44bDB`
- `FM`
- `G(m)`

### staging fields seen
- `INPUT_FLANGES.BOLT_CIRCLE_DIA`
- `INPUT_FLANGES.BOLT_AREA`
- `INPUT_FLANGES.FLG_PTR`
- `INPUT_FLANGES.SY30`
- `INPUT_FLANGES.SY20`
- `INPUT_FLANGES.SY10`
- `INPUT_FLANGES.SY_COLD`
- `tblFlangecheck.PRESSURE1`
- `tblFlangecheck.Mat_Name`

## Repo file targets

Create:
- `viewer/calc/formulas/flange-check.js`
- `viewer/calc/svg/flange-check-svg.js`
- `viewer/calc/resolvers/flange-resolver.js`
- `viewer/calc/master/tblFlangeDetails.json`
- `viewer/calc/master/tblFlangeMaterial.json`
- `viewer/calc/master/Flange_Allowable.json`
- `viewer/calc/master/FlangeUG44bDB.json`

Modify:
- `viewer/tabs/misc-calc-layout.js`
- `viewer/tabs/misc-calc-tab.js`
- `viewer/tabs/misc-calc-console.js`

Also show these JSONs in the Master Table tab.

## Master Table tab requirement
For each JSON master table:
- show dataset name
- show source Access table name
- show filter controls
- show preview grid
- show row id
- allow export/download JSON
- show badge: `accdb-derived json`

Datasets to expose:
- `tblFlangeDetails`
- `tblFlangeMaterial`
- `Flange_Allowable`
- `FlangeUG44bDB`

## Resolution order

### Method
- manual: `NC` or `UG44`

### Identity
1. parsed flange row
2. parsed node + class/rating
3. parsed line/spec
4. manual NPS/rating/material

### Geometry
1. parsed flange context
2. `tblFlangeDetails.json`
3. manual override

### Process
1. parsed `T1`, `P1`
2. linelist `T1`, `P1`
3. manual override

### Material group
1. parsed/spec match
2. `tblFlangeMaterial.json`
3. manual override

### Allowables
- if method = `NC`, use `Flange_Allowable.json`
- if method = `UG44`, use `FlangeUG44bDB.json`

## Temperature interpolation
If exact temperature row does not exist:

`A(T) = A_low + (T - T_low) * (A_high - A_low) / (T_high - T_low)`

Apply independently to:
- pressure basis
- axial allowable
- moment allowable

Warn when:
- interpolated
- below minimum row and clamped
- above maximum row and clamped

## Core formulas

### Common
- `ID = OD - 2t`
- `M_res = sqrt(Mx^2 + My^2 + Mz^2)` if components exist
- `F_ax_tension = max(F_axial, 0)`

### NC
Resolve:
- `P_allow_nc`
- `F_allow_nc`
- `M_allow_nc`

Ratios:
- `rP = P_actual / P_allow_nc`
- `rF = F_ax_tension / F_allow_nc`
- `rM = M_res / M_allow_nc`

Interaction:
- `I_NC = rF + rM`
- `UR_NC = max(rP, rF, rM, I_NC)`

Pass/fail:
- PASS if `rP <= 1.0` and `I_NC <= 1.0`
- FAIL otherwise

### UG44
Resolve:
- `P_rated_ug44`
- `F_allow_ug44`
- `M_allow_ug44`

Ratios:
- `rPr = P_actual / P_rated_ug44`
- `rFu = F_ax_tension / F_allow_ug44`
- `rMu = M_res / M_allow_ug44`

Interaction:
- `I_UG44 = rFu + rMu`
- `UR_UG44 = max(rPr, rFu, rMu, I_UG44)`

Pass/fail:
- PASS if `rPr <= 1.0` and `I_UG44 <= 1.0`
- FAIL otherwise

## Console requirements
Must show:
- input resolution
- equation trace with substitution
- intermediate values
- outputs
- warnings
- errors
- source snapshot
- benchmark placeholder

Add support in session console for:
- `resolutionTrace`
- `sourceSnapshot`
- `benchmark`

## Benchmark status
Allowed:
- `PENDING_SOURCE_EXTRACTION`
- `PENDING_ACCESS_PARITY`
- `PASS`
- `FAIL`

Default to `PENDING_ACCESS_PARITY` until verified against Access cases.

## Important implementation note
Do not claim that `INPUT_FLANGES` or `tblFlangecheck` are master tables.
Those are staging/runtime objects.
The JSON master tables must be created from:
- `tblFlangeDetails`
- `tblFlangeMaterial`
- `Flange_Allowable`
- `FlangeUG44bDB`