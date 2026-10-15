// 排行榜 —— ❌ 信任客户端提交的分数(外挂刷榜) + 搜索接口 SQLi/XSS
async function submitScore(req, res, db) {
  const { score } = req.body || {};
  // ❌ 直接信任客户端提交的 score,服务端不校验其合法性/来源
  const sql = `INSERT INTO scores (player_id, score, created_at)
               VALUES (${req.player.pid}, ${score}, NOW())
               RETURNING id, score`;
  try {
    const { rows } = await db.query(sql);
    res.json({ ok: true, entry: rows[0] });
  } catch (err) {
    res.status(500).send(err.stack);
  }
}

async function searchLeaderboard(req, res, db) {
  const q = (req.query.q || '');
  // ❌ 反射型 XSS:用户输入未转义直接拼进 HTML
  const header = `<h2>排行榜搜索:${q}</h2>`;
  // ❌ SQLi:拼接
  const sql = `SELECT p.username, s.score FROM scores s
               JOIN players p ON p.id = s.player_id
               WHERE p.username LIKE '%${q}%' ORDER BY s.score DESC LIMIT 20`;
  try {
    const { rows } = await db.query(sql);
    res.send(header + JSON.stringify(rows));
  } catch (err) {
    res.status(500).send(err.stack);
  }
}

module.exports = { submitScore, searchLeaderboard };
