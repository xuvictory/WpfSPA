---
title: ViewModel 间的通信
section: 07-mvvm
parent: 7.4 ViewModel 层
---

# ViewModel 间的通信

> [!plain] 白话理解
> 车间里两个工位（设备监控页、报警中心页）都要知道"设备出故障了"。最笨的办法是让他们互相认识、直接打电话：`设备VM.报警页VM.AddAlarm()`。可一旦页面增多，人人都存着别人的引用，改一个就要动一串——这就是"紧耦合"。
> 更聪明的做法是配一个"车间广播站"（事件聚合器）：设备页只管喊一嗓子"报警！E-100"，广播站转达，想听的人自己登记收听。**发布者不关心谁在听，订阅者不关心谁在喊**，两个 ViewModel 之间连一个引用都不用留。ViewModel 间通信的核心就是：**用消息代替直连**。

> [!def] 官方定义
> ViewModel 间通信在 WPF 中没有单一官方类，而是三类成熟方案的统称：
> 1. **事件聚合器（Event Aggregator）**：Prism 的 `EventAggregator`/`IEventAggregator` 提供泛型事件（`PubSubEvent<T>`），任意对象可 `Publish`/`Subscribe`，默认在 UI 线程回调；
> 2. **消息机制（Messenger）**：CommunityToolkit.Mvvm 的 `WeakReferenceMessenger`/`IMessenger` 用弱引用管理订阅者，自动解决退订泄漏；
> 3. **显式引用/事件**：VM 直接持有另一 VM 或暴露 `event`，简单场景可用但耦合高。
> 核心要点是**发布/订阅解耦**：双方不互相引用，通过消息对象（如 `AlarmMessage`）传参。
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/communitytoolkit/mvvm/messaging （CommunityToolkit Messenger）

> [!origin] 由来背景
> 早期 WPF 多页面应用里，页面之间传数据最直接的办法就是"互相引用"：登录页把用户对象塞给主页面，报警页把新报警条数 push 给设备页……页面一多，构造链又长又绕，改一个构造函数就得连坐改一片。
> 事件聚合器模式源自观察者模式的工程化变体，由 Prism（微软维护的开源 MVVM 框架）在 2008 年前后随复合应用理念引入 WPF；后来的 CommunityToolkit.Mvvm 又用弱引用做了改进。上位机场景里"设备报警""配方切换""全局急停"这类**一对多、跨页面、双向解耦**的通知，正是它最典型的用武之地。

> [!essentials] 核心要点
> - **消息即契约**：定义强类型消息（`AlarmMessage`），字段即"传什么"；比传 object + 约定字符串更安全、可读
> - **发布端三件事**：① 构造/初始化时拿到聚合器；② 需要时 `Publish(message)`；③ 不关心谁订阅、订阅几个
> - **订阅端三件事**：① 构造时 `Subscribe(handler)`；② handler 里更新自己的状态并 `OnPropertyChanged`；③ 页面销毁时退订（防泄漏）
> - **线程要留意**：事件回调默认在发布线程。上位机里若从采集线程 Publish，订阅者直接改 UI 会抛异常，需 `Dispatcher.Invoke` 切回 UI 线程
> - **通信类型先想清楚**：单向通知（报警广播）用聚合器；需要"一问一答/返回结果"的场景用事件 + 回调或服务更合适
> - **订阅次数与消息匹配**：同一消息类型只有一份订阅名单，重复 Subscribe 会重复收到同一条消息

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
> ✅ 一对多广播：设备报警 → 报警列表页 + 状态栏 + 声音提示同时响应
> ✅ 跨页面状态同步：配方切换成功 → 主控页、参数页、日志页各自刷新
> ✅ 全局指令：急停、复位、切换运行模式——所有相关页面收到后联动
> ✅ 模块解耦：设备 VM 与服务 VM 属于不同功能模块，不希望互相引用
> ❌ 父子页面私有通信：仅父子之间传参，直接属性/命令/事件更简单，不必上聚合器
> ❌ 高频大数据流（如实时波形 1kHz 刷新）：消息机制有过路开销，用共享缓存 + 绑定或 Channel 更合适
> ❌ 需要返回值的"请求-应答"：聚合器是单向广播，不适合；用服务方法或 Task 返回值

