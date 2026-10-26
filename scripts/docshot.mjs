import puppeteer from "puppeteer-core";
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const url = process.argv[2];
const out = process.argv[3];
const width = Number(process.argv[4] ?? 1440);
const height = Number(process.argv[5] ?? 900);
const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ["--disable-gpu", "--hide-scrollbars"] });
const page = await browser.newPage();
await page.setViewport({ width, height, deviceScaleFactor: 1, isMobile: width < 760, hasTouch: width < 760 });
await page.goto(url, { waitUntil: "networkidle0", timeout: 40000 });
await new Promise(r => setTimeout(r, 900));
const m = await page.evaluate(() => {
  const de = document.documentElement;
  const bad = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.right > de.clientWidth + 1) bad.push(el.tagName.toLowerCase() + "." + (el.className || "").toString().slice(0, 30));
  }
  const toc = document.querySelectorAll("#tocList a").length;
  const meta = document.querySelector(".doc-meta")?.innerText.replace(/\n/g, " | ");
  return { overflow: de.scrollWidth > de.clientWidth + 1, bad: bad.slice(0, 6), toc, meta, scrollH: de.scrollHeight };
});
console.log(`viewport=${width} overflow=${m.overflow} toc=${m.toc} scrollH=${m.scrollH}`);
if (m.bad.length) console.log("溢出：" + m.bad.join(", "));
console.log("左栏：" + m.meta);
await page.screenshot({ path: out });
await browser.close();
