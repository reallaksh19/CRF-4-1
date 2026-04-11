import { createSvgShell, drawDimension, svgDefs } from './svg-shell.js';

export function generatePsvOpenSvg(inputs) {
  const { pset, w, orificeLetter, od, wall, workingValves, impactFactor } = inputs;

  const svg = `
    ${createSvgShell("0 0 300 300")}
    ${svgDefs}

    <!-- PSV body -->
    <polygon points="120,220 180,220 180,180 120,180" fill="#ccc" stroke="#333" stroke-width="2"/>
    <polygon points="130,180 170,180 150,140" fill="#aaa" stroke="#333" stroke-width="2"/>

    <!-- Outlet Elbow -->
    <path d="M 180 200 Q 220 200 220 160" fill="none" stroke="#ddd" stroke-width="20"/>
    <path d="M 180 200 Q 220 200 220 160" fill="none" stroke="#333" stroke-width="2"/>

    <!-- Tailpipe -->
    <rect x="210" y="60" width="20" height="100" fill="#ddd" stroke="#333" stroke-width="2"/>
    
    <!-- Tailpipe Tip -->
    <line x1="210" y1="60" x2="230" y2="60" stroke="red" stroke-width="4"/>

    <!-- Vertical elbow reaction -->
    <line x1="220" y1="200" x2="220" y2="240" stroke="red" stroke-width="3" marker-end="url(#arrow)"/>
    <text x="225" y="235" fill="red" font-size="12">Vertical F</text>

    <!-- Horizontal balancing arrows (muted) -->
    <line x1="180" y1="200" x2="160" y2="200" stroke="#999" stroke-width="2" marker-end="url(#arrow)" opacity="0.5"/>
    <line x1="220" y1="160" x2="240" y2="160" stroke="#999" stroke-width="2" marker-end="url(#arrow)" opacity="0.5"/>

    <!-- Labels -->
    <text x="50" y="50" font-size="10" fill="#666">Pset: ${pset}</text>
    <text x="50" y="65" font-size="10" fill="#666">W: ${w}</text>
    <text x="50" y="80" font-size="10" fill="#666">Orifice: ${orificeLetter}</text>
    <text x="50" y="95" font-size="10" fill="#666">OD: ${od}, Wall: ${wall}</text>
    <text x="50" y="110" font-size="10" fill="#666">Valves: ${workingValves}</text>
    <text x="50" y="125" font-size="10" fill="#666">Impact: ${impactFactor}</text>

    </svg>
  `;
  return svg;
}
