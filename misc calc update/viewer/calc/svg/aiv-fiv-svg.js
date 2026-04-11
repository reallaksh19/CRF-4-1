import { createSvgShell, svgDefs } from './svg-shell.js';

export function generateAivFivSvg(inputs) {
  const svg = `
    ${createSvgShell("0 0 300 300")}
    ${svgDefs}

    <rect x="50" y="140" width="200" height="20" fill="#ddd" stroke="#333" stroke-width="2"/>
    <path d="M 50 150 Q 150 100 250 150" fill="none" stroke="red" stroke-width="2" stroke-dasharray="4,4"/>
    <path d="M 50 150 Q 150 200 250 150" fill="none" stroke="red" stroke-width="2" stroke-dasharray="4,4"/>

    <text x="150" y="220" text-anchor="middle" font-size="12" fill="#333">High Frequency Vibration Screening</text>
    <text x="150" y="240" text-anchor="middle" font-size="10" fill="#666">Mode: ${inputs.mode || 'AIV'}</text>
    </svg>
  `;
  return svg;
}
