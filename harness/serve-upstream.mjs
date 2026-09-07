import http from 'node:http';
import { readFile } from 'node:fs/promises';
const port = Number(process.env.UPSTREAM_PORT || 4198);
http.createServer(async (req, res) => {
  if (req.url === '/app.js') {
    try { res.setHeader('Content-Type', 'text/javascript'); res.end(await readFile('artifacts/upstream/app.js')); }
    catch { res.writeHead(500); res.end('Run npm run build:upstream'); }
    return;
  }
  res.setHeader('Content-Type', 'text/html');
  res.end('<!doctype html><html><head><meta charset="utf-8"><title>Base UI pinned reference</title><style>body{font:18px system-ui;padding:40px} [role=option]{padding:8px;background:#eee}[data-highlighted]{background:#acf}[aria-disabled=true]{color:#888} output{display:block;margin:20px}</style></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>');
}).listen(port, '127.0.0.1', () => console.log(`Upstream fixture http://localhost:${port}`));
