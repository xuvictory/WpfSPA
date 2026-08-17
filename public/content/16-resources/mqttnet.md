---
title: MQTTnet
section: 16-resources
parent: 16.1 GitHub 优质 WPF 开源项目
---

# MQTTnet

> [!plain] 白话理解
> 设备数据除了"点对点问设备要"，还有一种更现代的玩法：**发到消息中间件，谁需要谁订阅**。MQTT 就是物联网/工业里最流行的轻量消息协议，**MQTTnet** 是 .NET 下最好用的实现。你的上位机既可以当**客户端**（发布设备状态、订阅指令），也可以内嵌**服务器（Broker）**让现场多台设备/大屏直接对接。它解决了"一台 PLC 的数据要让 10 个界面同时看"这类场景的耦合问题。

> [!def] 官方定义
> **MQTTnet** 是一个**社区开源**的高性能 .NET MQTT 客户端与服务端库（GitHub：https://github.com/dotnet/MQTTnet ，NuGet：`MQTTnet`），由 Christian Kratky（chkr1011）发起维护，支持 **MQTT 3.1.1 与 MQTT 5.0** 协议，提供 `MqttClient`、`MqttServer` 与完整的 `MqttApplicationMessage` 消息模型。它**不是微软官方库**（仓库托管在 dotnet 组织下但由社区维护），基于 .NET 标准实现，可运行在 WPF、ASP.NET Core、嵌入式等平台。MQTT 协议本身由 IBM 于 1999 年发明，后交予 OASIS 标准化（规范见 https://mqtt.org/ ），微软官方文档也认可其作为 IoT 通信协议之一（https://learn.microsoft.com/zh-cn/azure/iot-hub/iot-hub-mqtt-support ）。

> [!origin] 由来背景
> MQTT 诞生于 1999 年，IBM 为满足"石油管道卫星通信带宽极低"的场景设计了这套"发布/订阅"极简协议，2004 年开源，2013 年后由 OASIS 维护并迭代出 MQTT 5.0。**MQTTnet** 于 2016 年前后在 .NET 社区出现，针对当时 .NET 端缺乏高质量 MQTT 实现的问题，提供了统一支持客户端与服务端的库，且性能与 API 设计广受好评，成为 .NET 生态 MQTT 事实标准。在工业物联网中，上位机用它把设备数据上云或接入现场数据中心，实现"边缘网关 + 云端大屏"的架构。

> [!essentials] 核心要点
> - **客户端**：`new MqttFactory().CreateMqttClient()`，`MqttClientOptionsBuilder().WithTcpServer(host, port)` 构建连接
> - **连接**：`ConnectAsync(options, ct)`；连接成功后可 `SubscribeAsync(topic)` / `UnsubscribeAsync(topic)`
> - **发布**：`MqttApplicationMessageBuilder().WithTopic(t).WithPayload(payload).Build()` → `PublishAsync(msg)`
> - **接收**：`ApplicationMessageReceivedAsync += ...` 事件回调，`PayloadSegment` 为二进制负载需自行解码
> - **服务端**：`MqttFactory().CreateMqttServer()` + `MqttServerOptionsBuilder().WithDefaultEndpoint()`，内嵌 Broker
> - **QoS 与遗嘱**：`WithQualityOfServiceLevel` 设置投递保证；`WithWillTopic/WithWillPayload` 实现设备掉线遗嘱

