---
title: 为什么要用 MVVM？
section: 07-mvvm
parent: 7.1 MVVM 基础概念
---

# 为什么要用 MVVM？

> [!plain] 白话理解
> 不用的 MVVM 会怎样？你写的按钮事件里会同时出现三件事：读设备状态、改界面文字、判断按钮能不能点。功能一多，一个窗口后台代码几百行，每个按钮都要写"改标签、改颜色、禁按钮"，改一处需求全窗口跟着改。
> 用了 MVVM 后，界面只负责"把 ViewModel 的状态画出来"：状态变了界面自动刷新，按钮能不能点由命令的 CanExecute 自动决定。业务逻辑集中到 ViewModel，同样的逻辑既能在窗口里跑，也能脱离界面做单元测试。**回报是：需求变了只改一个地方，出 Bug 了能直接测出来。**

> [!def] 官方定义
> MVVM 带来的收益可以从软件工程四要素衡量：
> - **可测试性**：ViewModel 不依赖 UI 框架与控件，可直接用单元测试框架（xUnit/NUnit）驱动属性与命令，验证状态迁移与业务规则；
> - **可维护性**：View 与 ViewModel 通过绑定/命令松耦合，各自职责单一，改动界面不影响逻辑、改动逻辑不影响界面；
> - **可复用性**：同一 ViewModel 可挂接不同 View（列表、曲线、仪表），同一 View 可复用不同 ViewModel；
> - **协作性**：设计师专注 XAML、开发专注 ViewModel，以"属性+命令"为契约并行开发。
> 微软官方文档对数据绑定与分层设计的说明：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/data/

> [!origin] 由来背景
> 为什么大家"要"用 MVVM？因为 WPF 之前的 WinForms 时代，界面逻辑等于"事件+直接操作控件"，代码越写越厚，测试只能靠人工点界面。WPF 时代微软提供了数据绑定与命令两大武器，却不强制分层，很多项目把 ViewModel 写成了"给控件赋值的中转站"，照样混乱。MVVM 正是针对这两个痛点：用绑定替代手动赋值、用命令替代事件耦合，让逻辑回归到可测试的普通类。微软官方文档与 CommunityToolkit 教程都在推行这套分层，社区十余年实践也证明：**上位机这类"界面多、状态多、变化频繁"的软件，MVVM 是性价比最高的组织方式。**

> [!essentials] 核心要点
> - **界面零赋值**：View 不出现 `xxx.Text =`、`xxx.IsEnabled =`，一切状态由绑定驱动
> - **状态驱动可用性**：按钮可用性交给命令 `CanExecute` 管理，逻辑变化只改 ViewModel，不碰按钮属性
> - **业务集中**：设备启停、数据采集、报警判断全部收进 ViewModel，后台代码仅保留 `DataContext` 赋值
> - **可测试**：ViewModel 无 UI 引用，启动/停止/状态迁移可用单元测试直接断言
> - **付出与回报**：付出少量样板代码（INPC/命令），换取"逻辑可测、界面可改、协作顺畅"——项目越复杂收益越大

