---
title: TCP 通信（TcpListener、TcpClient）
section: 09-communication
parent: 9.3 Socket 网络通信
---

# TCP 通信（TcpListener、TcpClient）

> [!plain] 白话理解
> TCP 是上位机网络通信最常用的方式：一端是服务器（TcpListener，开端口等人连），一端是客户端（TcpClient，连服务器）。连上后就是一条"可靠管道"，两边都能随时写字节、读字节。上位机既可以是客户端（连 PLC/服务器），也可以是服务器（接收设备上报、供看板连接）。本文演示这两种角色的最小实现，并处理了"断线重连"这个网络通信的必备能力。

> [!def] 官方定义
> .NET 的 System.Net.Sockets 提供 TcpListener（TCP 服务器端）与 TcpClient（客户端）封装。TcpListener：Start() 开始监听、AcceptTcpClientAsync() 接受连接返回 TcpClient、Stop() 停止。TcpClient：ConnectAsync(ip, port) 连接、GetStream() 获取 NetworkStream 用于读写、Connected 属性、Close() 释放。NetworkStream.ReadAsync/WriteAsync 传输字节流；断线检测通过 ReadAsync 返回 0 或抛异常判断。TCP 是面向连接的可靠字节流，适合 Modbus TCP、自定义帧协议等上位机业务。

> [!origin] 由来背景
> 早期 .NET 写 TCP 服务要直接操作 Socket API（Bind/Listen/Accept/Receive），代码啰嗦且易错。.NET Framework 2.0 起提供 TcpListener/TcpClient 这对高级封装，把监听、连接、流读写收敛成几行代码，成为 C# 网络编程的事实标准。随着上位机联网需求增长（连 PLC、接网关、供看板展示），这对类几乎出现在每个工控项目的通信层；配合 async/await 异步模式后，即使大量客户端连接也不会阻塞 UI。

> [!essentials] 核心要点
> - **服务端三步**：TcpListener.Start() 监听 → AcceptTcpClientAsync() 接受连接 → 对每个客户端开独立线程/任务读写
> - **客户端两步**：ConnectAsync(ip, port) → GetStream() 用 NetworkStream 读写字节
> - **读是阻塞的**：ReadAsync 返回 0 表示对端关闭；读不到数据时会挂起等待，必须在独立任务中调用，别堵 UI 线程
> - **消息边界问题**：TCP 是字节流，一次发送可能拆成多次接收，多次发送也可能粘包；必须自己定义帧边界（长度前缀/分隔符）
> - **断线检测**：读返回 0 或读写抛 SocketException 即断线；客户端需重连逻辑，服务端需清理断开客户端
> - **并发连接**：AcceptTcpClientAsync 循环 + 每连接一个 Task，客户端多时用客户端列表管理
> - **超时设置**：ReadTimeout/WriteTimeout 必须设置，否则设备离线时读会无限等待
> - **优雅关闭**：关闭前 shutdown 发送端、关闭流、再 Close，顺序错会丢数据

