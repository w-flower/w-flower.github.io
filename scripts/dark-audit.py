# 扫描 global.css：找出「硬编码浅色底 但没有 [data-theme=dark] 覆盖」的选择器
import re, pathlib

P = pathlib.Path(r"D:/Projects/blog/src/styles/global.css")
src = P.read_text(encoding="utf-8")
lines = src.splitlines()

# 抓所有规则块：选择器 + 起始行
rules = []  # (selector, start_idx, end_idx)
i = 0
buf = ""
start = 0
depth = 0
for idx, ln in enumerate(lines):
    if depth == 0 and buf == "":
        start = idx
    depth += ln.count("{") - ln.count("}")
    buf += ln + "\n"
    if depth <= 0 and "{" in buf:
        sel = buf.split("{")[0].strip()
        rules.append((sel, start, idx))
        buf = ""
        depth = 0

WHITE = re.compile(r"background(-color)?\s*:\s*(#fff\b|#ffffff\b|white\b|rgba\(\s*255,\s*255,\s*255,\s*0\.[4-9]\))", re.I)

dark_sels = set()
for sel, s, e in rules:
    if 'data-theme="dark"' in sel or "data-theme='dark'" in sel:
        dark_sels.add(sel)

missing = []
for sel, s, e in rules:
    if 'data-theme="dark"' in sel:
        continue
    body = "\n".join(lines[s:e + 1])
    m = WHITE.search(body)
    if not m:
        continue
    # 该规则里有没有暗色覆盖：查看是否有以 [data-theme="dark"] 开头且包含该选择器主体的规则
    core = sel.strip()
    covered = any(core in d or d.replace('[data-theme="dark"]', "").strip().endswith(core.lstrip(".")) for d in dark_sels)
    # 更稳的判断：暗色规则的选择器里出现本选择器里的第一个类名/标签
    first = re.findall(r"\.([A-Za-z0-9_-]+)", core)
    if first:
        covered = covered or any(
            ('[data-theme="dark"]' in d) and (("." + first[-1]) in d) for d in dark_sels
        )
    if not covered:
        missing.append((s + 1, core[:90], m.group(0)))

out = ["未配暗色覆盖的硬编码浅色底：", ""]
for ln, sel, decl in missing:
    out.append(f"  L{ln}: {sel}   →   {decl}")
out.append("")
out.append(f"合计 {len(missing)} 处")
pathlib.Path(r"D:/Projects/blog/_darkaudit.txt").write_text("\n".join(out), encoding="utf-8")
print("done", len(missing))
