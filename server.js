const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const MIME = {'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.json':'application/json'};
const clients = new Set();

const server = http.createServer((req, res) => {
  let pathname = decodeURIComponent(req.url.split('?')[0]);
  if (pathname === '/') pathname = '/index.html';
  const file = path.normalize(path.join(ROOT, pathname));
  if (!file.startsWith(ROOT)) return res.writeHead(403).end('Forbidden');
  fs.readFile(file, (err, data) => {
    if (err) return res.writeHead(404).end('Not found');
    res.writeHead(200, {'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache'});
    res.end(data);
  });
});

const wss = new WebSocket.Server({ server, path: '/presence' });
function broadcastCount() {
  const message = JSON.stringify({ type: 'presence', users: clients.size, time: new Date().toISOString() });
  for (const ws of clients) if (ws.readyState === WebSocket.OPEN) ws.send(message);
}
wss.on('connection', ws => {
  clients.add(ws);
  broadcastCount();
  ws.on('close', () => { clients.delete(ws); broadcastCount(); });
  ws.on('error', () => { clients.delete(ws); });
});
setInterval(broadcastCount, 15000);
server.listen(PORT, () => console.log(`Deluxe Bus running at http://localhost:${PORT}`));
