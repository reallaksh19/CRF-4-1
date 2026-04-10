export const ReliefValveCalc = {
  id: 'mc-rvforce',
  name: 'Relief Valve Forces',
  method: 'API 520 Reaction Forces',
  run: (envelope) => {
    const { pset, tf, k, mw, w, ae, pa } = envelope.normalizedInputs;

    envelope.steps.push(`Convert temperatures to Rankine`);
    const tr = tf + 459.67; // Rankine

    envelope.steps.push(`Convert Flow Rate to lb/s`);
    const w_sec = w / 3600; // lb/sec

    envelope.steps.push(`Calculate absolute set pressure`);
    const ps_abs = pset + pa; // psia

    envelope.steps.push(`Apply API 520 Momentum Force Formula: F_m = (W/366) * sqrt((k*T)/((k+1)*M))`);
    const factor1 = Math.sqrt((k * tr) / ((k + 1) * mw));
    const force_momentum = (w / 366) * factor1;

    envelope.steps.push(`Estimate Exit Pressure (Choked Flow Assumption)`);
    const pe_abs = (w / (ae * 366)) * Math.sqrt(tr / (k * (k+1) * mw));
    const pe_gauge = Math.max(0, pe_abs - pa); // Ensure positive gauge pressure

    envelope.steps.push(`Calculate Pressure Force: F_p = P_e * A_e`);
    const force_pressure = pe_gauge * ae;

    envelope.steps.push(`Sum Open System Reaction Force`);
    const force_open = force_momentum + force_pressure;

    envelope.steps.push(`Calculate Closed System Reaction Force (Dynamic Load Factor = 2.0)`);
    const force_closed = force_open * 2;

    envelope.intermediateValues = { tr, w_sec, ps_abs, factor1, pe_abs };
    envelope.outputs = {
      pe_gauge,
      force_momentum,
      force_pressure,
      force_open,
      force_closed
    };
  }
};
