'use strict';
/* 账号（只通过邀请链接开通）、登录、权限判断。
   普通访客不需要账号：进度和讲义存在浏览器里。 */
const crypto = require('node:crypto');
const { one, all, run, insert, now, log } = require('./db');

const SESSION_DAYS = 30;
const PHONE_RE = /^1[3-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,253}\.[a-z]{2,}$/i;
const NICK_RE = /^[\p{L}\p{N}_\-·]{2,16}$/u;
const normEmail = s => String(s || '').trim().toLowerCase();

function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const h = crypto.scryptSync(pw, salt, 32, { N: 16384, r: 8, p: 1 });
  return `s1$${salt.toString('hex')}$${h.toString('hex')}`;
}
function verifyPassword(pw, stored) {
  if (!stored) return false;
  const [, s, h] = stored.split('$');
  const got = crypto.scryptSync(pw, Buffer.from(s, 'hex'), 32, { N: 16384, r: 8, p: 1 });
  return crypto.timingSafeEqual(got, Buffer.from(h, 'hex'));
}
function httpError(status, message) { const e = new Error(message); e.statusCode = status; return e; }
const checkPassword = pw => { if (!pw || pw.length < 8) throw httpError(400, '密码至少 8 位'); if (pw.length > 200) throw httpError(400, '密码太长了'); };

/* ---------- 邀请链接 ----------
   kind = invite：开通新账号（admin=true 时开通超管，用于第一次安装）
   kind = reset：给已有账号重设密码 */
const INVITE_DAYS = 7;
async function createInvite(creatorId, { note = '', admin = false, kind = 'invite', userId = null, days = INVITE_DAYS } = {}) {
  const token = crypto.randomBytes(18).toString('base64url');
  await run('INSERT INTO invites(token,kind,note,is_admin,user_id,created_by,expires_at,created_at) VALUES (?,?,?,?,?,?,?,?)',
    token, kind, String(note).slice(0, 200), !!admin, userId, creatorId, now() + days * 86400_000, now());
  return token;
}
async function getInvite(token) {
  const r = await one('SELECT i.*, u.nickname FROM invites i LEFT JOIN users u ON u.id = i.user_id WHERE i.token = ?', String(token || ''));
  if (!r || r.used_at || r.expires_at < now()) throw httpError(404, '这个链接无效或已过期，请向管理员要一个新的');
  return r;
}
async function acceptInvite(token, { nickname, email, password }) {
  const inv = await getInvite(token);
  checkPassword(password);
  if (inv.kind === 'reset') {
    await run('UPDATE users SET pass_hash = ? WHERE id = ?', hashPassword(password), inv.user_id);
    await run('DELETE FROM sessions WHERE user_id = ?', inv.user_id);
    await run('UPDATE invites SET used_at = ?, used_by = ? WHERE token = ?', now(), inv.user_id, inv.token);
    await log(inv.user_id, 'reset_password', {});
    return inv.user_id;
  }
  if (!NICK_RE.test(nickname || '')) throw httpError(400, '昵称需要 2–16 个字，只能用中文、字母、数字、下划线');
  email = normEmail(email);
  if (email && !EMAIL_RE.test(email)) throw httpError(400, '邮箱格式不对');
  if (await one('SELECT id FROM users WHERE nickname = ?', nickname)) throw httpError(409, '这个昵称已经被用了');
  if (email && await one('SELECT id FROM users WHERE email = ?', email)) throw httpError(409, '这个邮箱已经用过了');
  const id = await insert('INSERT INTO users(email,nickname,pass_hash,is_admin,created_at) VALUES (?,?,?,?,?)',
    email || null, nickname, hashPassword(password), !!inv.is_admin, now());
  await run('UPDATE invites SET used_at = ?, used_by = ? WHERE token = ?', now(), id, inv.token);
  await log(id, 'join', { invite: inv.token.slice(0, 6), by: inv.created_by, admin: !!inv.is_admin });
  if (inv.is_admin) try { require('node:fs').unlinkSync(require('node:path').join(__dirname, '..', 'data', 'admin-setup-link.txt')); } catch (e) { }
  return id;
}
/* 第一次启动：还没有超管时，生成一个「设置超管」链接 */
async function ensureAdminSetup() {
  if (await one('SELECT id FROM users WHERE is_admin LIMIT 1')) return null;
  const old = await one('SELECT token FROM invites WHERE is_admin AND used_at IS NULL AND expires_at > ? ORDER BY id DESC LIMIT 1', now());
  return old ? old.token : createInvite(null, { admin: true, note: '设置超级管理员', days: 30 });
}

