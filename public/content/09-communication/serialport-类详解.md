---
title: SerialPort 类详解
section: 09-communication
parent: 9.2 串口通信
---

# SerialPort 类详解

> [!plain] 白话理解
> SerialPort 类就像上位机操作串口硬件的"遥控器"。你告诉它端口号（PortName）和波特率（BaudRate），调用 Open() 打开通道，用 Write() 把指令发出去，设备返回的数据会触发 DataReceived 事件，你在事件里读出来即可。本文把串口开发中用得最频繁的属性和方法逐一点名，是后续所有串口通信文章的 API 基础。

> [!def] 官方定义
> SerialPort 是 System.IO.Ports 命名空间（.NET Framework 2.0 起提供）中封装串行端口通信的类，继承自 Component。常用成员：PortName（端口名，如 COM1）、BaudRate（波特率）、DataBits（数据位）、Parity（校验位）、StopBits（停止位）、IsOpen（是否已打开）、BytesToRead（接收缓冲字节数）；方法 Open()/Close()/Read()/Write()/ReadExisting()/DiscardInBuffer()；事件 DataReceived/ErrorReceived/PinChanged。它封装了底层 Win32 串口 API，是上位机与 PLC、仪表、传感器通信的标准入口。

> [!origin] 由来背景
> 早年的 Windows 串口开发要手写 CreateFile/ReadFile/WriteFile 等 Win32 API，还要自行管理 OVERLAPPED 异步结构，代码冗长且极易出错。.NET Framework 2.0 推出 System.IO.Ports 后，微软把串口操作封装成面向对象的 SerialPort 类，内部自动处理打开、读写缓冲与异步事件。此后 C# 上位机与串口设备通信的主流方式就从"裸 API"转向了这个高内聚的封装类。

> [!essentials] 核心要点
> - **构造方式**：`new SerialPort(portName, baudRate)` 或 `new SerialPort()` 后逐项赋值再 `Open()`，两者等价
> - **波特率必须与设备一致**：设备手册写 9600 就设 9600，不匹配会收到乱码或完全无响应
> - **数据位/校验位/停止位**：默认 8/N/1 覆盖大多数设备，但 Modbus RTU 等协议通常要求 8/E/1
> - **接收事件在后台线程**：DataReceived 异步触发，操作 UI 必须经 Dispatcher.Invoke
> - **ReadExisting() 适合文本**：返回字符串；传字节用 `Read(buffer, 0, length)` 按 BytesToRead 读取
> - **用完必须释放**：Close() 释放端口，否则端口被占用，其他程序无法打开同一 COM 口
> - **错误事件兜底**：ErrorReceived 可捕获帧错误、奇偶校验错误、接收溢出，用于发现线路异常

