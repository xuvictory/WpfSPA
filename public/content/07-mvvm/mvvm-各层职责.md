---
title: MVVM 各层职责
section: 07-mvvm
parent: 7.1 MVVM 基础概念
---

# MVVM 各层职责

> [!plain] 白话理解
> "MVVM 各层职责"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"MVVM 各层职责"是一个重要的知识点。MVVM 是 WPF 开发的黄金标准。学好 MVVM，你的代码将变得清晰、可测试、可维护。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> MVVM 各层职责是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> MVVM 各层职责的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：MVVM 是 WPF 开发的黄金标准。学好 MVVM，你的代码将变得清晰、可测试、可维护。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"MVVM 各层职责"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

> [!example] 完整示例
> **三层职责演示：Model（设备实体）只管数据，ViewModel（主视图模型）负责状态与命令，View（窗口）纯展示。一台设备的实时数据从 Model 经 ViewModel 流向界面：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="MVVM各层职责 - 设备详情" Height="360" Width="400"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="20">
>         <TextBlock Text="设备详情（View 层）" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <TextBlock Margin="0,15,0,5" Text="设备名称" Foreground="#8B949E"/>
>         <TextBlock Text="{Binding DeviceName}" FontSize="20" Foreground="White" FontWeight="Bold"/>
>         <TextBlock Margin="0,10,0,5" Text="电流（A）" Foreground="#8B949E"/>
>         <TextBlock Text="{Binding CurrentText}" FontSize="20" Foreground="White" FontWeight="Bold"/>
>         <TextBlock Margin="0,10,0,5" Text="运行状态" Foreground="#8B949E"/>
>         <TextBlock Text="{Binding StatusText}" FontSize="16" Foreground="#238636"/>
>         <Button Content="刷新实时数据" Command="{Binding RefreshCommand}" Padding="8"
>                 Margin="0,15,0,0" Background="#21262D" Foreground="White"
>                 HorizontalAlignment="Left"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— Model / ViewModel / View 三层：**
> ```csharp
> using System;
> using System.ComponentModel;
> using System.Windows;
> using System.Windows.Input;
>
> namespace HmiDemo
> {
>     // Model 层：只保存数据，不含任何界面逻辑（可对应数据库或 PLC 采集表）
>     public class DeviceModel
>     {
>         public string Name { get; set; } = "3号注塑机";
>         public double Current { get; set; }       // 电流（安培）
>         public bool IsRunning { get; set; }       // 是否运行
>     }
>
>     // ViewModel 层：从 Model 取数据，加工成界面需要的形态（字符串、颜色等）
>     public class MainViewModel : INotifyPropertyChanged
>     {
>         private readonly DeviceModel _device = new DeviceModel();
>         private string _currentText;
>         private string _statusText;
>
>         public string DeviceName => _device.Name;
>         public string CurrentText { get; private set; }
>         public string StatusText { get; private set; }
>
>         public ICommand RefreshCommand { get; }
>
>         public MainViewModel()
>         {
>             RefreshCommand = new RelayCommand(Refresh);
>             Refresh(); // 启动时先取一次数据
>         }
>
>         private void Refresh()
>         {
>             // 模拟 PLC 采集：更新 Model，再由 Model 驱动界面
>             var rand = new Random();
>             _device.Current = Math.Round(10 + rand.NextDouble() * 20, 1);
>             _device.IsRunning = rand.Next(2) == 1;
>
>             // ViewModel 负责把 Model 数据格式化为界面友好文本
>             CurrentText = _device.Current + " A";
>             StatusText = _device.IsRunning ? "运行中" : "已停机";
>             OnPropertyChanged(nameof(CurrentText));
>             OnPropertyChanged(nameof(StatusText));
>         }
>
>         public event PropertyChangedEventHandler PropertyChanged;
>         private void OnPropertyChanged(string name) =>
>             PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
>     }
>
>     public class RelayCommand : ICommand
>     {
>         private readonly Action _execute;
>         public RelayCommand(Action execute) => _execute = execute;
>         public bool CanExecute(object parameter) => true;
>         public void Execute(object parameter) => _execute();
>         public event EventHandler CanExecuteChanged;
>     }
>
>     // View 层：后台代码只负责把 ViewModel 挂到 DataContext，不做业务
>     public partial class MainWindow : Window
>     {
>         public MainWindow()
>         {
>             InitializeComponent();
>             DataContext = new MainViewModel();
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
> **Lv.3 融会贯通**：结合前面学过的知识，用"MVVM 各层职责"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"MVVM 各层职责"
> - → 后续必学：掌握"MVVM 各层职责"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
