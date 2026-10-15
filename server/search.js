'use strict';
/* 搜索：节点不多时直接在内存里匹配标题、别名和正文。
   以后节点多了换 Meilisearch，只需要改这个文件里的 query()。 */
const plain = html => String(html || '').replace(/<[^>]+>/g, ' ').toLowerCase();
const { plainText } = require('./render');
function query(st, q) {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const out = [];
  for (const id of st.idx.order) {
    const n = st.N[id], t = n.title.toLowerCase(), al = (n.alias || []).join(' ').toLowerCase(), body = n.src != null ? plainText(n.src).toLowerCase() : plain(n.body);
    let s = 0;
    for (const w of terms) {
      const ws = t.includes(w) ? 10 : al.includes(w) ? 7 : body.includes(w) ? 2 : 0;
      if (!ws) { s = 0; break; }
      s += ws;
    }
    if (s) out.push([s + n.imp, id]);
  }
  return out.sort((a, b) => b[0] - a[0] || st.idx.ord[a[1]] - st.idx.ord[b[1]]).map(x => x[1]);
}
module.exports = { query };
