// GM / 管理后台 —— ❌ 这些函数本应仅管理员可调用,但路由层未挂鉴权中间件
async function listPlayers(req, res, db) {
  try {
    const { rows } = await db.query(
      'SELECT id, username, role, coins, vip_level, email FROM players ORDER BY id'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).send(err.stack);
  }
}

// GM 给玩家发放金币 / 道具
async function grantCoins(req, res, db) {
  const { coins } = req.body || {};
  // ❌ SQLi + 无鉴权:任何人都能给任意玩家加币
  const sql = `UPDATE players SET coins = coins + ${coins} WHERE id = ${req.params.id}
               RETURNING id, coins`;
  try {
    const { rows } = await db.query(sql);
    res.json({ ok: true, player: rows[0] });
  } catch (err) {
    res.status(500).send(err.stack);
  }
}

// GM 封禁玩家
async function banPlayer(req, res, db) {
  const sql = `UPDATE players SET banned = true WHERE id = ${req.params.id}`;
  try {
    await db.query(sql);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).send(err.stack);
  }
}

module.exports = { listPlayers, grantCoins, banPlayer };
