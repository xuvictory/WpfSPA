---
title: 类型转换（隐式、显式、Convert、Parse、TryParse）
section: 00-prelude
parent: 变量与数据类型
---

# 类型转换（隐式、显式、Convert、Parse、TryParse）

> [!plain] 白话理解
> 类型转换就像"换容器"——你有一杯水（`int`），现在需要倒进一个量杯（`double`），这个操作它允许，而且不会洒（隐式转换）。但如果要把一桶水（`long`）倒进一个杯子（`int`），可能会溢出，编译器要求你明确表态"我知道风险，倒吧！"（显式转换）。至于把文字"85.5"变成数字 `85.5`，那更不是倒水了，是"翻译"——你得用 `Parse` 或 `TryParse` 来当翻译官。

> [!def] 官方定义
> 类型转换是将一种数据类型的值变为另一种类型值的操作。C# 支持五种主要转换机制：
> - **隐式转换**：自动发生，不会丢失数据（如 `int` → `double`）
> - **显式转换（强制转换）**：需要 `(目标类型)` 语法，可能丢失精度或溢出（如 `double` → `int`）
> - **Convert 类**：.NET 提供的静态工具类，支持更多类型之间的转换，遇到 `null` 返回默认值
> - **Parse/TryParse**：将字符串解析为目标类型，`Parse` 失败抛异常，`TryParse` 失败返回 `false`

> [!origin] 由来背景
> 强类型（Strong Typing）是 C# 的基因——你不能把 `string` 当 `int` 用，这避免了运行时那些"炸得莫名其妙"的错误。但工业开发的现实是：传感器返回的是字符串 `"1023"`，你要当整数用；UI 文本框输入的是 `"85.5"`，你得当浮点数算。类型转换就是连接"字符串的世界"（用户输入、网络数据、文件内容）和"强类型的世界"（C# 编译器）之间的桥梁。`TryParse` 的发明更是里程碑——它引入了"尝试-反馈"模式，而不是一言不合就抛异常，这对上位机的高可靠性场景至关重要。

> [!essentials] 核心要点
> - 小类型 → 大类型：隐式（`int` → `long`，不丢精度）
> - 大类型 → 小类型：显式强制（`(int)3.14` → `3`，丢失小数）
> - 浮点 → 整数：截断，不四舍五入
> - `Convert.ToInt32(3.5)`：四舍五入（银行家舍入）
> - `int.Parse("123")`：字符串必须严格是数字格式，否则抛 `FormatException`
> - `int.TryParse("123", out result)`：安全版 Parse，失败不抛异常，返回 `false`
> - **上位机铁律**：凡涉及用户输入或设备返回的字符串，一律用 `TryParse`

> [!example] 完整示例
> ```csharp
> // ========== 1. 隐式转换 ==========
> int sensorRaw = 1023;        // 传感器原始值 0~1023
> double voltage = sensorRaw;  // int → double，自动转换，无需任何标记
> // sensorRaw = 3.14;        // ❌ 编译错误：不能隐式 double → int

> // ========== 2. 显式转换（强制转换） ==========
> double actualVoltage = sensorRaw * 5.0 / 1023.0; // 计算实际电压
> int displayVoltage = (int)actualVoltage;          // 截断小数部分
> Console.WriteLine($"实际电压: {actualVoltage:F2}V, 显示值: {displayVoltage}V");
> // 输出：实际电压: 5.00V, 显示值: 5V （恰好整数，看不出截断）

> double bad = 9.99;
> int truncated = (int)bad;    // 结果是 9，不是 10！强制转换是截断不是四舍五入
> Console.WriteLine($"(int)9.99 = {truncated}");   // 9

> // ========== 3. Convert 类 ==========
> int rounded = Convert.ToInt32(9.99);  // 结果是 10，Convert 会四舍五入
> Console.WriteLine($"Convert.ToInt32(9.99) = {rounded}"); // 10

> // Convert 遇到 null 的行为不同于 Parse：
> string nullStr = null;
> int fromNull = Convert.ToInt32(nullStr);  // 返回 0，不抛异常！
> Console.WriteLine($"Convert null → {fromNull}"); // 0

> // ========== 4. Parse（危险，上位机别用） ==========
> string input1 = "1023";
> int value1 = int.Parse(input1);  // ✅ 正常运行

> // string input2 = "abc";
> // int value2 = int.Parse(input2);  // ❌ FormatException! 直接崩

> // ========== 5. TryParse（上位机标配） ==========
> string userInput = "  +1023 ";  // 带空格和正号，Parse 也能处理

> if (int.TryParse(userInput, out int result))
> {
>     Console.WriteLine($"解析成功: {result}");     // 1023
> }
> else
> {
>     Console.WriteLine("输入的不是有效整数");
> }

> // ========== 上位机实战：从串口数据解析温度 ==========
> string serialData = "TEMP:85.5;HUM:62.3"; // 模拟串口返回的数据

> // 解析温度
> int colonIndex = serialData.IndexOf("TEMP:");
> int semicolonIndex = serialData.IndexOf(";HUM");
> string tempStr = serialData.Substring(colonIndex + 5, semicolonIndex - colonIndex - 5);

> if (double.TryParse(tempStr, out double temperature))
> {
>     string status = temperature switch
>     {
        > 80 => "🔴 温度过高",
        > 60 => "🟡 温度偏高",
>         _    => "🟢 温度正常"
>     };
>     Console.WriteLine($"设备温度: {temperature}℃ — {status}");
> }
> else
> {
>     Console.WriteLine("温度数据解析失败，请检查串口数据格式");
> }
> ```

