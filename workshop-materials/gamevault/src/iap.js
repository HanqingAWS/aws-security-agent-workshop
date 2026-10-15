// 内购(IAP) —— ❌ 不做服务端收据校验,直接按客户端声明发放货币
async function confirmPurchase(req, res, db) {
  // 客户端只上报 productId 和它"声称"的到账金币数,以及一个 receipt 字符串
  const { productId, coins, receipt } = req.body || {};
  // ❌ 不向 Apple/Google 校验 receipt 真伪;❌ 信任客户端提交的 coins 数量
  // ❌ SQLi:拼接
  const sql = `UPDATE players SET coins = coins + ${coins} WHERE id = ${req.player.pid}
               RETURNING id, coins`;
  try {
    const { rows } = await db.query(sql);
    res.json({ ok: true, productId, grantedCoins: coins, balance: rows[0].coins, receipt });
  } catch (err) {
    res.status(500).send(err.stack);
  }
}

module.exports = { confirmPurchase };
