import { resolveFlangeInputs } from '../resolvers/flange-resolver.js';
import { Flange_Allowable, FlangeUG44bDB } from '../master/flange-master-data.js';
import { evaluateBenchmark } from '../source-data-manager.js';
import { UnitSystem } from '../units/unit-system.js';

function findRuntimeAllowance(sourceData, material, tempDegF) {
  const rows = sourceData?.tables?.runtimeAllowables || [];
  return rows.find(r => String(r.material || '').trim().toUpperCase() === String(material || '').trim().toUpperCase() && Number(r.temp_degF) >= tempDegF && Number(r.pressureAllowable_ksi) > 0);
}

function findForceAllowable(sourceData, method, nps, rating) {
  const rows = sourceData?.tables?.forceAllowables || [];
  return rows.find(r => String(r.method || '').toUpperCase() === String(method || '').toUpperCase() && Number(r.nps) === Number(nps) && Number(r.rating) === Number(rating) && Number(r.axialAllowable_N) > 0);
}

function findMomentAllowable(sourceData, method, nps, rating) {
  const rows = sourceData?.tables?.momentAllowables || [];
  return rows.find(r => String(r.method || '').toUpperCase() === String(method || '').toUpperCase() && Number(r.nps) === Number(nps) && Number(r.rating) === Number(rating) && Number(r.momentAllowable_Nmm) > 0);
}

export const FlangeCheckCalc = {
  id: 'mc-flange-check',
  name: 'Flange Check',
  method: 'Workbook-traceable flange check (NC/UG44)',
  normalize: (raw, mode, steps) => {
    steps.push('Resolve flange-case geometry and workbook inputs with provenance');
    const resolved = resolveFlangeInputs(raw);
    return {
      ...resolved,
      p_actual: UnitSystem.normalize(resolved.p_actual, 'MPa', 'pressure', mode),
      f_axial: UnitSystem.normalize(resolved.f_axial, 'N', 'force', mode),
      mx: UnitSystem.normalize(resolved.mx, 'N-m', 'moment', mode),
      my: UnitSystem.normalize(resolved.my, 'N-m', 'moment', mode),
      mz: UnitSystem.normalize(resolved.mz, 'N-m', 'moment', mode),
      t1: UnitSystem.normalize(resolved.t1, 'C', 'temperature', mode)
    };
  },
  run: (envelope) => {
    const { method, p_actual, f_axial, mx, my, mz, t1, nps, rating, material, sourceData } = envelope.normalizedInputs;
    envelope.steps.push(`Selected Method: ${method}`);
    const f_ax_tension = Math.max(f_axial, 0);
    envelope.steps.push(`F_ax_tension = max(F_axial, 0) = max(${f_axial}, 0) = ${f_ax_tension}`);
    const m_res = Math.sqrt(mx*mx + my*my + mz*mz);
    envelope.steps.push(`M_res = sqrt(Mx^2 + My^2 + Mz^2) = ${m_res.toFixed(2)}`);
    const tempF = UnitSystem.format(t1, 'temperature', 'Imperial', 'C').value;
    let rP = 0, rF = 0, rM = 0, interaction = 0, ur = 0;
    let p_allow = 0, f_allow = 0, m_allow = 0;
    if (method === 'NC') {
      const runtimeMatch = findRuntimeAllowance(sourceData, material, tempF);
      const allowMatch = runtimeMatch || Flange_Allowable.find(x => String(x.MaterialName || '').trim().toUpperCase() === String(material || '').trim().toUpperCase() && Number(x.TempinDegF) >= tempF);
      p_allow = runtimeMatch ? Number(runtimeMatch.pressureAllowable_ksi) : (allowMatch ? Number(allowMatch.FlangeallowableinKSI) : 20);
      const fAllowRow = findForceAllowable(sourceData, method, nps, rating);
      const mAllowRow = findMomentAllowable(sourceData, method, nps, rating);
      f_allow = fAllowRow ? Number(fAllowRow.axialAllowable_N) : 1000;
      m_allow = mAllowRow ? Number(mAllowRow.momentAllowable_Nmm) : 5000;
      if (!runtimeMatch && !allowMatch) envelope.warnings.push(`No NC allowable match found for ${material} at temp ${tempF.toFixed(1)} F, using 20 ksi as placeholder`);
      if (!fAllowRow) envelope.warnings.push('Force allowable table not populated; using 1000 N placeholder. Populate Source data.');
      if (!mAllowRow) envelope.warnings.push('Moment allowable table not populated; using 5000 N-mm placeholder. Populate Source data.');
    } else {
      const ug44Match = FlangeUG44bDB.find(x => Number(x.SIZE) === Number(nps) && Number(x.Rating) === Number(rating));
      const Fm = ug44Match ? Number(ug44Match.FM) : 1.0;
      const Gm = ug44Match ? Number(ug44Match['G(m)']) : 1.0;
      p_allow = 25 * Fm;
      f_allow = 1200 * Gm;
      m_allow = 6000 * Gm;
      if (!ug44Match) envelope.warnings.push(`No UG44 match found for NPS ${nps} Rating ${rating}, using defaults`);
    }
    rP = p_actual / (p_allow || 1);
    rF = f_ax_tension / (f_allow || 1);
    rM = m_res / (m_allow || 1);
    interaction = rF + rM;
    ur = Math.max(rP, rF, rM, interaction);
    envelope.outputs = {
      ur,
      interaction,
      rP,
      rF,
      rM,
      m_res,
      f_ax_tension,
      display: {
        m_res: UnitSystem.format(m_res, 'moment', envelope.metadata.unitMode, 'N-mm'),
        f_ax_tension: UnitSystem.format(f_ax_tension, 'force', envelope.metadata.unitMode, 'N'),
        p_actual: UnitSystem.format(p_actual, 'pressure', envelope.metadata.unitMode, 'MPa')
      }
    };
    envelope.pass = rP <= 1.0 && interaction <= 1.0;
    envelope.benchmark = evaluateBenchmark('mc-flange-check', envelope.outputs);
    if (envelope.benchmark.status === 'PENDING_SOURCE_EXTRACTION') {
      envelope.benchmark.status = 'PENDING_ACCESS_PARITY';
    }
  }
};
