import { createSvgShell, svgDefs } from './svg-shell.js';

export function generateApi610Svg(inputs) {
  const { pumpType } = inputs;
  
  const svg = `
    ${createSvgShell("0 0 300 300")}
    ${svgDefs}

    <rect x="100" y="150" width="100" height="50" fill="#ddd" stroke="#333" stroke-width="2"/>
    <circle cx="150" cy="150" r="30" fill="#ccc" stroke="#333" stroke-width="2"/>
    
    <!-- Nozzles representation -->
    <rect x="140" y="100" width="20" height="20" fill="#aaa" stroke="#333" stroke-width="2"/>
    <rect x="180" y="165" width="20" height="20" fill="#aaa" stroke="#333" stroke-width="2"/>

    <text x="150" y="230" text-anchor="middle" font-size="12" fill="#333">${pumpType || 'Pump'}</text>
    <text x="150" y="245" text-anchor="middle" font-size="10" fill="#666">API 610 Evaluation</text>
    </svg>
  `;
  return svg;
}
