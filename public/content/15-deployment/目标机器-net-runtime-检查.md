---
title: 目标机器 .NET Runtime 检查
section: 15-deployment
parent: 15.2 部署注意事项
---

# 目标机器 .NET Runtime 检查

> [!plain] 白话理解
> 部署前先给"目标机器体检"，就像出远门前检查车况：油箱（.NET 运行时）有没有油、发动机（CPU 架构）对不对得上、路况（Windows 版本）能不能走。程序写好要交付，不能想当然"客户机器肯定有 .NET"——现场见过太多"双击没反应"的翻车现场。花一分钟做运行时检查，把"能不能跑"变成一行明确提示，交付时心里有底。

> [!def] 官方定义
> **目标机器 .NET Runtime 检查**：部署前确认目标机满足运行条件的探测过程，核心是 .NET 运行时与 CPU 架构。现代 .NET 提供 `RuntimeInformation`（`System.Runtime.InteropServices`）：`FrameworkDescription` 返回当前运行时描述（如 `.NET 8.0.0`）、`ProcessArchitecture`/`OSArchitecture` 返回 x64/Arm64 架构；`Environment.Version` 返回 CLR 版本；.NET Framework 4.x 需查注册表 `SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full` 的 `Version` 值。官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.runtime.interopservices.runtimeinformation

> [!origin] 由来背景
> .NET Framework 时代运行时装在系统里，程序"能不能跑"取决于目标机装了哪个版本框架，现场常现"装了 4.5 的程序在只有 4.0 的机器上罢工"。.NET Core（2016 年）带来框架依赖与独立发布两种新形态后，运行时检查从"版本是否齐全"升级为"运行时是否存在 + 架构是否匹配 + OS 是否支持"三个维度。微软为此提供 `dotnet --list-runtimes`（命令行）与 `RuntimeInformation`（API）两套探测手段；`apphost` 启动器还会在缺运行时或架构不符时直接弹窗提示，把"未知的翻车"变成"已知的报错"。

> [!essentials] 核心要点
> - **运行时探测**：`RuntimeInformation.FrameworkDescription` 一行拿到当前 .NET 运行时与版本；`Environment.Version` 拿 CLR 版本
> - **架构匹配**：`ProcessArchitecture` / `OSArchitecture` 确认 x64 / Arm64，独立发布产物必须与目标机架构一致（见 `框架依赖-vs-独立部署比较`）
> - **系统版本**：`RuntimeInformation.OSDescription` 读取 OS 版本，判断是否满足 .NET 最低 OS 要求（如 .NET 8 需 Win10/Server 2016+）
> - **Framework 4.x**：老项目用注册表 `NDP\v4\Full` 的 `Version` 值判断 4.x 是否达标（示例代码已演示）
> - **两种用法**：开发期用 `dotnet --list-runtimes` 自查；交付期把检查逻辑写进程序启动自检，不达标给用户明确提示

