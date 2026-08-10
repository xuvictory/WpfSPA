---
title: LINQ 基础
section: 00-prelude
parent: 数组与集合
---

# LINQ 基础

> [!plain] 白话理解
> LINQ 就是 C# 里"对着一堆数据问问题"的语言。你想知道"哪些设备温度超过 80？"→ `devices.Where(d => d.Temperature > 80)`；"所有设备按温度排序"→ `devices.OrderBy(d => d.Temperature)`；"每个区域各有多少台设备？"→ `devices.GroupBy(d => d.Area)`。以前这些需求要写一堆 `foreach`+`if`+临时列表，现在一行搞定。LINQ 是 C# 程序员从"工匠"进阶到"架构师"的分水岭。

> [!def] 官方定义
> LINQ（Language Integrated Query，语言集成查询）是 C# 3.0（2007年）引入的一组技术，将查询能力直接集成到 C# 语言中。它提供统一的查询语法来操作各种数据源（内存集合、数据库、XML、DataSet）。两种写法等价：
> - 查询语法：`from d in devices where d.Temp > 80 select d.Name`
> - 方法语法（Lambda）：`devices.Where(d => d.Temp > 80).Select(d => d.Name)`
> 
> 所有 LINQ 方法都是 `IEnumerable<T>` 的扩展方法，定义在 `System.Linq` 命名空间。

> [!origin] 由来背景
> 2007年 C# 3.0 引入了三个改变游戏规则的东西：`var`、Lambda 表达式、LINQ。三者合在一起才能工作——`var` 承接匿名类型、Lambda 写简洁的筛选条件。LINQ 的灵感来自 SQL（所以查询语法很像 SQL），但它远远超越了数据库查询——任何实现了 `IEnumerable<T>` 的集合都能用。在上位机中，你几乎每天都在用 LINQ：筛选告警、排序设备、分组统计、投影映射——只是你可能没意识到自己在用 LINQ。

> [!essentials] 核心要点速查表

> | 方法 | 作用 | 示例 |
> |------|------|------|
> | `Where` | 过滤 | `devices.Where(d => d.Temp > 80)` |
> | `Select` | 投影/转换 | `devices.Select(d => d.Name)` |
> | `OrderBy` / `OrderByDescending` | 排序 | `devices.OrderBy(d => d.Temp)` |
> | `First` / `FirstOrDefault` | 取第一个 | `devices.First(d => d.IsOnline)` |
> | `Any` / `All` | 判断是否存在/全部 | `devices.Any(d => d.IsOnline)` |
> | `Count` | 计数 | `devices.Count(d => d.Temp > 80)` |
> | `GroupBy` | 分组 | `devices.GroupBy(d => d.Zone)` |
> | `Sum` / `Average` / `Max` / `Min` | 聚合 | `devices.Average(d => d.Temp)` |
> | `Distinct` | 去重 | `devices.Select(d => d.Zone).Distinct()` |
> | `Skip` / `Take` | 分页 | `devices.Skip(10).Take(10)` |
> | `ToList` / `ToArray` | 转固定集合 | `devices.Where(...).ToList()` |

> [!example] 完整示例
> ```csharp
> // ========== 数据准备 ==========
> var devices = new List<(string Name, string Zone, double Temp, bool Online)>
> {
>     ("PLC-001", "A区", 85.5, true),
>     ("PLC-002", "A区", 78.2, true),
>     ("TEMP-01", "B区", 92.1, false),
>     ("TEMP-02", "B区", 65.0, true),
>     ("PRES-01", "A区", 88.8, true),
>     ("VIB-01",  "C区", 55.5, true),
>     ("VIB-02",  "C区", 45.0, false),
> };

> // 1. Where 过滤：温度 > 80 的设备
> var hotDevices = devices.Where(d => d.Temp > 80);
> Console.WriteLine("高温设备:");
> foreach (var d in hotDevices)
>     Console.WriteLine($"  {d.Name} ({d.Zone}): {d.Temp}℃");

> // 2. Select 投影：只要名称
> var names = devices.Select(d => d.Name);
> Console.WriteLine($"\n所有设备: [{string.Join(", ", names)}]");

> // 3. OrderBy 排序
> var byTemp = devices.OrderByDescending(d => d.Temp);
> Console.WriteLine($"\n按温度排序: 最高={byTemp.First().Name}({byTemp.First().Temp}℃)");

> // 4. Any / All 判断
> Console.WriteLine($"\n有离线设备? {devices.Any(d => !d.Online)}");
> Console.WriteLine($"全部在线? {devices.All(d => d.Online)}");

> // 5. GroupBy 分组统计
> Console.WriteLine("\n按区域统计:");
> var groups = devices.GroupBy(d => d.Zone);
> foreach (var g in groups)
> {
>     double avgTemp = g.Average(d => d.Temp);
>     int onlineCount = g.Count(d => d.Online);
>     Console.WriteLine($"  {g.Key}: {g.Count()}台 | 均温{avgTemp:F1}℃ | 在线{onlineCount}台");
> }

> // 6. 链式组合
> var result = devices
>     .Where(d => d.Online && d.Temp > 60)
>     .OrderByDescending(d => d.Temp)
>     .Select(d => $"{d.Name}({d.Temp:F1}℃)");

> Console.WriteLine($"\n需关注的设备: [{string.Join(", ", result)}]");

> // 7. 分页
> Console.WriteLine($"\n第1页(2条): [{string.Join(", ", devices.Take(2).Select(d=>d.Name))}]");
> Console.WriteLine($"第2页(2条): [{string.Join(", ", devices.Skip(2).Take(2).Select(d=>d.Name))}]");
> ```

> [!scene] 适用场景
> ✅ 集合数据的筛选、排序、投影、分组、聚合
> ✅ 上位机告警过滤、数据统计、报表生成
> ✅ 配置表查询、设备列表搜索
> ❌ 对性能极敏感的热路径（>100万次/秒）→ 手写 for 循环可能更快

> [!pitfall] 常见踩坑
> 坑 1：**LINQ 是延迟执行的** → `var query = devices.Where(...)` 不会立刻执行，在 `foreach` 或 `.ToList()` 时才执行。如果你改了源数据再遍历，结果会不同。
> 坑 2：**多次遍历未固化的 LINQ 查询** → `foreach` 两次同一个 query，会执行两次筛选。解决：`.ToList()` 固化。
> 坑 3：**`First()` 在空集合抛异常** → 不确定有没有时用 `FirstOrDefault()`，然后检查 `null`。

> [!best] 最佳实践
> - 默认用**方法语法**（Lambda），比查询语法更灵活
> - 链式调用每行一个方法，`.Where(...).OrderBy(...)` 各占一行（可读性）
> - 查询结果如果要多次用，加 `.ToList()` 固化
> - `Any()` 比 `Count() > 0` 更高效（找到第一个就返回）
> - 用 `Select` 投影新类型时，匿名类型配合 `var` 刚好

> [!practice] 上手练习
> **Lv.1 照猫画虎**：创建一个 `List<int>`，用 `Where`、`OrderBy`、`Average` 操作
> **Lv.2 小试牛刀**：模拟100条传感器记录（时间+温度+区域），用 LINQ 统计：各区域最高温、日均温、超温次数
> **Lv.3 融会贯通**：用 LINQ 重写你之前的"设备状态检查"逻辑——把所有 for/if 换成 LINQ 表达式链

> [!related] 相关知识链接
> - ← 前置知识：List、数组、Lambda 表达式
> - ⇄ 关联概念：Lambda 表达式（`x => x > 0` 是 LINQ 的燃料）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/csharp/linq/
