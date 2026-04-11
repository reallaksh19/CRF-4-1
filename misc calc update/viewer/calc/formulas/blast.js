import { getSourceData, evaluateBenchmark } from '../source-data-manager.js';
import { UnitSystem } from '../units/unit-system.js';

export const BlastCalc = {
  id: 'mc-blast',
  name: 'Blast',
  method: 'Workbook-traceable blast pressure/load calculation',
  normalize: (raw, mode, steps) => {
    steps.push('Resolve blast-case geometry and workbook inputs with provenance');
    return {
      blastPressure: UnitSystem.normalize(raw.blastPressure || 0, 'MPa', 'pressure', mode),
      exposedArea: UnitSystem.normalize(raw.exposedArea || 0, 'mm2', 'area', mode),
      coefficient: Number(raw.coefficient) || 0,
      sourceData: getSourceData('mc-blast')
    };
  },
  run: (envelope) => {
    const { blastPressure, exposedArea, coefficient, sourceData } = envelope.normalizedInputs;
    const resultantLoad = blastPressure * exposedArea * 1e-6 * coefficient;
    envelope.intermediateValues = { blastPressure, exposedArea, coefficient };
    envelope.outputs = {
      resultantLoad,
      configuredTableCounts: {
        caseFactors: sourceData?.tables?.caseFactors?.length || 0,
        pressureCoefficients: sourceData?.tables?.pressureCoefficients?.length || 0,
        dragFactors: sourceData?.tables?.dragFactors?.length || 0
      },
      display: {
        resultantLoad: UnitSystem.format(resultantLoad, 'force', envelope.metadata.unitMode, 'N')
      }
    };
    envelope.benchmark = evaluateBenchmark('mc-blast', envelope.outputs);
    envelope.warnings.push('Exact workbook formulas and coefficient tables must be extracted before completion.');
    if (!sourceData?.tables?.pressureCoefficients?.some(r => Number(r.value) > 0)) {
      envelope.warnings.push('Source data table is still template-only. Populate pressure coefficients and case factors in Source data.');
    }
  }
};
