---
title: OPC UA .NET 开发
section: 09-communication
parent: 9.5 OPC 协议
---

# OPC UA .NET 开发

> [!plain] 白话理解
> 在 WPF 里做 OPC UA 客户端，几乎都在用 OPC 基金会的官方 .NET 库（OPCFoundation.NetStandard.Opc.Ua）。固定套路是：建 ApplicationConfiguration → 选端点 → 创建 Session → 读写节点（或订阅）。示例把"连接/读取/写入"三个最常用动作完整演示了一遍，跑通它就等于掌握了 UA 客户端开发的主体。

> [!def] 官方定义
> OPC UA .NET 开发基于 OPCFoundation.NetStandard.Opc.Ua 库（OPC 基金会官方实现，支持 .NET Standard/.NET Core/.NET Framework）。核心类型：ApplicationConfiguration（应用配置：应用名、证书、安全策略）、CoreClientUtils.SelectEndpoint（端点发现与选择）、Session.Create（创建会话）、session.ReadValue/WriteValue（读写）、Subscription + MonitoredItem（订阅）、UserIdentity（匿名/用户名密码/证书认证）。库内同时提供客户端与服务器实现，可自建 UA 服务器做联调。

> [!origin] 由来背景
> 早期 .NET 上做 OPC 只能依赖 Classic 的 COM 组件（OPCDA.NET 等），跨平台、x64/32 位、DCOM 配置问题层出不穷。OPC 基金会推出 NetStandard 版 UA 库后，.NET 开发者可以用统一、跨平台、异步友好的 API 实现完整 UA 客户端；库还内建服务器端支持，开发者甚至能在本机起一个 UA 服务器模拟设备做开发联调。它让 WPF 上位机对接 UA 从"折腾 COM"变成"写几行配置 + 调用 API"。

> [!essentials] 核心要点
> - **NuGet 包**：`OPCFoundation.NetStandard.Opc.Ua`（含 Client 与 Server），目标框架选 .NET 6+ 或 .NET Framework 4.8
> - **配置必做 Validate**：ApplicationConfiguration 创建后必须 `await config.Validate(ApplicationType.Client)`，否则证书目录等未初始化
> - **选端点**：`CoreClientUtils.SelectEndpoint(config, url, useSecurity: false)` 返回 EndpointDescription；None 模式开发期最省事
> - **创建会话**：`Session.Create(config, endpoint, updateBeforeConnect, sessionName, sessionTimeout, identity, preferredLocales)`
> - **读**：`DataValue v = session.ReadValue(new NodeId("ns=2;s=..."));` 判 v.StatusCode 再取 v.Value
> - **写**：`session.WriteValue(nodeId, new DataValue(value))`，节点只读时返回 BadNotWritable
> - **订阅**：`session.AddSubscription(...)` + `subscription.AddItem(monitoredItem)`，DataChange 事件在回调线程触发
> - **释放**：Session 是 IDisposable，用 using 或窗口关闭时 Dispose，防止服务器会话泄漏