> [!example] 完整示例
> **SerialPort 属性与方法演示：枚举端口、打开/关闭、发送与接收数据：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="串口助手 - SerialPort 类" Height="500" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="端口与参数设置" Foreground="#58A6FF" FontWeight="Bold"/>
>         <StackPanel Orientation="Horizontal" Margin="0,6,0,0">
>             <ComboBox x:Name="PortCombo" Width="140" Margin="0,0,8,0"
>                       Background="#161B22" Foreground="#8B949E"/>
>             <ComboBox x:Name="BaudCombo" Width="100" Background="#161B22" Foreground="#8B949E"/>
>         </StackPanel>
>         <StackPanel Orientation="Horizontal" Margin="0,8,0,0">
>             <Button x:Name="OpenBtn" Content="打开串口" Click="OnOpenClick" Padding="10,4"
>                     Background="#21262D" Foreground="White"/>
>             <Button x:Name="CloseBtn" Content="关闭串口" IsEnabled="False" Click="OnCloseClick"
>                     Padding="10,4" Margin="8,0,0,0" Background="#21262D" Foreground="White"/>
>             <Button Content="刷新端口" Click="OnRefreshClick" Padding="10,4" Margin="8,0,0,0"
>                     Background="#21262D" Foreground="White"/>
>         </StackPanel>
>         <TextBox x:Name="SendBox" Height="60" Margin="0,10,0,0" TextWrapping="Wrap"
>                  Background="#161B22" Foreground="#8B949E" BorderBrush="#30363D"
>                  AcceptsReturn="True"/>
>         <Button Content="发送数据" Click="OnSendClick" Margin="0,8,0,0" Padding="10,4"
>                 Background="#238636" Foreground="White"/>
>         <TextBox x:Name="RecvBox" Height="120" Margin="0,10,0,0" TextWrapping="Wrap"
>                  Background="#161B22" Foreground="#8B949E" BorderBrush="#30363D"
>                  IsReadOnly="True" VerticalScrollBarVisibility="Auto"/>
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
>         private SerialPort _port; // 串口对象，贯穿打开/发送/接收全流程
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             // 波特率下拉框预置常用选项
>             foreach (var baud in new[] { "9600", "19200", "38400", "115200" })
>                 BaudCombo.Items.Add(baud);
>             BaudCombo.SelectedIndex = 3; // 默认 115200
>             RefreshPorts();              // 启动即枚举可用串口
>         }
>
>         // 枚举系统所有串口并填充下拉框
>         private void RefreshPorts()
>         {
>             PortCombo.Items.Clear();
>             foreach (string name in SerialPort.GetPortNames())
>                 PortCombo.Items.Add(name);
>             if (PortCombo.Items.Count > 0)
>                 PortCombo.SelectedIndex = 0;
>         }
>
>         private void OnRefreshClick(object sender, RoutedEventArgs e) => RefreshPorts();
>
>         // 打开串口：配置属性后调用 Open()
>         private void OnOpenClick(object sender, RoutedEventArgs e)
>         {
>             try
>             {
>                 _port = new SerialPort(PortCombo.SelectedItem as string,
>                                        int.Parse(BaudCombo.SelectedItem as string));
>                 _port.DataReceived += OnDataReceived; // 订阅接收事件
>                 _port.Open();
>                 OpenBtn.IsEnabled = false;
>                 CloseBtn.IsEnabled = true;
>                 StatusText.Text = $"已打开 {_port.PortName}，波特率 {_port.BaudRate}";
>                 StatusText.Foreground = System.Windows.Media.Brushes.LimeGreen;
>             }
>             catch (Exception ex)
>             {
>                 StatusText.Text = "打开失败：" + ex.Message;
>                 StatusText.Foreground = System.Windows.Media.Brushes.OrangeRed;
>             }
>         }
>
>         private void OnCloseClick(object sender, RoutedEventArgs e)
>         {
>             _port?.Close(); // Close 会释放端口资源
>             OpenBtn.IsEnabled = true;
>             CloseBtn.IsEnabled = false;
>             StatusText.Text = "串口已关闭";
>             StatusText.Foreground = System.Windows.Media.Brushes.Gray;
>         }
>
>         // 发送：Write 按字节写出
>         private void OnSendClick(object sender, RoutedEventArgs e)
>         {
>             if (_port == null || !_port.IsOpen) return;
>             _port.Write(SendBox.Text);
>             RecvBox.AppendText($"[发送] {SendBox.Text}\r\n");
>         }
>
>         // 接收事件在后台线程触发，需通过 Dispatcher 回到 UI 线程
>         private void OnDataReceived(object sender, SerialDataReceivedEventArgs e)
>         {
>             string data = _port.ReadExisting();
>             Dispatcher.Invoke(() => RecvBox.AppendText($"[接收] {data}\r\n"));
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 与 PLC 走串口协议（Modbus RTU、西门子 PPI 等）时作为通信底层
> ✅ 读取串口仪表、条码枪、称重模块的实时数据
> ✅ 调试串口设备：枚举端口、开合串口、手动收发测试
> ✅ 需要通过串口固件升级（Bootloader 协议）的场景
> ❌ 高速海量数据交换（串口带宽有限，应改用 TCP/工业以太网）
> ❌ 需要与 USB-HID、蓝牙虚拟串口统一管理的复杂通信（可选用串口转虚拟串口驱动方案）

> [!pitfall] 常见踩坑
> 坑 1：**端口被占用打不开（UnauthorizedAccessException）** → 上一次异常退出未 Close()，或串口助手还占着该端口；先关掉占用程序，或捕获异常友好提示"端口被占用"
>
> 坑 2：**DataReceived 里直接操作 UI 抛"调用线程无法访问此对象"** → 该事件在后台线程触发，必须用 Dispatcher.Invoke/BeginInvoke 回到 UI 线程再更新控件
>
> 坑 3：**波特率配错收到乱码或全无响应** → 先核对设备手册的波特率/校验位/停止位，再用回环头验证线缆通路，排除硬件问题后再查代码
>
> 坑 4：**关闭瞬间事件还在触发** → 先退订 DataReceived 再 Close()，否则事件回调可能访问已关闭的端口抛 ObjectDisposedException

> [!best] 最佳实践
> - **统一封装收发**：把 SerialPort 包一层 SerialPortService，界面层只订阅高层数据事件，不直接碰端口对象
> - **接收走字节缓冲 + 帧解析**：不要 ReadString 当完整报文，串口是字节流，按协议拼帧（参考《串口数据接收最佳实践》）
> - **配置读写超时**：WriteTimeout/ReadTimeout 按需设置，设备无响应时快速失败而不是无限挂起
> - **端口热插拔支持**：定时枚举 GetPortNames() 或监听设备变化消息，应对 USB 转串口拔插
> - **收发留日志**：带时间戳记录收发内容与字节数，现场排障全靠它

> [!practice] 上手练习
> **Lv.1 照猫画虎**：用 USB 转串口 + 回环头（或虚拟串口对）运行示例，完成枚举端口、打开、发送、接收的完整流程，观察 BytesToRead 与界面状态变化
> **Lv.2 小试牛刀**：给示例增加"连接状态"提示（打开变绿、断开变灰），并处理端口被占用时的友好错误提示
> **Lv.3 融会贯通**：结合《串口数据接收最佳实践》的帧解析逻辑，封装一个 SerialPortService：连接管理 + 按帧回调，供后续 Modbus/自定协议章节复用

> [!related] 相关知识链接
> - ← 前置知识：《串口通信基础概念（RS-232、RS-485 等）》了解电气标准与接线
> - → 后续必学：《串口事件处理》掌握 DataReceived/ErrorReceived 的完整用法
> - ⇄ 关联概念：《串口数据接收最佳实践》《Modbus 协议概述》《上位机串口实战封装》
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.io.ports.serialport
