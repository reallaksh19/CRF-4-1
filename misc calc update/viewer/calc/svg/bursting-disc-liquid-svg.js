import { createSvgShell, svgDefs } from './svg-shell.js';

export function generateBurstingDiscLiquidSvg(inputs) {
  const svg = `
    ${createSvgShell("0 0 300 300")}
    ${svgDefs}

    <!-- Vessel/nozzle body -->
    <rect x="130" y="200" width="40" height="80" fill="#ddd" stroke="#333" stroke-width="2"/>
    <polygon points="120,200 180,200 180,180 120,180" fill="#ccc" stroke="#333" stroke-width="2"/>
    
    <!-- Disc Body -->
    <line x1="120" y1="180" x2="180" y2="180" stroke="#f00" stroke-width="4"/>

    <!-- Liquid discharge arrow -->
    <line x1="150" y1="180" x2="150" y2="100" stroke="blue" stroke-width="3" marker-end="url(#arrow)"/>

    <!-- Reaction arrow -->
    <line x1="150" y1="200" x2="150" y2="280" stroke="red" stroke-width="4" marker-end="url(#arrow)"/>
    <text x="160" y="275" fill="red" font-size="14" font-weight="bold">Reaction Load</text>

    <!-- Labels placeholder -->
    <text x="150" y="295" text-anchor="middle" font-size="12" fill="#666">Liquid service</text>
    </svg>
  `;
  return svg;
}
