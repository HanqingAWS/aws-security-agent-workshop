// 玩家资料 —— ❌ 故意包含 IDOR 与 SQL 注入
async function getPlayer(req, res, db) {
  // ❌ IDOR:未校验 req.params.id 是否等于当前登录玩家;❌ SQLi:拼接
  const sql = `SELECT id, username, role, coins, vip_level, email, created_at
               FROM players WHERE id = ${req.params.id}`;
  try {
    const { rows } = await db.query(sql);
    if (!rows.length) return res.status(404).json({ error: 'not found' });
    res.json(rows[0]); // 返回含 email 等 PII
  } catch (err) {
    res.status(500).send(err.stack);
  }
}

module.exports = { getPlayer };
