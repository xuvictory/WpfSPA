---
title: 什么是 MVVM？
section: 07-mvvm
parent: 7.1 MVVM 基础概念
---

# 什么是 MVVM？

> [!plain] 白话理解
> 想象一个锅炉温度监控窗口：界面上要显示温度数字、状态文字和"重新采集"按钮；点按钮后要读取温度并判断是否超温。如果不分层，你会在按钮的 Click 事件里直接写"读数据→改 TextBox 的 Text→改状态标签颜色"，界面和逻辑糊在一起，改一处牵动一片。
> MVVM 把这件事拆成三份：**View**（XAML）只负责"长什么样"，**ViewModel** 负责"按钮点了干什么、温度怎么判断"，**Model** 负责"温度数据本身"。View 通过数据绑定和命令自动"订阅" ViewModel，逻辑层完全不认识 TextBox 是谁。要改界面只动 View，要改规则只动 ViewModel，互不连累。

> [!def] 官方定义
> MVVM（Model-View-ViewModel，模型-视图-视图模型）是一种**界面架构模式**，由微软架构师 John Gossman 于 2005 年为 XAML 技术栈（WPF/Silverlight）提出。它不是控件、也不是类库，而是一套分层协作的职责划分约定：
> - **Model（模型）**：业务领域数据与规则（如温度值、报警阈值、换算公式），与界面无关；
> - **View（视图）**：XAML 界面，负责展示数据与收集输入，后台代码尽量只保留 `DataContext` 赋值；
> - **ViewModel（视图模型）**：View 的状态与行为模型，暴露可绑定属性（配合 `INotifyPropertyChanged`）和命令（`ICommand`），让 View 与业务逻辑彻底解耦。
> 官方资料：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/data/

> [!origin] 由来背景
> 在 WinForms 时代，界面逻辑的常规写法是直接在按钮事件里操作控件对象（`txtTemp.Text = "..."`、`btnStart.Enabled = ...`），界面与业务强耦合，难以测试、难以复用。WPF 引入强大的数据绑定（`{Binding}`）、命令（`ICommand`）和依赖属性体系后，微软希望把"界面状态"从控件对象身上剥离开，于是 John Gossman 在 2005 年提出 MVVM：让 ViewModel 成为"不依赖控件的窗口大脑"。这套模式随后在 Silverlight、Windows Phone 时代被大量验证，如今配合 CommunityToolkit.Mvvm 已是 WPF 上位机开发的事实标准。

> [!essentials] 核心要点
> - **单向依赖**：View → ViewModel → Model 单向引用，反向引用即为耦合，三层职责不越界
> - **数据绑定**：View 用 `{Binding 属性名}` 读取 ViewModel 属性，属性变更依赖 `INotifyPropertyChanged` 事件通知刷新
> - **命令封装**：用户操作绑定到 `ICommand`（如 RelayCommand），View 后台代码不再写 `Click` 事件
> - **DataContext 桥接**：View 通过 `DataContext` 拿到 ViewModel 实例，一个 ViewModel 可被多个 View 复用
> - **可测试性**：ViewModel 不引用任何控件类型，可用单元测试直接驱动属性和命令

