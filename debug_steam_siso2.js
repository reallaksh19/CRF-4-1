import fs from 'fs';
import { splitPcfBlocks } from './viewer/js/pcf2glb/pcf/splitPcfBlocks.js';
import { parsePcfText } from './viewer/js/pcf2glb/pcf/parsePcfText.js';
import { normalizePcfModel } from './viewer/js/pcf2glb/pcf/normalizePcfModel.js';
import { buildExportScene } from './viewer/js/pcf2glb/glb/buildExportScene.js';
import { createLogger } from './viewer/js/pcf2glb/debug/logger.js';

const text = fs.readFileSync('/home/jules/verification/STEAM_SISO.pcf', 'utf-8');
const log = createLogger();
const parsed = parsePcfText(text, log);
const model = normalizePcfModel(parsed, log);
const scene = buildExportScene(model, log);

console.log("Root children count:", scene.children[0].children.length);

// Log first 10
for (let i = 0; i < Math.min(10, scene.children[0].children.length); i++) {
    const mesh = scene.children[0].children[i];
    console.log(mesh.name, mesh.type, mesh.position);
}
