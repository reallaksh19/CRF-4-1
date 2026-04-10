# Enhanced Stress Report Implementation Plan

This document outlines the architecture and execution strategy for migrating dynamic engineering calculations (typically found in external Excel spreadhseets) directly into our web-based CAESAR II reporting application.

## 1. Dynamic Report Sections Overview

Earlier versions of stress reports relied heavily on static or manually transcribed summaries. To support the "Enhanced Stress Report" paradigm, the application now dynamically extracts and processes structural and fluid data natively from CAESAR II parsed outputs (PDF/ACCDB/XML).

### Key Dynamic Integrations:

*   **Flange Leakage Evaluation:**
    *   **Data Source:** Extracted from the `FLANGES` sections within the CAESAR II input or output tables.
    *   **Dynamism:** Instead of static lists, flanges are parsed dynamically. Each flange’s associated pressure, method (e.g., NC-3658.3), and leakage ratio are extracted into the `state.parsed.flanges` array. The UI dynamically generates a status matrix highlighting `PASS` / `FAIL` states based on the ratio thresholds.
*   **Force Summaries:**
    *   **Data Source:** Extracted from structural restraint points or applied load nodes (`state.parsed.forces`).
    *   **Dynamism:** Combines individual vectors ($F_x$, $F_y$, $F_z$) to compute resultant load magnitudes natively in the browser. This provides real-time verification constraints for anchor points and nozzle loads.
*   **Tank / Equipment Calculations (Future Expansion):**
    *   **Strategy:** Following the pattern established by the Flange and Force tables, future Tank calculations (like API 650 nozzle loads or settlement evaluations) will be mapped. The parser will detect equipment boundary nodes from the `RESTRAINTS` or `ANCHORS` tags, cross-reference the corresponding $F/M$ vectors, and feed them into a dedicated equipment evaluation sub-tab.

---

## 2. Miscellaneous Calculations (`Misc. Calc` Tab)

A primary goal of the Enhanced Report is to centralize external Excel sheets (like `Trunnion Calc_22020.xlsx`, `vessel skirt temp-307C.xlsx`, and `momentum_calc.xlsx`) into web-based calculators.

This is executed within the new `viewer/tabs/misc-calc-tab.js` component, featuring toggleable sub-tabs for each calculation type.

### Integration Strategy:

1.  **Pre-populate Inputs from Parsed Data:**
    The core philosophy is to minimize manual data entry.
    *   **Temperatures ($T_1$, $T_a$):** Pulled natively from the `computeOperatingConditions` max-finder utility.
    *   **Geometry ($OD$, $Wall$, $ID$, $Area$):** Sourced from the `state.parsed.elements` array.
    *   **Loads ($F_x$, $F_y$, $F_z$):** Fetched from the maximal load constraint (`maxAppliedForce`).
    *   **Densities ($\rho$):** The parser extracts `Fluid Density` and `Insulation Density` (converting from kg/cm³ to kg/m³ using a 1,000,000 multiplier scaling).

2.  **Web-Based Calculation Logic:**
    The native Excel formulas are translated into vanilla JavaScript math functions executed reactively when the user interacts with the panel.

    *   **Vessel Skirt Temperature Profile:**
        *   **Formula:** $T_x = T_a + (T - T_a) \cdot e^{-K \cdot (x/h)}$
        *   **UI:** Iterates over the user-defined skirt height ($h$), displaying a gradient temperature table from the top to the bottom of the skirt.
    *   **Trunnion Load Check:**
        *   **Formula:** Section Modulus ($Z = \frac{\pi (OD^4 - ID^4)}{32 \cdot OD}$), Cross Area ($A$), Axial Stress ($\sigma_a = F_x / A$), Shear Stress ($\tau = F_{shear} / A$), and Bending Stress ($\sigma_b = \frac{F_{shear} \cdot L}{Z}$).
        *   **UI:** Pre-fills geometry from the largest pipe element and forces from the maximum applied load node. Outputs a clear stress breakdown table.
    *   **Momentum Calculation:**
        *   **Formula:** $F = \rho \cdot A \cdot v^2$
        *   **UI:** Automatically groups all unique Outer Diameter and Wall Thickness combinations from the parsed model. It generates a grid where users can input velocity ($v$) against the pre-filled fluid density ($\rho$) and geometry ($A$), outputting the corresponding momentum forces immediately.

### Expanding the Toolkit:

Adding new Excel-based logic follows a simple 3-step pipeline:
1.  **Add a Toggle Button:** Insert a new `<button class="panel-tab" data-target="mc-new-calc">` in the `side-panel-tabs` header.
2.  **Create the Content Panel:** Build the HTML grid (`<div id="mc-new-calc">`) containing inputs pre-filled from `state.parsed`.
3.  **Wire the Event Listener:** Attach a `click` listener to a calculate button that applies the mathematical heuristic, updates the DOM, and logs the resultant values.
