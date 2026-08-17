---
title: 网络基础概念（IP、端口、TCP vs UDP）
section: 09-communication
parent: 9.3 Socket 网络通信
---

# 网络基础概念（IP、端口、TCP vs UDP）

> [!plain] 白话理解
> IP 是设备的"门牌号"（如 192.168.1.100），端口是设备上的"房间号"（如 502、8888），两者组合才能定位到具体进程。TCP 是"挂号信"：要确认收件人、逐封对号、丢件重发，可靠但慢；UDP 是"飞鸽传书"：只管发、不保证送到，快但不稳。上位机选型就是在这两者间权衡：数据采集/指令下发用 TCP，状态广播/实时流用 UDP。

> [!def] 官方定义
> IP 地址（IPv4：32 位，如 192.168.1.100）用于网络层寻址，端口（0~65535）用于区分主机上的不同应用进程，IP+端口构成套接字端点。TCP（Transmission Control Protocol）是面向连接的可靠传输协议：三次握手建立连接、序列号保证顺序、ACK/超时重传保证可靠，适用于数据完整性要求高的场景。UDP（User Datagram Protocol）是无连接的数据报协议：不握手、不重传、无顺序保证，头部开销小、延迟低，适用于实时性与吞吐优先的场景。.NET 中对应 TcpClient/TcpListener 与 UdpClient。

> [!origin] 由来背景
> 早期网络只有单一的数据交付需求，但随着应用分化，出现了"必须可靠"（文件传输、控制指令）与"必须快速"（语音、视频、状态广播）两类诉求。1974 年 TCP/IP 协议族的设计者将传输层拆成 TCP 与 UDP 两种形态：TCP 牺牲部分性能换取可靠有序，UDP 去掉一切保证换取低延迟高吞吐。此后几乎所有应用层协议（HTTP、Modbus TCP、MQTT）都建立在二者之一上，上位机开发同样遵循这一"可靠 vs 实时"的取舍框架。

> [!essentials] 核心要点
> - **IPv4 与 IPv6**：IPv4 是 `x.x.x.x` 点分十进制，IPv6 是冒号十六进制；工控内网仍以 IPv4 为主
> - **回环地址 127.0.0.1**：本机自测专用，调试时先用回环验证程序，再连真实设备
> - **局域网/公网**：192.168.x.x/10.x.x.x/172.16~31 是私有网段，跨网段需路由器或网关
> - **端口规范**：<1024 为系统保留（如 80/443/502），自用服务建议 10000+ 避免冲突
> - **TCP 三次握手**：SYN→SYN-ACK→ACK，建立可靠连接；断开需四次挥手
> - **TCP 保证什么**：不丢包、不乱序、不重复（可靠字节流）；代价是重传延迟
> - **UDP 特点**：无连接、无重传，报文一次送达失败即丢；但延迟低、支持广播/组播
> - **选型判断**：能容忍重试就选 UDP，丢一帧就出事故选 TCP；MES/PLC 数据采集用 TCP

