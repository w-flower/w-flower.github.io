import puppeteer from "puppeteer-core";

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";

const url = process.argv[2] ?? "http://127.0.0.1:4321/";
const out = process.argv[3] ?? "shot.png";
const width = Number(process.argv[4] ?? 1440);
const height = Number(process.argv[5] ?? 1000);
const isMobile = width < 760;

const browser = await puppeteer.launch({
  executablePath: EDGE,
  headless: true,
  args: ["--disable-gpu", "--hide-scrollbars"],
});

const page = await browser.newPage();
await page.setViewport({
  width,
  height,
  isMobile,
  deviceScaleFactor: 1,
  hasTouch: isMobile,
});

await page.goto(url, { waitUntil: "networkidle0", timeout: 40000 });
await new Promise((r) => setTimeout(r, 900));

const m = await page.evaluate(() => {
  const de = document.documentElement;
  const offenders = [];
  for (const el of Array.from(document.querySelectorAll("body *"))) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.right > de.clientWidth + 1) {
      offenders.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className || "").toString().slice(0, 40),
        right: Math.round(r.right),
        width: Math.round(r.width),
      });
    }
  }
  return {
    clientWidth: de.clientWidth,
    scrollWidth: de.scrollWidth,
    overflow: de.scrollWidth > de.clientWidth + 1,
    offenders: offenders.slice(0, 8),
  };
});

console.log(`viewport=${width} client=${m.clientWidth} scroll=${m.scrollWidth} overflow=${m.overflow}`);
if (m.offenders.length) {
  console.log("溢出元素：");
  for (const o of m.offenders) {
    console.log(`  <${o.tag}> .${o.cls} right=${o.right} w=${o.width}`);
  }
}

await page.screenshot({ path: out, fullPage: false });
await browser.close();