> [!example] 完整示例
> **OPC UA .NET 开发演示：客户端连接、读取与写入节点值：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="OPC UA .NET 开发" Height="520" Width="600"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="OPC UA .NET 客户端三步：Connect → Read → Write"
>                    Foreground="#58A6FF" FontWeight="Bold"/>
>         <StackPanel Orientation="Horizontal" Margin="0,8,0,0">
>             <TextBlock Text="端点" Foreground="#8B949E" VerticalAlignment="Center"/>
>             <TextBox x:Name="UrlBox" Text="opc.tcp://localhost:4840" Width="210" Margin="8,0,0,0"
>                      Background="#161B22" Foreground="#8B949E" BorderBrush="#30363D"/>
>             <Button Content="连接" Click="OnConnectClick" Padding="10,4" Margin="8,0,0,0"
>                     Background="#238636" Foreground="White"/>
>         </StackPanel>
>         <StackPanel Orientation="Horizontal" Margin="0,8,0,0">
>             <TextBlock Text="节点ID" Foreground="#8B949E" VerticalAlignment="Center"/>
>             <TextBox x:Name="NodeBox" Text="ns=2;s=Demo.Static.Temperature" Width="280" Margin="8,0,0,0"
>                      Background="#161B22" Foreground="#8B949E" BorderBrush="#30363D"/>
>             <Button Content="读取" Click="OnReadClick" Padding="10,4" Margin="8,0,0,0"
>                     Background="#21262D" Foreground="White"/>
>             <Button Content="写入" Click="OnWriteClick" Padding="10,4" Margin="8,0,0,0"
>                     Background="#21262D" Foreground="White"/>
>         </StackPanel>
>         <TextBlock Text="值" Foreground="#8B949E" Margin="0,8,0,0"/>
>         <TextBox x:Name="ValueBox" Height="28" Margin="0,4,0,0" Background="#161B22"
>                  Foreground="#8B949E" BorderBrush="#30363D"/>
>         <TextBlock Text="操作日志" Foreground="#8B949E" Margin="0,8,0,0"/>
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
>         private Session _session;
>
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
>                 var endpoint = CoreClientUtils.SelectEndpoint(config, UrlBox.Text, useSecurity: false);
>                 _session = await Session.Create(config, endpoint, false, "HmiDemo",
>                                                 60000, new UserIdentity(), null);
>                 StatusText.Text = "已连接 " + endpoint.EndpointUrl;
>                 StatusText.Foreground = System.Windows.Media.Brushes.LimeGreen;
>             }
>             catch (Exception ex)
>             {
>                 StatusText.Text = "连接失败：" + ex.Message;
>                 StatusText.Foreground = System.Windows.Media.Brushes.OrangeRed;
>             }
>         }
>
>         // 通过 NodeId 读取节点当前值
>         private void OnReadClick(object sender, RoutedEventArgs e)
>         {
>             if (_session == null) return;
>             try
>             {
>                 var nodeId = new NodeId(NodeBox.Text);
>                 DataValue value = _session.ReadValue(nodeId);
>                 ValueBox.Text = value.Value?.ToString();
>                 LogBox.AppendText($"读取 {nodeId} = {value.Value}\r\n");
>             }
>             catch (Exception ex) { LogBox.AppendText("读取失败：" + ex.Message + "\r\n"); }
>         }
>
>         // 向节点写入新值（数值型演示）
>         private void OnWriteClick(object sender, RoutedEventArgs e)
>         {
>             if (_session == null) return;
>             try
>             {
>                 var nodeId = new NodeId(NodeBox.Text);
>                 _session.WriteValue(nodeId, new DataValue(double.Parse(ValueBox.Text)));
>                 LogBox.AppendText($"已写入 {nodeId} = {ValueBox.Text}\r\n");
>             }
>             catch (Exception ex) { LogBox.AppendText("写入失败：" + ex.Message + "\r\n"); }
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ WPF 上位机读取/写入 OPC UA 服务器（PLC、传感器、网关）
> ✅ 需要异步不阻塞 UI 的 UA 操作（async/await 天然支持）
> ✅ 需要订阅推送高频数据的实时监控界面
> ✅ 自建 UA 模拟服务器做开发/测试（库内建 Server API）
> ❌ 设备仅支持 OPC Classic（需要 UA 网关桥接，本库不直接支持 DCOM）
> ❌ 只读几个寄存器（Modbus 客户端库更轻量）

> [!pitfall] 常见踩坑
> 坑 1：**异步方法没 await 导致连接未建立就操作** → Session.Create 是异步的，忘记 await 会拿到未连接会话，后续读写全抛异常；所有 UA 操作严格 await
> 
> 坑 2：**证书信任问题连接被拒** → 服务器拒绝未信任客户端（BadSecurityChecksFailed/BadCertificateUntrusted）；开发环境可关闭校验，生产环境导入对方证书到信任列表
> 
> 坑 3：**安全策略不一致握手失败** → 客户端配置的 SecurityPolicy（None/Sign/SignAndEncrypt）与服务器端点不一致；用 UaExpert 查服务器端点后对齐配置
> 
> 坑 4：**同步 .Result 阻塞 UI 线程死锁** → 库内部用到同步上下文，UI 线程调用 `.Result` 会死锁；一律用 async/await
> 
> 坑 5：**Session 异常后不重连** → 服务器重启/网络抖动后旧 Session 失效，读写抛 ServiceResultException；监听 SessionStatus/自动重建会话并重订阅

> [!best] 最佳实践
> - **封装 UAClientService**：连接状态、会话生命周期、读写方法收敛成一个类，界面只调业务方法
> - **配置外置**：端点 URL、安全模式、用户名密码放 App.config/JSON，不改代码切换环境
> - **订阅生命周期管理**：页面关闭时 RemoveMonitoredItem + DeleteSubscriptions，防止服务器残留
> - **统一异常处理**：连接/读写失败统一转为业务事件（Offline/ReadError），界面提示而非抛栈
> - **写操作权限校验**：写前确认节点可写（AccessLevel），只读节点写入返回 BadNotWritable 时给出友好提示

> [!practice] 上手练习
> **Lv.1 照猫画虎**：安装 NuGet 包，用库自带的 SampleServer 起一个本地 UA 服务器，运行示例完成连接/读取/写入
> **Lv.2 小试牛刀**：把读取改为订阅 2 个节点（如 Temperature、Pressure），界面实时显示变化值
> **Lv.3 融会贯通**：封装 UAClientService（连接管理 + 读写 + 订阅 + 断线重连），并接入 MVVM：按钮绑定命令，状态用属性绑定显示

> [!related] 相关知识链接
> - ← 前置知识：《OPC UA 核心概念》节点/订阅/地址空间
> - → 后续必学：《与 PLC 的 OPC UA 连接》真实 PLC 场景
> - ⇄ 关联概念：《OPC 概述（Classic vs UA）》选型
> - 📖 官方文档：https://github.com/OPCFoundation/UA-.NETStandard（官方 .NET UA 库与示例）
