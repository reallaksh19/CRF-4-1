const DEFAULT_SOURCE_DATA = {
  'mc-psvopen': {
    metadata: { calcId: 'mc-psvopen', title: 'PSV Open source data', saveTarget: 'public/misc-calc-source-data/psv-open.json' },
    tables: {
      orificeTable: [
        { letter: 'D', area_mm2: 830, area_in2: 1.2865 },
        { letter: 'E', area_mm2: 1186, area_in2: 1.8383 },
        { letter: 'F', area_mm2: 1841, area_in2: 2.8537 },
        { letter: 'G', area_mm2: 2323, area_in2: 3.6007 },
        { letter: 'H', area_mm2: 2800, area_in2: 4.3394 },
        { letter: 'J', area_mm2: 4116, area_in2: 6.3798 },
        { letter: 'K', area_mm2: 7129, area_in2: 11.0497 },
        { letter: 'L', area_mm2: 10323, area_in2: 16.0001 },
        { letter: 'M', area_mm2: 16774, area_in2: 25.9991 },
        { letter: 'N', area_mm2: null, area_in2: null },
        { letter: 'P', area_mm2: null, area_in2: null },
        { letter: 'Q', area_mm2: null, area_in2: null },
        { letter: 'R', area_mm2: null, area_in2: null },
        { letter: 'T', area_mm2: null, area_in2: null }
      ],
      kRoTable: [
        { k: 1.1, ro: 1.711 },
        { k: 1.2, ro: 1.772 },
        { k: 1.3, ro: 1.831 },
        { k: 1.4, ro: 1.891 },
        { k: 1.5, ro: 1.953 },
        { k: 1.6, ro: 2.012 }
      ],
      benchmarkCases: [{ caseId: 'default-placeholder', enabled: false, inputs: {}, expected: {}, tolerancePct: 1.0 }]
    }
  },
  'mc-bdliquid': {
    metadata: { calcId: 'mc-bdliquid', title: 'Bursting Disc Liquid source data', saveTarget: 'public/misc-calc-source-data/bursting-disc-liquid.json' },
    tables: {
      deviceSize: [{ deviceSize: '', burstArea_mm2: null, nominalDiameter_mm: null, notes: 'Populate from workbook' }],
      coefficients: [{ name: 'Cd', value: null, unit: '-', notes: 'Populate from workbook' }],
      correctionFactors: [{ name: 'Kc', value: null, unit: '-', notes: 'Populate from workbook' }],
      benchmarkCases: [{ caseId: 'default-placeholder', enabled: false, inputs: {}, expected: {}, tolerancePct: 1.0 }]
    }
  },
  'mc-blast': {
    metadata: { calcId: 'mc-blast', title: 'Blast source data', saveTarget: 'public/misc-calc-source-data/blast.json' },
    tables: {
      caseFactors: [{ caseName: '', factor: null, notes: 'Populate from workbook' }],
      pressureCoefficients: [{ coefficientName: 'Cp', value: null, notes: 'Populate from workbook' }],
      dragFactors: [{ dragName: 'Cd', value: null, notes: 'Populate from workbook' }],
      benchmarkCases: [{ caseId: 'default-placeholder', enabled: false, inputs: {}, expected: {}, tolerancePct: 1.0 }]
    }
  },
  'mc-flange-check': {
    metadata: { calcId: 'mc-flange-check', title: 'Flange Check source data', saveTarget: 'public/misc-calc-source-data/flange-check.json' },
    tables: {
      runtimeAllowables: [{ material: '', temp_degF: null, pressureAllowable_ksi: null, notes: 'Populate missing NC allowable rows here' }],
      forceAllowables: [{ method: 'NC', nps: null, rating: null, axialAllowable_N: null, notes: 'Populate once real workbook tables are transcribed' }],
      momentAllowables: [{ method: 'NC', nps: null, rating: null, momentAllowable_Nmm: null, notes: 'Populate once real workbook tables are transcribed' }],
      benchmarkCases: [{ caseId: 'default-placeholder', enabled: false, inputs: {}, expected: {}, tolerancePct: 1.0 }]
    }
  }
};

