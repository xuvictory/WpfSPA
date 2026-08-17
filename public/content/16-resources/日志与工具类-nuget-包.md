---
title: 日志与工具类 NuGet 包
section: 16-resources
parent: 16.6 常用 NuGet 包清单
---

# 日志与工具类 NuGet 包

> [!plain] 白话理解
> 现场出问题查不到原因，是上位机最头疼的事。**日志类包**（Serilog/NLog）负责把"发生了什么"记下来，**工具类包**（Polly/反射等）负责让代码更健壮、更省事。装上它们，就像给程序装了"黑匣子"和"工具箱"——出问题有据可查，写代码少造轮子。

> [!def] 官方定义
> **日志与工具类 NuGet 包**是 .NET 生态中**日志记录**与**通用工具**方向的库集合（NuGet 检索：https://www.nuget.org/ ）。常用清单：
> - **Serilog**（NuGet：`Serilog` + `Serilog.Sinks.File` 等）：结构化日志库，消息模板 + 命名属性 + Sink 输出（见 `serilog` 篇与 12 章 `serilog-结构化日志`）
> - **NLog**（NuGet：`NLog`）：老牌日志库，配置文件驱动的多目标输出（文件/事件日志/数据库）
> - **log4net**（NuGet：`log4net`）：Apache 出品的经典日志库，老项目沿用多
> - **Polly**（NuGet：`Polly`）：弹性策略库，重试/熔断/超时，通信不稳时的"安全带"
> - **FluentValidation**（NuGet：`FluentValidation`）：链式校验规则库，参数/配方表单校验
> - **AutoMapper**（NuGet：`AutoMapper`）：对象映射库，DTO/实体互转少写样板
> - **TimeProvider / 内建工具**（微软官方）：.NET 8+ 内建时间抽象等，优先用官方能力
>
> 日志库均为第三方开源（微软官方提供 `Microsoft.Extensions.Logging` 抽象，见 https://learn.microsoft.com/zh-cn/dotnet/core/extensions/logging ），工具类库按需选用，避免过度引入。

> [!origin] 由来背景
> .NET 日志生态经历了 log4net（2001 年，Apache 移植）→ NLog（2006 年，配置驱动）→ Serilog（2013 年，结构化事件）三代演进；**Serilog 的结构化理念**让日志可检索、可统计，成为新一代首选。工具库方面：**Polly**（2013 年前后，英国开发者 Michael Wolfenden 创建）解决"外部依赖不稳"的弹性重试；**FluentValidation**（2010 年前后）把校验从 `if` 堆砌变成声明式规则。上位机行业组合使用"Serilog 记日志 + Polly 做通信重试 + FluentValidation 校验参数"，显著提升现场稳定性。

> [!essentials] 核心要点
> - **日志选型**：新项目首选 `Serilog`（结构化、生态全），老项目延续 `NLog`/`log4net` 不要强行迁移
> - **Sink 组合**：文件（`Serilog.Sinks.File` 按天滚动）+ 必要时 Seq/数据库
> - **Polly 重试**：`Policy.Handle<TimeoutException>().WaitAndRetryAsync(3, i => TimeSpan.FromMilliseconds(500))` 包装通信调用
> - **校验规则**：`AbstractValidator<T>` + `RuleFor(x => x.Temp).GreaterThan(0).LessThan(200)`
> - **映射**：`CreateMap<Entity, Dto>()` + `IMapper.Map`，接口层与实体层解耦
> - **官方优先**：.NET 8 的 `TimeProvider`、`Microsoft.Extensions.*` 能解决的不引第三方

