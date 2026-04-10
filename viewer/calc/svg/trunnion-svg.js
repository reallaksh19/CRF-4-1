import { createSvgShell, drawDimension, svgDefs } from './svg-shell.js';

export function generateTrunnionSvg(inputs) {
  const { od, wall, fx, fy, fz } = inputs;

  const fShear = Math.sqrt(fy*fy + fz*fz).toFixed(0);

  const svg = `
    ${createSvgShell("0 0 300 300")}
    ${svgDefs}

    <!-- Main Pipe -->
    <circle cx="150" cy="150" r="100" fill="none" stroke="#333" stroke-width="3"/>
    <circle cx="150" cy="150" r="80" fill="none" stroke="#333" stroke-width="1" stroke-dasharray="5,5"/>

    <!-- Trunnion Attachment (Top view projection) -->
    <rect x="130" y="50" width="40" height="20" fill="#ccc" stroke="#333" stroke-width="2"/>

    <!-- Forces -->
    <!-- Fx Axial -->
    <line x1="150" y1="20" x2="150" y2="50" stroke="red" stroke-width="3" marker-end="url(#arrow)"/>
    <text x="160" y="30" fill="red" font-size="12">Fx = ${fx} N</text>

    <!-- FShear -->
    <line x1="100" y1="60" x2="130" y2="60" stroke="blue" stroke-width="3" marker-end="url(#arrow)"/>
    <text x="50" y="65" fill="blue" font-size="12">V = ${fShear} N</text>

    <!-- Dimensions -->
    ${drawDimension(50, 150, 250, 150, `OD = ${od} mm`, -110)}
    ${drawDimension(150, 50, 150, 70, `t = ${wall} mm`, 50)}

    </svg>
  `;
  return svg;
}
