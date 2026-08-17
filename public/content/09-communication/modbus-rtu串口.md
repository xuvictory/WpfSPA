---
title: Modbus RTU（串口）
section: 09-communication
parent: 9.4 Modbus 通信协议
---

# Modbus RTU（串口）

> [!plain] 白话理解
> "Modbus RTU（串口）"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"Modbus RTU（串口）"是一个重要的知识点。通信是上位机的命脉。没有通信，上位机就是一个空壳。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> Modbus RTU（串口）是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> Modbus RTU（串口）的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：通信是上位机的命脉。没有通信，上位机就是一个空壳。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"Modbus RTU（串口）"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

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
> **Lv.3 融会贯通**：结合前面学过的知识，用"Modbus RTU（串口）"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"Modbus RTU（串口）"
> - → 后续必学：掌握"Modbus RTU（串口）"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
