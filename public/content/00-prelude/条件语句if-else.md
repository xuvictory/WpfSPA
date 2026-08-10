---
title: 条件语句（if-else）
section: 00-prelude
parent: 流程控制
---

# 条件语句（if-else）

> [!plain] 白话理解
> `if-else` 是程序的"红绿灯"。温度 > 80？亮红灯告警。所有传感器就绪？亮绿灯开始采集。它在每一行代码里做的其实就是你每天都在做的判断——"如果下雨，带伞；否则，不带"。只不过在 C# 里，"下雨"是 `bool` 表达式，"带伞"是一段代码块。这个世界上最简单的语法，恰恰是使用频率最高的语法——任何一个非平凡的程序，`if` 出现的次数比其他所有关键字加起来都多。

> [!def] 官方定义
> `if-else` 是 C# 的**选择结构**语句，根据布尔条件的真假决定执行哪个代码块：
> - `if (condition) { ... }` — 条件为 true 时执行
> - `if (condition) { ... } else { ... }` — 二选一分支
> - `if (c1) { ... } else if (c2) { ... } else { ... }` — 多分支判断
> - 条件必须是 `bool` 类型（不能隐式转换，`if (x)` 在 C# 中是编译错误，除非 `x` 是 `bool`）
> - 使用 `{}` 花括号界定代码块，即使只有一行也建议加

> [!origin] 由来背景
> `if-else` 的语法几乎原封不动地来自 C 语言（1972年），而 C 又是从 ALGOL 58 继承来的。这是一个 60 年前就定型的语法范式，至今没变——因为它已经完美了。但 C# 做了一个关键的改进：**条件必须是 `bool`**。C/C++ 中 `if (x)` 当 x 是非零 int 时也走 true 分支，这种隐式转换制造了无数 `if (x = 5)`（赋值而非判等）的 bug。C# 在编译器层面直接封死了这条路——你需要感谢那些被 C++ 折磨过的编译器设计师。

> [!essentials] 核心要点
> - 条件必须是 `bool` 表达式：`if (isRunning)` ✅ / `if (count)` ❌（count 是 int）
> - `else` 总是与最近的未配对 `if` 结合（"悬挂 else"问题）
> - `else if` 不是独立的关键字，是 `else { if (...) }` 的简化写法
> - 条件为 `bool?` 时：`if (nullableBool == true)` 必须显式判断
> - `is` 模式匹配可替代简单判等：`if (state is DeviceState.Running)`（C# 7.0+）
> - `if` 中声明变量（C# 7.0+）：`if (int.TryParse(s, out int n) && n > 0)`

> [!example] 完整示例
> ```csharp
> // ========== 基本 if-else ==========
> double temperature = 85.5;

> if (temperature > 80)
> {
>     Console.WriteLine("⚠ 高温告警！");
> }
> else if (temperature > 60)
> {
>     Console.WriteLine("⚡ 温度偏高");
> }
> else if (temperature > 0)
> {
>     Console.WriteLine("✅ 温度正常");
> }
> else
> {
>     Console.WriteLine("❄ 温度异常：可能传感器故障");
> }

> // ========== 上位机实战：设备状态综合判断 ==========
> bool isConnected = true;
> bool dataValid = true;
> bool emergencyStop = false;
> double pressure = 2.3;

> // if-else 嵌套：带优先级的分级判断
> if (emergencyStop)
> {
>     Console.WriteLine("🔴 [紧急] 急停按钮已触发，所有设备停止");
> }
> else if (!isConnected)
> {
>     Console.WriteLine("🔴 [错误] 设备通信中断，尝试重连...");
> }
> else if (!dataValid)
> {
>     Console.WriteLine("🟡 [警告] 数据校验失败，丢弃本次采集");
> }
> else
> {
>     // 正常模式下再细分
>     if (temperature > 80 && pressure > 2.0)
>         Console.WriteLine("🔴 [告警] 高温高压，建议降负荷运行");
>     else if (temperature > 80)
>         Console.WriteLine("🟡 [注意] 温度偏高，请检查散热系统");
>     else if (pressure > 2.0)
>         Console.WriteLine("🟡 [注意] 压力偏高，请检查管路");
>     else
>         Console.WriteLine("🟢 [正常] 设备运行参数在安全范围内");
> }

> // ========== C# 7.0 模式匹配 ==========
> object sensorValue = 1023;  // 可能是 int/double/string/...
> if (sensorValue is int intValue && intValue > 1000)
>     Console.WriteLine($"ADC值超标: {intValue}");
> else if (sensorValue is double d && double.IsNaN(d))
>     Console.WriteLine("传感器返回 NaN");
> else if (sensorValue is string s)
>     Console.WriteLine($"传感器返回文本: {s}");

> // ========== if 中声明变量 ==========
> // 从配置文件读的字符串，解析+判断一气呵成
> string? configValue = "  -5  "; // 带空格和负数
> if (int.TryParse(configValue, out int port) && port > 0 && port < 65536)
>     Console.WriteLine($"有效端口号: {port}");
> else
>     Console.WriteLine($"无效配置值: '{configValue}'，端口号应为 1~65535");
> ```

