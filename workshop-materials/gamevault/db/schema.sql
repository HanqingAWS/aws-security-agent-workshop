-- GameVault 数据库结构(教学演示)
DROP TABLE IF EXISTS scores;
DROP TABLE IF EXISTS players;

CREATE TABLE players (
  id         SERIAL PRIMARY KEY,
  username   TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,          -- ❌ 存 MD5 哈希(见 auth.js)
  role       TEXT NOT NULL DEFAULT 'player',  -- 'player' | 'admin'
  coins      INTEGER NOT NULL DEFAULT 0,
  vip_level  INTEGER NOT NULL DEFAULT 0,
  email      TEXT,
  banned     BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE scores (
  id         SERIAL PRIMARY KEY,
  player_id  INTEGER NOT NULL REFERENCES players(id),
  score      BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
