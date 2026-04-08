import fs from 'node:fs';
import path from 'node:path';

const clientRoot = process.cwd();
const srcRoot = path.join(clientRoot, 'src');
const disallowedExtensions = new Set(['.ts', '.tsx']);
const disallowedSnippets = ['import type', '.ts"', ".ts'", '.tsx"', ".tsx'"];
const flaggedFiles = [];
const flaggedSnippets = [];

function walk(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    const extension = path.extname(entry.name);
    if (disallowedExtensions.has(extension)) {
      flaggedFiles.push(path.relative(clientRoot, fullPath));
      continue;
    }

    if (extension !== '.js' && extension !== '.jsx') {
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    for (const snippet of disallowedSnippets) {
      if (content.includes(snippet)) {
        flaggedSnippets.push({
          file: path.relative(clientRoot, fullPath),
          snippet,
        });
      }
    }
  }
}

walk(srcRoot);

if (!fs.existsSync(path.join(srcRoot, 'App.jsx'))) {
  flaggedFiles.push('src/App.jsx');
}

if (flaggedFiles.length || flaggedSnippets.length) {
  console.error('Client JSX validation failed.');

  if (flaggedFiles.length) {
    console.error('Unexpected TypeScript artifacts or missing JSX entry:');
    for (const file of flaggedFiles) {
      console.error(`- ${file}`);
    }
  }

  if (flaggedSnippets.length) {
    console.error('Unexpected TypeScript import usage:');
    for (const item of flaggedSnippets) {
      console.error(`- ${item.file} contains ${item.snippet}`);
    }
  }

  process.exit(1);
}

console.log('Client JSX validation passed.');
