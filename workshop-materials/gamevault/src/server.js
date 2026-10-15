// GameVault 服务入口 —— ❌ 教学演示应用,故意不安全,切勿用于生产
require('dotenv').config();
const express = require('express');
const path = require('path');
const pool = require('./db');
const routes = require('./routes');

const app = express();
app.use(express.json());

// 把连接池挂到 req 上,供各路由使用
app.use((req, _res, next) => { req.db = pool; next(); });

// 静态前端(极简演示页)
app.use('/', express.static(path.join(__dirname, '..', 'public')));

// API(无版本前缀,演示用)
app.use('/', routes);

// ❌ 无速率限制、无审计日志中间件(故意缺失,见威胁模型 TM-06/TM-07)

const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, () => {
  console.log(`GameVault (vulnerable demo) listening on http://0.0.0.0:${PORT}`);
});
