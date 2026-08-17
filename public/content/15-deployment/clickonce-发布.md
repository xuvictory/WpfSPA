---
title: ClickOnce 发布
section: 15-deployment
parent: 15.1 发布方式
---

# ClickOnce 发布

> [!plain] 白话理解
> ClickOnce 好比"从公司内网点一个链接，程序就装好了；下次你发布新版本，客户那边的程序开机后自己检查、自己更新"。它把"安装"和"更新"这两件最麻烦的事藏了起来：不用刻光盘、不用跑客户现场、不用让客户先卸载旧版再装新版。上位机场景里，给车间操作站分发新版本，过去要一台台拿 U 盘拷贝，用 ClickOnce 后只需把发布目录丢到共享文件夹，各操作站下次启动自动拉取新版。

> [!def] 官方定义
> **ClickOnce** 是微软随 .NET Framework 2.0 推出的**部署技术**，不是控件也不是框架：它把 WPF / WinForms 应用发布到 Web 服务器、文件共享或 FTP，客户端通过 URL 一键安装、按需自动更新，程序安装在当前用户的"应用程序缓存"目录，无需管理员权限。核心 API 是 `System.Deployment.Application.ApplicationDeployment`：`IsNetworkDeployed` 判断当前是否由 ClickOnce 启动，`CurrentDeployment` 获取部署对象，`CheckForUpdate()` / `Update()` 检查并拉取新版本。官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/app-development/clickonce-deployment

> [!origin] 由来背景
> .NET Framework 1.0 时代（2002 年前后）部署靠"XCopy 拷贝"，程序更新要么重新分发整个安装包、要么在代码里手写"检查更新器"，成本高且极易出错。微软在 2005 年随 .NET Framework 2.0 / Visual Studio 2005 推出 ClickOnce，定位"零影响安装"：不碰系统目录、不写注册表启动项、卸载只删用户缓存，特别适合"更新频繁、无管理员权限"的办公与工控软件分发。.NET Core/.NET 5+ 虽不再推荐新项目使用，但存量 WPF 项目与内网更新场景中它依然常见。

> [!essentials] 核心要点
> - **先判来源**：用 `ApplicationDeployment.IsNetworkDeployed` 区分"ClickOnce 部署"与"本地调试/复制运行"，非部署环境调用部署 API 会抛异常，必须安全回退
> - **获取部署对象**：`ApplicationDeployment.CurrentDeployment` 得到当前部署实例，`CurrentVersion` / `UpdateLocation` 可读出版本与更新源
> - **检查与更新**：`CheckForUpdate()` 同步检查更新源是否有更高版本；确认后再调 `Update()` 下载并重启应用
> - **发布配置**：在 VS 发布向导中配置"更新位置"（网站/共享目录）、"最低版本"（强制升级）与开始菜单快捷方式
> - **签名证书**：发布必须用代码签名证书（.pfx）签名，否则客户端会有"发布者未知"警告，更新也会受限

