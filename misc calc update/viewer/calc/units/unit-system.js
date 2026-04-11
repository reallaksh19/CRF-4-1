const CONVERSIONS = {
  length: {
    mm: 1,
    cm: 10,
    m: 1000,
    in: 25.4,
    ft: 304.8
  },
  area: {
    mm2: 1,
    cm2: 100,
    m2: 1000000,
    in2: 645.16,
    ft2: 92903.04
  },
  force: {
    N: 1,
    kN: 1000,
    lbf: 4.4482216
  },
  pressure: {
    MPa: 1,
    kPa: 0.001,
    psi: 0.00689476,
    bar: 0.1,
    Pa: 1e-6
  },
  stress: {
    MPa: 1,
    psi: 0.00689476,
    ksi: 6.89476
  },
  moment: {
    'N-mm': 1,
    'N-m': 1000,
    'lbf-ft': 1355.81795,
    'lbf-in': 112.984829
  },
  density: {
    'kg/m3': 1,
    'lb/ft3': 16.0184634
  },
  velocity: {
    'm/s': 1,
    'ft/s': 0.3048
  },
  mass_flow: {
    'kg/s': 1,
    'kg/hr': 1/3600,
    'lb/hr': 0.000125997881,
    'lb/s': 0.45359237
  }
};

const MODE_DEFAULTS = {
  Native: {
    length: null,
    area: null,
    force: null,
    pressure: null,
    stress: null,
    moment: null,
    density: null,
    velocity: null,
    mass_flow: null,
    temperature: null
  },
  SI: {
    length: 'mm',
    area: 'mm2',
    force: 'N',
    pressure: 'MPa',
    stress: 'MPa',
    moment: 'N-m',
    density: 'kg/m3',
    velocity: 'm/s',
    mass_flow: 'kg/s',
    temperature: 'C'
  },
  Imperial: {
    length: 'in',
    area: 'in2',
    force: 'lbf',
    pressure: 'psi',
    stress: 'psi',
    moment: 'lbf-ft',
    density: 'lb/ft3',
    velocity: 'ft/s',
    mass_flow: 'lb/hr',
    temperature: 'F'
  }
};

function convertTemperature(value, fromUnit, toUnit) {
  const from = fromUnit || 'C';
  const to = toUnit || 'C';
  if (from === to) return Number(value) || 0;
  let c;
  if (from === 'C') c = Number(value) || 0;
  else if (from === 'F') c = ((Number(value) || 0) - 32) * 5 / 9;
  else if (from === 'R') c = ((Number(value) || 0) - 491.67) * 5 / 9;
  else c = Number(value) || 0;
  if (to === 'C') return c;
  if (to === 'F') return (c * 9 / 5) + 32;
  if (to === 'R') return (c * 9 / 5) + 491.67;
  return c;
}

function convertLinear(value, type, fromUnit, toUnit) {
  const map = CONVERSIONS[type] || {};
  if (!map[fromUnit] || !map[toUnit]) return Number(value) || 0;
  return (Number(value) || 0) * map[fromUnit] / map[toUnit];
}

export const UnitSystem = {
  _inputMode: 'Native',
  setInputMode(mode) {
    this._inputMode = mode || 'Native';
  },
  getInputMode() {
    return this._inputMode || 'Native';
  },
  getDefaultUnit(type, mode = 'Native', nativeUnit = null) {
    const selected = MODE_DEFAULTS[mode] || MODE_DEFAULTS.Native;
    return selected[type] || nativeUnit || MODE_DEFAULTS.SI[type] || nativeUnit || '';
  },
  normalize(value, targetUnit, type, inputMode = null) {
    const mode = inputMode || this.getInputMode();
    const fromUnit = this.getDefaultUnit(type, mode, targetUnit);
    if (type === 'temperature') return convertTemperature(value, fromUnit, targetUnit);
    return convertLinear(value, type, fromUnit, targetUnit);
  },
  format(value, type, targetMode = 'Native', sourceUnit = null) {
    const toUnit = this.getDefaultUnit(type, targetMode, sourceUnit);
    const fromUnit = sourceUnit || this.getDefaultUnit(type, 'SI', sourceUnit);
    const converted = type === 'temperature'
      ? convertTemperature(value, fromUnit, toUnit)
      : convertLinear(value, type, fromUnit, toUnit);
    return { value: converted, unit: toUnit };
  }
};