> [!example] 完整示例
> **网络基础概念演示：查看本机 IP、TCP 与 UDP 协议对比：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="网络基础概念 - IP / 端口 / TCP vs UDP" Height="460" Width="540"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="本机 IP 地址" Foreground="#58A6FF" FontWeight="Bold"/>
>         <Button Content="刷新本机 IP" Click="OnRefreshClick" Padding="8,4" HorizontalAlignment="Left"
>                 Margin="0,6,0,0" Background="#21262D" Foreground="White"/>
>         <ListBox x:Name="IpList" Height="80" Margin="0,6,0,0" Background="#161B22"
>                  Foreground="#8B949E" BorderBrush="#30363D"/>
>         <TextBlock Text="协议对比" Foreground="#58A6FF" FontWeight="Bold" Margin="0,12,0,0"/>
>         <RadioButton x:Name="TcpRadio" Content="TCP：面向连接、可靠有序、适合数据采集/指令下发"
>                      Foreground="#8B949E" Checked="OnProtocolChanged" Margin="0,6,0,0"/>
>         <RadioButton x:Name="UdpRadio" Content="UDP：无连接、尽力而为、低延迟、适合状态广播"
>                      Foreground="#8B949E" Checked="OnProtocolChanged" Margin="0,6,0,0"/>
>         <TextBlock x:Name="DetailText" Foreground="#58A6FF" Margin="0,8,0,0" TextWrapping="Wrap"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Net;
> using System.Net.Sockets;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         // 枚举本机所有 IPv4 地址并显示
>         private void OnRefreshClick(object sender, RoutedEventArgs e)
>         {
>             IpList.Items.Clear();
>             foreach (var ip in Dns.GetHostAddresses(Dns.GetHostName()))
>                 if (ip.AddressFamily == AddressFamily.InterNetwork) // 只取 IPv4
>                     IpList.Items.Add(ip.ToString());
>         }
>
>         // 选中不同协议时给出更详细的说明
>         private void OnProtocolChanged(object sender, RoutedEventArgs e)
>         {
>             DetailText.Text = TcpRadio.IsChecked == true
>                 ? "TCP 先三次握手建立连接再传输，丢包会重传，数据按序到达；上位机常用它采集 PLC 数据、下发控制指令。"
>                 : "UDP 不需要连接，直接发数据报，延迟更低但不保证送达；常用在设备状态广播、音视频流等场景。";
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 数据采集、指令下发、文件传输（数据不能错）→ TCP
> ✅ Modbus TCP、MQTT、HTTP 等协议底层都是 TCP
> ✅ 设备状态广播、发现服务（谁在线/谁在说话）→ UDP 广播/组播
> ✅ 音视频流、高频遥测（一帧丢了下一帧补上）→ UDP
> ❌ 对有序、可靠有硬要求的场景选 UDP（会丢数据）
> ❌ 实时性极端的运动控制（TCP 重传延迟不可控，需专用总线）

> [!pitfall] 常见踩坑
> 坑 1：**IP 配错网段连不上设备** → 工控设备常见 192.168.1.x 网段，上位机网卡必须设同网段（如 192.168.1.10/24），先用 ping 确认通
> 
> 坑 2：**端口冲突或防火墙拦截** → 固定端口被其它程序占用，或 Windows 防火墙默认拦截入站；用 `netstat -ano` 查占用、防火墙放行指定端口
> 
> 坑 3：**该用 UDP 却用 TCP 或反之** → 广播/组播发现设备必须 UDP，可靠传输必须 TCP；选错模型导致"找不到设备"或"丢数据"
> 
> 坑 4：**抓包工具看网卡选错** → 抓不到包多半是选了错误的网卡（有多个适配器）；抓包前确认当前通信走的是哪块网卡
> 
> 坑 5：**TCP 连接挂起不超时** → 未设置超时，设备离线时程序一直等；所有网络操作必须设 ConnectTimeout/ReadTimeout 并处理超时异常

> [!best] 最佳实践
> - **IP/端口配置化**：设备地址放配置（App.config/JSON），支持界面修改，现场换设备不用改代码
> - **优先用回环地址调试**：程序先连 127.0.0.1 自测通过，再切真实 IP 联调，问题定位快
> - **端口规划表**：项目里各服务端口统一登记（如 8888 采集、9999 广播），避免撞端口
> - **按需选协议并写明理由**：在文档里记录"为什么选 TCP/UDP"，防止后人盲目修改
> - **连接超时必须有**：网络操作一律设置超时，防止设备离线时界面无限等待

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例刷新本机 IP 列表，切换 TCP/UDP 单选观察说明文字变化
> **Lv.2 小试牛刀**：在命令行用 `netstat -ano` 观察 TCP 的 LISTEN/ESTABLISHED 状态，启动一个 TCP 服务端后确认端口监听
> **Lv.3 融会贯通**：写一个"端口连通性检测"工具：输入 IP:端口，用 TcpClient 尝试连接并显示成功/超时，供现场排障使用

> [!related] 相关知识链接
> - ← 前置知识：无需前置，本章是网络通信的入门第一篇
> - → 后续必学：《TCP 通信（TcpListener、TcpClient）》《UDP 通信（UdpClient）》
> - ⇄ 关联概念：《OSI 七层模型简化》（IP 在网络层、TCP/UDP 在传输层）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.net.sockets（.NET 网络 API）
