const assert = require('assert');

// Import calculator modules using relative paths.  We reference the build output in the
// extracted misc directory rather than the original application directory to allow this
// test to run in isolation with node.  Each module exports a calc object with
// `normalize()` and `run()` methods which we drive directly.

const { PsvOpenCalc } = require('./viewer/calc/formulas/psv-open.js');
const { BurstingDiscLiquidCalc } = require('./viewer/calc/formulas/bursting-disc-liquid.js');
const { BlastCalc } = require('./viewer/calc/formulas/blast.js');
const { FlangeCheckCalc } = require('./viewer/calc/formulas/flange-check.js');
const { UnitSystem } = require('./viewer/calc/units/unit-system.js');
const { getDefaultSourceData, setSourceData, getSourceData } = require('./viewer/calc/source-data-manager.js');

/**
 * Helper to execute a calculator through its normalize() and run() methods.  A
 * minimal envelope is constructed to satisfy the calculator API.  The unit
 * mode in metadata is always set to 'Imperial' for these tests.  Any thrown
 * errors will cause the test to fail.
 * @param {object} calc - Calculator module (PsvOpenCalc, etc.)
 * @param {object} input - Raw user input object
 */
function executeCalc(calc, input) {
  const steps = [];
  const normalizedInputs = calc.normalize(input, 'Imperial', steps);
  const envelope = {
    inputs: input,
    normalizedInputs: normalizedInputs,
    steps: steps,
    intermediateValues: {},
    warnings: [],
    errors: [],
    metadata: { unitMode: 'Imperial' },
    outputs: {},
    benchmark: {}
  };
  calc.run(envelope);
  return envelope;
}

// PSV Open test: exercise the calculator with typical inputs.  Because the
// underlying workbook logic is not yet implemented, the calculator should
// return a pending benchmark status and include key intermediate values.  No
// runtime error should be thrown.
(() => {
  const input = {
    pset: 100,
    tf: 200,
    mw: 28,
    totalDischargeRate: 10000,
    workingValves: 2,
    orificeMode: 'letter',
    orificeLetter: 'D',
    tailpipeOD: 10,
    tailpipeWall: 0.5,
    impactFactor: 2,
    k: 1.4
  };
  const env = executeCalc(PsvOpenCalc, input);
  // Ensure no errors were recorded
  assert.strictEqual(env.errors.length, 0, 'PSV Open encountered errors');
  // The benchmark status should be pending until formulas are extracted
  assert.strictEqual(env.benchmark.status, 'PENDING_SOURCE_EXTRACTION', 'PSV Open benchmark status');
  // The PSV Open calculator exposes a total vertical reaction at the elbow rather
  // than a per‑valve discharge rate. Verify that this result exists on outputs.
  assert.ok(env.outputs.totalVerticalForceAtElbow !== undefined, 'PSV Open output missing totalVerticalForceAtElbow');
})();

// Bursting Disc Liquid test: the calculator is a stub and should return a
// pending benchmark status.  Ensure no runtime error occurs and the output
// object exists.
(() => {
  const input = {};
  const env = executeCalc(BurstingDiscLiquidCalc, input);
  assert.strictEqual(env.errors.length, 0, 'Bursting Disc Liquid encountered errors');
  assert.strictEqual(env.benchmark.status, 'PENDING_SOURCE_EXTRACTION', 'Bursting Disc Liquid benchmark status');
  assert.ok(env.outputs.resultantLoad !== undefined, 'Bursting Disc Liquid output missing resultantLoad');
})();

// Blast test: similarly ensure stub behaviour returns pending benchmark and no error
(() => {
  const input = {};
  const env = executeCalc(BlastCalc, input);
  assert.strictEqual(env.errors.length, 0, 'Blast encountered errors');
  assert.strictEqual(env.benchmark.status, 'PENDING_SOURCE_EXTRACTION', 'Blast benchmark status');
  assert.ok(env.outputs.resultantLoad !== undefined, 'Blast output missing resultantLoad');
})();

// Flange Check test: run a simple case through both NC and UG44 logic to ensure
// the calculator executes without throwing and produces reasonable interaction
// ratios.  We deliberately omit matching table values so that mock defaults are
// used but the computation still completes.
(() => {
  // NC method test
  const inputNC = {
    method: 'NC',
    p_actual: 50,
    f_axial: 100,
    mx: 10,
    my: 0,
    mz: 0,
    t1: 100,
    nps: 4,
    rating: 150,
    material: 'A516'
  };
  let env = executeCalc(FlangeCheckCalc, inputNC);
  assert.strictEqual(env.errors.length, 0, 'Flange NC encountered errors');
  assert.ok(env.outputs.ur !== undefined, 'Flange NC output missing UR');
  // UG44 method test
  const inputUG = {
    method: 'UG44',
    p_actual: 50,
    f_axial: 100,
    mx: 10,
    my: 0,
    mz: 0,
    t1: 100,
    nps: 4,
    rating: 150,
    material: 'A516'
  };
  env = executeCalc(FlangeCheckCalc, inputUG);
  assert.strictEqual(env.errors.length, 0, 'Flange UG44 encountered errors');
  assert.ok(env.outputs.ur !== undefined, 'Flange UG44 output missing UR');
})();

console.log('All calculator unit tests passed.');

// Unit conversion sanity checks
(() => {
  UnitSystem.setInputMode('Imperial');
  const mm = UnitSystem.normalize(1, 'mm', 'length');
  assert.ok(Math.abs(mm - 25.4) < 1e-6, '1 inch should normalize to 25.4 mm in Imperial mode');
  const psi = UnitSystem.format(1, 'pressure', 'Imperial', 'MPa');
  assert.ok(Math.abs(psi.value - 145.0376807894691) < 1e-3, '1 MPa should format to ~145.04 psi');
})();

// Source-data manager round-trip checks
(() => {
  const defaults = getDefaultSourceData('mc-psvopen');
  assert.ok(Array.isArray(defaults.tables.orificeTable), 'PSV default source data should include orifice table');
  const modified = { ...defaults, tables: { ...defaults.tables, benchmarkCases: [{ caseId: 'case-1', enabled: true, expected: { F1: 123 }, tolerancePct: 1 }] } };
  setSourceData('mc-psvopen', modified);
  const reloaded = getSourceData('mc-psvopen');
  assert.strictEqual(reloaded.tables.benchmarkCases[0].caseId, 'case-1', 'Source data round-trip failed');
})();
