import fs from 'node:fs';
import path from 'node:path';

const serverRoot = process.cwd();
const srcRoot = path.join(serverRoot, 'src');
const disallowedExtensions = new Set(['.ts', '.tsx', '.d.ts']);
const disallowedSnippets = ['import type', '.ts"', ".ts'", '.tsx"', ".tsx'"];
const flaggedFiles = [];
const flaggedSnippets = [];
const jsFiles = [];

function walk(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    if (entry.name.endsWith('.d.ts')) {
      flaggedFiles.push(path.relative(serverRoot, fullPath));
      continue;
    }

    const extension = path.extname(entry.name);
    if (disallowedExtensions.has(extension)) {
      flaggedFiles.push(path.relative(serverRoot, fullPath));
      continue;
    }

    if (extension !== '.js') {
      continue;
    }

    jsFiles.push(fullPath);
    const content = fs.readFileSync(fullPath, 'utf8');

    for (const snippet of disallowedSnippets) {
      if (content.includes(snippet)) {
        flaggedSnippets.push({
          file: path.relative(serverRoot, fullPath),
          snippet,
        });
      }
    }
  }
}

walk(srcRoot);

if (!fs.existsSync(path.join(srcRoot, 'app', 'server.js'))) {
  flaggedFiles.push('src/app/server.js');
}

if (flaggedFiles.length || flaggedSnippets.length) {
  console.error('Server JS validation failed.');

  if (flaggedFiles.length) {
    console.error('Unexpected non-JS files or missing JS entry:');
    for (const file of flaggedFiles) {
      console.error(`- ${file}`);
    }
  }

  if (flaggedSnippets.length) {
    console.error('Unexpected TypeScript-specific syntax in JS source:');
    for (const item of flaggedSnippets) {
      console.error(`- ${item.file} contains ${item.snippet}`);
    }
  }

  process.exit(1);
}

console.log('Server JS validation passed.');
