export const FlangeLeakageCalc = {
  id: 'mc-flange',
  name: 'Flange Leakage',
  method: 'Extraction display only',
  run: (envelope) => {
    const { flanges } = envelope.normalizedInputs;

    envelope.steps.push(`Process flange extraction data`);
    envelope.outputs.flanges = flanges || [];
  }
};
