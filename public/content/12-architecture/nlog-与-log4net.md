---
title: NLog 与 Log4Net
section: 12-architecture
parent: 12.6 日志系统
---

# NLog 与 Log4Net

> [!plain] 白话理解
> NLog 和 log4net 是 .NET 界的**"两个老牌日志仓库"**：老项目（尤其 .NET Framework 上位机）里遍地都是。它们都支持"级别 + 输出目标（文件/控制台/数据库）+ 格式"三段式配置。NLog 灵活现代、上手快；log4net 稳定老旧、Java log4j 血统。你维护老上位机时大概率碰到其中一个——会配置会迁移即可，新项目优先 Serilog（见 `serilog-结构化日志`）。

> [!def] 官方定义
> **NLog** 是开源 .NET 日志库（NuGet：`NLog`、`NLog.Extensions.Logging`），以高性能、灵活路由（rules）、自动归档著称，支持 `LogManager.GetCurrentClassLogger()` 与结构化日志：https://nlog-project.org/ 。**log4net** 是 Apache Log4j 的 .NET 移植版（NuGet：`log4net`），采用"Logger + Appender + Layout"三件套，通过 `log4net.Config.XmlConfigurator.Configure()` 从配置文件（`log4net` 节）初始化：https://logging.apache.org/log4net/ 。两者都可接入 `Microsoft.Extensions.Logging` 桥接包。它们属第三方开源库，非微软官方组件。

> [!origin] 由来背景
> 日志框架的现代形态始于 Java 的 **Log4j 1.x（2001 年，Ceki Gülcü 发起）**——"级别/Appender/Layout"三要素与 XML 配置由此成为业界标准。**log4net** 于 2004 年移植到 .NET，是 .NET 最早成熟的日志库；**NLog** 2004 年由 Jarek Kowalski 创建，目标更轻量高效，支持 C# 内联配置与文件规则。两者称雄 .NET Framework 十余年，大量工业上位机、传统 Web 项目使用至今。2013 年 Serilog 带来结构化日志，2019 年微软统一 `Microsoft.Extensions.Logging` 抽象，新项目逐渐转向 Serilog/抽象接口，但存量代码与老文档中 NLog/log4net 仍极常见。

> [!essentials] 核心要点
> - **NLog 用法**：`var logger = LogManager.GetCurrentClassLogger();` + `logger.Info("...")`；`NLog.config` 里配 targets（文件/控制台）与 rules（级别路由）
> - **log4net 用法**：`XmlConfigurator.Configure()` + `LogManager.GetLogger(typeof(X))`；`log4net` 配置节里配 appender/layout
> - **共同概念**：Level（级别）、Target/Appender（输出）、Layout（格式：`%date %level %logger %message`）
> - **文件归档**：按大小/日期滚动：NLog `archiveEvery="Day"`、log4net `RollingFileAppender`（`RollingStyle="Date"`）
> - **选择建议**：老 .NET Framework 项目 NLog 优先（活跃维护）；新项目直接用 `serilog-结构化日志`

