import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";

const root = path.resolve(import.meta.dirname, "..");

const GIT_CANDIDATES = [
  "git",
  "C:/Users/Lenovo/.workbuddy/binaries/PortableGit/versions/1.2.0/cmd/git.exe",
];

function findGit() {
  for (const exe of GIT_CANDIDATES) {
    try {
      execFileSync(exe, ["--version"], { stdio: "ignore" });
      return exe;
    } catch {
      /* try next */
    }
  }
  return null;
}

const run = (git, args) =>
  execFileSync(git, args, { cwd: root, encoding: "utf8" }).trim();

const git = findGit();
if (!git) {
  console.error("[X] 找不到 git。告诉我，我来修。");
  process.exit(1);
}

const status = run(git, ["status", "--porcelain"]);
if (!status) {
  console.log("[=] 没有新改动，不需要提交。");
  process.exit(0);
}

const changed = status.split("\n").length;
const now = new Date();
const pad = (n) => String(n).padStart(2, "0");
const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

run(git, ["add", "-A"]);
const commit = spawnSync(
  git,
  ["-c", "user.name=DHua", "-c", "user.email=dhua@local", "commit", "-m", `update: ${stamp}`],
  { cwd: root, encoding: "utf8" }
);

if (commit.status !== 0) {
  console.error("[X] 提交失败：\n" + (commit.stderr || commit.stdout));
  process.exit(1);
}

console.log(`[OK] 已存档 ${changed} 个文件改动  (${stamp})`);
console.log("");
console.log("最近的存档：");
console.log(run(git, ["log", "--oneline", "-5"]));
console.log("");
console.log("注意：这只是本地存档，没有推到云端。GitHub 通了以后再同步。");
