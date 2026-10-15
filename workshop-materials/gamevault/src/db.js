// PostgreSQL 连接池(pg)。使用连接串,避免在代码里散落凭证字段。
const { Pool } = require('pg');

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgres://gamevault:gamevault@localhost:5432/gamevault',
});

module.exports = pool;
