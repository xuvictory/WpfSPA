---
title: Prism 企业级框架
section: 07-mvvm
parent: 7.5 主流 MVVM 框架
---

# Prism 企业级框架

> [!plain] 白话理解
> 裸 MVVM 像"用纸笔画图纸"，画一张可以，画几百张就乱了。**Prism 就是工业级绘图软件**：自带图层、标尺、模板库——它把大型应用的通用难题打包解决：**模块化**（功能拆成独立模块，按需加载）、**区域导航**（页面切换标准化）、**依赖注入**（内置容器）、**事件聚合器**（模块间通信）、**对话框服务**（弹窗统一管理）。
> 不这样做会怎样？自己写导航、自己搞模块加载、自己拼事件系统，开发一个月、维护一年。上位机大型看板（总览/报警/配方/报表多模块）正是 Prism 的主场——骨架由框架给，团队只管往模块里填业务。

> [!def] 官方定义
> Prism 是一个**用于构建大型 WPF / Xamarin.Forms / MAUI 应用的 MVVM 框架**，由微软模式与实践团队（Microsoft patterns & practices）发起，现由社区维护（GitHub: `PrismLibrary/Prism`）。其核心能力：
> - **模块化（Modularity）**：功能拆分为独立 `Module`，按需初始化
> - **区域导航（Region Navigation）**：`RegionManager` 注册区域，`INavigationAware` 接收导航生命周期
> - **依赖注入（DI）**：内置容器（默认 DryIoc），`RegisterTypes(IContainerRegistry)` 注册、`Resolve<T>()` 解析
> - **事件聚合器（EventAggregator）**：`IEventAggregator.GetEvent<T>()` 弱引用发布/订阅
> - **对话框服务（DialogService）**：`IDialogService.ShowDialog` + `IDialogAware`
> 官网文档：https://prismlibrary.github.io/docs/wpf/

> [!origin] 由来背景
> Prism 的前身是 2008 年微软模式与实践团队发布的 **Composite Application Guidance for WPF**（又称 Composite WPF / CAL），目标是解决企业级 WPF 应用的"复合性"难题——多团队、多模块、多窗口如何协作。它把"模块加载、区域导航、命令与事件解耦"沉淀为框架能力，2010 年随 Prism 4 正式更名为 Prism。
> Prism 5 起把容器抽象化（支持 Unity/Autofac/官方容器多种选择）；Prism 6 集成 MVVM 基础设施；Prism 7 转向 .NET Core/.NET 5+，由社区维护者 Brian Lagunas 等继续演进。大型上位机项目（多模块、看板导航、权限与报表）长期是 Prism 的典型用户，因此它是"企业级 MVVM"绕不开的框架。

> [!essentials] 核心要点
> - **模块化**：`Module` 按功能域拆成独立程序集，`RegisterTypes` 注册、按需加载，团队可按模块并行开发
> - **区域导航**：主窗口声明 `Region`（`RegionManager.RegionName`），页面通过 `INavigationAware` 的 `OnNavigatedTo/OnNavigatedFrom` 管理进入/离开时的状态与资源
> - **依赖注入内建**：`IContainerRegistry` 注册服务与页面，VM 构造函数注入；默认容器 DryIoc，可替换
> - **事件聚合器**：`IEventAggregator` 弱引用发布订阅，模块间解耦通信（无需互相引用）
> - **对话框服务**：`IDialogService` + `IDialogAware` 统一管理自定义对话框（见「对话框服务」）
> - **绑定基础设施**：`BindableBase`（`SetProperty`）、`DelegateCommand` 是 Prism 的 MVVM 基座

