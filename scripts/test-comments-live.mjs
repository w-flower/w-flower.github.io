/**
 * 对**真实 Supabase 后端**跑一遍评论安全断言（不是假后端）。
 * ------------------------------------------------------------
 * 用法：node scripts/test-comments-live.mjs
 *   - 端点与 anon key 从 src/site.config.ts 里读，不用手填
 *   - 站长口令从环境变量 SB_MASTER 读，没给就用 .local 里记的那个
 *
 * 会往 /__selftest__/ 这个 slug 写 3 行测试数据。
 * anon key 没有 delete 权限（这是设计），所以跑完要清一下：
 *   Supabase → SQL Editor → delete from public.comments where slug = '/__selftest__/';
 * 或者用 Management API（有 PAT 时）：
 *   curl -X POST .../v1/projects/<ref>/database/query -d '{"query":"delete from public.comments where slug = '"'"'/__selftest__/'"'"'"}'
 */
import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";

const cfg = readFileSync("src/site.config.ts", "utf8");
const URL_ = cfg.match(/endpoint:\s*"([^"]+)"/)?.[1];
const KEY = cfg.match(/anonKey:\s*"([^"]+)"/)?.[1];
const MASTER = process.env.SB_MASTER || "dhua-cmt-8f3k2m7q";
if (!URL_ || !KEY) {
  console.log("site.config.ts 里没填 comments.endpoint / anonKey，评论区没启用");
  process.exit(1);
}

const SLUG = "/__selftest__/";
const sha = (s) => createHash("sha256").update(s).digest("hex");
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const F = "id,parent_id,nick,body,is_owner,created_at";
let pass = 0;
let fail = 0;
const ok = (c, l, e = "") => {
  c ? pass++ : fail++;
  console.log((c ? "  ✅ " : "  ❌ ") + l + (e ? "  " + e : ""));
};
const post = (body, rep) =>
  fetch(`${URL_}/rest/v1/comments${rep ? "?select=" + F : ""}`, {
    method: "POST",
    headers: { ...H, Prefer: rep ? "return=representation" : "return=minimal" },
    body: JSON.stringify(body),
  });
const thread = (s) =>
  fetch(`${URL_}/rest/v1/rpc/cmt_thread`, {
    method: "POST",
    headers: H,
    body: JSON.stringify({ p_slug: SLUG, p_secret: s }),
  }).then((r) => r.json());
const listOf = () =>
  fetch(`${URL_}/rest/v1/comments?slug=eq.${encodeURIComponent(SLUG)}&select=${F}`, { headers: H }).then((r) => r.json());

const secret = randomBytes(16).toString("hex");

let r = await post({ slug: SLUG, nick: null, body: "自测：公开匿名留言", visibility: "public" }, true);
const pub = (await r.json())[0];
ok(r.status === 201 && !!pub?.id, "发表公开匿名留言", `HTTP ${r.status}`);

r = await post(
  { slug: SLUG, nick: "DHua", body: "自测：只有我和站长能看", visibility: "private", secret_hash: sha(secret) },
  false
);
ok(r.status === 201, "发表仅双方可见留言", `HTTP ${r.status}`);
const mine1 = await thread(secret);
const priv = mine1.find((x) => x.body.includes("只有我"));
ok(!!priv, "口令能取回刚发的私密留言", `${mine1.length} 条`);

const list = await listOf();
ok(!list.some((x) => x.body.includes("只有我")), "直接查表拿不到私密行", `${list.length} 行`);

const all = await fetch(`${URL_}/rest/v1/comments?select=${F}&limit=1000`, { headers: H }).then((x) => x.json());
ok(!all.some((x) => x.body.includes("只有我")), "全表扫描也拿不到私密行", `全表 ${all.length} 行`);

ok((await thread("wrong-secret")).length === 0, "错口令取回 0 条");

r = await fetch(`${URL_}/rest/v1/rpc/cmt_reply`, {
  method: "POST",
  headers: H,
  body: JSON.stringify({ p_parent: priv.id, p_body: "冒名回复", p_pass: "not-the-pass" }),
});
ok(r.status >= 400, "错站长口令回复被拒", `HTTP ${r.status}`);

r = await fetch(`${URL_}/rest/v1/rpc/cmt_reply`, {
  method: "POST",
  headers: H,
  body: JSON.stringify({ p_parent: priv.id, p_body: "自测：站长回复", p_pass: MASTER }),
});
const rep = await r.json();
ok(r.ok && rep?.is_owner === true, "站长回复写入成功", `HTTP ${r.status}`);

const mine2 = await thread(secret);
ok(mine2.length === 2 && mine2.some((x) => x.is_owner), "口令能看到自己那条 + 站长回复", `${mine2.length} 条`);

r = await post({ slug: SLUG, nick: "冒充站长", body: "我是站长", visibility: "public", is_owner: true }, true);
ok(!r.ok, "访客不能伪造成站长", `HTTP ${r.status}`);

console.log(`\n通过 ${pass} 项，失败 ${fail} 项`);
console.log("提醒：跑完记得删 /__selftest__/ 的测试数据（SQL 见文件头）");
process.exit(fail ? 1 : 0);