> [!example] 完整示例
> **ClickOnce 更新检查面板：IsNetworkDeployed 判断部署来源、CurrentDeployment 读取版本与更新位置、CheckForUpdate 检查新版本（非 ClickOnce 环境安全回退）：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="ClickOnce 发布检查" Height="420" Width="520"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="ClickOnce 更新检查面板" FontSize="18" FontWeight="Bold"
>                    Foreground="#58A6FF" Margin="0,0,0,10"/>
>         <Border Background="#161B22" Padding="12" CornerRadius="6" Margin="0,0,0,10">
>             <StackPanel>
>                 <TextBlock x:Name="TxtDeployed" Foreground="#8B949E" Margin="0,2"/>
>                 <TextBlock x:Name="TxtVersion" Foreground="#8B949E" Margin="0,2" TextWrapping="Wrap"/>
>                 <TextBlock x:Name="TxtUpdateLocation" Foreground="#8B949E" Margin="0,2" TextWrapping="Wrap"/>
>                 <TextBlock x:Name="TxtUpdateResult" Foreground="#8B949E" Margin="0,2" TextWrapping="Wrap"/>
>             </StackPanel>
>         </Border>
>         <Button Content="检查更新" Click="OnCheckUpdate" Padding="8"
>                 Background="#238636" Foreground="White"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Deployment.Application;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow()
>         {
>             InitializeComponent();
>             Loaded += (_, _) => OnCheckUpdate(null, null);
>         }
>
>         private void OnCheckUpdate(object sender, RoutedEventArgs e)
>         {
>             try
>             {
>                 // IsNetworkDeployed：当前程序是否由 ClickOnce 部署发布（本机调试/直接复制运行时为 false）
>                 if (!ApplicationDeployment.IsNetworkDeployed)
>                 {
>                     TxtDeployed.Text = "ClickOnce 部署：否";
>                     TxtVersion.Text = "当前为普通发布/调试运行，无法读取 ClickOnce 版本";
>                     TxtUpdateLocation.Text = "提示：请用发布向导生成部署包并从站点启动后，再验证更新逻辑";
>                     TxtUpdateResult.Text = "";
>                     return;   // 非 ClickOnce 环境安全回退，不抛异常
>                 }
>
>                 ApplicationDeployment dep = ApplicationDeployment.CurrentDeployment;
>                 TxtDeployed.Text = "ClickOnce 部署：是";
>                 TxtVersion.Text = "当前版本：" + dep.CurrentVersion;
>                 TxtUpdateLocation.Text = "更新位置：" + dep.UpdateLocation;
>
>                 if (dep.CheckForUpdate())   // 同步检查部署服务器是否存在更高版本
>                     TxtUpdateResult.Text = "发现新版本：" + dep.UpdatedVersion + "，可调用 Update() 下载并重启应用";
>                 else
>                     TxtUpdateResult.Text = "已是最新版本";
>             }
>             catch (Exception ex)
>             {
>                 MessageBox.Show("更新检查失败：" + ex.Message, "ClickOnce");
>             }
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 内网共享目录 / Web 分发更新：车间操作站多、版本迭代快，发布目录一更新，各站启动时自动拉取新版
> ✅ 客户机器无管理员权限：ClickOnce 按用户安装到缓存目录，不写注册表启动项、不装 Program Files
> ✅ 纯托管程序 + 数据文件的交付：程序集、配置文件、数据库文件都能随发布目录一起分发
> ✅ 需要"最低版本"强制升级：发布配置里可指定最低版本，低于它的客户端必须升级后才能用
> ❌ 需要安装驱动、Windows 服务或写系统目录的程序：ClickOnce 的权限模型做不到
> ❌ 对更新节奏、分批灰度、回滚有严格管控的场景：ClickOnce 更新策略简单，换自研方案更可控（见 12 章 `自动更新检测与下载`）

> [!pitfall] 常见踩坑
> 坑 1：**非 ClickOnce 环境调用部署 API 抛异常** → 现象：本机调试或直接运行 exe 时 `ApplicationDeployment.CurrentDeployment` 抛 `InvalidOperationException` → 原因：只有通过 ClickOnce 启动的进程才持有部署对象 → 解决：先判 `ApplicationDeployment.IsNetworkDeployed`，为 false 时走本地版本读取兜底（本节示例就是这种写法）
>
> 坑 2：**客户端更新失败、一直用旧版** → 现象：发布到共享目录后部分机器提示"无法下载更新，权限不足"或静默不更新 → 原因：共享目录访问权限不足、UNC 路径不受信任、证书不匹配 → 解决：更新源配"读取"权限的 UNC/HTTP 路径，正式环境给发布清单签受信任证书
>
> 坑 3：**更新后现场配置被覆盖** → 现象：客户改过的串口、IP 参数在升级后丢失 → 原因：配置文件随程序集一起发布，被当作程序的一部分覆盖了本地修改 → 解决：现场可改配置放独立数据目录（见 12 章 `appsettingsjson推荐方案`），不要在发布时直接覆盖

> [!best] 最佳实践
> - 更新源用内网 HTTP 或共享目录：比 FTP 稳定、可加访问日志，方便排查"哪台站没更新上"
> - `Publish Version` 与程序集版本同步递增：现场报障时直接对出版本号，避免"版本对不上"的扯皮
> - 交付前做"干净机器"三连测：全新安装、旧版升级、断网启动各验证一遍再放行
> - 配置与数据独立于发布目录：程序升级只动程序集，不碰现场参数与采集数据
> - 更新失败要给用户显式提示：用 `CheckForDetailedUpdate()` 拿失败原因弹窗告知，别让客户端静默卡在旧版

> [!practice] 上手练习
> **Lv.1 照猫画虎**：在 VS 里对示例项目执行"发布到文件夹"，用 `IsNetworkDeployed` / `CurrentDeployment` 读出部署版本（本机调试会走回退分支，属正常）
> **Lv.2 小试牛刀**：发布两个不同版本到共享目录，把更新位置指过去，验证"下次启动自动检测到新版"
> **Lv.3 融会贯通**：在发布配置里设置"最低版本"并勾选"更新前检查"，验证低版本客户端被强制升级
> **Lv.4 拆层挑战**：给示例加"更新前备份配置"：检测到更新时先把本地 `appsettings.json` 复制到备份目录，更新后合并，防止升级覆盖现场参数（结合 12 章 `appsettingsjson推荐方案`）

> [!related] 相关知识链接
> - ← 前置知识：12 章 `增量更新与版本管理`（版本号规划）、`appsettingsjson推荐方案`（配置不被更新覆盖）
> - → 后续必学：12 章 `自动更新检测与下载`（自研更新方案，与 ClickOnce 的取舍对比）
> - ⇄ 关联概念：`独立发布与单文件发布`（不带 .NET 环境的另一种交付）、`msi-安装包wix-toolset`（需要驱动/服务时的正规安装包方案）
> - 📖 官方文档：ClickOnce 部署概述：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/clickonce-overview ；ClickOnce 安全与部署：https://learn.microsoft.com/zh-cn/visualstudio/deployment/clickonce-security-and-deployment
