import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const sourceFiles = [
  'index.html',
  'css/styles.css',
  'js/config.js',
  'js/i18n.js',
  'js/data-loader.js',
  'js/ontology.js',
  'js/graph-data.js',
  'js/main.js',
  'js/graph/node-renderer.js',
  'js/graph/link-renderer.js',
  'js/graph/simulation.js',
  'js/interactions/filters.js',
  'js/interactions/node-details.js'
];

test('source files declare author and license metadata', () => {
  for (const relativePath of sourceFiles) {
    const filePath = path.join(rootDir, relativePath);
    const content = fs.readFileSync(filePath, 'utf8');
    assert.match(content, /Matthieu GRALL/i, `${relativePath} should mention Matthieu GRALL`);
    assert.match(content, /CC BY 4\.0|Creative Commons/i, `${relativePath} should mention the license`);
  }
});

test('the main HTML document points to existing assets', () => {
  const htmlPath = path.join(rootDir, 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  const cssMatch = html.match(/href="([^"]+)"/);
  const scriptMatches = [...html.matchAll(/src="([^"]+)"/g)].map(match => match[1]);

  assert.ok(cssMatch, 'index.html should reference a stylesheet');
  assert.ok(fs.existsSync(path.join(rootDir, cssMatch[1])), 'Stylesheet file should exist');
  scriptMatches.forEach(scriptPath => {
    if (!scriptPath.startsWith('http')) {
      assert.ok(fs.existsSync(path.join(rootDir, scriptPath)), `${scriptPath} should exist`);
    }
  });
});

test('javascript modules are syntactically valid', () => {
  const jsFiles = sourceFiles.filter(file => file.endsWith('.js'));
  for (const relativePath of jsFiles) {
    const filePath = path.join(rootDir, relativePath);
    const content = fs.readFileSync(filePath, 'utf8');
    new vm.Script(content, { filename: relativePath });
  }
});
