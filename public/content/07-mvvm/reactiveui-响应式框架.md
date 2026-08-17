---
title: ReactiveUI 响应式框架
section: 07-mvvm
parent: 7.5 主流 MVVM 框架
---

# ReactiveUI 响应式框架

> [!plain] 白话理解
> 传统 MVVM 是"拉"：数据变了，界面还要靠 `PropertyChanged` 逐个通知刷新。**ReactiveUI 是"推"**：把属性、命令、事件都变成"数据流"，用 LINQ 风格的操作符组合处理——温度一变，偏差自动算好、界面自动刷新，中间不用手写一行"if 变了就通知谁"。
> 类比产线传送带：普通绑定是一段一段人工搬运（每个环节都要手动接）；响应式是一条**自动传送带**，物料放上去，一路自动筛选、变换、最终落到目的地。设备温度、压力这类实时高频数据，正是响应式流的天然场景。

> [!def] 官方定义
> ReactiveUI 是一个**基于 Rx（Reactive Extensions，`System.Reactive`）的跨平台 MVVM 框架**（支持 WPF / Xamarin.Forms / MAUI / Avalonia），核心 API：
> - `ReactiveObject`：VM 基类，`RaiseAndSetIfChanged` 设置属性并自动通知
> - `WhenAnyValue`：把多个属性变化组合成 `IObservable<T>` 流
> - `ReactiveCommand`：`ICommand` 与 `IObservable` 结合（`CreateFromTask` 处理异步、`CanExecute` 来自可观察值）
> - `RxApp.MainThreadScheduler`：UI 线程调度器
> - `WhenActivated`：视图激活时管理订阅生命周期（配合 `DisposeWith`）
> 官网文档：https://www.reactiveui.net/

> [!origin] 由来背景
> 2009 年起微软 Rx 团队发布 **Reactive Extensions for .NET**（`System.Reactive`），让 .NET 拥有"以流为中心"的异步编程能力。ReactiveUI 由 Paul Betts（GitHub 早期创始人之一）于 2010 年发起，把 Rx 与 MVVM 结合，定位是"**函数式响应式 MVVM**"：属性变化从"事件通知"升级为"可组合的数据流"。
> 上位机场景与响应式高度契合：传感器高频采样、多条件联动计算、异步下发命令——用传统回调写法，状态一多就乱；用 `WhenAnyValue` + `Throttle` + `DistinctUntilChanged` 等操作符，复杂联动变成几行声明式代码。因此 ReactiveUI 成为实时数据驱动的 WPF 项目的热门框架。

> [!essentials] 核心要点
> - **一切皆流**：属性、命令、事件都表示为 `IObservable<T>`，可用 `Select/Where/Throttle/DistinctUntilChanged` 组合
> - **`WhenAnyValue` 声明式联动**：`this.WhenAnyValue(x => x.TargetTemp, x => x.ActualTemp, (t, a) => t - a)` 把多个属性变化"合流"重算
> - **`ReactiveCommand`**：异步命令（`CreateFromTask`）、自动禁用（`CanExecute` 来自可观察值）、异常处理（`ThrownExceptions`）
> - **UI 线程纪律**：流里产生的结果要用 `ObserveOn(RxApp.MainThreadScheduler)` 切回主线程再更新绑定
> - **订阅要释放**：用 `WhenActivated` + `DisposeWith` 管理订阅生命周期，防内存泄漏
> - **VM 继承 `ReactiveObject`**：属性用 `RaiseAndSetIfChanged`，省去手写 `OnPropertyChanged`

