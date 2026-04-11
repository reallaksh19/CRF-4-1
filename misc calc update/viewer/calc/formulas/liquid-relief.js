import { UnitSystem } from '../units/unit-system.js';

export const LiquidReliefCalc = {
  id: 'mc-liquidrelief',
  name: 'Liquid Relief Reaction',
  method: 'Liquid Relief Momentum & Pressure Thrust',
  normalize: (raw, mode, steps) => {
    steps.push('Resolve liquid-service inputs');
    
    // Convert everything to internal base units (SI)
    const normalized = {
      mode: raw.mode,
      rho: UnitSystem.normalize(raw.rho || 0, 'kg/m3', 'density'),
      ae: UnitSystem.normalize(raw.ae || 0, 'mm2', 'area'),
      pa: UnitSystem.normalize(raw.pa || 0, 'MPa', 'pressure'),
      daf: raw.daf || 1.0,
      pressureThrustIncluded: !!raw.pressureThrustIncluded
    };

    if (raw.mode === 'velocity' || raw.mode === 'combined') {
      normalized.v = UnitSystem.normalize(raw.v || 0, 'm/s', 'velocity');
    }
    
    if (raw.mode === 'flow-rate') {
      if (raw.q) normalized.q = raw.q; // m3/s assumed internally 
      if (raw.mdot) normalized.mdot = UnitSystem.normalize(raw.mdot, 'kg/s', 'mass_flow');
    }

    if (raw.mode === 'combined') {
      normalized.pe = UnitSystem.normalize(raw.pe || 0, 'MPa', 'pressure');
    }

    return normalized;
  },
  run: (envelope) => {
    const { mode, rho, ae, pa, v, q, mdot, pe, daf, pressureThrustIncluded } = envelope.normalizedInputs;
    
    // Validation
    if (rho <= 0) throw new Error('Density must be > 0');
    if (ae <= 0) throw new Error('Discharge Area must be > 0');
    
    if (!envelope.inputs.rho) envelope.warnings.push('Density fallback or default used.');
    if (!envelope.inputs.pa) envelope.warnings.push('Atmospheric pressure defaulted.');
    if (daf === 1.0) envelope.warnings.push('Dynamic Amplification Factor defaulted to 1.0.');
    envelope.warnings.push('Screening calculation only unless benchmarked.');

    let vel = 0;
    
    if (mode === 'velocity') {
      if (v <= 0) throw new Error('Velocity must be > 0 in velocity mode');
      vel = v;
      envelope.steps.push(`Mode: Velocity-based`);
    } else if (mode === 'flow-rate') {
      if (!q && !mdot) throw new Error('Either Volumetric Flow or Mass Flow must be provided in flow-rate mode');
      
      if (q) {
         // Area in base is mm2, need m2 for velocity
         const area_m2 = ae / 1000000;
         vel = q / area_m2;
         envelope.steps.push(`Derived velocity from Volumetric Flow: v = Q / A = ${q} / ${area_m2} = ${vel.toFixed(2)} m/s`);
      } else {
         const area_m2 = ae / 1000000;
         vel = mdot / (rho * area_m2);
         envelope.steps.push(`Derived velocity from Mass Flow: v = m_dot / (rho * A) = ${mdot} / (${rho} * ${area_m2}) = ${vel.toFixed(2)} m/s`);
      }
      envelope.warnings.push('Velocity derived from flow basis.');
    } else if (mode === 'combined') {
      if (v <= 0) throw new Error('Velocity must be > 0 in combined mode');
      vel = v;
      envelope.steps.push(`Mode: Combined (Pressure + Momentum)`);
    }

    const area_m2 = ae / 1000000;
    const force_momentum_N = rho * area_m2 * Math.pow(vel, 2);
    envelope.steps.push(`F_momentum = rho * A * v^2 = ${rho} * ${area_m2} * ${vel.toFixed(2)}^2 = ${force_momentum_N.toFixed(2)} N`);
    
    let force_pressure_N = 0;
    if (mode === 'combined' && pressureThrustIncluded) {
       // Pressures are in MPa, need Pa for Newtons (MPa * 10^6 * m2)
       const pe_pa = pe * 1000000;
       const pa_pa = pa * 1000000;
       force_pressure_N = (pe_pa - pa_pa) * area_m2;
       envelope.steps.push(`F_pressure = (P_exit - P_atm) * A = (${pe_pa} - ${pa_pa}) * ${area_m2} = ${force_pressure_N.toFixed(2)} N`);
    } else if (!pressureThrustIncluded) {
       envelope.warnings.push('Pressure thrust excluded.');
    }

    const force_total_N = daf * (force_momentum_N + force_pressure_N);
    envelope.steps.push(`F_total = DAF * (F_momentum + F_pressure) = ${daf} * (${force_momentum_N.toFixed(2)} + ${force_pressure_N.toFixed(2)}) = ${force_total_N.toFixed(2)} N`);

    envelope.intermediateValues = { vel, area_m2 };
    
    const targetMode = envelope.metadata.unitMode;
    envelope.outputs = {
      velocity: UnitSystem.format(vel, 'velocity', targetMode, 'm/s').value,
      force_momentum: UnitSystem.format(force_momentum_N, 'force', targetMode, 'N').value,
      force_pressure: UnitSystem.format(force_pressure_N, 'force', targetMode, 'N').value,
      force_total: UnitSystem.format(force_total_N, 'force', targetMode, 'N').value
    };
  }
};
