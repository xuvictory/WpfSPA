---
title: ClickOnce 部署与更新
section: 12-architecture
parent: 12.7 软件更新方案
---

# ClickOnce 部署与更新

> [!plain] 白话理解
> ClickOnce 是 WPF 的**"自动安装 + 自动更新"方案**：把程序发布到共享目录或 Web 服务器，现场机器点一下安装文件就装好；你发布新版本后，客户端启动时检测到更新自动下载安装，不用挨台机器手动拷。对分散在现场的多台上位机，这能省下大量"跑现场升级"的时间。代价是它偏向"简单程序"，复杂部署（注册服务、装驱动）要另想办法。

> [!def] 官方定义
> ClickOnce 是微软 .NET 官方提供的**部署与自更新技术**：将应用程序及其依赖发布为部署清单（`.application`）与程序集清单，客户端通过清单文件安装并在每次启动时检查服务器上的新版本，自动下载更新。支持从文件夹共享、FTP、HTTP 部署。官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/clickonce-overview 、https://learn.microsoft.com/zh-cn/visualstudio/deployment/clickonce-security-and-deployment 。它面向"无需管理员安装、自动更新"的场景；需要注册表/服务/驱动级权限的场景不适合（见坑）。

> [!origin] 由来背景
> 2000 年代初，Windows 桌面软件更新依赖"分发安装包 + 用户手动运行"，软件厂商与 IT 运维都在寻找"静默安装、自动升级"的方案。微软在 .NET Framework 2.0（2005）推出 ClickOnce，核心卖点：一次点击安装、低权限运行（每用户安装）、自动版本检测与更新、失败可回滚。同期还有 Windows Installer（MSI）路线，ClickOnce 以"轻量自更新"差异化胜出。WPF（2006）默认支持 ClickOnce 发布，直到今天仍是桌面应用"文件服务器更新"的主流方案；在微软新一代部署方案（MSIX）出现前，ClickOnce 是 .NET 桌面自更新的官方首选。

> [!essentials] 核心要点
> - **发布产物**：发布目录含安装文件（`.application`）与程序集清单；服务器目录即更新源
> - **更新检查**：启动时自动检测，可配置"每次启动检查/检查间隔"；`ApplicationDeployment.CurrentDeployment.CheckForUpdate()` 可编程触发
> - **更新 API**：`System.Deployment.Application.ApplicationDeployment`（`CheckForUpdate`/`Update`/`IsFirstRun`）
> - **签名与安全**：部署清单需签名证书；发布 URL 需 HTTPS 或内网共享目录
> - **限制**：不能装驱动/服务/写 Program Files；适合"纯托管程序 + 数据文件"，复杂部署走 MSI/MSIX（见 `自动更新检测与下载` 对比）

