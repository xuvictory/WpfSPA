---
title: Dictionary 字典
section: 00-prelude
parent: 数组与集合
---

# Dictionary 字典

> [!plain] 白话理解
> `Dictionary` 是一个"查字典"的集合——你给它一个"字"（键），它嗖地一下告诉你"意思"（值）。不像 `List` 需要从头到尾一个个找，`Dictionary` 内部有一张哈希表，直接跳到你想要的位置。比如你知道设备编号 `"PLC-001"`，想拿它的配置，直接 `config["PLC-001"]` 就行了，不管字典里有一千个还是一万个设备，查找速度几乎一样快。上位机中最经典的场景：设备ID→设备对象、Modbus地址→寄存器值、配置项名→配置值。

> [!def] 官方定义
> `Dictionary<TKey, TValue>` 是 `System.Collections.Generic` 命名空间下的泛型哈希表集合，基于键（Key）快速查找值（Value）。内部使用哈希桶数组实现，平均查找/插入/删除时间复杂度为 O(1)。要求 `TKey` 类型正确实现 `GetHashCode()` 和 `Equals()` 方法，且键在字典中唯一。常用操作：索引器 `[key]`、`Add(key, value)`、`TryGetValue(key, out value)`、`ContainsKey(key)`、`Remove(key)`。

> [!origin] 由来背景
> 哈希表（Hash Table）是 1953 年就出现的数据结构，但直到 .NET 1.0 的 `Hashtable` 还是有两大痛点：键和值都是 `object` 类型（每次取用都要强制转换），值类型键/值会导致装箱。C# 2.0 的 `Dictionary<TKey, TValue>` 用泛型彻底解决。但 `Dictionary` 有个需要注意的设计细节：它的 `[key]` 索引器在键不存在时会**抛异常**而不是返回 `null`——这和很多其他语言的字典行为不同。所以安全访问应该用 `TryGetValue`。上位机开发中，从配置表（JSON/XML）解析出来的数据几乎都会落到 `Dictionary` 中。

> [!essentials] 核心要点
> - 声明：`var dict = new Dictionary<string, int>();`
> - 添加：`dict["key"] = value;` 或 `dict.Add("key", value);`（重复 Add 抛异常）
> - 安全获取：`dict.TryGetValue("key", out int value);`
> - 键存在检查：`dict.ContainsKey("key")`
> - 遍历：`foreach (var kvp in dict)` 或 `foreach (var (k, v) in dict)`（解构）
> - 删除：`dict.Remove("key")`
> - 所有键/值：`dict.Keys` / `dict.Values`

> [!example] 完整示例
> ```csharp
> // ========== 基本操作 ==========
> var sensorMap = new Dictionary<string, double>
> {
>     ["温度"] = 85.5,
>     ["湿度"] = 62.3,
>     ["压力"] = 2.1
> };

> // 索引器访问（键不存在会抛 KeyNotFoundException！）
> Console.WriteLine($"温度: {sensorMap["温度"]}℃");

> // 安全访问（推荐）
> if (sensorMap.TryGetValue("流量", out double flow))
>     Console.WriteLine($"流量: {flow}");
> else
>     Console.WriteLine("流量传感器未配置");

> // ContainsKey
> string key = "振动";
> if (sensorMap.ContainsKey(key))
>     Console.WriteLine("振动传感器已配置");

> // ========== 上位机实战：Modbus 寄存器映射 ==========
> // 地址 → 值 + 描述
> var registerMap = new Dictionary<ushort, (ushort Value, string Description)>();
> registerMap[40001] = (1023, "温度ADC");
> registerMap[40002] = (512, "压力ADC");
> registerMap[40003] = (768, "流量ADC");
> registerMap[40004] = (256, "液位ADC");

> ushort queryAddr = 40002;
> if (registerMap.TryGetValue(queryAddr, out var reg))
>     Console.WriteLine($"\n寄存器 {queryAddr}: 值={reg.Value}, 描述={reg.Description}");

> // ========== 设备配置字典 ==========
> public class DeviceConfig
> {
>     public string IpAddress { get; init; } = "";
>     public int Port { get; init; }
>     public string Protocol { get; init; } = "";
> }

> var deviceConfigs = new Dictionary<string, DeviceConfig>
> {
>     ["PLC-001"] = new() { IpAddress = "192.168.1.100", Port = 502, Protocol = "Modbus TCP" },
>     ["PLC-002"] = new() { IpAddress = "192.168.1.101", Port = 502, Protocol = "Modbus TCP" },
>     ["TEMP-01"] = new() { IpAddress = "192.168.2.10",  Port = 102, Protocol = "S7" },
> };

> Console.WriteLine("\n设备配置表:");
> Console.WriteLine($"{"设备ID",-10} {"IP",-16} {"端口",-6} {"协议"}");
> Console.WriteLine(new string('-', 45));
> foreach (var (id, cfg) in deviceConfigs)
> {
>     Console.WriteLine($"{id,-10} {cfg.IpAddress,-16} {cfg.Port,-6} {cfg.Protocol}");
> }

> // ========== 查不到时的优雅处理 ==========
> string targetDevice = "PLC-003";  // 不存在的设备

> DeviceConfig? found = deviceConfigs.TryGetValue(targetDevice, out var config) 
>     ? config 
>     : null;

> if (found == null)
>     Console.WriteLine($"\n设备 '{targetDevice}' 未注册，使用默认配置");

> // ========== Dictionary 转 List ==========
> var onlineDevices = deviceConfigs
>     .Where(kvp => kvp.Value.Port > 100)
>     .Select(kvp => kvp.Key)
>     .ToList();
> Console.WriteLine($"\n高端口设备: [{string.Join(", ", onlineDevices)}]");

> // ========== 统计与聚合 ==========
> var alarmCountByLevel = new Dictionary<string, int>
> {
>     ["ERROR"] = 5,
>     ["WARNING"] = 12,
>     ["INFO"] = 100
> };

> foreach (var (level, count) in alarmCountByLevel)
>     Console.WriteLine($"{level}: {count}条");

> Console.WriteLine($"总告警: {alarmCountByLevel.Values.Sum()}条");
> ```

