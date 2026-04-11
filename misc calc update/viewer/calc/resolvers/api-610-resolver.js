import { tblAPI610_Discharge, tblAPI610_Suction, tblAPI610_AxisMatch } from '../master/api-610-master-data.js';

export function resolveApi610Inputs(raw) {
    return {
        pumpType: raw.pumpType || 'End suction Top discharge',
        shaftAxis: raw.shaftAxis || 'X',
        suctionAxis: raw.suctionAxis || 'X',
        apiFactor: raw.apiFactor || 1,
        suctionNS: raw.suctionNS || 2,
        dischargeNS: raw.dischargeNS || 2,
        s_fx: raw.s_fx || 0,
        s_fy: raw.s_fy || 0,
        s_fz: raw.s_fz || 0,
        s_mx: raw.s_mx || 0,
        s_my: raw.s_my || 0,
        s_mz: raw.s_mz || 0,
        d_fx: raw.d_fx || 0,
        d_fy: raw.d_fy || 0,
        d_fz: raw.d_fz || 0,
        d_mx: raw.d_mx || 0,
        d_my: raw.d_my || 0,
        d_mz: raw.d_mz || 0
    };
}
