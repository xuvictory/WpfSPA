---
title: WebSocket 全双工通信
section: 09-communication
parent: 9.7 其他通信方式
---

# WebSocket 全双工通信

> [!plain] 白话理解
> HTTP 是"一问一答"（客户端请求→服务器响应→断开），服务器想主动推数据只能靠轮询。WebSocket 则是一条"双向长通道"：握手后客户端和服务器随时都能互发消息。上位机用它对接 Web 看板、浏览器 HMI 非常合适——网页不用刷新就能实时显示设备数据。示例演示了用 .NET 的 WebSocket 客户端连接服务并接收实时推送的完整流程。

> [!def] 官方定义
> WebSocket 是基于 TCP 的全双工通信协议（RFC 6455），通过 HTTP Upgrade 握手建立：客户端发 `GET ... Upgrade: websocket` 请求，服务端返回 101 Switching Protocols 后连接升级为 WebSocket。此后双方可随时互发数据帧（文本/二进制），无需重新握手。.NET 提供 ClientWebSocket（客户端，支持 wss:// 加密）与 System.Net.WebSockets 服务器端；客户端 API：ConnectAsync、SendAsync、ReceiveAsync、CloseAsync。适用于浏览器-服务器、实时看板、双向推送场景。

> [!origin] 由来背景
> 早期 Web 应用要实现"实时"只能靠 HTTP 轮询（客户端不断问"有新数据吗"），浪费带宽且延迟高；长轮询、Server-Sent Events 等方案也各有限制。2011 年 RFC 6455 发布 WebSocket，在单一 TCP 连接上实现真正的双向实时通信，浏览器原生支持，WebSocket 很快成为实时 Web 的标准。对工控而言，它让"浏览器当 HMI 看板""远程监控页面实时刷新"成为现实，上位机作为数据源用 WebSocket 把设备数据推给 Web 端。

> [!essentials] 核心要点
> - **核心类**：ClientWebSocket（客户端）；WebSocket 服务端可用 ASP.NET Core 或自建监听
> - **握手升级**：ConnectAsync(uri) 内部完成 HTTP Upgrade；uri 用 ws://（明文）或 wss://（TLS 加密）
> - **发送**：SendAsync(buffer, WebSocketMessageType.Text/Binary, true, ct)；文本用 UTF8 编码
> - **接收**：ReceiveAsync 返回 WebSocketReceiveResult，MessageType=Close 表示对端关闭；EndOfMessage=false 需继续收
> - **帧与消息**：大消息分多帧到达，需循环接收并拼接直至 EndOfMessage=true
> - **保持连接**：客户端需定期发 Ping 帧或应用层心跳，检测死连接（代理超时会静默断开）
> - **关闭流程**：CloseAsync(WebSocketCloseStatus.NormalClosure, ...) 优雅关闭，服务端收到后回 Close 帧
> - **跨线程**：ReceiveAsync 循环放后台任务，UI 更新要切线程

