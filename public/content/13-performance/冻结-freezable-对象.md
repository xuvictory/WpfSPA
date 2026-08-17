---
title: 冻结 Freezable 对象
section: 13-performance
parent: 13.2 UI 性能优化
---

# 冻结 Freezable 对象

> [!plain] 白话理解
> "冻结 Freezable 对象"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"冻结 Freezable 对象"是一个重要的知识点。工控现场对稳定性的要求近乎苛刻。性能优化不是"加分项"，而是"必须项"。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> 冻结 Freezable 对象是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> 冻结 Freezable 对象的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：工控现场对稳定性的要求近乎苛刻。性能优化不是"加分项"，而是"必须项"。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"冻结 Freezable 对象"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

> [!example] 完整示例
> **Freezable 冻结与共享：对比 10000 个独立画刷 vs 1 个冻结画刷共享的差异：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="冻结 Freezable 对象" Height="400" Width="520"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15" Background="#161B22" Padding="15">
>         <TextBlock Text="Freezable 冻结与共享（SolidColorBrush）"
>                    Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <TextBlock x:Name="StateText" Foreground="#8B949E" Margin="0,12,0,0" TextWrapping="Wrap"/>
>         <Button Content="创建 10000 个未冻结画刷" Click="OnCreateUnfrozen" Padding="8" Margin="0,12,0,0"
>                 Background="#21262D" Foreground="White" HorizontalAlignment="Left"/>
>         <Button Content="创建 1 个冻结画刷共享" Click="OnCreateFrozen" Padding="8" Margin="0,8,0,0"
>                 Background="#21262D" Foreground="White" HorizontalAlignment="Left"/>
>         <Button Content="尝试修改冻结画刷" Click="OnTryModify" Padding="8" Margin="0,8,0,0"
>                 Background="#DA3633" Foreground="White" HorizontalAlignment="Left"/>
>         <Border x:Name="DemoBox" Height="40" Background="#21262D" CornerRadius="4" Margin="0,16,0,0"/>
>         <TextBlock x:Name="ResultText" Foreground="#8B949E" Margin="0,10,0,0" TextWrapping="Wrap"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Collections.Generic;
> using System.Diagnostics;
> using System.Windows;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private readonly SolidColorBrush _accent = new SolidColorBrush(Color.FromRgb(0x58, 0xA6, 0xFF));
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             _accent.Freeze();   // 冻结：对象变为只读，可跨线程安全共享
>             DemoBox.Background = _accent;
>             StateText.Text = $"演示画刷 IsFrozen = {_accent.IsFrozen}（已冻结，可跨线程共享，修改会抛异常）";
>         }
>
>         // 未冻结：每个实例都是独立对象，无法跨线程共享
>         private void OnCreateUnfrozen(object sender, RoutedEventArgs e)
>         {
>             var sw = Stopwatch.StartNew();
>             var brushes = new List<Brush>();
>             for (int i = 0; i < 10000; i++)
>                 brushes.Add(new SolidColorBrush(Color.FromRgb(0x58, 0xA6, 0xFF)));
>             sw.Stop();
>             ResultText.Text = $"创建 10000 个未冻结画刷：耗时 {sw.Elapsed.TotalMilliseconds:F0} ms，" +
>                               $"产生 {brushes.Count} 个独立实例";
>         }
>
>         // 冻结：一个实例被所有目标共享，开销极小
>         private void OnCreateFrozen(object sender, RoutedEventArgs e)
>         {
>             var sw = Stopwatch.StartNew();
>             var shared = new SolidColorBrush(Color.FromRgb(0x58, 0xA6, 0xFF));
>             shared.Freeze();
>             for (int i = 0; i < 10000; i++) { /* 全部引用同一个 shared 画刷 */ }
>             sw.Stop();
>             ResultText.Text = $"创建并冻结 1 个画刷共享给 10000 个目标：耗时 {sw.Elapsed.TotalMilliseconds:F0} ms，" +
>                               "内存与开销远小于 10000 个独立实例";
>         }
>
>         // 冻结对象不可修改：需要变更时先 Clone()
>         private void OnTryModify(object sender, RoutedEventArgs e)
>         {
>             try
>             {
>                 _accent.Color = Colors.Red;
>             }
>             catch (InvalidOperationException ex)
>             {
>                 ResultText.Text = $"修改冻结画刷失败：{ex.Message}（冻结对象只读，可调用 Clone() 得到可变副本）";
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
> **Lv.3 融会贯通**：结合前面学过的知识，用"冻结 Freezable 对象"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"冻结 Freezable 对象"
> - → 后续必学：掌握"冻结 Freezable 对象"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
