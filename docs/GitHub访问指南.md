# GitHub 访问问题：原因与解决办法

> 结论先给：**你的 GitHub 打不开，是网络层面被干扰了，不是你的电脑或 GitHub 帐号有问题。**
> 日常最省事的组合：**下载文件用镜像前缀 + clone 用 gitclone.com 镜像 + DNS 换 223.5.5.5**。大文件 clone 卡死用「浅克隆」。

---

## 一、为什么会打不开

| 原因 | 一句话解释 |
|------|-----------|
| **DNS 污染** | 你问"github.com 的 IP 是多少"，被劫持返回一个假/坏 IP，于是连不上 |
| **连接被重置 / 超时** | IP 是对的，但数据包在半路被丢弃或重置（GFW 干扰），表现为转圈卡死 |
| **限速** | 能连上但极慢，大文件下载到一半断掉、0 字节 |
| **单连接被掐** | git clone 走 HTTP/2 单连接拉大仓库，连接质量差时整个 clone 卡死 |

---

## 二、解决办法（按省事程度排）

### 1. 下载文件 / Release：加镜像前缀（最省事）

把 GitHub 链接前面拼上镜像前缀，直接用：

```
https://gh-proxy.com/https://github.com/用户名/仓库名/archive/refs/heads/main.zip
https://ghproxy.net/https://github.com/用户名/仓库名/releases/download/v1.0/文件.zip
```

当前可用（2026-10 核实）：`gh-proxy.com`、`ghproxy.net`、`ghproxy.homeboyc.cn`（1GB+ 大文件稳）、`github.akams.cn`。

### 2. 浏览网页：换域名

把 `github.com` 换成镜像域名即可在线浏览仓库：

```
https://bgithub.xyz/用户名/仓库名
https://kkgithub.com/用户名/仓库名
```

### 3. git clone 加速：一次配置，永久生效

```bash
# 配置全局镜像（所有 clone 自动走加速）
git config --global url."https://gitclone.com/github.com/".insteadOf "https://github.com/"

# 恢复官方源（需要时执行）
git config --global --unset url."https://gitclone.com/github.com/".insteadOf
```

### 4. 换 DNS（治 DNS 污染）

Windows：设置 → 网络和 Internet → 以太网/WLAN → DNS 服务器，改成：
- 首选 `223.5.5.5`（阿里）
- 备用 `119.29.29.29`（腾讯）

### 5. 大文件 clone 卡死 / 0 字节：浅克隆

```bash
# 只要最新代码，不要历史（速度快几倍到几十倍）
git clone --depth 1 https://github.com/用户名/仓库名.git

# 已经 clone 卡住的，先 Ctrl+C，再浅克隆
```

### 6. 注意事项（重要）

- **不要在走第三方代理时登录 GitHub 帐号**（不填 Token/Cookie），代理只用来下公开资源；
- 公益镜像有带宽限制，批量、超大文件容易被限流，换一个镜像站点即可；
- 镜像站点时效性强，某个挂了就换列表里的另一个（CSDN 搜"github 镜像站 2026"能拿到最新列表）；
- `winget` 这类系统工具走 GitHub 源也会卡死，让它走镜像要单独配（一般直接手动下载安装包更快）。

---

## 三、给大一学生的最省事组合

1. DNS 改成 `223.5.5.5`（一次配置）；
2. 平时下载文件，链接前加 `https://gh-proxy.com/`；
3. 平时 clone 仓库，配置一次 `gitclone.com` 全局镜像；
4. 真的大仓库，加 `--depth 1`。

这套组合不碰任何"翻墙"软件，纯镜像 + DNS，稳定且合规。
