import { UnitSystem } from '../units/unit-system.js';

export const NemaSm23Calc = {
  id: 'mc-nema',
  name: 'NEMA SM23 Check',
  method: 'NEMA SM23 Nozzle Load Limits',
  normalize: (raw, mode, steps) => {
    steps.push(`Normalize inputs to SI base units`);
    return {
      fx: UnitSystem.normalize(raw.fx, 'N', 'force'),
      fy: UnitSystem.normalize(raw.fy, 'N', 'force'),
      fz: UnitSystem.normalize(raw.fz, 'N', 'force'),
      de: UnitSystem.normalize(raw.de, 'in', 'length') // NEMA inherently uses inches for De
    };
  },
  run: (envelope) => {
    const { fx, fy, fz, de } = envelope.normalizedInputs;

    envelope.steps.push(`Convert force components from N to lbf`);
    const nToLbf = 0.224808943;
    const fx_lbf = Math.abs(fx) * nToLbf;
    const fy_lbf = Math.abs(fy) * nToLbf;
    const fz_lbf = Math.abs(fz) * nToLbf;

    envelope.steps.push(`Calculate Resultant Force (Fr) = sqrt(Fx^2 + Fy^2 + Fz^2)`);
    const fr_lbf = Math.sqrt(fx_lbf**2 + fy_lbf**2 + fz_lbf**2);

    envelope.steps.push(`Calculate Resultant Moment (Mr) in lbf-ft (assumed 0)`);
    // Full integrity requires Mx, My, Mz parsing from reports
    const mr_lbf_ft = 0;

    envelope.steps.push(`Apply NEMA Combined Equation: 3*Fr + Mr`);
    const combined_load = (3 * fr_lbf) + mr_lbf_ft;

    envelope.steps.push(`Calculate Allowable Limit: 500 * De`);
    const allowable = 500 * de;

    envelope.steps.push(`Evaluate Pass/Fail Ratio`);
    const ratio = (combined_load / allowable) * 100;
    const pass = ratio <= 100;

    envelope.outputs = {
      fx_lbf,
      fy_lbf,
      fz_lbf,
      fr_lbf,
      mr_lbf_ft,
      combined_load,
      allowable,
      ratio,
      pass
    };

    if (!pass) envelope.pass = false;
    envelope.warnings.push('Moments are currently assumed 0. Verify with actual anchor report moments.');
  }
};
