---
title: MVVM 各层职责
section: 07-mvvm
parent: 7.1 MVVM 基础概念
---

# MVVM 各层职责

> [!plain] 白话理解
> 把上位机项目想象成一个工厂车间：
> - **Model（仓库）**：只存放"原料"——设备数据、参数、规则，不知道外面有车间，更不认识屏幕上的控件；
> - **ViewModel（生产调度台）**：从仓库取原料，加工成车间（界面）能直接展示的东西——把 10.5 安培加工成"电流：10.5 A"，把温度判断成"超温/正常"，并决定哪个按钮能按；
> - **View（车间展示牌）**：只负责把调度台给的信息亮出来，按下按钮就把指令发给调度台，自己不做任何加工。
> 职责守则就一句话：**仓库不搞加工、展示牌不做决策、调度台不碰屏幕。**

> [!def] 官方定义
> MVVM 将界面程序划分为三层，各层职责边界如下：
> - **Model（模型）**：业务领域对象与数据访问（POCO 实体、仓储、服务调用）。特征：**不引用 UI**，可独立编译、独立测试；
> - **ViewModel（视图模型）**：为 View 提供状态与行为。暴露可绑定属性（实现 `System.ComponentModel.INotifyPropertyChanged`）与命令（实现 `System.Windows.Input.ICommand`），负责把 Model 加工为界面友好形态、执行交互逻辑、管理界面状态（忙碌、可用、选中项）；
> - **View（视图）**：XAML 界面。只做数据展示、输入收集与视觉状态（样式、模板、动画），后台代码仅保留 `InitializeComponent` 与 `DataContext` 装配（或交给 ViewModelLocator）。
> 分层铁律：**View → ViewModel → Model 单向依赖，任何反向引用（ViewModel 引用控件、Model 引用 ViewModel）都是职责越界。**

> [!origin] 由来背景
> 分层思想是软件工程的通用答案：数据库要分层（DAO/Service/UI）、网络要分层（OSI 七层），界面程序同样需要。早期 WinForms 把"数据、逻辑、控件操作"全塞进一个 Form 类，一个设备详情页几百行，改需求像拆炸弹。MVVM 把既有分层思想移植到 WPF：利用绑定让 View 层退化为"数据投影"，利用命令让 ViewModel 接管"行为"，Model 保持纯净。**分层不是 MVVM 独有，但 MVVM 让 WPF 下分层变得最自然、样板最少。**

> [!essentials] 核心要点
> - **Model 三不做**：不引用 UI 命名空间、不触发属性通知（它是普通数据类）、不含界面状态（选中项、排序属于 ViewModel）
> - **ViewModel 两职责**：把 Model 加工成"界面友好形态"（格式化、枚举转文本、合并字段）+ 承载交互行为（命令与状态机）
> - **View 两允许**：允许样式/模板/动画/布局这些"纯展示"代码，允许写无逻辑的事件（如关闭窗口、拖拽行为）
> - **DataContext 是分界线**：View 只能通过绑定读 ViewModel，后台代码中出现 `viewModel.Property` 已是越界信号
> - **判责口诀**：看不清该放哪层时问——"它被界面独占吗？是→View；它要加工数据吗？是→ViewModel；它描述业务本身吗？是→Model"

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
> ✅ 设备详情/参数配置页：Model 存设备数据，ViewModel 提供"电流 A"、"状态"等展示文本，View 纯展示
> ✅ 数据采集监控：Model 对应采集点表，ViewModel 处理实时值格式化与报警判断，View 用绑定自动刷新
> ✅ 报表/历史查询：Model 管数据源，ViewModel 管筛选条件与分页状态，View 管表格展示
> ✅ 登录/权限模块：Model 存用户与角色，ViewModel 管登录命令与验证，View 管表单
> ❌ 无状态的一次性脚本式页面：直接绑 Model 即可，不必为每个窗口硬造 ViewModel
> ❌ 纯可视化控件开发（自绘仪表）：那是控件内部逻辑，不属于 MVVM 分层范畴

> [!pitfall] 常见踩坑
> 坑 1：**Model 里放 `ObservableCollection` 或属性通知** → Model 变成"半 ViewModel"，复用性和纯净性受损。Model 用普通类/`IReadOnlyList`，集合通知交给 ViewModel
>
> 坑 2：**ViewModel 里放控件类型**（`Visibility`、`Brush`、`Window` 引用）→ 无法脱离 WPF 测试。把界面形态映射成"状态枚举 + 字符串"，用 View 的触发器/转换器翻译成视觉
>
> 坑 3：**View 后台代码做数据加工** → 在 `Click` 里拼接字符串、算数值。加工逻辑进了 View 就不可测。一律下沉到 ViewModel
>
> 坑 4：**ViewModel 直接 new 依赖的 Service**（`new SerialPortService()`）→ 无法替换假实现测试。构造注入接口，让容器或测试代码提供实现

> [!best] 最佳实践
> - 按"目录即分层"组织项目：`Models/`、`ViewModels/`、`Views/`、`Services/`，新人一眼看懂归属（见「项目结构与目录规划」）
> - Model 命名用业务词汇（`TemperaturePoint`、`DeviceConfig`），别用 `Data1`、`M` 这类无意义名
> - ViewModel 用"面向 View 的状态名"（`IsRunning`、`CurrentText`、`CanStart`），让 XAML 读起来像在念需求
> - 展示文本（`"运行中"`、`"超温"`）由 ViewModel 提供，View 不翻译业务词；颜色/图标等纯视觉映射放 View 的 DataTrigger
> - 一个页面一个 ViewModel 文件；页面变复杂就拆子 ViewModel（如 `DeviceDetailViewModel` 组合 `AlarmListViewModel`）

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，逐行指出 `DeviceModel`、`MainViewModel`、`MainWindow.xaml` 分属哪一层，说清各自职责
> **Lv.2 小试牛刀**：给 `DeviceModel` 加 `Temperature`（double）属性，在 ViewModel 增加 `TemperatureText` 并格式化，XAML 加一行展示
> **Lv.3 融会贯通**：故意把 `CurrentText` 的拼接逻辑挪到 XAML 的 `Click` 事件里，运行后说明"为什么这样做测试不了、改不了"
> **Lv.4 挑战**：给示例加"运行状态"的颜色变化——ViewModel 暴露 `StatusText`（文本），View 用 `DataTrigger` 按文本切绿色/红色，体会"文本归 VM、颜色归 View"

> [!related] 相关知识链接
> - ← 前置知识：「什么是-mvvm」「为什么要用-mvvm」理解三层模型与收益
> - → 后续必学：7.2 节「数据实体定义」「数据验证逻辑」落地 Model 层写法；7.4 节 ViewModel 层写法
> - ⇄ 关联概念：「datacontext-绑定到-viewmodel」（View 与 VM 的装配）、「command-绑定」（View 与命令的装配）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/data/
