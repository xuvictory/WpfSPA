---
title: HashSet 集合
section: 00-prelude
parent: 数组与集合
---

# HashSet 集合

> [!plain] 白话理解
> `HashSet` 是一个"不能存重复东西的袋子"。你往里丢 "PLC-001"、"PLC-002"、"PLC-001"——第二个 "PLC-001" 不会被存进去，袋子里始终只有两个。它最擅长的三件事：**去重**（自动过滤重复数据）、**快速判断是否存在**（比 `List.Contains` 快几千倍）、**集合运算**（交集、并集、差集——就像数学里的集合）。上位机场景：扫描到的新设备自动去重、判断某个告警编码是否已经被处理过、对比新旧配置项列表。

> [!def] 官方定义
> `HashSet<T>` 是 `System.Collections.Generic` 下的泛型哈希集合，存储**不重复**的元素，基于哈希表实现。添加/删除/查找的平均时间复杂度为 O(1)。它实现了 `ISet<T>` 接口，支持数学集合运算（`UnionWith`、`IntersectWith`、`ExceptWith`、`SymmetricExceptWith`）。元素的相等性由 `GetHashCode()` 和 `Equals()` 决定。

> [!origin] 由来背景
> `HashSet<T>` 在 .NET 3.5（2007年）才加入，比 `List<T>`（.NET 2.0）晚了两年。它源于数学的集合论——并集、交集、差集这些运算在上位机数据处理中意外地实用。比如："这轮扫描到的设备ID集合"减去"上轮扫描到的设备ID集合"=新上线的设备。这个需求用 `List` 写需要嵌套循环（O(n²)），用 `HashSet` 的 `ExceptWith` 只要 O(n)。

> [!essentials] 核心要点
> - 元素不重复，添加已有元素静默忽略（返回 `false`）
> - `Add` 返回 `bool`（true=添加成功，false=已存在）
> - 集合运算：`UnionWith`（并集）、`IntersectWith`（交集）、`ExceptWith`（差集）
> - 子集判断：`IsSubsetOf`、`IsSupersetOf`、`Overlaps`
> - 没有索引，不能 `set[0]`，遍历用 `foreach`
> - 默认不保留插入顺序（和 `Dictionary` 类似）

> [!example] 完整示例
> ```csharp
> // ========== 基本用法：自动去重 ==========
> var deviceIds = new HashSet<string>();
> Console.WriteLine($"添加 PLC-001: {deviceIds.Add("PLC-001")}");  // True
> Console.WriteLine($"添加 PLC-002: {deviceIds.Add("PLC-002")}");  // True
> Console.WriteLine($"添加 PLC-001: {deviceIds.Add("PLC-001")}");  // False（重复！）
> Console.WriteLine($"集合: [{string.Join(", ", deviceIds)}]");     // PLC-001, PLC-002

> // ========== 上位机实战：新设备发现 ==========
> var previousScan = new HashSet<string> { "PLC-001", "TEMP-01", "PRES-01" };
> var currentScan  = new HashSet<string> { "PLC-001", "TEMP-01", "VIB-01", "FLOW-01" };

> // 新上线的设备（当前有、上次没有）
> var newDevices = new HashSet<string>(currentScan);
> newDevices.ExceptWith(previousScan);
> Console.WriteLine($"\n新上线设备: [{string.Join(", ", newDevices)}]");  // VIB-01, FLOW-01

> // 已下线的设备（上次有、当前没有）
> var offlineDevices = new HashSet<string>(previousScan);
> offlineDevices.ExceptWith(currentScan);
> Console.WriteLine($"已下线设备: [{string.Join(", ", offlineDevices)}]");  // PRES-01

> // 持续在线的设备（交集）
> previousScan.IntersectWith(currentScan);
> Console.WriteLine($"持续在线: [{string.Join(", ", previousScan)}]");  // PLC-001, TEMP-01

> // ========== 快速查找 ==========
> // 和 List.Contains 对比：List 是 O(n)，HashSet 是 O(1)
> var largeSet = new HashSet<int>(Enumerable.Range(0, 100000));
> Console.WriteLine($"\n包含 50000? {largeSet.Contains(50000)}");     // True（极快）
> Console.WriteLine($"包含 100001? {largeSet.Contains(100001)}");  // False（也极快）

> // ========== 告警编码去重 ==========
> var activeAlarmCodes = new HashSet<int>();
> int[] incomingCodes = { 101, 102, 101, 103, 102, 104, 101 };

> foreach (int code in incomingCodes)
> {
>     if (activeAlarmCodes.Add(code))
>         Console.WriteLine($"  新告警: 编码 {code}");
>     else
>         Console.WriteLine($"  重复告警: 编码 {code}（已忽略）");
> }
> Console.WriteLine($"活动告警总数: {activeAlarmCodes.Count}");
> ```

> [!scene] 适用场景
> ✅ 设备列表去重
> ✅ O(1) 速度的"是否存在"判断
> ✅ 新旧数据对比（差集=新增/删除）
> ✅ 白名单/黑名单校验
> ✅ 已处理记录的快速查重
> ❌ 需要按索引访问 → `List<T>`
> ❌ 键值对映射 → `Dictionary<K,V>`

> [!pitfall] 常见踩坑
> 坑 1：**自定义类做元素需要正确实现 `GetHashCode` 和 `Equals`** → 只重写 `Equals` 没重写 `GetHashCode`，两个"相等"的对象可能被放进同一个 HashSet。
> 坑 2：**集合运算会修改调用者** → `set1.ExceptWith(set2)` 会**原地修改** `set1`！如果要保留原集合，先 `new HashSet<T>(set1)` 拷贝一份再运算。

> [!best] 最佳实践
> - 去重场景优先用 `HashSet`，别用 `List` + `Distinct()`
> - 集合运算始终在副本上做，除非你确定不需要原集合
> - 预估元素数量时传构造函数容量参数
> - 和 `Dictionary` 的区别：只需记"有没有"，不需记"每个对应什么"时用 `HashSet`

> [!practice] 上手练习
> **Lv.1 照猫画虎**：创建 `HashSet<int>`，依次添加 1,2,2,3,3,3，打印最终元素
> **Lv.2 小试牛刀**：模拟两次设备扫描，分别用两个 `HashSet<string>` 存储设备ID，用集合运算找出新上线、已下线、持续在线的设备
> **Lv.3 融会贯通**：实现一个"告警抑制器"——用 `HashSet<int>` 记录已发送的告警编码，同一编码在 5 分钟内不重复发送

> [!related] 相关知识链接
> - ← 前置知识：Dictionary（同样的哈希原理）
> - → 后续必学：LINQ（`Distinct()` 是另一种去重方式）
> - ⇄ 关联概念：`SortedSet<T>`（有序版 HashSet）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.collections.generic.hashset-1
