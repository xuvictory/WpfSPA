---
title: 第一个控制台程序：Hello World
section: 00-prelude
parent: 开发环境
---

# 第一个控制台程序：Hello World

> [!plain] 白话理解
> "Hello World"就是编程界的"点火仪式"——就像你买到新车，第一件事是插钥匙发动一下，听听引擎声。控制台程序没有花哨的按钮和窗口，就一个黑框框输出文字，但它能验证三件事：你的开发环境装对了、编译器能跑通、你能把代码变成能运行的程序。这三件事都确认了，才算真正踏入了编程的大门。

> [!def] 官方定义
> 控制台应用程序（Console Application）是一种以命令行界面（CLI）运行的 .NET 应用程序。它使用 `System.Console` 类进行标准输入输出，入口点是 `Program.cs` 中的 `Main` 方法（或顶级语句 `Top-level statements`）。它是学习 C# 语法、测试算法逻辑最简单的项目类型。

> [!origin] 由来背景
> "Hello, World!" 这个传统来自 1978 年 Brian Kernighan 和 Dennis Ritchie 合著的《The C Programming Language》。之所以成为入门第一课，是因为它足够简单——简单到你只需理解"输入→处理→输出"这个最原始的计算机模型。C# 的控制台程序继承了这一传统，但用了更现代的方式：从 .NET 6 开始，你可以用**顶级语句**直接写 `Console.WriteLine("Hello World!");`——不再需要那些让新手一头雾水的 `class Program`、`static void Main`、`string[] args` 模板代码。

> [!essentials] 核心要点
> - 控制台程序的入口是 `Program.cs` 文件
> - 从 .NET 6 支持**顶级语句**，一行 `Console.WriteLine()` 就能跑
> - 输入：`Console.ReadLine()`，输出：`Console.WriteLine()`
> - `dotnet new console` 创建项目，`dotnet run` 编译+运行一步到位
> - 一个解决方案可以包含多个项目，但控制台程序永远只有一个入口点
> - `Console.WriteLine` 可以输出任何类型（自动调用 `ToString()`）

> [!example] 完整示例
>
> ##### 项目创建与运行
> ```powershell
> # 创建一个控制台项目
> dotnet new console -n HelloWorld -o D:\Projects\HelloWorld
> cd D:\Projects\HelloWorld
>
> # 看看生成的文件
> dir
> # 输出：
> # HelloWorld.csproj   (项目配置文件)
> # Program.cs          (代码文件)
> # obj\                (编译中间产物，不用管)
> ```
>
> ##### 代码（Program.cs）
> ```csharp
> // 顶级语句写法 — 不需要 class 和 Main，简洁到极致
> Console.WriteLine("Hello, World!");
>
> // 但真实的控制台程序不止于 Hello World
> // 下面是一个模拟"上位机设备状态查询"的小程序
> Console.WriteLine("========== 设备状态监控 v1.0 ==========");
>
> Console.Write("请输入设备编号: ");
> string deviceId = Console.ReadLine() ?? "未知设备";
>
> Console.Write("请输入当前温度(℃): ");
> string tempInput = Console.ReadLine() ?? "0";
> double temperature = double.Parse(tempInput);
>
> Console.WriteLine(); // 空行
> Console.WriteLine($"[{DateTime.Now:HH:mm:ss}] 设备 {deviceId} 状态报告:");
> Console.WriteLine($"  温度: {temperature} ℃");
>
> if (temperature > 80)
> {
>     Console.ForegroundColor = ConsoleColor.Red;
>     Console.WriteLine($"  ⚠ 警告：温度超标！当前 {temperature}℃ > 阈值 80℃");
>     Console.ResetColor();
> }
> else if (temperature > 60)
> {
>     Console.ForegroundColor = ConsoleColor.Yellow;
>     Console.WriteLine($"  ⚡ 注意：温度偏高，当前 {temperature}℃");
>     Console.ResetColor();
> }
> else
> {
>     Console.ForegroundColor = ConsoleColor.Green;
>     Console.WriteLine($"  ✓ 温度正常");
>     Console.ResetColor();
> }
>
> Console.WriteLine("==========================================");
> Console.WriteLine("按任意键退出...");
> Console.ReadKey();
> ```
>
> ##### 运行结果
> ```
> ========== 设备状态监控 v1.0 ==========
> 请输入设备编号: CNC-001
> 请输入当前温度(℃): 85
>
> [14:30:05] 设备 CNC-001 状态报告:
>   温度: 85 ℃
>   ⚠ 警告：温度超标！当前 85℃ > 阈值 80℃
> ==========================================
> 按任意键退出...
> ```

