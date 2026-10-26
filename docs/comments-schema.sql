-- ============================================================
--  DHua 博客 · 评论系统建表脚本
-- ------------------------------------------------------------
--  在哪跑：Supabase 控制台 → SQL Editor → 新建查询 → 整段粘贴 → Run。
--  跑几遍都没事（全部 if not exists / create or replace）。
--
--  三种可见性怎么实现：
--    公开      visibility='public'，谁都能 select（RLS 放行）
--    匿名      nick 为空，前端显示「匿名」，服务端不存任何身份
--    仅双方可见 visibility='private'，RLS 对 anon **完全不给 select**，
--              只能通过 cmt_thread() 这个函数，凭 sha256(口令) 取回自己那一串。
--              站长用同一个口令（或管理员口令 + 后台）也能看。
--
--  为什么私密的读要走函数而不是 RLS：
--    RLS 只认 auth.uid()，而这里的访客没有登录态。把口令算成 hash 存进
--    每一行，再用 SECURITY DEFINER 的函数按 hash 过滤，等价于
--    「拿对钥匙才能开这把锁」，而且锁孔（hash）不对外暴露。
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- 表 ----------
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null check (char_length(slug) between 1 and 200),
  parent_id   uuid references public.comments (id) on delete cascade,
  nick        text check (nick is null or char_length(nick) <= 24),
  body        text not null check (char_length(body) between 1 and 1200),
  visibility  text not null default 'public' check (visibility in ('public', 'private')),
  -- 私密留言的钥匙指纹。公开留言为 null
  secret_hash text,
  -- 站长回复（由 cmt_reply 写入，前端据此渲染成不同样式）
  is_owner    boolean not null default false,
  -- 用来做简易限流：同一 IP 10 分钟内最多 5 条
  ip_hash     text,
  created_at  timestamptz not null default now(),
  constraint private_needs_key check (
    (visibility = 'public' and secret_hash is null)
    or (visibility = 'private' and secret_hash is not null)
  )
);

create index if not exists comments_slug_idx on public.comments (slug, created_at desc);
create index if not exists comments_parent_idx on public.comments (parent_id);
create index if not exists comments_hash_idx on public.comments (secret_hash);

-- ---------- 站长口令（只有一行） ----------
create table if not exists public.cmt_admin (
  id        int primary key default 1 check (id = 1),
  pass_hash text not null
);

-- 首次运行请把 'CHANGE-ME-站长口令' 换成你自己的口令。
-- 已经有记录了就不会覆盖，重复跑是安全的。
insert into public.cmt_admin (id, pass_hash)
values (1, encode(digest('CHANGE-ME-站长口令', 'sha256'), 'hex'))
on conflict (id) do nothing;

-- ---------- 限流：同一 IP 10 分钟内最多 5 条 ----------
create or replace function public.cmt_rate_guard()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  ip  text;
  cnt int;
begin
  ip := coalesce(
    split_part(
      coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''),
      ',', 1
    ),
    ''
  );
  new.ip_hash := encode(digest(coalesce(nullif(ip, ''), 'unknown'), 'sha256'), 'hex');

  select count(*) into cnt
  from public.comments
  where ip_hash = new.ip_hash
    and created_at > now() - interval '10 minutes';

  if cnt >= 5 then
    raise exception '发得太快了，歇十分钟再来。' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists cmt_rate_guard_trg on public.comments;
create trigger cmt_rate_guard_trg
before insert on public.comments
for each row execute function public.cmt_rate_guard();

-- ---------- RLS ----------
alter table public.comments enable row level security;
alter table public.cmt_admin enable row level security;

-- 公开留言：所有人可读
drop policy if exists "public comments are readable" on public.comments;
create policy "public comments are readable"
  on public.comments for select
  to anon, authenticated
  using (visibility = 'public');

-- 留言：任何人可写，但必须写成合法状态。
-- 「公开却塞了 secret_hash」或「私密却没钥匙」都会被 constraint 挡掉，
-- 这里再挡一层：不允许访客自己伪造 is_owner。
drop policy if exists "anyone can post" on public.comments;
create policy "anyone can post"
  on public.comments for insert
  to anon, authenticated
  with check (is_owner = false);

-- 不开放 update / delete。站长要改要删去 Table Editor。
-- 私密行没有 select 策略，所以 anon 永远读不到 —— 这是「仅双方可见」的地基。

-- ---------- RPC 1：凭口令取回自己那一串（含站长的回复） ----------
create or replace function public.cmt_thread(p_slug text, p_secret text)
returns setof public.comments
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select *
  from public.comments
  where slug = p_slug
    and visibility = 'private'
    and secret_hash = encode(digest(p_secret, 'sha256'), 'hex')
  order by created_at asc;
$$;

revoke all on function public.cmt_thread(text, text) from public;
grant execute on function public.cmt_thread(text, text) to anon, authenticated;

-- ---------- RPC 2：站长回复 ----------
-- p_parent 是被回复的那条评论的 id。回复继承它的 visibility 与 secret_hash，
-- 所以「仅双方可见」的留言下面，站长的回复也只对那一个人可见。
create or replace function public.cmt_reply(p_parent uuid, p_body text, p_pass text)
returns public.comments
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  parent public.comments;
  row    public.comments;
  ok     boolean;
begin
  select (pass_hash = encode(digest(p_pass, 'sha256'), 'hex')) into ok
  from public.cmt_admin where id = 1;

  if not coalesce(ok, false) then
    raise exception '口令不对。' using errcode = 'P0001';
  end if;

  if char_length(coalesce(p_body, '')) not between 1 and 1200 then
    raise exception '回复不能为空，也不能超过 1200 字。' using errcode = 'P0001';
  end if;

  select * into parent from public.comments where id = p_parent;
  if not found then
    raise exception '要回复的评论不存在。' using errcode = 'P0001';
  end if;

  insert into public.comments (slug, parent_id, nick, body, visibility, secret_hash, is_owner, ip_hash)
  values (parent.slug, parent.id, null, p_body, parent.visibility, parent.secret_hash, true, null)
  returning * into row;

  return row;
end;
$$;

revoke all on function public.cmt_reply(uuid, text, text) from public;
grant execute on function public.cmt_reply(uuid, text, text) to anon, authenticated;

-- ---------- 常用查询 ----------
-- 看全部（含私密），只能在 SQL Editor 里跑（这里是 postgres 角色，绕过 RLS）：
--   select created_at, slug, nick, visibility, is_owner, body
--   from public.comments order by created_at desc limit 100;
--
-- 删掉某条（会连带删掉它的回复）：
--   delete from public.comments where id = '...';