const STORAGE_PREFIX = 'miscCalcSourceData::';
let runtimeCache = new Map();

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function safeParse(jsonText, fallback) {
  try {
    return JSON.parse(jsonText);
  } catch {
    return deepClone(fallback);
  }
}

function getStored(calcId) {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_PREFIX + calcId);
  return raw ? safeParse(raw, DEFAULT_SOURCE_DATA[calcId] || {}) : null;
}

export function getSourceData(calcId) {
  if (runtimeCache.has(calcId)) return deepClone(runtimeCache.get(calcId));
  const base = deepClone(DEFAULT_SOURCE_DATA[calcId] || { metadata: { calcId }, tables: {} });
  const stored = getStored(calcId);
  const merged = stored ? { ...base, ...stored, metadata: { ...base.metadata, ...(stored.metadata || {}) }, tables: { ...(base.tables || {}), ...(stored.tables || {}) } } : base;
  runtimeCache.set(calcId, merged);
  return deepClone(merged);
}

export function setSourceData(calcId, data) {
  const payload = deepClone(data);
  payload.metadata = payload.metadata || {};
  payload.metadata.calcId = calcId;
  payload.metadata.updatedAt = new Date().toISOString();
  runtimeCache.set(calcId, payload);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_PREFIX + calcId, JSON.stringify(payload));
  }
  return deepClone(payload);
}

export function getDefaultSourceData(calcId) {
  return deepClone(DEFAULT_SOURCE_DATA[calcId] || { metadata: { calcId }, tables: {} });
}

export async function saveSourceDataToPublic(calcId, data) {
  const payload = setSourceData(calcId, data);
  const saveTarget = payload.metadata?.saveTarget || `public/misc-calc-source-data/${calcId}.json`;
  if (typeof window === 'undefined' || !window.showDirectoryPicker) {
    return { ok: false, mode: 'localStorage-only', message: 'Browser file-system access unavailable. Data saved to runtime/local storage only.', saveTarget, payload };
  }
  try {
    const root = await window.showDirectoryPicker({ mode: 'readwrite' });
    const publicDir = await root.getDirectoryHandle('misc-calc-source-data', { create: true });
    const filename = saveTarget.split('/').pop();
    const handle = await publicDir.getFileHandle(filename, { create: true });
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(payload, null, 2));
    await writable.close();
    return { ok: true, mode: 'file-system-access', message: `Saved ${filename} to selected public folder.`, saveTarget, payload };
  } catch (error) {
    return { ok: false, mode: 'localStorage-only', message: error?.message || 'Save cancelled. Runtime/local storage copy retained.', saveTarget, payload };
  }
}

export function evaluateBenchmark(calcId, outputs) {
  const sourceData = getSourceData(calcId);
  const cases = Array.isArray(sourceData?.tables?.benchmarkCases) ? sourceData.tables.benchmarkCases.filter(c => c && c.enabled) : [];
  if (!cases.length) return { status: 'PENDING_SOURCE_EXTRACTION', configuredCases: 0 };
  const caseResult = cases.map((c) => {
    const expected = c.expected || {};
    const tolerancePct = Number(c.tolerancePct ?? 1);
    const rows = Object.entries(expected).map(([key, exp]) => {
      const act = outputs?.[key];
      const numeric = typeof exp === 'number' && typeof act === 'number';
      const deltaPct = numeric && exp !== 0 ? Math.abs((act - exp) / exp) * 100 : null;
      const pass = numeric ? deltaPct <= tolerancePct : JSON.stringify(act) === JSON.stringify(exp);
      return { key, expected: exp, actual: act, deltaPct, pass };
    });
    const pass = rows.length ? rows.every(r => r.pass) : false;
    return { caseId: c.caseId || 'unnamed', pass, tolerancePct, rows };
  });
  const passCount = caseResult.filter(r => r.pass).length;
  return { status: passCount === caseResult.length ? 'PASS' : 'FAIL', configuredCases: caseResult.length, passCount, cases: caseResult };
}
