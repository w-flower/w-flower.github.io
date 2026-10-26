/**
 * ============================================================
 *  一键部署到 GitHub Pages
 * ------------------------------------------------------------
 *  用法：  node scripts/deploy.mjs
 *
 *  做的事：
 *    1. 构建站点（astro build）
 *    2. 在系统临时目录里维护一份 GitHub Pages 仓库的克隆
 *       （远端 master = 构建产物，src 分支 = 源码）
 *    3. 用新的 dist 覆盖克隆内容，提交并推送到 master
 *
 *  为什么 master 放构建产物而不是源码：
 *    w-flower.github.io 的 Pages 设置为「从 master 分支根目录发布」，
 *    直接推源码会把站点变成一堆 .ts/.astro 文件。所以 master 只放 dist，
 *    源码另存在 src 分支（`git push ... master:src`）。
 *
 *  依赖：本机已配置 SSH 访问 GitHub（key 已注册）。
 * ============================================================
 */
import { execSync } from "node:child_process";
import { existsSync, rmSync, cpSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const REMOTE = process.env.PUBLISH_REPO || "git@github.com:w-flower/w-flower.github.io.git";
const BRANCH = process.env.PUBLISH_BRANCH || "master";
const CLONE = path.join(tmpdir(), "dhua-pages-deploy");

const sh = (cmd, cwd = ROOT) => {
  console.log("» " + cmd);
  execSync(cmd, { cwd, stdio: "inherit", env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } });
};

// 1) 构建
console.log("\n[1/4] 构建站点…");
sh("node node_modules/astro/bin/astro.mjs build");
if (!existsSync(path.join(DIST, "index.html"))) throw new Error("构建产物缺失 dist/index.html");

// 2) 准备远端克隆
console.log("\n[2/4] 准备部署克隆…");
if (!existsSync(path.join(CLONE, ".git"))) {
  rmSync(CLONE, { recursive: true, force: true });
  sh(`git clone --depth 1 --branch ${BRANCH} "${REMOTE}" "${CLONE}"`, ROOT);
}
sh("git fetch --depth 1 origin " + BRANCH, CLONE);
sh("git reset --hard origin/" + BRANCH, CLONE);

// 3) 用 dist 覆盖（保留 .git）
console.log("\n[3/4] 覆盖为最新构建产物…");
for (const name of readdirSync(CLONE)) {
  if (name === ".git") continue;
  rmSync(path.join(CLONE, name), { recursive: true, force: true });
}
for (const name of readdirSync(DIST)) {
  cpSync(path.join(DIST, name), path.join(CLONE, name), { recursive: true, force: true });
}

// 4) 提交并推送
console.log("\n[4/4] 提交并推送…");
sh("git add -A", CLONE);
let dirty = true;
try { execSync("git diff --cached --quiet", { cwd: CLONE }); dirty = false; } catch { dirty = true; }
if (!dirty) {
  console.log("没有变化，跳过提交。");
} else {
  const msg = "deploy: " + new Date().toISOString().slice(0, 16).replace("T", " ");
  sh(`git -c user.name="w-flower" -c user.email="63999937+w-flower@users.noreply.github.com" commit -m "${msg}"`, CLONE);
  sh("git push origin " + BRANCH, CLONE);
  console.log("\n✅ 已推送。GitHub Pages 约 1 分钟后重建：https://w-flower.github.io/");
}
