import { UnitSystem } from '../units/unit-system.js';
import { resolveApi610Inputs } from '../resolvers/api-610-resolver.js';
import { tblAPI610_Discharge, tblAPI610_Suction, tblAPI610_AxisMatch } from '../master/api-610-master-data.js';

export const Api610Calc = {
  id: 'mc-api610',
  name: 'API 610 Nozzle Load Check',
  method: 'API 610 Allowable Nozzle Loads',
  normalize: (raw, mode, steps) => {
    steps.push('Resolve API 610 properties');
    return resolveApi610Inputs(raw);
  },
  run: (envelope) => {
    const { pumpType, shaftAxis, suctionAxis, apiFactor, suctionNS, dischargeNS } = envelope.normalizedInputs;
    
    envelope.steps.push(`Selected Pump: ${pumpType}`);
    envelope.steps.push(`Shaft Axis: ${shaftAxis}, Suction Axis: ${suctionAxis}`);
    
    // Find axis match
    const axisMatch = tblAPI610_AxisMatch.find(x => x.PUMPTYPE === pumpType && x.PumpShaftAxis === shaftAxis && x.SuctionNozzleCLAxis === suctionAxis);
    
    if (!axisMatch) {
       throw new Error(`Invalid axis combination for ${pumpType}`);
    }
    
    envelope.steps.push(`Axis Match Found (Type ID: ${axisMatch.PumpID})`);
    
    // Find allowables
    const sucAllow = tblAPI610_Suction.find(x => x.NS === suctionNS && x.TYPE === axisMatch.PumpID);
    const disAllow = tblAPI610_Discharge.find(x => x.NS === dischargeNS && x.TYPE === axisMatch.PumpID);
    
    if (!sucAllow) throw new Error(`Suction allowable not found for NS ${suctionNS} Type ${axisMatch.PumpID}`);
    if (!disAllow) throw new Error(`Discharge allowable not found for NS ${dischargeNS} Type ${axisMatch.PumpID}`);

    const s_allow = {
        F1: sucAllow.F1S * apiFactor,
        F2: sucAllow.F2S * apiFactor,
        F3: sucAllow.F3S * apiFactor,
        FR: Math.sqrt(Math.pow(sucAllow.F1S, 2) + Math.pow(sucAllow.F2S, 2) + Math.pow(sucAllow.F3S, 2)) * apiFactor,
        M1: sucAllow.M1S * apiFactor,
        M2: sucAllow.M2S * apiFactor,
        M3: sucAllow.M3S * apiFactor,
        MR: Math.sqrt(Math.pow(sucAllow.M1S, 2) + Math.pow(sucAllow.M2S, 2) + Math.pow(sucAllow.M3S, 2)) * apiFactor
    };

    const d_allow = {
        F1: disAllow.F1D * apiFactor,
        F2: disAllow.F2D * apiFactor,
        F3: disAllow.F3D * apiFactor,
        FR: Math.sqrt(Math.pow(disAllow.F1D, 2) + Math.pow(disAllow.F2D, 2) + Math.pow(disAllow.F3D, 2)) * apiFactor,
        M1: disAllow.M1D * apiFactor,
        M2: disAllow.M2D * apiFactor,
        M3: disAllow.M3D * apiFactor,
        MR: Math.sqrt(Math.pow(disAllow.M1D, 2) + Math.pow(disAllow.M2D, 2) + Math.pow(disAllow.M3D, 2)) * apiFactor
    };
    
    // Mapping inputs to F1 F2 F3 using Axis Match
    const mapInput = (inputs, forceOrMoment, prefix) => {
        const ax1 = axisMatch[`CIIMatchAxis${forceOrMoment}1`];
        const ax2 = axisMatch[`CIIMatchAxis${forceOrMoment}2`];
        const ax3 = axisMatch[`CIIMatchAxis${forceOrMoment}3`];
        
        const extract = (axisLabel) => {
             const key = prefix + '_' + axisLabel.toLowerCase();
             return inputs[key] || 0;
        };
        
        const val1 = extract(ax1);
        const val2 = extract(ax2);
        const val3 = extract(ax3);
        const res = Math.sqrt(val1*val1 + val2*val2 + val3*val3);
        return { 1: val1, 2: val2, 3: val3, R: res };
    };

    const s_actual_F = mapInput(envelope.normalizedInputs, 'F', 's');
    const s_actual_M = mapInput(envelope.normalizedInputs, 'M', 's');
    const d_actual_F = mapInput(envelope.normalizedInputs, 'F', 'd');
    const d_actual_M = mapInput(envelope.normalizedInputs, 'M', 'd');

    const checkPass = (act, allow) => Math.abs(act) <= allow;

    envelope.outputs = {
        suction: {
           actual: { F: s_actual_F, M: s_actual_M },
           allowable: s_allow,
           pass: {
               F1: checkPass(s_actual_F[1], s_allow.F1),
               F2: checkPass(s_actual_F[2], s_allow.F2),
               F3: checkPass(s_actual_F[3], s_allow.F3),
               FR: checkPass(s_actual_F.R, s_allow.FR),
               M1: checkPass(s_actual_M[1], s_allow.M1),
               M2: checkPass(s_actual_M[2], s_allow.M2),
               M3: checkPass(s_actual_M[3], s_allow.M3),
               MR: checkPass(s_actual_M.R, s_allow.MR)
           }
        },
        discharge: {
           actual: { F: d_actual_F, M: d_actual_M },
           allowable: d_allow,
           pass: {
               F1: checkPass(d_actual_F[1], d_allow.F1),
               F2: checkPass(d_actual_F[2], d_allow.F2),
               F3: checkPass(d_actual_F[3], d_allow.F3),
               FR: checkPass(d_actual_F.R, d_allow.FR),
               M1: checkPass(d_actual_M[1], d_allow.M1),
               M2: checkPass(d_actual_M[2], d_allow.M2),
               M3: checkPass(d_actual_M[3], d_allow.M3),
               MR: checkPass(d_actual_M.R, d_allow.MR)
           }
        },
        axisMatch: axisMatch
    };
    
    const allPass = Object.values(envelope.outputs.suction.pass).every(Boolean) && Object.values(envelope.outputs.discharge.pass).every(Boolean);
    envelope.pass = allPass;
  }
};
