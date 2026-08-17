---
title: 上位机 MQTT 应用
section: 09-communication
parent: 9.6 MQTT 协议
---

# 上位机 MQTT 应用

> [!plain] 白话理解
> 把前面的 MQTT 知识串成一个真实业务：现场网关把设备数据发到 Broker，WPF 上位机订阅后实时展示在一张"设备状态看板"上，同时支持向设备下发指令。示例演示了从"订阅主题 → 解析 JSON → 更新界面 → 指令下发"的完整闭环，还演示了"设备离线检测"——这是远程监控场景最常见的需求组合。

> [!def] 官方定义
> 上位机 MQTT 应用指以 MQTT 为核心通信手段的完整上位机业务实现，典型架构：设备侧（PLC/传感器/网关，发布采集数据到主题）→ Broker（MQTT 服务器，消息路由）→ 上位机（订阅主题，解析消息，界面展示与指令下发）。上位机侧核心能力：①订阅管理（多主题 + 通配符）；②消息解析（JSON 反序列化为强类型）；③状态看板（设备在线状态、实时数据、告警）；④指令下发（控制消息发布 + 应答确认）；⑤离线检测（遗嘱消息/心跳超时）。本文给出设备监控看板的可运行骨架。

> [!origin] 由来背景
> 传统上位机与设备直连，数据只在本机可见，远程监控、多端协作、上云都难以实现。引入 MQTT 后，采集与展示解耦：数据一次发布，任意端（本地上位机、Web 看板、手机 App、云平台）可订阅消费；设备故障、产线停机等信息也能实时推送告警。随着"设备上云"成为工厂数字化标配，MQTT 型上位机架构（采集端 + Broker + 展示端）已成为远程监控类项目的首选模式。

> [!essentials] 核心要点
> - **订阅主题设计**：设备数据 `factory/devices/{id}/data`、状态 `.../status`、指令应答 `.../ack`；用通配符订阅一批设备
> - **JSON 解析**：消息体反序列化为强类型 DTO（DeviceData { Id, Temp, Pressure, Ts }），解析失败要跳过并计数
> - **界面刷新**：消息回调后台线程 → 解析 → Dispatcher.Invoke 更新绑定属性；高频数据节流合并刷新
> - **在线状态判定**：收到 data/status 即在线 + 记录时间戳；遗嘱消息 `.../will` 置离线；超过 N 秒无心跳也判离线
> - **指令下发与应答**：发布控制消息到 `.../cmd` 主题，设备执行后回 ack；上位机用超时机制确认下发成功
> - **断线重连**：Broker 掉线自动重连并重订阅（CleanSession=false 可恢复订阅）；状态栏显示连接状态
> - **消息去重**：QoS1 可能重复投递，按消息 ID/时间戳去重，避免看板数据抖动

