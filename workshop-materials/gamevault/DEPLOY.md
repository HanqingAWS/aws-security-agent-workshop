# GameVault 隔离部署说明(用于渗透测试模块)

> GameVault **故意包含可利用漏洞**。仅在有明确授权的一次性实验环境部署,只使用虚构数据。
> AWS Security Agent 支持公网目标和私有 VPC 目标;**并非必须有公网 IP**。
> 下面是讲师部署检查清单,不是一键创建 AWS 资源的脚本。

## 1. 推荐:私有 VPC 目标

- 使用专用非生产账户/实验 VPC。不要把本应用放到已有业务、共享工具或带高权限实例角色的服务器。
- EC2 可使用 Amazon Linux 2023、t3.small 或更高;EBS 加密,启用 IMDSv2,优先用 Systems Manager 管理。
- 应用前设置受限反向代理或私有 ALB,数据库不开放入站端口。
- 若用 ALB,目标服务端口只允许 ALB 安全组访问;ALB 监听端口只允许测试执行器安全组。
- 若用本机反向代理,应用继续通过回环地址访问;仅对测试执行器安全组开放代理监听端口。
- 在 Agent Space 配置目标所在 VPC、可达子网及测试执行器安全组,按实际路由配置所需出站路径。
- 为目标配置可解析的完整私有域名,使用 **Private VPC** 验证方式;每个私有域名分别验证。
  目标 IP 必须属于服务支持的私有 CIDR,测试 URL 的域名必须与验证域名完全匹配。
- 开课前从测试网络确认 DNS、端口、TLS 与登录路径可达。不要用开放 `0.0.0.0/0` 排查问题。

参考:[目标域名验证](https://docs.aws.amazon.com/securityagent/latest/userguide/manage-target-domains.html)、
[VPC 配置](https://docs.aws.amazon.com/securityagent/latest/userguide/perform-penetration-test.html)。

## 2. 在隔离 EC2 上运行应用

先安装 Git、Docker 和 Docker Compose v2。使用组织批准的软件安装方法;
运行 `docker compose version` 确认插件可用。执行 Docker 命令的用户需有相应权限。

```bash
git clone https://github.com/HanqingAWS/aws-security-agent-workshop.git
cd aws-security-agent-workshop/workshop-materials/gamevault
docker compose up -d --wait db
docker compose build app
docker compose run --rm app npm run initdb  # 会重置专用实验数据库
docker compose up -d app
curl http://127.0.0.1:3000/
```

默认 Compose 只将应用映射到 `127.0.0.1:3000`,**适合本机反向代理,不会自动成为 VPC 可达目标**。
若选择私有 ALB 路径,需由讲师审核后调整应用端口的主机绑定,并将实例安全组的入站来源限定为 ALB 安全组。
绝不要对数据库发布端口。不要复用原生初始化命令中的数据库超级用户。

## 3. 公网目标仅作受控备选

只有在组织明确允许公网靶场时采用。使用你拥有的**专用完整子域名**和 HTTPS 入口,
限制入站来源为服务文档所述的实际测试流量来源,或选择私有 VPC 执行方式。
仅放行讲师/学员出口 IP 不代表 AWS Security Agent 能访问。
如果无法确认测试器来源限制,使用私有方案,不要把漏洞应用直接向全网开放。

可通过 Route 53、DNS TXT 或 HTTP route 验证域名归属。若用 HTTP route,
按控制台给出的 token 返回:

```json
{"tokens": ["<verification-token>"]}
```

路径为 `/.well-known/aws/securityagent-domain-verification.json`。归属验证不代表你获得了业务测试授权。
HTTPS 可用 ALB + ACM;直接在 Nginx 上终止 TLS 时使用可安装的证书(例如 Let's Encrypt,
或符合导出条件且已完成私钥管理的 ACM 证书),不能假设所有 ACM 证书都能直接安装到 Nginx。

## 4. 上下文、范围与预算

- 连接源码仓库;若需要评论/修复 PR,使用私有实验仓库并启用对应写权限。
- 将虚构测试账号(`alice/password1`)放入 Secrets Manager,只授予此实验所需读取权限。
- 上传 `../07-pentest-target-and-apispec.md` 作为说明性 API 上下文。
- 只允许此应用域名与明确的 API 路径;排除第三方、应用商店和非实验资源。禁做 DoS/负载压力实验。
- 设置 **Max task hours**。当前最小上限为 20,按 $50/task-hour 计算对应最高 $1,000
  渗透测试服务费,不是预估必花金额;试用/折扣/税费与 EC2、存储、日志等费用另计。
- 若预算无法覆盖最低上限,课堂使用预跑报告与本地自测,不要发起真实收费测试。

## 5. Workshop 结束后

1. 停止所有运行中的测试/定时任务,核对实际任务小时和费用。
2. `docker compose down --volumes --remove-orphans` 清理本实验容器与数据库。
3. 删除专用 EC2、ALB/反向代理资源、EBS 快照/卷、DNS 记录;如使用 Elastic IP,删除实例后单独释放。
4. 撤销 GitHub App 对私有实验仓库的授权,按需要删除实验 Agent Space 和专用 IAM 角色。
5. 清理测试凭证及 S3 源码副本,按组织策略设置或执行 CloudWatch 日志保留/删除。
   不要把 Secrets Manager 的计划删除描述为立即物理删除。

这份说明未执行 AWS 资源部署。实际配置与服务区域/配额以开课前的控制台及官方文档为准。
