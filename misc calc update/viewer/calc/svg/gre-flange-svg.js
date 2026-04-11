import { createSvgShell, svgDefs } from './svg-shell.js';

export function generateGreFlangeSvg(inputs) {
  const svg = `
    ${createSvgShell("0 0 300 300")}
    ${svgDefs}

    <rect x="50" y="120" width="80" height="60" fill="#a4c2f4" stroke="#333" stroke-width="2"/>
    <rect x="170" y="120" width="80" height="60" fill="#a4c2f4" stroke="#333" stroke-width="2"/>

    <rect x="130" y="80" width="10" height="140" fill="#add8e6" stroke="#333" stroke-width="2"/>
    <rect x="160" y="80" width="10" height="140" fill="#add8e6" stroke="#333" stroke-width="2"/>
    
    <line x1="130" y1="90" x2="170" y2="90" stroke="#333" stroke-width="3"/>
    <line x1="130" y1="210" x2="170" y2="210" stroke="#333" stroke-width="3"/>

    <text x="150" y="250" text-anchor="middle" font-size="12" fill="#333">GRE / FRP Flange</text>
    </svg>
  `;
  return svg;
}
