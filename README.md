# AWS Security Agent (AWS Continuum) 动手 Workshop

一个面向进阶客户的动手实验 workshop，帮助客户通过操作一个贯穿 SDLC 的示例应用，直观理解 **AWS Security Agent（现已归入 AWS Continuum）** 的四大能力：**设计评审、威胁建模、代码评审、按需渗透测试**。

> ⚠️ 本仓库中的示例应用 **GameVault** 为教学用途，**故意包含安全漏洞**，仅用于演示 Security Agent 的能力。**切勿用于生产，且仅对你拥有授权的目标进行测试。** 所有示例发现/攻击链均为说明性样例，真实输出以服务实际运行为准。

> **公开教材 ≠ PR 实验仓库**：本仓库保持公开。根据[官方集成说明](https://docs.aws.amazon.com/securityagent/latest/userguide/about-integrations.html)，公开仓库可供只读分析，但不支持 Code review comments / Code remediation 写操作。Module 3 Part B 和自动修复 PR 需将示例复制到你有权限的**私有实验仓库**，并安装 GitHub App（仅选择该仓库、授予所需读写权限）。不要向本公开仓库提交故意引入漏洞的练习 PR。

## 内容结构

```
.
├── README.md                                   # 本文件
├── aws-security-agent-continuum-workshop.md    # Workshop 主指南（Markdown）
├── aws-security-agent-workshop.html            # 单页网页版
├── workshop-site/                              # 多页网站版（推荐浏览，入口 index.html）
│   ├── index.html                              # 议程总览与学习目标
│   ├── intro / app / prep / caps.html          # 服务简介 / 示例应用 / 环境准备 / 能力速览
│   ├── m0 ~ m5.html                            # 动手实验模块 0–5
│   ├── mat-design / mat-threat /               # 各功能的参考材料与示例结果
│   │   mat-code / mat-pentest.html
│   └── tips / wrap / refs.html                 # 常见坑 / 总结与后续 / 参考资料
└── workshop-materials/                         # 配套材料
    ├── README.md                               # 材料索引
    ├── 01-demo-app-architecture.md             # 设计评审 · 输入（架构文档）
    ├── 02-design-review-sample-findings.md     # 设计评审 · 示例结果
    ├── 03-threat-model-scope-doc.md            # 威胁建模 · 输入（scope doc）
    ├── 04-threat-model-sample-output.md        # 威胁建模 · 示例结果（STRIDE）
    ├── 05-vulnerable-code-samples.md           # 代码评审 · 输入（漏洞代码说明）
    ├── 06-code-review-sample-findings.md       # 代码评审 · 示例结果
    ├── 07-pentest-target-and-apispec.md        # 渗透测试 · 输入（目标 + API 规格）
    ├── 08-pentest-sample-findings.md           # 渗透测试 · 示例结果（攻击链）
    └── gamevault/                              # 可运行的漏洞示例应用（手游后端）
        ├── src/                                # Express 源码（含故意漏洞）
        ├── db/                                 # 建表 + 种子数据
        ├── public/                             # 极简前端
        ├── README.md                           # 本地运行说明
        └── DEPLOY.md                           # 隔离部署与私有 VPC 测试说明
```

## 快速开始

### 浏览 Workshop 内容
- **多页网站版（推荐）**：浏览器打开 `workshop-site/index.html`，左侧导航逐章浏览。
- **单页版**：浏览器打开 `aws-security-agent-workshop.html`。
- **Markdown 版**：阅读 `aws-security-agent-continuum-workshop.md`。

### 运行示例应用 GameVault
推荐前置：Docker + Docker Compose v2（无需手工创建数据库用户）。

```bash
cd workshop-materials/gamevault
docker compose up -d --wait db
docker compose build app
docker compose run --rm app npm run initdb  # 会删除并重建本实验数据库中的表
docker compose up -d app                  # http://127.0.0.1:3000
```

只有应用端口映射到本机回环地址，数据库不对外发布端口。种子账号为虚构数据：`alice/password1`、`admin/admin123`。原始漏洞源码保持不变。

原生 Node.js 22+ / PostgreSQL 的启动步骤、本地漏洞自测与清理方式，见 [GameVault README](workshop-materials/gamevault/README.md)。需要远程渗透测试时，优先采用[私有 VPC 方案](workshop-materials/gamevault/DEPLOY.md)，不要直接把漏洞应用暴露到互联网。

## 讲师验收

- 课前完成 Agent Space、身份分配、私有实验仓库集成、目标验证及预跑；实时扫描耗时不保证落在课堂时长内。
- 按需渗透测试设置 **Max task hours**，当前最小值为 20；这是计费工作量，不是 20 小时墙钟时间。按当前公开价 $50/task-hour，20 的上限对应最高 $1,000 服务费（试用、折扣、税费和配套资源费另计），不是预估单次必花金额。
- 每个模块保存实际运行 ID/状态，至少解读一条发现的证据、影响和缓解建议。说明性样例不得当作真实服务测试证据。
- 自动修复先人工审查，再在隔离环境部署和复验；不承诺所有预设漏洞均会被检出。
- 课后停止运行、删除实验资源并清理日志/凭证；具体清单见主指南。

技术核对日期：**2026-10-15**。本仓库的本地应用自测不等于 AWS Security Agent 的真实扫描或生产验收。
具体修正点、已执行的验证及验证边界见 [发布前 Review](REVIEW.md)。

## Workshop 概览

| 模块 | 内容 | 时长 | 角色 |
|---|---|---|---|
| Module 0 | 环境搭建（Agent Space / SSO / GitHub） | 30 min | 讲师演示 |
| Module 1 | 设计评审 Design Review | 20–25 min | 学员动手 |
| Module 2 | 威胁建模 Threat Modeling | 30–35 min | 学员动手 |
| Module 3 | 代码评审 Code Review（全仓 + PR） | 35–40 min | 学员动手 |
| Module 4 | 按需渗透测试 Penetration Test | 40 min | 学员动手 |
| Module 5 | IDE / CI-CD 集成（可选） | 25 min | 进阶 |

## 参考资料

- [AWS Security Agent 是什么](https://docs.aws.amazon.com/securityagent/latest/userguide/what-is.html)
- [工作原理 / 三种角色](https://docs.aws.amazon.com/securityagent/latest/userguide/how-it-works.html)
- [产品页](https://aws.amazon.com/security-agent/) · [FAQ](https://aws.amazon.com/security-agent/faqs/)

## 许可

仓库以 [MIT-0](LICENSE) 提供；示例漏洞应用仅用于隔离教学演示。这是社区教学材料，不是 AWS 官方 workshop 或安全保证。
