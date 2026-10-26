/**
 * 评论系统端到端验证（对着 scripts/comments-mock.mjs 跑）
 * ------------------------------------------------------------
 * 要证明的四件事：
 *   1. 公开留言：匿名也能发，谁都能看见
 *   2. 「仅你和我」：同一台设备看得见
 *   3. 「仅你和我」：换一个干净的浏览器上下文（等于换了台设备 + 清了缓存）看不见
 *      —— 这一条是重点。如果它能看见，那这个功能就是假的。
 *   4. 拿对口令能找回；站长凭口令能回复，回复只出现在这一串里
 *
 * 用法（先起 mock，再用测试配置构建）：
 *   node scripts/comments-mock.mjs 54321
 *   PUBLIC_CMT_URL=http://127.0.0.1:54321 PUBLIC_CMT_KEY=test-key \
 *     node node_modules/astro/bin/astro.mjs build --outDir dist-cmt
 *   node scripts/test-comments.mjs
 */
import puppeteer from "puppeteer-core";

const BASE = process.env.CMT_BASE || "http://127.0.0.1:4323";
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PASS = process.env.MOCK_PASS || "test-pass";
const PATH = "/notes/07-夹逼三板斧/";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const ok = (cond, label, extra = "") => {
  console.log(`  ${cond ? "✅" : "❌"} ${label}${extra ? "  " + extra : ""}`);
  if (!cond) fails++;
};

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: "new",
  args: ["--no-proxy-server", "--no-sandbox", "--disable-gpu"],
});

const open = async () => {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(encodeURI(BASE + PATH), { waitUntil: "networkidle2" });
  await page.waitForSelector("#cmtBody", { timeout: 8000 });
  return { ctx, page, errs };
};

const texts = (page) =>
  page.evaluate(() => [...document.querySelectorAll("#cmtList .cmt-item > .cmt-text")].map((e) => e.textContent));

const post = async (page, nick, body) => {
  await page.evaluate(
    ([n, b]) => {
      document.getElementById("cmtNick").value = n;
      document.getElementById("cmtBody").value = b;
      document.getElementById("cmtBody").dispatchEvent(new Event("input", { bubbles: true }));
    },
    [nick, body]
  );
  await page.click("#cmtSend");
  await wait(700);
};

const setVis = async (page, v) => {
  await page.evaluate((v) => document.querySelector(`.cmt-tab[data-vis="${v}"]`).click(), v);
  await wait(250);
};

const mark = `测试-${Date.now().toString(36)}`;

console.log("=== 1. 公开 + 匿名 ===");
const A = await open();
await post(A.page, "", `公开留言 ${mark}`);
let list = await texts(A.page);
ok(list.some((t) => t.includes(mark)), "空昵称也能发，且立刻出现在列表里", `共 ${list.length} 条`);
const names = await A.page.evaluate(() =>
  [...document.querySelectorAll("#cmtList .cmt-name")].map((e) => e.textContent)
);
ok(names.includes("匿名"), "空昵称渲染成「匿名」", names.join(","));

console.log("=== 2. 仅你和我（本机可见）===");
await setVis(A.page, "private");
await post(A.page, "鹿", `私密留言 ${mark}`);
list = await texts(A.page);
ok(list.some((t) => t.includes(mark)), "私密留言在本机看得到");
const secret = await A.page.evaluate(() => JSON.parse(localStorage.getItem("dhua.cmt") || "{}").secret);
ok(!!secret && secret.length >= 16, "本机生成了私密口令", secret ? secret.slice(0, 8) + "…" : "无");

console.log("=== 3. 换一台干净设备（重点）===");
const B = await open();
await setVis(B.page, "public");
list = await texts(B.page);
ok(list.some((t) => t.includes("公开留言 " + mark)), "公开留言对陌生人可见");
ok(!list.some((t) => t.includes("私密留言 " + mark)), "私密留言不在公开列表里");
await setVis(B.page, "private");
list = await texts(B.page);
ok(list.length === 0, "陌生人切到「仅你和我」看到的是空的", `实际 ${list.length} 条`);

const leak = await B.page.evaluate(async (base) => {
  const r = await fetch(`${base}/rest/v1/comments?select=*`);
  const j = await r.json();
  return j.filter((x) => x.visibility === "private").length;
}, BASE.replace("4323", "54321"));
ok(leak === 0, "直接打 REST 列表也拿不到私密行（模拟 RLS）", `private 行数=${leak}`);

console.log("=== 4. 口令找回 ===");
await B.page.evaluate((s) => {
  document.getElementById("cmtSecret").value = s;
  document.getElementById("cmtSecretGo").click();
}, secret);
await wait(800);
list = await texts(B.page);
ok(list.some((t) => t.includes("私密留言 " + mark)), "拿对口令能找回自己那一串", `共 ${list.length} 条`);

console.log("=== 5. 站长回复（只在私密串里出现）===");
await B.page.evaluate((p) => {
  document.getElementById("cmtPass").value = p;
  document.getElementById("cmtPassGo").click();
}, PASS);
await wait(300);
const hasBtn = await B.page.evaluate(() => !!document.querySelector(".cmt-reply-btn"));
ok(hasBtn, "输对口令后出现「回复」入口");
await B.page.evaluate(() => document.querySelector(".cmt-reply-btn").click());
await wait(200);
await B.page.evaluate(() => {
  const ta = document.querySelector(".cmt-reply-form textarea");
  ta.value = "站长回复内容";
  document.querySelector(".cmt-reply-form .primary").click();
});
await wait(900);
const bodyText = await B.page.evaluate(() => document.getElementById("comments").textContent);
ok(bodyText.includes("站长回复内容"), "回复写进去了");
ok(bodyText.includes("站长"), "回复带「站长」标识");

console.log("=== 6. 公开列表里不该出现这条私密串的回复 ===");
const C = await open();
list = await texts(C.page);
ok(!list.some((t) => t.includes("站长回复内容")), "陌生人的公开列表里没有私密串的回复");

console.log("=== 控制台错误 ===");
const allErrs = [...A.errs, ...B.errs, ...C.errs];
console.log(allErrs.length ? allErrs.map((e) => "  " + e).join("\n") : "  无");
if (allErrs.length) fails++;

await browser.close();
console.log(fails === 0 ? `\nPASS: 评论三种可见性全部按预期工作。` : `\nFAIL: ${fails} 项不通过。`);
process.exit(fails === 0 ? 0 : 1);