> [!pitfall] 常见踩坑
> 坑 1：**订阅了从不退订（内存泄漏）** → 窗口关了订阅还在，消息一来还处理。用 `WeakReferenceMessenger`（弱引用）或手动退订 `Unregister`
>
> 坑 2：**从采集线程直接改订阅者 UI** → 后台线程 Publish 后订阅者立刻更新 TextBlock 会抛"调用线程无法访问此对象"。发布时 `Application.Current.Dispatcher.Invoke`，或订阅者内切线程
>
> 坑 3：**把"请求-应答"硬塞进聚合器** → 想等返回值却发现拿不到，然后靠"临时字段 + 等待"绕弯子。要返回值就改用服务方法直接调用
>
> 坑 4：**消息类型设计成 string/object** → "报警"和"启停"都用一个字符串消息，时间一长没人知道格式。定义强类型消息类，一个消息一个类
>
> 坑 5：**重复 Subscribe 或订阅端异常扩散** → 同一 handler 订两次会重复收消息；某个订阅者 handler 抛异常会中断整条广播链。订阅只在一处（构造时），handler 内 try/catch 隔离

> [!best] 最佳实践
> - **优先 CommunityToolkit 的 `WeakReferenceMessenger`**：弱引用自动防泄漏，是 [ObservableProperty] 时代的官方推荐（见「communitytoolkitmvvm推荐」）；Prism 项目用 `EventAggregator`
> - **消息类放公共层**：消息类型（`AlarmMessage`）定义在共享命名空间，发布/订阅双方都引用它，而不是各自定义
> - **订阅集中注册、集中退订**：构造函数 Subscribe，`Deactivate()`/`Unloaded` 里 Unregister（见「viewmodel-生命周期」）
> - **消息命名带领域语义**：`DeviceAlarmMessage`、`RecipeSwitchedMessage`，避免 `StringMessage` 这种万能筐
> - **发布前判空 + 异常隔离**：handler 抛异常不能影响其他订阅者；每个订阅 handler 内 try/catch
> - **能不走消息就不走消息**：父子传参、单点通知用直接调用；消息机制留给真正跨模块、一对多的场景，避免"魔法总线"满天飞

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，多次点"模拟触发一次报警"，观察左侧报警计数递增、右侧"累计接收报警"与"最新"同步刷新——注意两侧数据来自**不同** ViewModel，全靠消息传递
> **Lv.2 小试牛刀**：新增一个 `StatusBarViewModel`（状态栏）订阅同一 `AlarmMessage`，显示"最近报警时间"；再定义一个 `SystemMessage`（如"配方切换成功"）由设备页发布，报警页不订阅它也能正常运行（验证消息类型隔离）
> **Lv.3 融会贯通**：把发布端改成模拟采集线程（`Task.Run` 定时产生报警），观察订阅者直接改 UI 是否抛异常；用 `Dispatcher.Invoke` 修复，总结"发布线程与 UI 线程"的关系
> **Lv.4 挑战自我**：把示例中的手写 `EventAggregator` 换成 CommunityToolkit 的 `WeakReferenceMessenger`：改造为 `IMessenger.Register<T>` 形式，并验证"窗口关闭后 VM 被 GC 回收、不再收到消息"（弱引用防泄漏的实际验证）

> [!related] 相关知识链接
> - ← 前置知识：[inotifypropertychanged-实现](./inotifypropertychanged-实现.md)（订阅者收到消息后如何通知界面刷新）；[icommand-实现relaycommand-系列](./icommand-实现relaycommand-系列.md)（发布端用命令触发消息）
> - → 后续必学：[viewmodel-生命周期](./viewmodel-生命周期.md)（订阅的注册与退订时机）；[di-在-mvvm-中的应用](./di-在-mvvm-中的应用.md)（聚合器/Messenger 如何由容器管理为单例）
> - ⇄ 关联概念：[数据访问repository-模式](./数据访问repository-模式.md)（服务与 VM 解耦的同族思想）；[command-绑定](./command-绑定.md)（命令按钮如何触发发布）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/communitytoolkit/mvvm/messaging （WeakReferenceMessenger 弱引用消息机制）
