---
title: P/Invoke 基础
section: 11-advanced-ui
parent: 11.6 WPF 与 Windows API 交互
---

# P/Invoke 基础

> [!plain] 白话理解
> "P/Invoke 基础"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"P/Invoke 基础"是一个重要的知识点。当你掌握了基础控件，高级 UI 开发能让你的上位机从"能用"变成"好用"再变成"出彩"。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> P/Invoke 基础是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> P/Invoke 基础的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：当你掌握了基础控件，高级 UI 开发能让你的上位机从"能用"变成"好用"再变成"出彩"。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"P/Invoke 基础"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

> [!example] 完整示例
> **P/Invoke 调用 Win32 API 演示：用 DllImport 声明 user32.dll / kernel32.dll 中的原生函数（MessageBox、GetSystemMetrics、GetTickCount），在 WPF 按钮中直接调用，展示托管代码与非托管代码互操作：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="P/Invoke 基础" Height="380" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="P/Invoke 调用 Win32 API（DllImport 互操作）"
>                    Foreground="#58A6FF" FontSize="14" FontWeight="Bold"/>
>         <TextBlock Text="DllImport 特性声明外部函数，CLR 自动完成类型封送" Foreground="#8B949E"
>                    Margin="0,10,0,0" TextWrapping="Wrap"/>
>         <StackPanel Margin="0,20,0,0">
>             <Button Content="弹出原生 MessageBox（user32.dll）" Padding="12,7" Margin="0,0,0,10"
>                     HorizontalAlignment="Left" Background="#21262D" Foreground="White"
>                     Click="OnNativeMessageBox"/>
>             <Button Content="读取屏幕分辨率（GetSystemMetrics）" Padding="12,7" Margin="0,0,0,10"
>                     HorizontalAlignment="Left" Background="#21262D" Foreground="White"
>                     Click="OnScreenMetrics"/>
>             <Button Content="查询系统已运行时长（GetTickCount）" Padding="12,7" Margin="0,0,0,10"
>                     HorizontalAlignment="Left" Background="#21262D" Foreground="White"
>                     Click="OnUptime"/>
>         </StackPanel>
>         <TextBlock x:Name="ResultText" Foreground="#58A6FF" Margin="0,12,0,0" TextWrapping="Wrap"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码与 P/Invoke 声明：**
> ```csharp
> using System;
> using System.Runtime.InteropServices;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         // ---- P/Invoke 声明：DllImport 告诉运行时去哪个 DLL 找函数 ----
>
>         // user32.dll：Windows 用户界面核心库
>         [DllImport("user32.dll", CharSet = CharSet.Unicode)]
>         private static extern int NativeMessageBox(IntPtr hWnd, string text,
>             string caption, uint type);
>
>         // 屏幕指标枚举（仅列本次用到的几项）
>         private const int SM_CXSCREEN = 0;   // 主屏宽（像素）
>         private const int SM_CYSCREEN = 1;   // 主屏高（像素）
>
>         [DllImport("user32.dll")]
>         private static extern int GetSystemMetrics(int index);
>
>         // kernel32.dll：系统内核函数
>         [DllImport("kernel32.dll")]
>         private static extern uint GetTickCount();
>
>         public MainWindow()
>         {
>             InitializeComponent();
>         }
>
>         // 调用原生 MessageBox：第一个参数传窗口句柄，实现模态归属
>         private void OnNativeMessageBox(object sender, RoutedEventArgs e)
>         {
>             NativeMessageBox(new System.Windows.Interop.WindowInteropHelper(this).Handle,
>                 "这条消息框来自 Win32 API 调用！", "P/Invoke", 0x40 /* MB_ICONINFORMATION */);
>         }
>
>         // 读取屏幕宽高，证明能获取 .NET 层没有直接暴露的系统信息
>         private void OnScreenMetrics(object sender, RoutedEventArgs e)
>         {
>             int w = GetSystemMetrics(SM_CXSCREEN);
>             int h = GetSystemMetrics(SM_CYSCREEN);
>             ResultText.Text = $"主屏幕分辨率：{w} × {h} 像素";
>         }
>
>         // 系统运行时长：返回自启动以来的毫秒数
>         private void OnUptime(object sender, RoutedEventArgs e)
>         {
>             uint ms = GetTickCount();
>             ResultText.Text = $"系统已运行：{ms / 3600000.0:F1} 小时";
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
> **Lv.3 融会贯通**：结合前面学过的知识，用"P/Invoke 基础"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"P/Invoke 基础"
> - → 后续必学：掌握"P/Invoke 基础"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
