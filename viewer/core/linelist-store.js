export const linelistStore = {
  data: [], // Array of objects
  headers: [],
  mapping: {
    lineNo: 'Line Number', // The column name in the CSV/Excel that represents the line number
    fluidDensity: 'Fluid Density',
    velocity: 'Velocity',
    // We can add other mappings here later
  }
};

export function getLinelist() {
  return linelistStore;
}

export function setLinelistData(data, headers) {
  linelistStore.data = data;
  linelistStore.headers = headers;
}

export function updateLinelistMapping(mappingPatch) {
  linelistStore.mapping = { ...linelistStore.mapping, ...mappingPatch };
}
