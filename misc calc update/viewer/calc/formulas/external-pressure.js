export const ExternalPressureCalc = {
  id: 'mc-ext-pressure',
  name: 'External Pressure (ASME VIII Div 1)',
  method: 'Workbook-traceable ASME Section VIII Div 1 UG-28',
  normalize: (raw, mode, steps) => {
    steps.push('Resolve external pressure inputs');
    return raw;
  },
  run: (envelope) => {
    envelope.warnings.push('Exact ASME material property charts and factors pending Source Extraction.');
    envelope.outputs = {
        mawep: 0,
        requiredThickness: 0
    };
    envelope.benchmark = {
        status: 'PENDING_SOURCE_EXTRACTION'
    };
  }
};
