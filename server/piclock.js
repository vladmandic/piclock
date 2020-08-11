const os = require('os');
const fs = require('fs');
const path = require('path');
const http = require('http');
const zlib = require('zlib');
const superagent = require('superagent');
const log = require('@vladmandic/pilogger');
const geoip = require('./geoip.js');

const secrets = fs.existsSync('./secrets.json') ? JSON.parse(fs.readFileSync('./secrets.json')) : { };
const options = {
  root: './public',
  default: 'piclock.html',
  log: './piclock.log',
  port: 10020,
  cache: 60 * 60 * 24 * 30 * 365, // 1 year
  brotli: false,
  bingKey: secrets.bingKey,
};
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm',
};

async function geoDecode(lat, lon) {
  try {
    const res = await superagent.get(`https://dev.virtualearth.net/REST/v1/Locations/${lat},${lon}?key=${options.bingKey}`);
    const json = JSON.parse(res.text);
    const addr = (json && json.resourceSets && json.resourceSets[0].resources) ? json.resourceSets[0].resources[0].address : null;
    return addr;
  } catch (err) {
    log.warn(`Maps geodecode: ${err}`);
    return null;
  }
}

async function api(req, res) {
  let data = {};
  const ip = (req.headers['forwarded'] || '').match(/for="\[(.*)\]:/)[1] || req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress;
  if (req.url.startsWith('/api/geoip')) data = await geoip.get(ip);
  const agent = (req.headers['user-agent'] || '').replace('(KHTML, like Gecko)', '').replace('Mozilla/5.0', '').replace('/  /g', ' ');
  data.device = agent.match(/\((.*)\)/)[1];
  data.agent = agent.replace(/\(.*\)/, '');
  data.address = await geoDecode(req.headers.lat || data.lat, req.headers.lon || data.lon);
  // if (data.address?.intersection) delete data.address.intersection;
  const json = JSON.stringify(data);
  res.writeHead(200, {
    'Content-Type': 'application/json', 'Content-Length': json.length, 'Cache-Control': 'no-cache', 'X-Powered-By': `NodeJS/${process.version}`,
  });
  log.data(`API ${req.url}`, json.length, json);
  res.end(json, 'utf-8');
}

async function request(req, res) {
  if (req.url.startsWith('/api/')) {
    api(req, res);
    return;
  }
  const file = req.url !== '/' ? `${options.root}/${req.url}` : `${options.root}/${options.default}`;
  let stat = { size: 0 };
  let data = { length: 0 };
  const ext = String(path.extname(file)).toLowerCase();
  const contentType = mime[ext] || 'application/octet-stream';
  if (!fs.existsSync(file)) {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('Error 404: Not Found\n', 'utf-8');
  } else {
    stat = fs.statSync(file);
    const content = fs.readFileSync(file);
    data = options.brotli ? zlib.brotliCompressSync(content) : content;
    const cache = contentType.startsWith('text/') ? 'no-cache' : `max-age=${options.cache}`;
    res.writeHead(200, {
      'Content-Language': 'en', 'Content-Type': contentType, 'Content-Encoding': (options.brotli ? 'br' : ''), 'Content-Length': data.length, 'Last-Modified': stat.mtime, 'Cache-Control': cache, 'X-Powered-By': `NodeJS/${process.version}`,
    });
    res.end(data); // , options.brotli ? 'binary' : 'utf-8');
  }
  const ip = req.headers['x-forwarded-for'] || req.ip || req.socket.remoteAddress;
  log.data(`${req.method}/${req.httpVersion}`, res.statusCode, contentType, stat.size, data.length, `${req.headers['host']}${req.url}`, ip);
  res.end();
}

async function main() {
  const node = JSON.parse(fs.readFileSync('./package.json'));
  log.logFile(options.log);
  log.info(node.name, 'version', node.version);
  log.info('User:', os.userInfo().username, 'Platform:', process.platform, 'Arch:', process.arch, 'Node:', process.version);
  const server = http.createServer(request);
  server.on('listening', () => log.state('Server listening:', options.port));
  server.listen(options.port);
  geoip.init();
}

main();
