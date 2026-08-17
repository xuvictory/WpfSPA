---
title: Windows 服务模式
section: 15-deployment
parent: 15.2 部署注意事项
---

# Windows 服务模式

> [!plain] 白话理解
> 开机自启动还得"先有人登录"，Windows 服务则更进一步：**没有用户登录也能跑**。把采集、数据中转这类后台任务注册成服务，系统一启动它就后台运行，没人管也稳定工作。适合"数据采集网关、文件同步、日志中转"这类不需要界面的任务。代价是服务没有界面、调试麻烦、权限模型不同——本节帮你判断"什么时候该用服务、怎么读服务状态、服务与自启动怎么选"。

> [!def] 官方定义
> **Windows 服务（Windows Service）**：由 Windows 服务控制管理器（SCM）管理、在独立会话（Session 0）中运行的长时间后台进程，无需用户登录，按启动类型（自动/手动/禁用）随系统启动。.NET 中用 `System.ServiceProcess.ServiceController` 查询/控制服务（`GetServices()`、`Status`、`StartType`）；编写服务需继承 `ServiceBase`。查询服务通常免管理员权限，Start/Stop 与注册服务（`sc create` / `InstallUtil`）需管理员权限。官方文档：https://learn.microsoft.com/zh-cn/dotnet/framework/windows-services/

> [!origin] 由来背景
> Windows NT（1993 年）引入服务体系，把"系统守护进程"从"登录会话里的应用"中独立出来：设备驱动、网络协议、数据库等基础设施都以服务运行，不依赖任何用户登录，SCM 统一负责启动、停止与失败重启。.NET Framework 1.0 就提供 `ServiceBase`/`ServiceController`，.NET Core 3.0（2019 年）补上跨平台服务宿主（`Microsoft.Extensions.Hosting.WindowsServices`）。对上位机而言，服务模式的典型价值是"采集网关、文件同步、协议转发"这类 7×24 小时任务——人不在，它也在。

> [!essentials] 核心要点
> - **无登录运行**：服务在 Session 0 后台运行，用户不登录也启动，这是与 `开机自启动设置` 的本质区别
> - **启动类型**：`Automatic`（系统启动即起）/ `Manual`（手动）/ `Disabled`（禁用），示例代码演示读取
> - **查询 API**：`ServiceController.GetServices()` 列出全部服务，`Status`（Running/Stopped）、`StartType` 只读展示
> - **写操作提权**：`Start()`/`Stop()`/注册服务需管理员权限，示例只做查询
> - **无界面交互**：服务不能直接弹窗、画界面；要界面得用 UI 程序连服务取数据（TCP/命名管道/HTTP）

