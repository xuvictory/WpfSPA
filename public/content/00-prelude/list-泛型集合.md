---
title: List 泛型集合
section: 00-prelude
parent: 数组与集合
---

# List 泛型集合

> [!plain] 白话理解
> 数组是"刚入住就砌死的隔间"——大小定死了就不能变。`List<T>` 是"弹性隔间"——你想加多少就加多少，它能自己扩容。你在窗体上点"添加设备"，`List<Device>` 里就多一条；点"删除"就少一条。它是你在 C# 中用到的最多的集合类型——没有之一。上至设备列表、告警队列、日志缓存，下至方法参数批量处理，`List<T>` 无处不在。

> [!def] 官方定义
> `List<T>` 是 `System.Collections.Generic` 命名空间下的泛型动态数组类，实现了 `IList<T>`、`ICollection<T>`、`IEnumerable<T>` 等接口。内部基于数组实现，初始容量为 4，添加元素超出容量时自动扩容（当前容量的 2 倍）。提供按索引访问（O(1)）、尾部添加（摊销 O(1)）、中间插入/删除（O(n)）、查找（O(n)）、排序（O(n log n)）等操作。

> [!origin] 由来背景
> 在 .NET 1.0/1.1 时代，动态列表用的是 `ArrayList`——一个存 `object` 的集合。每次取值都要强制转换，每次放值类型都要装箱。2005年 C# 2.0 引入泛型后，`List<T>` 取代了 `ArrayList`——类型安全 + 避免装箱 + 更好的 API。`ArrayList` 就此成为遗产，任何一个现代 .NET 项目中都不应该出现它。上位机开发者最常写的代码模式：`var devices = new List<DeviceConfig>();` 然后循环 `devices.Add(...)`。

> [!essentials] 核心要点
> - 声明：`var list = new List<int>();` 或 `new List<int> { 1, 2, 3 };`
> - 添加：`Add(item)` 尾部追加、`AddRange(collection)` 批量追加
> - 删除：`Remove(item)` 删第一个匹配、`RemoveAt(index)`、`RemoveAll(predicate)`
> - 查找：`Contains(item)`、`IndexOf(item)`、`Find(predicate)`、`FindAll(predicate)`
> - 容量：`Capacity`（缓冲区大小）、`Count`（实际元素数）、`TrimExcess()` 释放多余容量
> - 排序：`Sort()`、`Sort(comparison)`、`Reverse()`
> - 索引访问：`list[0]`（O(1)）、赋值 `list[0] = value`
> - `foreach` 遍历，也可以用 `for (int i = 0; i < list.Count; i++)`

> [!example] 完整示例
> ```csharp
> // ========== 基本操作 ==========
> var devices = new List<string>();
> devices.Add("PLC-001");
> devices.Add("温度变送器");
> devices.Add("压力传感器");
> devices.Insert(1, "流量计");  // 插到索引1位置
> Console.WriteLine($"设备列表: [{string.Join(", ", devices)}]");

> devices.Remove("压力传感器");      // 按内容删除
> devices.RemoveAt(0);                // 按索引删除
> Console.WriteLine($"删除后: [{string.Join(", ", devices)}]");

> // ========== 上位机实战：设备管理器 ==========
> public class DeviceInfo
> {
>     public string Id { get; init; } = "";
>     public string Name { get; init; } = "";
>     public bool IsOnline { get; set; }
>     public double Temperature { get; set; }
    
>     public override string ToString() => $"{Id}({Name})";
> }

> var deviceList = new List<DeviceInfo>
> {
>     new() { Id = "PLC-001", Name = "主控PLC", IsOnline = true, Temperature = 85.5 },
>     new() { Id = "TEMP-01", Name = "温度变送器", IsOnline = true, Temperature = 62.0 },
>     new() { Id = "PRES-01", Name = "压力传感器", IsOnline = false, Temperature = 23.0 },
>     new() { Id = "VIB-01",  Name = "振动传感器", IsOnline = true, Temperature = 45.0 },
> };

> // Find 查找第一个匹配
> var alarmDevice = deviceList.Find(d => d.Temperature > 80);
> Console.WriteLine($"\n告警设备: {alarmDevice}");

> // FindAll 查找所有
> var onlineDevices = deviceList.FindAll(d => d.IsOnline);
> Console.WriteLine($"在线设备: {onlineDevices.Count}台 → [{string.Join(", ", onlineDevices)}]");

> // RemoveAll 批量删除
> int removed = deviceList.RemoveAll(d => !d.IsOnline);
> Console.WriteLine($"移除了 {removed} 台离线设备，剩余 {deviceList.Count} 台");

> // Sort 排序
> deviceList.Sort((a, b) => a.Temperature.CompareTo(b.Temperature));
> Console.WriteLine("\n按温度排序:");
> deviceList.ForEach(d => Console.WriteLine($"  {d.Name}: {d.Temperature}℃"));

> // ========== AddRange 批量添加 ==========
> var alarmLog = new List<string>();
> for (int i = 0; i < 3; i++)
>     alarmLog.Add($"告警 #{i + 1}");

> // 批量追加
> var newAlarms = new[] { "通信超时", "温度恢复", "手动确认" };
> alarmLog.AddRange(newAlarms);
> Console.WriteLine($"\n告警日志 ({alarmLog.Count}条):");
> alarmLog.ForEach(Console.WriteLine);

> // ========== 转换与映射 ==========
> // Select 映射（LINQ）→ 转 List
> var temperatureReadings = deviceList.Select(d => d.Temperature).ToList();
> Console.WriteLine($"\n温度读数: [{string.Join(", ", temperatureReadings)}]");

> // 转数组
> DeviceInfo[] deviceArray = deviceList.ToArray();
> ```

