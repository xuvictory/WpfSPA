---
title: .NET 中使用 MQTT（MQTTnet）
section: 09-communication
parent: 9.6 MQTT 协议
---

# .NET 中使用 MQTT（MQTTnet）

> [!plain] 白话理解
> .NET 生态做 MQTT 几乎必选 MQTTnet 这个 NuGet 包：它把"连接 Broker、发布消息、订阅主题、处理回调"全封装成异步 API，三五行代码就能跑通收发。示例把连接、订阅、发布、接收消息四个核心动作完整演示了一遍——其中"消息回调在后台线程，更新 WPF 控件要切线程"是唯一需要特别注意的点。

> [!def] 官方定义
> MQTTnet 是 .NET（支持 .NET Framework 4.6+/.NET Core/.NET 5+）下最流行的开源 MQTT 客户端/服务器库（GitHub 高星项目，许可证 MIT）。核心类型：MqttClientFactory（创建客户端）、MqttClientOptionsBuilder（配置 Broker 地址/端口/ClientId/账号密码/遗嘱）、MqttClientOptions、ConnectAsync/DisconnectAsync（连接管理）、SubscribeAsync/UnsubscribeAsync（订阅管理，可带 QoS）、PublishAsync（发布，支持 QoS 与 Retain）、ApplicationMessageReceivedAsync 事件（接收消息回调）。库内还含 MqttServer 实现，可在本机模拟 Broker。

> [!origin] 由来背景
> .NET 早期做 MQTT 客户端要么用 M2Mqtt（停更已久、API 老旧），要么自己拼报文，体验不佳。MQTTnet 由德国开发者 Christian Kratky 创建，以"完全异步、高性能、跨平台、客户端服务器双支持"迅速成为 .NET 社区标准选择，几乎取代了旧库。它持续跟进 MQTT 5.0 特性，且提供可注入的日志/存储扩展点，让 WPF 上位机接入 MQTT 变得简单可靠——这也是官方文档和社区示例普遍采用它的原因。

> [!essentials] 核心要点
> - **NuGet 包**：`MQTTnet`（最新稳定版），命名空间 `MQTTnet` / `MQTTnet.Client`
> - **创建客户端**：`new MqttClientFactory().CreateMqttClient()`，一次创建复用，不要每次收发都重建
> - **配置连接**：`MqttClientOptionsBuilder().WithTcpServer("broker.emqx.io", 1883).WithClientId(Guid.NewGuid().ToString())`
> - **异步操作**：ConnectAsync/SubscribeAsync/PublishAsync 全部 async，UI 调用需 await（按钮事件可 async void）
> - **接收回调**：`ApplicationMessageReceivedAsync` 返回 Task，处理消息后可返回 CompletedTask；回调在后台线程
> - **发布参数**：`new MqttApplicationMessageBuilder().WithTopic(...).WithPayload(...).WithQualityOfServiceLevel(...)`
> - **连接事件**：`ConnectedAsync`/`DisconnectedAsync` 可做状态提示与自动重连
> - **释放**：窗口关闭 DisconnectAsync + Dispose，防止连接泄漏

