import { UnitSystem } from '../units/unit-system.js';

export const TrunnionCalc = {
  id: 'mc-trunnion',
  name: 'Trunnion Calc',
  method: 'Local Shell Stress (Kellogg Method)',
  normalize: (raw, mode, steps) => {
    steps.push(`Normalize inputs to SI base units`);
    const od = UnitSystem.normalize(raw.od, 'mm', 'length');
    const wall = UnitSystem.normalize(raw.wall, 'mm', 'length');
    const fx = UnitSystem.normalize(raw.fx, 'N', 'force');
    const fy = UnitSystem.normalize(raw.fy, 'N', 'force');
    const fz = UnitSystem.normalize(raw.fz, 'N', 'force');
    return { od, wall, fx, fy, fz };
  },
  run: (envelope) => {
    const { od, wall, fx, fy, fz } = envelope.normalizedInputs;

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
    // Ideally this comes from geometry, using a fallback for demonstration
    const L = 300;
    const bendingStress = (fShear * L) / (Z || 1);

    envelope.steps.push(`Calculate Combined Stress`);
    const combinedStress = Math.abs(axialStress) + Math.abs(bendingStress);

    envelope.intermediateValues = { id, Z, area, fShear, L };

    const targetMode = envelope.metadata.unitMode;
    envelope.outputs = {
      axialStress: UnitSystem.format(axialStress, 'stress', targetMode).value,
      shearStress: UnitSystem.format(shearStress, 'stress', targetMode).value,
      bendingStress: UnitSystem.format(bendingStress, 'stress', targetMode).value,
      combinedStress: UnitSystem.format(combinedStress, 'stress', targetMode).value
    };

    envelope.warnings.push('Trunnion Moment arm L is currently assumed as 300mm. Provide exact support dimension.');
  }
};
