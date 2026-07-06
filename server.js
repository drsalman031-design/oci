const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const DIST_DIR = path.join(__dirname, 'dist');
const LOG_FILE = path.join(__dirname, 'server.log');

// Clear log file on startup
try {
  fs.writeFileSync(LOG_FILE, '');
} catch (e) {}

function log(msg) {
  const line = `${new Date().toISOString()} ${msg}\n`;
  console.log(msg);
  try {
    fs.appendFileSync(LOG_FILE, line);
  } catch (e) {}
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm'
};

const server = http.createServer((req, res) => {
  // Normalize path to prevent directory traversal
  let safePath = path.normalize(req.url.split('?')[0]);
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  let filePath = path.join(DIST_DIR, safePath);

  // Check if file exists and is not a directory
  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      log(`[200] ${req.url} -> ${filePath} (${contentType})`);
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Cache-Control': 'no-store, must-revalidate'
      });
      fs.createReadStream(filePath).pipe(res);
    } else {
      // ONLY fallback to index.html if it's not a static asset request
      const ext = path.extname(safePath).toLowerCase();
      const isStaticAsset = ext && ext !== '.html';

      if (isStaticAsset) {
        log(`[404] ${req.url} (Static asset not found: ${filePath})`);
        res.writeHead(404, { 
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-store, must-revalidate'
        });
        res.end('Not Found');
        return;
      }

      // SPA Fallback: Serve index.html for any unhandled routes (HTML/extensionless routes)
      const indexPath = path.join(DIST_DIR, 'index.html');
      fs.stat(indexPath, (indexErr, indexStats) => {
        if (!indexErr && indexStats.isFile()) {
          log(`[FALLBACK 200] ${req.url} -> index.html (File not found at: ${filePath})`);
          res.writeHead(200, { 
            'Content-Type': 'text/html',
            'Cache-Control': 'no-store, must-revalidate'
          });
          fs.createReadStream(indexPath).pipe(res);
        } else {
          log(`[404] ${req.url} (Index fallback also failed)`);
          res.writeHead(404, { 
            'Content-Type': 'text/plain',
            'Cache-Control': 'no-store, must-revalidate'
          });
          res.end('Not Found');
        }
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