> [!example] 完整示例
> **设备启停控制：业务逻辑全部收进 ViewModel，状态由属性通知驱动界面刷新，按钮可用性由 CanExecute 自动控制——这就是 MVVM 的回报：界面代码几乎为零：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="为什么要用MVVM - 设备控制" Height="340" Width="380"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="20">
>         <TextBlock Text="传送带设备控制" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <!-- 状态文本全部靠绑定刷新，后台代码不再出现 StatusText.Text = ... -->
>         <TextBlock Margin="0,15,0,5" Text="运行状态" Foreground="#8B949E"/>
>         <TextBlock Text="{Binding StatusText}" FontSize="22" Foreground="White" FontWeight="Bold"/>
>         <TextBlock Text="{Binding SpeedText}" Foreground="#8B949E" Margin="0,5,0,15"/>
>         <!-- 按钮 IsEnabled 由命令的 CanExecute 自动联动，无需手动管理 -->
>         <Button Content="启动" Command="{Binding StartCommand}" Margin="0,0,0,8" Padding="8"
>                 Background="#238636" Foreground="White" HorizontalAlignment="Left"/>
>         <Button Content="停止" Command="{Binding StopCommand}" Padding="8"
>                 Background="#DA3633" Foreground="White" HorizontalAlignment="Left"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 可独立测试的 ViewModel：**
> ```csharp
> using System;
> using System.ComponentModel;
> using System.Windows;
> using System.Windows.Input;
>
> namespace HmiDemo
> {
>     // ViewModel：不含任何 UI 引用，可以在测试项目中直接 new 出来验证逻辑
>     public class MainViewModel : INotifyPropertyChanged
>     {
>         private bool _isRunning;
>         private string _statusText = "已停止";
>         private string _speedText = "当前速度：0 RPM";
>
>         public string StatusText
>         {
>             get => _statusText;
>             private set { _statusText = value; OnPropertyChanged(nameof(StatusText)); }
>         }
>
>         public string SpeedText
>         {
>             get => _speedText;
>             private set { _speedText = value; OnPropertyChanged(nameof(SpeedText)); }
>         }
>
>         public ICommand StartCommand { get; }
>         public ICommand StopCommand { get; }
>
>         public MainViewModel()
>         {
>             // CanExecute 与属性联动：运行中不能重复启动
>             StartCommand = new RelayCommand(Start, () => !_isRunning);
>             StopCommand = new RelayCommand(Stop, () => _isRunning);
>         }
>
>         private void Start()
>         {
>             _isRunning = true;
>             StatusText = "运行中";
>             SpeedText = "当前速度：1500 RPM";
>             StartCommand.RaiseCanExecuteChanged(); // 通知按钮刷新可用状态
>             StopCommand.RaiseCanExecuteChanged();
>         }
>
>         private void Stop()
>         {
>             _isRunning = false;
>             StatusText = "已停止";
>             SpeedText = "当前速度：0 RPM";
>             StartCommand.RaiseCanExecuteChanged();
>             StopCommand.RaiseCanExecuteChanged();
>         }
>
>         public event PropertyChangedEventHandler PropertyChanged;
>         private void OnPropertyChanged(string name) =>
>             PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
>     }
>
>     // 支持 CanExecute 的 RelayCommand
>     public class RelayCommand : ICommand
>     {
>         private readonly Action _execute;
>         private readonly Func<bool> _canExecute;
>         public RelayCommand(Action execute, Func<bool> canExecute = null)
>         {
>             _execute = execute;
>             _canExecute = canExecute;
>         }
>         public bool CanExecute(object parameter) => _canExecute == null || _canExecute();
>         public void Execute(object parameter) => _execute();
>         public void RaiseCanExecuteChanged() =>
>             CanExecuteChanged?.Invoke(this, EventArgs.Empty);
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
> ✅ 设备控制类界面：启停/切换状态频繁，可用性（CanExecute）与状态强关联
> ✅ 数据监控看板：温度、转速等实时值持续变化，绑定驱动刷新无需手动赋值
> ✅ 需要自动化回归测试的产线系统：验收标准是"逻辑正确"而非"界面点了没反应"
> ✅ 需求迭代频繁的定制项目：客户改需求时只动 View/ViewModel 单层，改造成本低
> ❌ 一次性原型或演示 Demo：时间紧、不维护，直接写事件更快
> ❌ 实时性要求极高的渲染循环（如高频自绘），MVVM 的属性通知开销不可忽略时需权衡

> [!pitfall] 常见踩坑
> 坑 1：**为了"用 MVVM"而用，把事件全搬进 ViewModel** → ViewModel 里出现 `TextChanged` 这类 UI 专属逻辑，反而更难测。UI 专属行为（焦点、动画）留在 View 或行为（Behavior）里
>
> 坑 2：**忘了调用 `RaiseCanExecuteChanged`** → 启动按钮变灰后，状态恢复时按钮还是灰的。`CanExecute` 依赖的状态变化后必须手动通知命令刷新（或引入能自动感知的框架）
>
> 坑 3：**ViewModel 直接引用串口/PLC 对象且可测试性为零** → 依赖具体设备类无法替换为 Mock。用接口抽象（`IDeviceClient`）注入 ViewModel，测试时传假实现
>
> 坑 4：**把"绑定不生效"当成"MVVM 没用"** → 多数"MVVM 不行"的案例其实是 INPC 没实现、路径拼错、DataContext 没赋值。先排查绑定再质疑模式

> [!best] 最佳实践
> - 用 CommunityToolkit.Mvvm 的 `[ObservableProperty]` 与 `[RelayCommand(CanExecute=...)]`，样板代码交给源生成器，专注业务
> - 命令的 `CanExecute` 是状态机，把设备状态收敛为枚举（Stop/Starting/Running/Stopping），避免多个 bool 互相打架
> - ViewModel 只依赖接口（`IDeviceClient`、`IAlarmService`），具体实现由依赖注入提供，测试传假实现
> - 属性通知统一用 `nameof()`；有计算属性时在依赖字段的 setter 里一并通知（如 `Speed` 变了同时通知 `SpeedText`）
> - 定期给 ViewModel 写单元测试：启动→运行→停止的状态迁移、异常路径（超温、断线）各一条用例

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，观察启动/停止时按钮灰色状态（CanExecute）如何自动切换；注释掉 `Start()` 里的 `RaiseCanExecuteChanged()`，看按钮会不会"卡死"
> **Lv.2 小试牛刀**：给设备加"急停"状态——新增 `IsEmergency` 属性与"急停"按钮，急停时启动命令 `CanExecute` 恒为 false
> **Lv.3 融会贯通**：把 `MainViewModel` 新建在测试项目里（不引 WPF），写 3 条断言：初始已停止→调用 Start 后 StatusText 为"运行中"→再调 Stop 恢复
> **Lv.4 挑战**：把设备操作抽象成 `IDeviceClient` 接口，ViewModel 构造注入它；测试时传一个"永远成功"的假实现，验证测试不依赖真实设备

> [!related] 相关知识链接
> - ← 前置知识：「什么是-mvvm」先建立三层模型认知；`{Binding}` 见第 5 章「什么是数据绑定」
> - → 后续必学：「mvvm-各层职责」明确每层怎么写；「mvvm-vs-mvc-vs-mvp-对比」看与其他模式取舍
> - ⇄ 关联概念：「icommand-实现relaycommand-系列」（CanExecute 机制）、「datacontext-绑定到-viewmodel」
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/data/
