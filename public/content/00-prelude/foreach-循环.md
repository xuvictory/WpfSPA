---
title: foreach 循环
section: 00-prelude
parent: 流程控制
---

# foreach 循环

> [!plain] 白话理解
> `foreach` 是 C# 中最"佛系"的循环——你不用管索引到哪里了、集合有多长、什么时候该停，你就说"把里面每个东西都给我过一遍"。它把"遍历集合"这个最常见的编程任务简化成了最自然的一句话。上位机中遍历设备列表、传感器数组、告警队列——用 `foreach` 写的代码就是比 `for` 干净，而且不会出现数组越界这种低级错误。

> [!def] 官方定义
> `foreach` 语句用于遍历实现了 `IEnumerable` 或 `IEnumerable<T>` 接口的集合中的每个元素。它为集合中的每个元素执行一次循环体，元素通过只读的迭代变量访问。语法：
> ```
> foreach (var item in collection)
> {
>     // 使用 item（只读，不能修改 item 本身）
> }
> ```
> - 迭代变量是**只读**的：不能 `item = newValue;`
> - C# 7.0+ 可以用 `ref` 修饰：`foreach (ref int item in array)` 获取可写引用
> - 遍历期间不能修改集合（`Add`/`Remove`），否则抛 `InvalidOperationException`

> [!origin] 由来背景
> Java 在 2004 年（Java 5）引入了增强 for 循环 `for (Type item : collection)`，大受欢迎。C# 自然不能落后，2005 年 C# 2.0 推出了 `foreach`。但微软做了更深刻的集成：不仅支持数组和内置集合，任何实现了 `IEnumerable` 接口的类都能被 `foreach`。这在 .NET 中催生了一个庞大的生态——LINQ 查询结果是 `IEnumerable<T>`，数据库查询结果是 `IEnumerable<T>`，一切数据源都可以 `foreach`。上位机开发中，`foreach` 是你在 MVVM 的 `ObservableCollection` 面前最顺手的工具。

> [!essentials] 核心要点
> - 只能用于实现 `IEnumerable` / `IEnumerable<T>` 的类型
> - 迭代变量是只读的，不能赋值（但可以修改引用对象的属性）
> - 遍历期间不能增删集合元素
> - 不需要索引、不需要边界检查——自动安全
> - 编译后等价于 `while + enumerator.MoveNext()` 的模式
> - `foreach` 可以遍历 `string`（每个字符是一个 `char`）
> - `foreach (ref int x in array)` 可以修改数组元素（C# 7.3+）

> [!example] 完整示例
> ```csharp
> // ========== 基本 foreach ==========
> string[] devices = { "PLC-001", "温度变送器", "压力传感器", "变频器" };
> foreach (string device in devices)
> {
>     Console.WriteLine($"  设备: {device}");
> }

> // ========== 遍历 List ==========
> List<double> temperatures = new() { 85.5, 78.2, 92.1, 65.0, 88.8 };
> int alarmCount = 0;
> foreach (double temp in temperatures)
> {
>     if (temp > 80)
>     {
>         Console.WriteLine($"  ⚠ {temp:F1}℃ 超温！");
>         alarmCount++;
>     }
> }
> Console.WriteLine($"超温设备数: {alarmCount}/{temperatures.Count}");

> // ========== 遍历 Dictionary ==========
> Dictionary<string, double> sensorReadings = new()
> {
>     ["温度"] = 85.5,
>     ["湿度"] = 62.3,
>     ["压力"] = 2.1,
>     ["流量"] = 15.7
> };

> // KeyValuePair 访问键和值
> foreach (var kvp in sensorReadings)
> {
>     Console.WriteLine($"  {kvp.Key}: {kvp.Value}");
> }

> // C# 7.0+ 解构语法
> foreach (var (name, value) in sensorReadings)
> {
>     Console.WriteLine($"  {name} = {value}");
> }

> // ========== 遍历字符串（字符级处理） ==========
> string modbusFrame = "0103000000044409";
> Console.Write("Modbus 帧字节: ");
> foreach (char c in modbusFrame)
> {
>     Console.Write($"0x{c} ");
> }
> Console.WriteLine();

> // ========== 上位机实战：遍历告警列表 ==========
> public class AlarmRecord
> {
>     public string DeviceName { get; init; } = "";
>     public string Message { get; init; } = "";
>     public DateTime Time { get; init; }
>     public bool Acknowledged { get; set; }
> }

> List<AlarmRecord> activeAlarms = new()
> {
>     new() { DeviceName = "PLC-001", Message = "温度超限", Time = DateTime.Now.AddMinutes(-5) },
>     new() { DeviceName = "压力传感器", Message = "压力偏高", Time = DateTime.Now.AddMinutes(-2) },
>     new() { DeviceName = "变频器", Message = "通信超时", Time = DateTime.Now },
> };

> Console.WriteLine("\n活动告警列表：");
> Console.WriteLine(new string('-', 50));
> foreach (var alarm in activeAlarms.Where(a => !a.Acknowledged))
> {
>     string age = (DateTime.Now - alarm.Time).TotalMinutes < 1 
>         ? "刚刚" 
>         : $"{(int)(DateTime.Now - alarm.Time).TotalMinutes}分钟前";
    
>     Console.WriteLine($"  [{alarm.Time:HH:mm:ss}] {alarm.DeviceName} - {alarm.Message} ({age})");
> }

> // ========== 修改属性可以，修改迭代变量不行 ==========
> foreach (var alarm in activeAlarms)
> {
>     // alarm = new AlarmRecord(); // ❌ 迭代变量只读，不能赋值
>     alarm.Acknowledged = true;    // ✅ 可以修改引用对象的属性
> }
> Console.WriteLine($"\n已确认 {activeAlarms.Count(a => a.Acknowledged)} 条告警");

> // ========== ref foreach：直接修改集合元素 ==========
> int[] counters = { 1, 2, 3, 4, 5 };
> foreach (ref int counter in counters)
> {
>     counter *= 2;  // ✅ 直接修改数组里的值（C# 7.3+）
> }
> Console.WriteLine($"\n翻倍后: [{string.Join(", ", counters)}]");
> ```

