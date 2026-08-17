---
title: 与 PLC 的 OPC UA 连接
section: 09-communication
parent: 9.5 OPC 协议
---

# 与 PLC 的 OPC UA 连接

> [!plain] 白话理解
> 各家 PLC 通信协议互不兼容（西门子 S7、罗克韦尔 CIP、倍福 ADS…），但只要你那台 PLC 开了 OPC UA 服务器，上位机就能用一套 UA 代码通吃。接 PLC 时你只需知道四件事：PLC 的 IP 与端口（默认 4840）、是否要用户名密码、变量在 UA 地址空间里的节点路径（如 DB1.Temp）、怎么通过配置在 PLC 端导出/浏览节点。示例演示了带账号认证连接 PLC 并读取变量的完整流程。

> [!def] 官方定义
> 与 PLC 的 OPC UA 连接指上位机通过 OPC UA 协议访问 PLC 内置或网关提供的 UA 服务器。现代 PLC（西门子 S7-1200/1500、罗克韦尔 CompactLogix、倍福 TwinCAT 等）在固件中内置 UA 服务器：PLC 程序中的全局变量/DB 块通过"UA 映射"暴露为地址空间节点（如 `ns=2;s=DB1.Temp`）。连接要点：端点 URL `opc.tcp://IP:4840`、安全模式（None/Sign/SignAndEncrypt）、用户身份（匿名或账号密码）、以及 PLC 工程中配置的 UA 访问权限。连接后可执行读/写/订阅/浏览，将 PLC 数据无缝接入上层系统。

> [!origin] 由来背景
> 过去上位机读西门子 PLC 要用专有协议（S7 协议）或组态软件，读罗克韦尔又要另一套，每换厂商就要换驱动。随着工业 4.0 推进，主流 PLC 厂商纷纷在控制器内置 OPC UA 服务器：西门子 S7-1500 从 V2.0 起原生支持 UA，罗克韦尔、倍福、汇川等也相继跟进。上位机由此获得"一种协议读所有 PLC"的能力，且支持安全认证与语义化数据（变量带类型、单位），大幅降低多厂商设备集成的复杂度。

> [!essentials] 核心要点
> - **确认 PLC 固件支持**：S7-1500 需 V2.0+ 且工程启用"OPC UA"功能，S7-1200 部分型号/固件不支持，先查手册
> - **PLC 工程配置**：在 TIA Portal 等工程中开启 UA 服务器、设置用户名/密码与访问权限，下载配置后生效
> - **端点 URL**：`opc.tcp://<PLC_IP>:<端口>`，默认 4840；不同品牌端口可能不同（罗克韦尔有时用 4840 或自定义）
> - **认证方式**：UserIdentity 支持匿名/用户名密码；PLC 端常要求启用用户认证，密码由 PLC 工程创建
> - **节点路径**：`ns=2;s=DB1.Temp` 这类路径取决于 PLC 的 UA 映射；先在 PLC 工程或 UA Expert 里浏览确认
> - **安全策略**：PLC 一般支持 None/Sign/SignAndEncrypt；先用 None 验证连通，上线再用证书加密
> - **订阅性能**：PLC 端订阅采样有上限（如每周期 100ms），高频采集需评估 CPU 负载，必要时降频

