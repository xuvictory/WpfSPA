---
title: ViewModel 生命周期
section: 07-mvvm
parent: 7.4 ViewModel 层
---

# ViewModel 生命周期

> [!plain] 白话理解
> 上位机程序一开就是几个小时、几天，采集定时器、串口订阅、PLC 连接这些"后台物件"如果没人管，就会变成泄漏的资源黑洞。ViewModel 生命周期就是回答两个问题：**界面就绪时 ViewModel 该做什么（激活），界面销毁时它该做什么（释放）。**
> 类比车间值班交接：上班铃响（窗口 Loaded）→ 班长启动巡检（Activate：开定时器、连 PLC）；下班铃响（窗口 Closed）→ 班长按清单关设备（Deactivate：停定时器、解除事件订阅）。**忘做后半段，程序就带着"没人关的设备"一直跑**——这正是上位机"挂机几天就卡死"的常见根源。

> [!def] 官方定义
> WPF/.NET 并没有一个叫 "ViewModel 生命周期" 的官方类——它是 MVVM 实践中的约定：**ViewModel 应随其关联 View 的装载/卸载而被显式地"激活"与"释放"**。
> 标准通道是 View 的 `Loaded` / `Closed`（或 `Unloaded`）事件，由 code-behind（或 Behavior/附加属性）调用 ViewModel 暴露的 `Activate()` / `Deactivate()` 方法；`DispatcherTimer`、事件订阅、串口/PLC 连接等一次性资源在这些钩子中开启与清理。
> 依赖注入容器则负责另一层"对象生命周期"：Transient（每次新建）、Singleton（全局唯一），详见「容器组成与生命周期」。
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/advanced/windows-overview （窗口 Loaded/Closed 事件）

> [!origin] 由来背景
> MVVM 诞生之初，官方示例几乎只强调"绑定"，很少谈资源清理——因为早期 WPF 窗口大多是"打开-操作-关闭"，进程退出时系统会回收一切。但上位机场景完全不同：**主窗口常驻数天，后台定时器、事件订阅、串口连接只要不显式释放就永远活着**，而事件订阅形成的强引用链恰恰是 GC 最无能为力的部分。
> 于是社区在实践中沉淀出约定：把"界面就绪"与"界面销毁"作为 ViewModel 的钩子点。Prism 的 `INavigationAware`（导航进入/离开）、ReactiveUI 的 `WhenActivated`、CommunityToolkit 导航服务等都围绕同一问题展开。与其说是框架特性，不如说是**长期运行桌面应用逼出来的资源管理纪律**。

> [!essentials] 核心要点
> - **两个钩子定生死**：`Activate()`（View Loaded 时开启资源）与 `Deactivate()`（View Closed 时释放资源），由 code-behind 或 Behavior 调用，ViewModel 不自作主张
> - **事件订阅必须成对**：`timer.Tick += OnTick` 与 `-= OnTick` 配对；外部对象事件（如 PLC 客户端 `DataReceived`）同样要退订，否则 ViewModel 被事件源强引用、永不回收
> - **定时器/后台任务归 Activate 管**：窗口没加载就别启动采集；窗口关了必须停——示例的 `DispatcherTimer` 只在 `Activate()` 之后运行
> - **区分两类"生命周期"**：① 资源生命周期（本主题，Activate/Deactivate）；② 对象生命周期（DI 容器的 Transient/Singleton，见「容器组成与生命周期」）
> - **多窗口共用 ViewModel 时小心**：同一个 VM 实例被两个 View 共用，关一个窗不能贸然 Deactivate，需引用计数或改为"一窗一 VM"

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
> ✅ 后台轮询型页面：采集定时器、心跳报文——窗口打开才启动、关闭即停止
> ✅ 持有串口/网口/PLC 连接的窗口：连接在 Activate 建立、Deactivate 关闭，避免连接泄漏
> ✅ 订阅了外部对象事件的页面：如设备状态变化事件，离开页面必须退订
> ✅ 多窗口导航应用：离开的 ViewModel 释放、进入的激活（Prism `INavigationAware`、CommunityToolkit `NavigationService` 均提供钩子）
> ❌ 无资源的一次性展示页：纯属性展示、无定时器无订阅，不必强行实现生命周期接口
> ❌ 全局单例 ViewModel（如主控台）：生命周期跟随进程，不随单个窗口开关走

