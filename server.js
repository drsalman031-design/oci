const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');
const urlModule = require('url');

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

// Load .env variables manually to avoid external dotenv dependency
try {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
        if (key) {
          process.env[key] = value;
        }
      }
    });
    log('Loaded environment variables from local .env file.');
  }
} catch (e) {
  log(`Failed to read .env file: ${e.message}`);
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
  // Handle POST proxy routes securely
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const isAnalysisRoute = req.url.startsWith('/api/analysis/');
        
        if (isAnalysisRoute) {
          const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
          
          if (!apiKey) {
            log(`[500] API Key is missing on the server env: ${req.url}`);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Server configuration error: Gemini API Key is not set on the secure server backend.' }));
            return;
          }
          
          const model = 'gemini-2.5-flash';
          const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const parsedUrl = urlModule.parse(targetUrl);
          
          const options = {
            hostname: parsedUrl.hostname,
            path: parsedUrl.path,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          };
          
          log(`[PROXY REQUEST] ${req.url} -> generativelanguage.googleapis.com`);
          
          const proxyReq = https.request(options, (proxyRes) => {
            let resData = '';
            proxyRes.on('data', d => {
              resData += d.toString();
            });
            proxyRes.on('end', () => {
              log(`[PROXY RESPONSE] Status ${proxyRes.statusCode}`);
              res.writeHead(proxyRes.statusCode, { 'Content-Type': 'application/json' });
              res.end(resData);
            });
          });
          
          proxyReq.on('error', e => {
            log(`[PROXY ERROR] ${e.message}`);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Backend API forwarding failed: ${e.message}` }));
          });
          
          proxyReq.write(JSON.stringify(payload));
          proxyReq.end();
          return;
        }
      } catch (err) {
        log(`[400] Bad Request payload: ${err.message}`);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Invalid request payload: ${err.message}` }));
        return;
      }
    });
    return;
  }

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
