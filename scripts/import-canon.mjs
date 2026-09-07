import { readFileSync, writeFileSync } from 'node:fs';
const source = readFileSync(new URL('../../docs/variable-canon.md', import.meta.url), 'utf8');
let family = '';
const entries = [];
for (const line of source.split(/\r?\n/)) {
  const header = line.match(/^## .*\(`([a-z]+)`\)/);
  if (header) family = header[1];
  const row = line.match(/^\| `([a-z_]+)` \| ([MRLDH/]+) \| ([^|]+) \| ([^|]+) \|/);
  if (row) entries.push({ id: `${family}.${row[1]}`, family, key: row[1], scale: row[2], low: row[3].trim(), high: row[4].trim() });
}
if (entries.length !== 160 || new Set(entries.map(x => x.id)).size !== 160) throw Error('Canon must contain 160 unique IDs');
writeFileSync(new URL('../lib/canon.json', import.meta.url), JSON.stringify(entries, null, 2) + '\n');
console.log('Imported 160 versioned rating definitions.');
