---
title: UDP 通信（UdpClient）
section: 09-communication
parent: 9.3 Socket 网络通信
---

# UDP 通信（UdpClient）

> [!plain] 白话理解
> UDP 是"无连接"的通信：不用先握手，把数据报直接扔给目标 IP+端口即可，对端收不收得到靠天。它最大的价值是快和能广播——一条消息发给整个网段（255.255.255.255），所有设备都能收到。上位机里 UDP 常用于：设备发现（喊一嗓子"谁在线"）、状态广播（不断播报当前状态）、音视频/高频遥测。示例演示了 UDP 收发与广播的完整写法。

> [!def] 官方定义
> UdpClient 是 System.Net.Sockets 中封装 UDP 通信的类。UdpClient(port) 绑定本地端口；SendAsync(byte[], ip, port) 发送数据报；ReceiveAsync() 阻塞接收；EnableBroadcast=true 可向广播地址（如 255.255.255.255 或子网广播）发送；JoinMulticastGroup(ip) 加入组播组。UDP 数据报自带消息边界（一次 Receive 拿到一次 Send 的完整数据），无需拆包；但不保证送达、不保证顺序、不保证不重复，报文最长 65507 字节（IPv4）。

> [!origin] 由来背景
> 网络诞生早期就有"一对一可靠传输"（TCP）与"一对多快速分发"两类需求。UDP 牺牲可靠换取两个 TCP 没有的能力：①无握手低延迟（发即走）；②广播/组播（一份报文分发全网）。因此设备发现（如 EtherNet/IP 的 CIP、西门子 S7 的广播）、视频流、游戏同步、传感器高频遥测都选择 UDP。上位机虽以 TCP 为主，但在"设备发现/状态广播/实时流"场景离不开启 UDP 能力。

> [!essentials] 核心要点
> - **无连接即插即发**：SendAsync 不需要先连接，直接指定目标 IP+端口发送
> - **本地绑定**：`new UdpClient(port)` 绑定端口才能收；不绑定只发则用随机端口
> - **消息边界天然存在**：一次 ReceiveAsync 返回一次 SendAsync 的完整数据报，无需拆包（不像 TCP 字节流）
> - **广播发送**：EnableBroadcast=true 后向 255.255.255.255（或子网广播地址）发送，网段内所有主机能收到
> - **组播**：JoinMulticastGroup(224.0.0.x) 加入组播组，只有加入该组的主机收到，比广播精准且不扰民
> - **可靠性自己负责**：应用层要自己加序号/超时重发/去重，UDP 本身不管
> - **大小限制**：数据报最大 65507 字节（含头），实际建议控制在 1472 字节内避免 IP 分片
> - **接收阻塞**：ReceiveAsync 阻塞等待，须放后台任务；可用 CancellationToken 取消

