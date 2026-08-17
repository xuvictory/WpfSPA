---
title: 框架依赖 vs 独立部署比较
section: 15-deployment
parent: 15.1 发布方式
---

# 框架依赖 vs 独立部署比较

> [!plain] 白话理解
> 选框架依赖还是独立发布，像选"住酒店还是带帐篷"：住酒店（框架依赖）轻装出发，但目的地必须"有房"（装了 .NET）；带帐篷（独立发布）什么都自己背，体积大但哪里都能扎营。上位机交付的经典选择题就是它：客户机器千奇百怪，统一装运行时不可控，那就独立发布图省心；内网带宽紧张、想共用机器上的运行时，那就框架依赖。先搞懂差异，选型才有依据。

> [!def] 官方定义
> **框架依赖部署（FDD，Framework-Dependent Deployment）**：发布产物只含应用代码与依赖库，运行时由目标机的全局安装提供，产物小、自动获得运行时安全更新，但要求目标机安装匹配的 .NET Runtime；**独立部署（SCD，Self-Contained Deployment）**：发布时把运行时与应用一起输出，目标机零依赖，产物大（约 60-150 MB），运行时补丁需随应用更新。两种模式均由 .NET SDK 的 `dotnet publish` 生成，官方定义见 https://learn.microsoft.com/zh-cn/dotnet/core/deploying/

> [!origin] 由来背景
> .NET Framework 时代只有"框架依赖"一种选择（运行时装进系统 GAC），"目标机没有 .NET Framework"是经典报错，现场装框架又可能影响别的程序。.NET Core 1.0（2016 年）打破局面，推出自包含部署：把 CoreCLR 装进应用目录，实现真正的"绿色部署"。此后 .NET 团队持续优化 SCD 的体积（裁剪、单文件、ReadyToRun），到 .NET 6 时代"独立发布 + 单文件"已成为 WPF 工控软件交付的主流默认姿势，而 FDD 仍适合内网已统一装好运行时的环境。

> [!essentials] 核心要点
> - **体积差异**：FDD 产物通常 5-20 MB；SCD 因包含完整运行时达 60-150 MB
> - **目标机依赖**：FDD 要求目标机有匹配（或可回滚）的运行时；SCD 完全自带，但 CPU 架构（x64/Arm64）必须匹配
> - **更新方式**：FDD 的运行时安全补丁由目标机统一更新，应用只需更新自身；SCD 要连运行时一起发新包
> - **多版本共存**：SCD 天然支持不同应用用不同 .NET 版本互不干扰；FDD 依赖全局运行时版本管理
> - **权限与隔离**：SCD 不写 GAC、不弹"安装框架"提示，可在受限环境运行；FDD 部署前常需要做运行时检查

