---
title: Modbus RTU（串口）
section: 09-communication
parent: 9.4 Modbus 通信协议
---

# Modbus RTU（串口）

> [!plain] 白话理解
> Modbus RTU 就是"Modbus 协议跑在串口上"的二进制版：报文是一串紧凑字节，以 3.5 字符静默时间作为帧间隔，帧尾带 CRC16 校验。上位机把串口打开、波特率设对，发一条 RTU 请求，设备回一条 RTU 响应。相比文本式的 ASCII 模式，RTU 帧短、效率高，是串口 Modbus 的绝对主流。本文演示如何用 SerialPort 收发并解析一条完整的 RTU 帧。

> [!def] 官方定义
> Modbus RTU（Remote Terminal Unit）是 Modbus 协议在串行链路（RS-232/RS-485/RS-422）上的二进制传输模式。帧格式：从站地址（1 字节）+ 功能码（1 字节）+ 数据区（N 字节）+ CRC16（2 字节，低字节在前）。帧间以 ≥3.5 字符的静默时间分隔，同一帧内字符间隔必须 <1.5 字符时间，否则从站判定为帧错误丢弃。典型数据速率 9600/19200/115200bps，支持一主多从半双工轮询。官方规范见 Modbus Serial Line Protocol。

> [!origin] 由来背景
> Modbus 最初在串行链路上传输时有两种编码：ASCII 模式（报文可见、易调试但体积大近一倍）和 RTU 模式（二进制紧凑、传输效率高）。工业现场带宽有限、从站数量多，RTU 凭借帧短、校验可靠成为绝对主流，几乎所有的串口 PLC、变频器、仪表都默认支持 RTU。对上位机而言，理解 RTU 帧结构是写串口 Modbus 代码的前提——因为最终要自己组帧、发帧、校验、拆帧。

> [!essentials] 核心要点
> - **帧结构固定**：地址(1) + 功能码(1) + 数据(可变) + CRC16(2，低字节在前)，示例中用 byte[] 数组精确组帧
> - **CRC16 算法固定**：多项式 0xA001，初值 0xFFFF，对"地址+功能码+数据"逐字节异或移位计算
> - **串口参数**：常见 9600/8/N/1，Modbus RTU 一般要求 8 数据位，校验位按设备手册（部分设备用 Even）
> - **轮询式收发**：一次请求等一次响应，收到后再发下一条；超时未响应要重发或跳过，不能同时发多条
> - **响应超时**：设备处理慢时（如 50~200ms），ReadTimeout 要大于设备响应时间，避免误判"无响应"
> - **粘包/拆包处理**：RTU 帧靠 3.5 字符静默间隔分隔，上位机一般按"期望响应长度"精确读取而非等超时
> - **地址校验**：响应帧首字节必须等于请求的从站地址，否则是串扰或错误响应，应丢弃