> [!example] 完整示例
> **ReactiveUI 风格演示：用事件流（IObservable + 订阅）实现"当目标温度变化时自动计算偏差并刷新"，体现响应式编程思路（生产环境请使用 ReactiveUI 的 WhenAnyValue / ReactiveCommand）：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="ReactiveUI 响应式框架" Height="380" Width="440"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="20">
>         <TextBlock Text="恒温箱温度控制（响应式）" Foreground="#58A6FF"
>                    FontSize="16" FontWeight="Bold"/>
>         <TextBlock Text="目标温度（℃）" Foreground="#8B949E" Margin="0,15,0,4"/>
>         <Slider Minimum="20" Maximum="120" Value="{Binding TargetTemp}" Margin="0,4"/>
>         <TextBlock Text="{Binding TargetTempText}" Foreground="White" FontSize="20"
>                    FontWeight="Bold" HorizontalAlignment="Center"/>
>         <TextBlock Text="实际温度（℃）" Foreground="#8B949E" Margin="0,15,0,4"/>
>         <Slider Minimum="20" Maximum="120" Value="{Binding ActualTemp}" Margin="0,4"/>
>         <TextBlock Text="{Binding ActualTempText}" Foreground="White" FontSize="20"
>                    FontWeight="Bold" HorizontalAlignment="Center"/>
>         <Border Background="#161B22" CornerRadius="4" Padding="10" Margin="0,15,0,0">
>             <TextBlock Text="{Binding DeviationText}" Foreground="#58A6FF"
>                        FontSize="14" TextWrapping="Wrap"/>
>         </Border>
>         <TextBlock Text="{Binding Hint}" Foreground="#8B949E" FontSize="12" Margin="0,8,0,0"
>                    TextWrapping="Wrap"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 事件流驱动界面更新：**
> ```csharp
> using System;
> using System.ComponentModel;
> using System.Windows;
>
> namespace HmiDemo
> {
>     // 简易事件流：类似 IObservable<T>，订阅者收到每次属性变化通知
>     public class PropertyStream<T>
>     {
>         public event Action<T> Changed;
>         public void Publish(T value) => Changed?.Invoke(value);
>         public IDisposable Subscribe(Action<T> handler)
>         {
>             Changed += handler;
>             return new Subscription(() => Changed -= handler);
>         }
>         private class Subscription : IDisposable
>         {
>             private readonly Action _unsubscribe;
>             public Subscription(Action un) => _unsubscribe = un;
>             public void Dispose() => _unsubscribe();
>         }
>     }
>
>     public class MainViewModel : INotifyPropertyChanged
>     {
>         private double _targetTemp = 60;
>         private double _actualTemp = 48;
>         private string _deviationText = "等待计算…";
>
>         // 事件流：目标温度每变化一次，发布一个值
>         private readonly PropertyStream<double> _targetStream = new PropertyStream<double>();
>
>         public MainViewModel()
>         {
>             // 响应式核心：订阅"目标温度变化"流，自动重算偏差（ReactiveUI 用 WhenAnyValue）
>             _targetStream.Subscribe(_ =>
>             {
>                 var deviation = (int)(_targetTemp - _actualTemp);
>                 DeviationText = "温度偏差：" + deviation + " ℃" +
>                     (Math.Abs(deviation) > 10 ? "（偏差过大，请检查加热）" : "（控制正常）");
>                 OnPropertyChanged(nameof(DeviationText));
>             });
>         }
>
>         public double TargetTemp
>         {
>             get => _targetTemp;
>             set
>             {
>                 _targetTemp = value;
>                 OnPropertyChanged(nameof(TargetTemp));
>                 OnPropertyChanged(nameof(TargetTempText));
>                 _targetStream.Publish(value); // 发布事件
>             }
>         }
>
>         public double ActualTemp
>         {
>             get => _actualTemp;
>             set
>             {
>                 _actualTemp = value;
>                 OnPropertyChanged(nameof(ActualTemp));
>                 OnPropertyChanged(nameof(ActualTempText));
>             }
>         }
>
>         public string TargetTempText => (int)TargetTemp + " ℃";
>         public string ActualTempText => (int)ActualTemp + " ℃";
>         public string DeviationText { get; private set; }
>         public string Hint => "目标温度变化触发事件流，偏差自动重算——这就是响应式编程的核心思想";
>
>         public event PropertyChangedEventHandler PropertyChanged;
>         private void OnPropertyChanged(string name) =>
>             PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
>     }
>
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
> ✅ **实时数据流界面**：温度、压力、产量高频刷新，用 `Throttle` 防抖、`DistinctUntilChanged` 去重
> ✅ **属性间复杂联动**：目标温度 × 实际温度 → 偏差 → 报警级别，`WhenAnyValue` 声明式组合
> ✅ **异步命令 + 进度反馈**：下发配方、启停设备，`ReactiveCommand.CreateFromTask` 管理执行状态
> ✅ **需要精细控制 UI 更新频率**：高频采样节流到界面可接受频率
> ❌ 静态展示型页面：ReactiveUI 学习曲线陡、样板多，杀鸡用牛刀
> ❌ 团队不熟悉 Rx 的项目：响应式代码难调试，维护成本高于收益

> [!pitfall] 常见踩坑
> 坑 1：**订阅忘记释放导致内存泄漏/重复触发** → 现象：切页面再回来，某命令执行两次、日志重复；原因：订阅的 `IDisposable` 没在 VM 销毁时释放；解决：用 `WhenActivated` + `DisposeWith()` 把订阅绑定到视图生命周期
>
> 坑 2：**后台线程更新 UI 崩溃** → 现象：流在采集线程发布值，界面更新抛 `InvalidOperationException: 调用线程无法访问此对象`；原因：没有切回 UI 线程；解决：链路上加 `ObserveOn(RxApp.MainThreadScheduler)` 再更新绑定属性
>
> 坑 3：**`WhenAnyValue` 监听属性不触发** → 现象：`WhenAnyValue(x => x.TargetTemp)` 永不推送；原因：VM 没继承 `ReactiveObject`，属性没用 `RaiseAndSetIfChanged`，`WhenAnyValue` 只能监听实现了 `INotifyPropertyChanged` 的属性；解决：VM 继承 `ReactiveObject`，属性一律用 `RaiseAndSetIfChanged` 赋值

> [!best] 最佳实践
> - **VM 统一继承 `ReactiveObject`**：属性用 `RaiseAndSetIfChanged`（`SetProperty`），省去手写 `OnPropertyChanged`
> - **复杂联动交给 `WhenAnyValue`**：多属性合流计算用声明式管道，别在 setter 里塞逻辑
> - **异步命令用 `CreateFromTask`**：自动处理 `CanExecute` 禁用与 `ThrownExceptions` 异常流，UI 不用管 loading
> - **订阅生命周期统一管理**：`WhenActivated` + `DisposeWith`，一个页面一套订阅，离开即释放
> - **UI 线程切回**：链路末尾统一 `ObserveOn(RxApp.MainThreadScheduler)`，界面更新绝不跨线程
> - **高频数据先节流**：`Throttle(TimeSpan.FromMilliseconds(200))` 在源头降频，避免界面重绘风暴

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，拖动"目标温度"滑杆观察偏差文本自动更新；把 `_targetStream.Publish(value)` 那行注释掉再拖动，体会"没有流就没有联动"
> **Lv.2 小试牛刀**：让"实际温度"也发布事件流，订阅两个流（或合并后）都触发偏差重算——模拟 `WhenAnyValue(x => x.TargetTemp, x => x.ActualTemp)`
> **Lv.3 融会贯通**：给目标温度流加"防抖"：把 `Subscribe` 改成"停止拖动 300ms 后才计算"（模拟 `Throttle`，可加一个 `Timer` 延迟），再验证效果
> **Lv.4 拆层挑战**：引入真实 ReactiveUI NuGet 包：`MainViewModel` 继承 `ReactiveObject`、属性用 `RaiseAndSetIfChanged`、`WhenAnyValue` 计算偏差、`ReactiveCommand.CreateFromTask` 做"下发温度"按钮，对比框架版与手写事件流的差异

> [!related] 相关知识链接
> - ← 前置知识：[什么是-mvvm](./什么是-mvvm.md)（MVVM 基础）；[inotifypropertychanged-实现](./inotifypropertychanged-实现.md)（`RaiseAndSetIfChanged` 的底层机制）；[icommand-实现relaycommand-系列](./icommand-实现relaycommand-系列.md)（`ReactiveCommand` 的对应物）
> - → 后续必学：掌握响应式后，回到工程化：学习 [数据访问repository-模式](./数据访问repository-模式.md) 与 [日志服务集成](./日志服务集成.md)
> - ⇄ 关联概念：[prism-企业级框架](./prism-企业级框架.md)（另一套框架选型对比）；[communitytoolkitmvvm推荐](./communitytoolkitmvvm推荐.md)（轻量方案对比）；[mvvm-light-toolkit](./mvvm-light-toolkit.md)
> - 📖 官方文档：[ReactiveUI 官网](https://www.reactiveui.net/) ；[System.Reactive (Rx.NET)](https://github.com/dotnet/reactive)
