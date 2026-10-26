# 评论区方案（公开 / 匿名 / 仅双方可见）

> 这份是设计说明 + 上线步骤。代码已经写完并通过端到端验证，
> 差的是把一个后端地址填进 `src/site.config.ts`。

---

## 一、先说结论

| 需求 | 现成方案能不能满足 |
|---|---|
| 公开评论 | Giscus / Waline / Twikoo 都能 |
| 匿名评论（不登录） | Giscus ✗（必须 GitHub 登录）、Waline ✓、Twikoo ✓ |
| **仅双方可见** | **三家都 ✗** |

「仅双方可见」不是皮肤问题，是**读权限**问题：评论列表是一次性返回给所有访客的，
只要这条数据下发到浏览器，谁打开开发者工具都能看到。
所以它必须由服务端在返回前把行过滤掉 —— 任何"前端藏起来"的做法都是假的。

这就把选择收窄成两条：**自己接手一个后端**，或者**放弃这一档**。

选前者。技术栈上没有从零发明：用 PostgREST 协议（Supabase 免费版就是），
把"过滤"交给数据库的行级安全（RLS）和一个受控函数。

---

## 二、三种可见性分别靠什么强制

数据模型（`docs/comments-schema.sql`）：

```sql
comments(
  id uuid, slug text, parent_id uuid,
  nick text,                -- null 就是匿名
  body text,
  visibility text,          -- 'public' | 'private'
  secret_hash text,         -- 私密行才有：sha256(访客口令)
  is_owner boolean,         -- 站长回复
  ip_hash text, created_at timestamptz
)
```

**公开**
RLS 策略 `using (visibility = 'public')`。匿名访客的 select 只能看到这一批行，
其余行在数据库层就不存在。

**匿名**
`nick` 直接存 `null`，前端渲染成「匿名」。服务端不记录任何身份，
不存 IP 明文（只存 `sha256(ip)` 用于限流，且不对外）。

**仅双方可见**
1. 访客第一次发私密留言时，浏览器生成一枚随机口令（32 位 hex），只存本地。
2. 提交时算 `sha256(口令)` 存进 `secret_hash`。
3. `visibility='private'` 的行**没有任何 select 策略** —— 访客用 anonKey 直接查表，
   一行也拿不到（`SELECT` 返回空数组，不是报错）。
4. 想取回只能调 `cmt_thread(slug, 口令)`：`SECURITY DEFINER` 函数，
   先算 sha256 再按 `secret_hash` 过滤。等于"拿对钥匙才开得了这把锁"，
   而锁孔（指纹）不对外暴露。

站长回复走 `cmt_reply(parent_id, body, 口令)`：函数内部比对站长口令，
通过后写入的行 `is_owner=true`，并且**继承父评论的 visibility 和 secret_hash** ——
所以私密串下面的回复，也只对这个访客可见。

---

## 三、为什么不用登录

加了登录就有账号体系、找回密码、隐私政策一整套东西，而这是个十几个人的小站。
所以身份用"持有凭证"代替：

- 匿名身份 = 不持有任何东西
- 私密身份 = 持有一枚口令（保存在本机，可手抄，可换设备粘贴）
- 站长身份 = 持有一句口令（保存在本机，只有输入后才出现「回复」按钮）

代价写在明处：**口令丢了就找不回来**，因为它只以指纹形式存在。
这句话在界面上有专门一行提示，不藏着。

---

## 四、被否决的方案

| 方案 | 否决理由 |
|---|---|
| Giscus（GitHub Discussions） | 必须 GitHub 登录，不匿名；且 Discussions 的内容人人可读，做不出私密 |
| Waline / Twikoo | 能匿名，但要额外部署一个 Node 服务；**同样没有"仅双方可见"** |
| 前端把私密评论藏起来 | 数据已经在浏览器里了，等于没藏 |
| 客户端加密后放公开处 | 站长要能读就必须有私钥，访客要能读就必须有同一把私钥 —— 逻辑上不成立 |
| WorkBuddy 自带云服务 | 它按 Origin 精确匹配，只承认自家发布域名，认不了 `w-flower.github.io` |

---

## 五、你要做的两步

### 1）跑一遍 SQL

Supabase 建一个免费项目 → SQL Editor → 粘贴 `docs/comments-schema.sql` 全文 → Run。
跑之前把文件里这行的口令改成你自己的：

```sql
insert into public.cmt_admin (id, pass_hash)
values (1, encode(digest('CHANGE-ME-站长口令', 'sha256'), 'hex'))
```

### 2）填两个值

`src/site.config.ts`：

```ts
comments: {
  endpoint: "https://xxxxxxxx.supabase.co",   // Project URL
  anonKey: "sb_publishable_xxx",              // publishable / anon key
},
```

anonKey 是**公开键**，进前端是设计如此 —— 真正挡人的是 RLS，不是这串字符。
**绝对不要**把 `service_role` / `secret` 键填进来（它绕过 RLS）。

填完重新部署，文章页底部就会出现评论区。没填就整块不渲染，不留空壳。

---

## 六、已经验证过什么

`scripts/test-comments.mjs` 对着一个本地假 PostgREST（`scripts/comments-mock.mjs`）
跑完整链路，13 项全过。关键几条：

- 空昵称能发，渲染成「匿名」
- 私密留言在本机可见
- **换一个干净的浏览器上下文（等于换设备 + 清缓存）：私密留言看不见，切到「仅你和我」是空的**
- 直接打 `GET /rest/v1/comments`：私密行数 = 0
- 拿对口令能找回；站长口令能回复；回复只出现在那一串里，不出现在公开列表

第 3、4 条是重点 —— 如果它们不成立，这个功能就是装饰品。

---

## 七、边界与后续

- **垃圾评论**：DB 侧有「同一 IP 10 分钟最多 5 条」的触发器；前端有 1200 字上限。
  真被刷了，最省事的做法是去 Supabase Table Editor 直接删，或者临时把 RLS 的
  insert 策略关掉。没上验证码 —— 一个没人看的小站，验证码挡掉的多半是真人。
- **数据归属**：在你自己 Supabase 账号下，可导出 CSV/SQL，随时能搬走。
- **换后端**：数据层是纯 PostgREST 协议（`src/lib/comments.ts` 五个 fetch），
  自建 PostgREST 或换成 Cloudflare D1 + 一个 Worker 都只需要改这一个文件。
- **内容量**：15 篇笔记的评论量级，免费额度（500MB）用不完。
