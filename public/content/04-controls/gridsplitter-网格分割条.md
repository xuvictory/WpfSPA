---
title: GridSplitter 网格分割条
section: 04-controls
parent: 4.9 装饰与辅助控件
---

# GridSplitter 网格分割条

> [!plain] 白话理解
> "GridSplitter 网格分割条"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"GridSplitter 网格分割条"是一个重要的知识点。控件是构建界面的积木块。了解每个控件的特点，你才能在上位机开发中快速搭出专业的界面。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> GridSplitter 网格分割条是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> GridSplitter 网格分割条的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：控件是构建界面的积木块。了解每个控件的特点，你才能在上位机开发中快速搭出专业的界面。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"GridSplitter 网格分割条"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

> [!example] 完整示例
> **可拖拽分栏布局演示：GridSplitter 拖动调整列宽，实现"设备树 | 详情 | 日志"三栏：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="分栏布局 - GridSplitter" Height="460" Width="760"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="10">
>         <Grid.ColumnDefinitions>
>             <ColumnDefinition Width="2*" MinWidth="140"/>
>             <ColumnDefinition Width="Auto"/>
>             <ColumnDefinition Width="5*" MinWidth="220"/>
>             <ColumnDefinition Width="Auto"/>
>             <ColumnDefinition Width="3*" MinWidth="140"/>
>         </Grid.ColumnDefinitions>
>
>         <!-- 左栏：设备列表 -->
>         <ListBox Grid.Column="0" Background="#161B22" Foreground="White"
>                  BorderBrush="#2A4A6C" BorderThickness="1">
>             <ListBoxItem Content="电机 M-101"/>
>             <ListBoxItem Content="变频器 V-202"/>
>             <ListBoxItem Content="传感器 S-303"/>
>         </ListBox>
>
>         <!-- 第一个可拖拽分割条（Vertical 默认） -->
>         <GridSplitter Grid.Column="1" Width="6" HorizontalAlignment="Stretch"
>                       Background="#2A4A6C" ResizeBehavior="PreviousAndNext"
>                       ShowsPreview="True"/>
>
>         <!-- 中栏：设备详情 -->
>         <StackPanel Grid.Column="2" Background="#161B22" BorderBrush="#2A4A6C"
>                     BorderThickness="1" Padding="10">
>             <TextBlock Text="设备详情" FontWeight="Bold" Foreground="White"/>
>             <TextBlock Text="当前转速：1500 RPM" Foreground="#8B949E" Margin="0,10,0,0"/>
>         </StackPanel>
>
>         <!-- 第二个分割条 -->
>         <GridSplitter Grid.Column="3" Width="6" HorizontalAlignment="Stretch"
>                       Background="#2A4A6C" ResizeBehavior="PreviousAndNext"/>
>
>         <!-- 右栏：运行日志 -->
>         <TextBox Grid.Column="4" AcceptsReturn="True" TextWrapping="Wrap"
>                  IsReadOnly="True" Text="[10:12] 设备启动&#x0a;[10:15] 参数下发成功"
>                  Background="#161B22" Foreground="#C9D1D9" BorderBrush="#2A4A6C"
>                  BorderThickness="1" VerticalScrollBarVisibility="Auto"/>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
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
> **Lv.3 融会贯通**：结合前面学过的知识，用"GridSplitter 网格分割条"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"GridSplitter 网格分割条"
> - → 后续必学：掌握"GridSplitter 网格分割条"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