> [!example] 完整示例
> **部署方式对比看板：FrameworkDescription 区分框架依赖/独立发布、发布目录文件数与体积扫描、部署形态判定：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="部署方式对比 - 框架依赖 vs 独立部署" Height="440" Width="560"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="部署方式对比看板" FontSize="18" FontWeight="Bold"
>                    Foreground="#58A6FF" Margin="0,0,0,10"/>
>         <Border Background="#161B22" Padding="12" CornerRadius="6" Margin="0,0,0,10">
>             <StackPanel>
>                 <TextBlock x:Name="TxtFramework" Foreground="#8B949E" Margin="0,2"/>
>                 <TextBlock x:Name="TxtRuntimeVersion" Foreground="#8B949E" Margin="0,2"/>
>                 <TextBlock x:Name="TxtDepsCount" Foreground="#8B949E" Margin="0,2"/>
>                 <TextBlock x:Name="TxtDepsSize" Foreground="#8B949E" Margin="0,2"/>
>                 <TextBlock x:Name="TxtVerdict" Foreground="#238636" Margin="0,2" TextWrapping="Wrap"/>
>             </StackPanel>
>         </Border>
>         <Button Content="重新扫描发布目录" Click="OnScanClick" Padding="8"
>                 Background="#21262D" Foreground="White"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.IO;
> using System.Runtime.InteropServices;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow()
>         {
>             InitializeComponent();
>             Loaded += (_, _) => OnScanClick(null, null);
>         }
>
>         private void OnScanClick(object sender, RoutedEventArgs e)
>         {
>             try
>             {
>                 // FrameworkDescription：框架依赖发布显示目标机已安装的 .NET 版本；独立发布显示随包携带的运行时
>                 TxtFramework.Text = "当前框架：" + RuntimeInformation.FrameworkDescription;
>                 TxtRuntimeVersion.Text = "运行时版本：" + Environment.Version;
>
>                 // 独立发布会把整个运行时带入发布目录，文件数与总大小明显更大
>                 string dir = AppContext.BaseDirectory;
>                 string[] files = Directory.GetFiles(dir);
>                 long totalSize = 0;
>                 foreach (string file in files)
>                     totalSize += new FileInfo(file).Length;
>
>                 TxtDepsCount.Text = "发布目录文件数：" + files.Length + " 个";
>                 TxtDepsSize.Text = "发布目录总大小：" + (totalSize / 1024.0 / 1024.0).ToString("F1") + " MB";
>                 // 经验判断：文件数很多（>50）多为独立发布；很少则多为框架依赖
>                 TxtVerdict.Text = "判断结论：" + (files.Length > 50
>                     ? "发布目录包含大量运行时文件，疑似独立发布（目标机无需安装 .NET）"
>                     : "发布目录文件较少，疑似框架依赖（目标机需安装对应 .NET Runtime）");
>             }
>             catch (Exception ex)
>             {
>                 MessageBox.Show("扫描失败：" + ex.Message, "部署对比");
>             }
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 任何 WPF 上位机项目动手发布前的选型决策：用本节的对比表先定下"FDD or SCD"
> ✅ 内网统一运维 .NET 的环境：IT 用组策略统一装运行时，应用走 FDD 省体积、更新快
> ✅ 多版本 .NET 应用并存的机器：SCD 各带各的运行时，升级一个不影响其他
> ✅ 现场机器不可控（无网、缺组件、禁止安装）的交付：SCD 一步到位，减少现场排障
> ❌ 单机小工具、临时脚本：发布形态影响不大，选体积小的 FDD 即可，不必过度设计
> ❌ 需要频繁小步更新的在线服务：SCD 每次更新要重发整个运行时，带宽与更新时间成本高

> [!pitfall] 常见踩坑
> 坑 1：**FDD 发布到没装运行时的机器"双击没反应"** → 现象：exe 直接闪退或弹"缺少 .NET" → 原因：产物依赖全局运行时，目标机缺失 → 解决：发布前用 `目标机器-net-runtime-检查` 确认，或改用 SCD 发布
>
> 坑 2：**SCD 的 RID 与目标机架构不匹配** → 现象：win-x64 的包在 win-arm64 一体机上无法启动 → 原因：运行时与 CPU 架构强相关 → 解决：交付前确认目标机架构（x64/Arm64），必要时同时发布两个包
>
> 坑 3：**以为 SCD"自带运行时"就能跨 Windows 版本乱跑** → 现象：老 Win7 上 SCD 程序仍提示缺 `api-ms-win-*.dll` → 原因：.NET 运行时本身有最低 OS 要求（如 .NET 8 需 Win10/Server 2016+） → 解决：目标框架与发布版本匹配目标机 OS，老系统选兼容版本

> [!best] 最佳实践
> - 把"目标机环境"写成交付清单：OS 版本、CPU 架构、是否已装 .NET、有无外网，先填表再定形态
> - FDD 环境做运行时兜底：发布目录附带运行时安装包，或程序启动时检测并提示（见 `目标机器-net-runtime-检查`）
> - SCD 控制体积：结合 `PublishTrimmed` 与 `PublishSingleFile`，把 60-150 MB 的运行时压到可接受范围
> - 发布参数配置化：`Directory.Build.props` 里集中管理 RID、裁剪等参数，避免多个工程不同步
> - 每次发布记录形态参数并回归：发布说明写明"FDD/SCD、RID、裁剪、框架版本"，升级排障直接可查

> [!practice] 上手练习
> **Lv.1 照猫画虎**：用示例项目分别执行 FDD 与 SCD 发布，对比发布目录大小、文件数、启动速度
> **Lv.2 小试牛刀**：把 FDD 产物分别拷到"已装运行时"与"未装运行时"两台机器运行，记录两种现象
> **Lv.3 融会贯通**：结合 `目标机器-net-runtime-检查` 的检测代码，给 FDD 程序加"运行时缺失检测与引导安装"
> **Lv.4 拆层挑战**：写一份《发布形态选型表》：按目标机环境（有无 .NET、有无外网、CPU 架构、更新频率）给出 FDD 与 SCD 的推荐结论，作为项目交付文档模板

> [!related] 相关知识链接
> - ← 前置知识：`独立发布与单文件发布`（SCD 的实操命令与细节）
> - → 后续必学：`目标机器-net-runtime-检查`（FDD 发布后目标机运行时验证）
> - ⇄ 关联概念：`依赖项打包与配置文件`（发布产物的完整组成）、`msi-安装包wix-toolset`（把选定的发布形态装进安装包）
> - 📖 官方文档：.NET 部署方式概览：https://learn.microsoft.com/zh-cn/dotnet/core/deploying/ ；.NET 运行时下载：https://dotnet.microsoft.com/zh-cn/download/dotnet
