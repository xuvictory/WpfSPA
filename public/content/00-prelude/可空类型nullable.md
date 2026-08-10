---
title: 可空类型（Nullable）
section: 00-prelude
parent: 变量与数据类型
---

# 可空类型（Nullable）

> [!plain] 白话理解
> 值类型（如 `int`、`double`、`bool`）天生不能为 `null`——它们必须有个值，哪怕是默认的 `0`。可空类型就是给值类型发了一张"请假条"，允许它说"我现在没值"。比如一个温度传感器坏了没读数，你该怎么表示？`0`℃ 是真实读数（可能是冬天），`-1` 是"你自己发明的非法值"（别人看不懂），`double?`（可空 double）才是标准答案——没读数就是 `null`。

> [!def] 官方定义
> 可空值类型（Nullable Value Type）是 `System.Nullable<T>` 结构的语法糖，其中 `T` 必须是值类型。它允许值类型额外拥有一个 `null` 状态。两种等价写法：
> - `int?` 等价于 `System.Nullable<int>` 等价于 `Nullable<int>`
> - 核心属性：`.HasValue`（是否有值）、`.Value`（获取值，为 null 时访问抛 `InvalidOperationException`）
> - 核心方法：`.GetValueOrDefault()` 返回默认值，`.GetValueOrDefault(T defaultValue)` 返回指定的后备值

> [!origin] 由来背景
> 数据库里的 `INT` 字段可以是 `NULL`，表示"暂无数据"。但 C# 1.0 的 `int` 不能为 `null`，导致开发者被迫用"魔法数字"（如 `-1`、`int.MaxValue`）表示"没有值"——这跟魔法无异，团队新成员根本看不懂，而且万一真实数据恰好是 `-1` 呢？C# 2.0 引入了 `Nullable<T>` 彻底解决了这个问题。在上位机开发中，这个问题更突出：传感器故障、通信超时、配置缺失——这些"无数据"的情况比正常数据还常见。

> [!essentials] 核心要点
> - `int?`、`double?`、`bool?`、`DateTime?` — 所有值类型都能可空
> - `string` 本身就是引用类型，天生可为 `null`，不需要也不能写 `string?`（C# 8.0 的可空引用类型是另一回事）
> - `int? a = null;` ✅ / `int a = null;` ❌ 编译错误
> - `??` 空合并运算符：`int result = nullableValue ?? 0;` — 有值用值，没值默认 0
> - `?.` 空条件运算符：`int? length = text?.Length;` — text 为 null 时直接返回 null
> - 两个 `int?` 做算术运算，任何一个是 null 结果就是 null（null 的传播性）

> [!example] 完整示例
> ```csharp
> // ========== 基本用法 ==========
> int? temperature = null;            // 传感器尚未返回数据
> int? pressure = 101;                // 已有读数

> // 检查是否有值
> if (temperature.HasValue)
>     Console.WriteLine($"温度: {temperature.Value}℃");
> else
>     Console.WriteLine("温度传感器无数据");

> // GetValueOrDefault：给个安全的默认值
> double safeTemp = temperature.GetValueOrDefault(25.0); // 没数据就当 25℃
> Console.WriteLine($"安全温度值: {safeTemp}℃");

> // 空合并运算符 ?? — 写法和 GetValueOrDefault 等效，更好看
> double display = temperature ?? 25.0;

> // ========== null 传播：任何操作数是 null，结果就是 null ==========
> int? a = 10;
> int? b = null;
> int? sum = a + b;       // null!
> int? product = a * 5;   // 50
> Console.WriteLine($"a+b = {sum?.ToString() ?? "null"}");   // null
> Console.WriteLine($"a*5 = {product}");                      // 50

> // ========== 空条件运算符 ?. ==========
> string? serialData = null;
> int? dataLength = serialData?.Length;  // 而不是 serialData.Length（会崩）
> Console.WriteLine($"数据长度: {dataLength?.ToString() ?? "无数据"}");

> // ========== 上位机实战：设备状态类 ==========
> public class DeviceReading
> {
>     public double? Temperature { get; set; }   // 可为 null：传感器可能故障
>     public double? Humidity { get; set; }
>     public double? Pressure { get; set; }
>     public DateTime Timestamp { get; set; } = DateTime.Now;
    
>     // 智能状态判断：部分数据缺失不影响可用数据的判断
>     public string GetStatusReport()
>     {
>         var parts = new List<string>();
        
>         if (Temperature.HasValue)
>         {
>             string level = Temperature.Value switch
>             {
                > 80 => "高温告警",
                > 60 => "温度偏高",
>                 _    => "温度正常"
>             };
>             parts.Add($"{level}({Temperature.Value:F1}℃)");
>         }
>         else parts.Add("温度传感器离线");
        
>         if (Humidity.HasValue)
>             parts.Add($"湿度{Humidity.Value:F1}%");
>         else parts.Add("湿度传感器离线");
        
>         return string.Join(" | ", parts);
>     }
> }

> // 实际使用
> var reading = new DeviceReading { Temperature = 85.5, Humidity = null };
> Console.WriteLine(reading.GetStatusReport());
> // 输出：高温告警(85.5℃) | 湿度传感器离线

> // ========== bool? 三态逻辑 ==========
> bool? isOnline = null;  // 未知状态：没 ping 通也可能是网络问题
> if (isOnline == true)      Console.WriteLine("设备在线");
> else if (isOnline == false) Console.WriteLine("设备离线");
> else                        Console.WriteLine("设备状态未知");
> ```

