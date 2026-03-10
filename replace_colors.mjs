import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';

const srcDir = 'C:\\Users\\nonet\\OneDrive\\\u30c9\u30ad\u30e5\u30e1\u30f3\u30c8\\game-wiki\\frontend\\src';

function walk(dir) {
  const files = [];
  for (const f of readdirSync(dir)) {
    const full = join(dir, f);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else if (f.endsWith('.tsx') || f.endsWith('.css')) files.push(full);
  }
  return files;
}

const replacements = [
  ['red-800', 'red-900'],
  ['red-700', 'red-800'],
  ['red-500', 'red-700'],
  ['red-400', 'red-600'],
];

for (const file of walk(srcDir)) {
  let c = readFileSync(file, 'utf8');
  const orig = c;
  for (const [from, to] of replacements) c = c.split(from).join(to);
  if (c !== orig) {
    writeFileSync(file, c, 'utf8');
    console.log('Updated:', basename(file));
  }
}
console.log('done');