> [!scene] 适用场景
> ✅ 基于阈值的告警判断：`if (value > alarmThreshold)`
> ✅ 状态机转换：`if (state == State.Waiting && packetReceived)`
> ✅ 输入验证：`if (string.IsNullOrWhiteSpace(input))` → 提示用户
> ✅ 前置条件检查：方法开头 `if (param == null) throw ...`
> ❌ 3个以上固定值的等值判断 → 用 `switch`
> ❌ 简单的二选一赋值 → 用三元运算符 `?:`

> [!pitfall] 常见踩坑
> 坑 1：**`if (x = 5)` 的 C++ 风格错误被 C# 挡住了！** → 这是好事，但 `if (isRunning = true)` 的类似误写还是会编译不过，可能让 C++ 老手困惑。
>
> 坑 2：**忘写花括号导致逻辑错误** → 
> ```csharp
> if (temperature > 80)
>     Console.WriteLine("高温");
>     StartCooling();  // ← 这行总会被执行！它不在 if 里
> ```
> 工业规范强制：即使只有一行也加 `{}`！这不仅是代码风格，更是安全规范。
>
> 坑 3：**`if (data != null)` 不能防御 `DBNull`** → 数据库读取返回的 `DBNull.Value` 既不是 `null` 也不是有效值。正确写法：`if (data != null && data != DBNull.Value)`

> [!best] 最佳实践
> - **花括号永远不省略**——这是工业级代码的硬性红线
> - 正向条件优于反向条件：`if (isValid)` 比 `if (!isInvalid)` 好读
> - 先处理异常情况，早点 `return`（守卫子句模式）：
>   ```csharp
>   if (!isConnected) return;
>   if (!dataValid) return;
>   // 正常处理逻辑...
>   ```
> - `else if` 链超过 3 个分支考虑用 `switch` 或策略模式
> - 用 `is` 模式匹配替代 `as` + null 检查（C# 7.0+）
> - 复杂的条件表达式提取为有意义的中间变量

> [!practice] 上手练习
> **Lv.1 照猫画虎**：输入温度值，用 `if-else if-else` 判断并输出：>80→高温、60~80→正常、<60→低温、<0→传感器故障
> **Lv.2 小试牛刀**：写一个"设备状态检查"方法，输入4个 bool（上电/通信/数据/急停），优先级从上到下：急停→通信断→数据无效→正常运行，用 `if-else` 按优先级只输出最高级别的状态
> **Lv.3 融会贯通**：实现上位机常用的"报警死区"逻辑——温度超过 80 报警，但必须降到 75 以下才解除（防止在边界反复抖动）。用 `if-else` 配合 `bool` 状态变量实现

> [!related] 相关知识链接
> - ← 前置知识：比较运算符、逻辑运算符（if 的条件表达式由它们构成）
> - → 后续必学：switch 语句（多分支等值判断的更好选择）
> - ⇄ 关联概念：三元运算符（`?:` 是单行 if-else 的精简版）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/statements/selection-statements