/* ---------- 登录：昵称、邮箱或手机号都可以 ---------- */
async function login({ account, password }) {
  account = String(account || '').trim();
  const u = EMAIL_RE.test(account) ? await one('SELECT * FROM users WHERE email = ?', normEmail(account))
    : PHONE_RE.test(account) ? await one('SELECT * FROM users WHERE phone = ?', account)
      : await one('SELECT * FROM users WHERE nickname = ?', account);
  if (!u || !verifyPassword(password || '', u.pass_hash)) throw httpError(400, '账号或密码不对');
  if (u.banned) throw httpError(403, '账号已被停用');
  return u.id;
}
async function changePassword(u, { old, password }) {
  if (!verifyPassword(old || '', u.pass_hash)) throw httpError(400, '原密码不对');
  checkPassword(password);
  await run('UPDATE users SET pass_hash = ? WHERE id = ?', hashPassword(password), u.id);
}
async function newSession(userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  await run('INSERT INTO sessions(token,user_id,expires_at) VALUES (?,?,?)', token, userId, now() + SESSION_DAYS * 86400_000);
  return token;
}
async function userFromToken(token) {
  if (!token) return null;
  const r = await one('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.expires_at > ? AND NOT u.banned', token, now());
  if (!r) return null;
  r.roles = await all('SELECT course, role FROM course_roles WHERE user_id = ?', r.id);
  return r;
}
async function logout(token) { if (token) await run('DELETE FROM sessions WHERE token = ?', token); }

/* 超管手动登记手机号（被邀请的都是认识的人，不发验证短信） */
async function setPhone(userId, phone) {
  phone = String(phone || '').trim();
  if (phone && !PHONE_RE.test(phone)) throw httpError(400, '手机号格式不对');
  if (phone && await one('SELECT id FROM users WHERE phone = ? AND id <> ?', phone, userId)) throw httpError(409, '这个手机号已经登记在别的账号上');
  await run('UPDATE users SET phone = ? WHERE id = ?', phone || null, userId);
}

/* ---------- 权限 ---------- */
const hasRole = (u, course, role) => !!u && (u.is_admin || u.roles.some(r => r.course === course && (r.role === role || (role === 'editor' && r.role === 'reviewer'))));
const canEdit = (u, course) => hasRole(u, course, 'editor');
const canReview = (u, course) => hasRole(u, course, 'reviewer');
const canReviewAny = u => !!u && (u.is_admin || u.roles.some(r => r.role === 'reviewer'));
const maskEmail = e => e ? e.replace(/^(.)(.*)(@.*)$/, (m, a, b, c) => a + (b.length ? '***' : '') + c) : null;
const maskPhone = p => p ? p.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2') : null;
function publicUser(u) {
  if (!u) return null;
  return { id: u.id, nickname: u.nickname, email: maskEmail(u.email), phone: maskPhone(u.phone), isAdmin: !!u.is_admin, isTeacher: !!u.is_teacher, roles: u.roles };
}

module.exports = { createInvite, getInvite, acceptInvite, ensureAdminSetup, login, changePassword, newSession, userFromToken, logout, setPhone,
  canEdit, canReview, canReviewAny, publicUser, maskEmail, maskPhone, httpError, hashPassword };
