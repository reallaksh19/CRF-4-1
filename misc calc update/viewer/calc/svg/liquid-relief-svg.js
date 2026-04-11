import { createSvgShell, drawDimension, svgDefs } from './svg-shell.js';

export function generateLiquidReliefSvg(inputs) {
  const { mode, rho, vel, q, mdot, ae, pe, pressureThrustIncluded } = inputs;

  let extraLabels = '';
  let flowLabel = '';
  
  if (mode === 'velocity' || mode === 'combined') {
    flowLabel = `v = ${vel}`;
  } else if (mode === 'flow-rate') {
    if (q) flowLabel = `Q = ${q}`;
    else if (mdot) flowLabel = `m_dot = ${mdot}`;
  }

  if (mode === 'combined') {
     extraLabels += `<text x="150" y="270" text-anchor="middle" font-size="12" fill="blue">Pe = ${pe}</text>`;
  }

  const svg = `
    ${createSvgShell("0 0 300 300")}
    ${svgDefs}

    <!-- Pipe / Nozzle Branch -->
    <rect x="130" y="200" width="40" height="80" fill="#ddd" stroke="#333" stroke-width="2"/>
    <polygon points="120,200 180,200 180,140 120,140" fill="#ccc" stroke="#333" stroke-width="2"/>
    <rect x="180" y="150" width="80" height="30" fill="#add8e6" stroke="#333" stroke-width="2"/> <!-- Light blue for liquid -->

    <!-- Discharge Exit Area Arrow -->
    <path d="M 270 155 Q 290 165 270 175" fill="none" stroke="#666" stroke-width="1" stroke-dasharray="2,2"/>
    <text x="275" y="195" font-size="12" fill="#666">Ae = ${ae}</text>

    <!-- Liquid Flow Arrow -->
    <line x1="200" y1="165" x2="250" y2="165" stroke="blue" stroke-width="3" marker-end="url(#arrow)"/>
    <text x="225" y="155" fill="blue" font-size="12" text-anchor="middle">${flowLabel}</text>

    <!-- Reaction Force Arrow -->
    <line x1="180" y1="185" x2="80" y2="185" stroke="red" stroke-width="4" marker-end="url(#arrow)"/>
    <text x="40" y="180" fill="red" font-size="14" font-weight="bold">Reaction F</text>

    <!-- Inputs text -->
    <text x="150" y="250" text-anchor="middle" font-size="12" fill="blue">rho = ${rho}</text>
    ${extraLabels}
    
    <!-- Warning label -->
    <text x="150" y="290" text-anchor="middle" font-size="12" font-weight="bold" fill="#1a5fa3">Liquid Service</text>

    </svg>
  `;
  return svg;
}
