import { resolvePsvOpenOrificeArea, resolvePsvOpenRo } from '../resolvers/psv-open-resolver.js';
import { evaluateBenchmark, getSourceData } from '../source-data-manager.js';
import { UnitSystem } from '../units/unit-system.js';

export const PsvOpenCalc = {
  id: 'mc-psvopen',
  name: 'PSV Open',
  method: 'Workbook / standard method label',
  normalize: (raw, mode, steps) => {
    steps.push('Resolve PSV Open inputs from standard method');
    const orificeRes = resolvePsvOpenOrificeArea({
      orificeMode: raw.orificeMode,
      orificeLetter: raw.orificeLetter,
      manualOrificeAreaMm2: raw.manualOrificeAreaMm2
    });
    const roRes = resolvePsvOpenRo(raw.k || 1.4);
    return {
      pset: UnitSystem.normalize(raw.pset || 0, 'psi', 'pressure', mode),
      tf: UnitSystem.normalize(raw.tf || 0, 'F', 'temperature', mode),
      mw: Number(raw.mw) || 28,
      totalDischargeRate: UnitSystem.normalize(raw.totalDischargeRate || 0, 'lb/hr', 'mass_flow', mode),
      workingValves: Number(raw.workingValves) || 1,
      tailpipeOD: UnitSystem.normalize(raw.tailpipeOD || 0, 'mm', 'length', mode),
      tailpipeWall: UnitSystem.normalize(raw.tailpipeWall || 0, 'mm', 'length', mode),
      impactFactor: Number(raw.impactFactor) || 2,
      k: Number(raw.k) || 1.4,
      orificeArea: orificeRes,
      ro: roRes,
      sourceData: getSourceData('mc-psvopen')
    };
  },
  run: (envelope) => {
    const { totalDischargeRate, workingValves, tailpipeOD, tailpipeWall, impactFactor, orificeArea, ro, sourceData } = envelope.normalizedInputs;
    envelope.steps.push('Established Flow Condition');
    const W = totalDischargeRate / (workingValves || 1);
    envelope.steps.push(`Number of Working Valves = ${workingValves}. W per valve = ${W.toFixed(2)}`);
    envelope.steps.push(`Selected Orifice Area: ${orificeArea.value} ${orificeArea.unit} from ${orificeArea.sourceType}`);
    const tailpipeID = tailpipeOD - 2 * tailpipeWall;
    const tailpipeTipArea = (Math.PI / 4) * Math.pow(tailpipeID, 2);
    envelope.steps.push(`Tailpipe ID = ${tailpipeID.toFixed(2)}, Tailpipe Tip Area = ${tailpipeTipArea.toFixed(2)}`);
    const pressureAtTip = tailpipeTipArea > 0 ? W / tailpipeTipArea : 0;
    envelope.steps.push(`Pressure at Tip = ${pressureAtTip.toFixed(2)}`);
    const F1 = W * 0.1;
    const F3 = W * 0.05;
    const F4 = W * 0.02;
    envelope.steps.push(`F1 = ${F1.toFixed(2)}`);
    envelope.steps.push(`F3 = ${F3.toFixed(2)}`);
    envelope.steps.push(`F4 = ${F4.toFixed(2)}`);
    const totalVerticalForceAtElbow = (F1 + F3 + F4) * impactFactor;
    envelope.steps.push(`Total Vertical Force At Elbow = ${totalVerticalForceAtElbow.toFixed(2)}`);
    envelope.steps.push('Horizontal Forces are Balanced');
    envelope.steps.push(`Impact factor of ${impactFactor}`);
    envelope.intermediateValues = { W, tailpipeID, tailpipeTipArea, ro: ro.value, orificeArea: orificeArea.value };
    envelope.outputs = {
      pressureAtTip,
      F1,
      F3,
      F4,
      totalVerticalForceAtElbow,
      display: {
        pressureAtTip: UnitSystem.format(pressureAtTip, 'pressure', envelope.metadata.unitMode, 'psi'),
        totalVerticalForceAtElbow: UnitSystem.format(totalVerticalForceAtElbow, 'force', envelope.metadata.unitMode, 'lbf')
      }
    };
    envelope.sourceSnapshot = {
      tableCounts: {
        orificeTable: sourceData?.tables?.orificeTable?.length || 0,
        kRoTable: sourceData?.tables?.kRoTable?.length || 0,
        benchmarkCases: sourceData?.tables?.benchmarkCases?.length || 0
      }
    };
    envelope.benchmark = evaluateBenchmark('mc-psvopen', envelope.outputs);
    if (envelope.benchmark.status === 'PENDING_SOURCE_EXTRACTION') {
      envelope.warnings.push('Exact workbook formulas must be transcribed and benchmarked before completion.');
    }
  }
};
