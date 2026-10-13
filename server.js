import http from 'node:http';
import { readFile, writeFile, mkdir, rename, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const root = path.dirname(fileURLToPath(import.meta.url));
const publicRoot = path.join(root, 'public');
const dataDirectory = path.resolve(process.env.DATA_DIR || path.join(root, 'data'));
const commentsFile = path.join(dataDirectory, 'comments.json');
await mkdir(dataDirectory, { recursive: true });
let comments;
try {
  comments = JSON.parse(await readFile(commentsFile, 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
  comments = [];
}
let pendingSave = Promise.resolve();
const contentTypes = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.jpg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg',
  '.woff2': 'font/woff2', '.ttf': 'font/ttf'
};
function json(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(value));
}
async function readJson(request) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 65536) throw Object.assign(new Error('Lời chúc quá dài.'), { status: 413 });
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw Object.assign(new Error('Dữ liệu không hợp lệ.'), { status: 400 }); }
}
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname === '/api/comments') {
      if (request.method === 'GET') return json(response, 200, comments);
      if (request.method !== 'POST') return json(response, 405, { error: 'Phương thức không được hỗ trợ.' });
      const body = await readJson(request);
      const name = typeof body?.name === 'string' ? body.name.trim() : '';
      const message = typeof body?.message === 'string' ? body.message.trim() : '';
      if (!name || !message || name.length > 500 || message.length > 10000) {
        return json(response, 400, { error: 'Vui lòng nhập tên và lời chúc hợp lệ.' });
      }
      const comment = { id: randomUUID(), name, message, createdAt: new Date().toISOString() };
      const save = pendingSave.then(async () => {
        const updated = [comment, ...comments];
        await writeFile(commentsFile + '.tmp', JSON.stringify(updated, null, 2));
        await rename(commentsFile + '.tmp', commentsFile);
        comments = updated;
      });
      pendingSave = save.catch(() => {});
      await save;
      return json(response, 201, comment);
    }
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405); return response.end();
    }
    const pathname = decodeURIComponent(url.pathname);
    const requested = ['/', '/i/tangduy-hongnhung', '/i/tangduy-hongnhung/'].includes(pathname) ? 'index.html' : pathname.slice(1);
    const filename = path.resolve(publicRoot, requested);
    if (!filename.startsWith(publicRoot + path.sep)) {
      response.writeHead(403); return response.end('Forbidden');
    }
    const info = await stat(filename);
    if (!info.isFile()) { response.writeHead(404); return response.end('Not found'); }
    const headers = {
      'Content-Type': contentTypes[path.extname(filename)] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': /\.(?:jpg|png|webp|mp3|woff2|ttf)$/.test(filename) ? 'public, max-age=86400' : 'no-cache'
    };
    let start = 0;
    let end = info.size - 1;
    let status = 200;
    if (request.headers.range) {
      const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
      if (!range || (!range[1] && !range[2])) {
        response.writeHead(416, { 'Content-Range': `bytes */${info.size}` }); return response.end();
      }
      if (range[1]) { start = Number(range[1]); end = range[2] ? Math.min(Number(range[2]), end) : end; }
      else { start = Math.max(0, info.size - Number(range[2])); }
      if (start > end || start >= info.size) {
        response.writeHead(416, { 'Content-Range': `bytes */${info.size}` }); return response.end();
      }
      status = 206;
      headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
    }
    headers['Accept-Ranges'] = 'bytes';
    headers['Content-Length'] = end - start + 1;
    response.writeHead(status, headers);
    if (request.method === 'HEAD') return response.end();
    const { createReadStream } = await import('node:fs');
    const stream = createReadStream(filename, { start, end });
    stream.on('error', () => response.destroy());
    stream.pipe(response);
  } catch (error) {
    if (response.headersSent) return response.destroy();
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      response.writeHead(404); return response.end('Not found');
    }
    if (!error.status) console.error(error);
    json(response, error.status || 500, { error: error.status ? error.message : 'Không thể lưu lời chúc. Vui lòng thử lại.' });
  }
});
const port = Number(process.env.PORT || 3000);
server.listen(port, process.env.HOST || '127.0.0.1', () => {
  console.log(`Wedding invitation ready at http://localhost:${port}`);
});
