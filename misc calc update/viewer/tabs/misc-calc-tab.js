import { state } from '../core/state.js';
import { computeOperatingConditions, computeMaxValues } from '../utils/max-finder.js';
import { getLinelistService } from '../core/linelist-store.js';
import { getCaesarMatchAttribute } from '../core/settings.js';
import { renderMiscCalcConsole } from './misc-calc-console.js';
import { renderMiscCalcLayout } from './misc-calc-layout.js';

import { getCalculator, registerCalculator } from '../calc/core/calc-registry.js';
import { runCalculation } from '../calc/core/calc-engine.js';
import { setSession, appendToHistory } from '../calc/core/calc-session.js';

import { VesselSkirtCalc } from '../calc/formulas/vessel-skirt.js';
import { TrunnionCalc } from '../calc/formulas/trunnion.js';
import { MomentumCalc } from '../calc/formulas/momentum.js';
import { FlangeLeakageCalc } from '../calc/formulas/flange-leakage.js';
import { ForceSummaryCalc } from '../calc/formulas/force-summary.js';
import { ReliefValveCalc } from '../calc/formulas/relief-valve.js';
import { NemaSm23Calc } from '../calc/formulas/nema-sm23.js';

import { generateSkirtSvg } from '../calc/svg/skirt-svg.js';
import { generateTrunnionSvg } from '../calc/svg/trunnion-svg.js';
import { generateRvSvg } from '../calc/svg/rv-svg.js';
import { generateNemaSvg } from '../calc/svg/nema-svg.js';
import { generateMomentumSvg } from '../calc/svg/momentum-svg.js';
import { generateSlugSvg } from '../calc/svg/slug-loads-svg.js';
import { resolveSlugInputs } from '../calc/resolvers/slug-input-resolver.js';
import { SlugLoadsCalc } from '../calc/formulas/slug-loads.js';

import { generateShellIndentSvg } from '../calc/svg/shell-indentation-svg.js';
import { resolveShellIndentInputs } from '../calc/resolvers/shell-indent-resolver.js';
import { ShellIndentationCalc } from '../calc/formulas/shell-indentation.js';
import { LiquidReliefCalc } from '../calc/formulas/liquid-relief.js';
import { generateLiquidReliefSvg } from '../calc/svg/liquid-relief-svg.js';
import { PsvOpenCalc } from '../calc/formulas/psv-open.js';
import { generatePsvOpenSvg } from '../calc/svg/psv-open-svg.js';
import { BurstingDiscLiquidCalc } from '../calc/formulas/bursting-disc-liquid.js';
import { generateBurstingDiscLiquidSvg } from '../calc/svg/bursting-disc-liquid-svg.js';
import { BlastCalc } from '../calc/formulas/blast.js';
import { generateBlastSvg } from '../calc/svg/blast-svg.js';
import { FlangeCheckCalc } from '../calc/formulas/flange-check.js';
import { generateFlangeCheckSvg } from '../calc/svg/flange-check-svg.js';
import { Api610Calc } from '../calc/formulas/api-610.js';
import { generateApi610Svg } from '../calc/svg/api-610-svg.js';
import { AivFivCalc } from '../calc/formulas/aiv-fiv.js';
import { generateAivFivSvg } from '../calc/svg/aiv-fiv-svg.js';
import { ExternalPressureCalc } from '../calc/formulas/external-pressure.js';
import { generateExtPressureSvg } from '../calc/svg/external-pressure-svg.js';
import { WeldedShoeCalc } from '../calc/formulas/welded-shoe.js';
import { generateWeldedShoeSvg } from '../calc/svg/welded-shoe-svg.js';
import { GreFlangeCalc } from '../calc/formulas/gre-flange.js';
import { generateGreFlangeSvg } from '../calc/svg/gre-flange-svg.js';
import { tblFlangeMaterial, Flange_Allowable, FlangeUG44bDB } from '../calc/master/flange-master-data.js';
import { tblPipeSizeSch, tblAPI610_Discharge, tblAPI610_Suction, tblAPI610_AxisMatch } from '../calc/master/api-610-master-data.js';
import { UnitSystem } from '../calc/units/unit-system.js';
import { getSourceData, getDefaultSourceData, saveSourceDataToPublic, setSourceData } from '../calc/source-data-manager.js';

// Register all calculators
registerCalculator('mc-skirt', VesselSkirtCalc);
registerCalculator('mc-api610', Api610Calc);
registerCalculator('mc-aiv-fiv', AivFivCalc);
registerCalculator('mc-ext-pressure', ExternalPressureCalc);
registerCalculator('mc-welded-shoe', WeldedShoeCalc);
registerCalculator('mc-gre-flange', GreFlangeCalc);
registerCalculator('mc-flange-check', FlangeCheckCalc);
registerCalculator('mc-liquidrelief', LiquidReliefCalc);
registerCalculator('mc-psvopen', PsvOpenCalc);
registerCalculator('mc-bdliquid', BurstingDiscLiquidCalc);
registerCalculator('mc-blast', BlastCalc);
registerCalculator('mc-trunnion', TrunnionCalc);
registerCalculator('mc-momentum', MomentumCalc);
registerCalculator('mc-flange', FlangeLeakageCalc);
registerCalculator('mc-force', ForceSummaryCalc);
registerCalculator('mc-rvforce', ReliefValveCalc);
registerCalculator('mc-nema', NemaSm23Calc);
registerCalculator('mc-slug', SlugLoadsCalc);
registerCalculator('mc-shellindent', ShellIndentationCalc);


let currentSlugResolverPayload = null;
let currentShellResolverPayload = null;

const SOURCE_DATA_EDITOR_CONFIG = {
  'mc-psvopen': {
    title: 'Source data — PSV Open',
    filename: 'psv-open.json',
    sections: [
      { key: 'orificeTable', label: 'Orifice table (Table 1)' },
      { key: 'kRoTable', label: 'K to Ro table (Table 2)' },
      { key: 'benchmarkCases', label: 'Benchmark cases' }
    ]
  },
  'mc-bdliquid': {
    title: 'Source data — Bursting Disc Liquid',
    filename: 'bursting-disc-liquid.json',
    sections: [
      { key: 'deviceSize', label: 'Device size table' },
      { key: 'coefficients', label: 'Coefficient table' },
      { key: 'correctionFactors', label: 'Correction factor table' },
      { key: 'benchmarkCases', label: 'Benchmark cases' }
    ]
  },
  'mc-blast': {
    title: 'Source data — Blast',
    filename: 'blast.json',
    sections: [
      { key: 'caseFactors', label: 'Case factors' },
      { key: 'pressureCoefficients', label: 'Pressure coefficients' },
      { key: 'dragFactors', label: 'Drag factors' },
      { key: 'benchmarkCases', label: 'Benchmark cases' }
    ]
  },
  'mc-flange-check': {
    title: 'Source data — Flange Check',
    filename: 'flange-check.json',
    sections: [
      { key: 'runtimeAllowables', label: 'Runtime pressure allowables' },
      { key: 'forceAllowables', label: 'Force allowables (populate later)' },
      { key: 'momentAllowables', label: 'Moment allowables (populate later)' },
      { key: 'benchmarkCases', label: 'Benchmark cases' }
    ]
  }
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildSourceDataPane(calcId) {
  const cfg = SOURCE_DATA_EDITOR_CONFIG[calcId];
  const sourceData = getSourceData(calcId);
  const saveTarget = sourceData?.metadata?.saveTarget || `public/misc-calc-source-data/${cfg.filename}`;
  return `
    <div class="source-data-pane" data-calc-id="${calcId}" style="display:none; border:1px solid #d9e2f1; background:#fbfdff; padding:12px; border-radius:6px;">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:10px; flex-wrap:wrap;">
        <div>
          <strong>${cfg.title}</strong><br>
          <span class="muted" style="font-size:12px; color:#666;">Populate these tables now or later. Save writes runtime data immediately and attempts to write JSON into a selected <code>public/misc-calc-source-data</code> folder.</span>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          <button class="btn-secondary" type="button" data-source-data-reset="${calcId}">Load defaults</button>
          <button class="btn-primary" type="button" data-source-data-save="${calcId}">Save to public...</button>
        </div>
      </div>
      <div class="source-data-status" id="source-data-status-${calcId}" style="margin-bottom:10px; font-size:12px; color:#555;">Target file: <code>${escapeHtml(saveTarget)}</code></div>
      ${cfg.sections.map(section => `
        <div style="margin-bottom:12px;">
          <label style="display:block; font-weight:bold; margin-bottom:4px;">${section.label}</label>
          <textarea data-source-data-json="${calcId}:${section.key}" style="width:100%; min-height:120px; font-family:monospace; font-size:12px;">${escapeHtml(JSON.stringify(sourceData?.tables?.[section.key] ?? [], null, 2))}</textarea>
        </div>
      `).join('')}
    </div>
  `;
}

function decorateSourceDataPanels(container) {
  Object.keys(SOURCE_DATA_EDITOR_CONFIG).forEach((calcId) => {
    const panel = container.querySelector(`#${calcId}`);
    if (!panel || panel.querySelector('[data-source-toggle]')) return;
    const mainChildren = Array.from(panel.childNodes);
    const toolbar = document.createElement('div');
    toolbar.style.display = 'flex';
    toolbar.style.gap = '8px';
    toolbar.style.marginBottom = '12px';
    toolbar.innerHTML = `
      <button type="button" class="btn-primary" data-source-toggle="${calcId}:main">Main Inputs</button>
      <button type="button" class="btn-secondary" data-source-toggle="${calcId}:source">Source data</button>
    `;
    const mainPane = document.createElement('div');
    mainPane.className = 'source-main-pane';
    mainPane.dataset.calcId = calcId;
    mainChildren.forEach(node => mainPane.appendChild(node));
    const wrapper = document.createElement('div');
    wrapper.innerHTML = buildSourceDataPane(calcId);
    const sourcePane = wrapper.firstElementChild;
    panel.appendChild(toolbar);
    panel.appendChild(mainPane);
    panel.appendChild(sourcePane);
  });
}

function attachSourceDataPanelEvents(container) {
  container.querySelectorAll('[data-source-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const [calcId, target] = btn.dataset.sourceToggle.split(':');
      const panel = container.querySelector(`#${calcId}`);
      const mainPane = panel?.querySelector('.source-main-pane');
      const sourcePane = panel?.querySelector('.source-data-pane');
      if (!mainPane || !sourcePane) return;
      const showSource = target === 'source';
      mainPane.style.display = showSource ? 'none' : 'block';
      sourcePane.style.display = showSource ? 'block' : 'none';
      panel.querySelectorAll('[data-source-toggle]').forEach((peer) => {
        const active = peer.dataset.sourceToggle === `${calcId}:${showSource ? 'source' : 'main'}`;
        peer.classList.toggle('btn-primary', active);
        peer.classList.toggle('btn-secondary', !active);
      });
    });
  });

  container.querySelectorAll('[data-source-data-reset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const calcId = btn.dataset.sourceDataReset;
      const defaults = getDefaultSourceData(calcId);
      setSourceData(calcId, defaults);
      SOURCE_DATA_EDITOR_CONFIG[calcId].sections.forEach((section) => {
        const textarea = container.querySelector(`[data-source-data-json="${calcId}:${section.key}"]`);
        if (textarea) textarea.value = JSON.stringify(defaults?.tables?.[section.key] ?? [], null, 2);
      });
      const statusEl = container.querySelector(`#source-data-status-${calcId}`);
      if (statusEl) statusEl.textContent = 'Defaults restored in runtime/local storage. Click Save to public... to write JSON files.';
    });
  });

  container.querySelectorAll('[data-source-data-save]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const calcId = btn.dataset.sourceDataSave;
      const current = getDefaultSourceData(calcId);
      const cfg = SOURCE_DATA_EDITOR_CONFIG[calcId];
      const nextPayload = { ...current, metadata: { ...(current.metadata || {}), calcId }, tables: {} };
      try {
        cfg.sections.forEach((section) => {
          const textarea = container.querySelector(`[data-source-data-json="${calcId}:${section.key}"]`);
          nextPayload.tables[section.key] = textarea?.value ? JSON.parse(textarea.value) : [];
        });
      } catch (error) {
        const statusEl = container.querySelector(`#source-data-status-${calcId}`);
        if (statusEl) statusEl.textContent = `Invalid JSON: ${error.message}`;
        return;
      }
      const result = await saveSourceDataToPublic(calcId, nextPayload);
      const statusEl = container.querySelector(`#source-data-status-${calcId}`);
      if (statusEl) statusEl.textContent = result.message;
    });
  });
}

