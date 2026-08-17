---
title: OPC 概述（Classic vs UA）
section: 09-communication
parent: 9.5 OPC 协议
---

# OPC 概述（Classic vs UA）

> [!plain] 白话理解
> 每个 PLC、仪表厂商都有自己的通信协议，上位机想接谁就得装谁的驱动，接口乱成一锅粥。OPC 就是工业界的"USB 标准"：设备厂商实现统一的 OPC 服务器，上位机只认 OPC 客户端这一种接口，从此"谁都能连谁"。本文先讲清 OPC 为什么诞生，再对比老一代 Classic（COM/DCOM）与新一代 UA（跨平台）的差异。

> [!def] 官方定义
> OPC（OLE for Process Control，后改名 Open Platform Communications）是工业自动化领域的数据交换接口标准，由 OPC 基金会维护。OPC Classic 基于微软 COM/DCOM 技术，包含 DA（数据访问）、HDA（历史数据）、A&E（报警事件）三类接口，仅支持 Windows。OPC UA（Unified Architecture）是新一代标准：基于 TCP 二进制或 HTTPS 传输、内置安全模型（证书/加密/签名）、跨平台（Windows/Linux/嵌入式）、信息模型可描述设备语义（地址空间、节点、引用、方法）。UA 兼容 Classic 通过网关/包装器互操作。

> [!origin] 由来背景
> 1990 年代工控软件要连接不同厂商设备，每个都要专门写驱动，维护成本极高。微软与工控厂商合作于 1996 年推出基于 COM/DCOM 的 OPC DA，统一了"上位机读设备数据"的接口。但 Classic 依赖 Windows、DCOM 配置繁琐、安全性差、无法表达设备语义。2008 年 OPC 基金会发布 OPC UA：抛弃 COM，改用 TCP/HTTPS 并自带信息模型与安全机制，成为工业 4.0 与数字化转型的核心互操作标准。如今西门子、罗克韦尔、倍福等主流 PLC 均内置 UA 服务器。

> [!essentials] 核心要点
> - **Classic 三件套**：DA（实时数据）、HDA（历史数据）、A&E（报警事件），基于 COM/DCOM，仅 Windows
> - **UA 统一一切**：DA/AE/历史/方法调用/对象模型合并为统一的 UA 协议，一套接口全部搞定
> - **传输与安全**：UA 走 TCP 4840 端口或 HTTPS，支持证书身份认证、消息签名与加密；Classic 的 DCOM 无安全模型
> - **跨平台**：UA 客户端/服务器可跑在 Windows、Linux、嵌入式；Classic 绑死 Windows
> - **信息模型**：UA 用地址空间（节点+引用）描述设备结构，客户端可浏览"设备树"而非靠地址表猜
> - **互操作**：存量 Classic 设备可通过"UA 网关"桥接，新项目应直接选 UA
> - **.NET 生态**：官方 OPCFoundation.NetStandard.Opc.Ua 库支持 .NET 平台，WPF 直接引用

