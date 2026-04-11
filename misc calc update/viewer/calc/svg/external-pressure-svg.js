import { createSvgShell, svgDefs } from './svg-shell.js';

export function generateExtPressureSvg(inputs) {
  const svg = `
    ${createSvgShell("0 0 300 300")}
    ${svgDefs}

    <circle cx="150" cy="150" r="60" fill="none" stroke="#333" stroke-width="6"/>
    
    <!-- External pressure arrows -->
    <line x1="250" y1="150" x2="220" y2="150" stroke="red" stroke-width="3" marker-end="url(#arrow)"/>
    <line x1="50" y1="150" x2="80" y2="150" stroke="red" stroke-width="3" marker-end="url(#arrow)"/>
    <line x1="150" y1="50" x2="150" y2="80" stroke="red" stroke-width="3" marker-end="url(#arrow)"/>
    <line x1="150" y1="250" x2="150" y2="220" stroke="red" stroke-width="3" marker-end="url(#arrow)"/>

    <text x="150" y="240" text-anchor="middle" font-size="12" fill="#333">Vacuum / External Pressure</text>
    <text x="150" y="255" text-anchor="middle" font-size="10" fill="#666">P = ${inputs.p || 0} MPa</text>
    </svg>
  `;
  return svg;
}
