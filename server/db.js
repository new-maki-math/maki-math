'use strict';
/* 数据库：PostgreSQL。
   写法上沿用 ? 占位符，这里统一转成 $1、$2…；事务内的查询自动走同一个连接。 */
const { Pool, types } = require('pg');
const { AsyncLocalStorage } = require('node:async_hooks');

types.setTypeParser(20, v => Number(v));      // bigint → number（时间戳、计数都在安全范围内）
types.setTypeParser(1700, v => Number(v));    // numeric → number

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://maki:maki-dev@127.0.0.1:5432/maki_dev',
  max: Number(process.env.PG_POOL || 8),
  idleTimeoutMillis: 30_000
});
const als = new AsyncLocalStorage();

function sql(text) { let i = 0; return text.replace(/\?/g, () => `$${++i}`); }
async function q(text, args) { const c = als.getStore() || pool; return c.query(sql(text), args); }
const one = async (text, ...a) => (await q(text, a)).rows[0];
const all = async (text, ...a) => (await q(text, a)).rows;
const run = async (text, ...a) => { const r = await q(text, a); return { rowCount: r.rowCount, rows: r.rows }; };
const insert = async (text, ...a) => (await q(`${text} RETURNING id`, a)).rows[0].id;
async function tx(fn) {
  if (als.getStore()) return fn();
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const r = await als.run(c, fn);
    await c.query('COMMIT');
    return r;
  } catch (e) { await c.query('ROLLBACK').catch(() => {}); throw e; }
  finally { c.release(); }
}
const now = () => Date.now();
const log = (actor, action, detail) => run('INSERT INTO audit_log(actor_id,action,detail,created_at) VALUES (?,?,?,?)', actor ?? null, action, detail == null ? null : JSON.stringify(detail), now());

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  nickname TEXT UNIQUE NOT NULL,
  pass_hash TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  is_teacher BOOLEAN NOT NULL DEFAULT FALSE,
  banned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
DROP TABLE IF EXISTS sms_codes;
DROP TABLE IF EXISTS codes;
DROP TABLE IF EXISTS send_log;
-- 邀请链接：开通账号（kind=invite）或重设密码（kind=reset）
CREATE TABLE IF NOT EXISTS invites (
  id BIGSERIAL PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  kind TEXT NOT NULL,
  note TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  created_by BIGINT,
  expires_at BIGINT NOT NULL,
  used_at BIGINT,
  used_by BIGINT,
  created_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS courses (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  descr TEXT NOT NULL DEFAULT '',
  live BOOLEAN NOT NULL DEFAULT FALSE,
  pos INTEGER NOT NULL DEFAULT 0,
  tree_json JSONB NOT NULL DEFAULT '{}',
  graph_json JSONB NOT NULL DEFAULT '{}',
  tree_version INTEGER NOT NULL DEFAULT 1,
  updated_at BIGINT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS nodes (
  course TEXT NOT NULL REFERENCES courses(slug) ON DELETE CASCADE,
  id TEXT NOT NULL,
  data_json JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  reviewer_id BIGINT REFERENCES users(id),
  updated_at BIGINT NOT NULL,
  PRIMARY KEY (course, id)
);
CREATE TABLE IF NOT EXISTS versions (
  id BIGSERIAL PRIMARY KEY,
  course TEXT NOT NULL,
  target TEXT NOT NULL,
  version INTEGER NOT NULL,
  data_json JSONB,
  summary TEXT NOT NULL,
  author_id BIGINT,
  reviewer_id BIGINT,
  created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS versions_target ON versions(course, target, version);
CREATE TABLE IF NOT EXISTS course_roles (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('editor','reviewer')),
  granted_by BIGINT,
  created_at BIGINT NOT NULL,
  PRIMARY KEY (user_id, course, role)
);
CREATE TABLE IF NOT EXISTS applications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('teacher','editor','reviewer')),
  course TEXT,
  material TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  handler_id BIGINT,
  note TEXT,
  created_at BIGINT NOT NULL,
  decided_at BIGINT
);
CREATE TABLE IF NOT EXISTS submissions (
  id BIGSERIAL PRIMARY KEY,
  course TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('node','tree')),
  target TEXT NOT NULL,
  base_version INTEGER NOT NULL,
  payload_json JSONB NOT NULL,
  summary TEXT NOT NULL,
  author_id BIGINT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  reviewer_id BIGINT,
  score INTEGER,
  review_note TEXT,
  created_at BIGINT NOT NULL,
  decided_at BIGINT
);
CREATE INDEX IF NOT EXISTS submissions_status ON submissions(status, course);
CREATE TABLE IF NOT EXISTS score_events (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  course TEXT NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  submission_id BIGINT,
  created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS score_user ON score_events(user_id, course);
CREATE TABLE IF NOT EXISTS feedback (
  id BIGSERIAL PRIMARY KEY,
  course TEXT NOT NULL,
  node_id TEXT NOT NULL,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  resolution TEXT,
  handler_id BIGINT,
  created_at BIGINT NOT NULL,
  decided_at BIGINT
);
CREATE TABLE IF NOT EXISTS user_state (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course TEXT NOT NULL,
  state_json JSONB NOT NULL,
  updated_at BIGINT NOT NULL,
  PRIMARY KEY (user_id, course)
);
CREATE TABLE IF NOT EXISTS routes (
  id BIGSERIAL PRIMARY KEY,
  owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course TEXT NOT NULL,
  title TEXT NOT NULL,
  descr TEXT NOT NULL DEFAULT '',
  items_json JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'private',
  want_featured BOOLEAN NOT NULL DEFAULT FALSE,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  share_token TEXT UNIQUE,
  reviewer_id BIGINT,
  review_note TEXT,
  approved_json JSONB,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS pdf_jobs (
  id TEXT PRIMARY KEY,
  hash TEXT NOT NULL,
  user_id BIGINT,
  status TEXT NOT NULL DEFAULT 'queued',
  error TEXT,
  created_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_id BIGINT,
  action TEXT NOT NULL,
  detail TEXT,
  created_at BIGINT NOT NULL
);
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS ip_hash TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS prereqs_json JSONB NOT NULL DEFAULT '[]';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS settings_json JSONB NOT NULL DEFAULT '{}';
/* 打包提交：一次提交多个节点（和结构改动） */
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_kind_check;
ALTER TABLE submissions ADD CONSTRAINT submissions_kind_check CHECK (kind IN ('node','tree','batch'));
/* 编辑的草稿篮：还没提交的改动，存在服务器上，换设备也在 */
CREATE TABLE IF NOT EXISTS drafts (
  user_id BIGINT NOT NULL REFERENCES users(id),
  course TEXT NOT NULL,
  data_json JSONB NOT NULL,
  updated_at BIGINT NOT NULL,
  PRIMARY KEY (user_id, course)
);
`;
async function migrate() { await pool.query(SCHEMA); }
async function close() { await pool.end(); }

module.exports = { pool, one, all, run, insert, tx, now, log, migrate, close };
