---
title: Modbus TCP（网口）
section: 09-communication
parent: 9.4 Modbus 通信协议
---

# Modbus TCP（网口）

> [!plain] 白话理解
> Modbus TCP 就是把 Modbus 报文装进 TCP 数据包发到以太网上：每个报文前面加 7 字节 MBAP 头（含事务 ID、长度、单元号），帧尾去掉 CRC——因为 TCP 自己保证传输可靠。设备有 IP 地址和端口（默认 502）就能通信，不受距离限制。相比 RTU，TCP 支持并发多请求（靠事务 ID 区分应答），是网口 PLC、网关设备的主流接口。

> [!def] 官方定义
> Modbus TCP 是 Modbus 协议在 TCP/IP 网络上的传输模式，端口 502（IANA 注册）。报文结构：MBAP 头（7 字节：事务标识符 2B + 协议标识符 2B=0x0000 + 长度 2B + 单元标识符 1B）+ PDU（功能码 + 数据区）。PDU 不含地址码与 CRC，从站地址收敛为单元标识符（Unit ID，网关串行链路扩展用）。同一 TCP 连接可并发发出多个请求，靠事务 ID 匹配响应。

> [!origin] 由来背景
> 工业以太网普及后，Modbus 组织在原有串行协议基础上定义了 Modbus TCP：直接复用成熟的应用层报文，仅把传输层从"串口+CRC"换成"TCP+MBAP 头"。这样做的好处是：复用现有 Modbus 生态、设备接入企业网、支持并发请求。如今几乎所有带网口的 PLC（西门子 S7 部分支持、施耐德 Modicon、汇川等）、DTU、协议转换网关都内置 Modbus TCP 服务器，上位机通过它可同时管理大量网络设备。

> [!essentials] 核心要点
> - **MBAP 头是 TCP 版核心**：事务 ID（自增，匹配请求/响应）+ 协议 ID（固定 0x0000）+ 长度（单元 ID+PDU 长度）+ 单元 ID
> - **无 CRC**：可靠性由 TCP 保证，帧尾不再附加校验字节
> - **默认端口 502**：需确认防火墙放行；自定义端口要与设备配置一致
> - **并发匹配靠事务 ID**：可同时发多条请求，响应按事务 ID 找到对应请求，不必严格一问一答
> - **连接管理**：长连接复用（避免频繁建连开销），断线重连策略要有
> - **响应长度校验**：先读 6 字节 MBAP 头，再按长度字段读取 PDU 剩余字节，防止粘包
> - **单元 ID 用于网关**：上位机直连设备时通常为 0xFF 或 1，经网关转串行总线时填从站地址

