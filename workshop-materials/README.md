# GameVault — Workshop 配套材料索引

本目录是 **AWS Security Agent (AWS Continuum) 动手 Workshop** 的配套参考材料。
所有材料围绕同一个示例应用 **GameVault**(一个最小化的休闲手游后端 REST API)构建,
内置一组**一致的、故意植入的安全缺陷**,让客户看到同一批问题如何在
**设计 → 代码 → 运行时** 各阶段被不同能力发现。

> **怎么用这套材料**
> - **客户可以直接用这些参考材料**跑完整个 Workshop(示例性强、结果可预期);
> - **也可以替换成客户自己的**设计文档 / 代码 / 目标应用——流程完全一致;
> - 每个功能都提供**输入材料** + **示例结果**。示例结果用于:现场时间紧时直接展示"输出长什么样",或作为"预期 vs 实际"的对照。
> - `gamevault/` 是一个**可直接运行**的最小项目,推荐按其 README 用容器隔离启动。原始漏洞源码保留,初始化会重置数据;只部署在授权的非生产环境,优先私有 VPC。
> - PR 评论与修复实验需私有仓库。公开教材只供只读分析;所有示例输出均不是实际服务运行记录。

## 材料清单

| # | 文件 | 对应功能 | 类型 |
|---|---|---|---|
| 00 | `01-demo-app-architecture.md` | 全局 / Design Review | 输入(架构设计文档) |
| 01 | `02-design-review-sample-findings.md` | Design Review | **示例结果** |
| 02 | `03-threat-model-scope-doc.md` | Threat Modeling | 输入(scope doc) |
| 03 | `04-threat-model-sample-output.md` | Threat Modeling | **示例结果**(STRIDE) |
| 04 | `05-vulnerable-code-samples.md` | Code Review | 输入(漏洞代码说明) |
| 05 | `06-code-review-sample-findings.md` | Code Review | **示例结果** |
| 06 | `07-pentest-target-and-apispec.md` | Penetration Test | 输入(目标 + API 规格) |
| 07 | `08-pentest-sample-findings.md` | Penetration Test | **示例结果**(攻击链) |
| — | `gamevault/` | 全部 | **可运行的漏洞应用项目** |

## 示例应用 GameVault 简介

休闲手游后端,核心接口:
- `POST /login` 登录 · `GET /players/:id` 玩家资料 · `POST /scores` 提交分数上榜
- `GET /leaderboard/search` 排行榜搜索 · `POST /iap/confirm` 内购发币
- `GET /admin/players`、`POST /admin/players/:id/grant`、`/ban` —— GM(运营)接口

## 贯穿全程的"故意缺陷"清单(讲师 speaker notes)

这组缺陷被刻意设计成**跨阶段可追踪**,且贴合游戏行业典型风险(外挂刷分、刷币、白嫖内购、GM 越权):

| 缺陷 | 游戏场景 | 设计评审 | 威胁建模 | 代码评审 | 渗透测试 |
|---|---|---|---|---|---|
| 客户端提交分数被信任 | 外挂刷榜 | ✅ | ✅ (Tampering) | ✅ | ✅ 刷榜首 |
| 内购不做服务端收据校验 | 白嫖充值/刷币 | ✅ | ✅ (Tampering) | ✅ | ✅ 0 元得币 |
| GM/管理接口无鉴权 | 任意发币/封号 | ✅ | ✅ (Elevation) | ✅ | ✅ 提权 |
| SQL 注入(字符串拼接) | 拖库/绕过 | — | ✅ (Tampering/Info) | ✅ | ✅ 拖库 |
| IDOR(越权读玩家资料) | 他人账号/PII | ✅ | ✅ (Info Disclosure) | ✅ | ✅ |
| JWT 密钥硬编码/弱密钥 | 伪造玩家/管理员 | ✅ | ✅ (Spoofing) | ✅ | ✅ 伪造 token |
| 密码用 MD5 哈希 | 撞库破解 | ✅ | ✅ (Spoofing) | ✅ | — |
| 反射型 XSS | 排行榜搜索注入 | — | ✅ (Tampering) | ✅ | ✅ |
| 无速率限制 | 撞库/刷接口 | ✅ | ✅ (DoS) | — | — |
| 无审计日志 | 发币/封号无痕 | ✅ | ✅ (Repudiation) | — | — |
| 详细错误栈外泄 | 信息泄露 | — | ✅ (Info Disclosure) | ✅ | ✅ |

> ⚠️ 所有示例结果均为**教学用途的说明性样例**,用于展示 AWS Security Agent 各能力的输出形态;
> 真实运行结果会依据实际代码、设计文档和部署环境而不同,请以服务实际输出为准。
