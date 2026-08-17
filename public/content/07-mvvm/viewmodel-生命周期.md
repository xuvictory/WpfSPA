---
title: ViewModel 生命周期
section: 07-mvvm
parent: 7.4 ViewModel 层
---

# ViewModel 生命周期

> [!plain] 白话理解
> "ViewModel 生命周期"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"ViewModel 生命周期"是一个重要的知识点。MVVM 是 WPF 开发的黄金标准。学好 MVVM，你的代码将变得清晰、可测试、可维护。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> ViewModel 生命周期是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> ViewModel 生命周期的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：MVVM 是 WPF 开发的黄金标准。学好 MVVM，你的代码将变得清晰、可测试、可维护。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"ViewModel 生命周期"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

> [!example] 完整示例
> **ViewModel 生命周期演示：窗口加载时 View 通知 ViewModel"激活"（启动采集定时器），窗口关闭时通知"释放"（停止定时器、解除事件订阅），防止资源泄漏：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="ViewModel 生命周期" Height="360" Width="420"
>         WindowStartupLocation="CenterScreen" Background="#0D1117"
>         Loaded="OnWindowLoaded" Closed="OnWindowClosed">
>     <StackPanel Margin="20">
>         <TextBlock Text="设备采集（生命周期管理）" Foreground="#58A6FF"
>                    FontSize="16" FontWeight="Bold"/>
>         <TextBlock Text="当前液位（%）" Foreground="#8B949E" Margin="0,15,0,4"/>
>         <TextBlock Text="{Binding LevelText}" Foreground="White" FontSize="28" FontWeight="Bold"/>
>         <TextBlock Text="{Binding StateText}" Foreground="#238636" Margin="0,5,0,15"/>
>         <Button Content="暂停/继续采集" Command="{Binding PauseCommand}" Padding="8"
>                 Background="#21262D" Foreground="White" HorizontalAlignment="Left"/>
>         <Border Background="#161B22" CornerRadius="4" Padding="8" Margin="0,15,0,0">
>             <TextBlock Text="{Binding LifecycleText}" Foreground="#8B949E"
>                        FontFamily="Consolas" FontSize="12" TextWrapping="Wrap"/>
>         </Border>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 生命周期钩子实现：**
> ```csharp
> using System;
> using System.ComponentModel;
> using System.Windows;
> using System.Windows.Input;
> using System.Windows.Threading;
>
> namespace HmiDemo
> {
>     public class MainViewModel : INotifyPropertyChanged
>     {
>         private readonly DispatcherTimer _timer;
>         private readonly Random _rand = new Random();
>         private bool _paused;
>         private int _level;
>         private string _stateText = "未激活";
>         private string _lifecycleText = "";
>
>         public MainViewModel()
>         {
>             // 定时器仅在"激活"期间运行
>             _timer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1) };
>             _timer.Tick += OnTick;
>             PauseCommand = new RelayCommand(TogglePause);
>         }
>
>         // ── 生命周期：激活（View 加载完成时由后台代码调用）──
>         public void Activate()
>         {
>             _paused = false;
>             _timer.Start();
>             _stateText = "采集运行中";
>             AppendLifecycle("Activate() 已调用：定时器启动");
>             OnPropertyChanged(nameof(StateText));
>         }
>
>         // ── 生命周期：释放（窗口关闭时调用，清理定时器与事件）──
>         public void Deactivate()
>         {
>             _timer.Stop();
>             _timer.Tick -= OnTick;      // 解除订阅，避免内存泄漏
>             _stateText = "已释放";
>             AppendLifecycle("Deactivate() 已调用：定时器停止、事件解除");
>             OnPropertyChanged(nameof(StateText));
>         }
>
>         private void OnTick(object sender, EventArgs e)
>         {
>             if (_paused) return;
>             _level = _rand.Next(30, 90);
>             OnPropertyChanged(nameof(LevelText));
>         }
>
>         private void TogglePause()
>         {
>             _paused = !_paused;
>             _stateText = _paused ? "采集已暂停" : "采集运行中";
>             AppendLifecycle(_paused ? "用户暂停采集" : "用户恢复采集");
>             OnPropertyChanged(nameof(StateText));
>         }
>
>         public string LevelText => _level + " %";
>         public string StateText { get; private set; }
>         public string LifecycleText { get; private set; }
>         public ICommand PauseCommand { get; }
>
>         private void AppendLifecycle(string line)
>         {
>             LifecycleText += "· " + line + "\n";
>             OnPropertyChanged(nameof(LifecycleText));
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
>     public partial class MainWindow : Window
>     {
>         private readonly MainViewModel _vm;
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             _vm = new MainViewModel();
>             DataContext = _vm;
>         }
>
>         // View 通知 ViewModel：界面已就绪，可开始工作
>         private void OnWindowLoaded(object sender, RoutedEventArgs e) => _vm.Activate();
>
>         // View 通知 ViewModel：界面即将销毁，释放资源
>         private void OnWindowClosed(object sender, EventArgs e) => _vm.Deactivate();
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
> **Lv.3 融会贯通**：结合前面学过的知识，用"ViewModel 生命周期"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"ViewModel 生命周期"
> - → 后续必学：掌握"ViewModel 生命周期"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
