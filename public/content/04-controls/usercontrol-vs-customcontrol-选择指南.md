---
title: UserControl vs CustomControl 选择指南
section: 04-controls
parent: 4.11 用户控件与自定义控件
---

# UserControl vs CustomControl 选择指南

> [!plain] 白话理解
> "UserControl vs CustomControl 选择指南"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"UserControl vs CustomControl 选择指南"是一个重要的知识点。控件是构建界面的积木块。了解每个控件的特点，你才能在上位机开发中快速搭出专业的界面。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> UserControl vs CustomControl 选择指南是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> UserControl vs CustomControl 选择指南的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：控件是构建界面的积木块。了解每个控件的特点，你才能在上位机开发中快速搭出专业的界面。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"UserControl vs CustomControl 选择指南"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

> [!example] 完整示例
> **同一"温度显示条"分别用两种方式实现，对比差异：UserControl 适合组合现有控件、CustomControl 适合完全自绘模板：**
>
> **方式一：UserControl（组合式，开发快，样式跟随外观文件）**
>
> **Controls/TempBarUC.xaml：**
> ```xml
> <UserControl x:Class="HmiDemo.Controls.TempBarUC"
>              xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>              xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">
>     <Grid>
>         <ProgressBar x:Name="bar" Minimum="0" Maximum="100" Height="18"/>
>         <TextBlock x:Name="txt" Foreground="White" HorizontalAlignment="Center"
>                    VerticalAlignment="Center" FontSize="12"/>
>     </Grid>
> </UserControl>
> ```
>
> **Controls/TempBarUC.xaml.cs：**
> ```csharp
> using System.Windows;
> using System.Windows.Controls;
>
> namespace HmiDemo.Controls
> {
>     public partial class TempBarUC : UserControl
>     {
>         public TempBarUC() => InitializeComponent();
>
>         public double Value
>         {
>             get { return bar.Value; }
>             set
>             {
>                 bar.Value = value;
>                 txt.Text = $"{value:F0} ℃";
>             }
>         }
>     }
> }
> ```
>
> **方式二：CustomControl（自绘模板，外观可在多个主题间切换）**
>
> **Controls/TempBarCC.cs：**
> ```csharp
> using System.Windows;
> using System.Windows.Controls;
> using System.Windows.Controls.Primitives;
>
> namespace HmiDemo.Controls
> {
>     public class TempBarCC : RangeBase
>     {
>         static TempBarCC()
>         {
>             DefaultStyleKeyProperty.OverrideMetadata(typeof(TempBarCC),
>                 new FrameworkPropertyMetadata(typeof(TempBarCC)));
>         }
>
>         // RangeBase 已经带了 Minimum/Maximum/Value 依赖属性
>     }
> }
> ```
>
> **Themes/Generic.xaml（为其定义模板）：**
> ```xml
> <ResourceDictionary
>     xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>     xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>     xmlns:controls="clr-namespace:HmiDemo.Controls">
>     <Style TargetType="{x:Type controls:TempBarCC}">
>         <Setter Property="Height" Value="18"/>
>         <Setter Property="Template">
>             <Setter.Value>
>                 <ControlTemplate TargetType="{x:Type controls:TempBarCC}">
>                     <ProgressBar Minimum="{TemplateBinding Minimum}"
>                                  Maximum="{TemplateBinding Maximum}"
>                                  Value="{TemplateBinding Value}" Height="18"/>
>                 </ControlTemplate>
>             </Setter.Value>
>         </Setter>
>     </Style>
> </ResourceDictionary>
> ```
>
> **MainWindow.xaml（两种控件并列使用）：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         xmlns:ctrls="clr-namespace:HmiDemo.Controls"
>         Title="两种实现对比" Height="280" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="20">
>         <TextBlock Text="UserControl 实现：" Foreground="#8B949E"/>
>         <ctrls:TempBarUC x:Name="ucBar" Value="65" Margin="0,4,0,16"/>
>         <TextBlock Text="CustomControl 实现：" Foreground="#8B949E"/>
>         <ctrls:TempBarCC x:Name="ccBar" Minimum="0" Maximum="100" Value="65"/>
>     </StackPanel>
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
> **Lv.3 融会贯通**：结合前面学过的知识，用"UserControl vs CustomControl 选择指南"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"UserControl vs CustomControl 选择指南"
> - → 后续必学：掌握"UserControl vs CustomControl 选择指南"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