> [!example] 完整示例
> **最小 MVVM 演示：锅炉温度监控。View 通过 DataContext 绑定到 ViewModel，ViewModel 持有数据与命令，点击"重新采集"更新温度：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="什么是MVVM - 温度监控" Height="320" Width="380"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="20">
>         <TextBlock Text="锅炉温度实时监控" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <!-- View 通过 {Binding} 读取 ViewModel 中的属性，无需写一行控件赋值代码 -->
>         <TextBlock Margin="0,15,0,5" Text="当前温度（℃）" Foreground="#8B949E"/>
>         <TextBlock Text="{Binding Temperature}" FontSize="30" Foreground="White" FontWeight="Bold"/>
>         <TextBlock Text="{Binding Status}" Foreground="#238636" Margin="0,5,0,15"/>
>         <!-- 动作通过 Command 绑定到 ViewModel 中的命令对象 -->
>         <Button Content="重新采集" Command="{Binding RefreshCommand}" Padding="8"
>                 Background="#21262D" Foreground="White" HorizontalAlignment="Left"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— ViewModel 与 View：**
> ```csharp
> using System;
> using System.ComponentModel;
> using System.Windows;
> using System.Windows.Input;
>
> namespace HmiDemo
> {
>     // ViewModel：承载业务状态与命令，完全不依赖界面控件，可独立单元测试
>     public class MainViewModel : INotifyPropertyChanged
>     {
>         private double _temperature;
>         private string _status = "等待采集";
>
>         public double Temperature
>         {
>             get => _temperature;
>             set { _temperature = value; OnPropertyChanged(nameof(Temperature)); }
>         }
>
>         public string Status
>         {
>             get => _status;
>             set { _status = value; OnPropertyChanged(nameof(Status)); }
>         }
>
>         public ICommand RefreshCommand { get; }
>
>         public MainViewModel()
>         {
>             RefreshCommand = new RelayCommand(Refresh);
>         }
>
>         private void Refresh()
>         {
>             var rand = new Random();
>             Temperature = Math.Round(80 + rand.NextDouble() * 40, 1); // 模拟 PLC 上报温度
>             Status = Temperature > 110 ? "温度过高，请检查冷却系统" : "采集正常";
>         }
>
>         public event PropertyChangedEventHandler PropertyChanged;
>         private void OnPropertyChanged(string name) =>
>             PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
>     }
>
>     // 简化版 ICommand 实现（RelayCommand），生产环境可引入 CommunityToolkit.Mvvm
>     public class RelayCommand : ICommand
>     {
>         private readonly Action _execute;
>         public RelayCommand(Action execute) => _execute = execute;
>         public bool CanExecute(object parameter) => true;
>         public void Execute(object parameter) => _execute();
>         public event EventHandler CanExecuteChanged;
>     }
>
>     // View：只负责界面展示，后台代码仅设置一次 DataContext
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
> ✅ 界面与业务逻辑都较复杂的上位机软件：多页面、多状态、多参数（监控看板、设备控制台）
> ✅ 需要自动化单元测试的工业项目：数据校验、报警判断、换算逻辑可脱离界面测试
> ✅ 多人协作项目：UI 设计师改 XAML、开发人员写 ViewModel，以"属性+命令"为接口约定，互不阻塞
> ✅ 需要界面复用的系统：同一份数据可用列表、曲线、仪表三种 View 呈现
> ❌ 单窗口、逻辑极简的工具（如一个只读串口状态指示），强行 MVVM 会引入大量样板代码
> ❌ 无数据绑定能力、强控件耦合的第三方 UI 方案，此时 MVVM 收益很低

> [!pitfall] 常见踩坑
> 坑 1：**ViewModel 忘了实现 `INotifyPropertyChanged`** → 属性改了界面纹丝不动。检查类是否实现该接口、setter 里是否真的调用了 `PropertyChanged`
>
> 坑 2：**把控件对象塞进 ViewModel**（如直接持有 `TextBox` 引用）→ 无法单元测试、耦合回退，MVVM 名存实亡。ViewModel 只暴露数据与命令，不暴露控件
>
> 坑 3：**绑定路径拼写错误** → 不报编译错误，运行时界面静默空白。用 `nameof()` 写绑定来源，或用 `PresentationTraceSources.TraceLevel=High` 在输出窗口跟踪绑定
>
> 坑 4：**后台线程直接改绑定属性** → 串口/采集线程更新属性触发界面刷新时抛"调用线程无法访问此对象"。把修改调度到 UI 线程（`Dispatcher.Invoke`）

> [!best] 最佳实践
> - ViewModel 的 `PropertyChanged` 用 `nameof(属性名)` 传参，属性重命名后自动同步，杜绝魔法字符串
> - 生产项目直接使用 `CommunityToolkit.Mvvm` 的 `[ObservableProperty]`、`[RelayCommand]` 源生成器，手写样板代码可减少约 90%
> - 一个窗口对应一个职责单一的 ViewModel，不做"万能大管家"；复杂页面可拆子 ViewModel 组合
> - View 后台代码尽量只留 `InitializeComponent()` 和 `DataContext` 赋值（或用 ViewModelLocator / 依赖注入创建）
> - 异步采集用 `async/await` 写进命令，配合 `IsBusy` 状态属性禁用按钮，避免界面假死与重复点击

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，把 XAML 中按钮的 `Command="{Binding RefreshCommand}"` 临时改成 `Click="Btn_Click"` 并在后台代码操作 TextBox，对比两种写法，体会耦合差异
> **Lv.2 小试牛刀**：给 `MainViewModel` 加一个"采集间隔"（double）属性和对应 `TextBox` 绑定，做到输入即改、即时显示
> **Lv.3 融会贯通**：把"重新采集"改为异步命令——用 `Task.Run` 模拟 500ms 读取延迟，期间以 `IsBusy` 禁用按钮，完成后更新温度
> **Lv.4 挑战**：拆出 `TemperatureModel`（含温度、阈值与超温判断），让 ViewModel 引用它，画出三层依赖关系，验证 ViewModel 可脱离界面单独测试

> [!related] 相关知识链接
> - ← 前置知识：`{Binding}` 与 `DataContext` 见第 5 章「什么是数据绑定」「datacontext-数据上下文」
> - → 后续必学：「mvvm-各层职责」深入三层分工；「为什么要用-mvvm」看对比论证
> - ⇄ 关联概念：「inotifypropertychanged-实现」「icommand-实现relaycommand-系列」是本模式的两大技术支柱
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/data/