> [!scene] 适用场景
> ✅ 传感器数据获取：读取失败时用 `null` 而不是魔法数字
> ✅ 用户可选输入：表单中非必填字段（如"报警上限"可以不填）
> ✅ 数据库映射：数据库中可空列直接映射为 `int?`
> ✅ 配置项：有些配置可以不设值，留作系统默认
> ❌ 核心业务逻辑：不要把可空类型当"懒惰的默认值"乱用——该有值就必须有值

> [!pitfall] 常见踩坑
> 坑 1：**直接访问 `.Value` 而没检查 `.HasValue`** → 
> ```csharp
> int? x = null;
> Console.WriteLine(x.Value); // ❌ InvalidOperationException!
> // 正解：
> Console.WriteLine(x ?? 0);  // ✅ 0
> ```
>
> 坑 2：**`int?` 和 `int` 做比较时要小心** → 
> ```csharp
> int? x = null;
> if (x < 5) { }  // 结果是 false（null 和任何比较都是 false）
> if (x == null) { } // ✅ 用这个判断
> ```
>
> 坑 3：**两个 `int?` 不能用 `<` 等运算符直接排序** → `List<int?>.Sort()` 会把 null 排在最前面，这在业务上往往不合理。可能需要自定义比较器，或用 `x.GetValueOrDefault(int.MinValue)` 统一处理后排序。

> [!best] 最佳实践
> - 永远用 `??` 而不要裸调 `.Value`，除非你 100% 确定 `.HasValue` 为 `true`
> - 用 `??` 给默认值时，选业务上合理的值（而不是随便填 `0`）：
>   ```csharp
>   double alarmThreshold = config.MaxTemp ?? 80.0; // 没配置就默认 80℃
>   ```
> - 多个可空变量的组合判断：
>   ```csharp
>   if (temperature.HasValue && humidity.HasValue)
>       ProcessFull(temperature.Value, humidity.Value);
>   else
>       LogWarning("部分传感器数据缺失");
>   ```
> - C# 8.0 的可空引用类型（NRT）和可空值类型是两个不同功能，别混淆
> - 数据库查询用 `DBNull` 判断：`reader.IsDBNull(0) ? (int?)null : reader.GetInt32(0)`

> [!practice] 上手练习
> **Lv.1 照猫画虎**：定义 `int?`、`double?`、`bool?` 各一个，分别赋值为有值和 null，用 `HasValue` 和 `??` 两种方式打印
> **Lv.2 小试牛刀**：写一个 `GetAverage` 方法，输入 `double?[]` 数组，忽略所有 null 值，计算剩余值的平均数。如果全是 null 则返回 `null`
> **Lv.3 融会贯通**：设计一个简化的设备监控数据类，包含温度、湿度、压力三个 `double?` 属性。写一个方法生成"设备健康报告"：三个值都有→"全面监控正常"、缺一个→"部分传感器故障：{列出缺失项}"、全缺→"设备离线"

> [!related] 相关知识链接
> - ← 前置知识：值类型（int/double/bool 等天生不为 null 的类型，Nullable 就是给它们用的）
> - → 后续必学：类型转换（`TryParse` + `out` + `Nullable` 的组合应用）
> - ⇄ 关联概念：`??` 和 `??=` 运算符、空条件 `?.` 运算符
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/builtin-types/nullable-value-types
