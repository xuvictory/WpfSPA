---
title: Socket 通信实战
section: 09-communication
parent: 9.3 Socket 网络通信
---

# Socket 通信实战

> [!plain] 白话理解
> TcpClient/UdpClient 是 Socket 的"傻瓜版"，直接操作 Socket 能拿到更多控制权：自定义缓冲区、精确控制收发、设置更细的超时与标志、甚至用 Select 做非阻塞检查。当上位机需要"一个服务端同时处理成百上千连接"或"细粒度控制网络行为"时，就该上原生 Socket。本文用 Socket 实现一套可多客户端接入的 TCP 服务端，讲解基本用法。

> [!def] 官方定义
> Socket（套接字）是 .NET System.Net.Sockets 中操作系统网络接口的封装，是 TCP/UDP 通信的底层基础。关键成员：Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp) 创建；Bind()/Listen()/Accept()（服务端）；Connect()（客户端）；Send/Receive 与异步版 SendAsync/ReceiveAsync；Shutdown()/Close()；SetSocketOption()（如 KeepAlive、ReceiveTimeout）；Select() 非阻塞检查可读/可写状态。相比 TcpClient 更底层、更灵活，适合高性能/多连接/自定义控制的场景。

> [!origin] 由来背景
> Socket 是伯克利 UNIX 于 1980 年代提出的网络编程抽象，几乎所有操作系统网络栈都基于它。.NET 早期只有同步 Socket API，写多连接服务端要靠线程池轮询 Accept/Receive，代码复杂；后来加入异步 API 与 Task 封装，Socket 编程变得相对友好。虽然 TcpClient/TcpListener 覆盖了多数业务，但遇到"上万个并发连接、精细超时控制、UDP 广播组播、原始协议适配"等场景仍需直接用 Socket，因此它始终是网络编程的进阶必修。

> [!essentials] 核心要点
> - **创建与协议选择**：`new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp)` 或 Dgram/Udp 组合
> - **服务端四步**：Bind(IPEndPoint) → Listen(backlog) → Accept()/AcceptAsync() 接受连接 → 每连接一 Socket 收发
> - **客户端两步**：Connect(remoteEndPoint) → Send/Receive；连接后与对端共享双向字节流
> - **接收可能不足一次取全**：Receive 返回本次实际接收字节数（可能少于缓冲区），TCP 要循环接收直至完整帧
> - **Send 不保证一次发完**：Send 返回值可能小于要发的长度，大数据要循环发送
> - **超时与保活**：ReceiveTimeout/SendTimeout 设置超时；SetSocketOption KeepAlive 检测死连接
> - **异步与多连接**：AcceptAsync 循环 + 每连接 Task 处理；高并发用 SocketAsyncEventArgs 避免线程爆炸
> - **关闭顺序**：Shutdown(SocketShutdown.Both) → Close()，先停收发再释放