> [!example] 完整示例
> **运行环境体检：RuntimeInformation 读取框架/架构/系统信息、注册表查询 .NET Framework 版本、给出部署要求判定：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="目标机器 .NET Runtime 检查" Height="440" Width="560"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="运行环境体检" FontSize="18" FontWeight="Bold"
>                    Foreground="#58A6FF" Margin="0,0,0,10"/>
>         <Border Background="#161B22" Padding="12" CornerRadius="6" Margin="0,0,0,10">
>             <StackPanel>
>                 <TextBlock x:Name="TxtFramework" Foreground="#8B949E" Margin="0,2"/>
>                 <TextBlock x:Name="TxtVersion" Foreground="#8B949E" Margin="0,2"/>
>                 <TextBlock x:Name="TxtArch" Foreground="#8B949E" Margin="0,2"/>
>                 <TextBlock x:Name="TxtOs" Foreground="#8B949E" Margin="0,2"/>
>                 <TextBlock x:Name="TxtCheck" Foreground="#8B949E" Margin="0,2" TextWrapping="Wrap"/>
>             </StackPanel>
>         </Border>
>         <Button Content="重新体检" Click="OnCheckClick" Padding="8"
>                 Background="#21262D" Foreground="White"/>
>         <TextBlock x:Name="TxtRequire" Foreground="#58A6FF" TextWrapping="Wrap" Margin="0,10,0,0"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Runtime.InteropServices;
> using System.Windows;
> using Microsoft.Win32;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow()
>         {
>             InitializeComponent();
>             Loaded += (_, _) => OnCheckClick(null, null);
>         }
>
>         private void OnCheckClick(object sender, RoutedEventArgs e)
>         {
>             try
>             {
>                 // RuntimeInformation：获取当前进程运行时的框架描述、进程架构与系统架构
>                 TxtFramework.Text = "框架：" + RuntimeInformation.FrameworkDescription;
>                 TxtVersion.Text = "CLR 版本：" + Environment.Version;
>                 TxtArch.Text = "进程架构：" + RuntimeInformation.ProcessArchitecture +
>                     "　系统架构：" + RuntimeInformation.OSArchitecture;
>                 TxtOs.Text = "操作系统：" + RuntimeInformation.OSDescription;
>
>                 // 注册表查询 .NET Framework 4.x 版本（仅作展示；框架依赖发布可据此判断目标机是否达标）
>                 string installed = "未安装/未记录";
>                 using (RegistryKey ndp = Registry.LocalMachine.OpenSubKey(
>                     @"SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full"))
>                 {
>                     if (ndp?.GetValue("Version") is string v)
>                         installed = v;
>                 }
>                 TxtCheck.Text = "注册表检测 .NET Framework 4.x：" + installed;
>                 TxtRequire.Text = "部署要求：框架依赖发布需目标机安装 .NET 6.0+ Runtime；独立发布无需安装运行时。";
>             }
>             catch (Exception ex)
>             {
>                 MessageBox.Show("体检失败：" + ex.Message, "环境检查");
>             }
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ FDD（框架依赖）发布交付前：确认目标机装了匹配的 .NET 运行时，避免"双击没反应"（见 `框架依赖-vs-独立部署比较`）
> ✅ 现场排障第一步：客户报"程序起不来"，先跑体检工具拿到运行时/架构/OS 三项事实再判断
> ✅ 老版本 Windows 的兼容性确认：工控机常是 Win7/Win10 LTSC，先确认 .NET 最低 OS 要求是否满足
> ✅ 大批量部署前的机器普查：给巡检脚本加运行时探测，批量收集"哪些机器缺运行时"
> ❌ SCD（独立发布）且目标机架构已知的场景：产物自带运行时，无需再查运行时，但架构仍要确认
> ❌ 在线升级、容器化等运行时由平台托管的场景：探测意义不大，交给平台层处理

> [!pitfall] 常见踩坑
> 坑 1：**把"装了 .NET Framework"当成"装了 .NET"** → 现象：Win7 自带 .NET Framework 4.x，以为万事大吉，结果 .NET 6/8 的程序仍无法启动 → 原因：.NET（Core 及以后）与 .NET Framework 是两套独立运行时 → 解决：区分检查"现代 .NET 运行时"（`RuntimeInformation.FrameworkDescription` 或 `dotnet --list-runtimes`）与".NET Framework 4.x"（注册表）
>
> 坑 2：**32 位进程跑在 64 位系统上误判架构** → 现象：`OSArchitecture` 是 X64 但 `ProcessArchitecture` 是 X86，架构检查"通过"实际兼容性存疑 → 原因：AnyCPU 编译在 64 位系统上可能仍以 32 位运行（目标平台 X86 或 Prefer32Bit） → 解决：独立发布时确认 RID 与目标平台（win-x64），进程架构以 `ProcessArchitecture` 为准
>
> 坑 3：**FDD 程序启动即崩，来不及自检** → 现象：运行时缺失时 apphost 直接弹"找不到 .NET"，写在 `OnStartup` 里的检查根本没机会跑 → 原因：检查代码需要运行时才能执行，缺运行时自然执行不到 → 解决：缺运行时靠 apphost 报错兜底 + 发布目录附带运行时安装指引；自检用于"运行时存在但版本/架构不满足"的精细判断

> [!best] 最佳实践
> - 把"目标机环境"列成交付清单：OS 版本、CPU 架构、.NET 运行时，随程序一起交给客户（见 `框架依赖-vs-独立部署比较`）
> - 启动自检只做"轻量提示"：检测失败弹窗给出明确指引（装哪个运行时、去哪下载），不要自行阻塞或静默退出
> - 用 `dotnet --list-runtimes` 兜底排查：现场命令行一敲就知道装了哪些运行时，比 GUI 面板更直接
> - 架构确认放在选型期：发布前先确认目标机是 x64 还是 Arm64，别到交付才发现 RID 打错了
> - 检查代码保持独立可复用：封装成 `EnvironmentChecker` 工具类，多个项目共用，体检逻辑一处维护

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例程序，观察 `FrameworkDescription` / `ProcessArchitecture` / `OSDescription` 三项输出，对照你机器的实际配置
> **Lv.2 小试牛刀**：在示例基础上增加"版本判定"：解析 `FrameworkDescription` 中的主版本号，≥ 6 提示"满足"，否则提示"需安装运行时"
> **Lv.3 融会贯通**：用 `dotnet --list-runtimes` 对比示例输出，确认两种探测手段结果一致
> **Lv.4 拆层挑战**：把检查逻辑封装成 `EnvironmentChecker` 类并在启动时（`OnStartup`）调用：运行时缺失→提示安装；版本不足→提示升级；架构不符→提示换包

> [!related] 相关知识链接
> - ← 前置知识：`框架依赖-vs-独立部署比较`（先决定 FDD 还是 SCD，才知道要检查什么）
> - → 后续必学：`依赖项打包与配置文件`（检查通过后，把运行时安装包/配置一起随发布分发）
> - ⇄ 关联概念：`独立发布与单文件发布`（SCD 免检查运行时的另一条路）、`开机自启动设置`（自检通过后开机拉起）
> - 📖 官方文档：RuntimeInformation 类：https://learn.microsoft.com/zh-cn/dotnet/api/system.runtime.interopservices.runtimeinformation ；.NET 运行时下载：https://dotnet.microsoft.com/zh-cn/download/dotnet ；dotnet --list-runtimes：https://learn.microsoft.com/zh-cn/dotnet/core/tools/dotnet-list-runtimes
