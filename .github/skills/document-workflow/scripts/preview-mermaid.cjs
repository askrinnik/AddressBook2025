#!/usr/bin/env node
// Serves every ```mermaid block of one Markdown file as rendered SVG on http://127.0.0.1:<port>/.
// The file is re-read on every request, so a browser reload always shows the current text.
// Rendering happens in the browser with Mermaid 11 from the jsDelivr CDN (internet access needed).
// When rendering finishes, document.title is "rendered" or "error: <message>", and a failed
// diagram also shows its error in a red <pre class="err"> next to it.
//
// Usage: node preview-mermaid.cjs <file.md> [port]   (default port 8765, binds 127.0.0.1 only)

const http = require('http');
const fs = require('fs');
const path = require('path');

const file = process.argv[2];
const port = Number(process.argv[3] || 8765);
if (!file) {
  console.error('usage: node preview-mermaid.cjs <file.md> [port]');
  process.exit(2);
}
const fullPath = path.resolve(file);

function extractBlocks(markdown) {
  const blocks = [];
  const re = /^```mermaid[ \t]*\r?\n([\s\S]*?)^```[ \t]*$/gm;
  let m;
  while ((m = re.exec(markdown)) !== null) blocks.push(m[1]);
  return blocks;
}

function page(blocks) {
  const data = JSON.stringify(blocks).replace(/</g, '\\u003c');
  return `<!doctype html><html><head><meta charset="utf-8"><title>rendering</title>
<style>body{font-family:Segoe UI,sans-serif;margin:16px;background:#fff}
.err{color:#b91c1c;white-space:pre-wrap}.diagram{margin-bottom:32px}</style></head><body>
<p>${blocks.length} Mermaid block(s) in ${path.basename(fullPath)}</p>
<div id="out"></div>
<script type="module">
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' });
const blocks = ${data};
const out = document.getElementById('out');
const errors = [];
for (let i = 0; i < blocks.length; i++) {
  const div = document.createElement('div');
  div.className = 'diagram';
  out.appendChild(div);
  try {
    const { svg } = await mermaid.render('mmd' + i, blocks[i]);
    div.innerHTML = svg;
  } catch (e) {
    errors.push('block ' + (i + 1) + ': ' + (e && e.message ? e.message : e));
    const pre = document.createElement('pre');
    pre.className = 'err';
    pre.textContent = errors[errors.length - 1];
    div.appendChild(pre);
  }
}
document.title = errors.length ? 'error: ' + errors.join(' | ') : (blocks.length ? 'rendered' : 'error: no mermaid blocks');
</script></body></html>`;
}

http.createServer((req, res) => {
  let body;
  try {
    body = page(extractBlocks(fs.readFileSync(fullPath, 'utf8')));
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('cannot read ' + fullPath + ': ' + e.message);
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}).listen(port, '127.0.0.1', () => {
  console.log(`preview of ${fullPath} on http://127.0.0.1:${port}/`);
});
