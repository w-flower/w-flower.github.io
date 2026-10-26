/* 验证逐词出现：
   1. 动画结束后每个 span 都是 opacity 1（不能有永久透明的）
   2. 关掉动画（reduce）时标题依然完整可见
   3. 渐变文字没被 span 拆分搞坏
   4. 无横向溢出 */
import puppeteer from "puppeteer-core";
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const URL = "http://127.0.0.1:4321/notes/const-and-pointer/";

const probe = async (reduce) => {
  const b = await puppeteer.launch({
    executablePath: EDGE,
    headless: true,
    args: ["--disable-gpu", "--hide-scrollbars"],
  });
  const p = await b.newPage();
  await p.setViewport({ width: 1280, height: 950 });
  if (reduce) {
    await p.emulateMediaFeatures([
      { name: "prefers-reduced-motion", value: "reduce" },
    ]);
  }
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await p.goto(URL, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, reduce ? 500 : 2600));

  const r = await p.evaluate(() => {
    const h1 = document.querySelector(".doc-title");
    const spans = Array.from(h1.querySelectorAll("span"));
    const op = spans.map((s) => Number(getComputedStyle(s).opacity));
    return {
      spanCount: spans.length,
      invisible: op.filter((o) => o < 0.95).length,
      text: (h1.textContent || "").replace(/ /g, " ").slice(0, 60),
      fill: getComputedStyle(h1).webkitTextFillColor,
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
    };
  });
  await b.close();
  return { ...r, reduce, errs };
};

console.log(JSON.stringify([await probe(false), await probe(true)], null, 2));