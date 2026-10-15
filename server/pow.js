'use strict';
/* 计算验证：发验证码前，浏览器要先找到一个 nonce，使 sha256(题目:nonce) 的前 BITS 位都是 0。
   正常用户在后台算 1 秒左右；脚本想批量请求就要付出成比例的算力。不依赖第三方服务。 */
const crypto = require('node:crypto');

const SECRET = process.env.POW_SECRET || crypto.randomBytes(32).toString('hex');
const BITS = Number(process.env.POW_BITS || 17);
const TTL = 5 * 60_000;
const used = new Map();   // 已用过的题目 -> 过期时间

const sign = s => crypto.createHmac('sha256', SECRET).update(s).digest('base64url').slice(0, 22);
function issue() {
  const body = `${Date.now() + TTL}.${crypto.randomBytes(9).toString('base64url')}.${BITS}`;
  return { challenge: `${body}.${sign(body)}`, bits: BITS };
}
function zeroBits(buf) {
  let n = 0;
  for (const byte of buf) { if (byte === 0) { n += 8; continue; } n += Math.clz32(byte) - 24; break; }
  return n;
}
function verify(p) {
  const fail = () => { const e = new Error('人机验证没有通过，请刷新页面再试'); e.statusCode = 400; throw e; };
  if (!p || typeof p.challenge !== 'string' || typeof p.nonce !== 'string' || p.nonce.length > 32) fail();
  const parts = p.challenge.split('.');
  if (parts.length !== 4) fail();
  const [exp, , bits, sig] = parts, body = parts.slice(0, 3).join('.');
  const a = Buffer.from(sig), b = Buffer.from(sign(body));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) fail();
  if (Number(exp) < Date.now() || used.has(p.challenge)) fail();
  const h = crypto.createHash('sha256').update(`${p.challenge}:${p.nonce}`).digest();
  if (zeroBits(h) < Number(bits)) fail();
  used.set(p.challenge, Number(exp));
  if (used.size > 5000) { const t = Date.now(); for (const [k, e] of used) if (e < t) used.delete(k); }
}

module.exports = { issue, verify, zeroBits };