> [!pitfall] 常见踩坑
> 坑 1：**只 Activate 不 Deactivate** → 定时器/订阅留着，窗口关了还在跑。后果：上位机挂机一天后内存暴涨、串口"被占用"打不开。凡在 Activate 里开的，Deactivate 里必须关
>
> 坑 2：**事件订阅后退订（内存泄漏主凶）** → ViewModel 订阅了 `serialPort.DataReceived` 后窗口关闭，若串口对象活得比 VM 久，VM 被事件源强引用，GC 永远收不掉。成对写 `+=` / `-=`，或用 `WeakEventManager`
>
> 坑 3：**在构造函数里启动定时器/连 PLC** → 构造函数只做字段初始化；窗口未加载就启动采集，用户还没看到界面资源已占上。启动逻辑放 Activate
>
> 坑 4：**Deactivate 里访问已销毁的 UI 元素** → 关窗时序中 `DispatcherTimer` 的 Tick 可能已排队触发；先停定时器再清理，或检查 `IsLoaded`/`Dispatcher.CheckAccess()`
>
> 坑 5：**多窗口共用 VM 实例时误 Deactivate** → 关 A 窗把共用的 VM 释放了，B 窗还在用。按引用计数释放，或一窗一 VM（最常见）

> [!best] 最佳实践
> - **显式命名生命周期方法**：`Activate()` / `Deactivate()` 比 `OnLoad()` 语义更清晰，且不依赖 XAML 事件名，便于单元测试直接调用
> - **统一钩子入口**：code-behind 只写一行 `Loaded += (_, _) => _vm.Activate()`，或抽成 Behavior/附加属性，避免每个窗口复制粘贴
> - **订阅与退订顺序相反**：按"后进先出"释放；多个订阅分组注释，Deactivate 里逐条清理，必要时留空实现防漏
> - **资源型 ViewModel 实现 `IDisposable`**：Deactivate 里调 `Dispose()`，与 using 和 DI 容器释放配合（见「容器组成与生命周期」）
> - **长驻后台逻辑下沉到服务**：采集/心跳属于服务职责，ViewModel 只调 `service.Start()/Stop()`——生命周期方法保持薄薄一层（见「数据访问repository-模式」）
> - **导航型框架用自带钩子**：Prism `INavigationAware`、CommunityToolkit `INavigationAware` 比手写 Loaded/Closed 更贴合页面栈

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，观察液位数值每秒跳动；点"暂停/继续"看状态切换；关闭窗口后再重开，注意 `LifecycleText` 面板记录的 Activate/Deactivate 调用顺序
> **Lv.2 小试牛刀**：给示例加一个"设备心跳"：Activate 里启动第二个定时器每 3 秒更新 `HeartbeatText`（如 "心跳 #12 @ 14:03:22"），Deactivate 里停掉它；故意不 Deactivate 关闭窗口，用 `Debug.WriteLine` 验证心跳是否还在后台继续
> **Lv.3 融会贯通**：为设备监控页面接入模拟串口：Activate 打开并订阅 `DataReceived`，Deactivate 退订并关闭；反复开关窗口 10 次，用 `GC.GetTotalMemory` 或串口句柄数验证资源是否被正确释放
> **Lv.4 挑战自我**：把生命周期钩子抽象成 `ILifecycleAware` 接口（`void Activate(); void Deactivate();`），写一个 `ViewModelLocator` 在窗口 Loaded/Closed 时自动查找并调用，让窗口 code-behind 只剩 `InitializeComponent()`

> [!related] 相关知识链接
> - ← 前置知识：[datacontext-绑定到-viewmodel](./datacontext-绑定到-viewmodel.md)（View 与 ViewModel 如何挂接）；[icommand-实现relaycommand-系列](./icommand-实现relaycommand-系列.md)（命令在 Activate/Deactivate 间如何被启用/禁用）
> - → 后续必学：[容器组成与生命周期](./容器组成与生命周期.md)（DI 容器的 Transient/Singleton 对象生命周期与 Dispose）；[viewmodel-间的通信](./viewmodel-间的通信.md)（关闭窗口时向其他页面发"数据已保存"通知）
> - ⇄ 关联概念：[数据验证逻辑](./数据验证逻辑.md)（关闭/保存前的最后校验）；[导航服务实现](./导航服务实现.md)（页面导航场景的生命周期钩子）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/advanced/windows-overview （窗口 Loaded/Closed 事件）
