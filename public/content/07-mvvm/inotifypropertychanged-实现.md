---
title: INotifyPropertyChanged 实现
section: 07-mvvm
parent: 7.4 ViewModel 层
---

# INotifyPropertyChanged 实现

> [!plain] 白话理解
> 界面上显示"当前压力 7.2 MPa"，背后是 ViewModel 的 `_pressure` 字段。问题来了：**数据变了，界面怎么知道？** 绑定只是"接线"，不会自动"刷新"。
> `INotifyPropertyChanged` 就是 ViewModel 向界面喊话的喇叭：**"我变了，请刷新！"** 每次属性更新后调 `OnPropertyChanged(nameof(PressureText))`，WPF 收到通知就重新读一次该属性并更新界面。
> 类比车间：值班员（VM）每改一次登记表（属性），就按一次铃（`PropertyChanged` 事件），中控室（View）听到铃就重新抄一遍那块屏。**不按铃，屏上永远是旧值**——这是新手调试"界面不刷新"时最常撞的墙。

> [!def] 官方定义
> `INotifyPropertyChanged` 是 `System.ComponentModel` 命名空间下的 .NET 官方接口，WPF 数据绑定引擎依赖它实现"属性变更通知"：
> ```csharp
> public interface INotifyPropertyChanged
> {
>     event PropertyChangedEventHandler PropertyChanged;
> }
> ```
> 约定：实现类在属性值变更后必须触发 `PropertyChanged` 事件，事件参数 `PropertyChangedEventArgs.PropertyName` 指明是哪个属性变了（用 `nameof()` 传递可避免魔法字符串）。
> WPF 的绑定引擎是事件订阅方：收到通知后，重新读取该属性并刷新绑定目标（UI 元素）。
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.componentmodel.inotifypropertychanged

> [!origin] 由来背景
> 2006 年 WPF 推出时，WinForms 时代"数据变了要手动 `textBox1.Text = x`"的写法让界面代码和业务代码搅成一团。微软在 WPF 里把"UI 与数据解耦"设计成头等公民——绑定引擎负责同步，但引擎需要一个信号通知它"数据变了"。于是 `INotifyPropertyChanged` 应运而生：它不是控件，而是 .NET 层面的一个**观察者通知接口**。
> 它源自 .NET Framework 2.0 的组件模型（`System.ComponentModel`），WPF/Silverlight/WinUI 等所有 XAML 技术栈沿用至今。上位机实时监控（压力、温度、液位每秒都在变）正是它的主战场：**界面不轮询、不手动赋值，数据一变 UI 自动跟**。

> [!essentials] 核心要点
> - **事件三要素**：`PropertyChanged` 事件 + 触发方法 `OnPropertyChanged(string name)` + setter 里赋值后调用它，缺一不可
> - **`nameof()` 传参**：`OnPropertyChanged(nameof(PressureText))`——重命名属性时自动跟随，杜绝魔法字符串打错字
> - **计算属性也要通知**：示例的 `PressureText`/`AlarmText` 没有字段，由 `_pressure` 派生。改 `_pressure` 时要把**所有受影响的派生属性**都通知一遍，漏一个就刷新不同步
> - **自动属性无通知能力**：`public double Pressure { get; set; }` 不触发任何事件；必须改成"字段 + 属性 + setter 通知"三件套（或用 `[ObservableProperty]` 源生成器）
> - **集合用 `ObservableCollection<T>`**：`List<T>` 增删元素不通知界面，换集合类型即可（见「数据实体定义」）
> - **界面线程规则**：事件要在 UI 线程触发（示例用 `DispatcherTimer` 天然在 UI 线程）；后台线程更新数据后需 `Dispatcher.Invoke` 切线程（见「viewmodel-间的通信」）

