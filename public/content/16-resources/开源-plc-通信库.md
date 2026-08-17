---
title: 开源 PLC 通信库
section: 16-resources
parent: 16.2 上位机相关开源项目
---

# 开源 PLC 通信库

> [!plain] 白话理解
> "开源 PLC 通信库"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"开源 PLC 通信库"是一个重要的知识点。技术之路是漫长的，好的资源能让你少走很多弯路。本章整理了最优质的 WPF 和上位机学习资源。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> 开源 PLC 通信库是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> 开源 PLC 通信库的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：技术之路是漫长的，好的资源能让你少走很多弯路。本章整理了最优质的 WPF 和上位机学习资源。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"开源 PLC 通信库"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

> [!example] 完整示例
> **西门子 S7 PLC 连接与数据读取演示（开源通信库 HslCommunication）：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="PLC 通信 - 开源通信库" Height="420" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <Border Background="#161B22" Padding="12" CornerRadius="6" Margin="0,0,0,10">
>             <StackPanel>
>                 <TextBlock Text="PLC 连接配置（HslCommunication）" Foreground="#58A6FF"
>                            FontWeight="Bold" Margin="0,0,0,8"/>
>                 <StackPanel Orientation="Horizontal">
>                     <TextBlock Text="IP：" Foreground="#8B949E" VerticalAlignment="Center"/>
>                     <TextBox x:Name="IpBox" Text="192.168.0.1" Width="120" Margin="4,0,0,0"
>                              Background="#0D1117" Foreground="White" BorderBrush="#21262D"/>
>                     <TextBlock Text="端口：" Foreground="#8B949E" VerticalAlignment="Center" Margin="12,0,0,0"/>
>                     <TextBox x:Name="PortBox" Text="102" Width="60" Margin="4,0,0,0"
>                              Background="#0D1117" Foreground="White" BorderBrush="#21262D"/>
>                 </StackPanel>
>             </StackPanel>
>         </Border>
>         <Button Content="连接 PLC" Click="OnConnectClick" Margin="0,0,0,8" Padding="8"
>                 Background="#21262D" Foreground="White"/>
>         <Button x:Name="ReadBtn" Content="读取 DB1.DBW0" Click="OnReadClick" Margin="0,0,0,8"
>                 Padding="8" Background="#238636" Foreground="White" IsEnabled="False"/>
>         <TextBlock x:Name="StatusText" Foreground="#8B949E" Margin="0,4,0,8" TextWrapping="Wrap"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Threading.Tasks;
> using System.Windows;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         // 开源通信库 HslCommunication（NuGet：Install-Package HslCommunication）
>         private readonly HslCommunication.Profinet.Siemens.SiemensS7Net _plc;
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             // 以 S7-1500 为例创建客户端，连接对象在窗口生命周期内复用
>             _plc = new HslCommunication.Profinet.Siemens.SiemensS7Net(
>                 HslCommunication.Profinet.Siemens.SiemensPLCS.S1500);
>         }
>
>         private async void OnConnectClick(object sender, RoutedEventArgs e)
>         {
>             _plc.IpAddress = IpBox.Text;
>             _plc.Port = int.Parse(PortBox.Text);
>
>             StatusText.Text = "正在连接 PLC ...";
>             // 真实网络调用放到后台线程，避免阻塞 UI
>             var result = await Task.Run(() => _plc.ConnectServer());
>             if (result.IsSuccess)
>             {
>                 StatusText.Text = "连接成功，等待读取数据";
>                 StatusText.Foreground = Brushes.LimeGreen;
>                 ReadBtn.IsEnabled = true;
>             }
>             else
>             {
>                 StatusText.Text = "连接失败：" + result.Message;
>                 StatusText.Foreground = Brushes.OrangeRed;
>             }
>         }
>
>         private async void OnReadClick(object sender, RoutedEventArgs e)
>         {
>             // 读取 DB1 数据块中 DBW0 的 16 位有符号整数（如温度、速度等工艺参数）
>             var result = await Task.Run(() => _plc.ReadInt16("DB1.DBW0"));
>             if (result.IsSuccess)
>             {
>                 StatusText.Text = $"DB1.DBW0 当前值 = {result.Content}";
>                 StatusText.Foreground = Brushes.LimeGreen;
>             }
>             else
>             {
>                 StatusText.Text = "读取失败：" + result.Message;
>                 StatusText.Foreground = Brushes.OrangeRed;
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
> **Lv.3 融会贯通**：结合前面学过的知识，用"开源 PLC 通信库"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"开源 PLC 通信库"
> - → 后续必学：掌握"开源 PLC 通信库"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
