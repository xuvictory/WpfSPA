---
title: DPI 感知模式设置
section: 11-advanced-ui
parent: 11.9 高 DPI 适配
---

# DPI 感知模式设置

> [!plain] 白话理解
> "DPI 感知模式设置"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"DPI 感知模式设置"是一个重要的知识点。当你掌握了基础控件，高级 UI 开发能让你的上位机从"能用"变成"好用"再变成"出彩"。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> DPI 感知模式设置是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> DPI 感知模式设置的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：当你掌握了基础控件，高级 UI 开发能让你的上位机从"能用"变成"好用"再变成"出彩"。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"DPI 感知模式设置"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

> [!example] 完整示例
> **DPI 感知模式设置演示：通过 app.manifest 声明 System DPI Aware，再用 GetDpiForWindow 读取当前窗口 DPI 并换算缩放因子，展示不同感知模式对界面清晰度的影响：**
>
> **说明：在项目 app.manifest 中添加 DPI 感知声明（默认 manifest 需显式加入）：**
>
> **app.manifest（片段）：**
> ```xml
> <?xml version="1.0" encoding="utf-8"?>
> <assembly manifestVersion="1.0" xmlns="urn:schemas-microsoft-com:asm.v1">
>   <!-- System DPI Aware：系统自动按 DPI 缩放，画面清晰无模糊 -->
>   <application xmlns="urn:schemas-microsoft-com:asm.v3">
>     <windowsSettings>
>       <dpiAware xmlns="http://schemas.microsoft.com/SMI/2005/WindowsSettings">true</dpiAware>
>     </windowsSettings>
>   </application>
> </assembly>
> ```
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="DPI 感知模式设置" Height="340" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="DPI 感知模式设置（GetDpiForWindow）"
>                    Foreground="#58A6FF" FontSize="14" FontWeight="Bold"/>
>         <Button Content="读取当前窗口 DPI" Click="OnReadDpi" Padding="12,6" Margin="0,18,0,0"
>                 HorizontalAlignment="Left" Background="#21262D" Foreground="White"/>
>         <TextBox x:Name="DpiBox" Margin="0,14,0,0" IsReadOnly="True" TextWrapping="Wrap"
>                  Height="140" Background="#161B22" Foreground="#8B949E" BorderBrush="#21262D"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Runtime.InteropServices;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         // 获取指定窗口所在显示器的 DPI（每英寸点数，96 = 100% 缩放）
>         [DllImport("user32.dll")]
>         private static extern uint GetDpiForWindow(IntPtr hwnd);
>
>         public MainWindow()
>         {
>             InitializeComponent();
>         }
>
>         private void OnReadDpi(object sender, RoutedEventArgs e)
>         {
>             // 拿到窗口句柄后调用 Win32 API 读取实际 DPI
>             var hwnd = new System.Windows.Interop.WindowInteropHelper(this).Handle;
>             uint dpi = GetDpiForWindow(hwnd);
>
>             DpiBox.AppendText($"当前窗口 DPI：{dpi}\n");
>             DpiBox.AppendText($"缩放比例：{dpi / 96.0:P0}\n");   // 96 DPI 为基准
>             DpiBox.AppendText($"1 英寸实际像素：{dpi}\n");
>             DpiBox.AppendText("系统 DPI Aware 模式下字体、控件由系统统一缩放，不会模糊。\n");
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
> **Lv.3 融会贯通**：结合前面学过的知识，用"DPI 感知模式设置"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"DPI 感知模式设置"
> - → 后续必学：掌握"DPI 感知模式设置"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