> [!example] 完整示例
> **Socket 实战演示：原生 Socket 实现 TCP 服务端与客户端（本机回环）：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="Socket 通信实战" Height="500" Width="520"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="原生 Socket：创建套接字、Bind/Listen、Accept、Send/Receive"
>                    Foreground="#58A6FF" FontWeight="Bold" TextWrapping="Wrap"/>
>         <StackPanel Orientation="Horizontal" Margin="0,8,0,0">
>             <Button Content="启动服务端(6666)" Click="OnStartServer" Padding="10,4"
>                     Background="#238636" Foreground="White"/>
>             <Button Content="停止服务端" Click="OnStopServer" Padding="10,4" Margin="8,0,0,0"
>                     Background="#DA3633" Foreground="White"/>
>             <Button Content="连接为客户端" Click="OnConnectClient" Padding="10,4" Margin="8,0,0,0"
>                     Background="#21262D" Foreground="White"/>
>         </StackPanel>
>         <TextBox x:Name="LogBox" Height="160" IsReadOnly="True" TextWrapping="Wrap"
>                  Margin="0,8,0,0" Background="#161B22" Foreground="#8B949E"
>                  BorderBrush="#30363D" VerticalScrollBarVisibility="Auto"/>
>         <TextBox x:Name="SendBox" Height="40" Margin="0,8,0,0" Background="#161B22"
>                  Foreground="#8B949E" BorderBrush="#30363D"/>
>         <Button Content="发送并接收回显" Click="OnSendClick" Padding="10,4" Margin="0,8,0,0"
>                 Background="#21262D" Foreground="White"/>
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
>         private Socket _listenSocket; // 服务端监听套接字
>         private Socket _clientSocket; // 客户端套接字
>         private CancellationTokenSource _cts;
>
>         public MainWindow() => InitializeComponent();
>
>         // 服务端：创建套接字 -> Bind -> Listen -> 异步 Accept
>         private void OnStartServer(object sender, RoutedEventArgs e)
>         {
>             _cts = new CancellationTokenSource();
>             _listenSocket = new Socket(AddressFamily.InterNetwork,
>                                        SocketType.Stream, ProtocolType.Tcp);
>             _listenSocket.Bind(new IPEndPoint(IPAddress.Loopback, 6666));
>             _listenSocket.Listen(10);
>             AppendLog("服务端已监听 127.0.0.1:6666");
>             _ = AcceptLoopAsync(_cts.Token);
>         }
>
>         private void OnStopServer(object sender, RoutedEventArgs e)
>         {
>             _cts?.Cancel();
>             _listenSocket?.Close();
>             AppendLog("服务端已停止");
>         }
>
>         private async Task AcceptLoopAsync(CancellationToken token)
>         {
>             while (!token.IsCancellationRequested)
>             {
>                 Socket conn = await _listenSocket.AcceptAsync();
>                 AppendLog($"客户端 {conn.RemoteEndPoint} 已连接");
>                 _ = EchoAsync(conn); // 收到数据原样返回
>             }
>         }
>
>         private async Task EchoAsync(Socket conn)
>         {
>             byte[] buffer = new byte[1024];
>             try
>             {
>                 while (true)
>                 {
>                     int n = await conn.ReceiveAsync(buffer, SocketFlags.None);
>                     if (n == 0) break;
>                     AppendLog($"服务端收到：{Encoding.UTF8.GetString(buffer, 0, n)}");
>                     await conn.SendAsync(new ArraySegment<byte>(buffer, 0, n), SocketFlags.None);
>                 }
>             }
>             catch { }
>             finally { conn.Close(); }
>         }
>
>         // 客户端：Connect 后 Send/Receive
>         private async void OnConnectClient(object sender, RoutedEventArgs e)
>         {
>             try
>             {
>                 _clientSocket = new Socket(AddressFamily.InterNetwork,
>                                            SocketType.Stream, ProtocolType.Tcp);
>                 await _clientSocket.ConnectAsync(IPAddress.Loopback, 6666);
>                 AppendLog("客户端已连接 127.0.0.1:6666");
>             }
>             catch (Exception ex) { AppendLog("连接失败：" + ex.Message); }
>         }
>
>         private async void OnSendClick(object sender, RoutedEventArgs e)
>         {
>             if (_clientSocket == null) return;
>             byte[] data = Encoding.UTF8.GetBytes(SendBox.Text);
>             await _clientSocket.SendAsync(new ArraySegment<byte>(data), SocketFlags.None);
>             // 等待回显，演示 Receive
>             byte[] buffer = new byte[1024];
>             int n = _clientSocket.Receive(buffer);
>             AppendLog($"客户端收到回显：{Encoding.UTF8.GetString(buffer, 0, n)}");
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
> 坑 1：**Receive 一次没读全就解析** → TCP 是字节流，Receive 可能只返回部分数据；必须按帧长度循环接收，参考缓冲拼接思路
>
> 坑 2：**SocketException 频繁出现且难定位** → 10048 端口占用、10054 对端强制断开、10060 连接超时；把 ErrorCode 记入日志，按码排查
>
> 坑 3：**高并发下线程爆炸** → 每连接一个 Thread 会撑爆系统；用 async/await 或 SocketAsyncEventArgs，别用同步 Accept 起线程
>
> 坑 4：**忘记 Shutdown 直接 Close 丢数据** → 直接 Close 会终止未发送的数据；先 Shutdown(Both) 再 Close，给对端发完的机会
>
> 坑 5：**无 KeepAlive 检测不到死连接** → 对端断电后 Socket 可能一直"看似连接"；启用 KeepAlive 或应用层心跳

> [!best] 最佳实践
> - **默认先用 TcpClient，确需控制再上 Socket**：能用高级封装就别裸 Socket，减少出错面
> - **接收循环 + 帧协议**：Receive 返回的字节追加缓冲，按长度前缀拆帧；与《串口数据接收最佳实践》同一套思路
> - **统一异常处理**：Socket 异常（断线/超时/地址占用）在封装层统一捕获，转业务事件上报界面
> - **连接列表管理**：服务端用 ConcurrentDictionary 维护连接，断线即移除并通知界面刷新连接数
> - **性能测试先行**：上线前用多客户端压测连接数与吞吐，确认无句柄/线程泄漏

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，用本机客户端连接服务端，多开几个客户端观察连接数列表变化
> **Lv.2 小试牛刀**：给服务端加"客户端断线清理"：客户端关闭后，服务端 3 秒内从列表移除并刷新界面
> **Lv.3 融会贯通**：用 Socket 实现一个"广播服务器"：接收客户端注册，向所有在线客户端广播消息，支持多客户端并发连接

> [!related] 相关知识链接
> - ← 前置知识：《TCP 通信（TcpListener、TcpClient）》《UDP 通信（UdpClient）》
> - → 后续必学：《WebSocket 全双工通信》应用层双向通道
> - ⇄ 关联概念：《异步通信与高并发》《网络基础概念（IP、端口、TCP vs UDP）》
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.net.sockets.socket