> [!example] 完整示例
> **连接 PLC 的 OPC UA 演示：配置 PLC 端点与凭据并读取变量：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="与 PLC 的 OPC UA 连接" Height="500" Width="560"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="通过 OPC UA 连接 PLC（S7-1500 / 罗克韦尔 / 倍福等）"
>                    Foreground="#58A6FF" FontWeight="Bold" TextWrapping="Wrap"/>
>         <StackPanel Orientation="Horizontal" Margin="0,8,0,0">
>             <TextBlock Text="PLC 地址" Foreground="#8B949E" VerticalAlignment="Center"/>
>             <TextBox x:Name="IpBox" Text="192.168.1.10" Width="110" Margin="8,0,0,0"
>                      Background="#161B22" Foreground="#8B949E" BorderBrush="#30363D"/>
>             <TextBlock Text="端口" Foreground="#8B949E" Margin="16,0,0,0" VerticalAlignment="Center"/>
>             <TextBox x:Name="PortBox" Text="4840" Width="60" Margin="8,0,0,0"
>                      Background="#161B22" Foreground="#8B949E" BorderBrush="#30363D"/>
>         </StackPanel>
>         <StackPanel Orientation="Horizontal" Margin="0,8,0,0">
>             <TextBlock Text="用户名" Foreground="#8B949E" VerticalAlignment="Center"/>
>             <TextBox x:Name="UserBox" Text="opcua" Width="100" Margin="8,0,0,0"
>                      Background="#161B22" Foreground="#8B949E" BorderBrush="#30363D"/>
>             <TextBlock Text="密码" Foreground="#8B949E" Margin="16,0,0,0" VerticalAlignment="Center"/>
>             <PasswordBox x:Name="PwdBox" Width="100" Margin="8,0,0,0"
>                          Background="#161B22" Foreground="#8B949E" BorderBrush="#30363D"/>
>         </StackPanel>
>         <StackPanel Orientation="Horizontal" Margin="0,8,0,0">
>             <TextBlock Text="PLC 变量" Foreground="#8B949E" VerticalAlignment="Center"/>
>             <TextBox x:Name="NodeBox" Text="ns=2;s=DB1.Temp" Width="170" Margin="8,0,0,0"
>                      Background="#161B22" Foreground="#8B949E" BorderBrush="#30363D"/>
>             <Button Content="连接并读取" Click="OnReadClick" Padding="10,4" Margin="8,0,0,0"
>                     Background="#238636" Foreground="White"/>
>         </StackPanel>
>         <TextBlock Text="日志" Foreground="#8B949E" Margin="0,8,0,0"/>
>         <TextBox x:Name="LogBox" Height="140" IsReadOnly="True" TextWrapping="Wrap"
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
>         // 连接 PLC 的 UA 服务器：端点 = opc.tcp://IP:Port，可用用户名密码认证
>         private async void OnReadClick(object sender, RoutedEventArgs e)
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
>                 string url = $"opc.tcp://{IpBox.Text}:{PortBox.Text}";
>                 var endpoint = CoreClientUtils.SelectEndpoint(config, url, useSecurity: false);
>                 // PLC 常用用户名密码认证，对应 UserIdentity 构造
>                 var identity = new UserIdentity(UserBox.Text, PwdBox.Password);
>                 using var session = await Session.Create(config, endpoint, false, "HmiDemo",
>                                                          60000, identity, null);
>                 LogBox.AppendText($"已连接 PLC：{url}\r\n");
>
>                 // 读取 PLC 中的变量节点
>                 var nodeId = new NodeId(NodeBox.Text);
>                 DataValue value = session.ReadValue(nodeId);
>                 LogBox.AppendText($"变量 {nodeId} = {value.Value}\r\n");
>                 StatusText.Text = "读取成功";
>                 StatusText.Foreground = System.Windows.Media.Brushes.LimeGreen;
>             }
>             catch (Exception ex)
>             {
>                 StatusText.Text = "连接/读取失败：" + ex.Message;
>                 StatusText.Foreground = System.Windows.Media.Brushes.OrangeRed;
>             }
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 监控多品牌 PLC（西门子/罗克韦尔/倍福混合车间）的统一上位机
> ✅ 需要带认证、加密的 PLC 远程数据访问
> ✅ 需要浏览 PLC 变量语义（带类型/单位）而非裸地址
> ✅ 数据需要被 MES/SCADA/云平台等第三方系统同时消费
> ❌ PLC 固件不支持 UA 且无法升级（需选串口/Modbus/专有协议）
> ❌ 超高速运动控制数据（UA 订阅延迟不满足伺服级实时性，选 EtherCAT）

> [!pitfall] 常见踩坑
> 坑 1：**PLC 端未启用 OPC UA 服务** → 多数 PLC 的 UA 服务默认关闭，必须在编程软件里勾选启用并重启；先确认 PLC 手册的 UA 启用步骤
> 
> 坑 2：**端点 URL 端口不对** → S7-1500 默认 4840，其它品牌可能不同；用 UA Expert 扫到的端口为准，别照抄网上的 4840
> 
> 坑 3：**证书互信失败** → PLC 服务器只信任已注册客户端证书，首次连接被拒；在 PLC 的"受信任客户端"列表中添加上位机证书，或先临时用 None 安全模式排障
> 
> 坑 4：**节点路径按网上教程猜** → 每台 PLC 的地址空间结构不同（DB 块、变量表），必须用 UA Expert 浏览后取真实 NodeId，再写代码
> 
> 坑 5：**PLC 重启后会话失效不重连** → 固件版本不同，断线重连行为有差异；实现自动重建会话 + 重订阅，并验证 PLC 重启后能自愈

> [!best] 最佳实践
> - **把 PLC 连接参数做成配置**：IP、端口、账号、节点路径进 JSON/配置界面，换 PLC 不用改代码
> - **首次接入先做连通性验证**：先用 UA Expert 完成"连接+浏览+读值"三步，再写正式代码，把 PLC 端问题挡在编码前
> - **变量分组订阅**：把同周期的变量放同一个 Subscription，减少服务器开销
> - **PLC 端开启安全认证**：现场务必启用账号密码 + 加密，禁用匿名访问（默认开着要关）
> - **监控连接状态**：Session 异常/离线自动重连并通知界面，PLC 重启后上位机能自愈

> [!practice] 上手练习
> **Lv.1 照猫画虎**：在 TIA Portal 模拟器/真实 S7-1500 上启用 UA，运行示例用账号密码连接并读取 DB 变量
> **Lv.2 小试牛刀**：给示例增加"订阅 3 个 PLC 变量"功能，界面实时显示变化，并在断开 PLC 后验证自动重连
> **Lv.3 融会贯通**：做一个"PLC 变量浏览器"：从 PLC 地址空间递归浏览变量树，按数据类型分组展示并导出 CSV 点表

> [!related] 相关知识链接
> - ← 前置知识：《OPC UA .NET 开发》《OPC UA 核心概念》
> - → 后续必学：《上位机通信应用场景》《通信方式选型指南》
> - ⇄ 关联概念：《OPC 概述（Classic vs UA）》《Modbus TCP（网口）》（与 UA 对比）
> - 📖 官方文档：https://support.industry.siemens.com/（西门子 S7-1500 OPC UA 配置手册）
