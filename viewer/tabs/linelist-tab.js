import { getLinelist, setLinelistData, updateLinelistMapping } from '../core/linelist-store.js';

export function renderLinelist(container) {
  const store = getLinelist();

  container.innerHTML = `
    <div class="report-section" id="section-linelist">
      <h3 class="section-heading">Linelist Manager</h3>
      <p class="tab-note">Import an Excel or CSV Linelist to enrich parsing data (e.g., Velocity and Fluid Densities for Momentum calculations).</p>

      <div class="upload-section" style="margin-bottom: 1rem; border: 2px dashed var(--color-border); padding: 2rem; text-align: center; background: #fafbfc; border-radius: var(--radius);">
        <div style="font-weight: 600; margin-bottom: 0.5rem;">Drop Linelist Excel (.xlsx) or CSV file here</div>
        <div style="color: var(--text-muted); font-size: 0.85rem;">or click below to browse</div>
        <input type="file" id="linelist-upload" accept=".csv,.xlsx,.xls" style="margin-top: 1rem;" />
      </div>

      <div id="linelist-mapping-section" style="${store.headers.length ? 'display:block;' : 'display:none;'}">
        <h4 class="sub-heading">Column Mapping</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 1rem;">
          <label>Line Number Column:
            <select id="ll-map-lineno" class="ll-mapping-select" data-key="lineNo">
              <option value="">-- Select --</option>
              ${store.headers.map(h => `<option value="${h}" ${store.mapping.lineNo === h ? 'selected' : ''}>${h}</option>`).join('')}
            </select>
          </label>
          <label>Fluid Density Column:
            <select id="ll-map-density" class="ll-mapping-select" data-key="fluidDensity">
              <option value="">-- Select --</option>
              ${store.headers.map(h => `<option value="${h}" ${store.mapping.fluidDensity === h ? 'selected' : ''}>${h}</option>`).join('')}
            </select>
          </label>
          <label>Velocity Column:
            <select id="ll-map-velocity" class="ll-mapping-select" data-key="velocity">
              <option value="">-- Select --</option>
              ${store.headers.map(h => `<option value="${h}" ${store.mapping.velocity === h ? 'selected' : ''}>${h}</option>`).join('')}
            </select>
          </label>
        </div>
      </div>

      <div id="linelist-preview-section" style="${store.data.length ? 'display:block;' : 'display:none;'}">
        <h4 class="sub-heading">Data Preview (${store.data.length} rows loaded)</h4>
        <div class="table-scroll" style="max-height: 400px; overflow: auto; border: 1px solid var(--color-border);">
          <table class="data-table" style="width: 100%;">
            <thead>
              <tr>${store.headers.slice(0, 10).map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${store.data.slice(0, 50).map(row => `
                <tr>${store.headers.slice(0, 10).map(h => `<td>${row[h] || ''}</td>`).join('')}</tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // File input logic
  container.querySelector('#linelist-upload')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.name.endsWith('.csv')) {
      const text = await file.text();
      _parseCSV(text, container);
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      await _parseExcel(file, container);
    }
  });

  // Mapping dropdown logic
  container.querySelectorAll('.ll-mapping-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const key = e.target.dataset.key;
      const value = e.target.value;
      updateLinelistMapping({ [key]: value });
    });
  });
}

function _parseCSV(text, container) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length < 2) return;
  const headers = lines[0].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = row[idx]; });
    data.push(obj);
  }
  setLinelistData(data, headers);
  renderLinelist(container);
}

async function _parseExcel(file, container) {
  try {
    // Dynamic import XLSX from cdn for pure client-side processing
    const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs');
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf);
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    // header: 1 gives 2D array, we'll just use the default to get array of objects
    const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      setLinelistData(data, headers);
      renderLinelist(container);
    } else {
      alert("Excel file is empty or cannot be parsed.");
    }
  } catch (err) {
    console.error("Excel parse error:", err);
    alert("Failed to parse Excel file. See console for details.");
  }
}