> [!scene] 适用场景
> ✅ 学习 C# 语法的"试验田"——写一行跑一行，反馈最快
> ✅ 批处理脚本——比如一次处理 10000 条传感器日志的离线分析
> ✅ 无界面的后台服务——在工控机上默默运行的数据采集程序
> ✅ 上位机开发中的"功能验证"——先写控制台版验证算法，再搬到 WPF 里加界面
> ❌ 需要用户交互的桌面软件（那该用 WPF 或 WinForms）
>
> 上位机场景：实际开发中，我经常先用控制台程序验证串口通信是否正常、Modbus 地址映射对不对，确认逻辑无误后再迁移到 WPF 界面。这叫"先跑通逻辑，再美化界面"。

> [!pitfall] 常见踩坑
> 坑 1：**`Console.ReadLine()` 读到的是 `string?` 类型（可空字符串）** → 直接传给需要 `string` 的 API 可能飘黄线警告。解决：加 `?? "默认值"` 空合并操作，如 `string input = Console.ReadLine() ?? "";`
>
> 坑 2：**中文字符在控制台显示乱码** → 老系统默认使用 GBK 编码。解决：在程序开头加 `Console.OutputEncoding = System.Text.Encoding.UTF8;`
>
> 坑 3：**用了 `Console.ReadKey()` 但 VS 调试时窗口一闪而过** → VS 默认在调试结束时会自动关闭控制台窗口。解决：在代码末尾加 `Console.ReadKey();` 或者在 VS 中用 `Ctrl+F5`（不调试运行）代替 `F5`（调试运行）。

> [!best] 最佳实践
> - 新人学习期多用控制台程序，一个知识点一个 `.cs` 文件，随时新建随时删
> - `Console.WriteLine` 支持**字符串插值**：`$"温度：{temp}℃"`，比 `"温度：" + temp + "℃"` 更直观
> - 调试信息用 `Console.WriteLine` 而不是 `Debug.WriteLine`——前者在任何运行模式下都可见
> - 善用 `Console.ForegroundColor` 区分 Log 级别：绿色=正常、黄色=警告、红色=错误
> - 复杂逻辑先写控制台版验证，通过后再搬到 WPF 里——这在工业上位机开发中能省一半时间

> [!practice] 上手练习
> **Lv.1 照猫画虎**：创建控制台项目，运行上面的设备状态监控代码，输入不同的温度值观察颜色变化
> **Lv.2 小试牛刀**：在上面的代码基础上，增加"湿度"输入项。当湿度>90% 时显示红色警告，>70% 时黄色提示，否则绿色正常
> **Lv.3 融会贯通**：写一个"设备数据一览表"控制台程序，让用户依次输入3台设备的编号、温度、湿度，最后打印一张汇总表（用 `\t` 制表符对齐，列标题加下划线）

> [!related] 相关知识链接
> - ← 前置知识：.NET SDK 安装（没 SDK 就 `dotnet new` 不了）
> - ← 前置知识：Visual Studio 2022 安装与配置（VS 里也能直接创建控制台项目）
> - → 后续必学：变量与数据类型（Hello World 里用到的 `string`、`double`、`bool` 都是数据类型）
> - → 后续必学：条件语句 if-else（这篇示例代码里的温度判断就用到了）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/core/tutorials/with-visual-studio
