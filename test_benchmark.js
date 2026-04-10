import { VesselSkirtCalc } from './viewer/calc/formulas/vessel-skirt.js';
import { TrunnionCalc } from './viewer/calc/formulas/trunnion.js';
import { ReliefValveCalc } from './viewer/calc/formulas/relief-valve.js';
import { NemaSm23Calc } from './viewer/calc/formulas/nema-sm23.js';
import { MomentumCalc } from './viewer/calc/formulas/momentum.js';

import { registerCalculator } from './viewer/calc/core/calc-registry.js';
import { runBenchmarks } from './viewer/calc/benchmark/benchmark-runner.js';
import { generateBenchmarkReport } from './viewer/calc/benchmark/benchmark-reporter.js';

registerCalculator('mc-skirt', VesselSkirtCalc);
registerCalculator('mc-trunnion', TrunnionCalc);
registerCalculator('mc-rvforce', ReliefValveCalc);
registerCalculator('mc-nema', NemaSm23Calc);
registerCalculator('mc-momentum', MomentumCalc);

const cases = [
    {
        id: 'skirt-01',
        calcId: 'mc-skirt',
        inputs: { ta: 25, t: 80, k: 1, h: 3250 },
        expectedOutputs: { deltaT: 55 }
    },
    {
        id: 'trun-01',
        calcId: 'mc-trunnion',
        inputs: { od: 219.1, wall: 8.18, fx: 1000, fy: 500, fz: 200 }
    }
];

const results = runBenchmarks(cases);
console.log("Benchmark Results:");
console.log(`Total: ${results.total}, Pass: ${results.passed}, Fail: ${results.failed}, Error: ${results.errors}`);
console.log(generateBenchmarkReport(results));
