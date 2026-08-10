---
title: var 类型推断
section: 00-prelude
parent: 变量与数据类型
---

# var 类型推断

> [!plain] 白话理解
> `var` 是 C# 里那个"你说什么就是什么"的关键字——你写 `var x = 10;`，编译器一看右边是个 `int`，就自动把 `x` 定为 `int` 类型。它不是"无类型"（别跟 JavaScript 的 `var` 搞混），而是"编译器帮你推断类型"。就像你在餐厅说"来杯喝的"，服务员看你指着可乐，就给你上可乐——你没有说"可乐"两个字，但结果和点名要可乐完全一样。

> [!def] 官方定义
> `var` 是 C# 的**隐式类型局部变量**声明关键字。编译器在编译时根据赋值表达式的右侧推断出变量的确切类型，这个过程叫**类型推断（Type Inference）**。推断出的类型在编译后就是确定的，不能再改变。`var` 是编译期语法糖，不影响运行时性能，生成的 IL 代码与显式声明类型完全相同。

> [!origin] 由来背景
> `var` 的历史其实是个"匿名类型"引发的连锁反应。C# 3.0（2007年）引入了 LINQ，而 LINQ 的 `select new { Name = p.Name, Age = p.Age }` 返回的类型根本没有名字——它叫匿名类型。你没法写 `AnonymousType244562 x = ...`，因为这个名字是编译器生成的，你根本不知道。于是微软引入了 `var`，最初动机纯粹是为了让 LINQ 能用。后来大家发现这玩意儿写起来太舒服了——`var devices = new Dictionary<string, DeviceConfig>()` 比 `Dictionary<string, DeviceConfig> devices = new Dictionary<string, DeviceConfig>()` 好看太多，于是 `var` 的使用范围被大大扩展。

> [!essentials] 核心要点
> - `var` 是**编译期**行为，不是运行时动态类型（和 JavaScript 的 `var` 截然不同）
> - 必须声明时立即初始化：`var x;` ❌ 不行，`var x = 10;` ✅
> - 推断后的类型不会变：`var x = 10; x = "hello";` ❌ 编译错误
> - `var x = null;` ❌ 编译器无法推断 null 是什么类型
> - 生成的 IL 代码与写显式类型完全一样，零性能开销
> - 适用场景：LINQ 查询、复杂泛型类型、`new` 表达式右边已经很明显时

> [!example] 完整示例
> ```csharp
> // ========== 基本用法 ==========
> var age = 25;                    // 推断为 int
> var price = 99.99;               // 推断为 double
> var name = "PLC-001";            // 推断为 string
> var isRunning = true;            // 推断为 bool
> var now = DateTime.Now;          // 推断为 DateTime

> // ========== 必须用 var 的场景：匿名类型 ==========
> var sensorData = new { DeviceId = "PLC-001", Temperature = 85.5, Timestamp = DateTime.Now };
> Console.WriteLine($"设备 {sensorData.DeviceId} 温度: {sensorData.Temperature}℃");
> // 你根本不知道这个匿名类型的类名是什么，只能用 var！

> // ========== 强烈推荐 var 的场景：复杂泛型 ==========
> // 不推荐：冗长，新手的梦魇
> Dictionary<string, List<KeyValuePair<int, string>>> config = 
>     new Dictionary<string, List<KeyValuePair<int, string>>>();

> // 推荐：一目了然，右边已经说明了类型
> var config2 = new Dictionary<string, List<KeyValuePair<int, string>>>();

> // ========== 上位机场景：LINQ 查询 ==========
> var rawTemperatures = new List<double> { 85.5, 92.1, 78.3, 65.0, 88.8 };

> var abnormalReadings = from temp in rawTemperatures
>                         where temp > 80
>                         select new 
>                         { 
>                             Value = temp, 
>                             Status = temp > 90 ? "危险" : "偏高",
>                             ReportTime = DateTime.Now
>                         };
> // 没有 var，你连 abnormalReadings 的类型都写不出来

> foreach (var reading in abnormalReadings)
> {
>     Console.WriteLine($"[{reading.ReportTime:HH:mm:ss}] {reading.Status}: {reading.Value}℃");
> }
> ```

