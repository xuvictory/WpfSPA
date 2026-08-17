---
title: ViewModel 与 UI 设计
section: 14-projects
parent: 14.1 项目一：温湿度监控系统（入门级）
---

# ViewModel 与 UI 设计

> [!plain] 白话理解
> 把界面比作车间里的"监控大屏"，数据比作仪表读数。以前的做法是大屏自己盯着仪表抄数据、自己算、自己显示（在事件里直接操作控件），界面和逻辑缠成一团，改一个显示样式要动一堆代码。
> ViewModel 就是大屏和数据之间的"调度台"：它只负责保存数据、算状态（比如"当前温度超过报警上限了吗"），大屏通过 Binding 这根"数据线"自动跟它同步——数据一改，大屏自动刷新；操作员在大屏上改参数，数据也自动写回调度台。本例中修改"报警上限"，下面的状态文本立刻跟着变，全程没有一行"手动更新控件"的代码，这就是 MVVM 的"数据驱动界面"。

> [!def] 官方定义
> **MVVM**（Model-View-ViewModel）是一种**架构模式**（非 .NET 框架特性）：View 负责界面展示，ViewModel 暴露数据与命令并实现 `System.ComponentModel.INotifyPropertyChanged` 接口通知属性变化，Model 负责业务数据与逻辑，View 与 ViewModel 通过数据绑定（`{Binding 属性名}`）解耦通信。
> **DataContext** 是绑定上下文：子元素未显式设置时继承父元素的 DataContext，在 `MainWindow` 构造函数中赋 `DataContext = _vm` 后，整个窗口的 `{Binding}` 都指向该 ViewModel。官方数据绑定文档见 https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/data/data-binding-overview

> [!origin] 由来背景
> MVVM 诞生于 2005 年：微软 WPF/Silverlight 架构师 John Gossman 在博客中提出，其思想源头是 Martin Fowler 2004 年的 **Presentation Model** 模式与经典的 MVC。当时 WPF 提供了强大的数据绑定与命令系统，却缺少一个把这些能力组织起来的官方架构，MVVM 正好补上这一环，让"界面由数据驱动"成为可能。
> 上位机场景尤其受益：温湿度监控界面需要每秒刷新、需要"温度→超限状态"联动、需要把界面与采集逻辑分离以便复用。如果沿用 WinForms 式"事件里改控件"，项目一复杂就难以维护；MVVM 把界面变成 ViewModel 状态的"投影"，这也是本系列后续所有项目（Modbus 看板、SCADA）共同的组织方式。

> [!essentials] 核心要点
> - **INotifyPropertyChanged**：ViewModel 实现该接口，属性 setter 中调用 `OnPropertyChanged()` 通知 UI 刷新；`[CallerMemberName]` 自动取属性名，免手写字符串
> - **DataContext**：在窗口构造函数里 `DataContext = _vm`，XAML 中 `{Binding CurrentTemp}` 才能找到数据源
> - **双向绑定**：`UpdateSourceTrigger=PropertyChanged` 让输入框"边输边更新"，默认的 LostFocus 要到失焦才写回
> - **计算属性联动**：`StateText` 这类派生状态不单独存储，在 getter 中现算，并在依赖输入变化时 `OnPropertyChanged(nameof(StateText))` 显式通知
> - **后台代码瘦身**：code-behind 只保留 `InitializeComponent()` 与 DataContext 赋值，其余逻辑全部进 ViewModel

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
> ✅ 参数配置界面：报警阈值、采样周期等需要"边输入边联动提示"的表单，双向绑定 + 计算属性天然合适
> ✅ 实时数据展示：采集线程更新 ViewModel 属性，界面自动刷新，无需手动操作控件
> ✅ 多页面共享数据：多个 View（主界面、历史窗口）绑定同一 ViewModel 实例，数据处处一致
> ✅ 界面需反复换肤/改版：View 与逻辑解耦后，改 XAML 不动 C#，UI 重构成本低
> ❌ 一次性简单弹窗（仅"确定/取消"）：为几十行界面搭一套 ViewModel 反而拖慢开发
> ❌ 纯展示无交互的静态页面：直接写死 XAML 即可，没必要引入绑定开销

> [!pitfall] 常见踩坑
> 坑 1：**忘记设置 DataContext** → 界面绑定全部空白不显示，后台却不报错 → 检查窗口构造函数是否执行了 `DataContext = _vm`，或 XAML 中是否声明了 `d:DataContext`
>
> 坑 2：**属性 setter 忘了调用 OnPropertyChanged** → 数据变了界面纹丝不动，还以为是绑定失效 → 所有对外绑定属性在 set 后都必须通知；改计算属性后还要通知计算属性本身（`OnPropertyChanged(nameof(StateText))`）
>
> 坑 3：**绑定方向理解错** → 输入框数据没写回，或一刷新就被覆盖 → 明确数据流：`UpdateSourceTrigger=PropertyChanged` 保证输入即时写回；采集更新与用户输入同时发生时，用 `Mode=TwoWay` 并设计好数据优先级
>
> 坑 4：**ViewModel 里塞 UI 类型**（Dispatcher、控件、MessageBox）→ 单元测试跑不了、逻辑无法复用 → ViewModel 只依赖 `System`/`System.ComponentModel`，弹窗等 UI 交互通过服务接口注入

> [!best] 最佳实践
> - 命名规范：ViewModel 属性用 PascalCase，私有字段 `_camelCase`，字段与属性一一下划线对应
> - `OnPropertyChanged` 统一用 `[CallerMemberName]` 自动取属性名，避免手写字符串拼错
> - 计算属性只在 getter 中计算，不另存副本，保证"单一数据源"（Single Source of Truth）
> - 一个 ViewModel 对应一个界面职责：`TemperatureViewModel` 只管温湿度展示，报警判定交给独立逻辑或独立 VM
> - 项目变大后引入命令（`RelayCommand`）替代 Click 事件，让按钮动作也可绑定、可测试（见第 7 章）
> - 采集线程更新 VM 属性时，利用 `INotifyPropertyChanged` 自动切回 UI 线程刷新，无需手动 Dispatcher

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，观察温度每秒自动刷新、修改报警上限时状态文本实时联动
> **Lv.2 小试牛刀**：在 `TemperatureViewModel` 中新增 `Humidity` 属性并绑定到界面（文本框 + 状态联动），参照 `CurrentTemp` 完整走一遍"字段→属性→通知→Binding"
> **Lv.3 融会贯通**：给 `StateText` 增加三级状态（正常/偏高/报警），温度超过上限、超过上限 5℃ 显示不同文案与颜色（用 `Foreground` 绑定或数据触发器）
> **Lv.4 挑战**：把报警判定抽成 `AlarmState` 枚举属性，温度、湿度两个输入共同决定该枚举；再为"确认报警"添加 `RelayCommand`，用按钮绑定而非 Click 事件完成操作

> [!related] 相关知识链接
> - ← 前置知识：MVVM 原理与分层见第 7 章「什么是-mvvm」「mvvm-各层职责」；属性通知见「inotifypropertychanged-实现」；绑定上下文见「datacontext-绑定到-viewmodel」；命令见「icommand-实现relaycommand-系列」
> - → 后续必学：VM 里的实时数据如何画成曲线、做成仪表盘，见「实时曲线与仪表盘」
> - ⇄ 关联概念：同章「prism-模块划分」展示 MVVM 在企业级框架（Prism）中的组织方式；第 5 章「什么是数据绑定」是绑定机制基础
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/data/data-binding-overview