> [!scene] 适用场景
> ✅ 遍历集合/数组/列表（只要顺序遍历，都用 `foreach`）
> ✅ LINQ 查询结果迭代
> ✅ 日志/告警/事件列表的轮询展示
> ✅ 配置文件键值对遍历
> ✅ 读取所有串口名：`foreach (string port in SerialPort.GetPortNames())`
> ❌ 需要索引访问 → `for` 
> ❌ 需要反向遍历 → `for`
> ❌ 需要在遍历中增删集合 → `for` 倒序

> [!pitfall] 常见踩坑
> 坑 1：**`foreach` 中修改集合** → 
> ```csharp
> foreach (var item in list) { if (bad) list.Remove(item); } // 💥 InvalidOperationException!
> ```
> 解决：倒序 `for` 遍历，或用 `list.RemoveAll(item => condition)`，或用 LINQ `Where().ToList()` 创建新集合。
>
> 坑 2：**`foreach` 变量捕获问题（闭包陷阱）** → 
> ```csharp
> var actions = new List<Action>();
> foreach (int i in new[] { 1, 2, 3 })
>     actions.Add(() => Console.WriteLine(i));  // 全是 3！
> // C# 5.0 已修复此问题，但老代码或复杂场景可能碰到
> ```
> C# 5.0 起 `foreach` 的迭代变量在每次迭代中都是新的，已修复此问题。
>
> 坑 3：**遍历 `IEnumerable` 可能多次执行查询** → 
> ```csharp
> var query = sensors.Where(s => s.IsActive); // 延迟执行
> foreach (var s in query) { ... }  // 第一次执行查询
> foreach (var s in query) { ... }  // 又执行一次！
> // 解决：加 .ToList() 固化为具体集合
> ```

> [!best] 最佳实践
> - **能用 `foreach` 就不要用 `for`**——代码更短更安全
> - 遍历期间要删除元素 → `list.RemoveAll(condition)` 一行搞定，别手写循环
> - 需要索引？用 LINQ 的 `Select((item, index) => ...)` 或保持 `for`
> - `foreach` + LINQ 组合拳：`foreach (var device in devices.Where(d => d.IsOnline))`
> - 大型集合的多次遍历用 `.ToList()` 固化，避免重复执行查询
> - 上位机中告警队列的 `foreach` 遍历如果是异步操作，加 `try-catch` 包裹，防止单条异常中断整个遍历

> [!practice] 上手练习
> **Lv.1 照猫画虎**：创建 `List<string>` 存 5 个设备名，用 `foreach` 遍历打印；创建 `Dictionary<string, int>` 存设备名→端口号，用解构语法遍历打印
> **Lv.2 小试牛刀**：用 `foreach` 遍历一个 `List<double>` 温度值列表，统计平均值、最大值、最小值，以及超过 80 的样本数
> **Lv.3 融会贯通**：创建一个"设备树"节点类（含 `Name` 和 `Children` 列表），用递归+`foreach` 实现深度优先遍历，打印完整的设备层级结构

> [!related] 相关知识链接
> - ← 前置知识：for 循环、while 循环（三种循环的使用场景对比）
> - → 后续必学：LINQ（`foreach` + LINQ = 数据处理超能力）
> - → 后续必学：List / Dictionary / ObservableCollection（foreach 遍历的主力集合类型）
> - ⇄ 关联概念：`IEnumerable<T>` 接口与 `yield return`
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/statements/iteration-statements#the-foreach-statement