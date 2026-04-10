import { VesselSkirtCalc } from './viewer/calc/formulas/vessel-skirt.js';
import { TrunnionCalc } from './viewer/calc/formulas/trunnion.js';
import { ReliefValveCalc } from './viewer/calc/formulas/relief-valve.js';
import { NemaSm23Calc } from './viewer/calc/formulas/nema-sm23.js';
import { MomentumCalc } from './viewer/calc/formulas/momentum.js';

function testCalc(calc, inputs) {
    const env = {
        metadata: { unitMode: 'Native' },
        normalizedInputs: inputs,
        steps: [],
        intermediateValues: {},
        outputs: {},
        warnings: [],
        errors: [],
        pass: true
    };
    calc.run(env);
    console.log(`[${calc.name}] Outputs:`, Object.keys(env.outputs).length > 0 ? "OK" : "Empty");
    console.log(`[${calc.name}] Warnings:`, env.warnings.length);
}

testCalc(VesselSkirtCalc, { ta: 25, t: 80, k: 1, h: 3250 });
testCalc(TrunnionCalc, { od: 219.1, wall: 8.18, fx: 1000, fy: 500, fz: 200 });
testCalc(ReliefValveCalc, { pset: 262, tf: 335, k: 1.29, mw: 6.52, w: 101663, ae: 78.54, pa: 14.7 });
testCalc(NemaSm23Calc, { fx: 1000, fy: 500, fz: 200, de: 10 });
testCalc(MomentumCalc, { pipes: [{ area: 0.1, density: 1000, velocity: 2 }] });
