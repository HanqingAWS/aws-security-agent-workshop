# GameVault（故意存在漏洞的手游后端演示）

> ⚠️ **仅用于教学 / Workshop**。本项目**故意**包含安全漏洞(SQL 注入、IDOR、硬编码弱密钥、
> MD5 口令、客户端信任、内购不校验、GM 接口无鉴权等),用于演示 **AWS Security Agent (AWS Continuum)**
> 的设计评审 / 威胁建模 / 代码评审 / 渗透测试能力。**切勿用于生产,且仅对你拥有授权的目标进行测试。**

GameVault 是一个最小化的休闲手游后端:玩家注册登录、提交分数上排行榜、内购发放金币、
玩家资料查询,以及一个供运营(GM)使用的管理接口。

## 目录结构

```
gamevault/
├── package.json
├── .env.example
├── public/
│   └── index.html        # 极简说明页
├── src/
│   ├── server.js         # Express 入口
│   ├── db.js             # pg 连接池
│   ├── routes.js         # 路由(❌ 管理路由未加鉴权)
│   ├── auth.js           # 登录(❌ MD5 / 硬编码密钥 / SQLi / 无过期)
│   ├── players.js        # 玩家资料(❌ IDOR / SQLi)
│   ├── scores.js         # 排行榜(❌ 信任客户端分数 / SQLi / XSS)
│   ├── iap.js            # 内购(❌ 不校验收据 / 信任客户端金币)
│   └── admin.js          # GM 接口(❌ 无鉴权 / SQLi)
└── db/
    ├── schema.sql        # 建表
    └── init.js           # 建表 + 种子数据
```

## 本地运行

### 推荐:容器运行

前置:Docker + Docker Compose v2。

```bash
docker compose up -d --wait db
docker compose build app
docker compose run --rm app npm run initdb
docker compose up -d app
curl http://127.0.0.1:3000/
```

容器使用固定实验数据库用户,无需手工创建 PostgreSQL 用户。应用端口只绑定
`127.0.0.1:3000`,数据库不发布端口;密码与账号均为公开的教学假数据,不能复用到真实系统。

> **重置警告**:`npm run initdb` 执行 `DROP TABLE`,会删除并重建 `scores` 和 `players`。
> 仅对一次性实验数据库运行,不要将 DATABASE_URL 指向任何已有业务数据库。
> 原始 `src/`、`db/` 和 `.env.example` 中的故意不安全实现保持原样。

### 原生运行(可选)

前置:Node.js 22+、PostgreSQL 16。下面适用于已有本地 PostgreSQL 管理权限的环境;
根据你的安装方式运行 `psql`,在 PostgreSQL 管理员会话中执行:

```sql
CREATE ROLE gamevault LOGIN PASSWORD 'gamevault' NOSUPERUSER NOCREATEDB NOCREATEROLE;
CREATE DATABASE gamevault OWNER gamevault;
```

默认连接使用 TCP 密码认证,请确认本地 PostgreSQL 允许该用户从本机连接。若角色/数据库已存在,
先核对是否属于此实验,不要覆盖已有环境。这里的固定密码仅供隔离教学使用。

```bash
# 1) 安装依赖
npm ci

# 2) 确认使用专用 gamevault 实验数据库
cp .env.example .env         # 按需修改 DATABASE_URL

# 3) 初始化表与种子数据(会删除已有实验数据)
npm run initdb

# 4) 启动
npm start                    # http://localhost:3000
```

种子账号:
- 普通玩家:`alice / password1`、`bob / hunter2`、`charlie / qwerty`
- 管理员:`admin / admin123`

原生应用按原始设计监听全部网卡。只在隔离环境运行,不要开放主机入站端口;
日常本地演示优先使用上面的容器回环绑定方案。

## 快速自测(可对照渗透测试示例结果)

```bash
# 登录拿 token
curl -s -XPOST localhost:3000/login -H 'content-type: application/json' \
  -d '{"username":"alice","password":"password1"}'

# IDOR:读他人资料
curl -s localhost:3000/players/1 -H "authorization: Bearer <token>"

# SQLi:登录认证绕过(username 注入)
curl -s -XPOST localhost:3000/login -H 'content-type: application/json' \
  -d '{"username":"'"'"' OR '"'"'1'"'"'='"'"'1'"'"' -- ","password":"x"}'

# GM 接口无鉴权:直接列出所有玩家
curl -s localhost:3000/admin/players
```

详见本目录同级的 `../07-pentest-target-and-apispec.md` 与 `../08-pentest-sample-findings.md`。

## 自动化本地自测

```bash
# 仅用于一次性实验数据库:自测会重置全部教学数据
docker compose run --rm app npm run smoke -- --reset
```

自测启动临时服务,验证登录和故意保留的 SQL 注入、JWT 伪造、GM 无鉴权、IDOR、
内购刷币、刷分、HTML 回显及错误信息泄露。它不是 AWS Security Agent 扫描;
HTML 回显检查也不等于浏览器中实际执行脚本的验证。

```bash
# 课后清理:仅删除当前 Compose 项目的容器和实验数据库卷
docker compose down --volumes --remove-orphans
```

## 隔离部署(供渗透测试模块使用)

见 `DEPLOY.md`。