> [!scene] 适用场景
> ✅ LINQ 查询结果（匿名类型，必须 `var`）
> ✅ 复杂泛型变量声明（右边 `new` 已经很清楚类型了）
> ✅ `foreach` 循环中遍历集合元素（`foreach (var device in devices)`）
> ❌ 右边表达式不能明显看出类型时（如 `var result = GetData();` — GetData 返回啥？要跳过去看）
> ❌ 基本数值类型（`var x = 5;` 是 `int` 还是 `byte`？写 `int x = 5;` 更清晰）
>
> 上位机场景：解析配置文件后生成了匿名类型的数据集合，只能用 `var` 承接；但声明设备状态枚举变量时还是老老实实写 `DeviceStatus status = DeviceStatus.Running;`

> [!pitfall] 常见踩坑
> 坑 1：**`var x = 3.14;` 推断为 `double` 不是 `float`！** → C# 中带小数点的字面量默认是 `double`。要 `float` 必须写 `var x = 3.14f;`。上位机开发中很多传感器精度用 `float` 就够了，别无端浪费内存。
>
> 坑 2：**`var numbers = new int[0];` 能编译，但 `var x = null;` 不行** → 前者右边有明确的类型信息（`int[]`），后者 `null` 没有任何类型线索。必须写 `string x = null;` 或 `int? x = null;`。
>
> 坑 3：**`var` 不是 `dynamic`！** → `var data = GetSomething(); data.DeviceId;` 如果 `GetSomething()` 返回的类型没有 `DeviceId` 属性，编译就会报错。而 `dynamic data = GetSomething(); data.DeviceId;` 是纯运行时，编译不报错但运行时可能崩。新手容易混淆这两个长得像但本质完全不同的东西。

> [!best] 最佳实践
> - **团队编码规范**：使用 `var` 的黄金法则——"右边能一眼看出类型就用 `var`，否则显式声明"
> - `var x = new List<string>();` ✅ 右边 `new List<string>` 写得明明白白
> - `var result = GetSensorData();` ❌ `GetSensorData` 返回啥？要去翻定义
> - `foreach (var item in collection)` ✅ `foreach` 里几乎总是用 `var`
> - 公开 API 的返回值类型永远不用 `var`（方法签名必须显式声明类型）
> - 上位机项目中，设备编号 `string`、温度 `double`、端口 `int` 这些基础类型显式声明更可读

> [!practice] 上手练习
> **Lv.1 照猫画虎**：用 `var` 声明5个不同类型的变量（int/double/string/bool/DateTime），用 `GetType()` 验证推断出的类型是否正确
> **Lv.2 小试牛刀**：创建一个 `List<Dictionary<string, object>>` 存储3台设备的配置信息，分别用显式类型和 `var` 写两遍声明语句，感受差异
> **Lv.3 融会贯通**：从下面这个数据源中，用 LINQ 查询出温度>80 的设备并生成报告（匿名类型），整个过程中尽可能使用 `var`：
> ```csharp
> var devices = new[] {
>     new { Id = "PLC-001", Temp = 85.5, Pressure = 1.2 },
>     new { Id = "PLC-002", Temp = 72.3, Pressure = 0.8 },
>     new { Id = "PLC-003", Temp = 91.0, Pressure = 1.5 },
> };
> ```

> [!related] 相关知识链接
> - ← 前置知识：值类型、引用类型（理解 var 推断出的是什么类型）
> - → 后续必学：匿名类型与 LINQ（var 的天然搭档）
> - → 后续必学：dynamic 动态类型（var 编译时 vs dynamic 运行时，容易混淆）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/statements/declarations#implicitly-typed-local-variables