> [!scene] 适用场景
> ✅ `TryParse`：**上位机中最常用的转换方式**——解析用户输入、串口数据、文件内容、配置文件
> ✅ `Convert`：数据库读取操作（`DBNull` → `null` → 默认值），比裸 `(int)` 更安全
> ✅ 显式转换 `(int)`：确信数据一定在范围内的数学运算，性能最好
> ✅ 隐式转换：数学运算中让编译器自动处理（`double result = 5 / 2.0`）
> ❌ `Parse`：上位机生产环境不该出现——用户输入不可控、设备数据不可控

> [!pitfall] 常见踩坑
> 坑 1：**`(int)3.9999` 是 `3` 不是 `4`！** → 显式转换是截断，不是四舍五入。要四舍五入用 `Convert.ToInt32()` 或 `Math.Round()`。
>
> 坑 2：**`TryParse` 忘写 `out` 关键字** → `int.TryParse(str, int result)` ❌ 编译错误，必须是 `int.TryParse(str, out int result)` ✅ 
>
> 坑 3：**`Convert.ToInt32("")` 抛 `FormatException`，但 `Convert.ToInt32(null)` 返回 `0`** → 这行为不一致！空字符串不是数字，微软的设计是：`null` 代表"无值"→返回默认值，`""` 代表"有值但格式不对"→抛异常。最佳实践：先用 `string.IsNullOrWhiteSpace()` 过滤。

> [!best] 最佳实践
> - **上位机解析外部数据，一律 `TryParse`，永远不用 `Parse`**
> - 多个字段同时解析时，用 `&&` 短路判断是否全部成功：
>   ```csharp
>   if (int.TryParse(s1, out int a) && double.TryParse(s2, out double b))
>   ```
> - `double` → `int` 需要保留小数：`(int)Math.Round(value)`，别直接强转
> - 解析数字时考虑文化差异：`double.TryParse("85,5", NumberStyles.Any, CultureInfo.InvariantCulture, out result)`
> - 枚举类型也有 `Enum.TryParse`，别用 `(MyEnum)intValue` 生转

> [!practice] 上手练习
> **Lv.1 照猫画虎**：创建一个控制台程序，让用户输入"温度"和"压力"两个数值（字符串），用 `TryParse` 解析为 `double`，判断是否解析成功并打印结果
> **Lv.2 小试牛刀**：模拟一条 Modbus 协议响应字符串 `"01030200C800FA"`，用 `Substring` 分段 + `int.TryParse` 解析出寄存器值（提示：`"00C8"` 用 `NumberStyles.HexNumber` 解析）
> **Lv.3 融会贯通**：写一个通用的 `SafeParse` 方法，输入 `string?`，返回解析后的 `double?`。要求：能处理 `null`、空字符串、前后空格、科学计数法（如 `"1.5e3"`），解析失败返回 `null`

> [!related] 相关知识链接
> - ← 前置知识：值类型（int/double/bool/char/decimal/byte）+ 引用类型（string/object）
> - → 后续必学：可空类型 Nullable（`TryParse` 输出与 `null` 的结合使用）
> - ⇄ 关联概念：字符串插值（输出的格式化写法）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/csharp/programming-guide/types/casting-and-type-conversions
