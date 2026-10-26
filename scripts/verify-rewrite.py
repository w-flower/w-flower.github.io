import os, re, glob

BLOG = r"D:\Projects\blog"
BACKUP = os.path.join(BLOG, ".admin-backup", "rewrite-20261025-181948", "notes")
CUR = os.path.join(BLOG, "src", "content", "notes")

def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()

def body(txt):
    if txt.startswith("---"):
        idx = txt.find("\n---", 3)
        if idx != -1:
            return txt[idx+4:]
    return txt

def math_fragments(txt):
    b = body(txt)
    frags = []
    for m in re.finditer(r"\$\$([\s\S]+?)\$\$", b):
        frags.append(m.group(1))
    tmp = re.sub(r"\$\$[\s\S]+?\$\$", " ", b)
    tmp = tmp.replace("\\$", "\x00")
    for m in re.finditer(r"\$([^$\n]+?)\$", tmp):
        frags.append(m.group(1))
    return frags

def norm(s):
    return re.sub(r"\s+", "", s).replace("\x00", "$")

def significant(f):
    n = norm(f)
    if len(n) < 8:
        return False
    # keep if it looks like real math, not a lone macro
    if re.search(r"[0-9=+\-*/^_\\frac\\sqrt\\lim\\sum\\int\\to\\ge\\le\\alpha\\beta]", n):
        return True
    return False

def examples(txt):
    return len(re.findall(r"例题\s*\d+", body(txt)))

files = sorted(glob.glob(os.path.join(CUR, "*.md")))
problems = 0
for cur in files:
    name = os.path.basename(cur)
    bk = os.path.join(BACKUP, name)
    if not os.path.exists(bk):
        print(f"[SKIP] {name}"); continue
    oc, ob = read(cur), read(bk)
    cf = [norm(f) for f in math_fragments(oc) if significant(f)]
    cb = [norm(f) for f in math_fragments(ob) if significant(f)]
    cur_concat = "".join(cf)
    missing = [f for f in cb if f not in cur_concat]
    ce, be = examples(oc), examples(ob)
    flag = ""
    if missing:
        flag += f"  *** MISSING {len(missing)} SIGNIFICANT FORMULAS"
        problems += 1
    if ce != be:
        flag += f"  EXAMPLES {be}->{ce}"
        problems += 1
    print(f"{name:32s} sig cur={len(cf):3d} bk={len(cb):3d} ex {be}->{ce}{flag}")
    for mm in missing[:12]:
        print("     MISS:", mm[:110])

print("\nPROBLEMS:", problems)
