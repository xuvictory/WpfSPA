---
title: Serilog 结构化日志
section: 12-architecture
parent: 12.6 日志系统
---

# Serilog 结构化日志

> [!plain] 白话理解
> 普通日志是**"报流水账"**（"温度超限"），Serilog 是**"填表存档"**（`超限报警 {温度=85.3, 阈值=80, 通道=3}`）——把数据以结构化键值记录。好处：排查时能**按字段查询过滤**（"查 3 号通道所有超限"），还能直接对接数据库、日志平台。上位机里"某天哪台设备哪项数据异常"的追溯，结构化日志一搜即得。

> [!def] 官方定义
> Serilog 是一个开源 .NET 结构化日志（Structured Logging）库（NuGet：`Serilog`、`Serilog.Sinks.File`、`Serilog.Extensions.Logging`），核心特点是**基于消息模板（Message Template）记录语义化数据**：`Log.Information("Temp {Temp} > {Limit}", temp, limit)` 中的 `{Temp}`、`{Limit}` 会被捕获为结构化字段，而非拼接字符串。它与 `Microsoft.Extensions.Logging` 兼容（`SerilogLoggerFactory` 桥接）：https://serilog.net/ 、https://github.com/serilog/serilog 。Sink（输出目标）生态丰富：文件、控制台、Seq（日志服务器）、SQL Server 等。

> [!origin] 由来背景
> 传统日志框架（log4net、NLog）输出的是格式化文本字符串——"可读但不可查"。随着 ELK/日志平台兴起，"日志即数据"成为共识：文本日志难以按字段过滤、聚合、告警。Serilog 2013 年由 Nicholas Blumhardt（前 .NET 编译器团队）发布，提出"消息模板"思想：占位符不只是格式化参数，而是结构化字段；同一份日志既能人类阅读，也能被机器解析。随后 .NET 的 `Microsoft.Extensions.Logging` 也采用了 `{Placeholder}` 模板风格。上位机 + Seq/日志平台配合，可实现"远程排查现场设备"，Serilog 因此成为 .NET 日志首选之一。

> [!essentials] 核心要点
> - **消息模板**：`Log.Information("Device {Id} temp={Temp}", id, temp)`，占位符即结构化字段
> - **常用 Sink**：`WriteTo.Console()`、`WriteTo.File("logs/hmi-.log", rollingInterval: RollingInterval.Day)`、`WriteTo.Seq(...)`
> - **配置方式**：代码式 `Log.Logger = new LoggerConfiguration()...CreateLogger()` 或 `appsettings.json` 配置（`Serilog` 节）
> - **与 Microsoft.Extensions.Logging 桥接**：`builder.Logging.AddSerilog()` / `Log.Logger` 全局静态，`ILogger<T>` 注入继续可用
> - **字段类型**：数值/布尔/时间自动保留类型，查询时可直接比较（`Temp > 80`），优于字符串拼接

