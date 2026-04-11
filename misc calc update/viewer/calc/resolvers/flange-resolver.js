import { getSourceData } from '../source-data-manager.js';

export function resolveFlangeInputs(raw) {
    const sourceData = getSourceData('mc-flange-check');
    return {
        method: raw.method || 'NC',
        p_actual: Number(raw.p_actual) || 0,
        f_axial: Number(raw.f_axial) || 0,
        mx: Number(raw.mx) || 0,
        my: Number(raw.my) || 0,
        mz: Number(raw.mz) || 0,
        t1: Number(raw.t1) || 20,
        nps: Number(raw.nps) || 4,
        rating: Number(raw.rating) || 300,
        material: raw.material || 'SA-105',
        sourceData
    };
}