> [!example] 完整示例
> **WebSocket 全双工演示：ClientWebSocket 连接公共 Echo 服务，同一条连接上双向同时收发：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="WebSocket 全双工通信" Height="480" Width="540"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="ClientWebSocket：一条 TCP 连接上双向同时收发（全双工）"
>                    Foreground="#58A6FF" FontWeight="Bold" TextWrapping="Wrap"/>
>         <StackPanel Orientation="Horizontal" Margin="0,8,0,0">
>             <Button Content="连接 wss://echo.websocket.org" Click="OnConnectClick" Padding="10,4"
>                     Background="#238636" Foreground="White"/>
>             <Button Content="断开" Click="OnDisconnectClick" Padding="10,4" Margin="8,0,0,0"
>                     Background="#DA3633" Foreground="White"/>
>         </StackPanel>
>         <TextBox x:Name="SendBox" Height="40" Margin="0,8,0,0" Background="#161B22"
>                  Foreground="#8B949E" BorderBrush="#30363D"/>
>         <Button Content="发送（Echo 服务器原样返回）" Click="OnSendClick" Padding="10,4" Margin="0,8,0,0"
>                 Background="#21262D" Foreground="White"/>
>         <TextBox x:Name="LogBox" Height="150" IsReadOnly="True" TextWrapping="Wrap"
>                  Margin="0,8,0,0" Background="#161B22" Foreground="#8B949E"
>                  BorderBrush="#30363D" VerticalScrollBarVisibility="Auto"/>
>         <TextBlock x:Name="StatusText" Foreground="#8B949E" Margin="0,8,0,0" TextWrapping="Wrap"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Net.WebSockets;
> using System.Text;
> using System.Threading;
> using System.Threading.Tasks;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private ClientWebSocket _ws;
>         private CancellationTokenSource _cts;
>
>         public MainWindow() => InitializeComponent();
>
>         // 建立 WebSocket 连接（依赖公共测试服务，需联网）
>         private async void OnConnectClick(object sender, RoutedEventArgs e)
>         {
>             try
>             {
>                 _ws = new ClientWebSocket();
>                 _cts = new CancellationTokenSource();
>                 await _ws.ConnectAsync(new Uri("wss://echo.websocket.org"), _cts.Token);
>                 AppendLog("连接成功，开始接收消息...");
>                 _ = ReceiveLoopAsync(); // 后台持续接收
>                 StatusText.Text = "已连接（全双工）";
>                 StatusText.Foreground = System.Windows.Media.Brushes.LimeGreen;
>             }
>             catch (Exception ex)
>             {
>                 StatusText.Text = "连接失败：" + ex.Message;
>                 StatusText.Foreground = System.Windows.Media.Brushes.OrangeRed;
>             }
>         }
>
>         private async void OnDisconnectClick(object sender, RoutedEventArgs e)
>         {
>             if (_ws != null && _ws.State == WebSocketState.Open)
>                 await _ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "bye", CancellationToken.None);
>             _cts?.Cancel();
>             AppendLog("已断开");
>             StatusText.Text = "已断开";
>             StatusText.Foreground = System.Windows.Media.Brushes.Gray;
>         }
>
>         // 发送：SendAsync 随时可发，与接收互不阻塞
>         private async void OnSendClick(object sender, RoutedEventArgs e)
>         {
>             if (_ws == null || _ws.State != WebSocketState.Open) return;
>             byte[] data = Encoding.UTF8.GetBytes(SendBox.Text);
>             await _ws.SendAsync(new ArraySegment<byte>(data),
>                                 WebSocketMessageType.Text, true, CancellationToken.None);
>             AppendLog($"[发送] {SendBox.Text}");
>         }
>
>         // 接收循环：服务端推送的消息持续进入
>         private async Task ReceiveLoopAsync()
>         {
>             byte[] buffer = new byte[4096];
>             while (_ws.State == WebSocketState.Open)
>             {
>                 var result = await _ws.ReceiveAsync(new ArraySegment<byte>(buffer), _cts.Token);
>                 if (result.MessageType == WebSocketMessageType.Close) break;
>                 string msg = Encoding.UTF8.GetString(buffer, 0, result.Count);
>                 AppendLog($"[接收] {msg}");
>             }
>         }
>
>         private void AppendLog(string msg) =>
>             Dispatcher.Invoke(() => LogBox.AppendText(msg + "\r\n"));
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
> 坑 1：**ReceiveAsync 一次没收完整条消息** → 大消息分帧到达，EndOfMessage=false 时必须继续循环接收拼接，否则丢数据
>
> 坑 2：**收不到服务端主动推送** → 检查服务端是否真的在推送、客户端是否在接收循环中；有的库需要显式启动接收 Task，别等消息自动来
>
> 坑 3：**代理/防火墙静默断开连接** → 无活动时代理会断开 WebSocket；定期发 Ping/心跳保活，收到 Close 帧或异常后自动重连
>
> 坑 4：**Text 与 Binary 混用解析失败** → 协议里约定统一用 Text（JSON）或 Binary；收到对方不支持的帧类型要兼容处理
>
> 坑 5：**UI 线程卡在 ConnectAsync** → 握手和接收都是异步的，别在 UI 线程同步等待；用 await + CancellationToken

> [!best] 最佳实践
> - **封装 WsClientService**：连接、接收循环、重连、消息分发收敛成服务类，UI 只订阅消息事件
> - **JSON 消息协议**：消息统一 `{type, data}` 结构，按 type 分发处理，扩展业务不改连接层
> - **心跳保活**：每 30s 发 Ping 或心跳消息；连续无响应判定断线并重连（带退避）
> - **重连后重订阅**：断线重连成功后重新发送订阅请求，恢复数据推送
> - **限流与节流**：高频推送合并/限流，避免打爆 UI 线程；界面刷新用定时器节流

> [!practice] 上手练习
> **Lv.1 照猫画虎**：用公共 WebSocket 回显服务（如 wss://echo.websocket.org）运行示例，验证双向收发
> **Lv.2 小试牛刀**：给示例增加"心跳保活"：每 30 秒发 Ping，状态栏显示最后心跳时间；断开服务后验证自动重连
> **Lv.3 融会贯通**：实现一个"数据推送服务"：上位机作为 WebSocket 客户端订阅设备数据，转发给本地启动的 WebSocket 服务，浏览器打开页面即可实时看数

> [!related] 相关知识链接
> - ← 前置知识：《HTTP API 调用》理解与 HTTP 的区别、《TCP 通信（TcpListener、TcpClient）》底层
> - → 后续必学：《异步通信与高并发》优化推送性能
> - ⇄ 关联概念：《上位机 MQTT 应用》（同属推送型通信，可对比选型）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.net.websockets.clientwebsocket
