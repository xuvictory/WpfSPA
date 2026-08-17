---
title: Socket 通信实战
section: 09-communication
parent: 9.3 Socket 网络通信
---

# Socket 通信实战

> [!plain] 白话理解
> "Socket 通信实战"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"Socket 通信实战"是一个重要的知识点。通信是上位机的命脉。没有通信，上位机就是一个空壳。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> Socket 通信实战是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> Socket 通信实战的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：通信是上位机的命脉。没有通信，上位机就是一个空壳。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"Socket 通信实战"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

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
> 坑 1：**概念理解不清就上手** → 建议先把本章节的前置知识点学完，理解基础原理后再动手写代码
> 
> 坑 2：**忽略了官方文档** → Microsoft Docs 上有最权威的说明和最完整的示例代码，遇到问题先查文档
>
> 坑 3：**代码写的太"一次性"** → 养成写可复用代码的习惯，以后项目中会反复用到这些知识

> [!best] 最佳实践
> - 编写代码时保持一致的命名规范（PascalCase 用于公共成员，_camelCase 用于私有字段）
> - 善用 Visual Studio 的智能提示和代码片段，提高开发效率
> - 每个关键代码块加上注释，解释"为什么这样写"而不仅仅是"写的是什么"
> - 遵循 SOLID 原则，尤其是单一职责原则：一个类只做一件事
> - 经常重构：写完功能后回头看看有没有更简洁的写法

> [!practice] 上手练习
> **Lv.1 照猫画虎**：阅读并运行本节示例代码，确保程序可以正常运行，修改一些参数观察效果变化
> **Lv.2 小试牛刀**：在示例代码的基础上，添加一个小功能或修改一项设置，观察程序的响应
> **Lv.3 融会贯通**：结合前面学过的知识，用"Socket 通信实战"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"Socket 通信实战"
> - → 后续必学：掌握"Socket 通信实战"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
