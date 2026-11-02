# 评论区方案（公开 / 匿名 / 仅双方可见）

> 这份是设计说明 + 上线记录。**2026-11-02 已接入真实 Supabase 并上线**，
> 现在文章页底部就有评论区，三种可见性都用真实请求验过。

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

## 五、现在是什么状态（2026-11-02 已上线）

后端已经开好并跑完建表，**不需要再做任何操作**：

| 项 | 值 |
|---|---|
| 项目 | Supabase 免费版，ref `nglgymxsnnlaqxvmvrxo` |
| 区域 | eu-west-1（建项目时的默认值） |
| 端点 | `https://nglgymxsnnlaqxvmvrxo.supabase.co` |
| anon key | 在 `src/site.config.ts`（公开键，进前端是设计如此） |
| **站长口令** | `dhua-cmt-8f3k2m7q`（存在 `.local/评论后台凭据.md`，不进仓库） |

改成自己的口令：Supabase → SQL Editor：

```sql
update public.cmt_admin
set pass_hash = encode(extensions.digest(新口令, sha256), hex)
where id = 1;
```

### 建这套东西踩到的两个坑（换后端时还会遇到）

1. **Supabase 把扩展装在 `extensions` schema**，不是 `public`。
   `create extension if not exists pgcrypto` 之后直接写 `digest(...)` 会报
   `function digest(text, unknown) does not exist` —— 必须写成 `extensions.digest(...)`。
2. **私密行不能用 `Prefer: return=representation`**。PostgREST 的 RETURNING 也要过 RLS，
   私密行对 anon 没有 select 权限，插入会直接报
   `new row violates row-level security policy`（HTTP 401），看起来像"策略配错了"，其实是回读被拒。
   前端因此改成 `return=minimal`，写完再用 `cmt_thread` 把真行拉回来。

---

## 六、已经验证过什么

分三层，全部对着**真实后端**跑：

**A. 接口层（11 项，`node .tmp_sb/live-test2.mjs` 类脚本）**

- 匿名公开发言 ✓；私密留言用 `return=minimal` 写入 ✓
- 直接 `GET /rest/v1/comments?slug=...` 拿不到私密行 ✓
- **全表扫描 `?limit=1000` 也拿不到私密行** ✓
- 错口令 `cmt_thread` 返回 0 条 ✓；对口令返回自己那串 ✓
- 错站长口令 `cmt_reply` 被拒（HTTP 400）✓
- 站长回复写入后，公开列表仍然是 1 条（回复跟着私密串一起隐藏）✓
- 访客伪造 `is_owner: true` 被 RLS 挡住（HTTP 401）✓

**B. 浏览器层（线上 `w-flower.github.io` 真实点击）**

- 发公开留言 → 立刻出现在列表并显示「已发表。」✓
- 切「仅你和我」发私密留言 → 自己能看见，界面把口令明文交代并提示已存本机 ✓
- 切回公开页签：私密那条不在 ✓
- **干净浏览器上下文（等于换设备 + 清缓存）**：只看到公开留言；切「仅你和我」是空的 ✓
- 另一台设备输口令 → 私密串找回 ✓
- 站长口令 → 出现「回复」按钮，回复写入后署名「站长」、带竖向强调线 ✓

**C. 明暗两套外观**：计算样式 + 截图都看过，正文、时间、徽标、回复块在两种主题下都读得清。

第 2 条和第 4 条是重点 —— 如果它们不成立，这个功能就是装饰品。

---

## 七、边界与后续

- **垃圾评论**：DB 侧有「同一 IP 10 分钟最多 5 条」的触发器；前端有 1200 字上限。
  真被刷了，最省事的做法是去 Supabase Table Editor 直接删，或者临时把 RLS 的
  insert 策略关掉。没上验证码 —— 一个没人看的小站，验证码挡掉的多半是真人。
- **数据归属**：在你自己 Supabase 账号下，可导出 CSV/SQL，随时能搬走。
- **换后端**：数据层是纯 PostgREST 协议（`src/lib/comments.ts` 五个 fetch），
  自建 PostgREST 或换成 Cloudflare D1 + 一个 Worker 都只需要改这一个文件。
- **内容量**：15 篇笔记的评论量级，免费额度（500MB）用不完。
