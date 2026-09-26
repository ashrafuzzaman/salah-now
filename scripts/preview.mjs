// Serve the browser preview of the watch app: npm run preview [-- port]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const port = Number(process.argv[2]) || 5173;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.hml': 'text/plain', '.json': 'application/json' };

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p === '/') p = '/preview/index.html';
  const file = path.join(root, p);
  if (!file.startsWith(root + path.sep) || !(p.startsWith('/src/') || p.startsWith('/preview/'))) {
    res.writeHead(404).end();
    return;
  }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(buf);
  });
}).listen(port, '127.0.0.1', () => {
  const url = `http://localhost:${port}/`;
  console.log(`Salah Now preview: ${url}  (Ctrl+C to stop)`);
  if (!process.env.NO_OPEN) exec(`${process.platform === 'darwin' ? 'open' : 'xdg-open'} ${url}`);
});
