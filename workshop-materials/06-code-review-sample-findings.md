# 示例结果 —— Code Review 发现(GameVault)

> **这是什么**:对 `gamevault/` 源码运行 **Code Review** 后的**示例输出**,
> 展示每条发现的形态:严重度 / 描述 / 代码位置 / 证据 / 建议修复。真实输出因代码而异。

**扫描范围**:`src/` 8 个文件 · **发现汇总**:Critical 3 · High 4 · Medium 2

---

### CR-01 · Critical · SQL 注入(多处)
- **位置**:`src/auth.js:login`、`src/players.js:getPlayer`、`src/scores.js`、`src/iap.js:confirmPurchase`、`src/admin.js`
- **描述**:用户输入通过字符串拼接进入 SQL,攻击者可注入任意 SQL(认证绕过、拖库、篡改)。
- **证据**:`"SELECT * FROM players WHERE username = '" + username + "' ..."`
- **建议修复**:参数化查询:
  ```javascript
  db.query('SELECT * FROM players WHERE id = $1', [req.params.id]);
  ```

### CR-02 · Critical · 内购不校验收据 + 信任客户端金币数
- **位置**:`src/iap.js:confirmPurchase`
- **描述**:未向应用商店校验 `receipt`,且按客户端上报的 `coins` 直接加币,可被白嫖/刷币/重放。
- **建议修复**:服务端 S2S 收据校验;金币由后端商品映射决定;收据去重;发币写审计日志。

### CR-03 · Critical · JWT 密钥硬编码(弱回退值)
- **位置**:`src/auth.js:SECRET`
- **描述**:环境变量缺失时回退到 `'gamevault123'`,随仓库泄露即可伪造任意身份。
- **建议修复**:从环境/Secrets Manager 加载;移除弱回退;轮换已泄露密钥。

### CR-04 · High · 信任客户端提交的分数
- **位置**:`src/scores.js:submitScore`
- **描述**:`score` 来自客户端且无服务端校验,导致外挂刷榜。
- **建议修复**:服务端校验/重算分数(合理区间、频次、回放、模拟);异常进审查。

### CR-05 · High · 对象级授权缺失(IDOR)
- **位置**:`src/players.js:getPlayer`
- **描述**:未校验 `:id` 归属,任意登录玩家可读他人资料(含 email)。
- **建议修复**:
  ```javascript
  if (String(req.params.id) !== String(req.player.pid)) return res.status(403).json({error:'forbidden'});
  ```

### CR-06 · High · 运营(GM)路由缺少鉴权中间件
- **位置**:`src/routes.js`(`/admin/*`)
- **描述**:`/admin/*` 未经过 `requireAuth`/`requireAdmin`,任何人可发币、封号。
- **建议修复**:
  ```javascript
  router.post('/admin/players/:id/grant', requireAuth, requireAdmin, ...);
  ```

### CR-07 · High · 口令使用 MD5 哈希(无盐)
- **位置**:`src/auth.js:hashPassword`
- **建议修复**:`bcrypt.hash(pw, 12)`,每用户独立盐。

### CR-08 · Medium · 反射型 XSS + JWT 无过期
- **位置**:`src/scores.js:searchLeaderboard`(XSS)、`src/auth.js:login`(无 `expiresIn`)
- **建议修复**:输出编码 / 模板自动转义 + CSP;`jwt.sign(payload, secret, { expiresIn: '15m' })` + 刷新令牌。

### CR-09 · Medium · 错误堆栈直接返回客户端
- **位置**:多处 `res.status(500).send(err.stack)`
- **建议修复**:返回通用错误信息,堆栈仅记录到服务端日志。

> **PR 级演示(Part B)**:在私有实验仓库启用评论/修复写权限后,提交一个"新增拼接 SQL 查询"的同仓 PR,
> 等待评审给出类似 CR-01 的发现。实际检出与修复需人工核对;公开教材仓库不支持这些写操作。

---
*示例性输出,仅用于说明 Code Review 的产出形态。*
