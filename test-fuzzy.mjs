const testCases = [
  'BTRM-1000-10"-P1710012-66620M0-01',
  '10"-P1710012-66620M0-01',
  'BTRM-1000-10"-P-1710012-66620M0-01',
  '10"-P-1710012-66620M0-01',
  'P1710012-66620M0-01',
  'P-1710012-66620M0-01',
  'P1710012',
  'P-1710012',
  '1000-10"-P1710012-66620M0-01'
];
const linelistKey = 'P1710012';
const normLLKey = linelistKey.replace(/[^A-Za-z0-9]/g, '');

for (const c of testCases) {
  const normC = c.replace(/[^A-Za-z0-9]/g, '');
  const match = normC.includes(normLLKey);
  console.log(c, '->', match);
}
