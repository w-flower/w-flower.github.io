/**
 * 评论数据层（PostgREST 协议，Supabase 兼容）
 * ------------------------------------------------------------
 * 不走 SDK：这里只需要 5 个请求，手写 fetch 比引一个包更省，
 * 也让这套代码能直接对接任何 PostgREST 服务（Supabase / 自建 PostgREST）。
 *
 * 安全模型（对应 docs/comments-schema.sql）：
 *   - 公开留言：任何人有 anonKey 就能 select / insert
 *   - 私密留言：库里对 anon 完全没有 select 权限，
 *     只能用「钥匙指纹」= sha256(口令) 通过 RPC 取回自己那一串
 *   - 站长回复：RPC 里校验口令，通过后写入的行带 is_owner=true
 * anonKey 是公开键，放前端没问题（真正的门是 RLS，不是钥匙）。
 */
import { site } from "../site.config";

export interface Comment {
  id: string;
  parent_id: string | null;
  nick: string | null;
  body: string;
  is_owner: boolean;
  created_at: string;
}

/* 配置来源：site.config.ts 是正式入口；
   测试时用 PUBLIC_CMT_URL / PUBLIC_CMT_KEY 覆盖，避免为了跑一次端到端
   就去改动站点配置（也就不会把测试端口混进正式构建）。 */
const CFG = {
  endpoint: import.meta.env.PUBLIC_CMT_URL || site.comments.endpoint,
  anonKey: import.meta.env.PUBLIC_CMT_KEY || site.comments.anonKey,
};

export const commentsEnabled = Boolean(CFG.endpoint && CFG.anonKey);

const base = () => CFG.endpoint.replace(/\/+$/, "");

const headers = (extra: Record<string, string> = {}) => ({
  apikey: CFG.anonKey,
  Authorization: `Bearer ${CFG.anonKey}`,
  "Content-Type": "application/json",
  ...extra,
});

/** sha256 十六进制。浏览器只在 https / localhost 提供 crypto.subtle */
export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** 随机口令：32 位十六进制，肉眼能抄、暴力猜不到 */
export function makeSecret(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

const errText = async (r: Response) => {
  try {
    const j = await r.json();
    return j.message || j.hint || j.error || `HTTP ${r.status}`;
  } catch {
    return `HTTP ${r.status}`;
  }
};

const FIELDS = "id,parent_id,nick,body,is_owner,created_at";

/** 公开留言（服务端已经按 RLS 只返回 public 行） */
export async function listPublic(slug: string): Promise<Comment[]> {
  const q = new URLSearchParams({
    slug: `eq.${slug}`,
    visibility: "eq.public",
    select: FIELDS,
    order: "created_at.asc",
    limit: "500",
  });
  const r = await fetch(`${base()}/rest/v1/comments?${q}`, { headers: headers() });
  if (!r.ok) throw new Error(await errText(r));
  return r.json();
}

interface PostInput {
  slug: string;
  nick: string;
  body: string;
  /** 传了就发私密留言；不传就是公开 */
  secret?: string;
}

export async function postComment({ slug, nick, body, secret }: PostInput): Promise<Comment> {
  const private_ = Boolean(secret);
  const row: Record<string, unknown> = {
    slug,
    nick: nick.trim() || null,
    body: body.trim(),
    visibility: private_ ? "private" : "public",
  };
  if (private_ && secret) row.secret_hash = await sha256(secret);

  const r = await fetch(`${base()}/rest/v1/comments?select=${FIELDS}`, {
    method: "POST",
    headers: headers({ Prefer: "return=representation" }),
    body: JSON.stringify(row),
  });
  if (!r.ok) throw new Error(await errText(r));
  const rows = await r.json();
  if (!rows.length) throw new Error("写入被拒绝（检查 RLS 策略）");
  return rows[0];
}

/** 凭口令取回自己的私密串（含站长回复） */
export async function getThread(slug: string, secret: string): Promise<Comment[]> {
  const r = await fetch(`${base()}/rest/v1/rpc/cmt_thread`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ p_slug: slug, p_secret: secret }),
  });
  if (!r.ok) throw new Error(await errText(r));
  return r.json();
}

/** 站长回复。口令不对服务端会抛错 */
export async function reply(parentId: string, body: string, pass: string): Promise<Comment> {
  const r = await fetch(`${base()}/rest/v1/rpc/cmt_reply`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ p_parent: parentId, p_body: body, p_pass: pass }),
  });
  if (!r.ok) throw new Error(await errText(r));
  return r.json();
}

/* ── 本机记两样东西：私密口令、站长口令（都不上云） ── */
const KEY = "dhua.cmt";

interface Local {
  secret?: string;
  adminPass?: string;
}

export function loadLocal(): Local {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as Local;
  } catch {
    return {};
  }
}

export function saveLocal(patch: Local): Local {
  const next = { ...loadLocal(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* 隐私模式下写不进去，忽略即可，不影响本次会话 */
  }
  return next;
}
