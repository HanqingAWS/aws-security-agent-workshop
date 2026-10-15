// 初始化数据库:建表 + 预置种子数据。运行:npm run initdb
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const pool = require('../src/db');

const md5 = (s) => crypto.createHash('md5').update(s).digest('hex');

async function main() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);

  // 种子玩家(密码为 MD5,教学演示)
  const players = [
    ['admin',   'admin123',   'admin',  999999, 9, 'admin@game.example'],
    ['alice',   'password1',  'player',   1200, 2, 'alice@game.example'],
    ['bob',     'hunter2',    'player',    300, 0, 'bob@game.example'],
    ['charlie', 'qwerty',     'player',   5400, 5, 'charlie@game.example'],
  ];
  for (const [u, pw, role, coins, vip, email] of players) {
    await pool.query(
      `INSERT INTO players (username, password, role, coins, vip_level, email)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (username) DO NOTHING`,
      [u, md5(pw), role, coins, vip, email]
    );
  }

  // 种子分数
  await pool.query(`INSERT INTO scores (player_id, score)
    SELECT id, (random()*10000)::bigint FROM players`);

  console.log('GameVault DB initialized. Players: admin/admin123, alice/password1, bob/hunter2, charlie/qwerty');
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
