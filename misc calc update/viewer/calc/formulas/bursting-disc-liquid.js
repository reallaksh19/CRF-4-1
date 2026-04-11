import { getSourceData, evaluateBenchmark } from '../source-data-manager.js';
import { UnitSystem } from '../units/unit-system.js';

export const BurstingDiscLiquidCalc = {
  id: 'mc-bdliquid',
  name: 'Bursting Disc Liquid',
  method: 'Workbook-traceable liquid bursting disc calculation',
  normalize: (raw, mode, steps) => {
    steps.push('Resolve liquid-service inputs, preserving workbook basis and source provenance');
    return {
      burstPressure: UnitSystem.normalize(raw.burstPressure || 0, 'MPa', 'pressure', mode),
      downstreamPressure: UnitSystem.normalize(raw.downstreamPressure || 0, 'MPa', 'pressure', mode),
      liquidDensity: UnitSystem.normalize(raw.liquidDensity || 0, 'kg/m3', 'density', mode),
      sourceData: getSourceData('mc-bdliquid')
    };
  },
  run: (envelope) => {
    const { burstPressure, downstreamPressure, liquidDensity, sourceData } = envelope.normalizedInputs;
    const deltaP = Math.max(0, burstPressure - downstreamPressure);
    const configuredArea = Number(sourceData?.tables?.deviceSize?.find(r => Number(r.burstArea_mm2) > 0)?.burstArea_mm2 || 0);
    const resultantLoad = configuredArea > 0 ? deltaP * configuredArea * 1e-3 : 0;
    envelope.intermediateValues = { deltaP, configuredArea };
    envelope.outputs = {
      resultantLoad,
      configuredTableCounts: {
        deviceSize: sourceData?.tables?.deviceSize?.length || 0,
        coefficients: sourceData?.tables?.coefficients?.length || 0,
        correctionFactors: sourceData?.tables?.correctionFactors?.length || 0
      },
      display: {
        resultantLoad: UnitSystem.format(resultantLoad, 'force', envelope.metadata.unitMode, 'N')
      }
    };
    envelope.benchmark = evaluateBenchmark('mc-bdliquid', envelope.outputs);
    envelope.warnings.push('Exact workbook formulas must be transcribed and benchmarked before completion.');
    if (!(configuredArea > 0)) envelope.warnings.push('Source data table is still template-only. Populate device size and coefficients in Source data.');
  }
};
