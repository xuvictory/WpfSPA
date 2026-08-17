---
title: ViewModel 间的通信
section: 07-mvvm
parent: 7.4 ViewModel 层
---

# ViewModel 间的通信

> [!plain] 白话理解
> "ViewModel 间的通信"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"ViewModel 间的通信"是一个重要的知识点。MVVM 是 WPF 开发的黄金标准。学好 MVVM，你的代码将变得清晰、可测试、可维护。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> ViewModel 间的通信是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> ViewModel 间的通信的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：MVVM 是 WPF 开发的黄金标准。学好 MVVM，你的代码将变得清晰、可测试、可维护。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"ViewModel 间的通信"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

> [!example] 完整示例
> **ViewModel 间通信演示：用轻量级事件聚合器（EventAggregator）解耦两个 ViewModel——设备页发布"报警事件"，报警页订阅并实时累加。双方互不引用，只通过消息通信（类似 Prism 的 EventAggregator）：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="ViewModel 间的通信" Height="400" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="10"/>
>             <RowDefinition Height="*"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="通过事件聚合器通信" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>
>         <!-- 左侧：设备页（发布者） -->
>         <Border Grid.Row="1" Background="#161B22" CornerRadius="6" Padding="12">
>             <StackPanel>
>                 <TextBlock Text="设备监控页（发布报警）" Foreground="#8B949E"/>
>                 <TextBlock Text="{Binding DevicePage.AlarmCount}" Foreground="#DA3633"
>                            FontSize="24" FontWeight="Bold" Margin="0,8,0,8"/>
>                 <Button Content="模拟触发一次报警" Command="{Binding DevicePage.TriggerCommand}"
>                         Padding="8" Background="#21262D" Foreground="White"
>                         HorizontalAlignment="Left"/>
>             </StackPanel>
>         </Border>
>
>         <!-- 右侧：报警中心页（订阅者） -->
>         <Border Grid.Row="3" Background="#161B22" CornerRadius="6" Padding="12">
>             <StackPanel>
>                 <TextBlock Text="报警中心页（接收消息）" Foreground="#8B949E"/>
>                 <TextBlock Text="{Binding AlarmPage.TotalText}" Foreground="#238636"
>                            FontSize="20" FontWeight="Bold" Margin="0,8,0,0"/>
>                 <TextBlock Text="{Binding AlarmPage.LatestText}" Foreground="#8B949E"
>                            Margin="0,6,0,0" TextWrapping="Wrap"/>
>             </StackPanel>
>         </Border>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 事件聚合器与两个 ViewModel：**
> ```csharp
> using System;
> using System.ComponentModel;
> using System.Windows;
> using System.Windows.Input;
>
> namespace HmiDemo
> {
>     // 报警消息：事件聚合器中传递的负载
>     public class AlarmMessage
>     {
>         public string Code { get; set; }
>         public string Text { get; set; }
>     }
>
>     // 简易事件聚合器：发布/订阅解耦，任意对象可作为消息
>     public class EventAggregator
>     {
>         private event Action<AlarmMessage> AlarmRaised;
>         public void Subscribe(Action<AlarmMessage> handler) => AlarmRaised += handler;
>         public void Publish(AlarmMessage message) => AlarmRaised?.Invoke(message);
>     }
>
>     public class MainViewModel : INotifyPropertyChanged
>     {
>         public DeviceViewModel DevicePage { get; }
>         public AlarmViewModel AlarmPage { get; }
>
>         // 两个 ViewModel 共享同一个事件聚合器实例
>         public MainViewModel(EventAggregator events)
>         {
>             DevicePage = new DeviceViewModel(events);
>             AlarmPage = new AlarmViewModel(events);
>         }
>
>         public event PropertyChangedEventHandler PropertyChanged;
>     }
>
>     // 发布者：触发报警时 Publish 消息，自己不关心谁订阅
>     public class DeviceViewModel : INotifyPropertyChanged
>     {
>         private readonly EventAggregator _events;
>         private int _alarmCount;
>
>         public DeviceViewModel(EventAggregator events) => _events = events;
>
>         public int AlarmCount { get; private set; }
>         public ICommand TriggerCommand { get; }
>
>         public DeviceViewModel Init()
>         {
>             TriggerCommand = new RelayCommand(() =>
>             {
>                 AlarmCount++;
>                 OnPropertyChanged(nameof(AlarmCount));
>                 _events.Publish(new AlarmMessage { Code = "E-" + (100 + AlarmCount), Text = "检测到设备异常" });
>             });
>             return this;
>         }
>
>         public event PropertyChangedEventHandler PropertyChanged;
>         private void OnPropertyChanged(string name) =>
>             PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
>     }
>
>     // 订阅者：收到消息后更新自己的状态，不直接依赖发布者
>     public class AlarmViewModel : INotifyPropertyChanged
>     {
>         private string _latestText = "暂无报警";
>         private int _total;
>
>         public AlarmViewModel(EventAggregator events)
>         {
>             events.Subscribe(m =>
>             {
>                 _total++;
>                 _latestText = "最新：[" + m.Code + "] " + m.Text;
>                 OnPropertyChanged(nameof(TotalText));
>                 OnPropertyChanged(nameof(LatestText));
>             });
>         }
>
>         public string TotalText => "累计接收报警：" + _total + " 条";
>         public string LatestText { get; private set; }
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
>         public MainWindow()
>         {
>             InitializeComponent();
>             DataContext = new MainViewModel(new EventAggregator());
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
> **Lv.3 融会贯通**：结合前面学过的知识，用"ViewModel 间的通信"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"ViewModel 间的通信"
> - → 后续必学：掌握"ViewModel 间的通信"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
