import { getSourceData } from '../source-data-manager.js';

function getOrificeRows() {
  return getSourceData('mc-psvopen')?.tables?.orificeTable || [];
}

function getKRoRows() {
  return getSourceData('mc-psvopen')?.tables?.kRoTable || [];
}

export function resolvePsvOpenOrificeArea({ orificeMode, orificeLetter, manualOrificeAreaMm2 }) {
  if (orificeMode === 'manual') {
    const area = Number(manualOrificeAreaMm2);
    if (!(area > 0)) throw new Error('Manual orifice area must be > 0');
    return { value: area, unit: 'mm2', sourceType: 'manual', sourcePath: 'user.manualOrificeAreaMm2' };
  }
  const key = String(orificeLetter || '').trim().toUpperCase();
  const row = getOrificeRows().find(r => String(r.letter || '').trim().toUpperCase() === key);
  if (!row || !(Number(row.area_mm2) > 0)) throw new Error(`Invalid or incomplete orifice lookup for ${key || 'blank'}`);
  return { value: Number(row.area_mm2), unit: 'mm2', sourceType: 'lookup', sourcePath: `sourceData.tables.orificeTable.${key}` };
}

export function resolvePsvOpenRo(k) {
  const rows = getKRoRows().map(r => ({ k: Number(r.k), ro: Number(r.ro) })).filter(r => Number.isFinite(r.k) && Number.isFinite(r.ro)).sort((a,b) => a.k - b.k);
  if (!rows.length) throw new Error('K/Ro lookup table is empty. Populate Source data.');
  if (k < rows[0].k || k > rows[rows.length - 1].k) throw new Error(`K value ${k} is out of range for Ro lookup.`);
  const exact = rows.find(r => r.k === Number(k));
  if (exact) return { value: exact.ro, sourceType: 'lookup', sourcePath: `sourceData.tables.kRoTable.${exact.k}` };
  let lower = rows[0], upper = rows[rows.length - 1];
  for (let i = 0; i < rows.length - 1; i += 1) {
    if (k >= rows[i].k && k <= rows[i + 1].k) {
      lower = rows[i];
      upper = rows[i + 1];
      break;
    }
  }
  const ratio = (k - lower.k) / (upper.k - lower.k);
  return {
    value: lower.ro + ((upper.ro - lower.ro) * ratio),
    sourceType: 'lookup(interpolated)',
    sourcePath: 'sourceData.tables.kRoTable'
  };
}