> [!example] 完整示例
> **TCP 通信演示：TcpListener 服务端监听 + TcpClient 客户端连接，本机回环测试：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="TCP 通信 - TcpListener / TcpClient" Height="520" Width="540"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="服务端（TcpListener，端口 8888）" Foreground="#58A6FF" FontWeight="Bold"/>
>         <StackPanel Orientation="Horizontal" Margin="0,6,0,0">
>             <Button Content="启动监听" Click="OnStartListen" Padding="10,4"
>                     Background="#238636" Foreground="White"/>
>             <Button Content="停止监听" Click="OnStopListen" Padding="10,4" Margin="8,0,0,0"
>                     Background="#DA3633" Foreground="White"/>
>         </StackPanel>
>         <TextBox x:Name="ServerLog" Height="80" IsReadOnly="True" TextWrapping="Wrap"
>                  Margin="0,6,0,0" Background="#161B22" Foreground="#8B949E"
>                  BorderBrush="#30363D" VerticalScrollBarVisibility="Auto"/>
>         <TextBlock Text="客户端（TcpClient，连接 127.0.0.1:8888）" Foreground="#58A6FF"
>                    FontWeight="Bold" Margin="0,12,0,0"/>
>         <StackPanel Orientation="Horizontal" Margin="0,6,0,0">
>             <Button Content="连接" Click="OnConnectClick" Padding="10,4"
>                     Background="#21262D" Foreground="White"/>
>             <Button Content="断开" Click="OnDisconnectClick" Padding="10,4" Margin="8,0,0,0"
>                     Background="#21262D" Foreground="White"/>
>         </StackPanel>
>         <TextBox x:Name="SendBox" Height="40" Margin="0,6,0,0" Background="#161B22"
>                  Foreground="#8B949E" BorderBrush="#30363D"/>
>         <Button Content="发送（服务端原样回显）" Click="OnSendClick" Padding="10,4" Margin="0,6,0,0"
>                 Background="#238636" Foreground="White"/>
>         <TextBox x:Name="ClientLog" Height="80" IsReadOnly="True" TextWrapping="Wrap"
>                  Margin="0,6,0,0" Background="#161B22" Foreground="#8B949E"
>                  BorderBrush="#30363D" VerticalScrollBarVisibility="Auto"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Net;
> using System.Net.Sockets;
> using System.Text;
> using System.Threading;
> using System.Threading.Tasks;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private TcpListener _listener;
>         private CancellationTokenSource _cts = new CancellationTokenSource();
>         private TcpClient _client;
>         private NetworkStream _stream;
>
>         public MainWindow() => InitializeComponent();
>
>         // 服务端：开始监听并异步接受客户端
>         private async void OnStartListen(object sender, RoutedEventArgs e)
>         {
>             try
>             {
>                 _cts = new CancellationTokenSource();
>                 _listener = new TcpListener(IPAddress.Loopback, 8888);
>                 _listener.Start();
>                 AppendServer("已开始监听 127.0.0.1:8888");
>                 while (!_cts.IsCancellationRequested)
>                 {
>                     TcpClient conn = await _listener.AcceptTcpClientAsync();
>                     _ = HandleClientAsync(conn); // 每个客户端独立处理
>                 }
>             }
>             catch (Exception ex) { AppendServer("监听失败：" + ex.Message); }
>         }
>
>         private void OnStopListen(object sender, RoutedEventArgs e)
>         {
>             _cts.Cancel();
>             _listener?.Stop();
>             AppendServer("已停止监听");
>         }
>
>         // 处理单个客户端：收到消息后原样回显
>         private async Task HandleClientAsync(TcpClient conn)
>         {
>             AppendServer($"客户端 {conn.Client.RemoteEndPoint} 已接入");
>             var stream = conn.GetStream();
>             byte[] buffer = new byte[1024];
>             try
>             {
>                 while (true)
>                 {
>                     int n = await stream.ReadAsync(buffer, 0, buffer.Length);
>                     if (n == 0) break; // 连接已关闭
>                     string msg = Encoding.UTF8.GetString(buffer, 0, n);
>                     AppendServer($"收到：{msg}，回显");
>                     await stream.WriteAsync(buffer, 0, n); // 原样回显
>                 }
>             }
>             catch { }
>             finally { conn.Close(); }
>         }
>
>         // 客户端：连接服务端
>         private async void OnConnectClick(object sender, RoutedEventArgs e)
>         {
>             try
>             {
>                 _client = new TcpClient();
>                 await _client.ConnectAsync(IPAddress.Loopback, 8888);
>                 _stream = _client.GetStream();
>                 AppendClient("已连接到 127.0.0.1:8888");
>             }
>             catch (Exception ex) { AppendClient("连接失败：" + ex.Message); }
>         }
>
>         private void OnDisconnectClick(object sender, RoutedEventArgs e)
>         {
>             _client?.Close();
>             AppendClient("已断开");
>         }
>
>         private async void OnSendClick(object sender, RoutedEventArgs e)
>         {
>             if (_stream == null) return;
>             byte[] data = Encoding.UTF8.GetBytes(SendBox.Text);
>             await _stream.WriteAsync(data, 0, data.Length);
>             AppendClient($"[发送] {SendBox.Text}");
>         }
>
>         private void AppendServer(string msg) =>
>             Dispatcher.Invoke(() => ServerLog.AppendText(msg + "\r\n"));
>
>         private void AppendClient(string msg) =>
>             Dispatcher.Invoke(() => ClientLog.AppendText(msg + "\r\n"));
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
> 坑 1：**ReadAsync 阻塞 UI 线程卡死界面** → 网络读是阻塞的，必须在后台 Task/async 中执行，UI 只通过事件/属性接收结果
>
> 坑 2：**没做粘包/拆包处理，报文错乱** → TCP 是字节流无消息边界，必须用长度前缀或结束符拆帧，参考《串口数据接收最佳实践》同样的缓冲思路
>
> 坑 3：**客户端连不上但不知道原因** → 常见：服务端没监听、防火墙拦截、IP/端口错；用 telnet 或 Test-NetConnection 先验证端口可达
>
> 坑 4：**服务端不清理已断开客户端** → 客户端异常退出后连接还留在列表里，反复收异常；读返回 0 或抛异常时从列表移除并释放
>
> 坑 5：**服务端重启后客户端不重连** → 客户端必须实现重连循环（带退避），服务端恢复后自动恢复通信

> [!best] 最佳实践
> - 收发全用 **async/await**（`AcceptTcpClientAsync`/`ReadAsync`/`WriteAsync`），避免阻塞线程池与 UI 卡死
> - TCP 是字节流，必须自定义**帧协议**：推荐"4 字节长度前缀 + 载荷"或"帧头+长度+数据+校验"，收包统一走缓冲拼包解析
> - 服务端用**客户端连接字典**（TcpClient→ID），断开时从字典移除并释放；用 `ConcurrentDictionary` 保证多线程安全
> - 客户端实现**断线重连**：捕获连接异常后指数退避重连（1s/2s/4s…），并触发状态事件通知 UI 显示连接状态
> - 心跳保活：业务层定时发心跳包（如 30s），连续 N 次无响应判定离线，区分"网络死链"与"设备宕机"
> - 收发日志记录**Hex 报文 + 时间戳**，粘包/乱码等现场问题全靠日志还原现场

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，本机起服务端监听 127.0.0.1:8888，用客户端连上并互发消息，观察收发日志
> **Lv.2 小试牛刀**：给示例加"粘包/拆包"测试：客户端一次发 3 条消息，服务端用长度前缀正确拆出 3 帧
> **Lv.3 融会贯通**：封装 TcpServer 与 TcpClient 两个类（连接管理 + 帧协议 + 断线重连），并用 Modbus TCP 模拟器验证能正确收发

> [!related] 相关知识链接
> - ← 前置知识：《网络基础概念（IP、端口、TCP vs UDP）》《OSI 七层模型简化》
> - → 后续必学：《Socket 通信实战》底层能力、《异步通信与高并发》
> - ⇄ 关联概念：《Modbus TCP（网口）》应用层实例、《串口数据接收最佳实践》帧解析思路复用
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.net.sockets.tcpclient
