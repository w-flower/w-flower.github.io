import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";

const EXE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const BASE = "http://localhost:4321";
mkdirSync("D:/Projects/blog/.shots", { recursive: true });

const browser = await puppeteer.launch({
  executablePath: EXE,
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

async function shot(path, file, full = true, w = 1280) {
  const page = await browser.newPage();
  await page.setViewport({ width: w, height: 900, deviceScaleFactor: 1 });
  await page.goto(BASE + path, { waitUntil: "networkidle0", timeout: 20000 });
  await new Promise((r) => setTimeout(r, 900));
  await page.screenshot({ path: file, fullPage: full });
  await page.close();
  console.log("saved", file);
}

await shot("/start/", "D:/Projects/blog/.shots/start.png", false);
await shot("/kb/", "D:/Projects/blog/.shots/kb.png", true);
await shot("/notes/03-极限的定义/", "D:/Projects/blog/.shots/note03.png", true);
await browser.close();
