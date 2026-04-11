import { createSvgShell, svgDefs } from './svg-shell.js';

export function generateBlastSvg(inputs) {
  const { blastPressure, exposedArea, coefficient } = inputs;
  
  const svg = `
    ${createSvgShell("0 0 300 300")}
    ${svgDefs}

    <!-- Exposed object / pipe / panel -->
    <rect x="180" y="100" width="40" height="150" fill="#ddd" stroke="#333" stroke-width="2"/>

    <!-- Blast wave direction arrow -->
    <line x1="50" y1="150" x2="150" y2="150" stroke="orange" stroke-width="4" stroke-dasharray="5,5" marker-end="url(#arrow)"/>
    <text x="100" y="140" fill="orange" font-size="12" font-weight="bold" text-anchor="middle">Blast Wave</text>

    <!-- Pressure arrows on the exposed face -->
    <line x1="130" y1="120" x2="170" y2="120" stroke="red" stroke-width="2" marker-end="url(#arrow)"/>
    <line x1="130" y1="150" x2="170" y2="150" stroke="red" stroke-width="2" marker-end="url(#arrow)"/>
    <line x1="130" y1="180" x2="170" y2="180" stroke="red" stroke-width="2" marker-end="url(#arrow)"/>
    <line x1="130" y1="210" x2="170" y2="210" stroke="red" stroke-width="2" marker-end="url(#arrow)"/>

    <!-- Resultant load arrow -->
    <line x1="220" y1="165" x2="280" y2="165" stroke="darkred" stroke-width="5" marker-end="url(#arrow)"/>
    <text x="250" y="155" fill="darkred" font-size="12" font-weight="bold" text-anchor="middle">Resultant</text>

    <!-- Labels placeholder -->
    <text x="150" y="280" text-anchor="middle" font-size="10" fill="#666">P = ${blastPressure || 0}, Area = ${exposedArea || 0}</text>
    <text x="150" y="295" text-anchor="middle" font-size="10" fill="#666">Coefficient = ${coefficient || 0}</text>
    </svg>
  `;
  return svg;
}
