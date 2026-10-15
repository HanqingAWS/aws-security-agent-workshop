# AWS Security Agent (AWS Continuum) 动手 Workshop

> **目标受众**：有一定 AWS 基础的进阶客户（开发、安全、架构角色）
> **时长**：约 2.5–3 小时（可按模块裁剪）
> **形式**：讲师引导 + 客户动手操作，围绕同一个示例应用贯穿 SDLC 全流程
> **成果**：客户亲手完成 设计评审 → 威胁建模 → 代码评审 → 渗透测试 的闭环，直观理解该服务价值

> **核对日期：2026-10-15**。2.5–3 小时是核心课堂时间，不包含课前搭建、可选模块及服务异步等待。
> 设计评审/代码评审/威胁建模的 Preview 状态、区域与价格均需开课前再次确认。
> 这是一份社区教学材料，不是 AWS 官方 workshop；说明性示例不能当作已执行的服务测试证据。

---

## 0. 服务简介（讲师开场，约 10 分钟）

**AWS Security Agent（现已归入 AWS Continuum）** 是一个贯穿软件开发生命周期（SDLC）的前沿 security agent，帮助团队把安全"左移"并持续验证：

- **自动化代码评审 (Code Review)** —— 对完整代码库和 Pull Request 做静态分析，检测漏洞并校验组织安全要求
- **威胁建模 (Threat Modeling)** —— 基于设计文档和/或源码，自动生成系统架构理解 + STRIDE 分类的威胁清单
- **设计评审 (Design Review)** —— 在写代码之前，评审架构设计文档是否符合组织安全要求
- **按需渗透测试 (On-demand Penetration Testing)** —— 对已部署应用自主执行多步攻击链，发现并**验证**可利用漏洞（而非仅理论 CVSS 评分）

**核心价值主张（开场讲清楚）**：把传统上周期性、昂贵、依赖专家的安全活动（尤其是渗透测试），变成**随时可触发、可规模化**的自动化能力。

### 三个工作界面 / 三种角色

| 角色 | 工作界面 | 在 Workshop 中对应 |
|---|---|---|
| **Administrator**（管理员） | AWS Management Console | 讲师 / 环境搭建者 |
| **User**（用户） | Security Agent Web Application | 所有动手参与者 |
| **Developer**（开发者） | GitHub / IDE（如 Kiro、Claude Code） | 可选进阶模块 |

> 同一个人可以同时拥有三种角色。Workshop 中通常由讲师用 Administrator 角色搭好环境，再把 User 权限分配给学员。

**关键概念 —— Agent Space**：每个 Agent Space 是针对**一个应用**的隔离工作区，保存该应用的设计评审、威胁模型、代码评审配置、渗透测试目标与发现结果。**一个应用建一个 Agent Space**。而"安全要求包（security requirement packs）"是账户级全局定义、对所有 Agent Space 生效。

---

## 1. 前置条件与环境准备

> ⚠️ 本节由讲师在 Workshop **开始前**完成。学员到场后应能直接进入动手模块。

### 1.1 账户与权限

