/**
 * 本地假 PostgREST —— 只为验证评论的三种可见性，不参与线上部署。
 *
 * 它照抄 docs/comments-schema.sql 里那几条规则：
 *   1. GET 列表只返回 visibility=public 的行（对应 RLS 的 select 策略）
 *   2. 私密行只能通过 /rpc/cmt_thread 凭 sha256 口令取回
 *   3. /rpc/cmt_reply 校验站长口令，写入的行带 is_owner
 *
 * 跑：node scripts/comments-mock.mjs [port]
 */
import http from "node:http";
import crypto from "node:crypto";

const PORT = Number(process.argv[2] || process.env.PORT || 54321);
const PASS = process.env.MOCK_PASS || "test-pass";
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");

const rows = [];
const uuid = () => crypto.randomUUID();

const json = (res, code, body) => {
  res.writeHead(code, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
  });
  res.end(JSON.stringify(body));
};

const readBody = (req) =>
  new Promise((resolve) => {
    let b = "";
    req.on("data", (c) => (b += c));
    req.on("end", () => {
      try {
        resolve(b ? JSON.parse(b) : {});
      } catch {
        resolve({});
      }
    });
  });

const FIELDS = ["id", "parent_id", "nick", "body", "is_owner", "created_at"];
const shape = (r) => Object.fromEntries(FIELDS.map((k) => [k, r[k]]));

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);

  if (req.method === "OPTIONS") return json(res, 204, {});

  /* ---- 列表 ---- */
  if (req.method === "GET" && url.pathname === "/rest/v1/comments") {
    const slug = (url.searchParams.get("slug") || "").replace(/^eq\./, "");
    const vis = (url.searchParams.get("visibility") || "").replace(/^eq\./, "");
    const out = rows
      .filter((r) => r.slug === slug && (!vis || r.visibility === vis))
      .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
      .map(shape);
    return json(res, 200, out);
  }

  /* ---- 发表 ---- */
  if (req.method === "POST" && url.pathname === "/rest/v1/comments") {
    const b = await readBody(req);
    if (!b.slug || !b.body) return json(res, 400, { message: "slug/body 必填" });
    if (String(b.body).length > 1200) return json(res, 400, { message: "正文太长" });
    if (b.visibility === "private" && !b.secret_hash)
      return json(res, 400, { message: "私密留言缺 key" });
    if (b.is_owner === true) return json(res, 403, { message: "不允许伪造 is_owner" });

    /* 简易限流：同 slug 30 秒内最多 5 条 */
    const recent = rows.filter(
      (r) => r.slug === b.slug && Date.now() - +new Date(r.created_at) < 30000
    );
    if (recent.length >= 5) return json(res, 400, { message: "发得太快了，歇一会儿。" });

    const row = {
      id: uuid(),
      slug: b.slug,
      parent_id: null,
      nick: b.nick ?? null,
      body: String(b.body),
      visibility: b.visibility === "private" ? "private" : "public",
      secret_hash: b.secret_hash ?? null,
      is_owner: false,
      created_at: new Date().toISOString(),
    };
    rows.push(row);
    return json(res, 201, [shape(row)]);
  }

  /* ---- RPC：凭口令取私密串 ---- */
  if (req.method === "POST" && url.pathname === "/rest/v1/rpc/cmt_thread") {
    const b = await readBody(req);
    const h = sha(String(b.p_secret ?? ""));
    const out = rows
      .filter((r) => r.slug === b.p_slug && r.visibility === "private" && r.secret_hash === h)
      .sort((a, b2) => (a.created_at < b2.created_at ? -1 : 1))
      .map(shape);
    return json(res, 200, out);
  }

  /* ---- RPC：站长回复 ---- */
  if (req.method === "POST" && url.pathname === "/rest/v1/rpc/cmt_reply") {
    const b = await readBody(req);
    if (sha(String(b.p_pass ?? "")) !== sha(PASS))
      return json(res, 400, { message: "口令不对。" });
    const parent = rows.find((r) => r.id === b.p_parent);
    if (!parent) return json(res, 400, { message: "要回复的评论不存在。" });
    if (!b.p_body || String(b.p_body).length > 1200)
      return json(res, 400, { message: "回复不能为空，也不能超过 1200 字。" });

    const row = {
      id: uuid(),
      slug: parent.slug,
      parent_id: parent.id,
      nick: null,
      body: String(b.p_body),
      visibility: parent.visibility,
      secret_hash: parent.secret_hash,
      is_owner: true,
      created_at: new Date().toISOString(),
    };
    rows.push(row);
    return json(res, 200, shape(row));
  }

  if (url.pathname === "/__rows") return json(res, 200, rows);

  json(res, 404, { message: "not found" });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`comments-mock on http://127.0.0.1:${PORT}  (advisor pass: ${PASS})`);
});