> [!scene] 适用场景
> ✅ 设备ID→配置、名称→对象映射（上位机最常用模式）
> ✅ Modbus/OPC 地址→缓存值映射
> ✅ 配置项名→配置值的键值对存储
> ✅ 统计计数（如各告警级别出现次数）
> ✅ 去重查找、缓存
> ❌ 只要按顺序遍历 → `List<T>`
> ❌ 键需要排序 → `SortedDictionary<K,V>`
> ❌ 自定义对象的键要确保 `GetHashCode` 正确实现

> [!pitfall] 常见踩坑
> 坑 1：**直接 `dict[key]` 访问不存在的键会炸** → `var x = dict["nonexistent"];` ❌ `KeyNotFoundException`。**永远**在不确定键存在时用 `TryGetValue`。
>
> 坑 2：**用可变对象做 Key** → 
> ```csharp
> var key = new List<int> { 1, 2 };
> dict[key] = "hello";
> key.Add(3);
> var result = dict[key]; // ❌ 可能找不到！哈希码变了
> ```
> 字典的键必须是**不可变**的，或者至少哈希码在作为键使用期间不能变。
>
> 坑 3：**`Add` 重复键抛异常** → `dict.Add("key", 1); dict.Add("key", 2);` ❌ `ArgumentException`。用 `dict["key"] = 2;` 会覆盖，不知道键存不存在时用 `if (!ContainsKey) Add else 更新`。

> [!best] 最佳实践
> - 获取值默认 `TryGetValue`，确定键存在时才能用索引器
> - C# 集合表达式初始化：`new Dictionary<string,int> { ["a"] = 1, ["b"] = 2 };`
> - 枚举类型做键时，考虑用 `Enum.GetValues` 预填充所有键
> - 配置加载后转 `Dictionary`，内存中快速查找
> - 需要线程安全的字典用 `ConcurrentDictionary`
> - 大量预知数据的字典，构造函数指定容量：`new Dictionary<string,int>(expectedCount)`

> [!practice] 上手练习
> **Lv.1 照猫画虎**：创建 `Dictionary<string, string>` 存国家→首都映射，添加5条，用 `TryGetValue` 查"日本"和"火星"
> **Lv.2 小试牛刀**：用 `Dictionary<ushort, double>` 模拟 Modbus 寄存器缓存，实现 `WriteRegister(addr, value)` 和 `TryReadRegister(addr, out value)` 两个方法
> **Lv.3 融会贯通**：实现一个"设备配置管理器"——从 JSON 加载设备配置到 `Dictionary<string, DeviceConfig>`，支持按设备ID查询、按协议类型分组统计、按IP段筛选

> [!related] 相关知识链接
> - ← 前置知识：List 泛型集合（顺序集合 vs 键值集合的选择）
> - → 后续必学：HashSet（只关心键不关心值的场景）
> - ⇄ 关联概念：`IEqualityComparer<T>`（自定义键比较规则）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.collections.generic.dictionary-2
