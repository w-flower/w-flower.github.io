import puppeteer from "puppeteer-core";
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const urls = [
  "/", "/about/", "/notes/", "/snippets/", "/micro/", "/archive/", "/posts/",
  "/posts/vector-growth-factor/",
  "/notes/const-and-pointer/",
  "/notes/red-black-tree-insert/",
  "/snippets/optional-instead-of-null/",
  "/danmaku/",
];
const sizes = [[1440, 900], [1280, 800], [1180, 800], [1024, 768], [768, 900], [390, 844]];
const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ["--disable-gpu"] });
let bad = 0;
for (const [w, h] of sizes) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: h, isMobile: w < 760, hasTouch: w < 760 });
  for (const u of urls) {
    await page.goto("http://127.0.0.1:4321" + u, { waitUntil: "networkidle0", timeout: 40000 });
    await new Promise((r) => setTimeout(r, 250));
    const m = await page.evaluate(() => {
      const de = document.documentElement;
      const who = [];
      for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.right > de.clientWidth + 1 && !el.closest(".bg-layer")) {
          who.push(el.tagName.toLowerCase() + "." + String(el.className).slice(0, 26));
        }
      }
      return { overflow: de.scrollWidth > de.clientWidth + 1, who: who.slice(0, 4) };
    });
    if (m.overflow) {
      bad++;
      console.log("x " + w + " " + u + " 溢出 " + m.who.join(", "));
    }
  }
  await page.close();
}
console.log(bad === 0 ? "全部页面 / 全部断点：无横向溢出" : "共 " + bad + " 处溢出");
await browser.close();
