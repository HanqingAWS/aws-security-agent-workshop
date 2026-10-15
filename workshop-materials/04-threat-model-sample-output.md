# 示例结果 —— Threat Model(GameVault 内购 + 排行榜)

> **这是什么**:对 `03-threat-model-scope-doc.md`(+ 源码上下文)运行 **Threat Modeling** 后的**示例输出**,
> 展示该能力产出的"系统概览 + STRIDE 威胁清单"形态。真实输出因输入而异。

## System Overview(系统概览,自动生成示意)

GameVault 内购与排行榜特性由游戏客户端、Express API 与 PostgreSQL 构成,并与外部应用商店支付交互。
主要信任边界位于客户端与 API 之间,**客户端被假定为不可信**(可被 root/越狱/外挂注入)。
内购到账金币数与对局分数均在**客户端**产生并被 API 直接信任;内购收据未经服务端校验。
身份通过自研 JWT 维持,密钥硬编码且令牌无过期。玩家资料读取按 ID 进行,未做归属校验;
运营接口没有挂鉴权中间件,与需要 JWT 的普通玩家接口不同;不存在可被证明绕过的 GM 角色校验。

- **信任边界**:Client(不可信)→ API(可信);API → DB/S3(VPC 内);API ↔ App Store(外部)。
- **数据资产**:口令哈希、JWT、金币/充值、排行榜分数、玩家 PII。
- **严重度分布**:Critical 3 · High 2 · Medium 2。

## Threats(STRIDE 分类)

### TM-01 · Tampering · Critical —— 内购金币由客户端上报且收据不校验
- **陈述**:攻击者构造或重放 `POST /iap/confirm`,在未真实支付下获得任意金币(白嫖/刷币)。
- **STRIDE**:Tampering(+ Repudiation)
- **建议**:服务端做官方 S2S 收据校验;金币由后端商品映射决定;收据去重防重放;发币写审计。

### TM-02 · Tampering · Critical —— 对局分数由客户端提交
- **陈述**:外挂提交任意高分刷榜,攫取赛季/活动奖励,破坏公平。
- **STRIDE**:Tampering
- **建议**:服务端校验/重算分数(合理区间、频次、操作回放、服务端模拟);异常分数进审查队列。

### TM-03 · Spoofing · Critical —— JWT 密钥硬编码 + 令牌无过期
- **陈述**:攻击者获取/爆破硬编码弱密钥后可伪造任意玩家(含 GM)的 JWT,冒充其身份。
- **STRIDE**:Spoofing
- **建议**:密钥入 Secrets Manager;设置 `exp` 与刷新/吊销;轮换密钥。

### TM-04 · Elevation of Privilege · High —— 运营(GM)接口无角色校验
- **陈述**:任何已登录(甚至未登录)用户直接调用 `/admin/*` 即可发币、封号,获得运营权限。
- **STRIDE**:Elevation of Privilege
- **建议**:服务端 RBAC;默认拒绝;对特权操作审计。

### TM-05 · Information Disclosure · High —— 玩家资料越权(IDOR)+ SQL 注入
- **陈述**:`GET /players/:id` 不校验归属,可遍历读取他人资料与邮箱;查询用字符串拼接,可注入拖库。
- **STRIDE**:Information Disclosure(+ Tampering)
- **建议**:对象级授权;参数化查询 / ORM;最小权限 DB 账户;不可枚举 ID。

### TM-06 · Denial of Service · Medium —— 登录/内购/提交分数无速率限制
- **陈述**:无限流使撞库、刷分、刷接口成为可能,影响可用性与数据质量。
- **STRIDE**:Denial of Service
- **建议**:接口限流、账户锁定/退避、WAF。

### TM-07 · Repudiation · Medium —— 缺少审计日志
- **陈述**:登录、发币、封号、内购等关键操作无日志,事后无法追溯或举证(尤其客服纠纷/风控)。
- **STRIDE**:Repudiation
- **建议**:记录带主体与时间戳的审计日志,集中存储、防篡改。

---
*示例性输出,仅用于说明 Threat Modeling 的产出形态。*
