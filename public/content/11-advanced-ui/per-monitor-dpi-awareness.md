---
title: Per-Monitor DPI Awareness
section: 11-advanced-ui
parent: 11.9 高 DPI 适配
---

# Per-Monitor DPI Awareness

> [!plain] 白话理解
> "Per-Monitor DPI Awareness"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"Per-Monitor DPI Awareness"是一个重要的知识点。当你掌握了基础控件，高级 UI 开发能让你的上位机从"能用"变成"好用"再变成"出彩"。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> Per-Monitor DPI Awareness是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> Per-Monitor DPI Awareness的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：当你掌握了基础控件，高级 UI 开发能让你的上位机从"能用"变成"好用"再变成"出彩"。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"Per-Monitor DPI Awareness"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

> [!example] 完整示例
> **Per-Monitor DPI Awareness 演示：manifest 声明 PerMonitorV2，窗口跨屏移动时监听 DpiChanged 事件，实时读取新显示器 DPI 并动态换算字号与布局，保证高 DPI 屏上界面依然清晰：**
>
> **说明：PerMonitorV2 是 Win10 1703+ 的推荐模式，需在 app.manifest 中声明：**
>
> **app.manifest（片段）：**
> ```xml
> <?xml version="1.0" encoding="utf-8"?>
> <assembly manifestVersion="1.0" xmlns="urn:schemas-microsoft-com:asm.v1">
>   <application xmlns="urn:schemas-microsoft-com:asm.v3">
>     <windowsSettings>
>       <!-- PerMonitorV2：每个显示器独立 DPI，跨屏拖拽时动态适配 -->
>       <dpiAwareness xmlns="http://schemas.microsoft.com/SMI/2016/WindowsSettings">PerMonitorV2</dpiAwareness>
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
>         Title="Per-Monitor DPI Awareness" Height="400" Width="500"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="Per-Monitor DPI Awareness（跨屏动态适配）"
>                    Foreground="#58A6FF" FontSize="14" FontWeight="Bold"/>
>         <TextBlock Text="把窗口拖到另一块不同缩放的屏幕，DPI 会实时更新" Foreground="#8B949E"
>                    Margin="0,10,0,0" TextWrapping="Wrap"/>
>         <Border Margin="0,18,0,0" Background="#161B22" BorderBrush="#21262D"
>                 BorderThickness="1" CornerRadius="6" Padding="14">
>             <StackPanel>
>                 <TextBlock x:Name="TitleInfo" Text="当前显示器 DPI：--" Foreground="White"
>                            FontSize="16" FontWeight="Bold"/>
>                 <TextBlock x:Name="ScaleInfo" Text="缩放比例：--" Foreground="#8B949E"
>                            Margin="0,6,0,0"/>
>                 <TextBlock x:Name="PixelInfo" Text="1 DIP = -- 物理像素" Foreground="#58A6FF"
>                            Margin="0,6,0,0"/>
>             </StackPanel>
>         </Border>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Windows;
> using System.Windows.Interop;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow()
>         {
>             InitializeComponent();
>             SourceInitialized += OnSourceInitialized;
>         }
>
>         // 窗口句柄就绪后：订阅 DpiChanged 消息，并读取初始 DPI
>         private void OnSourceInitialized(object sender, EventArgs e)
>         {
>             var hwnd = new WindowInteropHelper(this).Handle;
>             var source = HwndSource.FromHwnd(hwnd);
>             source?.AddHook(WndProc);
>             UpdateDpiInfo();
>         }
>
>         // 拦截窗口消息：DPI 变化（WM_DPICHANGED = 0x02E0）时刷新显示
>         private IntPtr WndProc(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
>         {
>             if (msg == 0x02E0) // WM_DPICHANGED
>             {
>                 UpdateDpiInfo();
>                 handled = true;
>             }
>             return IntPtr.Zero;
>         }
>
>         // 读取当前窗口所在显示器 DPI 并换算显示
>         private void UpdateDpiInfo()
>         {
>             var hwnd = new WindowInteropHelper(this).Handle;
>             double dpi = GetDpiForWindow(hwnd);
>
>             TitleInfo.Text = $"当前显示器 DPI：{dpi:0}";
>             ScaleInfo.Text = $"缩放比例：{dpi / 96.0:P0}";
>             PixelInfo.Text = $"1 DIP = {dpi / 96.0:F2} 物理像素";
>         }
>
>         [System.Runtime.InteropServices.DllImport("user32.dll")]
>         private static extern uint GetDpiForWindow(IntPtr hwnd);
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
> **Lv.3 融会贯通**：结合前面学过的知识，用"Per-Monitor DPI Awareness"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"Per-Monitor DPI Awareness"
> - → 后续必学：掌握"Per-Monitor DPI Awareness"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
