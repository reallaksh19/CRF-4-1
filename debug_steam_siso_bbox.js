import fs from 'fs';
import * as THREE from 'three';
import { parsePcfText } from './viewer/js/pcf2glb/pcf/parsePcfText.js';
import { normalizePcfModel } from './viewer/js/pcf2glb/pcf/normalizePcfModel.js';
import { buildExportScene } from './viewer/js/pcf2glb/glb/buildExportScene.js';
import { createLogger } from './viewer/js/pcf2glb/debug/logger.js';

const text = fs.readFileSync('/home/jules/verification/STEAM_SISO.pcf', 'utf-8');
const log = createLogger();
const parsed = parsePcfText(text, log);
const model = normalizePcfModel(parsed, log);
const scene = buildExportScene(model, log);

const box = new THREE.Box3().setFromObject(scene);
console.log("Min:", box.min);
console.log("Max:", box.max);
console.log("Center:", box.getCenter(new THREE.Vector3()));
console.log("Size:", box.getSize(new THREE.Vector3()));
