# GameVault —— 漏洞代码说明(Code Review 输入)

> **用途**:作为 **Module 3 代码评审** 的被扫描源码。完整可运行代码见本目录下的 `gamevault/` 项目,
> 把它推到一个 workshop 专用 GitHub 仓库即可连接给 Agent Space 扫描。客户也可换成自己的代码库。
> 下列为各文件的**漏洞要点**,与设计评审/威胁建模中的缺陷一一对应。

## `src/auth.js` —— 认证
- ❌ **硬编码弱密钥**:`SECRET` 在环境变量缺失时回退到 `'gamevault123'`。
- ❌ **MD5 口令哈希**:`hashPassword` 用无盐 MD5。
- ❌ **SQL 注入**:登录 SQL 用字符串拼接 `username`。
- ❌ **JWT 无过期**:`jwt.sign(...)` 未设 `expiresIn`。
- ❌ **错误栈外泄**:`res.status(500).send(err.stack)`。

## `src/players.js` —— 玩家资料
- ❌ **IDOR**:`GET /players/:id` 不校验 `id` 是否为当前登录玩家。
- ❌ **SQL 注入**:按 `id` 拼接查询。
- ❌ **PII 过度返回**:响应含 `email` 等字段。

## `src/scores.js` —— 排行榜
- ❌ **信任客户端分数**:`POST /scores` 直接把 `score` 入库进榜,无服务端校验。
- ❌ **SQL 注入**:`score`、`q` 拼接进 SQL。
- ❌ **反射型 XSS**:搜索接口把 `q` 未转义拼进 HTML 响应。

## `src/iap.js` —— 内购
- ❌ **不校验收据**:`POST /iap/confirm` 不向 Apple/Google 校验 `receipt`。
- ❌ **信任客户端金币数**:直接按客户端上报的 `coins` 加币。
- ❌ **SQL 注入**:`coins`、玩家 ID 拼接。

## `src/admin.js` + `src/routes.js` —— 运营(GM)接口
- ❌ **无鉴权**:`/admin/players`、`/admin/players/:id/grant`、`/ban` 在 `routes.js` 中**未挂任何鉴权中间件**。
- ❌ **SQL 注入**:`grant` / `ban` 按 `id`、`coins` 拼接。

## `src/server.js`
- ❌ **无速率限制、无审计日志中间件**(故意缺失)。

### 典型修复方向(讲师可对照 Code Review 发现)
- 全量改参数化查询(`$1, $2 ...`);密钥入环境/Secrets Manager;口令改 bcrypt;
- `/admin/*` 加 `requireAuth + requireAdmin`;对象级授权校验;
- 内购走服务端 S2S 收据校验;分数服务端校验;输出编码 + CSP;
- 关键接口限流;关键操作审计;生产返回通用错误信息。

---
*完整代码见 `gamevault/`。教学示例,切勿用于生产。*