> [!example] 完整示例
> **MQTTnet 客户端：连接 Broker、订阅主题、发布消息演示：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="MQTT 通信演示" Height="460" Width="480"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="MQTTnet 客户端" Foreground="#58A6FF" FontWeight="Bold" Margin="0,0,0,10"/>
>         <StackPanel Orientation="Horizontal" Margin="0,0,0,8">
>             <TextBlock Text="Broker：" Foreground="#8B949E" VerticalAlignment="Center"/>
>             <TextBox x:Name="BrokerBox" Text="127.0.0.1" Width="120" Margin="4,0,0,0"
>                      Background="#0D1117" Foreground="White" BorderBrush="#21262D"/>
>             <TextBlock Text="端口：" Foreground="#8B949E" VerticalAlignment="Center" Margin="12,0,0,0"/>
>             <TextBox x:Name="PortBox" Text="1883" Width="60" Margin="4,0,0,0"
>                      Background="#0D1117" Foreground="White" BorderBrush="#21262D"/>
>         </StackPanel>
>         <StackPanel Orientation="Horizontal" Margin="0,0,0,8">
>             <TextBlock Text="主题：" Foreground="#8B949E" VerticalAlignment="Center"/>
>             <TextBox x:Name="TopicBox" Text="factory/pump/status" Width="220" Margin="4,0,0,0"
>                      Background="#0D1117" Foreground="White" BorderBrush="#21262D"/>
>         </StackPanel>
>         <Button x:Name="ConnectBtn" Content="连接并订阅" Click="OnConnectClick" Margin="0,0,0,8"
>                 Padding="8" Background="#21262D" Foreground="White"/>
>         <Button x:Name="PublishBtn" Content="发布一条消息" Click="OnPublishClick" Margin="0,0,0,8"
>                 Padding="8" Background="#238636" Foreground="White" IsEnabled="False"/>
>         <TextBlock x:Name="StatusText" Foreground="#8B949E" Margin="0,4,0,8" TextWrapping="Wrap"/>
>         <Border Background="#161B22" Padding="8" CornerRadius="6">
>             <TextBox x:Name="LogBox" Height="140" IsReadOnly="True" TextWrapping="Wrap"
>                      Background="#161B22" Foreground="#8B949E" BorderThickness="0"/>
>         </Border>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Text;
> using System.Threading;
> using System.Threading.Tasks;
> using System.Windows;
> using MQTTnet;
> using MQTTnet.Client;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         // 需通过 NuGet 安装 MQTTnet 包（Install-Package MQTTnet）
>         private IMqttClient _client;
>
>         public MainWindow() => InitializeComponent();
>
>         private async void OnConnectClick(object sender, RoutedEventArgs e)
>         {
>             var factory = new MqttFactory();
>             _client = factory.CreateMqttClient();
>
>             // 订阅消息到达事件，在回调中把内容追加到日志框
>             _client.ApplicationMessageReceivedAsync += args =>
>             {
>                 var payload = Encoding.UTF8.GetString(args.ApplicationMessage.PayloadSegment);
>                 AppendLog($"[收到] {args.ApplicationMessage.Topic} : {payload}");
>                 return Task.CompletedTask;
>             };
>
>             var options = new MqttClientOptionsBuilder()
>                 .WithTcpServer(BrokerBox.Text, int.Parse(PortBox.Text))
>                 .WithClientId("HmiDemoClient")
>                 .Build();
>
>             try
>             {
>                 await _client.ConnectAsync(options, CancellationToken.None);
>                 await _client.SubscribeAsync(TopicBox.Text);
>                 StatusText.Text = "已连接并订阅主题：" + TopicBox.Text;
>                 PublishBtn.IsEnabled = true;
>             }
>             catch (Exception ex)
>             {
>                 StatusText.Text = "连接失败：" + ex.Message;
>             }
>         }
>
>         private async void OnPublishClick(object sender, RoutedEventArgs e)
>         {
>             // 上位机把设备状态发布到主题，供大屏、Web 等其他端订阅
>             var payload = "{\"pump\":1,\"rpm\":1450,\"status\":\"running\"}";
>             var message = new MqttApplicationMessageBuilder()
>                 .WithTopic(TopicBox.Text)
>                 .WithPayload(payload)
>                 .Build();
>             await _client.PublishAsync(message);
>             AppendLog("[发布] " + payload);
>         }
>
>         private void AppendLog(string line)
>         {
>             // 回调可能来自后台线程，通过 Dispatcher 切回 UI 线程
>             Dispatcher.Invoke(() => LogBox.Text =
>                 DateTime.Now.ToString("HH:mm:ss ") + line + "\n" + LogBox.Text);
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 设备数据多端共享：一台 PLC 数据同时供多台上位机、大屏、Web 看板查看
> ✅ 现场边缘网关：采集设备数据发布到 MQTT Broker，再上云或进数据库
> ✅ 产线消息总线：工位完成、质量告警等事件异步广播
> ✅ 上位机内嵌 Broker，多台设备/客户端本地直连免部署
> ❌ 与 PLC 一对一强实时轮询场景（MQTT 是异步消息模型，直接轮询 PLC 更简单）
> ❌ 需要可靠事务性消息的场合（MQTT QoS 只保证投递，不保证业务顺序）

> [!pitfall] 常见踩坑
> 坑 1：**回调线程操作 UI 崩溃/不刷新** → 现象：`ApplicationMessageReceivedAsync` 里直接改控件偶发异常 → 原因：回调在连接线程，不在 UI 线程 → 解决：用 `Dispatcher.Invoke` 切回 UI（见第 8 章异步）
>
> 坑 2：**消息丢了/收不到** → 现象：订阅后一直收不到设备消息 → 原因：主题不匹配（MQTT 通配符 `+`/`#` 误用）、QoS 为 0、Broker 地址错误 → 解决：用 `mqttx` 工具同时订阅同主题验证 Broker 通路，再查程序主题拼写
>
> 坑 3：**断线后不会自动重连** → 现象：Broker 重启后上位机一直离线 → 原因：MQTTnet 不会自动重连，需监听 `DisconnectedAsync` 事件 → 解决：在 `DisconnectedAsync` 中按退避策略（如 5 秒后）重新 `ConnectAsync`

> [!best] 最佳实践
> - 主题命名统一规范：`工厂/车间/设备/数据类型`（如 `factory/shop1/pump1/temperature`），便于权限与统计
> - 负载固定用 JSON（`System.Text.Json` 序列化），字段名稳定，便于多端解析
> - 设备侧开启**遗嘱消息**，主机订阅 `$SYS` 或自定义遗嘱主题实现设备掉线感知
> - 数据量大时用 QoS 1 + 本地缓存重试，避免丢数据；报警等关键消息可 QoS 2
> - 客户端 ID 唯一（`WithClientId`），多实例重复会导致互踢

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行本节示例，用 `mqttx` 工具连接同一 Broker，验证订阅与发布互通
> **Lv.2 小试牛刀**：给示例加"断开重连"逻辑：监听 `DisconnectedAsync`，5 秒后自动重连
> **Lv.3 融会贯通**：把示例改造成"设备状态发布器"：每 2 秒采集温度并发布 JSON 主题
> **Lv.4 拆层挑战**：用 `MqttServer` 内嵌 Broker 到上位机，让多台客户端直连，并用遗嘱消息实现掉线告警

> [!related] 相关知识链接
> - ← 前置知识：第 8 章（异步）、`什么是-mvvm`（07）
> - → 后续必学：[`通信调试工具vspdmqttxmodbus-poll`](通信调试工具vspdmqttxmodbus-poll)（MQTTX 联调工具）
> - ⇄ 关联概念：[`开源-scada-项目`](开源-scada-项目)（SCADA 消息总线）、`上位机日志场景`（12）
> - 📖 官方文档：https://github.com/dotnet/MQTTnet ；MQTT 协议：https://mqtt.org/