export function renderMiscCalc(container) {
  const parsed = state.parsed;
  const llService = getLinelistService();
  const opCond = computeOperatingConditions(parsed) || {};
  const maxVals = computeMaxValues(parsed) || {};
  const flanges = parsed?.flanges || [];
  const forces = parsed?.forces || [];

  // Get inputs
  const T = opCond.T1 || 80;
  const Ta = opCond.T3 || 25; // Often ambient is min design temp or default 25
  const maxForce = maxVals.maxAppliedForce || { fx:0, fy:0, fz:0, magnitude:0 };

  // Trunnion sample element for OD / Wall
  let pipeEl = null;
  if (parsed?.elements?.length) {
     pipeEl = parsed.elements.find(e => e.od > 0 && e.wall > 0) || parsed.elements[0];
  }
  const od = pipeEl?.od || 0;
  const wall = pipeEl?.wall || 0;

  // Group unique OD/Wall sizes for Momentum Calculation
  const pipeGroups = {};
  if (parsed?.elements) {
    for (const el of parsed.elements) {
      if (el.od && el.wall) {
         const key = `${el.od.toFixed(2)}_${el.wall.toFixed(2)}`;
         if (!pipeGroups[key]) {
             let density = el.fluidDensity ? Math.round(el.fluidDensity * 1000000) : 1000;
             let velocity = 2.0;

             const matchAttr = getCaesarMatchAttribute();
             if (el[matchAttr]) {
                 const c2Raw = String(el[matchAttr]).trim();
                 const matchResult = llService.getSmartAttributes(c2Raw);

                 if (matchResult && matchResult.Found) {
                     // We grab the dedicated variables out of the new smart map logic for Misc Calc
                     // Since Misc Calc might need all of them, let's store them in the group.
                     // For default "density" we fallback to Direct > Liquid > Mixed > Gas.
                     const foundDensity = matchResult.DensityDirect || matchResult.DensityLiquid || matchResult.DensityMixed || matchResult.DensityGas;
                     const foundVelocity = matchResult.Velocity || matchResult.VelocityLiquid || matchResult.VelocityMixed || matchResult.VelocityGas;

                     if (foundDensity) density = parseFloat(foundDensity) || density;
                     if (foundVelocity) velocity = parseFloat(foundVelocity) || velocity;

                     // We attach the full spectrum to the pipeGroup so specific calculators can use them later
                     pipeGroups[key] = {
                         od: el.od, wall: el.wall, density, velocity, lineNo: el.lineNo,
                         details: { ...matchResult }
                     };
                     continue;
                 }
             }

             pipeGroups[key] = { od: el.od, wall: el.wall, density, velocity, lineNo: el.lineNo, details: {} };
         }
      }
    }
  }

  renderMiscCalcLayout(container);

  const panelsContainer = container.querySelector('#calc-panels');
  panelsContainer.innerHTML = `
      <!-- Vessel Skirt Temp -->
      <div class="panel-content active" id="mc-skirt" style="display:block;">
        <table class="data-table params-table" style="width:100%; max-width:400px; margin-bottom:20px;">
          <tbody>
            <tr><td class="param-key">Ambient Temp (Ta)</td><td><input type="number" id="mc-skirt-ta" value="${Ta}" style="width:80px;"> &deg;C</td></tr>
            <tr><td class="param-key">Top Skirt Temp (T)</td><td><input type="number" id="mc-skirt-t" value="${T}" style="width:80px;"> &deg;C</td></tr>
            <tr><td class="param-key">Insulation Const (K)</td><td><input type="number" id="mc-skirt-k" value="1.0" step="0.1" style="width:80px;"></td></tr>
            <tr><td class="param-key">Skirt Height (h)</td><td><input type="number" id="mc-skirt-h" value="3250" style="width:80px;"> mm</td></tr>
            <tr><td class="param-key">Wall Thickness (t)</td><td><input type="number" id="mc-skirt-t-wall" value="18" style="width:80px;"> mm</td></tr>
          </tbody>
        </table>
        <button class="btn-primary" id="btn-calc-skirt">Calculate Profile</button>
        <div id="skirt-results" style="margin-top: 15px; font-family: monospace; background: #f4f6f8; padding: 10px; border-radius: 4px;">Ready.</div>
      </div>

      <!-- Trunnion Calc -->
      <div class="panel-content" id="mc-trunnion" style="display:none;">
        <p class="tab-note">Inputs pre-filled from Max Applied Force node ${maxForce.node || 'N/A'}</p>
        <table class="data-table params-table" style="width:100%; max-width:400px; margin-bottom:20px;">
          <tbody>
            <tr><td class="param-key">Pipe OD</td><td><input type="number" id="mc-trun-od" value="${od}" style="width:80px;"> mm</td></tr>
            <tr><td class="param-key">Pipe Wall</td><td><input type="number" id="mc-trun-wall" value="${wall}" style="width:80px;"> mm</td></tr>
            <tr><td class="param-key">Fx (Axial)</td><td><input type="number" id="mc-trun-fx" value="${Math.round(maxForce.fx || 0)}" style="width:80px;"> N</td></tr>
            <tr><td class="param-key">Fy (Shear)</td><td><input type="number" id="mc-trun-fy" value="${Math.round(maxForce.fy || 0)}" style="width:80px;"> N</td></tr>
            <tr><td class="param-key">Fz (Shear)</td><td><input type="number" id="mc-trun-fz" value="${Math.round(maxForce.fz || 0)}" style="width:80px;"> N</td></tr>
            <tr><td class="param-key">Moment Arm (L)</td><td><input type="number" id="mc-trun-l" value="300" style="width:80px;"> mm</td></tr>
          </tbody>
        </table>
        <button class="btn-primary" id="btn-calc-trunnion">Calculate Stress</button>
        <div id="trunnion-results" style="margin-top: 15px; font-family: monospace; background: #f4f6f8; padding: 10px; border-radius: 4px;">Ready.</div>
      </div>

      <!-- Momentum Calc -->
      <div class="panel-content" id="mc-momentum" style="display:none;">
        <p class="tab-note">Calculates flow momentum force: F = &rho; &times; A &times; v&sup2;</p>
        <div style="overflow-x:auto;">
          <table class="data-table" id="table-momentum" style="width:100%; margin-bottom:10px; min-width: 500px;">
            <thead>
              <tr>
                <th>OD (mm)</th><th>Wall (mm)</th><th>ID (mm)</th><th>Area (m&sup2;)</th><th>Density (kg/m&sup3;)</th><th>Velocity (m/s)</th><th>Force (N)</th>
              </tr>
            </thead>
            <tbody>
              ${Object.values(pipeGroups).map((g, idx) => {
                const id = g.od - (2 * g.wall);
                const area = (Math.PI / 4) * Math.pow(id / 1000, 2);
                return `
                  <tr data-idx="${idx}" data-area="${area}">
                    <td>${g.od.toFixed(2)}</td><td>${g.wall.toFixed(2)}</td><td>${id.toFixed(2)}</td><td>${area.toFixed(4)}</td>
                    <td><input type="number" class="calc-mom-dens" value="${g.density || 1000}" style="width:70px;" title="Gas: ${g.details.DensityGas||'N/A'} | Liq: ${g.details.DensityLiquid||'N/A'} | Mix: ${g.details.DensityMixed||'N/A'}"></td>
                    <td><input type="number" class="calc-mom-vel" value="${g.velocity || 2.0}" style="width:70px;" title="Gas: ${g.details.VelocityGas||'N/A'} | Liq: ${g.details.VelocityLiquid||'N/A'} | Mix: ${g.details.VelocityMixed||'N/A'}"></td>
                    <td class="calc-mom-force" style="font-weight:bold;">0.00</td>
                  </tr>
                `;
              }).join('') || '<tr><td colspan="7" class="center muted">No valid pipes found</td></tr>'}
            </tbody>
          </table>
        </div>
        <button class="btn-primary" id="btn-calc-momentum">Calculate Forces</button>
      </div>

      <!-- GRE Flange Leakage -->
      <div class="panel-content" id="mc-gre-flange" style="display:none;">
        <div style="background: #fff3cd; color: #856404; padding: 10px; margin-bottom: 15px; border: 1px solid #ffeeba; border-radius: 4px;">
          <strong>GRE/FRP Only:</strong> This module uses Equivalent Pressure logic specifically adapted for Glass-Reinforced Epoxy. Do not use for standard metallic flanges.
        </div>
        <p class="tab-note">GRE Flange Equivalent Pressure check.</p>
        <table class="data-table params-table" style="width:100%; max-width:500px; margin-bottom:20px;">
          <tbody>
            <tr><td class="param-key">Flange Rating (#)</td><td><input type="number" id="mc-gre-rating" value="150" style="width:80px;"></td></tr>
            <tr><td class="param-key">Axial Force (N)</td><td><input type="number" id="mc-gre-f" value="1000" style="width:80px;"></td></tr>
            <tr><td class="param-key">Bending Moment (Nm)</td><td><input type="number" id="mc-gre-m" value="500" style="width:80px;"></td></tr>
          </tbody>
        </table>
        <button class="btn-primary" id="btn-calc-gre-flange">Calculate GRE Flange</button>
        <div id="mc-gre-flange-results" style="margin-top:20px;"></div>
      </div>

      <!-- Flange Check -->
      <div class="panel-content" id="mc-flange-check" style="display:none;">
        <p class="tab-note">Workbook-traceable flange check using NC or UG44 methods.</p>
        <table class="data-table params-table" style="width:100%; max-width:600px; margin-bottom:20px;">
          <tbody>
            <tr>
              <td class="param-key">Method</td>
              <td>
                <select id="mc-fc-method" style="width:100%;">
                  <option value="NC" selected>NC</option>
                  <option value="UG44">UG44</option>
                </select>
              </td>
            </tr>
            <tr><td class="param-key">Internal Pressure</td><td><input type="number" id="mc-fc-p" value="1.5" style="width:80px;"> MPa</td></tr>
            <tr><td class="param-key">Axial Tension (Fx)</td><td><input type="number" id="mc-fc-fx" value="100" style="width:80px;"> N</td></tr>
            <tr><td class="param-key">Moment X (Mx)</td><td><input type="number" id="mc-fc-mx" value="500" style="width:80px;"> N-m</td></tr>
            <tr><td class="param-key">Moment Y (My)</td><td><input type="number" id="mc-fc-my" value="200" style="width:80px;"> N-m</td></tr>
            <tr><td class="param-key">Moment Z (Mz)</td><td><input type="number" id="mc-fc-mz" value="100" style="width:80px;"> N-m</td></tr>
            <tr><td class="param-key">Temperature (T1)</td><td><input type="number" id="mc-fc-t1" value="50" style="width:80px;"> &deg;C</td></tr>
            <tr><td class="param-key">NPS (inch)</td><td><input type="number" id="mc-fc-nps" value="4" style="width:80px;"></td></tr>
            <tr><td class="param-key">Rating</td><td><input type="number" id="mc-fc-rating" value="300" style="width:80px;"></td></tr>
            <tr><td class="param-key">Material</td><td><input type="text" id="mc-fc-mat" value="SA-105" style="width:120px;"></td></tr>
          </tbody>
        </table>
        <button class="btn-primary" id="btn-calc-flangecheck">Calculate Flange Check</button>
        <div id="mc-flangecheck-results" style="margin-top:20px;"></div>
      </div>

      <!-- Welded Shoe -->
      <div class="panel-content" id="mc-welded-shoe" style="display:none;">
        <p class="tab-note">Pipe Welded Shoe Attachment Calculation.</p>
        <table class="data-table params-table" style="width:100%; max-width:500px; margin-bottom:20px;">
          <tbody>
            <tr><td class="param-key">Pipe Outside Diameter</td><td><input type="number" id="mc-ws-od" value="168.3" style="width:80px;"> mm</td></tr>
            <tr><td class="param-key">Pipe Nominal Wall Thk.</td><td><input type="number" id="mc-ws-t" value="12.7" style="width:80px;"> mm</td></tr>
            <tr><td class="param-key">Shoe Height (h)</td><td><input type="number" id="mc-ws-h" value="100" style="width:80px;"> mm</td></tr>
            <tr><td class="param-key">Shoe Length (A)</td><td><input type="number" id="mc-ws-a" value="300" style="width:80px;"> mm</td></tr>
            <tr><td class="param-key">Axial Load (FA)</td><td><input type="number" id="mc-ws-fa" value="10000" style="width:80px;"> N</td></tr>
            <tr><td class="param-key">Circumferential Load (FC)</td><td><input type="number" id="mc-ws-fc" value="10000" style="width:80px;"> N</td></tr>
          </tbody>
        </table>
        <button class="btn-primary" id="btn-calc-welded-shoe">Calculate Shoe Stresses</button>
        <div id="mc-welded-shoe-results" style="margin-top:20px;"></div>
      </div>

      <!-- External Pressure -->
      <div class="panel-content" id="mc-ext-pressure" style="display:none;">
        <p class="tab-note">Calculates Maximum Allowable Working External Pressure (MAWEP) per ASME VIII Div 1.</p>
        <table class="data-table params-table" style="width:100%; max-width:500px; margin-bottom:20px;">
          <tbody>
            <tr><td class="param-key">Outside Diameter (Do)</td><td><input type="number" id="mc-ext-do" value="168.3" style="width:80px;"> mm</td></tr>
            <tr><td class="param-key">Nominal Thickness (t)</td><td><input type="number" id="mc-ext-t" value="7.11" style="width:80px;"> mm</td></tr>
            <tr><td class="param-key">Unsupported Length (L)</td><td><input type="number" id="mc-ext-l" value="3050" style="width:80px;"> mm</td></tr>
            <tr><td class="param-key">External Pressure</td><td><input type="number" id="mc-ext-p" value="0.1" style="width:80px;"> MPa</td></tr>
            <tr><td class="param-key">Design Temperature</td><td><input type="number" id="mc-ext-temp" value="180" style="width:80px;"> &deg;C</td></tr>
          </tbody>
        </table>
        <button class="btn-primary" id="btn-calc-ext-pressure">Calculate External Pressure</button>
        <div id="mc-ext-pressure-results" style="margin-top:20px;"></div>
      </div>

      <!-- AIV / FIV -->
      <div class="panel-content" id="mc-aiv-fiv" style="display:none;">
        <p class="tab-note">Acoustic and Flow Induced Vibration screening.</p>
        <table class="data-table params-table" style="width:100%; max-width:500px; margin-bottom:20px;">
          <tbody>
            <tr>
              <td class="param-key">Mode</td>
              <td>
                <select id="mc-aiv-mode" style="width:100%;">
                  <option value="AIV" selected>AIV (Dry Gas)</option>
                  <option value="FIV">FIV (Liquid/Multiphase)</option>
                </select>
              </td>
            </tr>
            <tr><td class="param-key">Mass Flow Rate (kg/s)</td><td><input type="number" id="mc-aiv-flow" value="14.86" style="width:80px;"></td></tr>
            <tr><td class="param-key">NPS (mm)</td><td><input type="number" id="mc-aiv-nps" value="100" style="width:80px;"></td></tr>
            <tr><td class="param-key">Support Type</td><td>
                <select id="mc-aiv-support">
                  <option value="Stiff">Stiff</option>
                  <option value="Medium Stiff" selected>Medium Stiff</option>
                  <option value="Medium">Medium</option>
                  <option value="Flexible">Flexible</option>
                </select>
            </td></tr>
          </tbody>
        </table>
        <button class="btn-primary" id="btn-calc-aiv">Calculate AIV / FIV</button>
        <div id="mc-aiv-results" style="margin-top:20px;"></div>
      </div>

      <!-- API 610 -->
      <div class="panel-content" id="mc-api610" style="display:none;">
        <p class="tab-note">API 610 Nozzle Load Validation</p>
        
        <table class="data-table params-table" style="width:100%; max-width:800px; margin-bottom:20px;">
          <tbody>
            <tr>
              <td class="param-key">Pump Type</td>
              <td colspan="3">
                <select id="mc-api-pumptype" style="width:100%;">
                  <option value="Side suction Side discharge">Side suction Side discharge</option>
                  <option value="End suction Top discharge" selected>End suction Top discharge</option>
                  <option value="Top suction Top dishcarge">Top suction Top dishcarge</option>
                  <option value="Vertical In-line pumps">Vertical In-line pumps</option>
                </select>
              </td>
            </tr>
            <tr>
              <td class="param-key">Pump Shaft Axis</td>
              <td>
                <select id="mc-api-shaftaxis">
                  <option value="X" selected>X</option>
                  <option value="Y">Y</option>
                  <option value="Z">Z</option>
                </select>
              </td>
              <td class="param-key">Suction Nozzle CL Axis</td>
              <td>
                <select id="mc-api-suctionaxis">
                  <option value="X" selected>X</option>
                  <option value="Y">Y</option>
                  <option value="Z">Z</option>
                </select>
              </td>
            </tr>
            <tr>
               <td class="param-key">Suction NS</td>
               <td><input type="number" id="mc-api-sucns" value="4" style="width:80px;"></td>
               <td class="param-key">Discharge NS</td>
               <td><input type="number" id="mc-api-disns" value="3" style="width:80px;"></td>
            </tr>
            <tr>
               <td class="param-key">API Factor</td>
               <td colspan="3"><input type="number" id="mc-api-factor" value="1" style="width:80px;"></td>
            </tr>
          </tbody>
        </table>

        <!-- Inputs for Suction and Discharge loads -->
        <div style="display:flex; gap:20px; flex-wrap:wrap; margin-bottom: 20px;">
            <div style="flex:1; min-width:300px;">
                <h4 style="margin:0 0 10px 0; color:#555;">Suction Loads (CII Axis)</h4>
                <table class="data-table params-table" style="width:100%;">
                    <tr><td>Fx</td><td><input type="number" id="mc-api-s-fx" value="1000" style="width:80px;"></td><td>Mx</td><td><input type="number" id="mc-api-s-mx" value="500" style="width:80px;"></td></tr>
                    <tr><td>Fy</td><td><input type="number" id="mc-api-s-fy" value="200" style="width:80px;"></td><td>My</td><td><input type="number" id="mc-api-s-my" value="600" style="width:80px;"></td></tr>
                    <tr><td>Fz</td><td><input type="number" id="mc-api-s-fz" value="300" style="width:80px;"></td><td>Mz</td><td><input type="number" id="mc-api-s-mz" value="700" style="width:80px;"></td></tr>
                </table>
            </div>
            <div style="flex:1; min-width:300px;">
                <h4 style="margin:0 0 10px 0; color:#555;">Discharge Loads (CII Axis)</h4>
                <table class="data-table params-table" style="width:100%;">
                    <tr><td>Fx</td><td><input type="number" id="mc-api-d-fx" value="800" style="width:80px;"></td><td>Mx</td><td><input type="number" id="mc-api-d-mx" value="400" style="width:80px;"></td></tr>
                    <tr><td>Fy</td><td><input type="number" id="mc-api-d-fy" value="100" style="width:80px;"></td><td>My</td><td><input type="number" id="mc-api-d-my" value="500" style="width:80px;"></td></tr>
                    <tr><td>Fz</td><td><input type="number" id="mc-api-d-fz" value="200" style="width:80px;"></td><td>Mz</td><td><input type="number" id="mc-api-d-mz" value="600" style="width:80px;"></td></tr>
                </table>
            </div>
        </div>

        <button class="btn-primary" id="btn-calc-api610">Calculate API 610</button>
        <div id="mc-api610-results" style="margin-top:20px;"></div>
      </div>

      <!-- Flange Leakage -->
      <div class="panel-content" id="mc-flange" style="display:none;">
        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
            <button class="btn-primary active" id="btn-flange-extraction-tab">Extraction Viewer</button>
            <button class="btn-secondary" id="btn-flange-master-tab">Master Tables</button>
        </div>

        <div id="flange-extraction-content">
            <p class="tab-note">
              Extracted ${flanges.length} flanges from parsed CAESAR II data.<br>
              <em>Reference Tool:</em> <a href="https://github.com/reallaksh19/CRF-4-1/tree/7a34e5948e7e747f41d5837b268e91fdd1f5f196/Stress%20tool%20box/Flange%20leakage/Flange%20check" target="_blank" style="color: #007acc; text-decoration: none;">Flange Check Spreadsheet / App</a>
            </p>
            <table class="data-table" style="width:100%;">
              <thead><tr><th>Node</th><th>Method</th><th>Pressure</th><th>Leakage Ratio</th><th>Status</th></tr></thead>
              <tbody>
                ${flanges.length ? flanges.map(f => `<tr><td>${f.node}</td><td>${f.method || 'NC-3658.3'}</td><td>${f.pressure || '-'}</td><td>${f.ratio ? f.ratio.toFixed(2) : '-'}</td><td>${f.ratio > 1 ? '<span style="color:red;">FAIL</span>' : '<span style="color:green;">PASS</span>'}</td></tr>`).join('') : '<tr><td colspan="5" class="center muted">No flanges found</td></tr>'}
              </tbody>
            </table>
            <button class="btn-primary" id="btn-calc-flange" style="margin-top: 10px;">Process Flanges</button>
        </div>

        <div id="flange-master-content" style="display: none;">
            <p class="tab-note">Master Reference Tables (accdb-derived json)</p>
            <div style="margin-bottom: 15px;">
                <label>Select Table: </label>
                <select id="mc-flange-master-select">
                    <option value="tblFlangeMaterial">tblFlangeMaterial</option>
                    <option value="Flange_Allowable">Flange_Allowable</option>
                    <option value="FlangeUG44bDB">FlangeUG44bDB</option>
                    <option value="tblPipeSizeSch">Common: Pipe Size & Sch</option>
                    <option value="tblAPI610_Discharge">API 610 Discharge</option>
                    <option value="tblAPI610_Suction">API 610 Suction</option>
                    <option value="tblAPI610_AxisMatch">API 610 Axis Match</option>
                </select>
            </div>
            <div id="mc-flange-master-table-container" style="overflow-x: auto; max-height: 400px;"></div>
        </div>
      </div>

      <!-- Force Calculation -->
      <div class="panel-content" id="mc-force" style="display:none;">
        <p class="tab-note">Displaying all parsed external force nodes from ${state.fileName || 'input'}.</p>
        <table class="data-table" style="width:100%;">
          <thead><tr><th>Node</th><th>Fx (N)</th><th>Fy (N)</th><th>Fz (N)</th><th>Magnitude (N)</th></tr></thead>
          <tbody>
            ${forces.length ? forces.map(f => `<tr><td>${f.node}</td><td>${f.fx}</td><td>${f.fy}</td><td>${f.fz}</td><td>${Math.sqrt(f.fx**2 + f.fy**2 + f.fz**2).toFixed(2)}</td></tr>`).join('') : '<tr><td colspan="5" class="center muted">No forces extracted</td></tr>'}
          </tbody>
        </table>
        <button class="btn-primary" id="btn-calc-force" style="margin-top: 10px;">Process Forces</button>
      </div>

      <!-- Liquid Relief Reaction -->
      <div class="panel-content" id="mc-liquidrelief" style="display:none;">
        <p class="tab-note">Calculates liquid discharge / liquid relief reaction forces.</p>
        
        <table class="data-table params-table" style="width:100%; max-width:500px; margin-bottom:20px;">
          <tbody>
            <tr>
              <td class="param-key">Mode</td>
              <td>
                <select id="mc-lr-mode" style="width:100%;">
                  <option value="combined" selected>Pressure + Momentum Combined</option>
                  <option value="velocity">Velocity-based</option>
                  <option value="flow-rate">Flow-rate-based</option>
                </select>
              </td>
            </tr>
            <tr><td class="param-key">Density (rho)</td><td><input type="number" id="mc-lr-rho" value="1000" style="width:80px;"> kg/m&sup3;</td></tr>
            <tr><td class="param-key">Discharge Exit Area (Ae)</td><td><input type="number" id="mc-lr-ae" value="3100" style="width:80px;"> mm&sup2;</td></tr>
            
            <tr class="lr-mode-row lr-vel lr-comb" style="display:table-row;"><td class="param-key">Velocity (v)</td><td><input type="number" id="mc-lr-v" value="10" style="width:80px;"> m/s</td></tr>
            
            <tr class="lr-mode-row lr-flow" style="display:none;"><td class="param-key">Volumetric Flow (Q)</td><td><input type="number" id="mc-lr-q" value="0.025" style="width:80px;"> m&sup3;/s</td></tr>
            <tr class="lr-mode-row lr-flow" style="display:none;"><td class="param-key">Mass Flow (m_dot)</td><td><input type="number" id="mc-lr-mdot" value="" placeholder="or kg/s" style="width:80px;"> kg/s</td></tr>
            
            <tr class="lr-mode-row lr-comb" style="display:table-row;"><td class="param-key">Exit Pressure (Pe)</td><td><input type="number" id="mc-lr-pe" value="0.45" style="width:80px;"> MPa</td></tr>
            
            <tr><td class="param-key">Atmospheric Pressure (Pa)</td><td><input type="number" id="mc-lr-pa" value="0.101" style="width:80px;"> MPa</td></tr>
            <tr><td class="param-key">Dynamic Amplification Factor (DAF)</td><td><input type="number" id="mc-lr-daf" value="1.0" step="0.1" style="width:80px;"></td></tr>
            <tr class="lr-mode-row lr-comb" style="display:table-row;"><td class="param-key">Include Pressure Thrust</td><td><input type="checkbox" id="mc-lr-ptrust" checked></td></tr>
          </tbody>
        </table>
        
        <button class="btn-primary" id="btn-calc-liquidrelief">Calculate Liquid Relief</button>
        
        <div id="mc-liquidrelief-results" style="margin-top:20px;"></div>
      </div>

      <!-- Blast -->
      <div class="panel-content" id="mc-blast" style="display:none;">
        <p class="tab-note">Calculates blast pressure / blast load screening based on workbook logic.</p>
        <table class="data-table params-table" style="width:100%; max-width:500px; margin-bottom:20px;">
          <tbody>
            <tr><td class="param-key">Blast Pressure</td><td><input type="number" id="mc-blast-pressure" value="0" style="width:80px;"></td></tr>
            <tr><td class="param-key">Exposed Area</td><td><input type="number" id="mc-blast-area" value="0" style="width:80px;"></td></tr>
            <tr><td class="param-key">Coefficient</td><td><input type="number" id="mc-blast-coeff" value="0" style="width:80px;"></td></tr>
          </tbody>
        </table>
        <button class="btn-primary" id="btn-calc-blast">Calculate Blast Load</button>
        <div id="mc-blast-results" style="margin-top:20px;"></div>
      </div>

      <!-- Bursting Disc Liquid -->
      <div class="panel-content" id="mc-bdliquid" style="display:none;">
        <p class="tab-note">Calculates liquid-service bursting disc opening / discharge loading.</p>
        <table class="data-table params-table" style="width:100%; max-width:500px; margin-bottom:20px;">
          <tbody>
            <tr><td class="param-key">Burst Pressure</td><td><input type="number" id="mc-bdliquid-burst" value="0" style="width:80px;"></td></tr>
            <tr><td class="param-key">Downstream Pressure</td><td><input type="number" id="mc-bdliquid-down" value="0" style="width:80px;"></td></tr>
            <tr><td class="param-key">Liquid Density</td><td><input type="number" id="mc-bdliquid-rho" value="0" style="width:80px;"></td></tr>
          </tbody>
        </table>
        <button class="btn-primary" id="btn-calc-bdliquid">Calculate Bursting Disc Liquid</button>
        <div id="mc-bdliquid-results" style="margin-top:20px;"></div>
      </div>

      <!-- PSV Open -->
      <div class="panel-content" id="mc-psvopen" style="display:none;">
        <p class="tab-note">Calculates open-system discharge loading for PSV (gas/vapour).</p>
        
        <table class="data-table params-table" style="width:100%; max-width:500px; margin-bottom:20px;">
          <tbody>
            <tr><td class="param-key">Set Pressure + Overpressure</td><td><input type="number" id="mc-psvopen-pset" value="0" style="width:80px;"></td></tr>
            <tr><td class="param-key">Relief Temperature</td><td><input type="number" id="mc-psvopen-tf" value="0" style="width:80px;"></td></tr>
            <tr><td class="param-key">Molecular Weight</td><td><input type="number" id="mc-psvopen-mw" value="28" style="width:80px;"></td></tr>
            <tr><td class="param-key">Total Discharge Rate (W)</td><td><input type="number" id="mc-psvopen-w" value="0" style="width:80px;"></td></tr>
            <tr><td class="param-key">Number of Working Valves</td><td><input type="number" id="mc-psvopen-valves" value="1" style="width:80px;"></td></tr>
            
            <tr>
              <td class="param-key">Orifice Mode</td>
              <td>
                <select id="mc-psvopen-orimode" style="width:100%;">
                  <option value="letter" selected>Letter Lookup</option>
                  <option value="manual">Manual Area</option>
                </select>
              </td>
            </tr>
            <tr id="row-psvopen-letter"><td class="param-key">Orifice Letter</td><td><input type="text" id="mc-psvopen-letter" value="D" style="width:80px;"></td></tr>
            <tr id="row-psvopen-area" style="display:none;"><td class="param-key">Orifice Area</td><td><input type="number" id="mc-psvopen-area" value="0" style="width:80px;"> mm&sup2;</td></tr>
            
            <tr><td class="param-key">Tailpipe OD</td><td><input type="number" id="mc-psvopen-od" value="0" style="width:80px;"></td></tr>
            <tr><td class="param-key">Tailpipe Wall</td><td><input type="number" id="mc-psvopen-wall" value="0" style="width:80px;"></td></tr>
            <tr><td class="param-key">Impact Factor</td><td><input type="number" id="mc-psvopen-impact" value="2.0" style="width:80px;"></td></tr>
            <tr><td class="param-key">Specific Heat Ratio (k)</td><td><input type="number" id="mc-psvopen-k" value="1.4" style="width:80px;"></td></tr>
          </tbody>
        </table>
        
        <button class="btn-primary" id="btn-calc-psvopen">Calculate PSV Open</button>
        <div id="mc-psvopen-results" style="margin-top:20px;"></div>
      </div>

      <!-- Relief Valve Forces -->
      <div class="panel-content" id="mc-rvforce" style="display:none;">
        <div style="background: #fff3cd; color: #856404; padding: 10px; margin-bottom: 15px; border: 1px solid #ffeeba; border-radius: 4px;">
          <strong>Warning:</strong> Gas/Vapour discharge only. Not valid for liquid relief. Screening calculation only unless benchmarked.
        </div>
        <p class="tab-note">Calculates open and closed system reaction forces for Gas/Vapour discharge.</p>
        <table class="data-table params-table" style="width:100%; max-width:400px; margin-bottom:20px;">
          <tbody>
            <tr><td class="param-key">Set Pressure (P_set)</td><td><input type="number" id="mc-rv-pset" value="262" style="width:80px;"> psig</td></tr>
            <tr><td class="param-key">Relief Temp (T)</td><td><input type="number" id="mc-rv-t" value="335" style="width:80px;"> &deg;F</td></tr>
            <tr><td class="param-key">Ratio of Specific Heats (k)</td><td><input type="number" id="mc-rv-k" value="1.29" step="0.01" style="width:80px;"></td></tr>
            <tr><td class="param-key">Molecular Weight (M)</td><td><input type="number" id="mc-rv-mw" value="6.52" style="width:80px;"></td></tr>
            <tr><td class="param-key">Max Discharge Rate (W)</td><td><input type="number" id="mc-rv-w" value="101663" style="width:80px;"> lb/hr</td></tr>
            <tr><td class="param-key">Discharge Exit Area (A_E)</td><td><input type="number" id="mc-rv-ae" value="78.54" style="width:80px;"> in&sup2;</td></tr>
            <tr><td class="param-key">Atmospheric Pressure (P_A)</td><td><input type="number" id="mc-rv-pa" value="14.7" style="width:80px;"> psia</td></tr>
          </tbody>
        </table>
        <button class="btn-primary" id="btn-calc-rv">Calculate Forces</button>
        <div id="rv-results" style="margin-top: 15px; font-family: monospace; background: #f4f6f8; padding: 10px; border-radius: 4px;">Ready.</div>
      </div>

      <!-- NEMA SM23 Check -->
      <div class="panel-content" id="mc-nema" style="display:none;">
        <p class="tab-note">Evaluates piping loads against NEMA SM23 allowable limits. Select an anchor node to evaluate.</p>
        <div style="margin-bottom:10px;">
          <label><strong>Select Node:</strong>
            <select id="mc-nema-node" style="padding: 4px;">
              <option value="">-- Select Anchor Node --</option>
              ${Array.from(new Set(forces.map(f => f.node))).map(n => `<option value="${n}">${n}</option>`).join('')}
            </select>
          </label>
        </div>
        <table class="data-table params-table" style="width:100%; max-width:400px; margin-bottom:20px;">
          <tbody>
            <tr><td class="param-key">Equivalent Diameter (De)</td><td><input type="number" id="mc-nema-de" value="13.333" step="0.001" style="width:80px;"> inch</td></tr>
            <tr><td class="param-key" colspan="2" style="font-size:0.85em; color:#666;">(For a 24" pipe, De is approx 13.333")</td></tr>
            <tr><td class="param-key">Mx (Moment)</td><td><input type="number" id="mc-nema-mx" value="0" style="width:80px;"> N-m</td></tr>
            <tr><td class="param-key">My (Moment)</td><td><input type="number" id="mc-nema-my" value="0" style="width:80px;"> N-m</td></tr>
            <tr><td class="param-key">Mz (Moment)</td><td><input type="number" id="mc-nema-mz" value="0" style="width:80px;"> N-m</td></tr>
          </tbody>
        </table>
        <button class="btn-primary" id="btn-calc-nema">Evaluate Loads</button>
        <div id="nema-results" style="margin-top: 15px; font-family: monospace; background: #f4f6f8; padding: 10px; border-radius: 4px;">Ready.</div>
      </div>

      <!-- Slug Loads Check -->
      <div class="panel-content" id="mc-slug" style="display:none;">
        <p class="tab-note">Calculates flow momentum and dynamic amplification loads for slug flow events.</p>

        <div style="background: #fdfdfd; border: 1px solid #ddd; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
            <h4 style="margin-top: 0;">1. Data Basis</h4>
            <div style="display: flex; gap: 20px;">
                <label><strong>Select Element:</strong><br>
                    <select id="mc-slug-element" style="padding: 4px; width: 150px;">
                        <option value="">-- Manual/None --</option>
                        ${(parsed?.elements || []).map(e => `<option value="${e.id || e.SEQ_NO}">${e.id || e.SEQ_NO} (Node ${e.from} to ${e.to})</option>`).join('')}
                    </select>
                </label>
                <label><strong>Select Bend:</strong><br>
                    <select id="mc-slug-bend" style="padding: 4px; width: 150px;">
                        <option value="">-- Manual/None --</option>
                        ${(parsed?.bends || []).map(b => `<option value="${b.node}">Node ${b.node}</option>`).join('')}
                    </select>
                </label>
            </div>
        </div>

        <div style="background: #fdfdfd; border: 1px solid #ddd; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
            <h4 style="margin-top: 0;">2. Manual Input Fallbacks</h4>
            <p style="font-size: 0.85em; color: #666; margin-bottom: 10px;">Used if element/linelist mapping is missing.</p>
            <table class="data-table params-table" style="width:100%;">
              <tbody>
                <tr>
                  <td>Pipe OD (mm) <input type="number" id="mc-slug-od" value="${od}" style="width:60px;"></td>
                  <td>Wall (mm) <input type="number" id="mc-slug-wall" value="${wall}" style="width:60px;"></td>
                  <td>Density (kg/m³) <input type="number" id="mc-slug-dens" value="1000" style="width:60px;"></td>
                </tr>
                <tr>
                  <td>Length (mm) <input type="number" id="mc-slug-len" value="1000" style="width:60px;"></td>
                  <td>Velocity (m/s) <input type="number" id="mc-slug-vel" value="2.0" style="width:60px;"></td>
                  <td>Slug L (m) <input type="number" id="mc-slug-sluglen" value="5.0" style="width:60px;"></td>
                </tr>
                <tr>
                  <td>DAF <input type="number" id="mc-slug-daf" value="2.0" step="0.1" style="width:60px;"></td>
                  <td colspan="2">Line Tag <input type="text" id="mc-slug-line" value="" style="width:120px;" placeholder="Optional"></td>
                </tr>
              </tbody>
            </table>
        </div>

        <button class="btn-primary" id="btn-slug-resolve" style="margin-bottom: 10px;">Resolve Inputs</button>
        <button class="btn-secondary" id="btn-calc-slug" style="margin-bottom: 10px;" disabled>Calculate Loads</button>

        <div id="slug-resolution-table" style="display:none; margin-bottom: 15px;"></div>
        <div id="slug-results" style="font-family: monospace; background: #f4f6f8; padding: 10px; border-radius: 4px;">Ready.</div>
      </div>

      <!-- Pipe Shell Indentation Check -->
      <div class="panel-content" id="mc-shellindent" style="display:none;">
        <p class="tab-note">Estimate local pipe wall stress caused by a localized support or attachment load.</p>

        <div style="background: #fdfdfd; border: 1px solid #ddd; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
            <h4 style="margin-top: 0;">1. Data Basis</h4>
            <div style="display: flex; gap: 20px;">
                <label><strong>Select Element:</strong><br>
                    <select id="mc-shell-element" style="padding: 4px; width: 150px;">
                        <option value="">-- Manual/None --</option>
                        ${(parsed?.elements || []).map(e => `<option value="${e.id || e.SEQ_NO}">${e.id || e.SEQ_NO} (Node ${e.from} to ${e.to})</option>`).join('')}
                    </select>
                </label>
                <label><strong>Select Load Node (Parsed Force):</strong><br>
                    <select id="mc-shell-force-node" style="padding: 4px; width: 150px;">
                        <option value="">-- Manual/None --</option>
                        ${Array.from(new Set(forces.map(f => f.node))).map(n => `<option value="${n}">${n}</option>`).join('')}
                    </select>
                </label>
            </div>
        </div>

        <div style="background: #fdfdfd; border: 1px solid #ddd; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
            <h4 style="margin-top: 0;">2. Manual Input Fallbacks</h4>
            <table class="data-table params-table" style="width:100%;">
              <tbody>
                <tr>
                  <td>Pipe OD (mm) <input type="number" id="mc-shell-od" value="${od}" style="width:60px;"></td>
                  <td>Nominal Wall (mm) <input type="number" id="mc-shell-wall" value="${wall}" style="width:60px;"></td>
                  <td>Effective Wall (mm) <input type="number" id="mc-shell-effwall" value="${wall}" style="width:60px;" title="Override to assume corroded or reinforced section"></td>
                </tr>
                <tr>
                  <td>Normal Force F_n (N) <input type="number" id="mc-shell-force" value="15000" style="width:60px;"></td>
                  <td>Contact Type
                      <select id="mc-shell-footprint" style="width:90px;">
                          <option value="narrow">Narrow/Point</option>
                          <option value="rectangular">Rectangular Patch</option>
                          <option value="strip">Strip/Line Load</option>
                      </select>
                  </td>
                  <td>Contact Width b (mm) <input type="number" id="mc-shell-width" value="40" style="width:60px;"></td>
                </tr>
                <tr>
                  <td>Contact Length L (mm) <input type="number" id="mc-shell-length" value="120" style="width:60px;" title="Only strictly required for rectangular patch"></td>
                  <td>Stress K Factor <input type="number" id="mc-shell-k" value="1.8" step="0.1" style="width:60px;"></td>
                  <td>Allowable (MPa) <input type="number" id="mc-shell-allowable" value="137" style="width:60px;"></td>
                </tr>
                <tr>
                  <td colspan="3"><label><input type="checkbox" id="mc-shell-ignore-pads"> Ignore Pads/Stiffeners (Screening Assumption)</label></td>
                </tr>
              </tbody>
            </table>
        </div>

        <button class="btn-primary" id="btn-shell-resolve" style="margin-bottom: 10px;">Resolve Inputs</button>
        <button class="btn-secondary" id="btn-calc-shell" style="margin-bottom: 10px;" disabled>Calculate Stress</button>

        <div id="shell-resolution-table" style="display:none; margin-bottom: 15px;"></div>
        <div id="shell-results" style="font-family: monospace; background: #f4f6f8; padding: 10px; border-radius: 4px;">Ready.</div>
      </div>
  `;

  decorateSourceDataPanels(container);
  renderMiscCalcConsole(container.querySelector('#misc-calc-console-container'));
  attachSourceDataPanelEvents(container);


  const getUnitMode = () => { const mode = container.querySelector('#mc-unit-mode').value; UnitSystem.setInputMode(mode); return mode; };
  UnitSystem.setInputMode(container.querySelector('#mc-unit-mode')?.value || 'Native');
  container.querySelector('#mc-unit-mode')?.addEventListener('change', () => UnitSystem.setInputMode(container.querySelector('#mc-unit-mode').value));
  const titleEl = container.querySelector('#calc-title');
  const svgContainer = container.querySelector('#svg-container');

  const updateSvg = (target) => {
    let svgHtml = '<span style="color: #888;">[No sketch available]</span>';
    try {
      if (target === 'mc-skirt') {
        const t_wall_el = container.querySelector('#mc-skirt-t-wall');
        svgHtml = generateSkirtSvg({
          ta: parseFloat(container.querySelector('#mc-skirt-ta').value),
          t: parseFloat(container.querySelector('#mc-skirt-t').value),
          h: parseFloat(container.querySelector('#mc-skirt-h').value),
          t_wall: t_wall_el ? parseFloat(t_wall_el.value) : 18,
        });
      } else if (target === 'mc-trunnion') {
        svgHtml = generateTrunnionSvg({
          od: parseFloat(container.querySelector('#mc-trun-od').value),
          wall: parseFloat(container.querySelector('#mc-trun-wall').value),
          fx: parseFloat(container.querySelector('#mc-trun-fx').value),
          fy: parseFloat(container.querySelector('#mc-trun-fy').value),
          fz: parseFloat(container.querySelector('#mc-trun-fz').value),
          l: parseFloat(container.querySelector('#mc-trun-l')?.value || 300),
        });
      } else if (target === 'mc-momentum') {
        const velEl = container.querySelector('.calc-mom-vel');
        const densEl = container.querySelector('.calc-mom-dens');
        svgHtml = generateMomentumSvg({
          v: velEl ? parseFloat(velEl.value) : 0,
          density: densEl ? parseFloat(densEl.value) : 0
        });
      } else if (target === 'mc-rvforce') {
        svgHtml = generateRvSvg({
          pset: parseFloat(container.querySelector('#mc-rv-pset').value),
          w: parseFloat(container.querySelector('#mc-rv-w').value),
          ae: parseFloat(container.querySelector('#mc-rv-ae').value),
        });
      } else if (target === 'mc-liquidrelief') {
        svgHtml = generateLiquidReliefSvg({
          mode: container.querySelector('#mc-lr-mode').value,
          rho: parseFloat(container.querySelector('#mc-lr-rho').value),
          vel: parseFloat(container.querySelector('#mc-lr-v').value),
          q: parseFloat(container.querySelector('#mc-lr-q').value),
          mdot: parseFloat(container.querySelector('#mc-lr-mdot').value),
          ae: parseFloat(container.querySelector('#mc-lr-ae').value),
          pe: parseFloat(container.querySelector('#mc-lr-pe').value),
          pressureThrustIncluded: container.querySelector('#mc-lr-ptrust').checked
        });
      } else if (target === 'mc-psvopen') {
        svgHtml = generatePsvOpenSvg({
          pset: parseFloat(container.querySelector('#mc-psvopen-pset').value),
          w: parseFloat(container.querySelector('#mc-psvopen-w').value),
          orificeLetter: container.querySelector('#mc-psvopen-letter').value,
          od: parseFloat(container.querySelector('#mc-psvopen-od').value),
          wall: parseFloat(container.querySelector('#mc-psvopen-wall').value),
          workingValves: parseInt(container.querySelector('#mc-psvopen-valves').value) || 1,
          impactFactor: parseFloat(container.querySelector('#mc-psvopen-impact').value) || 2
        });
      } else if (target === 'mc-bdliquid') {
        svgHtml = generateBurstingDiscLiquidSvg({});
      } else if (target === 'mc-blast') {
        svgHtml = generateBlastSvg({
          blastPressure: parseFloat(container.querySelector('#mc-blast-pressure').value),
          exposedArea: parseFloat(container.querySelector('#mc-blast-area').value),
          coefficient: parseFloat(container.querySelector('#mc-blast-coeff').value)
        });
      } else if (target === 'mc-flange-check') {
        svgHtml = generateFlangeCheckSvg({
          method: container.querySelector('#mc-fc-method').value,
          nps: parseFloat(container.querySelector('#mc-fc-nps').value),
          rating: parseFloat(container.querySelector('#mc-fc-rating').value),
          material: container.querySelector('#mc-fc-mat').value,
          ur: window._lastFlangeUr // mock up state bridge
        });
      } else if (target === 'mc-gre-flange') {
        svgHtml = generateGreFlangeSvg({});
      } else if (target === 'mc-api610') {
        svgHtml = generateApi610Svg({
          pumpType: container.querySelector('#mc-api-pumptype').value
        });
      } else if (target === 'mc-aiv-fiv') {
        svgHtml = generateAivFivSvg({
          mode: container.querySelector('#mc-aiv-mode').value
        });
      } else if (target === 'mc-ext-pressure') {
        svgHtml = generateExtPressureSvg({
          p: parseFloat(container.querySelector('#mc-ext-p').value)
        });
      } else if (target === 'mc-welded-shoe') {
        svgHtml = generateWeldedShoeSvg({
          od: parseFloat(container.querySelector('#mc-ws-od').value)
        });
      } else if (target === 'mc-nema') {
        const selectedNode = container.querySelector('#mc-nema-node').value;
        const nodeForces = forces.filter(f => f.node === selectedNode);
        const fx = nodeForces.length ? parseFloat(nodeForces[0].fx) || 0 : 0;
        const fy = nodeForces.length ? parseFloat(nodeForces[0].fy) || 0 : 0;
        const fz = nodeForces.length ? parseFloat(nodeForces[0].fz) || 0 : 0;
        const mx = parseFloat(container.querySelector('#mc-nema-mx').value) || 0;
        const my = parseFloat(container.querySelector('#mc-nema-my').value) || 0;
        const mz = parseFloat(container.querySelector('#mc-nema-mz').value) || 0;
        svgHtml = generateNemaSvg({
          fx, fy, fz, mx, my, mz,
          de: parseFloat(container.querySelector('#mc-nema-de').value) || 10
        });
      } else if (target === 'mc-slug') {
        svgHtml = generateSlugSvg(currentSlugResolverPayload);
      } else if (target === 'mc-shellindent') {
        svgHtml = generateShellIndentSvg(currentShellResolverPayload);
      }
    } catch (e) {
      console.error("SVG Generation error", e);
    }
    svgContainer.innerHTML = svgHtml;
  };

  // Setup live input listeners for SVG
  container.querySelectorAll('input, select').forEach(inp => {
    inp.addEventListener('input', () => {
      const activeTab = container.querySelector('.calc-nav-item.active');
      if (activeTab) updateSvg(activeTab.getAttribute('data-target'));
    });
  });

  // Wire Tab Buttons in Sidebar
  const navItems = container.querySelectorAll('.calc-nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const target = item.getAttribute('data-target');
      titleEl.textContent = item.textContent;

      navItems.forEach(x => {
        x.classList.remove('active');
        x.style.background = 'transparent';
      });
      item.classList.add('active');
      item.style.background = '#e0f0ff';

      container.querySelectorAll('.panel-content').forEach(x => {
        x.classList.remove('active');
        x.style.display = 'none';
      });
      const panel = container.querySelector('#' + target);
      if (panel) {
        panel.classList.add('active');
        panel.style.display = 'block';
      }

      updateSvg(target);
    });
  });

  // Init SVG
  updateSvg('mc-skirt');

  // Skirt Logic
  container.querySelector('#btn-calc-skirt')?.addEventListener('click', () => {
    const ta = parseFloat(container.querySelector('#mc-skirt-ta').value);
    const t = parseFloat(container.querySelector('#mc-skirt-t').value);
    const k = parseFloat(container.querySelector('#mc-skirt-k').value);
    const h = parseFloat(container.querySelector('#mc-skirt-h').value);

    const calc = getCalculator('mc-skirt');
    const envelope = runCalculation(calc, { ta, t, k, h }, getUnitMode());
    setSession(envelope); appendToHistory(envelope); appendToHistory(envelope);

    if (envelope.pass && envelope.outputs.profile) {
      let res = `<strong>ΔT = ${envelope.outputs.deltaT} &deg;C</strong><br><br>`;
      res += `<table class="data-table"><thead><tr><th>Distance from Top (x)</th><th>Temp (Tx)</th></tr></thead><tbody>`;
      for (const p of envelope.outputs.profile) {
         res += `<tr><td>${p.x.toFixed(0)} mm</td><td>${p.tx.toFixed(2)} &deg;C</td></tr>`;
      }
      res += `</tbody></table>`;
      container.querySelector('#skirt-results').innerHTML = res;
    }
  });

  // Trunnion Logic
  container.querySelector('#btn-calc-trunnion')?.addEventListener('click', () => {
    const od = parseFloat(container.querySelector('#mc-trun-od').value);
    const wall = parseFloat(container.querySelector('#mc-trun-wall').value);
    const fx = parseFloat(container.querySelector('#mc-trun-fx').value);
    const fy = parseFloat(container.querySelector('#mc-trun-fy').value);
    const fz = parseFloat(container.querySelector('#mc-trun-fz').value);
    const L = parseFloat(container.querySelector('#mc-trun-l')?.value || 300);

    const calc = getCalculator('mc-trunnion');
    const envelope = runCalculation(calc, { od, wall, fx, fy, fz, L }, getUnitMode());
    setSession(envelope); appendToHistory(envelope); appendToHistory(envelope);

    if (envelope.pass && envelope.outputs) {
      const o = envelope.outputs;
      const i = envelope.intermediateValues;
      const uMode = getUnitMode();
      const stressUnit = uMode === 'Imperial' ? 'psi' : 'MPa';
      let res = `<strong>Section Modulus (Z):</strong> ${i.Z.toFixed(2)} mm³<br>`;
      res += `<strong>Cross Area (A):</strong> ${i.area.toFixed(2)} mm²<br><br>`;
      res += `<strong>Axial Stress (Fx/A):</strong> ${o.axialStress.toFixed(2)} ${stressUnit}<br>`;
      res += `<strong>Shear Stress (V/A):</strong> ${o.shearStress.toFixed(2)} ${stressUnit}<br>`;
      res += `<strong>Bending Stress (V*L/Z):</strong> ${o.bendingStress.toFixed(2)} ${stressUnit}<br>`;
      res += `<strong>Combined Stress:</strong> ${o.combinedStress.toFixed(2)} ${stressUnit}<br>`;
      container.querySelector('#trunnion-results').innerHTML = res;
    }
  });

  // Momentum Calc Logic
  container.querySelector('#btn-calc-momentum')?.addEventListener('click', () => {
    const rows = container.querySelectorAll('#table-momentum tbody tr[data-area]');
    const pipes = [];
    rows.forEach((r, idx) => {
      const area = parseFloat(r.dataset.area);
      const density = parseFloat(r.querySelector('.calc-mom-dens').value);
      const velocity = parseFloat(r.querySelector('.calc-mom-vel').value);
      pipes.push({ area, density, velocity, index: idx });
    });

    const calc = getCalculator('mc-momentum');
    const envelope = runCalculation(calc, { pipes }, getUnitMode());
    setSession(envelope); appendToHistory(envelope); appendToHistory(envelope);

    if (envelope.pass && envelope.outputs.forces) {
      envelope.outputs.forces.forEach(p => {
        if (p.index !== undefined && rows[p.index]) {
            rows[p.index].querySelector('.calc-mom-force').textContent = p.force.toFixed(2);
        }
      });
    }
  });

  // Welded Shoe Logic
  container.querySelector('#btn-calc-welded-shoe')?.addEventListener('click', () => {
    const raw = {
        od: parseFloat(container.querySelector('#mc-ws-od').value),
        t: parseFloat(container.querySelector('#mc-ws-t').value),
        h: parseFloat(container.querySelector('#mc-ws-h').value),
        a: parseFloat(container.querySelector('#mc-ws-a').value),
        fa: parseFloat(container.querySelector('#mc-ws-fa').value),
        fc: parseFloat(container.querySelector('#mc-ws-fc').value)
    };
    
    const calc = getCalculator('mc-welded-shoe');
    const unitMode = getUnitMode();
    const envelope = runCalculation(calc, raw, unitMode);
    setSession(envelope); appendToHistory(envelope);
    
    if (envelope.outputs) {
        updateSvg('mc-welded-shoe');
        let resHtml = `
        <table class="data-table" style="width:100%;">
          <thead><tr><th>Parameter</th><th>Value</th></tr></thead>
          <tbody>
            <tr><td>Max Stress at Shoe</td><td>${envelope.outputs.maxShoeStress || 0}</td></tr>
            <tr><td>Max Stress at Pad Edge</td><td>${envelope.outputs.maxPadStress || 0}</td></tr>
            <tr><td>Min Fillet Size (Shoe)</td><td>${envelope.outputs.minFilletShoe || 0}</td></tr>
            <tr><td>Min Fillet Size (Pad)</td><td>${envelope.outputs.minFilletPad || 0}</td></tr>
            <tr><td colspan="2" class="muted">Benchmark: ${envelope.benchmark.status}</td></tr>
          </tbody>
        </table>`;
        container.querySelector('#mc-welded-shoe-results').innerHTML = resHtml;
    }
  });

  // External Pressure Logic
  container.querySelector('#btn-calc-ext-pressure')?.addEventListener('click', () => {
    const raw = {
        do: parseFloat(container.querySelector('#mc-ext-do').value),
        t: parseFloat(container.querySelector('#mc-ext-t').value),
        L: parseFloat(container.querySelector('#mc-ext-l').value),
        p: parseFloat(container.querySelector('#mc-ext-p').value),
        temp: parseFloat(container.querySelector('#mc-ext-temp').value)
    };
    
    const calc = getCalculator('mc-ext-pressure');
    const unitMode = getUnitMode();
    const envelope = runCalculation(calc, raw, unitMode);
    setSession(envelope); appendToHistory(envelope);
    
    if (envelope.outputs) {
        updateSvg('mc-ext-pressure');
        let resHtml = `
        <table class="data-table" style="width:100%;">
          <thead><tr><th>Parameter</th><th>Value</th></tr></thead>
          <tbody>
            <tr><td>MAWEP</td><td>${envelope.outputs.mawep || 0}</td></tr>
            <tr><td>Required Thickness</td><td>${envelope.outputs.requiredThickness || 0}</td></tr>
            <tr><td colspan="2" class="muted">Benchmark: ${envelope.benchmark.status}</td></tr>
          </tbody>
        </table>`;
        container.querySelector('#mc-ext-pressure-results').innerHTML = resHtml;
    }
  });

  // AIV / FIV Logic
  container.querySelector('#btn-calc-aiv')?.addEventListener('click', () => {
    const raw = {
        mode: container.querySelector('#mc-aiv-mode').value,
        flow: parseFloat(container.querySelector('#mc-aiv-flow').value),
        nps: parseFloat(container.querySelector('#mc-aiv-nps').value),
        support: container.querySelector('#mc-aiv-support').value
    };
    
    const calc = getCalculator('mc-aiv-fiv');
    const unitMode = getUnitMode();
    const envelope = runCalculation(calc, raw, unitMode);
    setSession(envelope); appendToHistory(envelope);
    
    if (envelope.outputs) {
        updateSvg('mc-aiv-fiv');
        let resHtml = `
        <table class="data-table" style="width:100%;">
          <thead><tr><th>Parameter</th><th>Value</th></tr></thead>
          <tbody>
            <tr><td>Peak Force (Fmax)</td><td>${envelope.outputs.fmax || 0}</td></tr>
            <tr><td>Limit Force (Flim)</td><td>${envelope.outputs.flim || 0}</td></tr>
            <tr style="font-weight:bold; background:#fff3cd; color:#856404;"><td>Likelihood of Failure (LOF)</td><td>${envelope.outputs.lof || 0}</td></tr>
            <tr><td colspan="2" class="muted">Benchmark: ${envelope.benchmark.status}</td></tr>
          </tbody>
        </table>`;
        container.querySelector('#mc-aiv-results').innerHTML = resHtml;
    }
  });

  // API 610 Logic
  container.querySelector('#btn-calc-api610')?.addEventListener('click', () => {
     const raw = {
        pumpType: container.querySelector('#mc-api-pumptype').value,
        shaftAxis: container.querySelector('#mc-api-shaftaxis').value,
        suctionAxis: container.querySelector('#mc-api-suctionaxis').value,
        apiFactor: parseFloat(container.querySelector('#mc-api-factor').value) || 1,
        suctionNS: parseFloat(container.querySelector('#mc-api-sucns').value) || 2,
        dischargeNS: parseFloat(container.querySelector('#mc-api-disns').value) || 2,
        s_fx: parseFloat(container.querySelector('#mc-api-s-fx').value) || 0,
        s_fy: parseFloat(container.querySelector('#mc-api-s-fy').value) || 0,
        s_fz: parseFloat(container.querySelector('#mc-api-s-fz').value) || 0,
        s_mx: parseFloat(container.querySelector('#mc-api-s-mx').value) || 0,
        s_my: parseFloat(container.querySelector('#mc-api-s-my').value) || 0,
        s_mz: parseFloat(container.querySelector('#mc-api-s-mz').value) || 0,
        d_fx: parseFloat(container.querySelector('#mc-api-d-fx').value) || 0,
        d_fy: parseFloat(container.querySelector('#mc-api-d-fy').value) || 0,
        d_fz: parseFloat(container.querySelector('#mc-api-d-fz').value) || 0,
        d_mx: parseFloat(container.querySelector('#mc-api-d-mx').value) || 0,
        d_my: parseFloat(container.querySelector('#mc-api-d-my').value) || 0,
        d_mz: parseFloat(container.querySelector('#mc-api-d-mz').value) || 0
     };
     
     const calc = getCalculator('mc-api610');
     const unitMode = getUnitMode();
     const envelope = runCalculation(calc, raw, unitMode);
     setSession(envelope); appendToHistory(envelope);

     if (envelope.outputs) {
         updateSvg('mc-api610');
         const o = envelope.outputs;
         
         const renderSection = (label, obj) => {
             return `
             <div style="flex:1; min-width:300px;">
               <h4>${label}</h4>
               <table class="data-table" style="width:100%; font-size:11px;">
                 <thead><tr><th>Component</th><th>Allowable</th><th>Actual</th><th>Status</th></tr></thead>
                 <tbody>
                   ${['F1','F2','F3','FR','M1','M2','M3','MR'].map(k => {
                       const act = k.length === 2 && k.startsWith('F') ? obj.actual.F[k[1]] : 
                                   k.length === 2 && k.startsWith('M') ? obj.actual.M[k[1]] : 
                                   k === 'FR' ? obj.actual.F.R : obj.actual.M.R;
                       const status = obj.pass[k] ? '<span style="color:green;">PASS</span>' : '<span style="color:red;">FAIL</span>';
                       return `<tr><td>${k}</td><td>${obj.allowable[k].toFixed(0)}</td><td>${act.toFixed(0)}</td><td>${status}</td></tr>`;
                   }).join('')}
                 </tbody>
               </table>
             </div>`;
         };

         const resHtml = `<div style="display:flex; gap:20px; flex-wrap:wrap;">
            ${renderSection('Suction Nozzle Check', o.suction)}
            ${renderSection('Discharge Nozzle Check', o.discharge)}
         </div>`;
         container.querySelector('#mc-api610-results').innerHTML = resHtml;
     } else {
         container.querySelector('#mc-api610-results').innerHTML = `<p style="color:red;">Errors occurred. Check console.</p>`;
     }
  });

  // GRE Flange Logic
  container.querySelector('#btn-calc-gre-flange')?.addEventListener('click', () => {
    const raw = {};
    const calc = getCalculator('mc-gre-flange');
    const unitMode = getUnitMode();
    const envelope = runCalculation(calc, raw, unitMode);
    setSession(envelope); appendToHistory(envelope);
    
    if (envelope.outputs) {
        updateSvg('mc-gre-flange');
        let resHtml = `
        <table class="data-table" style="width:100%;">
          <thead><tr><th>Parameter</th><th>Value</th></tr></thead>
          <tbody>
            <tr><td>Equivalent Pressure</td><td>${envelope.outputs.eqPressure || 0}</td></tr>
            <tr><td>Status</td><td>${envelope.outputs.status || 'PENDING'}</td></tr>
            <tr><td colspan="2" class="muted">Benchmark: ${envelope.benchmark.status}</td></tr>
          </tbody>
        </table>`;
        container.querySelector('#mc-gre-flange-results').innerHTML = resHtml;
    }
  });

  
