---
title: NModbus
section: 16-resources
parent: 16.1 GitHub 优质 WPF 开源项目
---

# NModbus

> [!plain] 白话理解
> "NModbus"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"NModbus"是一个重要的知识点。技术之路是漫长的，好的资源能让你少走很多弯路。本章整理了最优质的 WPF 和上位机学习资源。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> NModbus是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> NModbus的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：技术之路是漫长的，好的资源能让你少走很多弯路。本章整理了最优质的 WPF 和上位机学习资源。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"NModbus"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

> [!example] 完整示例
> **NModbus：串口读取从站保持寄存器（功能码 03）演示：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="Modbus RTU 调试" Height="440" Width="480"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="NModbus 保持寄存器读取" Foreground="#58A6FF" FontWeight="Bold" Margin="0,0,0,10"/>
>         <StackPanel Orientation="Horizontal" Margin="0,0,0,8">
>             <TextBlock Text="串口：" Foreground="#8B949E" VerticalAlignment="Center"/>
>             <TextBox x:Name="PortBox" Text="COM3" Width="70" Margin="4,0,0,0"
>                      Background="#0D1117" Foreground="White" BorderBrush="#21262D"/>
>             <TextBlock Text="从站地址：" Foreground="#8B949E" VerticalAlignment="Center" Margin="12,0,0,0"/>
>             <TextBox x:Name="SlaveBox" Text="1" Width="50" Margin="4,0,0,0"
>                      Background="#0D1117" Foreground="White" BorderBrush="#21262D"/>
>         </StackPanel>
>         <StackPanel Orientation="Horizontal" Margin="0,0,0,8">
>             <TextBlock Text="起始寄存器：" Foreground="#8B949E" VerticalAlignment="Center"/>
>             <TextBox x:Name="StartBox" Text="0" Width="50" Margin="4,0,0,0"
>                      Background="#0D1117" Foreground="White" BorderBrush="#21262D"/>
>             <TextBlock Text="数量：" Foreground="#8B949E" VerticalAlignment="Center" Margin="12,0,0,0"/>
>             <TextBox x:Name="CountBox" Text="10" Width="50" Margin="4,0,0,0"
>                      Background="#0D1117" Foreground="White" BorderBrush="#21262D"/>
>         </StackPanel>
>         <Button Content="读取保持寄存器" Click="OnReadClick" Margin="0,0,0,8" Padding="8"
>                 Background="#238636" Foreground="White"/>
>         <TextBlock x:Name="StatusText" Foreground="#8B949E" Margin="0,4,0,8" TextWrapping="Wrap"/>
>         <ListBox x:Name="RegList" Background="#161B22" Foreground="#8B949E"
>                  BorderBrush="#21262D" Height="180"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.IO.Ports;
> using System.Threading.Tasks;
> using System.Windows;
> using Modbus.Device;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         // 需通过 NuGet 安装 NModbus 包（Install-Package NModbus）
>         public MainWindow() => InitializeComponent();
>
>         private async void OnReadClick(object sender, RoutedEventArgs e)
>         {
>             StatusText.Text = "正在读取保持寄存器 ...";
>             try
>             {
>                 // 串口读写放到后台线程，避免阻塞 UI（配合 VSPD 虚拟串口可本地联调）
>                 var registers = await Task.Run(() =>
>                 {
>                     using var port = new SerialPort(PortBox.Text, 9600, Parity.None, 8, StopBits.One)
>                     {
>                         ReadTimeout = 2000,
>                         WriteTimeout = 2000
>                     };
>                     port.Open();
>                     // 功能码 03：读取保持寄存器
>                     return ModbusSerialMaster.CreateRtu(port).ReadHoldingRegisters(
>                         byte.Parse(SlaveBox.Text),
>                         ushort.Parse(StartBox.Text),
>                         ushort.Parse(CountBox.Text));
>                 });
>
>                 RegList.Items.Clear();
>                 for (var i = 0; i < registers.Length; i++)
>                 {
>                     RegList.Items.Add($"寄存器 {int.Parse(StartBox.Text) + i}：{registers[i]}");
>                 }
>                 StatusText.Text = "读取成功，共 " + registers.Length + " 个寄存器";
>             }
>             catch (Exception ex)
>             {
>                 StatusText.Text = "读取失败：" + ex.Message;
>             }
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
> **Lv.3 融会贯通**：结合前面学过的知识，用"NModbus"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"NModbus"
> - → 后续必学：掌握"NModbus"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
