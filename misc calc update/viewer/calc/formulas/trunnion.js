import { UnitSystem } from '../units/unit-system.js';

export const TrunnionCalc = {
  id: 'mc-trunnion',
  name: 'Trunnion Calc (Rev A)',
  method: 'Local Shell Stress (Rev A Extended)',
  normalize: (raw, mode, steps) => {
    steps.push(`Normalize inputs to SI base units`);
    const od = UnitSystem.normalize(raw.od, 'mm', 'length', mode);
    const wall = UnitSystem.normalize(raw.wall, 'mm', 'length', mode);
    const fx = UnitSystem.normalize(raw.fx, 'N', 'force', mode);
    const fy = UnitSystem.normalize(raw.fy, 'N', 'force', mode);
    const fz = UnitSystem.normalize(raw.fz, 'N', 'force', mode);
    const L = UnitSystem.normalize(raw.L || 300, 'mm', 'length', mode);
    return { od, wall, fx, fy, fz, L };
  },
  run: (envelope) => {
    const { od, wall, fx, fy, fz, L } = envelope.normalizedInputs;

    envelope.steps.push(`Calculate Internal Diameter (id = od - 2*wall)`);
    const id = od - 2 * wall;

    envelope.steps.push(`Calculate Section Properties (Z, A)`);
    const Z = (Math.PI * (Math.pow(od, 4) - Math.pow(id, 4))) / (32 * (od || 1));
    const area = (Math.PI / 4) * (Math.pow(od, 2) - Math.pow(id, 2));

    envelope.steps.push(`Calculate Resultant Forces`);
    const fShear = Math.sqrt(fy**2 + fz**2);
    const axialStress = fx / (area || 1);
    const shearStress = fShear / (area || 1);

    envelope.steps.push(`Determine Trunnion Moment Arm`);
    const armL = L || 300;
    const bendingStress = (fShear * armL) / (Z || 1);

    envelope.steps.push(`Calculate Combined Stress`);
    const combinedStress = Math.abs(axialStress) + Math.abs(bendingStress);

    envelope.intermediateValues = { id, Z, area, fShear, L: armL };

    const targetMode = envelope.metadata.unitMode;
    
    // Rev A logic placeholder
    envelope.warnings.push('Trunnion Calc updated to Rev A. Exact implementation of Local Stresses at Pad Edge / Trunnion pending Source Extraction.');
    envelope.benchmark = { status: 'PENDING_SOURCE_EXTRACTION' };

    envelope.outputs = {
      axialStress: UnitSystem.format(axialStress, 'stress', targetMode, 'MPa').value,
      shearStress: UnitSystem.format(shearStress, 'stress', targetMode, 'MPa').value,
      bendingStress: UnitSystem.format(bendingStress, 'stress', targetMode, 'MPa').value,
      combinedStress: UnitSystem.format(combinedStress, 'stress', targetMode, 'MPa').value
    };

    if (!envelope.inputs.L) {
        envelope.warnings.push('Trunnion Moment arm L defaulted to 300mm. Provide exact support dimension.');
    }
  }
};