> [!example] 完整示例
> **设备服务监控面板：ServiceController 列出自动启动/名称含 HMI 的服务并读取状态与启动类型（仅查询不写）：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="Windows 服务模式监控" Height="480" Width="640"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Grid.Row="0" Text="上位机相关 Windows 服务" FontSize="16" FontWeight="Bold"
>                    Foreground="#58A6FF" Margin="0,0,0,8"/>
>         <ListBox Grid.Row="1" x:Name="ServiceList" Background="#161B22" Foreground="#8B949E"
>                  BorderBrush="#21262D" SelectionChanged="OnSelectionChanged"/>
>         <StackPanel Grid.Row="2" Margin="0,8,0,0">
>             <TextBlock x:Name="TxtDetail" Foreground="#8B949E" TextWrapping="Wrap"/>
>             <Button Content="刷新服务状态" Click="OnRefreshClick" Padding="8" Margin="0,8,0,0"
>                     Background="#21262D" Foreground="White"/>
>         </StackPanel>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Collections.Generic;
> using System.ServiceProcess;
> using System.Windows;
> using System.Windows.Controls;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private readonly List<ServiceController> _services = new();
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             Loaded += (_, _) => OnRefreshClick(null, null);
>         }
>
>         private void OnRefreshClick(object sender, RoutedEventArgs e)
>         {
>             try
>             {
>                 ServiceList.Items.Clear();
>                 _services.Clear();
>                 // GetServices 返回本机全部服务；过滤自动启动或名称含 HMI 的服务便于上位机场景监控
>                 foreach (ServiceController sc in ServiceController.GetServices())
>                 {
>                     if (sc.StartType == ServiceStartMode.Automatic ||
>                         sc.ServiceName.ToUpper().Contains("HMI") ||
>                         sc.DisplayName.ToUpper().Contains("HMI"))
>                     {
>                         _services.Add(sc);
>                         ServiceList.Items.Add(sc.DisplayName + "（" + sc.ServiceName + "）");
>                     }
>                 }
>                 TxtDetail.Text = "共监控 " + _services.Count + " 个服务（自动启动或名称含 HMI）";
>             }
>             catch (Exception ex)
>             {
>                 MessageBox.Show("读取服务失败：" + ex.Message, "服务监控");
>             }
>         }
>
>         private void OnSelectionChanged(object sender, SelectionChangedEventArgs e)
>         {
>             int index = ServiceList.SelectedIndex;
>             if (index < 0 || index >= _services.Count) return;
>             ServiceController sc = _services[index];
>             // 仅读取状态与启动类型；Start/Stop 等写操作需要管理员权限，示例不做
>             TxtDetail.Text = "名称：" + sc.DisplayName +
>                 "\n状态：" + sc.Status +
>                 "\n启动类型：" + sc.StartType;
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 无人值守的 7×24 后台任务：数据采集网关、日志/文件同步、协议转发，人不在也要稳定跑
> ✅ 需要系统启动即运行、不依赖登录：比 `开机自启动设置` 更早、更可靠，断电重启后自动恢复
> ✅ 权限与安全要求高的后台服务：以独立账户运行，避免用户乱动进程
> ✅ 与 UI 分离的架构：采集服务跑后台，操作站 UI 通过网络/管道连它取数据
> ❌ 需要图形界面/弹窗/用户交互的任务：服务跑在 Session 0 看不到界面，这类用普通 WPF 程序
> ❌ 简单的"登录后自动开程序"场景：用 `开机自启动设置` 的 Run 键更轻

> [!pitfall] 常见踩坑
> 坑 1：**服务访问不了桌面/网络共享** → 现象：服务里访问 `C:\Users\...`、映射盘符、网络打印机失败 → 原因：服务在 Session 0 无用户会话，默认账户（LocalSystem/NetworkService）权限受限、没有用户 Profile → 解决：把访问路径换成服务账户可及的路径（本地盘/UNC），必要时给服务配专用账户
>
> 坑 2：**服务"假装运行"其实业务已挂** → 现象：服务显示 Running，但内部逻辑早已卡死或异常退出 → 原因：服务进程活着 ≠ 内部工作正常，没有心跳/自检 → 解决：服务里加心跳或定期自检，管理端用 `Status` + 业务健康状态双重判断
>
> 坑 3：**调试服务很痛苦，改一下要重装** → 现象：开发时每次改动都要 `sc stop` + 重装 + 启动，效率低 → 原因：服务生命周期由 SCM 管理，不能像普通程序一样直接调试 → 解决：业务逻辑抽成普通类，用控制台/UI 壳子调试，服务只做"外壳"（可加"以普通进程运行"的调试开关）

> [!best] 最佳实践
> - 服务只做"外壳"：业务逻辑放独立类库，`ServiceBase` 薄薄一层，业务可用控制台壳调试
> - 写日志用文件/事件日志：服务无界面，一切状态靠日志说话（见 12 章 `serilog-结构化日志`）
> - 用 `sc` 命令管理：`sc query` / `sc stop` / `sc delete` 比 GUI 快，脚本化部署更方便
> - 查询型功能免提权：只读服务列表/状态不需要管理员；Start/Stop 再考虑提权，遵循最小权限原则
> - 部署时用安装包注册服务：`msi-安装包wix-toolset` 可在安装时注册、卸载时删除服务，比手动 `sc create` 可靠

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例程序，浏览自动启动/名称含 HMI 的服务列表，点选查看状态与启动类型
> **Lv.2 小试牛刀**：用 `sc query` 命令行对照示例输出，确认两种方式读到的服务状态一致
> **Lv.3 融会贯通**：把示例的过滤逻辑改成"只看 Running 服务"，统计当前系统在跑的后台服务数量
> **Lv.4 拆层挑战**：用 `Microsoft.Extensions.Hosting` 写一个极简 Worker 服务（`BackgroundService`），`sc create` 注册成 Windows 服务，再用示例代码查询它的状态

> [!related] 相关知识链接
> - ← 前置知识：`开机自启动设置`（登录级自启动，与服务模式对比选型）
> - → 后续必学：`msi-安装包wix-toolset`（安装包里注册/卸载服务的正规姿势）
> - ⇄ 关联概念：`目标机器-net-runtime-检查`（服务运行也需要匹配的运行时）、第 8 章（后台任务与异步）、12 章 `serilog-结构化日志`（无界面服务的日志）
> - 📖 官方文档：Windows 服务：https://learn.microsoft.com/zh-cn/dotnet/framework/windows-services/ ；ServiceController：https://learn.microsoft.com/zh-cn/dotnet/api/system.serviceprocess.servicecontroller
