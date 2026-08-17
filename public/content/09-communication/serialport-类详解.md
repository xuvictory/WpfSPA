---
title: SerialPort 类详解
section: 09-communication
parent: 9.2 串口通信
---

# SerialPort 类详解

> [!plain] 白话理解
> "SerialPort 类详解"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"SerialPort 类详解"是一个重要的知识点。通信是上位机的命脉。没有通信，上位机就是一个空壳。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> SerialPort 类详解是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> SerialPort 类详解的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：通信是上位机的命脉。没有通信，上位机就是一个空壳。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"SerialPort 类详解"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

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
> **Lv.3 融会贯通**：结合前面学过的知识，用"SerialPort 类详解"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"SerialPort 类详解"
> - → 后续必学：掌握"SerialPort 类详解"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