> [!example] 完整示例
> **ClickOnce 版本信息演示：读取当前程序集版本并检查更新，展示 ClickOnce 自动更新流程（发布到服务器 → 客户端启动时检查 → 自动下载）：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="ClickOnce 部署演示" Height="340" Width="440"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="ClickOnce 版本检查与更新" Foreground="#58A6FF" FontWeight="Bold"/>
>         <Button Content="检查服务器是否有新版本" Click="OnCheck" Margin="0,12,0,0" Padding="8"
>                 Background="#21262D" Foreground="White"/>
>         <Button Content="执行更新（模拟下载）" Click="OnUpdate" Margin="0,8,0,0" Padding="8"
>                 Background="#238636" Foreground="White"/>
>         <TextBlock x:Name="OutputText" Margin="0,12,0,0" Foreground="#8B949E" TextWrapping="Wrap"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Deployment.Application;
> using System.Reflection;
> using System.Windows;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         // 模拟服务器上部署的最新版本
>         private readonly Version _serverVersion = new Version(1, 0, 2);
>
>         public MainWindow() => InitializeComponent();
>
>         private void OnCheck(object sender, RoutedEventArgs e)
>         {
>             // ClickOnce 部署时可用 ApplicationDeployment.CurrentDeployment 判断
>             bool isClickOnce = ApplicationDeployment.IsNetworkDeployed;
>             Version current = isClickOnce
>                 ? ApplicationDeployment.CurrentDeployment.CurrentVersion
>                 : Assembly.GetExecutingAssembly().GetName().Version;
>
>             bool hasUpdate = _serverVersion > current;
>             OutputText.Text =
>                 $"当前版本：{current}\n服务器版本：{_serverVersion}\n" +
>                 (hasUpdate ? "→ 检测到新版本，可点击更新" : "→ 已是最新版本");
>             OutputText.Foreground = new SolidColorBrush(Color.FromRgb(
>                 hasUpdate ? 0x23 : 0x8B, hasUpdate ? 0x86 : 0x94, hasUpdate ? 0x36 : 0x9E));
>         }
>
>         private void OnUpdate(object sender, RoutedEventArgs e)
>         {
>             // ClickOnce 中：ApplicationDeployment.CurrentDeployment.Update() 会自动下载并提示重启
>             OutputText.Text = "已从服务器下载增量包并完成安装（模拟）\n" +
>                               "重新启动后即可使用新版本";
>             OutputText.Foreground = new SolidColorBrush(Color.FromRgb(0x23, 0x86, 0x36));
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 内网/共享目录分发：上位机装在车间局域网，更新源设为共享文件夹（示例场景）
> ✅ 无管理员权限的现场：ClickOnce 按用户安装，不碰注册表/系统目录
> ✅ 分散多台设备快速部署：一次点击安装、启动自动更新
> ✅ 纯托管程序 + 配置文件/数据库文件的更新
> ❌ 需要装驱动/系统服务/写 Program Files 的软件：ClickOnce 做不到
> ❌ 需要自定义更新流程（增量、灰度、回滚策略）：用自研方案（见 `自动更新检测与下载`）

> [!pitfall] 常见踩坑
> 坑 1：**发布到共享目录后客户端更新失败** → 现象：启动提示"无法下载更新，权限不足" → 原因：共享目录访问权限/UNC 路径限制 → 解决：客户端用可访问的 UNC 或 HTTP 发布；发布目录给"读"权限，必要时加证书信任（HTTPS）
> 
> 坑 2：**程序集未签名导致部署被拒** → 现象：发布时报"应用程序清单签名失败"或客户端拒装 → 原因：没配签名证书 → 解决：发布选项里配置证书（自签名可在内网用，正式环境用受信任证书）
>
> 坑 3：**配置文件被每次更新覆盖** → 现象：现场改的串口配置更新后被重置 → 原因：配置文件随程序集一起发布覆盖 → 解决：配置放独立数据目录（见 12.5 `appsettingsjson推荐方案`），或设为"数据文件"（data）让更新不覆盖

> [!best] 最佳实践
> - 更新源放内网 HTTP/共享目录：比 FTP 稳定、可加访问日志
> - 发布前测试"干净机器安装 + 升级路径"：验证全新安装与 1.x→2.x 升级都正常
> - 版本号同步递增：`Publish Version` 与程序集版本保持一致，便于定位现场版本（见 `增量更新与版本管理`）
> - 配置与数据文件独立于发布：更新只动程序集，不覆盖现场配置
> - 加启动检测与降级提示：`ApplicationDeployment.CurrentDeployment.CheckForDetailedUpdate()` 失败时给明确提示，别静默"卡在旧版"

> [!practice] 上手练习
> **Lv.1 照猫画虎**：用示例项目在 VS 里"发布"到本地文件夹，用 `ApplicationDeployment` 检查更新逻辑跑通
> **Lv.2 小试牛刀**：在发布设置里把"更新检查"改为"启动时检查"，发布两个版本验证客户端自动提示更新
> **Lv.3 融会贯通**：把更新源指向共享目录（`\\server\hmi`），在另一台机器安装并升级，验证局域网分发
> **Lv.4 拆层挑战**：给示例加"更新前备份配置"：检测到更新时先把 `appsettings.json` 复制到备份目录，更新后再合并（结合 12.5 配置篇）

> [!related] 相关知识链接
> - ← 前置知识：`增量更新与版本管理`（版本号规划）、12.5 `appsettingsjson推荐方案`（配置不被覆盖）
> - → 后续必学：`自动更新检测与下载`（自研更新方案）
> - ⇄ 关联概念：`工控软件测试要点`（更新流程回归）、`上位机日志场景`（更新日志）
> - 📖 官方文档：ClickOnce 概述：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/clickonce-overview ；ClickOnce 安全与部署：https://learn.microsoft.com/zh-cn/visualstudio/deployment/clickonce-security-and-deployment
