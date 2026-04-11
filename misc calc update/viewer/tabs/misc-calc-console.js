import { subscribeSession } from '../calc/core/calc-session.js';

export function renderMiscCalcConsole(container) {
  container.innerHTML = `
    <div id="calc-console" class="calc-console-panel" style="position: sticky; bottom: 0; background: #1e1e1e; color: #d4d4d4; padding: 10px; font-family: monospace; font-size: 12px; max-height: 250px; overflow-y: auto; border-top: 2px solid #007acc; margin-top: 20px;">
      <div style="font-weight: bold; margin-bottom: 5px; color: #569cd6;">Calculations Console >_</div>
      <div id="calc-console-output">Ready. Select a calculation to begin.</div>
    </div>
  `;

  const output = container.querySelector('#calc-console-output');

  if (container._unsubscribe) {
      container._unsubscribe();
  }

  container._unsubscribe = subscribeSession((session) => {
    if (!session) {
      output.innerHTML = 'Ready. Select a calculation to begin.';
      return;
    }

    let html = `<div style="color: #4ec9b0;">[Session Start] ${new Date().toLocaleTimeString()}</div>`;
    html += `<div><strong>Calculator:</strong> ${session.metadata.name} | <strong>Method:</strong> ${session.metadata.method} | <strong>Mode:</strong> ${session.metadata.unitMode}</div>`;

    const renderKV = (obj) => {
        if (!obj || typeof obj !== 'object') return String(obj);
        return Object.entries(obj).map(([k, v]) => `<div><span style="color: #9cdcfe;">${k}</span> = <span style="color: #b5cea8;">${typeof v === 'object' ? JSON.stringify(v) : v}</span></div>`).join('');
    };

    if (session.inputResolution) {
        html += `<div style="margin-top: 5px; color: #ce9178;">[Input Resolution]</div>`;
        html += `<div style="padding-left: 10px;">${renderKV(session.inputResolution)}</div>`;
    } else {
        html += `<div style="margin-top: 5px; color: #ce9178;">[Inputs]</div>`;
        html += `<div style="padding-left: 10px;">${renderKV(session.inputs)}</div>`;
    }

    if (session.steps && session.steps.length) {
      html += `<div style="margin-top: 5px; color: #ce9178;">[Equation Trace]</div>`;
      session.steps.forEach((s, i) => {
        html += `<div style="padding-left: 10px; color: #d4d4d4;">${i+1}. ${s}</div>`;
      });
    }

    if (session.intermediateValues && Object.keys(session.intermediateValues).length) {
       html += `<div style="margin-top: 5px; color: #ce9178;">[Intermediate Values]</div>`;
       html += `<div style="padding-left: 10px;">${renderKV(session.intermediateValues)}</div>`;
    }

    html += `<div style="margin-top: 5px; color: #ce9178;">[Outputs]</div>`;
    html += `<div style="padding-left: 10px;">${renderKV(session.outputs)}</div>`;

    if (session.benchmark) {
      html += `<div style="margin-top: 5px; color: #ce9178;">[Benchmark Block]</div>`;
      html += `<div style="padding-left: 10px;">${renderKV(session.benchmark)}</div>`;
    }

    if (session.sourceSnapshot) {
      html += `<div style="margin-top: 5px; color: #ce9178;">[Source Snapshot]</div>`;
      html += `<div style="padding-left: 10px;">${renderKV(session.sourceSnapshot)}</div>`;
    }

    if (session.warnings && session.warnings.length) {
      html += `<div style="margin-top: 5px; color: #d7ba7d;">[Warnings / Assumptions]</div>`;
      session.warnings.forEach(w => {
         html += `<div>⚠️ ${w}</div>`;
      });
    }

    if (session.errors && session.errors.length) {
      html += `<div style="margin-top: 5px; color: #f44747;">[Errors]</div>`;
      session.errors.forEach(e => {
         html += `<div>❌ ${e}</div>`;
      });
    }

    html += `<div style="margin-top: 5px; color: ${session.pass ? '#4ec9b0' : '#f44747'};">[Result] ${session.pass ? 'PASS' : 'FAIL'}</div>`;

    output.innerHTML = html;

    // Auto-scroll to bottom
    const consolePanel = container.querySelector('#calc-console');
    if (consolePanel) {
      consolePanel.scrollTop = consolePanel.scrollHeight;
    }
  });
}