> [!scene] 适用场景
> ✅ 元素数量动态变化的集合（设备列表、告警队列、日志缓冲区）
> ✅ 需要频繁按索引访问（O(1)）
> ✅ LINQ 查询的最终结果固化（`.ToList()`）
> ✅ 批量数据处理（排序、过滤、分组后存储）
> ❌ 只做键值查询 → `Dictionary<K,V>`
> ❌ 频繁在头部/中间插入删除 → `LinkedList<T>` 或 `Queue<T>`/`Stack<T>`

> [!pitfall] 常见踩坑
> 坑 1：**`foreach` 中不能删除** → `foreach (var d in list) { if (bad) list.Remove(d); }` ❌ `InvalidOperationException`。用 `list.RemoveAll(d => bad)` 或倒序 `for` 遍历。
>
> 坑 2：**`List<T>` 是引用类型，方法间传递的是引用** → `ModifyList(list);` 会修改原列表内容。如果你不想让调用方修改，用 `.AsReadOnly()` 返回 `ReadOnlyCollection<T>` 或者在传参前 `.ToList()` 拷贝一份。
>
> 坑 3：**`Capacity` 和 `Count` 混淆** → `new List<int>(100)` 是预分配 100 的容量但 `Count` 是 0！你不能 `list[0] = 1`。容量只是内部缓冲区的大小，不改变逻辑元素数。

> [!best] 最佳实践
> - 预知大概元素数量时，构造函数传入容量：`new List<DeviceInfo>(expectedCount)` 避免多次扩容
> - `foreach` 中过滤后批量删除用 `RemoveAll`，一行搞定
> - `ForEach(Action)` 方法可用但不够灵活，LINQ 的 `Select` + `foreach` 更通用
> - 不需要修改的列表返回 `IReadOnlyList<T>` 或 `.AsReadOnly()` 
> - C# 12 集合表达式：`List<int> list = [1, 2, 3];` 更简洁
> - 上位机中避免在高速循环里用 `list.Contains()`（O(n)），如有需要换成 `HashSet<T>`

> [!practice] 上手练习
> **Lv.1 照猫画虎**：创建 `List<int>`，依次执行 `Add`、`Insert`、`Remove`、`AddRange` 操作，打印每次操作后的 `Count`
> **Lv.2 小试牛刀**：创建 `List<AlarmRecord>`（时间+等级+消息），添加 10 条模拟告警，用 `FindAll` 过滤出 ERROR 级别的，用 `Sort` 按时间倒序排列
> **Lv.3 融会贯通**：实现一个设备轮询调度器——用 `List<DeviceInfo>` 管理设备，提供 `AddDevice`/`RemoveDevice`/`GetNextDevice`（循环轮询），支持根据设备优先级排序

> [!related] 相关知识链接
> - ← 前置知识：数组（固定大小 vs 动态大小的对比）
> - → 后续必学：Dictionary（键值对集合，替代按条件查找 List）
> - → 后续必学：LINQ（`Select`/`Where`/`ToList` 是 List 操作的最佳拍档）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.collections.generic.list-1