> [!example] 完整示例
> **MQTTnet 客户端演示：连接 Broker、订阅主题、发布消息（需安装 NuGet 包 MQTTnet）：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="MQTTnet - 发布与订阅" Height="520" Width="560"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="MQTTnet 三步走：Connect → Subscribe → Publish"
>                    Foreground="#58A6FF" FontWeight="Bold"/>
>         <StackPanel Orientation="Horizontal" Margin="0,8,0,0">
>             <TextBlock Text="Broker" Foreground="#8B949E" VerticalAlignment="Center"/>
>             <TextBox x:Name="BrokerBox" Text="broker.emqx.io" Width="140" Margin="8,0,0,0"
>                      Background="#161B22" Foreground="#8B949E" BorderBrush="#30363D"/>
>             <Button Content="连接" Click="OnConnectClick" Padding="10,4" Margin="8,0,0,0"
>                     Background="#238636" Foreground="White"/>
>         </StackPanel>
>         <StackPanel Orientation="Horizontal" Margin="0,8,0,0">
>             <TextBlock Text="订阅主题" Foreground="#8B949E" VerticalAlignment="Center"/>
>             <TextBox x:Name="SubTopicBox" Text="hmi/cmd" Width="160" Margin="8,0,0,0"
>                      Background="#161B22" Foreground="#8B949E" BorderBrush="#30363D"/>
>             <Button Content="订阅" Click="OnSubscribeClick" Padding="10,4" Margin="8,0,0,0"
>                     Background="#21262D" Foreground="White"/>
>         </StackPanel>
>         <TextBlock Text="收到的消息" Foreground="#8B949E" Margin="0,8,0,0"/>
>         <TextBox x:Name="RecvBox" Height="90" IsReadOnly="True" TextWrapping="Wrap"
>                  Background="#161B22" Foreground="#8B949E" BorderBrush="#30363D"/>
>         <StackPanel Orientation="Horizontal" Margin="0,8,0,0">
>             <TextBlock Text="发布主题" Foreground="#8B949E" VerticalAlignment="Center"/>
>             <TextBox x:Name="PubTopicBox" Text="hmi/data" Width="120" Margin="8,0,0,0"
>                      Background="#161B22" Foreground="#8B949E" BorderBrush="#30363D"/>
>         </StackPanel>
>         <TextBox x:Name="PayloadBox" Height="40" Margin="0,8,0,0" Background="#161B22"
>                  Foreground="#8B949E" BorderBrush="#30363D"/>
>         <Button Content="发布消息" Click="OnPublishClick" Padding="10,4" Margin="0,8,0,0"
>                 HorizontalAlignment="Left" Background="#238636" Foreground="White"/>
>         <TextBlock x:Name="StatusText" Foreground="#8B949E" Margin="0,8,0,0" TextWrapping="Wrap"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Text;
> using System.Threading.Tasks;
> using System.Windows;
> using MQTTnet;
> using MQTTnet.Client;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private IMqttClient _client;
>
>         public MainWindow() => InitializeComponent();
>
>         private async void OnConnectClick(object sender, RoutedEventArgs e)
>         {
>             try
>             {
>                 var factory = new MqttFactory();
>                 _client = factory.CreateMqttClient();
>                 _client.ApplicationMessageReceivedAsync += OnMessageReceived;
>                 var options = new MqttClientOptionsBuilder()
>                     .WithTcpServer(BrokerBox.Text, 1883)
>                     .WithClientId($"hmi-{Guid.NewGuid():N}")
>                     .WithCleanSession()
>                     .Build();
>                 await _client.ConnectAsync(options);
>                 StatusText.Text = "已连接 " + BrokerBox.Text;
>                 StatusText.Foreground = System.Windows.Media.Brushes.LimeGreen;
>             }
>             catch (Exception ex)
>             {
>                 StatusText.Text = "连接失败：" + ex.Message;
>                 StatusText.Foreground = System.Windows.Media.Brushes.OrangeRed;
>             }
>         }
>
>         private async void OnSubscribeClick(object sender, RoutedEventArgs e)
>         {
>             if (_client == null || !_client.IsConnected) return;
>             await _client.SubscribeAsync(SubTopicBox.Text);
>             StatusText.Text = "已订阅 " + SubTopicBox.Text;
>             StatusText.Foreground = System.Windows.Media.Brushes.LimeGreen;
>         }
>
>         private async void OnPublishClick(object sender, RoutedEventArgs e)
>         {
>             if (_client == null || !_client.IsConnected) return;
>             await _client.PublishAsync(new MqttApplicationMessageBuilder()
>                 .WithTopic(PubTopicBox.Text)
>                 .WithPayload(Encoding.UTF8.GetBytes(PayloadBox.Text))
>                 .WithQualityOfServiceLevel(MQTTnet.Protocol.MqttQualityOfServiceLevel.AtLeastOnce)
>                 .Build());
>             StatusText.Text = "已发布到 " + PubTopicBox.Text;
>         }
>
>         private Task OnMessageReceived(MqttApplicationMessageReceivedEventArgs e)
>         {
>             string msg = $"[{e.ApplicationMessage.Topic}] " +
>                          $"{e.ApplicationMessage.ConvertPayloadToString()}";
>             Dispatcher.Invoke(() => RecvBox.AppendText(msg + "\r\n"));
>             return Task.CompletedTask;
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ WPF 上位机订阅云端/网关发布的设备状态与告警
> ✅ 上位机向云端上报数据（采集 → 封装 JSON → Publish）
> ✅ 多客户端协同（工位机、看板、手机同时订阅）
> ✅ 本机自建 MqttServer 做开发联调（库内建服务器）
> ❌ 严格实时控制（异步消息不适合闭环控制）
> ❌ 纯点对点简单通信（Modbus/SerialPort 更直接）

> [!pitfall] 常见踩坑
> 坑 1：**版本差异 API 变动** → MQTTnet 4.x 把工厂类改为 `MqttClientFactory`、消息接收是 `ApplicationMessageReceivedAsync` 事件，按 3.x 老教程写会编译不过；先确认 NuGet 版本再查对应文档
> 
> 坑 2：**忘记 await 连接完成就发布** → ConnectAsync 未完成时 PublishAsync 会抛"未连接"异常；先 await ConnectAsync 并检查 IsConnected 再发
> 
> 坑 3：**消息事件回调里做耗时操作** → ApplicationMessageReceivedAsync 回调在高频订阅下被密集调用，里面做数据库写入会拖垮；只投递到队列，消费端异步处理
> 
> 坑 4：**客户端退出不 CleanSession/不 Disconnect** → 若 CleanSession=false 又正常下线，Broker 保留会话导致重连后收到堆积旧消息；退出时显式 DisconnectAsync 并按需清理会话
> 
> 坑 5：**断线不重连** → 网络抖动断线后消息静默丢失；在 DisconnectedAsync 里实现退避重连，并把连接状态事件通知 UI 显示"离线"

> [!best] 最佳实践
> - **封装 MqttService**：连接状态、重连、订阅表集中管理，界面只订阅"消息到达"事件与调用 Send 方法
> - **自动重连**：DisconnectedAsync 中延时（如 5s）后 ReconnectAsync，注意退避与停止标志防无限重连
> - **消息统一走 JSON 序列化**：定义消息 DTO，序列化/反序列化在封装层完成，业务层面对强类型
> - **主题集中定义常量**：主题字符串收敛到静态类（TopicDefs.Temp = "factory/line1/temp"），避免散落魔法字符串
> - **QoS 与 Retain 显式指定**：不依赖库默认值，按数据类型显式设置，避免"静默丢消息"或"收到陈旧消息"

> [!practice] 上手练习
> **Lv.1 照猫画虎**：安装 MQTTnet 运行示例，连接公共 Broker 完成订阅+发布，用 MQTTX 双向验证收发
> **Lv.2 小试牛刀**：给示例增加"自动重连"：杀掉 Broker 进程观察 DisconnectedAsync 触发，重启 Broker 后验证自动恢复订阅
> **Lv.3 融会贯通**：封装 MqttService（连接/重连/订阅/JSON 消息），接入 MVVM：设备状态列表订阅云端主题实时刷新

> [!related] 相关知识链接
> - ← 前置知识：《MQTT 概述与核心概念》主题/QoS/遗嘱
> - → 后续必学：《上位机 MQTT 应用》完整业务落地
> - ⇄ 关联概念：《网络基础概念（IP 端口 TCP vs UDP）》
> - 📖 官方文档：https://github.com/dotnet/MQTTnet（MQTTnet 仓库与示例）