// Flange Check Logic
container.querySelector('#btn-calc-flangecheck')?.addEventListener('click', () => {
  const raw = {
    method: container.querySelector('#mc-fc-method').value,
    p_actual: parseFloat(container.querySelector('#mc-fc-p').value) || 0,
    f_axial: parseFloat(container.querySelector('#mc-fc-fx').value) || 0,
    mx: parseFloat(container.querySelector('#mc-fc-mx').value) || 0,
    my: parseFloat(container.querySelector('#mc-fc-my').value) || 0,
    mz: parseFloat(container.querySelector('#mc-fc-mz').value) || 0,
    t1: parseFloat(container.querySelector('#mc-fc-t1').value) || 0,
    nps: parseFloat(container.querySelector('#mc-fc-nps').value) || 0,
    rating: parseFloat(container.querySelector('#mc-fc-rating').value) || 0,
    material: container.querySelector('#mc-fc-mat').value
  };

  const calc = getCalculator('mc-flange-check');
  const unitMode = getUnitMode();
  const envelope = runCalculation(calc, raw, unitMode);
  setSession(envelope); appendToHistory(envelope);

  if (envelope.outputs) {
    updateSvg('mc-flange-check');
    const o = envelope.outputs;
    const mDisp = o.display?.m_res || UnitSystem.format(o.m_res || 0, 'moment', unitMode, 'N-mm');
    const fDisp = o.display?.f_ax_tension || UnitSystem.format(o.f_ax_tension || 0, 'force', unitMode, 'N');
    let warningsHtml = '';
    if (envelope.warnings?.length) {
      warningsHtml = `<div style="margin-top:10px; color:#c00;"><strong>Assumptions/Warnings:</strong><ul>${envelope.warnings.map(w => `<li>${w}</li>`).join('')}</ul></div>`;
    }
    let benchHtml = '';
    if (envelope.benchmark) {
      benchHtml = `<div style="margin-top:10px; padding:6px; background:#eef5ff; border:1px solid #c9d9ff;"><strong>Benchmark:</strong> ${envelope.benchmark.status}${envelope.benchmark.configuredCases ? ` (${envelope.benchmark.configuredCases} configured cases)` : ''}</div>`;
    }
    let res = `<table class="data-table" style="width:100%;">
      <thead><tr><th>Component</th><th>Value</th></tr></thead>
      <tbody>
        <tr><td>Resultant Moment</td><td>${mDisp.value.toFixed(2)} ${mDisp.unit}</td></tr>
        <tr><td>Axial Tension</td><td>${fDisp.value.toFixed(2)} ${fDisp.unit}</td></tr>
        <tr><td>Pressure Ratio (rP)</td><td>${o.rP.toFixed(3)}</td></tr>
        <tr><td>Force Ratio (rF)</td><td>${o.rF.toFixed(3)}</td></tr>
        <tr><td>Moment Ratio (rM)</td><td>${o.rM.toFixed(3)}</td></tr>
        <tr style="background:#eef5ff; font-weight:bold;"><td>Interaction</td><td>${o.interaction.toFixed(3)}</td></tr>
        <tr style="background:${envelope.pass ? '#e8f5e9' : '#ffebee'}; font-weight:bold; color:${envelope.pass ? 'green' : 'red'};"><td>Usage Ratio (UR)</td><td>${o.ur.toFixed(3)}</td></tr>
      </tbody>
    </table>${benchHtml}${warningsHtml}`;
    container.querySelector('#mc-flangecheck-results').innerHTML = res;
  } else {
    container.querySelector('#mc-flangecheck-results').innerHTML = `<p style="color:red;">Errors occurred. Check console.</p>`;
  }
});

  // Flange Master Table Logic
  const extractTabBtn = container.querySelector('#btn-flange-extraction-tab');
  const masterTabBtn = container.querySelector('#btn-flange-master-tab');
  const extractContent = container.querySelector('#flange-extraction-content');
  const masterContent = container.querySelector('#flange-master-content');
  const masterSelect = container.querySelector('#mc-flange-master-select');
  const masterContainer = container.querySelector('#mc-flange-master-table-container');

  if (extractTabBtn && masterTabBtn) {
      extractTabBtn.addEventListener('click', () => {
          extractTabBtn.classList.add('btn-primary');
          extractTabBtn.classList.remove('btn-secondary');
          masterTabBtn.classList.add('btn-secondary');
          masterTabBtn.classList.remove('btn-primary');
          extractContent.style.display = 'block';
          masterContent.style.display = 'none';
      });

      masterTabBtn.addEventListener('click', () => {
          masterTabBtn.classList.add('btn-primary');
          masterTabBtn.classList.remove('btn-secondary');
          extractTabBtn.classList.add('btn-secondary');
          extractTabBtn.classList.remove('btn-primary');
          extractContent.style.display = 'none';
          masterContent.style.display = 'block';
          renderMasterTable();
      });
  }

  function renderMasterTable() {
      if (!masterSelect || !masterContainer) return;
      const selected = masterSelect.value;
      let data = [];
      if (selected === 'tblFlangeMaterial') data = tblFlangeMaterial;
      else if (selected === 'Flange_Allowable') data = Flange_Allowable;
      else if (selected === 'FlangeUG44bDB') data = FlangeUG44bDB;
      else if (selected === 'tblPipeSizeSch') data = tblPipeSizeSch;
      else if (selected === 'tblAPI610_Discharge') data = tblAPI610_Discharge;
      else if (selected === 'tblAPI610_Suction') data = tblAPI610_Suction;
      else if (selected === 'tblAPI610_AxisMatch') data = tblAPI610_AxisMatch;

      if (!data || data.length === 0) {
          masterContainer.innerHTML = '<p class="muted">No data available.</p>';
          return;
      }

      const keys = Object.keys(data[0]);
      let html = `<table class="data-table" style="width:100%; white-space: nowrap;">`;
      html += `<thead><tr>${keys.map(k => `<th>${k}</th>`).join('')}</tr></thead>`;
      html += `<tbody>`;
      data.forEach(row => {
          html += `<tr>${keys.map(k => {
              let val = row[k];
              if (val === null || val === undefined) val = '-';
              else if (typeof val === 'object') val = JSON.stringify(val);
              return `<td>${val}</td>`;
          }).join('')}</tr>`;
      });
      html += `</tbody></table>`;
      masterContainer.innerHTML = html;
  }

  if (masterSelect) {
      masterSelect.addEventListener('change', renderMasterTable);
  }

  // Flange Leakage Logic
  container.querySelector('#btn-calc-flange')?.addEventListener('click', () => {
     const calc = getCalculator('mc-flange');
     const envelope = runCalculation(calc, { flanges }, getUnitMode());
     setSession(envelope); appendToHistory(envelope); appendToHistory(envelope);
  });

  // Force Summary Logic
  container.querySelector('#btn-calc-force')?.addEventListener('click', () => {
     const calc = getCalculator('mc-force');
     const envelope = runCalculation(calc, { forces }, getUnitMode());
     setSession(envelope); appendToHistory(envelope); appendToHistory(envelope);
  });

  // Relief Valve Logic
  // Liquid Relief UI mode toggle
  const lrModeSelect = container.querySelector('#mc-lr-mode');
  if (lrModeSelect) {
    lrModeSelect.addEventListener('change', (e) => {
      const mode = e.target.value;
      container.querySelectorAll('.lr-mode-row').forEach(row => row.style.display = 'none');
      if (mode === 'velocity') {
        container.querySelectorAll('.lr-vel').forEach(row => row.style.display = 'table-row');
      } else if (mode === 'flow-rate') {
        container.querySelectorAll('.lr-flow').forEach(row => row.style.display = 'table-row');
      } else if (mode === 'combined') {
        container.querySelectorAll('.lr-comb').forEach(row => row.style.display = 'table-row');
      }
      updateSvg('mc-liquidrelief');
    });
  }

  // Liquid Relief Logic
  container.querySelector('#btn-calc-liquidrelief')?.addEventListener('click', () => {
    const mode = container.querySelector('#mc-lr-mode').value;
    const rho = parseFloat(container.querySelector('#mc-lr-rho').value) || 0;
    const ae = parseFloat(container.querySelector('#mc-lr-ae').value) || 0;
    const pa = parseFloat(container.querySelector('#mc-lr-pa').value) || 0;
    const daf = parseFloat(container.querySelector('#mc-lr-daf').value) || 1.0;
    const pressureThrustIncluded = container.querySelector('#mc-lr-ptrust').checked;
    
    let v = 0, q = 0, mdot = 0, pe = 0;
    if (mode === 'velocity' || mode === 'combined') v = parseFloat(container.querySelector('#mc-lr-v').value) || 0;
    if (mode === 'flow-rate') {
      q = parseFloat(container.querySelector('#mc-lr-q').value) || 0;
      mdot = parseFloat(container.querySelector('#mc-lr-mdot').value) || 0;
    }
    if (mode === 'combined') pe = parseFloat(container.querySelector('#mc-lr-pe').value) || 0;

    const calc = getCalculator('mc-liquidrelief');
    const unitMode = getUnitMode();
    const envelope = runCalculation(calc, { mode, rho, ae, pa, daf, pressureThrustIncluded, v, q, mdot, pe }, unitMode);
    setSession(envelope); appendToHistory(envelope);

    if (envelope.pass && envelope.outputs) {
      const o = envelope.outputs;
      const fUnit = UnitSystem.format(0, 'force', unitMode).unit;
      const vUnit = UnitSystem.format(0, 'velocity', unitMode).unit;
      
      let warningsHtml = '';
      if (envelope.warnings.length) {
        warningsHtml = `<div style="margin-top:10px; color:#c00;"><strong>Assumptions/Warnings:</strong><ul>${envelope.warnings.map(w => `<li>${w}</li>`).join('')}</ul></div>`;
      }

      let res = `<table class="data-table" style="width:100%;">
        <thead><tr><th>Component</th><th>Value</th><th>Unit</th></tr></thead>
        <tbody>
          <tr><td>Discharge Velocity</td><td>${o.velocity}</td><td>${vUnit}</td></tr>
          <tr><td>Momentum Force</td><td>${o.force_momentum}</td><td>${fUnit}</td></tr>
          <tr><td>Pressure Thrust Force</td><td>${o.force_pressure}</td><td>${fUnit}</td></tr>
          <tr style="background:#f4f9ff; font-weight:bold;"><td>Total Reaction Force</td><td>${o.force_total}</td><td>${fUnit}</td></tr>
        </tbody>
      </table>
      ${warningsHtml}`;
      container.querySelector('#mc-liquidrelief-results').innerHTML = res;
    } else {
      container.querySelector('#mc-liquidrelief-results').innerHTML = `<p style="color:red;">Errors occurred. Check console.</p>`;
    }
  });

  // PSV Open UI toggle
  const psvOriModeSelect = container.querySelector('#mc-psvopen-orimode');
  if (psvOriModeSelect) {
    psvOriModeSelect.addEventListener('change', (e) => {
      const mode = e.target.value;
      if (mode === 'letter') {
        container.querySelector('#row-psvopen-letter').style.display = 'table-row';
        container.querySelector('#row-psvopen-area').style.display = 'none';
      } else {
        container.querySelector('#row-psvopen-letter').style.display = 'none';
        container.querySelector('#row-psvopen-area').style.display = 'table-row';
      }
      updateSvg('mc-psvopen');
    });
  }

  
