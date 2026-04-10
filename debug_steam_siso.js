import fs from 'fs';
import { splitPcfBlocks } from './viewer/js/pcf2glb/pcf/splitPcfBlocks.js';
import { parsePcfText } from './viewer/js/pcf2glb/pcf/parsePcfText.js';
import { normalizePcfModel } from './viewer/js/pcf2glb/pcf/normalizePcfModel.js';
import { createLogger } from './viewer/js/pcf2glb/debug/logger.js';

const text = fs.readFileSync('/home/jules/verification/STEAM_SISO.pcf', 'utf-8');
const log = createLogger();
const parsed = parsePcfText(text, log);
const model = normalizePcfModel(parsed, log);

console.log("Parsed blocks:", parsed.blocks.length);
console.log("Normalized components:", model.components.length);
console.log("Logs:", log.getEntries());