> [!example] 完整示例
> **NLog 使用演示：安装 NLog 包后，通过 Logger 输出不同级别日志，可同时写到控制台与文件（此处用内置文本日志器模拟 NLog 的 API 风格）：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="NLog 风格日志" Height="360" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="NLog 用法（Trace/Debug/Info/Warn/Error）" Foreground="#58A6FF" FontWeight="Bold"/>
>         <Button Content="写入五种级别日志" Click="OnWrite" Margin="0,12,0,0" Padding="8"
>                 Background="#21262D" Foreground="White"/>
>         <TextBlock x:Name="OutputText" Margin="0,12,0,0" Foreground="#8B949E" TextWrapping="Wrap"/>
>         <TextBlock Text="提示：真实项目中先 NuGet 安装 NLog + NLog.Config，
>                     再配置 nlog.config 即可使用相同 API。" Foreground="#8B949E" Margin="0,10,0,0"
>                    TextWrapping="Wrap" FontSize="11"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码（API 与 NLog 一致的简化实现）：**
> ```csharp
> using System;
> using System.IO;
> using System.Windows;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     // 模拟 NLog：Logger 实例 + Trace/Debug/Info/Warn/Error 方法
>     public class NLogLikeLogger
>     {
>         public void Trace(string msg) => Write("TRACE", msg, 0x8B, 0x94, 0x9E);
>         public void Debug(string msg) => Write("DEBUG", msg, 0x8B, 0x94, 0x9E);
>         public void Info(string msg) => Write("INFO", msg, 0x23, 0x86, 0x36);
>         public void Warn(string msg) => Write("WARN", msg, 0x8B, 0x94, 0x9E);
>         public void Error(string msg) => Write("ERROR", msg, 0xDA, 0x36, 0x33);
>
>         private void Write(string level, string msg, byte r, byte g, byte b)
>             => File.AppendAllText("nlog-demo.log", $"[{DateTime.Now:HH:mm:ss}] [{level}] {msg}\n");
>     }
>
>     public partial class MainWindow : Window
>     {
>         // 真实 NLog 中：private static readonly Logger logger = LogManager.GetCurrentClassLogger();
>         private readonly NLogLikeLogger _logger = new NLogLikeLogger();
>
>         public MainWindow() => InitializeComponent();
>
>         private void OnWrite(object sender, RoutedEventArgs e)
>         {
>             _logger.Trace("打开设备串口");
>             _logger.Debug("读取配置：波特率 9600");
>             _logger.Info("设备连接成功");
>             _logger.Warn("温度接近上限 84.2℃");
>             _logger.Error("第 3 次握手失败，设备离线");
>
>             OutputText.Text = "已按 TRACE→DEBUG→INFO→WARN→ERROR 顺序写入 5 条日志\n" +
>                               "（保存至 nlog-demo.log，对应 NLog 的日志级别）";
>             OutputText.Foreground = new SolidColorBrush(Color.FromRgb(0x23, 0x86, 0x36));
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 维护 .NET Framework 老上位机：项目已在用 NLog/log4net，升级成本高
> ✅ 老代码 + 老配置：已有 `NLog.config`/`log4net` 节与大量 `logger.Info` 调用
> ✅ 需要轻量文本日志且不想引大框架：NLog 配置简单、体积小
> ✅ 团队习惯 NLog 语法：性能与 Serilog 相当，文本日志完全够用
> ❌ 新项目首选结构化：需要字段查询/对接平台用 Serilog（见 `serilog-结构化日志`）
> ❌ 需要跨平台现代 .NET 生态的强集成：老库对新 API 支持滞后

> [!pitfall] 常见踩坑
> 坑 1：**NLog 配置了但没加载** → 现象：日志不输出，代码静默空转 → 原因：没把 `NLog.config` 设为"内容复制到输出目录"，或忘调 `LogManager.Setup().LoadConfigurationFromFile()` → 解决：VS 里右键 `NLog.config` → 属性 → 复制到输出目录；启动时确认配置加载并打一条测试日志
> 
> 坑 2：**log4net 未 `XmlConfigurator.Configure()`** → 现象：`GetLogger` 返回但什么都不写 → 原因：没执行初始化 → 解决：程序入口调用一次 `log4net.Config.XmlConfigurator.Configure(ConfigFile: "log4net.config")`（可用 `[assembly: log4net.Config.XmlConfigurator(Watch = true)]` 特性自动配置）
>
> 坑 3：**Appender 路径用相对路径丢失** → 现象：发布后找不到日志文件 → 原因：相对路径基于工作目录 → 解决：NLog `basedir`（`${basedir}/logs/hmi.log`）；log4net 用 `AppDomain.CurrentDomain.BaseDirectory` 拼接

> [!best] 最佳实践
> - 老项目保持原框架，新模块也不混用：日志库统一，避免 NLog + Serilog 双写两套文件
> - 配置文件复制到输出目录：`NLog.config`/`log4net.config` 属性设为"始终复制"
> - 按天滚动 + 保留策略：NLog `archiveEvery="Day" maxArchiveFiles="30"`；log4net `RollingStyle="Date" maxSizeRollBackups`
> - 用 `ILogger<T>` 抽象隔离：即使底层是 NLog/log4net，业务代码也走抽象，将来可换（见 `为什么要用日志`）
> - 迁移到 Serilog 时保留字段语义：`${logger}`→模板 `{SourceContext}`，文本转结构化是渐进过程

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例代码，观察 NLog 与 log4net 各自输出到控制台/文件，比较两种配置文件的写法
> **Lv.2 小试牛刀**：给 NLog 配置加"按天归档"：`archiveEvery="Day"` + `maxArchiveFiles="7"`，连续运行/改系统日期验证归档
> **Lv.3 融会贯通**：把 log4net 的 Appender 改成"数据库"（`AdoNetAppender`，连接 SQLite），日志写入表，验证可查询
> **Lv.4 拆层挑战**：为两种框架写统一封装 `ILogService`（`Info/Error` 方法），底层分别用 NLog/log4net 实现，切换实现验证业务代码零修改

> [!related] 相关知识链接
> - ← 前置知识：`为什么要用日志`（日志基础概念）、`传统-appconfig-方式`（老配置体系）
> - → 后续必学：`serilog-结构化日志`（现代替代方案）
> - ⇄ 关联概念：`全局异常捕获与记录`（异常进 NLog/log4net）、`上位机日志场景`（分类落地）
> - 📖 官方文档：NLog：https://nlog-project.org/ ；Apache log4net：https://logging.apache.org/log4net/
