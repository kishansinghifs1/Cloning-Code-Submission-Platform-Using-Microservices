const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const PORT = 5500;
const ROOT = __dirname;

const PROXY_TARGETS = {
  user: 'http://127.0.0.1:16000',
  problem: 'http://127.0.0.1:13000',
  submission: 'http://127.0.0.1:15000',
  socket: 'http://127.0.0.1:13001'
};

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

function normalizePath(urlPath) {
  let safePath = decodeURIComponent(urlPath.split('?')[0]);
  if (safePath === '/' || safePath === '') {
    safePath = '/index.html';
  }

  if (!path.extname(safePath)) {
    const htmlCandidate = path.join(ROOT, safePath + '.html');
    if (fs.existsSync(htmlCandidate)) {
      safePath = safePath + '.html';
    }
  }

  return safePath;
}

async function proxyRequest(req, res, service, upstreamPath) {
  const base = PROXY_TARGETS[service];
  if (!base) {
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: false, message: 'Unknown proxy service' }));
    return;
  }

  const upstreamUrl = new URL(upstreamPath, base);

  const headers = { ...req.headers };
  delete headers.host;
  delete headers.connection;
  delete headers['content-length'];

  let bodyBuffer = null;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    bodyBuffer = Buffer.concat(chunks);
    if (bodyBuffer.length > 0) {
      headers['content-length'] = String(bodyBuffer.length);
    }
  }

  try {
    const response = await new Promise((resolve, reject) => {
      const upstreamReq = http.request(
        {
          protocol: upstreamUrl.protocol,
          hostname: upstreamUrl.hostname,
          port: upstreamUrl.port,
          method: req.method,
          path: `${upstreamUrl.pathname}${upstreamUrl.search}`,
          headers
        },
        (upstreamRes) => {
          const chunks = [];
          upstreamRes.on('data', (chunk) => chunks.push(chunk));
          upstreamRes.on('end', () => {
            resolve({
              statusCode: upstreamRes.statusCode || 500,
              headers: upstreamRes.headers,
              body: Buffer.concat(chunks)
            });
          });
        }
      );

      upstreamReq.on('error', reject);

      if (bodyBuffer && bodyBuffer.length > 0) {
        upstreamReq.write(bodyBuffer);
      }
      upstreamReq.end();
    });

    const responseHeaders = {};
    Object.entries(response.headers || {}).forEach(([key, value]) => {
      if (!value) return;
      if (key.toLowerCase() !== 'transfer-encoding') {
        responseHeaders[key] = value;
      }
    });

    res.writeHead(response.statusCode, responseHeaders);
    res.end(response.body);
  } catch (error) {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: false, message: 'Upstream service unreachable', error: error.message }));
  }
}

function serveStatic(req, res) {
  const urlPath = normalizePath(req.url || '/');
  const filePath = path.normalize(path.join(ROOT, urlPath));

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const requestUrl = req.url || '/';

  if (requestUrl.startsWith('/proxy/')) {
    const match = requestUrl.match(/^\/proxy\/([^/]+)(\/.*)?$/);
    if (!match) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, message: 'Invalid proxy request' }));
      return;
    }

    const service = match[1];
    const upstreamPath = match[2] || '/';
    await proxyRequest(req, res, service, upstreamPath);
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Frontend server running at http://localhost:${PORT}`);
});
