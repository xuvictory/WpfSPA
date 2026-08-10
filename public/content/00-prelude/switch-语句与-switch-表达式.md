---
title: switch 语句与 switch 表达式
section: 00-prelude
parent: 流程控制
---

# switch 语句与 switch 表达式

> [!plain] 白话理解
> `if-else` 是"走一步看一步"的判断，`switch` 是"对着清单查表"。当你有 5 个、10 个甚至更多确定值要分别处理时——比如 Modbus 功能码：`0x01` 读线圈、`0x03` 读寄存器、`0x06` 写单个、`0x10` 写多个——用 `switch` 比一串 `if-else` 清晰十倍。而 C# 8.0 的 `switch` 表达式（`x switch { ... }`）更是把多分支**赋值**压缩成了一行艺术品。

> [!def] 官方定义
> - **`switch` 语句**：根据匹配表达式的结果，跳转到对应的 `case` 标签执行。支持整数、字符、字符串、枚举类型。C# 7.0 起支持模式匹配（类型匹配 + `when` 条件）。
> - **`switch` 表达式**（C# 8.0）：以表达式形式返回值的 switch，使用 `=>` 箭头语法。每个分支必须返回值，编译器会检查穷尽性。
> - `break` 必须出现在每个非空 `case` 末尾（C# 不允许 `case` 穿透，除非是空的连续 `case`）
> - `default` 分支：没有匹配项时的兜底（switch 表达式中通常必需）

> [!origin] 由来背景
> `switch` 的祖师爷是跳转表（Jump Table）——编译器把 case 值做成一张表，运行时直接查表跳转，而不像 `if-else` 那样逐个判断。所以对密集的整数 case 值，`switch` 的效率极高。但 C# 早期只支持整数和字符串匹配，直到 7.0 才加入模式匹配，8.0 才加入 `switch` 表达式——这两个改进让 `switch` 从"等值匹配器"进化为"通用分支引擎"。上位机协议解析中，你经常需要按功能码分发处理——这是 `switch` 的天然主场。

> [!essentials] 核心要点
> - `case` 值必须是编译时常量
> - 每个非空 `case` 必须以 `break`/`return`/`goto`/`throw` 结束
> - 多个 `case` 标签可以共用一个代码块：`case 1: case 2: DoSomething(); break;`
> - `when` 子句（C# 7.0）：`case int n when n > 0:` 给模式匹配加条件
> - `switch` 表达式用 `_` 表示 default：`x switch { 1 => "一", _ => "其他" }`
> - `switch` 表达式支持属性模式：`device switch { { IsOnline: true } => ... }`

> [!example] 完整示例
> ```csharp
> // ========== 传统 switch 语句 ==========
> byte functionCode = 0x03;  // Modbus 读保持寄存器

> switch (functionCode)
> {
>     case 0x01:  // 读线圈
>         Console.WriteLine("执行：读取线圈状态");
>         break;
>     case 0x02:  // 读离散输入
>         Console.WriteLine("执行：读取离散输入");
>         break;
>     case 0x03:  // 读保持寄存器 ← 当前匹配
>         Console.WriteLine("执行：读取保持寄存器");
>         break;
>     case 0x04:  // 读输入寄存器
>         Console.WriteLine("执行：读取输入寄存器");
>         break;
>     case 0x05:  // 写单个线圈
>     case 0x06:  // 写单个寄存器
>         Console.WriteLine("执行：写入单个值");
>         break;
>     case 0x0F:  // 写多个线圈
>     case 0x10:  // 写多个寄存器
>         Console.WriteLine("执行：批量写入");
>         break;
>     default:
>         Console.WriteLine($"不支持的功能码: 0x{functionCode:X2}");
>         break;
> }

> // ========== switch 表达式（C# 8.0）：从"控制流"变成"求值" ==========
> string operation = functionCode switch
> {
>     0x01 => "读线圈",
>     0x02 => "读离散输入",
>     0x03 => "读保持寄存器",
>     0x04 => "读输入寄存器",
>     0x05 or 0x06 => "写入单个值",       // or 模式！
    >= 0x0F and <= 0x10 => "批量写入",  // 关系模式！
>     _ => $"未知功能码: 0x{functionCode:X2}"
> };
> Console.WriteLine(operation);  // 读保持寄存器

> // ========== 模式匹配 + when 条件 ==========
> object response = 200;

> string httpResult = response switch
> {
>     int code when code >= 200 && code < 300 => $"✅ 成功 ({code})",
>     int code when code >= 400 && code < 500 => $"❌ 客户端错误 ({code})",
>     int code when code >= 500                 => $"💥 服务器错误 ({code})",
>     string msg                               => $"文本响应: {msg}",
>     null                                     => "空响应",
>     _                                        => "未知响应类型"
> };
> Console.WriteLine(httpResult);  // ✅ 成功 (200)

> // ========== 上位机实战：Modbus 协议分发器 ==========
> enum ModbusFunction : byte
> {
>     ReadCoils = 0x01,
>     ReadDiscreteInputs = 0x02,
>     ReadHoldingRegisters = 0x03,
>     ReadInputRegisters = 0x04,
>     WriteSingleCoil = 0x05,
>     WriteSingleRegister = 0x06,
>     WriteMultipleCoils = 0x0F,
>     WriteMultipleRegisters = 0x10
> }

> try
> {
>     string result = functionCode switch
>     {
>         (byte)ModbusFunction.ReadCoils             => ParseCoilStatus(),
>         (byte)ModbusFunction.ReadHoldingRegisters  => ParseRegisterValues(),
>         (byte)ModbusFunction.WriteSingleRegister   => $"写入成功: {ParseWriteConfirm()}",
        >= 0x05 and <= 0x10                        => "写操作执行完毕",
>         _ => throw new NotSupportedException($"功能码 0x{functionCode:X2} 暂未实现")
>     };
>     Console.WriteLine($"协议解析结果: {result}");
> }
> catch (NotSupportedException ex)
> {
>     Console.WriteLine(ex.Message);
> }

> static string ParseCoilStatus() => "线圈: [ON, OFF, ON, ON]";
> static string ParseRegisterValues() => "寄存器: [1023, 512, 0, 768]";
> static string ParseWriteConfirm() => "寄存器 0x0001 ← 0x00FF";
> ```