> [!example] 完整示例
> **OPC Classic vs UA 对比演示 + 最小 UA 客户端连接示例：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="OPC Classic vs UA" Height="480" Width="560"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="OPC Classic vs UA 对比" Foreground="#58A6FF" FontWeight="Bold"/>
>         <ListBox x:Name="CompareList" Height="130" Margin="0,6,0,0" Background="#161B22"
>                  Foreground="#8B949E" BorderBrush="#30363D">
>             <ListBoxItem Content="Classic：基于 Windows COM/DCOM，仅限 Windows，配置繁琐"/>
>             <ListBoxItem Content="UA：跨平台、基于 TCP/安全信道，内置安全模型"/>
>             <ListBoxItem Content="UA：信息模型更丰富，自带地址空间与浏览能力"/>
>         </ListBox>
>         <StackPanel Orientation="Horizontal" Margin="0,10,0,0">
>             <TextBlock Text="UA 端点" Foreground="#8B949E" VerticalAlignment="Center"/>
>             <TextBox x:Name="UrlBox" Text="opc.tcp://localhost:4840" Width="210" Margin="8,0,0,0"
>                      Background="#161B22" Foreground="#8B949E" BorderBrush="#30363D"/>
>             <Button Content="连接" Click="OnConnectClick" Padding="10,4" Margin="8,0,0,0"
>                     Background="#238636" Foreground="White"/>
>         </StackPanel>
>         <TextBlock Text="连接日志" Foreground="#8B949E" Margin="0,8,0,0"/>
>         <TextBox x:Name="LogBox" Height="130" IsReadOnly="True" TextWrapping="Wrap"
>                  Margin="0,4,0,0" Background="#161B22" Foreground="#8B949E"
>                  BorderBrush="#30363D" VerticalScrollBarVisibility="Auto"/>
>         <TextBlock x:Name="StatusText" Foreground="#8B949E" Margin="0,8,0,0" TextWrapping="Wrap"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Threading.Tasks;
> using System.Windows;
> using Opc.Ua;
> using Opc.Ua.Client;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         // 连接 UA 服务器（需 NuGet 包 OPCFoundation.NetStandard.Opc.Ua.Client）
>         private async void OnConnectClick(object sender, RoutedEventArgs e)
>         {
>             try
>             {
>                 var config = new ApplicationConfiguration
>                 {
>                     ApplicationName = "HmiDemo",
>                     ApplicationUri = "urn:localhost:UA:HmiDemo",
>                     ApplicationType = ApplicationType.Client,
>                     SecurityConfiguration = new SecurityConfiguration
>                     { ApplicationCertificate = new CertificateIdentifier() },
>                     TransportQuotas = new TransportQuotas { OperationTimeout = 15000 },
>                     ClientConfiguration = new ClientConfiguration { DefaultSessionTimeout = 60000 }
>                 };
>                 await config.Validate(ApplicationType.Client);
>
>                 var endpoint = CoreClientUtils.SelectEndpoint(config, UrlBox.Text, useSecurity: false);
>                 using var session = await Session.Create(config, endpoint, false, "HmiDemo",
>                                                          60000, new UserIdentity(), null);
>                 LogBox.AppendText($"已连接 UA 服务器：{endpoint.EndpointUrl}\r\n");
>                 LogBox.AppendText($"服务器名称：{session.ServerDescription?.ApplicationName?.Text}\r\n");
>                 StatusText.Text = "连接成功（OPC UA 为跨平台标准）";
>                 StatusText.Foreground = System.Windows.Media.Brushes.LimeGreen;
>             }
>             catch (Exception ex)
>             {
>                 StatusText.Text = "连接失败：" + ex.Message;
>                 StatusText.Foreground = System.Windows.Media.Brushes.OrangeRed;
>             }
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 对接支持 OPC UA 的 PLC/传感器/网关（西门子 S7、罗克韦尔、倍福）
> ✅ 需要跨平台（Linux 服务器 + Windows 上位机）的统一数据采集
> ✅ 需要安全认证的远程设备访问（证书加密，比裸 TCP/Modbus 更安全）
> ✅ 需要"浏览设备语义"（地址空间树）而不仅是读裸地址
> ❌ 简单点对点读寄存器（Modbus 更轻量，UA 引入复杂度）
> ❌ 现场仍只有老式 Classic DA 服务器且无法升级（需用 DCOM 或网关，配置繁琐）

> [!pitfall] 常见踩坑
> 坑 1：**Classic DA 的 DCOM 配置地狱** → 跨机器访问要配 DCOM 权限、防火墙 135 端口、用户账号，极易失败；能不用就别用，新项目直接 UA
>
> 坑 2：**以为 Classic 和 UA 协议互通** → 两者是不同协议栈，Classic 客户端不能直连 UA 服务器，必须经过网关/包装器（如 Kepware、UA-CW）
>
> 坑 3：**UA 证书信任问题导致连接失败** → 首次连接要互信证书（服务器拒绝/客户端拒绝 BadCertificateUntrusted），需在配置中把对方证书加入信任列表
>
> 坑 4：**安全模式与策略不匹配** → 端点选择时 useSecurity 参数与服务器策略不一致会握手失败；先用 None 连通排障，再逐步加安全

> [!best] 最佳实践
> - **新项目一律选 UA**：Classic 依赖 COM/DCOM，跨机器配置地狱、无跨平台、无加密，除非历史系统强制要求否则不要新建 Classic 项目
> - 老系统需要对接 UA 时，用**网关/包装器**（Kepware、UA-CW）把 Classic DA 服务器包装成 UA 端点，避免动老 PLC 侧
> - 连接 UA 前先准备**端点信息与安全策略**：用 UaExpert 实测服务器端点（opc.tcp://ip:4840）、安全模式（None/Sign/SignAndEncrypt），再落到代码
> - 证书管理纳入上线流程：开发环境可关校验，生产环境把服务器证书导入**受信任列表**，并保存自己的应用证书
> - 先以 **None + UA-TCP** 连通排障，确认地址空间可读后，再逐步启用签名/加密，避免一开始就被安全握手挡在门外
> - 用 **UaExpert** 作为调试基准：它连不上时先别怀疑代码，先查网络、端口 4840、防火墙与证书

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，观察 Classic 与 UA 的特性对比列表，并尝试连接本地 UA 模拟服务器（如 UaSampleServer）
> **Lv.2 小试牛刀**：用 UA Expert 连接同一台服务器，浏览地址空间并记录 3 个节点的完整 NodeId 路径
> **Lv.3 融会贯通**：写一个小工具：从 UA 地址空间自动遍历生成节点树（NodeId + 类型），导出 JSON 供监控界面绑定使用

> [!related] 相关知识链接
> - ← 前置知识：《网络基础概念（IP 端口 TCP vs UDP）》理解 UA 的 TCP 承载
> - → 后续必学：《OPC UA 核心概念》深入地址空间与节点模型
> - ⇄ 关联概念：《OPC UA .NET 开发》《与 PLC 的 OPC UA 连接》
> - 📖 官方文档：https://reference.opcfoundation.org/（OPC UA 规范与信息模型）