> [!example] 完整示例
> **上位机 MQTT 应用演示：设备状态定时上报 + 指令下发响应（需安装 NuGet 包 MQTTnet）：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="上位机 MQTT 应用" Height="480" Width="540"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="场景：设备状态上报(定时发布) + 指令下发(订阅响应)"
>                    Foreground="#58A6FF" FontWeight="Bold" TextWrapping="Wrap"/>
>         <StackPanel Orientation="Horizontal" Margin="0,8,0,0">
>             <Button x:Name="StartBtn" Content="开始上报" Click="OnStartClick" Padding="10,4"
>                     Background="#238636" Foreground="White"/>
>             <Button x:Name="StopBtn" Content="停止上报" IsEnabled="False" Click="OnStopClick"
>                     Padding="10,4" Margin="8,0,0,0" Background="#DA3633" Foreground="White"/>
>         </StackPanel>
>         <TextBlock Text="通信日志" Foreground="#8B949E" Margin="0,8,0,0"/>
>         <ListBox x:Name="LogList" Height="220" Background="#161B22" Foreground="#8B949E"
>                  BorderBrush="#30363D"/>
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
> using System.Windows.Threading;
> using MQTTnet;
> using MQTTnet.Client;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private IMqttClient _client;
>         private readonly DispatcherTimer _timer = new DispatcherTimer();
>         private int _reportCount;
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             _timer.Interval = TimeSpan.FromSeconds(2);
>             _timer.Tick += OnReportTick;
>         }
>
>         // 连接 Broker，订阅指令主题，启动定时上报
>         private async void OnStartClick(object sender, RoutedEventArgs e)
>         {
>             try
>             {
>                 var factory = new MqttFactory();
>                 _client = factory.CreateMqttClient();
>                 _client.ApplicationMessageReceivedAsync += OnCommandReceived;
>                 var options = new MqttClientOptionsBuilder()
>                     .WithTcpServer("broker.emqx.io", 1883)
>                     .WithClientId($"device-{Guid.NewGuid():N}")
>                     .WithCleanSession()
>                     .Build();
>                 await _client.ConnectAsync(options);
>                 await _client.SubscribeAsync("hmi/device1/cmd"); // 订阅指令下发主题
>                 _timer.Start();
>                 StartBtn.IsEnabled = false;
>                 StopBtn.IsEnabled = true;
>                 AppendLog("已连接 Broker，订阅指令主题，开始上报状态");
>             }
>             catch (Exception ex) { AppendLog("连接失败：" + ex.Message); }
>         }
>
>         private async void OnStopClick(object sender, RoutedEventArgs e)
>         {
>             _timer.Stop();
>             if (_client != null) await _client.DisconnectAsync();
>             StartBtn.IsEnabled = true;
>             StopBtn.IsEnabled = false;
>             AppendLog("已停止上报并断开");
>         }
>
>         // 每 2 秒向状态主题发布一次设备数据
>         private async void OnReportTick(object sender, EventArgs e)
>         {
>             _reportCount++;
>             string payload = $"{{\"dev\":\"device1\",\"count\":{_reportCount}," +
>                              $"\"temp\":{20 + _reportCount % 10},\"state\":\"running\"}}";
>             await _client.PublishAsync(new MqttApplicationMessageBuilder()
>                 .WithTopic("hmi/device1/status")
>                 .WithPayload(Encoding.UTF8.GetBytes(payload))
>                 .Build());
>             AppendLog($"[上报] {payload}");
>         }
>
>         // 收到指令：模拟执行并回复结果
>         private async Task OnCommandReceived(MqttApplicationMessageReceivedEventArgs e)
>         {
>             string cmd = e.ApplicationMessage.ConvertPayloadToString();
>             AppendLog($"[收到指令] {cmd}");
>             string reply = $"{{\"dev\":\"device1\",\"ack\":true,\"cmd\":\"{cmd}\"}}";
>             await _client.PublishAsync(new MqttApplicationMessageBuilder()
>                 .WithTopic("hmi/device1/reply")
>                 .WithPayload(Encoding.UTF8.GetBytes(reply))
>                 .Build());
>         }
>
>         private void AppendLog(string msg) =>
>             Dispatcher.Invoke(() => LogList.Items.Add($"{DateTime.Now:HH:mm:ss}  {msg}"));
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 上位机数据展示与交互界面开发
> ✅ 工业自动化设备状态监控系统
> ✅ 需要高效数据绑定的实时数据处理场景
> ✅ 多窗口、多页面复杂导航的企业级应用
> ❌ 简单的控制台工具程序（用控制台更省事）
> ❌ 对性能要求极端苛刻的底层驱动开发（用 C++ 更合适）

> [!pitfall] 常见踩坑
> 坑 1：**JSON 字段大小写/缺失导致解析异常** → 用 System.Text.Json 的 JsonSerializerOptions 设置大小写不敏感，解析失败 try-catch 并记录原始消息，别让一条坏消息崩掉整个回调
>
> 坑 2：**高频消息把界面刷死** → 每帧都 Dispatcher.Invoke 会卡死 UI；把最新数据存入缓存，用 DispatcherTimer（如 200ms）统一刷新界面
>
> 坑 3：**离线判定只靠遗嘱消息** → 设备"优雅下线"才发遗嘱，断电/断网发不出；必须叠加"心跳超时"（最后消息时间 > N 秒判离线）双保险
>
> 坑 4：**指令下发无应答就以为成功** → 设备可能没收到或没执行；发布 cmd 后等 ack，超时（如 3s）提示"下发失败"
>
> 坑 5：**重连后没重订阅，数据静默丢失** → CleanSession=false 能恢复订阅；若用 true 必须在 ConnectedAsync 中重新 SubscribeAsync

> [!best] 最佳实践
> - **消息协议版本化**：JSON 消息带 `ver` 字段，字段变更时老客户端仍可解析，避免强制同步升级
> - **订阅与消息处理分离**：一个订阅处理器（Subscribe/Recv）负责接收与反序列化，业务处理走独立 Dispatcher/队列
> - **设备 ID 映射主题**：维护"设备名 → 主题"配置表，新增设备只改配置不改代码
> - **看板刷新节流**：界面刷新频率（如 500ms）与数据到达频率解耦，缓存最新值定时刷新
> - **全链路日志**：记录"收到主题/解析成功/界面更新/下发 cmd"各环节时间戳，远程排障关键

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例连接 Broker，用 MQTTX 向设备数据主题发 JSON 消息，观察看板实时更新
> **Lv.2 小试牛刀**：增加"离线检测"：停止发送消息 5 秒后设备变灰，恢复发送后自动变绿（用时间戳超时判定）
> **Lv.3 融会贯通**：把看板改造成 MVVM：设备列表（ObservableCollection）+ 属性绑定 + 指令下发命令，并增加"告警超限变红"规则

> [!related] 相关知识链接
> - ← 前置知识：《MQTT 概述与核心概念》《.NET 中使用 MQTT（MQTTnet）》
> - → 后续必学：《异步通信与高并发》优化大量消息处理
> - ⇄ 关联概念：《上位机通信应用场景》《上位机通信协议全景图》
> - 📖 官方文档：https://www.emqx.com/zh（EMQX Broker 部署与 MQTT 教程）