> [!example] 完整示例
> **Serilog 结构化日志演示：通过模板语法 {DeviceId} {Temperature} 把变量名保留为结构化字段，可被 ES/Kibana 等直接检索，而非拼进纯文本：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="Serilog 结构化日志" Height="360" Width="480"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="结构化日志模板 {DeviceId} {Temperature}" Foreground="#58A6FF" FontWeight="Bold"/>
>         <Button Content="写入一条结构化温度日志" Click="OnWrite" Margin="0,12,0,0" Padding="8"
>                 Background="#21262D" Foreground="White"/>
>         <TextBlock x:Name="OutputText" Margin="0,12,0,0" Foreground="#8B949E" TextWrapping="Wrap"/>
>         <TextBlock Text="提示：真实项目用 NuGet 安装 Serilog + Serilog.Sinks.File/Console，
>                     Log.Information(\"温度 {Temperature}\", 78.5) 即可自动结构化。"
>                    Foreground="#8B949E" Margin="0,10,0,0" TextWrapping="Wrap" FontSize="11"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码（模拟 Serilog 消息模板）：**
> ```csharp
> using System;
> using System.Windows;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         private void OnWrite(object sender, RoutedEventArgs e)
>         {
>             // 模拟 Serilog 消息模板：花括号 {} 里的名字会作为字段保存
>             string messageTemplate = "设备 {DeviceId} 上报温度 {Temperature:F1}℃";
>             string structured = messageTemplate
>                 .Replace("{DeviceId}", "PLC-01")
>                 .Replace("{Temperature:F1}", "78.5");
>
>             // 真实 Serilog：Log.Information("设备 {DeviceId} 上报温度 {Temperature}", "PLC-01", 78.5);
>             OutputText.Text =
>                 $"模板：{messageTemplate}\n\n" +
>                 $"输出：{structured}\n\n" +
>                 "结构化字段：\n  DeviceId = \"PLC-01\"\n  Temperature = 78.5\n" +
>                 "（可用 ES 按 Temperature > 85 直接检索，无需全文匹配）";
>             OutputText.Foreground = new SolidColorBrush(Color.FromRgb(0x23, 0x86, 0x36));
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 上位机需要"按字段排查"：查某设备、某通道、某时间段的异常（示例场景）
> ✅ 对接日志平台/数据库：Seq、Elasticsearch、SQL Server 直接收结构化数据
> ✅ 日志跨机器汇总：多台上位机日志进统一平台，远程排查（示例 `WriteTo.Seq`）
> ✅ 需要异步高性能日志：采集高频，日志不能拖后腿
> ❌ 只在本机看文本的小工具：`File.AppendAllText` 或 NLog 文本就够
> ❌ 团队不熟悉、无查询平台：结构化日志价值打折，先上文本日志

> [!pitfall] 常见踩坑
> 坑 1：**用字符串拼接代替消息模板** → 现象：`Log.Information($"温度 {temp} 超限 {limit}")` → 原因：习惯了插值 → 解决：用模板 `Log.Information("温度 {Temp} 超限 {Limit}", temp, limit)`——只有模板里的 `{字段}` 才会被结构化捕获
> 
> 坑 2：**忘配 `Serilog.Sinks.File` 导致没日志文件** → 现象：代码跑起来"没反应"，日志没落盘 → 原因：只装了核心包没装 Sink 包 → 解决：`Install-Package Serilog.Sinks.File`/`Serilog.Sinks.Console` 并 `WriteTo.File(...)`
>
> 坑 3：**字段名重复/命名混乱** → 现象：同一字段一会 `Device` 一会 `DeviceId`，查询时对不上 → 原因：模板占位符随意 → 解决：统一字段命名规范（`DeviceId`、`ChannelNo`、`Category`），全局一致

> [!best] 最佳实践
> - 启动时一次配置：`Log.Logger = new LoggerConfiguration().MinimumLevel.Information().WriteTo.Console().WriteTo.File("logs/hmi-.log", rollingInterval: RollingInterval.Day).CreateLogger();`，程序入口调用一次
> - 字段命名统一：`{DeviceId}`、`{Temp}`、`{Channel}`，文档化维护
> - 生产级别 Info 起步：Debug 留开发期，避免高频打点压垮文件写入
> - 敏感数据不记：密码、Token 禁止进日志模板（见 `配置加密与运行时修改`）
> - 与 `Microsoft.Extensions.Logging` 桥接：老代码 `ILogger<T>` 不用改，`AddSerilog()` 即可切换实现

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例代码，观察控制台彩色输出与 `logs/` 目录下按天滚动的日志文件，修改阈值参数看结构化字段变化
> **Lv.2 小试牛刀**：在示例加 `Log.ForContext("DeviceId", id)` 给日志加固定上下文，观察文件输出带 `DeviceId` 字段
> **Lv.3 融会贯通**：配置 `WriteTo.File("logs/hmi-.log", rollingInterval: RollingInterval.Day, retainedFileCountLimit: 7)`，运行后查看多天文件与清理策略
> **Lv.4 拆层挑战**：接入 `Microsoft.Extensions.Logging`：注册 `ILoggerFactory` + `AddSerilog()`，在 ViewModel 注入 `ILogger<T>` 写日志，验证抽象与实现解耦

> [!related] 相关知识链接
> - ← 前置知识：`为什么要用日志`（日志基础）、`nlog-与-log4net`（其他日志库对比）
> - → 后续必学：`全局异常捕获与记录`（异常进日志）、`上位机日志场景`（日志分类）
> - ⇄ 关联概念：第 7 章 `什么是依赖注入`（ILogger 注入）、第 8 章（异步日志线程）
> - 📖 官方文档：Serilog：https://serilog.net/ ；Serilog GitHub：https://github.com/serilog/serilog ；.NET 日志桥接：https://learn.microsoft.com/zh-cn/dotnet/core/extensions/logging
