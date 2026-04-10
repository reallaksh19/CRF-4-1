import { createResultEnvelope } from './calc-types.js';
import { addLog, CATEGORY, SEVERITY } from '../../core/logger.js';

export function runCalculation(calcModule, rawInputs, unitMode = 'Native') {
  const envelope = createResultEnvelope();
  envelope.metadata.id = calcModule.id || 'unknown';
  envelope.metadata.name = calcModule.name || 'Unknown Calc';
  envelope.metadata.method = calcModule.method || 'Unknown Method';
  envelope.metadata.unitMode = unitMode;

  envelope.inputs = { ...rawInputs };
  // Normalization logic: defer to calc module's declared inputs or passthrough
  envelope.normalizedInputs = { ...rawInputs };

  if (calcModule.normalize) {
    envelope.normalizedInputs = calcModule.normalize(rawInputs, unitMode, envelope.steps);
  }

  try {
    if (calcModule.run) {
      calcModule.run(envelope);
    } else {
      throw new Error(`Calculator ${calcModule.id} has no run method.`);
    }
  } catch (err) {
    envelope.errors.push(err.message);
    envelope.pass = false;
    addLog({
      severity: SEVERITY.ERROR,
      category: CATEGORY.UI,
      message: `Calc Engine Error (${calcModule.name}): ${err.message}`,
    });
  }

  // Generate warnings to log
  envelope.warnings.forEach(w => {
    addLog({
      severity: SEVERITY.WARNING,
      category: CATEGORY.UI,
      message: `Calc Warning (${calcModule.name}): ${w}`
    });
  });

  return envelope;
}
