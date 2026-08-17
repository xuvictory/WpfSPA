---
title: Serilog
section: 16-resources
parent: 16.1 GitHub 优质 WPF 开源项目
---

# Serilog

> [!plain] 白话理解
> 上位机跑在现场，出问题不能"打断点"——这时**日志**就是你的"黑匣子"。传统日志是"拼字符串"（`"温度超限: " + temp`），查问题时只能靠人眼翻文本。**Serilog** 的思路是把日志当"结构化事件"记：`设备=1号泵、温度=132、级别=Error` 是独立的键值对字段，之后不但能按级别筛，还能按设备号、温度范围精确检索。简单说，它让日志从"流水账"变成"数据库"，排查现场问题效率翻倍。

> [!def] 官方定义
> **Serilog** 是一个**社区开源**的 .NET **结构化日志库**（GitHub：https://github.com/serilog/serilog ，NuGet：`Serilog`），由 Nicholas Blumhardt 于 2013 年创建。它的核心模型是"日志事件 = 消息模板 + 命名属性"：`Log.Information("设备 {Device} 温度 {Temp}", device, temp)` 中 `{Device}`、`{Temp}` 占位符会被解析为结构化字段，而非简单的字符串拼接。日志输出通过 **Sink** 插件化扩展（官方与社区提供 `Serilog.Sinks.Console`、`Serilog.Sinks.File`、`Serilog.Sinks.Seq`、`Serilog.Sinks.EventLog` 等），可同时写多个目标。它**不是微软官方库**，但被 .NET 官方文档引用为日志首选方案之一（见 https://learn.microsoft.com/zh-cn/dotnet/core/extensions/logging 与微软官方 `Microsoft.Extensions.Logging` 对比文档 https://learn.microsoft.com/zh-cn/dotnet/core/extensions/logging-providers ）。详细用法见第 12 章 `serilog-结构化日志`。

> [!origin] 由来背景
> 在 Serilog 出现前，.NET 主流日志库（log4net、NLog）都以"文本消息"为中心，日志内容靠开发者在日志语句里拼字符串，检索与统计困难。Nicholas Blumhardt（新西兰资深 .NET 开发者，曾参与 Autofac 等著名开源项目）在 **2013 年**提出"以结构化事件为中心"的理念并发布 Serilog，立刻在 .NET 社区引发关注；2016 年起微软官方文档也开始推荐结构化日志。如今 Serilog 已成为 .NET 生态最流行的日志库之一。上位机行业用它记录设备报警、通信异常、启停事件，配合 Seq 等可视化工具实现"现场日志可检索、可统计"。

> [!essentials] 核心要点
> - **消息模板**：`Log.Information("设备 {Device} 启动", name)` —— `{Device}` 成为独立字段
> - **日志级别**：`Verbose < Debug < Information < Warning < Error < Fatal`，用 `MinimumLevel` 控制
> - **Sink 配置**：`new LoggerConfiguration().WriteTo.Console()/WriteTo.File(path, rollingInterval: RollingInterval.Day)` 链式配置
> - **静态入口**：配置后赋给 `Log.Logger`，全局用 `Log.Information`/`Log.Error` 即可
> - **滚动文件**：`rollingInterval: RollingInterval.Day` 按天生成 `alarm-20260818.log`，便于归档
> - **异常记录**：`Log.Error(ex, "读取寄存器失败，从站 {Slave}", slave)` 自动捕获堆栈与上下文
> - **Enricher**：`Enrich.WithProperty("Machine", "S1")` 给每条日志附加机器/工序等公共字段

