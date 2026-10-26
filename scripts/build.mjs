// 构建重试：先彻底删 dist，再跑 astro build，直到 pages 出来为止
// 用途：绕开本机 KaTeX 字体 rename 被锁导致的偶发 EPERM/SIGTERM
import { rmSync, existsSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const ROOT = "D:/Projects/blog";
const dist = ROOT + "/dist";
const log = [];

for (let i = 1; i <= 8; i++) {
  try {
    if (existsSync(dist)) {
      rmSync(dist, { recursive: true, force: true, maxRetries: 8, retryDelay: 400 });
    }
  } catch (e) {
    log.push(`attempt ${i} del-fail: ${e.message}`);
  }

  const r = spawnSync(process.execPath, ["node_modules/astro/bin/astro.mjs", "build"], {
    cwd: ROOT,
    env: { ...process.env, CODEBUDDY_SAFE_DELETE_ENABLED: "0" },
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });

  const out = (r.stdout || "") + (r.stderr || "");
  const m = out.match(/(\d+)\s*page\(s\)\s*built/);
  log.push(`attempt ${i}: status=${r.status} signal=${r.signal} pages=${m ? m[1] : "?"}`);
  writeFileSync(`${ROOT}/_b_try${i}.log`, out);

  if (r.status === 0 && m) {
    log.push(`SUCCESS on attempt ${i}`);
    break;
  }
}

writeFileSync(`${ROOT}/_retry_result.txt`, log.join("\n"), "utf8");
console.log(log.join("\n"));
