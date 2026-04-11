import { createSvgShell, svgDefs } from './svg-shell.js';

export function generateWeldedShoeSvg(inputs) {
  const svg = `
    ${createSvgShell("0 0 300 300")}
    ${svgDefs}

    <circle cx="150" cy="100" r="50" fill="#ddd" stroke="#333" stroke-width="2"/>
    <rect x="140" y="150" width="20" height="80" fill="#aaa" stroke="#333" stroke-width="2"/>
    <line x1="100" y1="230" x2="200" y2="230" stroke="#333" stroke-width="6"/>

    <line x1="150" y1="250" x2="150" y2="280" stroke="blue" stroke-width="3" marker-end="url(#arrow)"/>
    <text x="155" y="270" fill="blue" font-size="12">Fy</text>

    <line x1="220" y1="230" x2="250" y2="230" stroke="blue" stroke-width="3" marker-end="url(#arrow)"/>
    <text x="235" y="225" fill="blue" font-size="12">Fx</text>

    <text x="150" y="295" text-anchor="middle" font-size="12" fill="#333">T-Profile Pipe Shoe</text>
    </svg>
  `;
  return svg;
}
