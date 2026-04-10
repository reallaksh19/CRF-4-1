export const ForceSummaryCalc = {
  id: 'mc-force',
  name: 'Force Summary',
  method: 'Extraction display only',
  run: (envelope) => {
    const { forces } = envelope.normalizedInputs;

    envelope.steps.push(`Process force extraction data`);

    const results = (forces || []).map(f => {
      const magnitude = Math.sqrt(f.fx**2 + f.fy**2 + f.fz**2);
      return { ...f, magnitude };
    });

    envelope.outputs.forces = results;
  }
};
