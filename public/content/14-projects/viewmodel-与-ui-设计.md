---
title: ViewModel 与 UI 设计
section: 14-projects
parent: 14.1 项目一：温湿度监控系统（入门级）
---

# ViewModel 与 UI 设计

> [!plain] 白话理解
> "ViewModel 与 UI 设计"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"ViewModel 与 UI 设计"是一个重要的知识点。把前面学的一切串起来！通过完整的工业级项目，体验真实的上位机开发全流程。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> ViewModel 与 UI 设计是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> ViewModel 与 UI 设计的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：把前面学的一切串起来！通过完整的工业级项目，体验真实的上位机开发全流程。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"ViewModel 与 UI 设计"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

> [!example] 完整示例
> **MVVM 双向绑定演示：定义 TemperatureViewModel（实现 INotifyPropertyChanged），界面通过 Binding 与 ViewModel 属性双向绑定，模拟刷新温度或修改报警上限时，UI 与联动状态文本自动同步：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="ViewModel 与 UI 设计" Height="360" Width="440"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="MVVM：ViewModel 驱动界面" Foreground="#58A6FF" FontSize="14"
>                    FontWeight="Bold" Margin="0,0,0,12"/>
>         <!-- 温度输入：UpdateSourceTrigger=PropertyChanged 实现输入即更新 -->
>         <Grid Grid.Row="1">
>             <Grid.ColumnDefinitions>
>                 <ColumnDefinition Width="90"/>
>                 <ColumnDefinition Width="*"/>
>                 <ColumnDefinition Width="60"/>
>             </Grid.ColumnDefinitions>
>             <TextBlock Text="当前温度" Foreground="#8B949E" VerticalAlignment="Center"/>
>             <TextBox Grid.Column="1" Text="{Binding CurrentTemp, UpdateSourceTrigger=PropertyChanged}"
>                      Background="#161B22" Foreground="#58A6FF" Padding="6"/>
>             <TextBlock Grid.Column="2" Text="℃" Foreground="#8B949E"
>                        VerticalAlignment="Center" Margin="8,0,0,0"/>
>         </Grid>
>         <Grid Grid.Row="2" Margin="0,12,0,0">
>             <Grid.ColumnDefinitions>
>                 <ColumnDefinition Width="90"/>
>                 <ColumnDefinition Width="*"/>
>                 <ColumnDefinition Width="60"/>
>             </Grid.ColumnDefinitions>
>             <TextBlock Text="报警上限" Foreground="#8B949E" VerticalAlignment="Center"/>
>             <TextBox Grid.Column="1" Text="{Binding AlarmLimit, UpdateSourceTrigger=PropertyChanged}"
>                      Background="#161B22" Foreground="#DA3633" Padding="6"/>
>             <TextBlock Grid.Column="2" Text="℃" Foreground="#8B949E"
>                        VerticalAlignment="Center" Margin="8,0,0,0"/>
>         </Grid>
>         <!-- 联动状态：绑定计算属性，任一输入变化自动刷新 -->
>         <Border Grid.Row="3" Background="#161B22" CornerRadius="6" Margin="0,16,0,0" Padding="10">
>             <TextBlock Text="{Binding StateText}" Foreground="#8B949E" TextWrapping="Wrap"/>
>         </Border>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.ComponentModel;
> using System.Runtime.CompilerServices;
> using System.Windows;
> using System.Windows.Threading;
>
> namespace HmiDemo
> {
>     // 1) ViewModel：实现 INotifyPropertyChanged，属性变化自动通知 UI 刷新
>     public class TemperatureViewModel : INotifyPropertyChanged
>     {
>         private string _currentTemp = "25.0";
>         private string _alarmLimit = "28.0";
>
>         public string CurrentTemp
>         {
>             get => _currentTemp;
>             set { _currentTemp = value; OnPropertyChanged(); OnPropertyChanged(nameof(StateText)); }
>         }
>         public string AlarmLimit
>         {
>             get => _alarmLimit;
>             set { _alarmLimit = value; OnPropertyChanged(); OnPropertyChanged(nameof(StateText)); }
>         }
>
>         // 联动计算属性：两个输入任一变化都会触发重新计算
>         public string StateText
>         {
>             get
>             {
>                 if (double.TryParse(CurrentTemp, out double t)
>                     && double.TryParse(AlarmLimit, out double a))
>                     return t > a ? $"当前 {t}℃ 已超过上限 {a}℃ → 触发报警！" : $"温度 {t}℃ 正常";
>                 return "请输入合法的数值";
>             }
>         }
>
>         public event PropertyChangedEventHandler PropertyChanged;
>         private void OnPropertyChanged([CallerMemberName] string name = null)
>             => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
>     }
>
>     public partial class MainWindow : Window
>     {
>         private readonly TemperatureViewModel _vm = new TemperatureViewModel();
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             DataContext = _vm; // 2) 设置 DataContext，XAML 的 Binding 才有数据源
>
>             // 3) 模拟实时采集：每秒刷新温度值，绑定让 UI 自动更新
>             var timer = new DispatcherTimer { Interval = System.TimeSpan.FromSeconds(1) };
>             timer.Tick += (s, e) => _vm.CurrentTemp =
>                 (20 + new System.Random().NextDouble() * 10).ToString("F1");
>             timer.Start();
>         }
>     }
> }
> ```
> 
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
> **Lv.3 融会贯通**：结合前面学过的知识，用"ViewModel 与 UI 设计"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"ViewModel 与 UI 设计"
> - → 后续必学：掌握"ViewModel 与 UI 设计"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