> [!example] 完整示例
> **INotifyPropertyChanged 实现演示：用 DispatcherTimer 每秒模拟 PLC 上报压力，ViewModel 属性变化后主动通知界面，界面文本自动刷新——这正是 MVVM 实时监控的核心机制：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="INotifyPropertyChanged 实现" Height="320" Width="380"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="20">
>         <TextBlock Text="液压压力实时监控" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <TextBlock Text="当前压力（MPa）" Foreground="#8B949E" Margin="0,15,0,4"/>
>         <!-- 每秒属性变化后，绑定会自动刷新这里显示的值 -->
>         <TextBlock Text="{Binding PressureText}" FontSize="28" Foreground="White" FontWeight="Bold"/>
>         <TextBlock Text="{Binding AlarmText}" Foreground="#DA3633" Margin="0,5,0,15"
>                    FontWeight="Bold"/>
>         <Button Content="启动/停止采集" Command="{Binding ToggleCommand}" Padding="8"
>                 Background="#21262D" Foreground="White" HorizontalAlignment="Left"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— ViewModel 实现 INotifyPropertyChanged：**
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
>         private readonly Random _rand = new Random();
>         private readonly DispatcherTimer _timer;
>         private bool _collecting;
>         private double _pressure;
>
>         public MainViewModel()
>         {
>             // 定时器模拟 PLC 周期上报（生产环境换成真实采集线程）
>             _timer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1) };
>             _timer.Tick += (s, e) => OnDataArrived();
>             ToggleCommand = new RelayCommand(Toggle);
>         }
>
>         // 只读计算属性：由其他属性组合而来，无需独立存储
>         public string PressureText => _pressure.ToString("F1") + " MPa";
>         public string AlarmText => _pressure > 8.5 ? "⚠ 压力过高，请检查溢流阀" : "压力正常";
>
>         public ICommand ToggleCommand { get; }
>
>         private void Toggle()
>         {
>             _collecting = !_collecting;
>             if (_collecting) _timer.Start();
>             else _timer.Stop();
>         }
>
>         // 数据到达后更新字段，并通过 PropertyChanged 通知界面刷新
>         private void OnDataArrived()
>         {
>             _pressure = Math.Round(6 + _rand.NextDouble() * 4, 1);
>             OnPropertyChanged(nameof(PressureText));
>             OnPropertyChanged(nameof(AlarmText));
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
> ✅ 实时数据监控：压力/温度/液位/转速等周期上报，界面每秒自动刷新
> ✅ 设备状态切换：运行/停止/报警/急停，状态灯颜色跟随变化
> ✅ 计算结果联动：一个输入变化 → 多个派生值（报警阈值、偏差、百分比）同时更新
> ✅ 命令可用性联动：字段变更后 `RaiseCanExecuteChanged`，按钮自动置灰/点亮（见「command-绑定」）
> ❌ 静态配置页：值只在初始化设置一次、之后不变，可以不实现通知
> ❌ 高频原始波形（1kHz+ 逐点刷新）：每个点都触发事件开销过大，用共享缓冲 + 定时批量刷新
> ❌ 纯展示数据：从服务端拉一次就不变的列表，一次性赋值即可

> [!pitfall] 常见踩坑
> 坑 1：**setter 里忘了通知 → 界面不刷新** → 改了字段没调 `OnPropertyChanged`，绑定引擎不知道数据变了。这是"数据变了界面不动"的第一大原因，调试时先在 setter 里断点确认是否触发
>
> 坑 2：**通知了错误的属性名** → `OnPropertyChanged("PressureText")` 手写字符串，属性改名后编译不报错、运行静默失效。一律用 `nameof()`
>
> 坑 3：**派生属性漏通知** → 只通知了 `Pressure` 忘了 `PressureText`/`AlarmText`，主数值变了、派生显示不跟。凡受影响属性逐个通知
>
> 坑 4：**后台线程触发事件** → 采集线程改 `_pressure` 后直接 `OnPropertyChanged`，WPF 更新 UI 时抛"调用线程无法访问此对象"。用 `Dispatcher` 调度到 UI 线程（见「viewmodel-间的通信」）
>
> 坑 5：**把 List 当集合绑定** → `List<T>` 增删元素不通知；用 `ObservableCollection<T>` 并注意它对 UI 线程的要求同属性

> [!best] 最佳实践
> - **统一封装通知基类**：抽 `ObservableObject : INotifyPropertyChanged`，提供 `SetProperty<T>(ref T field, T value, [CallerMemberName] string name = null)`，所有 VM 继承即可
> - **优先 `[ObservableProperty]` 源生成器**：CommunityToolkit.Mvvm 自动生成字段 + 通知代码，样板清零（见「communitytoolkitmvvm推荐」）
> - **只通知变化了的属性**：`if (Equals(_pressure, value)) return;` 避免无意义的事件风暴（长跑上位机的性能优化点）
> - **计算属性统一集中通知**：用一个 `OnXxxChanged` 方法集中通知所有受影响的派生属性，而不是散落在各处
> - **绑定路径属性尽量只读**：暴露 `PressureText` 这种派生只读属性，减少"可写但忘记通知"的出错面
> - **写单元测试**：构造 VM → 改属性 → 断言 `PropertyChanged` 事件被触发且属性名正确（测试思路见「dto-vs-entity」Lv.4）

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，观察压力数值每秒变化、报警文本在压力 > 8.5 MPa 时切换；在 `OnDataArrived` 处断点，跟踪一次"属性变更 → 事件 → 界面刷新"的完整链路
> **Lv.2 小试牛刀**：给示例加一个"温度"属性（`_temperature` + `TemperatureText`），定时器同时更新压力与温度；故意把温度的通知删掉，观察界面哪块不刷新，体会"漏通知"的后果
> **Lv.3 融会贯通**：把 `MainViewModel` 改成继承手写的 `ObservableObject` 基类（`SetProperty` + `[CallerMemberName]`），压力属性改为标准三件套写法，确认行为不变
> **Lv.4 挑战自我**：引入 CommunityToolkit.Mvvm，用 `[ObservableProperty]` 重写全部属性（含派生属性的 `partial void OnXxxChanged()` 钩子），并写单元测试断言：给 `Pressure` 赋新值后，`PressureText` 的 `PropertyChanged` 被触发

> [!related] 相关知识链接
> - ← 前置知识：[datacontext-绑定到-viewmodel](./datacontext-绑定到-viewmodel.md)（绑定的方向与 DataContext 来源）；[什么是-mvvm](./什么是-mvvm.md)（VM 在 MVVM 中的位置）
> - → 后续必学：[icommand-实现relaycommand-系列](./icommand-实现relaycommand-系列.md)（命令可用性通知 `CanExecuteChanged` 与 `PropertyChanged` 是双胞胎）；[数据验证逻辑](./数据验证逻辑.md)（验证错误同样走通知机制）
> - ⇄ 关联概念：[数据实体定义](./数据实体定义.md)（集合通知用 ObservableCollection）；[viewmodel-生命周期](./viewmodel-生命周期.md)（通知触发时机与后台资源配合）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.componentmodel.inotifypropertychanged （接口定义与 PropertyChangedEventArgs）