> [!example] 完整示例
> **Modbus TCP 演示：MBAP 头构建 + TcpClient 发送请求帧：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="Modbus TCP - MBAP 头" Height="520" Width="540"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="Modbus TCP 帧 = MBAP 头(7B) + 功能码 + 数据"
>                    Foreground="#58A6FF" FontWeight="Bold"/>
>         <StackPanel Orientation="Horizontal" Margin="0,8,0,0">
>             <TextBlock Text="IP" Foreground="#8B949E" VerticalAlignment="Center"/>
>             <TextBox x:Name="IpBox" Text="127.0.0.1" Width="100" Margin="8,0,0,0"
>                      Background="#161B22" Foreground="#8B949E" BorderBrush="#30363D"/>
>             <TextBlock Text="端口" Foreground="#8B949E" Margin="16,0,0,0" VerticalAlignment="Center"/>
>             <TextBox x:Name="PortBox" Text="502" Width="60" Margin="8,0,0,0"
>                      Background="#161B22" Foreground="#8B949E" BorderBrush="#30363D"/>
>         </StackPanel>
>         <StackPanel Orientation="Horizontal" Margin="0,8,0,0">
>             <TextBlock Text="站号" Foreground="#8B949E" VerticalAlignment="Center"/>
>             <TextBox x:Name="SlaveBox" Width="50" Text="1" Margin="8,0,0,0"
>                      Background="#161B22" Foreground="#8B949E" BorderBrush="#30363D"/>
>             <TextBlock Text="地址" Foreground="#8B949E" Margin="16,0,0,0" VerticalAlignment="Center"/>
>             <TextBox x:Name="AddrBox" Width="60" Text="0" Margin="8,0,0,0"
>                      Background="#161B22" Foreground="#8B949E" BorderBrush="#30363D"/>
>             <TextBlock Text="数量" Foreground="#8B949E" Margin="16,0,0,0" VerticalAlignment="Center"/>
>             <TextBox x:Name="CountBox" Width="50" Text="2" Margin="8,0,0,0"
>                      Background="#161B22" Foreground="#8B949E" BorderBrush="#30363D"/>
>         </StackPanel>
>         <Button Content="构建并发送" Click="OnSendClick" Padding="10,4" Margin="0,10,0,0"
>                 HorizontalAlignment="Left" Background="#238636" Foreground="White"/>
>         <TextBlock Text="请求帧（含 MBAP 头）" Foreground="#8B949E" Margin="0,8,0,0"/>
>         <TextBox x:Name="FrameBox" Height="28" IsReadOnly="True" Background="#161B22"
>                  Foreground="#58A6FF" BorderBrush="#30363D"/>
>         <TextBlock Text="响应帧" Foreground="#8B949E" Margin="0,8,0,0"/>
>         <TextBox x:Name="RecvBox" Height="80" IsReadOnly="True" TextWrapping="Wrap"
>                  Background="#161B22" Foreground="#8B949E" BorderBrush="#30363D"/>
>         <TextBlock x:Name="StatusText" Foreground="#8B949E" Margin="0,8,0,0" TextWrapping="Wrap"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Net.Sockets;
> using System.Threading.Tasks;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         // 构建 Modbus TCP 请求帧：MBAP 头(7B) + 功能码 + 数据
>         private byte[] BuildMbapFrame(byte slave, ushort addr, ushort count)
>         {
>             byte[] body = { 0x03, (byte)(addr >> 8), (byte)addr,
>                             (byte)(count >> 8), (byte)count };
>             byte[] frame = new byte[body.Length + 7];
>             frame[0] = 0x00; frame[1] = 0x01;          // 事务标识符
>             frame[2] = 0x00; frame[3] = 0x00;          // 协议标识符（0 = Modbus）
>             frame[4] = 0x00; frame[5] = (byte)body.Length; // 后续字节数
>             frame[6] = slave;                          // 单元标识符
>             Array.Copy(body, 0, frame, 7, body.Length);
>             return frame;
>         }
>
>         private async void OnSendClick(object sender, RoutedEventArgs e)
>         {
>             try
>             {
>                 byte[] frame = BuildMbapFrame(byte.Parse(SlaveBox.Text),
>                                               ushort.Parse(AddrBox.Text),
>                                               ushort.Parse(CountBox.Text));
>                 FrameBox.Text = BitConverter.ToString(frame);
>
>                 using var client = new TcpClient();
>                 await client.ConnectAsync(IpBox.Text, int.Parse(PortBox.Text));
>                 var stream = client.GetStream();
>                 await stream.WriteAsync(frame, 0, frame.Length);
>
>                 byte[] buffer = new byte[256];
>                 int n = await stream.ReadAsync(buffer, 0, buffer.Length);
>                 RecvBox.Text = BitConverter.ToString(buffer, 0, n);
>                 StatusText.Text = "发送并接收成功";
>                 StatusText.Foreground = System.Windows.Media.Brushes.LimeGreen;
>             }
>             catch (Exception ex)
>             {
>                 StatusText.Text = "通信失败：" + ex.Message;
>                 StatusText.Foreground = System.Windows.Media.Brushes.OrangeRed;
>             }
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 带网口的 PLC、DTU、协议转换网关数据采集（S7-1200/1500、施耐德、汇川等）
> ✅ 跨车间/跨厂区远程监控（TCP 不受 RS-485 距离限制）
> ✅ 需要并发读写多个设备的高吞吐场景
> ✅ 与 Modbus 网关对接存量串口设备（单元 ID 透传从站地址）
> ❌ 设备只有串口没有网口（需经网关或选 RTU）
> ❌ 网络环境恶劣、丢包严重（TCP 重传机制会放大延迟，应考虑现场总线）

> [!pitfall] 常见踩坑
> 坑 1：**事务 ID 不配对导致响应错乱** → 并发发多个请求时，若不做"事务 ID→TaskCompletionSource"映射，响应会张冠李戴；每个请求必须带自增事务 ID 并映射等待
> 
> 坑 2：**粘包/拆包未处理** → TCP 是字节流，一次 Read 可能包含多条报文或半个报文；必须用长度解析（MBAP 前 6 字节定长头 + 剩余长度）拆帧
> 
> 坑 3：**单元 ID（站号）与网关不对应** → 走 Modbus 网关时单元 ID 是"网关后的从站地址"，填成 0 或错号会收不到数据；对照网关配置表核对
> 
> 坑 4：**只连一次不重连** → 设备/网络重启后连接失效，不重连则永久离线；实现心跳检测 + 自动重连
> 
> 坑 5：**把 TCP 当成"不会丢数据"而忽略协议错误码** → 异常响应（0x80+功能码）返回的是错误码（非法地址/非法功能），必须解析并提示，不能当正常帧处理

> [!best] 最佳实践
> - **TCP 客户端用 TcpClient 长连接**：避免每次请求都建连（502 端口握手开销大），会话内复用连接
> - **异步收发**：用 async/await 处理网络 IO，防止 UI 线程阻塞；接收循环独立于请求循环
> - **事务 ID 自增与字典映射**：发请求前登记 TaskCompletionSource，响应到达时按 ID 完成对应任务
> - **心跳保活**：长时间无业务时定期发保持性请求，检测死连接并自动重连
> - **超时分级**：连接超时、读写超时分开设置；设备/网关响应慢的场景单独调参

> [!practice] 上手练习
> **Lv.1 照猫画虎**：用 Modbus TCP 从站模拟器（如 Modbus Slave）运行示例，完成一次读寄存器轮询，观察 MBAP 头各字段
> **Lv.2 小试牛刀**：给示例增加"并发两路请求"（读 A 设备 + 读 B 设备同时发出），验证事务 ID 能正确配对响应
> **Lv.3 融会贯通**：封装 ModbusTcpClient：连接管理 + 事务 ID 匹配 + 断线重连，并支持单元 ID 透传，接入设备监控 ViewModel

> [!related] 相关知识链接
> - ← 前置知识：《Modbus 协议概述》《网络基础概念（IP 端口 TCP vs UDP）》
> - → 后续必学：《Modbus 上位机实战》端到端联调
> - ⇄ 关联概念：《Modbus RTU（串口）》对比传输变体、《常用 Modbus 库》
> - 📖 官方文档：https://modbus.org/docs/Modbus_Messaging_Implementation_Guide_V1_0b.pdf（Modbus TCP 实现指南）