> [!example] 完整示例
> **Serilog 结构化日志：报警与运行日志写入演示：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="Serilog 演示" Height="400" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="Serilog 结构化日志" Foreground="#58A6FF" FontWeight="Bold" Margin="0,0,0,10"/>
>         <Button Content="写入报警日志" Click="OnAlarmClick" Margin="0,0,0,8" Padding="8"
>                 Background="#DA3633" Foreground="White"/>
>         <Button Content="写入运行日志" Click="OnInfoClick" Margin="0,0,0,8" Padding="8"
>                 Background="#21262D" Foreground="White"/>
>         <TextBlock x:Name="StatusText" Foreground="#8B949E" Margin="0,4,0,8" TextWrapping="Wrap"/>
>         <Border Background="#161B22" Padding="8" CornerRadius="6">
>             <TextBox x:Name="LogBox" Height="150" IsReadOnly="True" TextWrapping="Wrap"
>                      Background="#161B22" Foreground="#8B949E" BorderThickness="0"/>
>         </Border>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.IO;
> using System.Windows;
> using Serilog;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         // 需通过 NuGet 安装 Serilog 与 Serilog.Sinks.File 包
>         public MainWindow()
>         {
>             InitializeComponent();
>
>             // MessageTemplate 中的 {Device}、{Temp} 占位符会记录为独立字段
>             Log.Logger = new LoggerConfiguration()
>                 .MinimumLevel.Debug()
>                 .WriteTo.File(Path.Combine(AppContext.BaseDirectory, "logs", "alarm-.log"),
>                               rollingInterval: RollingInterval.Day)
>                 .CreateLogger();
>         }
>
>         private void OnAlarmClick(object sender, RoutedEventArgs e)
>         {
>             // 记录带设备编号与数值的结构化报警日志
>             Log.Error("设备 {Device} 报警：温度 {Temp}℃ 超限", "1 号泵", 132);
>             AppendLog("已写入 Error 级报警日志（含设备编号、温度字段）");
>         }
>
>         private void OnInfoClick(object sender, RoutedEventArgs e)
>         {
>             Log.Information("设备 {Device} 正常启动", "2 号泵");
>             AppendLog("已写入 Info 级运行日志");
>         }
>
>         private void AppendLog(string message)
>         {
>             LogBox.Text = DateTime.Now.ToString("HH:mm:ss ") + message + "\n" + LogBox.Text;
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 设备报警、通信异常等需要"按设备/数值检索"的现场日志
> ✅ 按天滚动归档、长期保存的运行记录
> ✅ 对接 Seq/Kibana 等可视化日志平台的规模化项目
> ✅ 需要把日志同时写文件 + 事件日志 + 数据库的项目
> ❌ 极简工具、只需控制台输出的场景（可直接 `WriteTo.Console`，不必引入完整配置）
> ❌ 已有团队统一的日志中间件且无迁移计划的存量系统

> [!pitfall] 常见踩坑
> 坑 1：**日志不写文件** → 现象：程序运行后 `logs` 目录为空 → 原因：忘记 `CreateLogger()` 并赋给 `Log.Logger`，或目录无写权限 → 解决：确认 `Log.Logger = config.CreateLogger()` 已执行；日志目录放在 `AppContext.BaseDirectory` 下并检查权限
>
> 坑 2：**大量高频日志拖慢程序** → 现象：每 10ms 写一条日志，界面与采集明显卡顿 → 原因：日志量过大且同步写磁盘 → 解决：降低高频日志级别为 `Debug` 并用 `MinimumLevel` 过滤；生产环境限制滚动文件大小（`fileSizeLimitBytes`）与保留天数（`retainedFileCountLimit`）
>
> 坑 3：**字符串拼接导致字段丢失** → 现象：`Log.Information("温度 " + temp)` 查询时没有温度字段 → 原因：用了字符串拼接而不是消息模板 → 解决：统一写成 `Log.Information("温度 {Temp}", temp)`，让占位符成为结构化字段

> [!best] 最佳实践
> - 关键上下文一律用 `{占位符}` 传参，禁止字符串拼接日志内容
> - 报警、异常用 `Error` 级，日常运行用 `Information`，高频采集用 `Debug`，按需过滤
> - 用 `Enrich.WithProperty("Machine", 机器号)` 给全场日志附加公共字段，按站点检索
> - 日志路径与滚动策略集中配置（可放 `appsettings.json` 或启动时统一创建），不要散落各处
> - 通信层（`nmodbus`/`mqttnet`）的收发帧记 `Debug` 级，现场排查协议问题时再打开

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行本节示例，把日志文件滚动间隔改成 `RollingInterval.Hour`，观察文件命名变化
> **Lv.2 小试牛刀**：给示例加 `Enrich.WithProperty("Machine", "S1")`，查看日志里多出的字段
> **Lv.3 融会贯通**：在 `nmodbus` 的读取方法里加 `Debug` 级收发日志，用调试级别追踪协议报文
> **Lv.4 拆层挑战**：为上位机搭建完整日志体系：`Serilog` + 按天/按大小滚动 + 异常全局兜底（结合 12 章 `全局异常捕获与记录`），并用 Seq 做可视化检索

> [!related] 相关知识链接
> - ← 前置知识：第 12 章 [`serilog-结构化日志`](serilog-结构化日志)、[`上位机日志场景`](上位机日志场景)
> - → 后续必学：[`日志与工具类-nuget-包`](日志与工具类-nuget-包)（NLog/log4net 对比）
> - ⇄ 关联概念：[`nmodbus`](nmodbus)、[`mqttnet`](mqttnet)（通信层日志）
> - 📖 官方文档：https://github.com/serilog/serilog ；Sink 清单：https://github.com/serilog/serilog/wiki/Provided-Sinks
