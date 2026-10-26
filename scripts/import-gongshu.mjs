// 把「工数笔记博客」目录里的 15 篇笔记导入到本博客的 notes 内容集。
// 处理：① 去掉正文第一行的 # 标题（博客详情页用 frontmatter 的 title 渲染 H1，避免重复）
//       ② 写上 frontmatter：title / date / course(=标签) / status / draft
//       ③ 原样搬正文（数学公式靠 remark-math + rehype-katex 在构建期渲染）
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const SRC = "C:/Users/Lenovo/WorkBuddy/2026-10-21-22-05-19/工数笔记博客";
const DST = "D:/Projects/blog/src/content/notes";

// 文件名 -> 发布日期（按章节顺序，保证列表里按章节排，且都是近期，置顶）
const dates = {
  "01-集合与确界": "2026-10-08",
  "02-映射与函数": "2026-10-09",
  "03-极限的定义": "2026-10-10",
  "04-数列极限与Heine定理": "2026-10-11",
  "05-极限运算与渐近线": "2026-10-12",
  "06-极限五大性质": "2026-10-13",
  "07-夹逼三板斧": "2026-10-14",
  "08-数列收敛三大判定": "2026-10-15",
  "09-两个重要极限": "2026-10-16",
  "10-无穷大与无穷小": "2026-10-17",
  "11-连续与间断点": "2026-10-18",
  "12-闭区间连续函数三大定理": "2026-10-19",
  "13-一致连续": "2026-10-20",
  "附录A-三角函数速查": "2026-10-21",
  "附录B-可导必连续": "2026-10-21",
};

const course = "工科数学分析";
const files = Object.keys(dates);

// 把单行的 `$$...$$` 块级公式改写成多行写法（$$ 单独成行），
// 这样 remark-math 才会按块级公式渲染（居中、独立成行）。
function fixDisplayMath(body) {
  return body
    .split(/\r?\n/)
    .map((line) => {
      const trimmed = line.trim();
      const opens = (trimmed.match(/\$\$/g) || []).length;
      // 只有「整行就是 $$内容$$」才处理；已经是多行块的 $$ 单独行不动。
      if (opens === 2) {
        const m = trimmed.match(/^\$\$(.+)\$\$$/);
        if (m) return `$$\n${m[1]}\n$$`;
      }
      return line;
    })
    .join("\n");
}

// 在「数学区间」（$...$ 行内 / $$...$$ 块级）内，把未转义的竖线 `|`
// 转成 `\|`，避免 GFM 表格把 `|` 当成列分隔符。已经写成 `\|` 的保持不动。
function escapePipesInMath(body) {
  let out = "";
  let inMath = false;
  let prev = "";
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === "$") {
      out += "$";
      inMath = !inMath;
      prev = "$";
    } else if (ch === "|" && inMath) {
      if (prev === "\\") {
        out += "|"; // 已经是 \| ，保持不变
      } else {
        out += "\\|";
      }
      prev = "|";
    } else {
      out += ch;
      prev = ch;
    }
  }
  return out;
}

if (!existsSync(DST)) mkdirSync(DST, { recursive: true });

let count = 0;
for (const base of files) {
  const srcPath = join(SRC, base + ".md");
  const raw = readFileSync(srcPath, "utf8");

  // 取第一行 # 标题作为 title（去掉前导 # 和空白）
  const lines = raw.split(/\r?\n/);
  let i = 0;
  while (i < lines.length && lines[i].trim() === "") i++;
  let title = base;
  if (i < lines.length && /^#\s+/.test(lines[i])) {
    title = lines[i].replace(/^#\s+/, "").trim();
    i++; // 跳过这一行
  }
  // 跳过标题后可能的空行
  while (i < lines.length && lines[i].trim() === "") i++;
  let body = lines.slice(i).join("\n").replace(/\s+$/, "");

  // 修正块级公式：工数笔记里写的是单行 `$$...$$`，但 remark-math 只有
  // `$$` 独占一行才当块级（居中、独立成行）。把单行 `$$...$$` 拆成多行写法，
  // 否则会被当成行内公式，块级公式就挤在正文中、也不居中。
  body = fixDisplayMath(body);

  // 修正表格里的公式：GFM 表格单元格内若出现未转义的竖线 `|`（绝对值/范数），
  // 会被当成「列分隔符」把单元格劈成多列，导致该单元格的 `$...$` 公式无法被
  // remark-math 解析（页面残留裸 `$`）。这里在「数学区间内」把未转义的 `|`
  // 转成 `\|`，GFM 就不会误拆列，remark-math 照常渲染。表格真正的列分隔符
  // 在 `$` 之外，不会被误伤。
  body = escapePipesInMath(body);

  const date = dates[base];
  // 标题用单引号包，内部单引号翻倍即可；避免标题里的 ASCII 双引号破坏 YAML。
  const safeTitle = title.replace(/'/g, "''");
  const fm = [
    "---",
    `title: '${safeTitle}'`,
    `date: ${date}`,
    `course: '${course}'`,
    `status: growing`,
    `draft: false`,
    "---",
    "",
  ].join("\n");

  const out = fm + body + "\n";
  const dstPath = join(DST, base + ".md");
  writeFileSync(dstPath, out, "utf8");
  count++;
  console.log(`✓ ${base}  ->  title="${title}"  date=${date}`);
}
console.log(`\n导入完成：${count} 篇 -> ${DST}`);
