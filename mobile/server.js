// Static server for the Expo web export (`npm run build` -> dist/).
// Dependency-free on purpose: nothing here can be dropped by a production
// install pruning devDependencies.
const http = require('http');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, 'dist');
const PORT = process.env.PORT || 3000;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

// Worth compressing: the JS bundle alone is ~2.7MB uncompressed.
const COMPRESSIBLE = /^(text\/|application\/(json|javascript)|image\/svg)/;

function send(res, status, body, headers) {
  res.writeHead(status, headers);
  res.end(body);
}

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    return send(res, 400, 'Bad Request', { 'Content-Type': 'text/plain' });
  }

  // Resolve inside ROOT — anything escaping it is a traversal attempt.
  const target = path.join(ROOT, pathname);
  const resolved = path.resolve(target);
  if (resolved !== ROOT && !resolved.startsWith(ROOT + path.sep)) {
    return send(res, 403, 'Forbidden', { 'Content-Type': 'text/plain' });
  }

  let file = resolved;
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    // SPA: unknown paths fall back to index.html so client routing works.
    // Missing assets should 404 rather than silently return HTML.
    if (path.extname(pathname)) {
      return send(res, 404, 'Not Found', { 'Content-Type': 'text/plain' });
    }
    file = path.join(ROOT, 'index.html');
    if (!fs.existsSync(file)) {
      return send(res, 500, 'Build missing — run `npm run build`.', { 'Content-Type': 'text/plain' });
    }
  }

  const ext = path.extname(file).toLowerCase();
  const type = TYPES[ext] || 'application/octet-stream';
  const headers = { 'Content-Type': type };

  // Asset filenames under _expo/static are content-hashed, so they can be
  // cached forever; index.html must not be, or clients pin to a stale bundle.
  headers['Cache-Control'] = pathname.startsWith('/_expo/static/')
    ? 'public, max-age=31536000, immutable'
    : 'no-cache';

  const body = fs.readFileSync(file);
  const acceptsGzip = /\bgzip\b/.test(req.headers['accept-encoding'] || '');
  if (acceptsGzip && COMPRESSIBLE.test(type) && body.length > 1024) {
    const gz = zlib.gzipSync(body);
    return send(res, 200, gz, { ...headers, 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' });
  }
  send(res, 200, body, headers);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`SpotFinder web serving ${ROOT} on :${PORT}`);
});
