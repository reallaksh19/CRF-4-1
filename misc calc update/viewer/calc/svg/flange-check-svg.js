import { createSvgShell, svgDefs } from './svg-shell.js';

export function generateFlangeCheckSvg(inputs) {
  const { method, nps, rating, material, ur } = inputs;
  
  const svg = `
    ${createSvgShell("0 0 300 300")}
    ${svgDefs}

    <!-- Pipe bodies -->
    <rect x="50" y="130" width="80" height="40" fill="#ddd" stroke="#333" stroke-width="2"/>
    <rect x="170" y="130" width="80" height="40" fill="#ddd" stroke="#333" stroke-width="2"/>

    <!-- Flanges -->
    <rect x="130" y="100" width="10" height="100" fill="#aaa" stroke="#333" stroke-width="2"/>
    <rect x="160" y="100" width="10" height="100" fill="#aaa" stroke="#333" stroke-width="2"/>
    
    <!-- Bolts -->
    <line x1="130" y1="110" x2="170" y2="110" stroke="#555" stroke-width="3"/>
    <line x1="130" y1="190" x2="170" y2="190" stroke="#555" stroke-width="3"/>

    <!-- Moment Arrow -->
    <path d="M 150 70 A 40 40 0 0 1 190 110" fill="none" stroke="red" stroke-width="3" marker-end="url(#arrow)"/>
    <text x="195" y="85" fill="red" font-size="12">M</text>
    
    <!-- Axial Arrow -->
    <line x1="260" y1="150" x2="290" y2="150" stroke="blue" stroke-width="3" marker-end="url(#arrow)"/>
    <text x="275" y="140" fill="blue" font-size="12" text-anchor="middle">F_ax</text>

    <!-- Labels -->
    <text x="150" y="240" text-anchor="middle" font-size="12" fill="#333">Method: ${method || 'NC'}</text>
    <text x="150" y="255" text-anchor="middle" font-size="10" fill="#666">NPS ${nps || 0} CL ${rating || 0}</text>
    <text x="150" y="270" text-anchor="middle" font-size="10" fill="#666">Mat: ${material || 'N/A'}</text>
    <text x="150" y="285" text-anchor="middle" font-size="12" fill="${(ur !== undefined && ur <= 1.0) ? 'green' : 'red'}">UR: ${ur !== undefined ? ur.toFixed(2) : '0.00'}</text>

    </svg>
  `;
  return svg;
}
