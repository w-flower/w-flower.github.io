---
title: 用 std::optional 代替"找不到就返回 nullptr"
date: 2026-10-21
std: c++17
run: https://godbolt.org/z/xxxxxxxxxx
tags: [cpp, modern-cpp]
draft: false
---

## 解决什么

"可能没有结果"的查询，以前习惯返回指针，让调用方判空。问题是判空这一步**编译器不会强制**，忘了判就是空指针解引用。

`std::optional<T>` 把这个可能性写进类型里，值要么有、要么没有，取之前必须显式检查。

```cpp
#include <optional>
#include <string>
#include <vector>

std::optional<std::string> find_user(const std::vector<std::string>& db,
                                     const std::string& name) {
  for (const auto& u : db)
    if (u == name) return u;
  return std::nullopt;      // 明确表达"没有"
}

int main() {
  std::vector<std::string> db{"alice", "bob"};
  if (auto u = find_user(db, "carol")) {
    return u->size();       // 有值才能取
  }
  return 0;                 // 没值走这里，不会崩
}
```

## 坑在哪

**`optional<T>` 不是指针，别写 `*opt` 就以为安全。** `operator*` 在空 optional 上是未定义行为，跟解引用空指针一样崩。要先 `if (opt)` 或 `opt.has_value()`。

**引用不能被 optional 包。** `std::optional<int&>` 编译不过，标准不允许。想表达"可能没有的引用"，用指针或者 `std::reference_wrapper`。

**别用 `optional` 传错误信息。** 它只能表达"有/无"，表达不了"为什么没有"。要错误详情就上 `std::expected`（C++23）或者 `variant<T, Error>`。

**`optional<T>` 有额外空间开销。** 通常是一个 bool 加若干个填充字节，别塞进对内存敏感的结构里。

## 什么时候别用

- 容器里存"可能为空"的元素 —— 用 `optional` 会让容器里出现"存在但为空"的元素，语义混乱，不如直接不存
- 函数本来就不可能失败 —— 别为了统一风格乱加
- 需要区分多种失败原因 —— 那是 `expected` 的活