// Blast Logic
container.querySelector('#btn-calc-blast')?.addEventListener('click', () => {
  const raw = {
    blastPressure: parseFloat(container.querySelector('#mc-blast-pressure').value) || 0,
    exposedArea: parseFloat(container.querySelector('#mc-blast-area').value) || 0,
    coefficient: parseFloat(container.querySelector('#mc-blast-coeff').value) || 0
  };

  const calc = getCalculator('mc-blast');
  const unitMode = getUnitMode();
  const envelope = runCalculation(calc, raw, unitMode);
  setSession(envelope); appendToHistory(envelope);

  if (envelope.outputs) {
    const disp = envelope.outputs.display?.resultantLoad || UnitSystem.format(envelope.outputs.resultantLoad || 0, 'force', unitMode, 'N');
    let warningsHtml = envelope.warnings?.length ? `<div style="margin-top:10px; color:#c00;"><strong>Assumptions/Warnings:</strong><ul>${envelope.warnings.map(w => `<li>${w}</li>`).join('')}</ul></div>` : '';
    let bmarkHtml = envelope.benchmark ? `<div style="margin-top:10px; padding: 5px; background: #eee; border: 1px solid #ccc;"><strong>Benchmark Status:</strong> ${envelope.benchmark.status}</div>` : '';
    let sourceHtml = envelope.outputs.configuredTableCounts ? `<div class="muted" style="margin-top:8px;">Source data counts — caseFactors: ${envelope.outputs.configuredTableCounts.caseFactors}, pressureCoefficients: ${envelope.outputs.configuredTableCounts.pressureCoefficients}, dragFactors: ${envelope.outputs.configuredTableCounts.dragFactors}</div>` : '';
    let res = `<table class="data-table" style="width:100%;"><thead><tr><th>Component</th><th>Value</th></tr></thead><tbody><tr><td>Resultant Load</td><td>${disp.value.toFixed(2)} ${disp.unit}</td></tr></tbody></table>${sourceHtml}${warningsHtml}${bmarkHtml}`;
    container.querySelector('#mc-blast-results').innerHTML = res;
  } else {
    container.querySelector('#mc-blast-results').innerHTML = `<p style="color:red;">Errors occurred. Check console.</p>`;
  }
});

  
// Bursting Disc Liquid Logic
container.querySelector('#btn-calc-bdliquid')?.addEventListener('click', () => {
  const raw = {
    burstPressure: parseFloat(container.querySelector('#mc-bdliquid-burst').value) || 0,
    downstreamPressure: parseFloat(container.querySelector('#mc-bdliquid-down').value) || 0,
    liquidDensity: parseFloat(container.querySelector('#mc-bdliquid-rho').value) || 0
  };

  const calc = getCalculator('mc-bdliquid');
  const unitMode = getUnitMode();
  const envelope = runCalculation(calc, raw, unitMode);
  setSession(envelope); appendToHistory(envelope);

  if (envelope.outputs) {
    const disp = envelope.outputs.display?.resultantLoad || UnitSystem.format(envelope.outputs.resultantLoad || 0, 'force', unitMode, 'N');
    let warningsHtml = envelope.warnings?.length ? `<div style="margin-top:10px; color:#c00;"><strong>Assumptions/Warnings:</strong><ul>${envelope.warnings.map(w => `<li>${w}</li>`).join('')}</ul></div>` : '';
    let bmarkHtml = envelope.benchmark ? `<div style="margin-top:10px; padding: 5px; background: #eee; border: 1px solid #ccc;"><strong>Benchmark Status:</strong> ${envelope.benchmark.status}</div>` : '';
    let sourceHtml = envelope.outputs.configuredTableCounts ? `<div class="muted" style="margin-top:8px;">Source data counts — deviceSize: ${envelope.outputs.configuredTableCounts.deviceSize}, coefficients: ${envelope.outputs.configuredTableCounts.coefficients}, correctionFactors: ${envelope.outputs.configuredTableCounts.correctionFactors}</div>` : '';
    let res = `<table class="data-table" style="width:100%;"><thead><tr><th>Component</th><th>Value</th></tr></thead><tbody><tr><td>Resultant Load</td><td>${disp.value.toFixed(2)} ${disp.unit}</td></tr></tbody></table>${sourceHtml}${warningsHtml}${bmarkHtml}`;
    container.querySelector('#mc-bdliquid-results').innerHTML = res;
  } else {
    container.querySelector('#mc-bdliquid-results').innerHTML = `<p style="color:red;">Errors occurred. Check console.</p>`;
  }
});

  
// PSV Open Logic
container.querySelector('#btn-calc-psvopen')?.addEventListener('click', () => {
  const raw = {
    pset: parseFloat(container.querySelector('#mc-psvopen-pset').value) || 0,
    tf: parseFloat(container.querySelector('#mc-psvopen-tf').value) || 0,
    mw: parseFloat(container.querySelector('#mc-psvopen-mw').value) || 28,
    totalDischargeRate: parseFloat(container.querySelector('#mc-psvopen-w').value) || 0,
    workingValves: parseInt(container.querySelector('#mc-psvopen-valves').value) || 1,
    orificeMode: container.querySelector('#mc-psvopen-orimode').value,
    orificeLetter: container.querySelector('#mc-psvopen-letter').value,
    manualOrificeAreaMm2: parseFloat(container.querySelector('#mc-psvopen-area').value) || 0,
    tailpipeOD: parseFloat(container.querySelector('#mc-psvopen-od').value) || 0,
    tailpipeWall: parseFloat(container.querySelector('#mc-psvopen-wall').value) || 0,
    impactFactor: parseFloat(container.querySelector('#mc-psvopen-impact').value) || 2,
    k: parseFloat(container.querySelector('#mc-psvopen-k').value) || 1.4
  };

  const calc = getCalculator('mc-psvopen');
  const unitMode = getUnitMode();
  const envelope = runCalculation(calc, raw, unitMode);
  setSession(envelope); appendToHistory(envelope);

  if (envelope.outputs) {
    const o = envelope.outputs;
    const pDisp = o.display?.pressureAtTip || UnitSystem.format(o.pressureAtTip || 0, 'pressure', unitMode, 'psi');
    const fDisp = o.display?.totalVerticalForceAtElbow || UnitSystem.format(o.totalVerticalForceAtElbow || 0, 'force', unitMode, 'lbf');
    let warningsHtml = envelope.warnings?.length ? `<div style="margin-top:10px; color:#c00;"><strong>Assumptions/Warnings:</strong><ul>${envelope.warnings.map(w => `<li>${w}</li>`).join('')}</ul></div>` : '';
    let bmarkHtml = envelope.benchmark ? `<div style="margin-top:10px; padding: 5px; background: #eee; border: 1px solid #ccc;"><strong>Benchmark Status:</strong> ${envelope.benchmark.status}${envelope.benchmark.configuredCases ? ` (${envelope.benchmark.configuredCases} configured cases)` : ''}</div>` : '';
    let res = `<table class="data-table" style="width:100%;"><thead><tr><th>Component</th><th>Value</th></tr></thead><tbody>
      <tr><td>Pressure at Tip</td><td>${pDisp.value.toFixed(2)} ${pDisp.unit}</td></tr>
      <tr><td>F1</td><td>${o.F1.toFixed(2)} (placeholder)</td></tr>
      <tr><td>F3</td><td>${o.F3.toFixed(2)} (placeholder)</td></tr>
      <tr><td>F4</td><td>${o.F4.toFixed(2)} (placeholder)</td></tr>
      <tr style="background:#f4f9ff; font-weight:bold;"><td>Total Vertical Force At Elbow</td><td>${fDisp.value.toFixed(2)} ${fDisp.unit}</td></tr>
    </tbody></table>${warningsHtml}${bmarkHtml}`;
    container.querySelector('#mc-psvopen-results').innerHTML = res;
  } else {
    container.querySelector('#mc-psvopen-results').innerHTML = `<p style="color:red;">Errors occurred. Check console.</p>`;
  }
});

  // Relief Valve Logic
  container.querySelector('#btn-calc-rv')?.addEventListener('click', () => {
    const pset = parseFloat(container.querySelector('#mc-rv-pset').value) || 0;
    const tf = parseFloat(container.querySelector('#mc-rv-t').value) || 0;
    const k = parseFloat(container.querySelector('#mc-rv-k').value) || 1.4;
    const mw = parseFloat(container.querySelector('#mc-rv-mw').value) || 28;
    const w = parseFloat(container.querySelector('#mc-rv-w').value) || 0;
    const ae = parseFloat(container.querySelector('#mc-rv-ae').value) || 0;
    const pa = parseFloat(container.querySelector('#mc-rv-pa').value) || 14.7;

    const calc = getCalculator('mc-rvforce');
    const unitMode = getUnitMode();
    const envelope = runCalculation(calc, { pset, tf, k, mw, w, ae, pa }, unitMode);
    setSession(envelope); appendToHistory(envelope); appendToHistory(envelope);

    if (envelope.pass && envelope.outputs) {
      const o = envelope.outputs;
      // We rely on UnitSystem to format correctly. ReliefValveCalc outputs normalized values.
      // envelope.outputs contains formatted values! Wait, looking at formulas/relief-valve.js, they are formatted inside the calc.
      // Wait, let's look at relief-valve.js again.
      // Actually, ReliefValveCalc outputs object with .value only, not unit. 
      // Let's use the unit from UnitSystem directly.
      const pUnit = UnitSystem.format(0, 'pressure', unitMode).unit;
      const fUnit = UnitSystem.format(0, 'force', unitMode).unit;
      
      let warningsHtml = '';
      if (envelope.warnings.length) {
        warningsHtml = `<div style="margin-top:10px; color:#c00;"><strong>Assumptions/Warnings:</strong><ul>${envelope.warnings.map(w => `<li>${w}</li>`).join('')}</ul></div>`;
      }

      let res = `<table class="data-table" style="width:100%;">
        <thead><tr><th>Component</th><th>Value</th><th>Unit</th></tr></thead>
        <tbody>
          <tr><td>Exit Pressure Est. (PE)</td><td>${o.pe_gauge.toFixed(2)}</td><td>${pUnit}</td></tr>
          <tr><td>Momentum Force</td><td>${o.force_momentum.toFixed(2)}</td><td>${fUnit}</td></tr>
          <tr><td>Pressure Force</td><td>${o.force_pressure.toFixed(2)}</td><td>${fUnit}</td></tr>
          <tr style="background:#eef;"><td><strong>Total Open Sys Force</strong></td><td><strong>${o.force_open.toFixed(2)}</strong></td><td><strong>${fUnit}</strong></td></tr>
          <tr style="background:#ffe;"><td><strong>Total Closed Sys Force</strong></td><td><strong>${o.force_closed.toFixed(2)}</strong></td><td><strong>${fUnit}</strong></td></tr>
        </tbody>
      </table>`;
      container.querySelector('#rv-results').innerHTML = res;
    }
  });

  // NEMA SM23 Check Logic
  container.querySelector('#btn-calc-nema')?.addEventListener('click', () => {
    const selectedNode = container.querySelector('#mc-nema-node').value;
    const de = parseFloat(container.querySelector('#mc-nema-de').value) || 10;

    if (!selectedNode) {
      container.querySelector('#nema-results').innerHTML = `<span style="color:red">Please select an anchor node first.</span>`;
      return;
    }

    const nodeForces = forces.filter(f => f.node === selectedNode);
    if (!nodeForces.length) {
      container.querySelector('#nema-results').innerHTML = `<span style="color:red">No force records found for node ${selectedNode}.</span>`;
      return;
    }

    const fData = nodeForces[0];
    const fx = parseFloat(fData.fx) || 0;
    const fy = parseFloat(fData.fy) || 0;
    const fz = parseFloat(fData.fz) || 0;
    const mx = parseFloat(container.querySelector('#mc-nema-mx').value) || 0;
    const my = parseFloat(container.querySelector('#mc-nema-my').value) || 0;
    const mz = parseFloat(container.querySelector('#mc-nema-mz').value) || 0;

    const calc = getCalculator('mc-nema');
    const envelope = runCalculation(calc, { fx, fy, fz, mx, my, mz, de }, getUnitMode());
    setSession(envelope); appendToHistory(envelope); appendToHistory(envelope);

    if (envelope.pass && envelope.outputs) {
      const o = envelope.outputs;
      let res = `<table class="data-table" style="width:100%;">
        <thead><tr><th>Parameter</th><th>Value</th></tr></thead>
        <tbody>
          <tr><td>Fx, Fy, Fz</td><td>${fx}, ${fy}, ${fz} N</td></tr>
          <tr><td>Mx, My, Mz</td><td>${mx}, ${my}, ${mz} N-m</td></tr>
          <tr><td>Resultant Force (Fr)</td><td>${o.fr_lbf.toFixed(2)} lbf</td></tr>
          <tr><td>Resultant Moment (Mr)</td><td>${o.mr_lbf_ft.toFixed(2)} lbf-ft</td></tr>
          <tr><td>Combined (3F + M)</td><td>${o.combined_load.toFixed(2)}</td></tr>
          <tr><td>Allowable (500 * De)</td><td>${o.allowable.toFixed(2)}</td></tr>
          <tr><td><strong>Ratio</strong></td><td><strong style="color:${o.pass ? 'green' : 'red'}">${o.ratio.toFixed(2)}% (${o.pass ? 'PASS' : 'FAIL'})</strong></td></tr>
        </tbody>
      </table>`;
      container.querySelector('#nema-results').innerHTML = res;
    }
  });

  // Slug Resolve & Calc
  container.querySelector('#btn-slug-resolve')?.addEventListener('click', () => {
     const elId = container.querySelector('#mc-slug-element').value;
     const bendNode = container.querySelector('#mc-slug-bend').value;

     const element = parsed?.elements?.find(e => String(e.id || e.SEQ_NO) === elId) || null;
     const bend = parsed?.bends?.find(b => String(b.node) === bendNode) || null;

     const manualInputs = {
         od: parseFloat(container.querySelector('#mc-slug-od').value) || 0,
         wall: parseFloat(container.querySelector('#mc-slug-wall').value) || 0,
         fluidDensity: parseFloat(container.querySelector('#mc-slug-dens').value) || 0,
         runLength: parseFloat(container.querySelector('#mc-slug-len').value) || 0,
         velocity: parseFloat(container.querySelector('#mc-slug-vel').value) || 0,
         slugLength: parseFloat(container.querySelector('#mc-slug-sluglen').value) || 0,
         daf: parseFloat(container.querySelector('#mc-slug-daf').value) || 2.0,
         lineRef: container.querySelector('#mc-slug-line').value || ""
     };

     const payload = resolveSlugInputs({ element, bend }, manualInputs);
     currentSlugResolverPayload = payload;

     // Render Resolution Table
     let html = `<table class="data-table" style="width:100%; font-size:11px;">
        <thead><tr><th>Field</th><th>Value</th><th>Unit</th><th>Source</th><th>Notes</th></tr></thead>
        <tbody>`;

     for (const [k, v] of Object.entries(payload.resolutionLog)) {
         html += `<tr>
            <td>${v.field}</td>
            <td><strong>${typeof v.value === 'number' ? v.value.toFixed(2) : v.value}</strong></td>
            <td>${v.unit}</td>
            <td><span style="color:${v.sourceType === 'parsed' ? 'green' : v.sourceType === 'linelist' ? 'blue' : 'orange'}">${v.sourceType}</span></td>
            <td>${v.fallbackReason || v.sourcePath}</td>
         </tr>`;
     }
     html += `</tbody></table>`;

     const resTable = container.querySelector('#slug-resolution-table');
     resTable.innerHTML = html;
     resTable.style.display = 'block';

     const btnCalc = container.querySelector('#btn-calc-slug');
     btnCalc.disabled = false;
     btnCalc.classList.replace('btn-secondary', 'btn-primary');

     updateSvg('mc-slug');
  });

  container.querySelector('#btn-calc-slug')?.addEventListener('click', () => {
      if (!currentSlugResolverPayload) return;

      const calc = getCalculator('mc-slug');
      const envelope = runCalculation(calc, currentSlugResolverPayload, getUnitMode());
      setSession(envelope); appendToHistory(envelope); appendToHistory(envelope);

      if (envelope.pass && envelope.outputs) {
          const o = envelope.outputs;
          const i = envelope.intermediateValues;
          let res = `<strong>Slug Mass:</strong> ${i.slugMass.toFixed(2)} kg<br>`;
          res += `<strong>Steady Flow Force:</strong> ${i.steadyForce.toFixed(2)} N<br>`;
          if (i.f_bend > 0) res += `<strong>Bend Force:</strong> ${i.f_bend.toFixed(2)} N<br>`;
          res += `<br><strong style="color:red; font-size:1.2em;">Amplified Force (DAF): ${o.f_amp.toFixed(2)} N</strong>`;

          container.querySelector('#slug-results').innerHTML = res;
      }
  });

  // Shell Indentation Resolve & Calc
  container.querySelector('#btn-shell-resolve')?.addEventListener('click', () => {
     const elId = container.querySelector('#mc-shell-element').value;
     const forceNode = container.querySelector('#mc-shell-force-node').value;

     const element = parsed?.elements?.find(e => String(e.id || e.SEQ_NO) === elId) || null;
     const force = forces.find(f => String(f.node) === forceNode) || null;

     const manualInputs = {
         od: parseFloat(container.querySelector('#mc-shell-od').value) || 0,
         wall: parseFloat(container.querySelector('#mc-shell-wall').value) || 0,
         effWall: parseFloat(container.querySelector('#mc-shell-effwall').value) || 0,
         f_normal: parseFloat(container.querySelector('#mc-shell-force').value) || 0,
         footprintType: container.querySelector('#mc-shell-footprint').value || 'narrow',
         contactWidth: parseFloat(container.querySelector('#mc-shell-width').value) || 0,
         contactLength: parseFloat(container.querySelector('#mc-shell-length').value) || 0,
         kFactor: parseFloat(container.querySelector('#mc-shell-k').value) || 1.8,
         allowable: parseFloat(container.querySelector('#mc-shell-allowable').value) || 0,
         ignorePads: container.querySelector('#mc-shell-ignore-pads').checked
     };

     const payload = resolveShellIndentInputs({ element, force }, manualInputs);
     currentShellResolverPayload = payload;

     // Render Resolution Table
     let html = `<table class="data-table" style="width:100%; font-size:11px;">
        <thead><tr><th>Field</th><th>Value</th><th>Unit</th><th>Source</th><th>Notes</th></tr></thead>
        <tbody>`;

     for (const [k, v] of Object.entries(payload.resolutionLog)) {
         html += `<tr>
            <td>${v.field}</td>
            <td><strong>${typeof v.value === 'number' ? v.value.toFixed(2) : v.value}</strong></td>
            <td>${v.unit}</td>
            <td><span style="color:${v.sourceType === 'parsed' ? 'green' : v.sourceType === 'linelist' ? 'blue' : 'orange'}">${v.sourceType}</span></td>
            <td>${v.fallbackReason || v.sourcePath}</td>
         </tr>`;
     }
     html += `</tbody></table>`;

     const resTable = container.querySelector('#shell-resolution-table');
     resTable.innerHTML = html;
     resTable.style.display = 'block';

     const btnCalc = container.querySelector('#btn-calc-shell');
     btnCalc.disabled = false;
     btnCalc.classList.replace('btn-secondary', 'btn-primary');

     updateSvg('mc-shellindent');
  });

  container.querySelector('#btn-calc-shell')?.addEventListener('click', () => {
      if (!currentShellResolverPayload) return;

      const calc = getCalculator('mc-shellindent');
      const envelope = runCalculation(calc, currentShellResolverPayload, getUnitMode());
      setSession(envelope); appendToHistory(envelope);

      if (envelope.pass && envelope.outputs) {
          const o = envelope.outputs;
          const i = envelope.intermediateValues;
          const targetMode = getUnitMode();
          let res = `<strong>Contact Area:</strong> ${UnitSystem.format(i.a_contact, 'area', targetMode).value.toFixed(2)} ${UnitSystem.format(i.a_contact, 'area', targetMode).unit}<br>`;
          res += `<strong>Bearing Stress:</strong> ${UnitSystem.format(o.sigma_bearing, 'stress', targetMode).value.toFixed(2)} ${UnitSystem.format(o.sigma_bearing, 'stress', targetMode).unit}<br>`;
          res += `<strong>Local Shell Stress:</strong> ${UnitSystem.format(o.sigma_local, 'stress', targetMode).value.toFixed(2)} ${UnitSystem.format(o.sigma_local, 'stress', targetMode).unit}<br>`;
          if (o.ur > 0) {
              const passStr = o.ur <= 1.0 ? '<span style="color:green">PASS</span>' : '<span style="color:red">FAIL</span>';
              res += `<br><strong>Utilization Ratio: ${o.ur.toFixed(3)} (${passStr})</strong>`;
          }

          container.querySelector('#shell-results').innerHTML = res;
      }
  });

}
