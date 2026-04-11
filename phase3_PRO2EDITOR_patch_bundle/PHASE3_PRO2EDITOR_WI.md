# Phase 3 Work Instruction — PRO2 Editor Tab

## Goal
Create a second-generation editor tab by cloning the current Pro GLB Editor shell into a separate namespace and wiring it as a new tab. This isolates Phase 3 topology-authoring work from the existing Pro editor.

## Delivery intent
This patch is designed to be applied on top of the codebase contained in `GLB VIEWER EDITOR.zip`.

## What the patch includes
- `viewer/core/app.js`
  - imports the new panel
  - registers a new tab: `pro2-glb`
- new namespaced editor modules under `viewer/js/pcf2glb/pro2-editor/`
  - `core/PRO2EDITOR_dataStore.js`
  - `core/PRO2EDITOR_commandStack.js`
  - `core/PRO2EDITOR_measureUtils.js`
  - `core/PRO2EDITOR_createViewerApp.js`
  - `ui/PRO2EDITOR_HudOverlay.js`
  - `ui/PRO2EDITOR_ShortcutController.js`
  - `ui/PRO2EDITOR_Panel.js`
- `three-stub.js`
  - lightweight fallback for Node smoke tests when `three` is unavailable
- `test-phase-3.js`
  - validates store, command stack, and measure utility

## Why this is the right Phase 3 plan
Phase 3 will introduce high-risk capabilities such as:
- break
- connect
- stretch
- topology mutation
- future pipe drawing / fitting insertion

A separate tab is the safest plan because it:
- protects the current Pro editor from regressions
- lets both editors coexist for side-by-side validation
- gives a clean landing zone for canonical-state migration
- keeps Phase 3 experimentation reversible

## Architectural rules used in this patch
- Pro2 owns its own editor shell, store, command stack, measure utility, HUD, shortcuts, and panel markup.
- Stable low-level helpers are reused intentionally instead of duplicated:
  - renderer helpers
  - advanced toolbar / heatmap / section box
  - camera controller
  - scene index
  - selection helpers
- High-change modules are duplicated and namespaced to reduce coupling.

## Functional coverage in this patch
- new PRO2 Editor tab
- independent store namespace: `window.PRO2EDITOR_DataStore`
- independent undo/redo command stack
- independent measurement utility
- independent HUD overlay and keyboard shortcuts
- independent editor panel shell with namespaced CSS/DOM IDs
- placeholder hooks for:
  - break
  - connect
  - stretch
  - marquee

## Smoke test
Run from the extracted project root:

```bash
node test-phase-3.js
```

Expected output:

```text
Phase 3 smoke tests passed
```

## Quantitative benchmark for this phase
This phase is a logic-isolation phase, not a browser rendering benchmark phase.
The included smoke test verifies:
- 3/3 datastore operations
- 3/3 command stack transitions
- 4/4 measurement assertions

## Recommended next Phase 3 steps after this patch
1. Replace placeholder break/connect/stretch UI handlers with canonical-state commands.
2. Introduce canonical nodes/components under PRO2 store.
3. Add endpoint snapping and topology validation.
4. Route property edits back into canonical rows, not only scene state.
5. Add export path:
   - canonical -> GLB with extras
   - canonical -> PCF translator
