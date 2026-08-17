---
title: MaterialDesignInXAML
section: 11-advanced-ui
parent: 11.7 第三方 UI 控件库
---

# MaterialDesignInXAML

> [!plain] 白话理解
> "MaterialDesignInXAML"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"MaterialDesignInXAML"是一个重要的知识点。当你掌握了基础控件，高级 UI 开发能让你的上位机从"能用"变成"好用"再变成"出彩"。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> MaterialDesignInXAML是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> MaterialDesignInXAML的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：当你掌握了基础控件，高级 UI 开发能让你的上位机从"能用"变成"好用"再变成"出彩"。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"MaterialDesignInXAML"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

> [!example] 完整示例
> **MaterialDesignInXAML 上位机面板演示：NuGet 安装 MaterialDesignThemes 后，在 App.xaml 合并 BundledTheme 与默认样式，窗口用 md: 命名空间下的卡片、按钮、对话框等控件搭建设备控制面板：**
>
> **说明：先通过 NuGet 安装 `Install-Package MaterialDesignThemes`。**
>
> **App.xaml：**
> ```xml
> <Application x:Class="HmiDemo.App"
>              xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>              xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>              xmlns:materialDesign="http://materialdesigninxaml.net/winfx/xaml/themes"
>              StartupUri="MainWindow.xaml">
>     <Application.Resources>
>         <ResourceDictionary>
>             <ResourceDictionary.MergedDictionaries>
>                 <!-- 深色主题 + 品牌色 -->
>                 <materialDesign:BundledTheme BaseTheme="Dark"
>                                               PrimaryColor="Blue"
>                                               SecondaryColor="Lime"/>
>                 <!-- 组件默认样式必须合并，否则控件无样式 -->
>                 <ResourceDictionary Source="pack://application:,,,/MaterialDesignThemes.Wpf;component/Themes/MaterialDesign2.Defaults.xaml"/>
>             </ResourceDictionary.MergedDictionaries>
>         </ResourceDictionary>
>     </Application.Resources>
> </Application>
> ```
>
> **MainWindow.xaml —— MaterialDesign 风格控件：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         xmlns:materialDesign="http://materialdesigninxaml.net/winfx/xaml/themes"
>         Title="MaterialDesignInXAML 上位机面板" Height="420" Width="520"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="MaterialDesignInXAML 控件库（NuGet：MaterialDesignThemes）"
>                    Foreground="#58A6FF" FontSize="14" FontWeight="Bold"/>
>         <Grid Grid.Row="1" Margin="0,12,0,0">
>             <Grid.ColumnDefinitions>
>                 <ColumnDefinition Width="*"/>
>                 <ColumnDefinition Width="*"/>
>             </Grid.ColumnDefinitions>
>             <!-- MaterialDesign 卡片 -->
>             <materialDesign:Card Padding="16" Margin="0,0,6,0" UniformCornerRadius="6">
>                 <StackPanel>
>                     <TextBlock Text="设备启停" Foreground="White" FontWeight="Bold" FontSize="15"/>
>                     <TextBlock Text="状态：运行中" x:Name="StateText" Foreground="#238636"
>                                Margin="0,8,0,0"/>
>                     <Button Style="{StaticResource MaterialDesignRaisedButton}"
>                             Content="启动设备" Margin="0,14,0,0" Click="OnStart"/>
>                     <Button Style="{StaticResource MaterialDesignOutlinedButton}"
>                             Content="停止设备" Margin="0,10,0,0" Click="OnStop"/>
>                 </StackPanel>
>             </materialDesign:Card>
>             <!-- MaterialDesign 浮动输入框 + 滑动条 -->
>             <materialDesign:Card Grid.Column="1" Padding="16" Margin="6,0,0,0"
>                                  UniformCornerRadius="6">
>                 <StackPanel>
>                     <TextBlock Text="参数设置" Foreground="White" FontWeight="Bold" FontSize="15"/>
>                     <materialDesign:HintAssist.Hint>
>                         <TextBlock Text="输入温度上限"/>
>                     </materialDesign:HintAssist.Hint>
>                     <TextBox materialDesign:HintAssist.Hint="输入温度上限（℃）"
>                              Text="80" Margin="0,12,0,0" Foreground="White"/>
>                     <TextBlock Text="目标转速" Foreground="#8B949E" Margin="0,16,0,4"/>
>                     <Slider Minimum="0" Maximum="3000" Value="1200" Foreground="#58A6FF"/>
>                 </StackPanel>
>             </materialDesign:Card>
>         </Grid>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow()
>         {
>             InitializeComponent();
>         }
>
>         private void OnStart(object sender, RoutedEventArgs e)
>         {
>             StateText.Text = "状态：运行中";
>             StateText.Foreground = new SolidColorBrush(Color.FromRgb(0x23, 0x86, 0x36));
>         }
>
>         private void OnStop(object sender, RoutedEventArgs e)
>         {
>             StateText.Text = "状态：已停止";
>             StateText.Foreground = new SolidColorBrush(Color.FromRgb(0xDA, 0x36, 0x33));
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
> **Lv.3 融会贯通**：结合前面学过的知识，用"MaterialDesignInXAML"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"MaterialDesignInXAML"
> - → 后续必学：掌握"MaterialDesignInXAML"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