> [!example] 完整示例
> **UDP 通信演示：UdpClient 绑定端口接收 + 向本机发送数据报：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="UDP 通信 - UdpClient" Height="460" Width="500"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="UDP 收发（本机回环，端口 9999）" Foreground="#58A6FF" FontWeight="Bold"/>
>         <StackPanel Orientation="Horizontal" Margin="0,8,0,0">
>             <Button Content="开始接收" Click="OnStartRecv" Padding="10,4"
>                     Background="#238636" Foreground="White"/>
>             <Button Content="停止接收" Click="OnStopRecv" Padding="10,4" Margin="8,0,0,0"
>                     Background="#DA3633" Foreground="White"/>
>         </StackPanel>
>         <TextBlock Text="接收区（无连接，谁发来都收）" Foreground="#8B949E" Margin="0,8,0,0"/>
>         <TextBox x:Name="RecvBox" Height="100" IsReadOnly="True" TextWrapping="Wrap"
>                  Background="#161B22" Foreground="#8B949E" BorderBrush="#30363D"/>
>         <TextBox x:Name="SendBox" Height="40" Margin="0,8,0,0" Background="#161B22"
>                  Foreground="#8B949E" BorderBrush="#30363D"/>
>         <Button Content="向 127.0.0.1:9999 发送" Click="OnSendClick" Padding="10,4" Margin="0,8,0,0"
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
>         private UdpClient _udp;
>         private CancellationTokenSource _cts;
>
>         public MainWindow() => InitializeComponent();
>
>         // 绑定端口并开始异步接收，UDP 无连接，任何来源的数据都会收到
>         private void OnStartRecv(object sender, RoutedEventArgs e)
>         {
>             _cts = new CancellationTokenSource();
>             _udp = new UdpClient(new IPEndPoint(IPAddress.Loopback, 9999));
>             _ = ReceiveLoopAsync(_cts.Token);
>             RecvBox.AppendText("已开始接收，端口 9999\r\n");
>         }
>
>         private void OnStopRecv(object sender, RoutedEventArgs e)
>         {
>             _cts?.Cancel();
>             _udp?.Close();
>             RecvBox.AppendText("已停止接收\r\n");
>         }
>
>         private async Task ReceiveLoopAsync(CancellationToken token)
>         {
>             while (!token.IsCancellationRequested)
>             {
>                 var result = await _udp.ReceiveAsync();
>                 string msg = Encoding.UTF8.GetString(result.Buffer);
>                 Dispatcher.Invoke(() =>
>                     RecvBox.AppendText($"[来自 {result.RemoteEndPoint}] {msg}\r\n"));
>             }
>         }
>
>         // 发送数据报：无需建立连接，直接指定目标地址
>         private void OnSendClick(object sender, RoutedEventArgs e)
>         {
>             if (_udp == null) return;
>             byte[] data = Encoding.UTF8.GetBytes(SendBox.Text);
>             _udp.Send(data, data.Length, "127.0.0.1", 9999);
>             RecvBox.AppendText($"[发送] {SendBox.Text}\r\n");
>         }
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
> 坑 1：**广播发不出去** → 未设置 EnableBroadcast=true，或目标地址写错（应为 255.255.255.255 或子网广播）；另外 Windows 防火墙可能拦广播
>
> 坑 2：**收不到数据但没报错** → UDP 静默丢包，先确认发送方确实发出（Wireshark 抓包）、端口一致、防火墙放行；无响应≠有异常，是 UDP 常态
>
> 坑 3：**ReceiveAsync 阻塞 UI 线程** → 接收是阻塞的，必须放后台任务；用 CancellationToken 或关闭 UdpClient 来中断
>
> 坑 4：**数据报太大被 IP 分片** → 超过 MTU（约 1472 字节）分片后到达率下降、重组失败即丢包；业务报文控制在 1400 字节内
>
> 坑 5：**误以为 UDP 可靠** → 网络拥塞/交换机丢弃都会丢包；重要数据要在应用层加序号、确认、重发

> [!best] 最佳实践
> - **广播数据报要小且幂等**：接收方无论收多少遍都不出错（如状态快照），丢失几帧无影响
> - **重要数据用"UDP + 应用层确认"**：业务关键帧带序号，接收方回 ACK，发送方超时重发，兼顾实时与可靠
> - **优先组播而非广播**：能明确分组就用组播（如 239.x.x.x），广播会打扰无关主机且部分交换机禁用
> - **接收循环独立任务**：UdpClient 接收放长期运行的后台 Task，收到即处理或入队，避免丢报
> - **发送频率节流**：广播/组播注意发送频率，过高会占满交换机带宽影响其它业务

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，本机起两个 UDP 端口互发消息，观察收发日志与消息边界
> **Lv.2 小试牛刀**：实现"设备发现"：客户端广播 "DISCOVER"，服务端收到后单播回 "I_AM_192.168.1.100"，客户端显示发现的设备列表
> **Lv.3 融会贯通**：实现一个带序号与 ACK 的可靠 UDP 层：发送方加序号、超时重发，接收方回 ACK、按序去重，并用它传输状态快照

> [!related] 相关知识链接
> - ← 前置知识：《网络基础概念（IP、端口、TCP vs UDP）》对比 TCP 理解差异
> - → 后续必学：《Socket 通信实战》底层能力对比
> - ⇄ 关联概念：《OSI 七层模型简化》《异步通信与高并发》
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.net.sockets.udpclient