> [!example] 完整示例
> **日志工具类库：Serilog 文件日志与异常记录演示：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="日志工具演示" Height="420" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="Serilog 日志记录演示" Foreground="#58A6FF" FontWeight="Bold" Margin="0,0,0,10"/>
>         <StackPanel Orientation="Horizontal" Margin="0,0,0,8">
>             <TextBlock Text="操作内容：" Foreground="#8B949E" VerticalAlignment="Center"/>
>             <TextBox x:Name="ActionBox" Text="启动 1 号泵" Width="180" Margin="4,0,0,0"
>                      Background="#0D1117" Foreground="White" BorderBrush="#21262D"/>
>         </StackPanel>
>         <Button Content="记录日志" Click="OnLogClick" Margin="0,0,0,8" Padding="8"
>                 Background="#21262D" Foreground="White"/>
>         <Button Content="模拟异常" Click="OnErrorClick" Margin="0,0,0,8" Padding="8"
>                 Background="#DA3633" Foreground="White"/>
>         <TextBlock x:Name="StatusText" Foreground="#8B949E" Margin="0,4,0,8" TextWrapping="Wrap"/>
>         <Border Background="#161B22" Padding="8" CornerRadius="6">
>             <TextBox x:Name="LogPreview" Height="140" IsReadOnly="True" TextWrapping="Wrap"
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
> using System.Linq;
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
>             // 配置：日志写入 logs 目录下的滚动文件，每天一个
>             Log.Logger = new LoggerConfiguration()
>                 .MinimumLevel.Information()
>                 .WriteTo.File(Path.Combine(AppContext.BaseDirectory, "logs", "hmi-.log"),
>                               rollingInterval: RollingInterval.Day)
>                 .CreateLogger();
>         }
>
>         private void OnLogClick(object sender, RoutedEventArgs e)
>         {
>             Log.Information("操作记录：{Action}", ActionBox.Text);
>             StatusText.Text = "已写入一条 Info 日志";
>             RefreshPreview();
>         }
>
>         private void OnErrorClick(object sender, RoutedEventArgs e)
>         {
>             // 模拟一次异常并记录 Error 级别日志（含堆栈）
>             try
>             {
>                 throw new InvalidOperationException("设备响应超时");
>             }
>             catch (Exception ex)
>             {
>                 Log.Error(ex, "设备通信异常");
>                 StatusText.Text = "已写入一条 Error 日志：" + ex.Message;
>             }
>             RefreshPreview();
>         }
>
>         private void RefreshPreview()
>         {
>             // 展示日志文件中最新的内容（生产环境可用日志推送组件做实时展示）
>             var dir = Path.Combine(AppContext.BaseDirectory, "logs");
>             if (!Directory.Exists(dir)) return;
>             var file = Directory.GetFiles(dir, "*.log").FirstOrDefault();
>             if (file != null)
>             {
>                 LogPreview.Text = File.ReadLines(file).LastOrDefault() ?? "";
>             }
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 现场问题排查（报警、通信异常、操作留痕）
> ✅ 通信不稳时用 Polly 自动重试，减少人工干预
> ✅ 配方/参数表单校验（FluentValidation）
> ✅ 接口 DTO 与实体互转（AutoMapper）
> ✅ 系统对接 .NET 8+ 官方抽象（TimeProvider 等）
> ❌ 极简小工具（日志一条 `Debug.WriteLine` 就够时不必上库）
> ❌ 与团队既有日志方案重复的场景（先统一技术栈）

> [!pitfall] 常见踩坑
> 坑 1：**日志忘配 Sink，写哪都不知道** → 现象：调用 `Log.Information` 但哪都没输出 → 原因：没装 Sink 包或没配 `WriteTo.File` → 解决：确认 `Serilog.Sinks.File` 已安装且 `LoggerConfiguration` 配置完整
>
> 坑 2：**Polly 重试掩盖真实故障** → 现象：设备彻底离线，还一直重试刷屏 → 原因：无限重试无退避无上限 → 解决：设重试次数上限 + 指数退避 + 超时策略组合，重试后仍失败要上报界面/日志
>
> 坑 3：**AutoMapper 映射配置错导致静默丢字段** → 现象：DTO 某些字段始终为默认值 → 原因：未注册 `CreateMap` 或属性名不一致 → 解决：映射关系集中 `Profile` 注册，单测验证关键字段映射结果

> [!best] 最佳实践
> - 日志体系与 12 章 `serilog-结构化日志`/`上位机日志场景` 对齐：级别规范、滚动策略、公共字段
> - 通信调用统一包一层 Polly 策略（重试 3 次 + 500ms 退避 + 超时），一处配置全局生效
> - 表单校验用 FluentValidation 写规则类，界面绑定 `INotifyDataErrorInfo` 显示错误
> - 工具类包"按需引入"：能用官方/内置解决的不加依赖，保持项目精简
> - 引入新工具包前先评估学习成本与维护风险，避免"包山包海"

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行本节示例，把日志滚动间隔改成按小时，观察文件命名变化
> **Lv.2 小试牛刀**：用 Polly 给示例的"模拟异常"加重试 2 次的策略，观察重试日志
> **Lv.3 融会贯通**：给 `nmodbus` 的读取调用包上 Polly 重试 + Serilog 日志，模拟断线重连
> **Lv.4 拆层挑战**：搭建"日志 + 重试 + 校验"公共基础设施：Serilog 全局配置、Polly 策略注册、FluentValidation 规则示例，并写单测验证重试次数与校验结果

> [!related] 相关知识链接
> - ← 前置知识：[`serilog`](serilog)、第 12 章 `上位机日志场景`/`serilog-结构化日志`
> - → 后续必学：[`visual-studio-2022-与-resharper`](visual-studio-2022-与-resharper)（开发效率工具）
> - ⇄ 关联概念：[`数据类-nuget-包`](数据类-nuget-包)、[`mvvm-与通信类-nuget-包`](mvvm-与通信类-nuget-包)
> - 📖 官方文档：日志抽象 https://learn.microsoft.com/zh-cn/dotnet/core/extensions/logging ；NuGet：https://www.nuget.org/