- 建议使用**专用 workshop 账户**（而非共享的生产/组织账户），因为渗透测试会产生需隔离的发现结果。
- 使用组织批准的搭建身份，不向学员分配 `securityagent:*` 或管理员权限。搭建权限与运行时 service role 分开配置，按[官方角色说明](https://docs.aws.amazon.com/securityagent/latest/userguide/create-iam-role.html)审核控制台生成的角色。
- 一次性搭建可能涉及 IAM 角色/策略创建与受限 `iam:PassRole`、S3、Secrets Manager 和日志权限；所需动作随所选功能变化，不把不完整的动作清单当作可直接使用的 IAM 策略。
- CloudWatch Logs 的权限前缀是 `logs:`（如 `logs:CreateLogGroup`），不是 `cloudwatch:CreateLogGroup`。
- 输入仅使用本仓库的虚构资料；客户真实源码、架构与日志必须先完成数据分类及上传授权。限制 GitHub App 的仓库范围，设置日志和 S3 副本的保留期限。
- 服务可用区域会持续变化，**请以 AWS 官方控制台中实际可选区域为准**。

### 1.2 两个 IAM Service Role（控制台会自动创建）

1. **Application role**（每个应用一个）—— 允许 Web App 调用 Security Agent API，信任主体 `securityagent.amazonaws.com`；使用官方托管策略及控制台生成的受限信任关系。
2. **Agent Space service role**（每个 Agent Space 一个）—— 允许 Security Agent 访问挂载的 AWS 资源（VPC、S3、Secrets Manager、CloudWatch、Lambda）。控制台自动生成。

本实验不启用定时测试；若启用，还会涉及独立的 Scheduler execution role。

### 1.3 用户访问方式：IAM Identity Center (SSO) vs IAM-only

| 方式 | 适用场景 | 要点 |
|---|---|---|
| **IAM Identity Center (SSO)** | 多人 Workshop（**推荐**） | 学员无需 AWS Console 凭证即可登录 Web App；会话最长约 12 小时 |
| **IAM-only access** | 单人演示 / Demo | 有 Console 访问的用户通过 "Admin access" 链接进入 Web App；admin-access 会话约 30 分钟会过期 |

**多人 Workshop 推荐步骤（SSO）**：
1. 在账户启用 IAM Identity Center（或复用现有 SSO 实例）。
2. 创建 Agent Space 时，在 **Access** 页签 → **Connect IAM Identity Center**，选择 **Auto-create a new Security Agent role**（最简）。
3. 搭建完成后进入 Agent Space → **Web app** 区 → **Assign users**，给每位学员分配访问权。
4. 学员用各自 SSO 身份登录 Web App URL。

### 1.4 GitHub 集成（讲师提前装好）

1. Console → Agent Space → **Integrations** → **Add** → **Create new registration** → 选 **GitHub**。
2. 点 **Install and authorize** → 跳转 GitHub → 选择 org/user 和仓库 → **Install & Authorize**。
3. 回到 Console，为 registration 命名并确认账户类型。该 registration 可跨多个 Agent Space 复用。

> **公开教材与私有实验仓库分开**：本公开仓库支持只读分析，不支持 Code review comments / Code remediation 写操作（[官方说明](https://docs.aws.amazon.com/securityagent/latest/userguide/about-integrations.html)）。讲师提前把源码复制到专用**私有仓库**，不要以公开 fork 替代；每组单独建仓库/分支，GitHub App 仅选择所需仓库并授予读写权限。一个仓库的评论/修复写操作只能由一个 AWS 账户启用，跨账户班级不能全部绑定同一个写操作目标。

### 1.5 课前验收与课堂节奏

- 至少提前一天完成身份登录、仓库集成、目标验证与预跑；每组使用独立命名，防止相互修复或覆盖结果。
- 课前准备已完成的真实运行报告（脱敏且获授权），现场同时展示新建任务的运行状态。不能保证扫描在课堂内完成，也不能保证检出全部故意缺陷。
- 代码评审可能约 30–60 分钟或更久，渗透测试可能数小时。Module 0 属课前准备；Module 3/4 的时间主要用于提交任务、解读预跑结果和讨论。
- 默认仅由讲师执行一次共享渗透测试，避免学员重复触发费用。预算、最大任务小时、停止责任人与课后清理责任人在开课前确定。
- 本地应用使用容器隔离，原始漏洞源码保持不变；`npm run initdb` 会重置数据，绝不可连接真实业务数据库。

---

## 2. 本次要动手演示的核心能力

| 能力 | 成熟度（约 2026 年） | 学员将看到什么 |
|---|---|---|
| **Penetration Testing** | GA | 已验证的真实可利用漏洞、可复现攻击路径、自动修复 PR |
| **Code Review** | Preview | PR 级增量扫描发现 + 全仓库扫描 |
| **Threat Modeling** | Preview | STRIDE 分类威胁、攻击路径、缓解建议 |
| **Design Review** | Preview | 对照组织安全要求的架构级发现 |

> 成熟度、免费额度与价格会随产品演进变化，**请以 AWS 官网最新信息为准**。

---

## 3. 动手实验模块（按顺序串联同一个应用）

> **贯穿式叙事**：Module 1→2→3→4 全部针对**同一个示例应用**，让学员看到发现结果如何沿 SDLC 演进（设计 → 代码 → 运行时）。

### Module 0 —— 环境搭建（约 30 分钟 · Administrator · 讲师演示，学员观摩）

**目标**：建好共享 workshop 环境，学员理解 "Console 配置" 与 "Web App 操作" 的分工。

控制台步骤：
1. 进入 AWS Management Console 的 **AWS Security Agent**。
2. 点 **Set up AWS Security Agent**。
3. 填写 Agent Space 名称（如 `workshop-gamevault`）与描述——该名称会显示给 Web App 用户。
4. **User access configuration** 选 **IAM Identity Center**（多人）或 **IAM-only access**（单人演示）。
5. 点 **Set up AWS Security Agent** → 控制台自动创建 Agent Space、application role 和 Web App URL。
6. 进入新建的 Agent Space → **Web app** 页签 → **Assign users** 加入每位学员。
7. 把 Web App URL 发给学员。

### Module 1 —— 设计评审 Design Review（约 20–25 分钟 · User）

**目标**：展示在写任何代码之前就做安全左移。

**预备**：准备一份 1–2 页的架构设计文档（Markdown/PDF），描述示例应用的组件、数据流、认证方式——**故意留若干缺陷**（例如"内购金币由客户端上报且不校验收据"、"分数在客户端计算"、"用 MD5 做密码哈希"），这样评审结果更有说服力。可直接用配套材料 `workshop-materials/01-demo-app-architecture.md`（GameVault 手游后端）。

Web App 步骤：
1. 登录 Web App → 选择 Agent Space。
2. **Design Review** → **New design review**。
3. 上传架构文档（PDF 或 Markdown）。
4. （可选）启用 AWS-managed 安全要求包（如 NIST CSF）或自定义要求。
5. 点 **Run** → 约 5 分钟。
6. 查看发现：每条发现包含被违反的要求、影响、具体修复建议。

💬 **讨论**：哪些发现是人工评审容易遗漏的？在没写代码前就改架构，能省下多少返工？

### Module 2 —— 威胁建模 Threat Modeling（约 30–35 分钟 · User）

**目标**：从设计文档和/或源码自动生成 STRIDE 威胁模型。

步骤：
1. Console → Agent Space → **Threat modeling** 页签 → 连接 GitHub 仓库（或含源码的 S3 bucket）。
2. Web App → **Threat Models** → **Create threat model**。
3. 填 **Title**；至少提供一种输入：
   - **Scope docs**：上传设计文档（DOC/DOCX/MD/PDF/PNG/JPEG/TXT）聚焦分析范围；
   - **Sources**：选择已连接的 GitHub 仓库作为源码上下文。
   - 💡 同时提供两者效果最好：用 scope doc 聚焦某个特性设计，用源码让 agent 理解现有系统。
4. 选择 **Service role**，点 **Create threat model** → **Start run**（约 5–10 分钟）。
5. 看 **Overview** 页签：自动生成的系统概览（组件、信任边界、数据流、严重度分布）。
6. 看 **Threats** 页签：每条威胁带 STRIDE 分类（S/T/R/I/D/E）、严重度、可执行缓解建议；可将状态标记为 Resolved / Dismissed。

💬 **讨论**：威胁模型的输出和 Module 1 的设计评审发现如何互补？

### Module 3 —— 自动化代码评审 Code Review（约 35–40 分钟 · User + Developer）

**目标**：演示"全仓库扫描"与"PR 级自动扫描"两种模式。

**Part A — 全仓库扫描（Web App）**：
1. Web App → **Code Reviews** → **Create code review**。
2. 填 **Title**（如 `gamevault-security-review`）。
3. **Sources** 选已连接的 GitHub 仓库。
4. 配置扫描设置：默认 **Security requirements and vulnerability findings**（同时查漏洞 + 合规）。
5. 选 Service role → **Create code review** → 详情页点 **Start review**（约 30–60 分钟，视代码量）。
6. 查看发现（SQL injection、XSS、IDOR、信任客户端输入等）：每条含严重度、描述、受影响文件/行号、**Suggested fix**。
7. 在私有实验仓库启用 Code remediation 后，点 **Remediate code** 请求修复 PR；公开教材仓库只解读修复建议。

**Part B — PR 级自动扫描（GitHub）**：
1. Console → Agent Space → **Code review** → 为仓库开启 **Code review comments**（以及可选 **Automatic remediation**）。
2. 学员在已连接的**私有实验仓库**创建练习分支，做一处故意改动（如加一条拼接的原始 SQL 查询），提交同仓 PR；不要向公开教材仓库发漏洞 PR。
3. 等待 Security Agent 在 PR 评论中给出发现与修复建议；触发条件、权限和配额按当前设置核对，不保证几分钟内完成。
4. 如开启自动修复，Security Agent 会自动开一个修复 PR。

💬 **讨论**：这对开发者工作流有什么改变？和传统 SAST 相比误报率如何？

### Module 4 —— 按需渗透测试 Penetration Testing（约 40 分钟 · Administrator + User）

**目标**：对已部署的漏洞应用执行一次真实的按需渗透测试。

**讲师预备（Workshop 前完成）**：
- 在隔离环境部署 GameVault，优先使用**私有 VPC 目标**（部署说明见 `workshop-materials/gamevault/DEPLOY.md`）。配置目标所在 VPC、可达子网和测试执行器安全组，使用 Private VPC 验证并核对完整域名匹配。
- 若组织明确允许公网靶场，采用专用子域名和 HTTPS，限制测试流量来源；仅放行讲师/学员出口 IP 不保证服务可达。不能确认来源限制时退回私有方案，不开放全网。
- Console → Agent Space → **Penetration test** 页签 → **Set up penetration test** → 填目标域名 → 选 **DNS TXT Record** 或 **HTTP Route** 完成域名归属验证。
  - Route 53 同账户域名可用 **One-click verification**；
  - 其他 DNS 商：复制 Record name / value 加 TXT 记录后点 Verify；
  - HTTP 方式：在 `.well-known/aws/securityagent-domain-verification.json` 放验证 token。
  - ⚠️ DNS 传播可能需 10–30 分钟，**务必提前一天验证好**。

Web App 步骤：
1. Console → Agent Space → **Penetration test** → 配置 CloudWatch 日志组（可选 Secrets Manager 凭证做登录态测试）。
2. 启动 Web App（**Web app** 页签 → **Admin access**）。
3. **Penetration tests** → **Create a penetration test**。
4. 填 Pentest 名称；**Target URLs** 选已验证域名；选 Service role 与日志组 → **Save & Next**。
5. （可选）VPC 资源 / 凭证 / 网络范围分类（把每个 agent 可能触达的域名标为 Accessible 或 Out of scope）。
6. （可选）附加源码/文档上下文、开启自动修复。
7. 设置 **Max task hours**（当前最小 20；不要默认 No limit），点 **Create and execute**。**Preflight** 先做可达性等校验；整体可能数小时，课堂结果解读优先使用已完成的预跑报告。
8. 完成后查看 **Run overview / Logs / Findings**：每条发现含攻击链、利用证据、影响分析、可直接落地的代码修复。
9. 对确认的发现点 **Request remediation**（需私有仓库及对应写权限）→ 请求修复 PR；人工审查、合并并重新部署后进行复验。复验是独立任务，不假设它自动改写原始发现状态。

💡 **重点讲解**：**task-hours ≠ wall-clock（墙钟时间）**。并行 agent 任务意味着计费累积比测试时长更快——一次 30 分钟的测试可能消耗数个 task-hour。请在讲解时点明。

💬 **最吸引人的环节**：渗透测试发现里的"攻击链"视图（agent 如何规划、横向移动、最终利用），**专门留 10 分钟**讲这段。

### Module 5（可选 / 进阶）—— IDE 集成与 CI/CD（约 25 分钟 · Developer）

**目标**：不离开 IDE（Kiro / Claude Code）即可触发扫描。

- **Kiro**：从 Kiro marketplace 安装 AWS Security Agent 能力；本地配置好 AWS 凭证（`aws configure` 或 AWS SSO）；打开仓库文件触发扫描，发现结果内联显示并带修复建议。
- **Claude Code（MCP server）**：在 `.mcp.json` 配置 `awslabs.security-agent-mcp-server`；MCP server 首次使用时会自动配置 Agent Space、IAM service role 和 S3 bucket，无需手动在 Console 搭建。

前置还包括 `uv`、Python 3.10+ 和已批准的 AWS 权限。优先使用 SSO/短期凭证；MCP 首次运行会创建 AWS 资源，上传源码前确认授权、源码归档排除项和保留期。`us-east-1` 是示例区域，不必与演示 EC2 区域相同。

```json
{
  "mcpServers": {
    "awslabs.security-agent-mcp-server": {
      "command": "uvx",
      "args": ["awslabs.security-agent-mcp-server@latest"],
      "env": {
        "AWS_PROFILE": "default",
        "AWS_REGION": "us-east-1"
      }
    }
  }
}
```

> 具体命令/能力名称以 AWS 官方 IDE 集成文档为准。

---

## 4. 推荐示例应用：GameVault（手游后端）

**GameVault** 是本 Workshop 配套的首选目标应用，贴合游戏行业典型风险（外挂刷分、白嫖内购、GM 越权、账号盗用），完整可运行代码见 `workshop-materials/gamevault/`：

- 最小化 Node.js/Express + PostgreSQL 手游后端，**故意植入一组一致的缺陷**：客户端提交分数/内购金币被服务端信任、内购不校验收据、GM 接口无鉴权、SQL 注入、IDOR、硬编码弱 JWT 密钥、MD5 口令、反射型 XSS、无限流/审计等。
- 这组缺陷被设计成**跨阶段可追踪**，让同一批问题在设计评审 → 威胁建模 → 代码评审 → 渗透测试中层层递进地出现。
- 核心接口：`/login`、`/players/:id`、`/scores`（提交分数）、`/leaderboard/search`、`/iap/confirm`（内购发币）、`/admin/*`（GM：发币/封号/列出玩家）。
- 本地运行（见 `gamevault/README.md`）：

```bash
# 推荐 Docker + Docker Compose v2
cd workshop-materials/gamevault
docker compose up -d --wait db
docker compose build app
docker compose run --rm app npm run initdb  # 删除并重建专用实验数据库中的表
docker compose up -d app                  # 仅映射到本机 127.0.0.1:3000
```

- 隔离部署见 `gamevault/DEPLOY.md`：优先私有 VPC，使用专用完整域名圈定范围；公网部署仅作获批后的受控备选。应用默认不对数据库发布端口。

**为什么适合**：配套了设计文档、scope doc、API 说明可分别用于设计评审/威胁建模/渗透测试；GitHub 源码可用于代码扫描；可复现弱 JWT 密钥 → 冒充玩家/管理员读取受保护资料，以及独立的 GM 无鉴权漏洞。**GM 接口即使不带 token 也可访问，不能把它的 200 响应当作 JWT 提权证据。** 缺陷已知，便于讲师对照"预期 vs 实际"输出；游戏场景（0 元刷币、刷榜登顶）对客户更有代入感。

**备选**：若希望用成熟的通用靶场，可用 [OWASP Juice Shop](https://github.com/juice-shop/juice-shop)（Node.js，内置 100+ 漏洞，覆盖 OWASP Top 10）或 [WebGoat](https://github.com/WebGoat/WebGoat)（Java/Spring）。流程与本文档完全一致，仅示例应用不同。

---

## 5. 常见坑与讲师提示

**搭建类**：
- **域名验证有延迟**：DNS TXT 验证可能 10–30 分钟，务必**提前一天**完成，别在现场做。
- **没启用 SSO 很痛**：没有 IAM Identity Center 时，学员每次登录 Web App 都需 Console 访问，且 admin-access 会话 30 分钟就过期，演示中途掉线很尴尬。提前启用并分配好用户。
- **私有端点需配 VPC**：推荐私有 VPC，提前验证 DNS、网络、TLS 和服务角色权限。不要为省事公开漏洞目标。
- **范围的路径继承**：设置渗透测试范围时，父路径被排除则其嵌套子路径自动排除；**不支持通配符/正则**，需显式规划 in-scope 路径。
- **GitHub App 权限范围**：提前把 GitHub App 装到 workshop org 仓库；学员在个人仓库授权会遇到 org 策略限制。

**节奏类**：
- Module 3（代码扫描）和 Module 4（渗透测试）有较长异步等待。**在 Module 4 开头就把渗透测试跑起来**，等待期间讲代码评审或讨论。
- 可预先跑好一个完成的渗透测试，时间紧时直接展示"已出结果"视图。
- 坚持用**同一个应用**跑 Module 1→4，让学员看到发现结果跨 SDLC 的演进。

**成本类**：
- 代码/设计评审与威胁建模在当前 Preview 阶段不收服务费，但配额及 S3、日志、EC2 等配套资源费用仍需核对。
- 渗透测试当前公开价 **$50/task-hour**，按秒累计。**Max task hours 最小值为 20**；20 的上限对应最高 $1,000 服务费，不是必花金额，试用/折扣/税费另计。短墙钟时间或少量 URL 不能保证低费用。
- 开课前确认试用资格、预算及所有运行的累计费用。服务配额与 AWS Budgets 告警不是硬性停止开关；预算不足时使用预跑报告，不发起真实测试。
- 实际价格与免费额度请以 AWS 官网为准。

**学员体验类**：
- 面向进阶受众，省掉域名验证讲解（提前做好），把时间花在**发现结果解读**和 **agent 推理链**上。
- 设计评审若没有真实文档会显得抽象——用一份含明显缺陷的 2 页真实设计文档（可直接用 `workshop-materials/01-demo-app-architecture.md`）。

> 📁 **配套材料**：每个功能的输入材料与示例结果见 `workshop-materials/`（索引见其 `README.md`），可直接用于演示或作为"预期 vs 实际"对照。

## 6. 验收与课后清理

- Module 1：完成一次评审或查看获授权预跑报告，记录一条违反的安全要求、业务影响及修复建议。
- Module 2：指出至少一条信任边界，解释两类 STRIDE 威胁；STRIDE 是分类法，不直接决定严重度。
- Module 3：记录全仓扫描状态；私有仓库练习 PR 能按配置触发评审。自动修复必须人工审查。
- Module 4：记录目标授权、范围、最大任务小时与运行状态；用实际请求/响应判断证据是否支持结论，不把样例当服务真实输出。
- 课后停止运行/定时任务，核对费用；清理专用容器、数据库卷、EC2/ALB/EIP/DNS、源码副本和测试凭证。按组织策略保留或删除报告/日志，撤销专用仓库授权；只删除本实验资源。

---

## 参考资料（官方）

- AWS Security Agent 是什么：https://docs.aws.amazon.com/securityagent/latest/userguide/what-is.html
- 工作原理 / 三种角色：https://docs.aws.amazon.com/securityagent/latest/userguide/how-it-works.html
- Set up Security Agent：https://docs.aws.amazon.com/securityagent/latest/userguide/setup-security-agent.html
- Create an Agent Space：https://docs.aws.amazon.com/securityagent/latest/userguide/create-agent-space.html
- Quickstart — 渗透测试：https://docs.aws.amazon.com/securityagent/latest/userguide/quickstart.html
- Quickstart — 代码评审：https://docs.aws.amazon.com/securityagent/latest/userguide/quickstart-code-review.html
- Quickstart — 威胁建模：https://docs.aws.amazon.com/securityagent/latest/userguide/quickstart-threat-model.html
- 产品页 / FAQ：https://aws.amazon.com/security-agent/ · https://aws.amazon.com/security-agent/faqs/
- 集成与公开仓库限制：https://docs.aws.amazon.com/securityagent/latest/userguide/about-integrations.html
- 任务小时上限：https://docs.aws.amazon.com/securityagent/latest/userguide/perform-penetration-test.html
- 价格与计费：https://aws.amazon.com/security-agent/pricing/ · https://docs.aws.amazon.com/securityagent/latest/userguide/pricing.html
- IDE 集成：https://docs.aws.amazon.com/securityagent/latest/userguide/code-review-ide-integration.html
