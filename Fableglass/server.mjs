import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFileSync, existsSync, openSync, closeSync } from 'node:fs';
import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prepareStory, finishStory } from './story.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const host = '127.0.0.1';
const port = Number(process.env.FABLEGLASS_PORT || 26735);
const address = `http://${host}:${port}`;
const protocol = JSON.parse(readFileSync(process.env.FABLEGLASS_PROTOCOL || path.join(root, 'protocol.json'), 'utf8'));
const key = randomBytes(32).toString('hex');
const files = new Map([
  ['/', ['web/index.html', 'text/html']],
  ['/scene.css', ['web/scene.css', 'text/css']],
  ['/scene.js', ['web/scene.js', 'text/javascript']],
]);
let engine;
let enginePort;
let engineError;
let quitting = false;

function openWindow() {
  if (process.argv.includes('--no-open') || process.env.FABLEGLASS_NO_OPEN === '1') return;
  const edge = [process.env['ProgramFiles(x86)'], process.env.ProgramFiles].filter(Boolean)
    .map(folder => path.join(folder, 'Microsoft', 'Edge', 'Application', 'msedge.exe')).find(existsSync);
  const window = edge ? spawn(edge, [`--app=${address}`], { detached: true, stdio: 'ignore' })
    : spawn('explorer.exe', [address], { detached: true, stdio: 'ignore' });
  window.on('error', error => console.error(error.message));
  window.unref();
}

async function startEngine() {
  const temporary = net.createServer();
  await new Promise((resolve, reject) => temporary.once('error', reject).listen(0, host, resolve));
  enginePort = temporary.address().port;
  await new Promise(resolve => temporary.close(resolve));
  if (quitting) return;

  const exe = path.join(root, 'runtime', 'llama-server.exe');
  const model = process.env.FABLEGLASS_MODEL || path.join(root, 'fableglass-q8.gguf');
  if (!existsSync(exe) || !existsSync(model)) throw new Error('Keep the model and runtime in the Fableglass folder.');
  const log = openSync(path.join(root, process.env.FABLEGLASS_PORT ? 'test-engine.log' : 'engine.log'), 'w');
  try {
    engine = spawn(exe, ['-m', model, '--host', host, '--port', String(enginePort),
      '-ngl', '0', '-dev', 'none', '-t', '8', '-tb', '8', '-np', '1', '-c', String(protocol.architecture.context),
      '--api-key', key, '--no-webui', '--no-webui-mcp-proxy'], {
      cwd: root, windowsHide: true, stdio: ['ignore', log, log],
    });
  } finally { closeSync(log); }
  engine.on('error', error => { engineError = error.message; });
  engine.on('exit', code => { if (!quitting) engineError = `The model exited (${code}). See engine.log in the Fableglass folder.`; });
}

async function healthy() {
  if (!enginePort || engineError) return false;
  try { return (await fetch(`http://${host}:${enginePort}/health`, { signal: AbortSignal.timeout(1000) })).ok; }
  catch { return false; }
}

function json(response, status, data) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(data));
}

async function readTurn(request) {
  if (request.headers['content-type'] !== 'application/json') throw new Error('Expected a JSON turn.');
  let body = '';
  request.setEncoding('utf8');
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 64_000) throw new Error('The turn exceeds the input limit.');
  }
  const turn = JSON.parse(body);
  if (!turn || typeof turn !== 'object' ||
      (turn.state ? typeof turn.message !== 'string' || !turn.message.trim() || turn.message.length > 2700
        : typeof turn.premise !== 'string' || !turn.premise.trim() || turn.premise.length > 4000)) {
    throw new Error('Enter a story setup or a turn.');
  }
  return prepareStory(turn, protocol);
}

async function nextReply({ context, prompt }) {
  const response = await fetch(`http://${host}:${enginePort}/completion`, {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, n_predict: 6, temperature: 0.78, top_k: 8,
      repeat_last_n: 0, return_tokens: true }), signal: AbortSignal.timeout(30_000),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'The model request failed.');
  const [choice, prose, dialogue, stop] = data.tokens || [];
  const event = protocol.events[choice];
  const matches = (token, stage) => protocol.fragments[token]?.[0] === event && protocol.fragments[token]?.[1] === stage;
  if (!event || data.tokens.length !== 4 || !matches(prose, 'prose') || !matches(dialogue, 'dialogue') ||
      stop !== protocol.eos || !data.content?.trim()) {
    throw new Error('The model did not finish the turn. Try it again.');
  }
  return finishStory(context, event, protocol.fragments[prose][2] + protocol.fragments[dialogue][2], [prose, dialogue]);
}

const app = http.createServer(async (request, response) => {
  if (request.headers.host !== `${host}:${port}`) return json(response, 403, {});
  if (request.method === 'GET') {
    const asset = files.get(request.url);
    if (asset) {
      response.writeHead(200, { 'Content-Type': `${asset[1]}; charset=utf-8`, 'Cache-Control': 'no-store',
        'Content-Security-Policy': "default-src 'self'; object-src 'none'; frame-ancestors 'none'" });
      return response.end(readFileSync(path.join(root, asset[0])));
    }
    if (request.url === '/api/status') return json(response, 200, { app: 'Fableglass', ready: await healthy(), error: engineError });
    if (request.url === '/favicon.ico') { response.writeHead(204); return response.end(); }
  }
  if (request.method !== 'POST' || request.headers.origin !== address) return json(response, 404, {});
  if (request.url === '/api/stop') { json(response, 200, { ok: true }); shutdown(); return; }
  if (request.url !== '/api/turn') return json(response, 404, {});
  if (!enginePort || engineError) return json(response, 503, { error: engineError || 'The model is starting.' });

  let turn;
  try { turn = await readTurn(request); }
  catch (error) { return json(response, 400, { error: error.message }); }
  try { json(response, 200, await nextReply(turn)); }
  catch (error) { json(response, 502, { error: error.message }); }
});

function shutdown() {
  if (quitting) return;
  quitting = true;
  engine?.kill();
  app.close();
  setTimeout(() => process.exit(0), 500).unref();
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGBREAK']) process.on(signal, shutdown);
process.on('exit', () => engine?.kill());
app.on('error', async error => {
  if (error.code === 'EADDRINUSE') {
    try {
      const existing = await fetch(`${address}/api/status`, { signal: AbortSignal.timeout(1500) }).then(result => result.json());
      if (existing.app === 'Fableglass') return openWindow();
    } catch {}
  }
  console.error(error.message);
  process.exitCode = 1;
});
app.listen(port, host, () => {
  startEngine().catch(error => { engineError = error.message; });
  openWindow();
});
