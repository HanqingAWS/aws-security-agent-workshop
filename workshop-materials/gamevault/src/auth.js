// 认证模块 —— ❌ 教学演示:故意包含不安全实现(MD5、硬编码弱密钥、无过期、SQLi)
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// ❌ 密钥未配置时回退到硬编码弱值,便于演示 token 伪造(PT-02)
const SECRET = process.env.JWT_SECRET || 'gamevault123';

// ❌ MD5、无盐 —— 不适合口令存储
function hashPassword(pw) {
  return crypto.createHash('md5').update(String(pw)).digest('hex');
}

async function login(req, res, db) {
  const body = req.body || {};
  const username = body.username;
  const pwHash = hashPassword(body.password);
  // ❌ SQL 注入:直接把用户输入拼进查询(username 未转义)
  const sql =
    "SELECT * FROM players WHERE username = '" + username +
    "' AND password = '" + pwHash + "'";
  try {
    const result = await db.query(sql);
    const rows = result.rows;
    if (!rows.length) return res.status(401).json({ error: 'invalid credentials' });
    // ❌ token 无 expiresIn;角色直接来自库中字段
    const token = jwt.sign({ pid: rows[0].id, role: rows[0].role }, SECRET);
    res.json({ token, player: { id: rows[0].id, username: rows[0].username, role: rows[0].role } });
  } catch (err) {
    // ❌ 把异常堆栈直接返回客户端(信息泄露)
    res.status(500).send(err.stack);
  }
}

// 认证中间件
function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token = header.indexOf('Bearer ') === 0 ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'missing token' });
  try {
    req.player = jwt.verify(token, SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: 'invalid token' });
  }
}

module.exports = { hashPassword, login, requireAuth, SECRET };
