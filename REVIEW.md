# 发布前 Review 与验证记录

核对日期:2026-10-15。范围:教学内容、运行步骤、样例证据、公开发布风险和静态网站。

## 修正的教学/操作问题

| 问题 | 处理 |
|---|---|
| 公开仓库不支持 PR 评论/自动修复写操作,原步骤会让学员等待不存在的结果 | 区分公开教材和专用私有实验仓库;补充 GitHub App 读写授权、同仓 PR 和跨 AWS 账户限制 |
| 原生启动只创建数据库,未创建默认连接串所需的 gamevault 用户 | 增加隔离 Compose 启动方式和原生角色/数据库步骤,提交依赖锁文件 |
| 原部署命令把本仓库当成独立 gamevault 仓库,且错误暗示渗透测试必须公网目标 | 修正克隆路径;优先私有 VPC,明确回环绑定不等于 VPC 可达;撤掉不完整的公网部署命令 |
| SQL UNION 示例把文本密码拼到 bigint 分数列,无法按描述工作 | 仅修改说明性 payload,用实际 PostgreSQL 复现正确的列类型组合 |
| GM 接口无鉴权,其 200 响应不能证明伪造 JWT 绕过角色控制 | 用受 JWT 保护的玩家接口证明身份伪造;将 GM 无 token 访问作为独立证据 |
| 费用与课堂时长的表述过于乐观 | 增加异步预跑、Max task hours、当前最小值/价格及累计预算说明,区分配额/告警与停止开关 |
| IAM 动作前缀错误、架构假设与实现边界不明确 | 修正为 logs:CreateLogGroup,引用官方角色说明;标明注册/S3/移动客户端为设计假设 |
| 手机端隐藏侧栏后无法直接选章节,多版内容可能漂移 | 增加可展开目录,同步单页/多页内容与材料,检查内部链接 |

## 明确保留的故意缺陷

原始 `workshop-materials/gamevault/src/`、`db/` 和 `.env.example` 保持原样。
没有修复 SQL 注入、IDOR、弱 JWT 密钥、MD5 口令、无过期 token、GM 无鉴权、
客户端分数/内购金币信任、收据未校验、反射型 XSS、错误堆栈外泄、无限流和无审计。

新增的是容器启动配置、依赖锁、语法检查和本地自测,不是业务漏洞修复。
Compose 将应用端口绑定到主机回环地址,数据库不发布端口;原生服务的监听行为没有改变。

## 已执行的验证

- 10 个 JavaScript 文件通过语法检查。
- 在测试 EC2 上成功构建 Node.js 22 容器,使用真实 PostgreSQL 16 完成 8 项自测:
  应用启动、登录/保护接口、SQL 注入、JWT 伪造/独立 GM 无鉴权、IDOR、内购刷币、刷分、HTML 回显/错误泄露。
- 自测未带 `--reset` 时拒绝执行;带该参数仅重置本次隔离实验数据库。
- 测试结束后清理了此次 Compose 项目的容器、网络与数据库卷,没有开放或修改 AWS 安全组。
- 20 个 HTML 页面在 1440 和 390 像素宽度下无页面横向溢出;手机目录可展开并跳转章节,无浏览器脚本错误。
- 检查仓库内部链接、HTML 重复 ID 和常见 AWS/GitHub 令牌及私钥签名,未发现真实凭证签名。
  公开的种子账号/弱密钥是刻意保留的虚构教学值,不能复用于真实系统。

## 验证边界

未执行 AWS Security Agent 的真实设计评审、威胁建模、代码评审、渗透测试或修复 PR;
未验证客户账户中的权限、配额、目标网络与收费试用资格。
HTML 回显自测不是浏览器脚本执行证明;样例发现/严重度不是服务实际输出。
凭证签名扫描不是完整数据分类审计,本次验证不代表生产安全保证。

官方核对依据:

- [集成与公开仓库限制](https://docs.aws.amazon.com/securityagent/latest/userguide/about-integrations.html)
- [创建测试与最大任务小时](https://docs.aws.amazon.com/securityagent/latest/userguide/perform-penetration-test.html)
- [价格](https://aws.amazon.com/security-agent/pricing/)
- [域名验证与私有 VPC](https://docs.aws.amazon.com/securityagent/latest/userguide/manage-target-domains.html)
- [IAM 角色](https://docs.aws.amazon.com/securityagent/latest/userguide/create-iam-role.html)
- [IDE 集成](https://docs.aws.amazon.com/securityagent/latest/userguide/code-review-ide-integration.html)