> [!example] 完整示例
> **Prism 风格演示：用 Region（内容区域）+ 模块化页面模拟 Prism 的导航思路——主窗口只声明区域，页面以 UserControl 为模块挂载，通过导航服务在"参数页 / 趋势页"间切换（生产环境请使用 Prism 框架的 RegionManager 与 INavigationAware）：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="Prism 企业级框架" Height="400" Width="480"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <DockPanel Margin="15">
>         <TextBlock DockPanel.Dock="Top" Text="主窗口（Shell + Region）" Foreground="#58A6FF"
>                    FontSize="16" FontWeight="Bold" Margin="0,0,0,10"/>
>         <!-- Prism 中导航按钮通常绑定 RegionManager 的请求导航命令 -->
>         <StackPanel DockPanel.Dock="Top" Orientation="Horizontal" Margin="0,0,0,12">
>             <Button Content="参数页" Command="{Binding NavCommand}" CommandParameter="Param"
>                     Padding="8" Background="#21262D" Foreground="White" Margin="0,0,8,0"/>
>             <Button Content="趋势页" Command="{Binding NavCommand}" CommandParameter="Trend"
>                     Padding="8" Background="#21262D" Foreground="White"/>
>         </StackPanel>
>         <!-- Region：内容区，由导航服务决定显示哪个页面 -->
>         <ContentControl Content="{Binding CurrentPage}"/>
>     </DockPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— Region 导航与模块页面：**
> ```csharp
> using System;
> using System.Collections.Generic;
> using System.ComponentModel;
> using System.Windows;
> using System.Windows.Controls;
> using System.Windows.Input;
>
> namespace HmiDemo
> {
>     // 模块页面1：参数页（UserControl，对应 Prism 的视图模块）
>     public class ParamPage : UserControl
>     {
>         public ParamPage()
>         {
>             var text = new TextBlock { Text = "参数页（模块：SettingsModule）", Foreground = System.Windows.Media.Brushes.White };
>             Content = text;
>         }
>     }
>
>     // 模块页面2：趋势页
>     public class TrendPage : UserControl
>     {
>         public TrendPage()
>         {
>             var text = new TextBlock { Text = "趋势页（模块：ChartModule）", Foreground = System.Windows.Media.Brushes.White };
>             Content = text;
>         }
>     }
>
>     // Region 导航服务：按 key 返回已注册的页面对象（Prism 用 RegionManager）
>     public class RegionNavigationService
>     {
>         private readonly Dictionary<string, UserControl> _views =
>             new Dictionary<string, UserControl>();
>         public void Register(string key, UserControl view) => _views[key] = view;
>         public UserControl Navigate(string key) => _views[key];
>     }
>
>     public class MainViewModel : INotifyPropertyChanged
>     {
>         private readonly RegionNavigationService _region = new RegionNavigationService();
>         private UserControl _currentPage;
>
>         public UserControl CurrentPage
>         {
>             get => _currentPage;
>             private set { _currentPage = value; OnPropertyChanged(nameof(CurrentPage)); }
>         }
>
>         public ICommand NavCommand { get; }
>
>         public MainViewModel()
>         {
>             // 模块注册（Prism 中由模块初始化时完成）
>             _region.Register("Param", new ParamPage());
>             _region.Register("Trend", new TrendPage());
>             NavCommand = new RelayCommand<string>(key => CurrentPage = _region.Navigate(key));
>             CurrentPage = _region.Navigate("Param"); // 默认页
>         }
>
>         public event PropertyChangedEventHandler PropertyChanged;
>         private void OnPropertyChanged(string name) =>
>             PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
>     }
>
>     public class RelayCommand<T> : ICommand
>     {
>         private readonly Action<T> _execute;
>         public RelayCommand(Action<T> execute) => _execute = execute;
>         public bool CanExecute(object parameter) => true;
>         public void Execute(object parameter) => _execute((T)parameter);
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
> ✅ **大型多模块上位机**：看板、报警、配方、报表拆成多个模块，团队并行开发、按需加载
> ✅ **复杂多窗口导航**：主界面区域切换 + 子窗口流程，Prism 的 Region 导航统一管理
> ✅ **模块间需要解耦通信**：参数模块改动 → 趋势模块刷新，用 `IEventAggregator` 而非直接引用
> ✅ **框架级 DI + 导航 + 对话框全都要**：Prism 一体提供，省去自己拼装
> ❌ 中小项目（页面 < 10）：Prism 学习曲线与样板代码重，`CommunityToolkit.Mvvm` 更轻
> ❌ 纯展示型小工具：框架收益小于成本

> [!pitfall] 常见踩坑
> 坑 1：**忘了在容器注册页面/服务** → 现象：导航或解析时抛 `ContainerResolutionException: No registered type found`；原因：Prism 容器要求先 `RegisterTypes` 才能解析；解决：所有页面与服务统一在模块 `RegisterTypes(IContainerRegistry)` 里注册
>
> 坑 2：**Region 名称不匹配，导航静默失败** → 现象：`NavigateAsync` 调用后界面不切换、不报错；原因：`RegionManager.RegionName` 与导航目标/区域名拼写不一致；解决：区域名与导航目标用常量类集中管理（`RegionNames.Main`），禁止魔法字符串
>
> 坑 3：**模块间循环引用** → 现象：程序集加载失败或编译报循环依赖；原因：模块 A 引用 B、B 又引用 A；解决：抽共享层 `Contracts`（只放接口与共享类型），模块只依赖 Contracts，实现类互相不引用

> [!best] 最佳实践
> - **Shell + Region 架构**：主窗口只做壳（放区域），所有页面由模块注入区域，Shell 不写业务
> - **用框架自带能力，不重复造轮子**：`RegionManager`、`IEventAggregator`、`IDialogService`、`BindableBase`、`DelegateCommand` 都是现成的
> - **模块职责单一**：一个模块一个功能域，模块内再分 `Views/ViewModels/Services`（见「项目结构与目录规划」）
> - **VM 生命周期交给 `INavigationAware`**：进入时订阅/加载、离开时取消/释放，避免内存泄漏
> - **事件聚合器防泄漏**：`IEventAggregator` 本身弱引用，但订阅回调里注意释放非托管资源；跨模块通信尽量走事件而非直接引用

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，点击"参数页/趋势页"观察区域内容切换；再 `Register` 一个新页面 key 并绑定按钮验证
> **Lv.2 小试牛刀**：新增第三个页面"报警页"（`AlarmPage`，显示静态报警列表），注册 key 为 `Alarm` 并加入导航按钮
> **Lv.3 融会贯通**：用 `IEventAggregator` 思路给示例加"跨页面通信"：参数页修改"采集周期"值后发布事件，趋势页订阅并显示新周期（手写 `PubSubEvent` 模拟 Prism 事件聚合器）
> **Lv.4 拆层挑战**：引入真实 Prism NuGet 包：`PrismApplication` 启动（`App` 继承 `PrismApplication`）、`RegisterTypes` 注册、`RegionManager` 真导航、`DelegateCommand` 替换手写命令，体会框架版与手写版的差异

> [!related] 相关知识链接
> - ← 前置知识：[mvvm-各层职责](./mvvm-各层职责.md)（MVVM 基础）；[di-在-mvvm-中的应用](./di-在-mvvm-中的应用.md)（Prism 内置容器装配）；[导航服务实现](./导航服务实现.md)（Region 导航的手写版原理）
> - → 后续必学：[reactiveui-响应式框架](./reactiveui-响应式框架.md)（另一套 MVVM 框架选型）
> - ⇄ 关联概念：[对话框服务](./对话框服务.md)（Prism 的 `IDialogService`）；[viewmodel-间的通信](./viewmodel-间的通信.md)（`IEventAggregator` 的同类问题）；[项目结构与目录规划](./项目结构与目录规划.md)（模块化组织）
> - 📖 官方文档：[Prism WPF 文档](https://prismlibrary.github.io/docs/wpf/) ；GitHub 仓库 https://github.com/PrismLibrary/Prism