> [!example] 完整示例
> **Modbus RTU 演示：构建 03 读保持寄存器请求帧 + CRC16 校验并通过串口发送：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="Modbus RTU - 帧构建与 CRC16" Height="520" Width="500"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="Modbus RTU 帧：站号 功能码 起始地址 数量 CRC16(低字节在前)"
>                    Foreground="#58A6FF" FontWeight="Bold" TextWrapping="Wrap"/>
>         <StackPanel Orientation="Horizontal" Margin="0,8,0,0">
>             <ComboBox x:Name="PortCombo" Width="130" Background="#161B22" Foreground="#8B949E"/>
>             <Button Content="打开串口" Click="OnOpenClick" Margin="8,0,0,0" Padding="8,4"
>                     Background="#21262D" Foreground="White"/>
>         </StackPanel>
>         <StackPanel Orientation="Horizontal" Margin="0,10,0,0">
>             <TextBlock Text="站号" Foreground="#8B949E" VerticalAlignment="Center"/>
>             <TextBox x:Name="SlaveBox" Width="50" Text="1" Margin="8,0,0,0"
>                      Background="#161B22" Foreground="#8B949E" BorderBrush="#30363D"/>
>             <TextBlock Text="起始地址" Foreground="#8B949E" Margin="16,0,0,0" VerticalAlignment="Center"/>
>             <TextBox x:Name="AddrBox" Width="60" Text="0" Margin="8,0,0,0"
>                      Background="#161B22" Foreground="#8B949E" BorderBrush="#30363D"/>
>             <TextBlock Text="数量" Foreground="#8B949E" Margin="16,0,0,0" VerticalAlignment="Center"/>
>             <TextBox x:Name="CountBox" Width="50" Text="2" Margin="8,0,0,0"
>                      Background="#161B22" Foreground="#8B949E" BorderBrush="#30363D"/>
>         </StackPanel>
>         <Button Content="构建帧并发送" Click="OnSendClick" Margin="0,12,0,0" Padding="10,4"
>                 Background="#238636" Foreground="White"/>
>         <TextBlock Text="请求帧" Foreground="#8B949E" Margin="0,10,0,0"/>
>         <TextBox x:Name="FrameBox" Height="30" IsReadOnly="True" Background="#161B22"
>                  Foreground="#58A6FF" BorderBrush="#30363D"/>
>         <TextBlock Text="接收响应" Foreground="#8B949E" Margin="0,8,0,0"/>
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
> using System.IO.Ports;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private SerialPort _port;
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             foreach (string name in SerialPort.GetPortNames())
>                 PortCombo.Items.Add(name);
>             if (PortCombo.Items.Count > 0) PortCombo.SelectedIndex = 0;
>         }
>
>         private void OnOpenClick(object sender, RoutedEventArgs e)
>         {
>             try
>             {
>                 _port = new SerialPort(PortCombo.SelectedItem as string,
>                                        9600, Parity.None, 8, StopBits.One);
>                 _port.DataReceived += OnDataReceived;
>                 _port.Open();
>                 StatusText.Text = "串口已打开";
>                 StatusText.Foreground = System.Windows.Media.Brushes.LimeGreen;
>             }
>             catch (Exception ex)
>             {
>                 StatusText.Text = "打开失败：" + ex.Message;
>                 StatusText.Foreground = System.Windows.Media.Brushes.OrangeRed;
>             }
>         }
>
>         // 构建读保持寄存器(03)请求帧：站号 + 03 + 起始地址 + 寄存器数量 + CRC16
>         private byte[] BuildReadHoldingRegisters(byte slave, ushort addr, ushort count)
>         {
>             byte[] frame = new byte[8];
>             frame[0] = slave;
>             frame[1] = 0x03;
>             frame[2] = (byte)(addr >> 8);
>             frame[3] = (byte)addr;
>             frame[4] = (byte)(count >> 8);
>             frame[5] = (byte)count;
>             ushort crc = Crc16(frame, 6); // 对前 6 字节计算 CRC
>             frame[6] = (byte)crc;          // CRC 低字节在前
>             frame[7] = (byte)(crc >> 8);
>             return frame;
>         }
>
>         // 标准 Modbus CRC16 算法（多项式 0xA001）
>         private ushort Crc16(byte[] data, int len)
>         {
>             ushort crc = 0xFFFF;
>             for (int i = 0; i < len; i++)
>             {
>                 crc ^= data[i];
>                 for (int j = 0; j < 8; j++)
>                     crc = (crc & 1) != 0 ? (ushort)((crc >> 1) ^ 0xA001) : (ushort)(crc >> 1);
>             }
>             return crc;
>         }
>
>         private void OnSendClick(object sender, RoutedEventArgs e)
>         {
>             if (_port == null || !_port.IsOpen) return;
>             byte slave = byte.Parse(SlaveBox.Text);
>             ushort addr = ushort.Parse(AddrBox.Text);
>             ushort count = ushort.Parse(CountBox.Text);
>             byte[] frame = BuildReadHoldingRegisters(slave, addr, count);
>             _port.Write(frame, 0, frame.Length);
>             FrameBox.Text = BitConverter.ToString(frame);
>             StatusText.Text = "请求已发送，等待从站响应";
>             StatusText.Foreground = System.Windows.Media.Brushes.Gray;
>         }
>
>         private void OnDataReceived(object sender, SerialDataReceivedEventArgs e)
>         {
>             int n = _port.BytesToRead;
>             byte[] data = new byte[n];
>             _port.Read(data, 0, n);
>             Dispatcher.Invoke(() => RecvBox.AppendText(BitConverter.ToString(data) + "\r\n"));
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 通过 RS-485 总线轮询多台变频器、电表、温控仪的实时数据
> ✅ 设备只有串口接口（无网口）的 PLC、仪表、传感器通信
> ✅ 成本敏感、现场布线已定型的存量串口设备接入
> ✅ 需要把 Modbus 帧结构完全掌控的底层协议开发
> ❌ 设备支持以太网且数据量大（选 Modbus TCP 更简单高效）
> ❌ 跨车间远程轮询（串口距离有限，应走 TCP/网关转换）

> [!pitfall] 常见踩坑
> 坑 1：**CRC 校验漏掉或算错** → RTU 帧必须带 CRC16（低字节在前）；漏校验会导致误把噪声当数据，用 Modbus Poll 对照验证 CRC 算法（多项式 0xA001）
> 
> 坑 2：**串口参数与设备不一致** → 波特率/数据位/校验位/停止位（如 9600,8,N,1）错一个就收不到应答；先查设备手册确认默认参数
> 
> 坑 3：**收包按"一次 Read 一帧"处理** → 串口数据是流，可能一次到达半帧或多帧；必须用"字节积累 + 按长度/空闲时间切帧"的缓冲解析
> 
> 坑 4：**超时太短导致慢设备应答被误判失败** → 某些变频器响应 >200ms，超时 100ms 会误报超时；超时设为 3.5 字符时间 + 设备响应余量（通常 500ms）
> 
> 坑 5：**DataReceived 回调里直接解析 UI** → 事件线程非 UI 线程，直接改控件抛异常；用 Dispatcher 或缓冲区回传，避免跨线程操作

> [!best] 最佳实践
> - **请求/响应成对校验**：响应地址码=请求地址码、功能码=请求功能码，不符即为异常帧，丢弃并计数
> - **读取数量尽量合并**：连续寄存器一次多读（如一次读 10 个寄存器），减少轮询次数，显著提升刷新率
> - **轮询调度用队列**：多台从站/多组寄存器用轮询队列管理，一站超时不阻塞整条总线
> - **解析用 BitConverter 注意端序**：寄存器数据大端序，转 ushort 后按手册解释 int16/uint32/float
> - **写操作加互斥**：写寄存器（06/16）与读轮询串行执行，避免读写帧交叉导致设备异常

> [!practice] 上手练习
> **Lv.1 照猫画虎**：用虚拟串口对 + Modbus 从站模拟器运行示例，完成一次"读 4 个保持寄存器"的完整轮询，观察帧字节与 CRC
> **Lv.2 小试牛刀**：扩展示例实现 06 功能码（写单个寄存器），把设备某个参数写进去并读回验证
> **Lv.3 融会贯通**：封装一个 ModbusRtuMaster：轮询队列 + 超时重发 + 读写互斥，支持多从站，并接入 MVVM 的 ViewModel 定时刷新界面

> [!related] 相关知识链接
> - ← 前置知识：《Modbus 协议概述》《SerialPort 类详解》《串口数据接收最佳实践》
> - → 后续必学：《Modbus TCP（网口）》对比两种传输变体
> - ⇄ 关联概念：《常用功能码详解》《Modbus 上位机实战》《常用 Modbus 库》
> - 📖 官方文档：https://modbus.org/docs/Modbus_over_serial_line_V1_02.pdf（Modbus 串行链路规范）