> [!scene] 适用场景
> ✅ 枚举值分发处理：`switch (deviceState) { case Running: ... }`
> ✅ 协议功能码路由：`switch (functionCode) { case 0x03: ... }`
> ✅ 有限状态机：每个 `case` 代表一个状态，处理输入并转移到下一状态
> ✅ 工厂模式类型选择：`return type switch { "PLC" => new PlcDriver(), ... }`
> ❌ 范围判断为主 → `if-else` 更合适（如温度区间：0~20/20~40/40~60）
> ❌ 动态条件（数据库查询结果）→ `switch` 的值必须是编译时常量

> [!pitfall] 常见踩坑
> 坑 1：**C# 的 switch 不自动穿透** → 和 C/C++/Java 不同，C# 的 `case` 不会"顺着往下掉"。每个非空 `case` 必须以 `break` 结束。这是好事（防止遗漏 break 的 bug），但刚从那些语言转过来会觉得别扭。空的连续 `case` 标签是唯一不需要 break 的例外。
>
> 坑 2：**`switch` 表达式必须穷尽或包含 `_` 兜底** → `int x = 5; var r = x switch { 1 => "一", 2 => "二" };` ❌ 编译错误：switch 表达式未处理所有可能的 int 值。加上 `_ => "其他"` 就行了。
>
> 坑 3：**`case null:` 的特殊性** → 传统 switch 语句中 `case null:` 是合法的（C# 7.0+），但 `null` 的模式匹配行为在 switch 表达式和 switch 语句中略有不同，建议统一用 `null =>` 处理。

> [!best] 最佳实践
> - 3 个以上等值分支 → 用 `switch` 而非 `if-else`
> - **优先使用 switch 表达式**（C# 8.0+）做多分支赋值，可读性远胜 switch 语句
> - 协议解析中每个功能码的处理逻辑抽成独立方法，`case` 里只做路由调用
> - `when` 子句让模式匹配如虎添翼：`case double d when d is >= 0 and <= 100:`
> - 永远保留 `default`/`_` 分支——未来的代码维护者会感谢你
> - 枚举类型写 switch 时，VS 会自动生成所有 case 标签（输入 `switch` 后按 Tab）

> [!practice] 上手练习
> **Lv.1 照猫画虎**：定义 `DayOfWeek` 枚举（周一~周日），用 switch 表达式将枚举映射为中文文本，打印"今天是周一"
> **Lv.2 小试牛刀**：模拟简易 Modbus 协议解析器——输入 `(byte functionCode, byte[] data)`，根据功能码（01/03/05/06），用 switch 表达式返回不同格式的解析结果字符串
> **Lv.3 融会贯通**：用 switch 表达式 + 模式匹配实现一个"通用数据解析器"——输入 `object` 类型，判断它是 `int`（显示为十六进制）、`double`（保留2位小数）、`string`（截断超长字符串）、`byte[]`（转为十六进制字符串），写完整单元测试

> [!related] 相关知识链接
> - ← 前置知识：条件语句 if-else（switch 是多分支 if-else 的进化版）
> - → 后续必学：枚举（enum 和 switch 是最佳拍档）
> - ⇄ 关联概念：模式匹配（`is` / `when` / 属性模式 —— switch 的现代玩法）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/statements/selection-statements / https://learn.microsoft.com/zh-cn/dotnet/csharp/language-reference/operators/switch-expression
