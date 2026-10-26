/* 验证动效①：进度条上的罗小黑。
   滚一段 → 读 #progressCat 的 --x / --tilt / --s；
   再往上滚 → tilt 应翻符号；停手 → tilt、--s 回基准、rAF 自停。 */
import puppeteer from "puppeteer-core";

const b = await puppeteer.launch({
  executablePath: "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  args: ["--no-sandbox"],
});
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 900 });
const errs = [];
p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
p.on("pageerror", (e) => errs.push("PAGEERR " + e.message));

await p.goto("http://127.0.0.1:4321/notes/const-and-pointer/", {
  waitUntil: "networkidle0",
});
await new Promise((r) => setTimeout(r, 600));

const read = () =>
  p.evaluate(() => {
    const el = document.getElementById("progressCat");
    const bar = document.getElementById("progress");
    if (!el || !bar) return null;
    const cs = getComputedStyle(el);
    return {
      x: bar.style.getPropertyValue("--x").trim(),
      tilt: bar.style.getPropertyValue("--tilt").trim(),
      s: bar.style.getPropertyValue("--s").trim(),
      p: bar.style.getPropertyValue("--p").trim(),
      transform: cs.transform,
      visible: cs.display !== "none" && el.getBoundingClientRect().width > 0,
      top: Math.round(el.getBoundingClientRect().top),
    };
  });

const out = { start: await read() };

/* 慢滚下去：一段一段滚，每段后采样 */
for (let i = 0; i < 5; i++) {
  await p.evaluate(() => window.scrollBy({ top: 900, behavior: "instant" }));
  await new Promise((r) => setTimeout(r, 60));
}
out.afterDown = await read();

/* 往上滚 */
for (let i = 0; i < 3; i++) {
  await p.evaluate(() => window.scrollBy({ top: -600, behavior: "instant" }));
  await new Promise((r) => setTimeout(r, 60));
}
out.afterUp = await read();

/* 停手 1.2s，看是否收敛 + rAF 自停 */
await new Promise((r) => setTimeout(r, 1200));
out.idle = await read();

/* 摸底：是否残留 rAF 空转 —— 连续两帧 --tilt 完全一致即认为已停 */
out.stable = await p.evaluate(async () => {
  const bar = document.getElementById("progress");
  const a = bar.style.getPropertyValue("--tilt");
  await new Promise((r) => setTimeout(r, 260));
  const c = bar.style.getPropertyValue("--tilt");
  return { a, c, stopped: a === c };
});

/* 窄屏也看一眼 */
await p.setViewport({ width: 390, height: 844 });
await new Promise((r) => setTimeout(r, 400));
await p.evaluate(() => window.scrollTo({ top: 600, behavior: "instant" }));
await new Promise((r) => setTimeout(r, 300));
out.mobile = await read();

/* 横向溢出体检 */
out.overflow = await p.evaluate(() => ({
  scrollW: document.documentElement.scrollWidth,
  clientW: document.documentElement.clientWidth,
}));

console.log(JSON.stringify({ ...out, errs }, null, 2));
await b.close();