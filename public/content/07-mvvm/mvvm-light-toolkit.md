---
title: MVVM Light Toolkit
section: 07-mvvm
parent: 7.5 主流 MVVM 框架
---

# MVVM Light Toolkit

> [!plain] 白话理解
> 手写 `INotifyPropertyChanged` 和 `ICommand` 后你会发现：**每个 ViewModel 都在重复同样的代码**——`Set<T>` 通知、`RelayCommand`、消息收发。与其每个项目抄一遍，不如把它打包成一个小工具箱：这就是 MVVM Light。
> 类比车间：你不必每次都用铁丝现编一把螺丝刀，工具箱里有现成的，拿来就用。MVVM Light 就是 WPF 开发者的"随身工具箱"：`ViewModelBase`（通知基类）、`RelayCommand`（命令）、`Messenger`（消息广播）等开箱即用。
> 它由 Laurent Bugnion 开源维护（非微软官方），一度是 .NET 社区使用最广的轻量 MVVM 库；如今新项目更推荐 CommunityToolkit.Mvvm（见「communitytoolkitmvvm推荐」），但它的"基类 + 命令 + Messenger"思想至今仍是理解 MVVM 框架的钥匙。

> [!def] 官方定义
> MVVM Light Toolkit 是 Laurent Bugnion（微软 MVP）于 2009 年发布的开源 MVVM 辅助库（**非微软官方产品**），通过 NuGet 包 `MvvmLight` / `MvvmLightLibs` 分发。核心组件：
> - `ViewModelBase`：实现 `INotifyPropertyChanged`，提供 `Set<T>(ref T field, T value, [CallerMemberName])` 通知方法
> - `RelayCommand` / `RelayCommand<T>`：`ICommand` 标准实现（`GalaSoft.MvvmLight.CommandWpf` 命名空间）
> - `Messenger` / `Messenger.Default`：静态消息总线，`Send`/`Register` 广播与接收
> - `ObservableObject`：无通知基类（供纯数据对象使用）
> - `ViewModelLocator`：简单服务定位器，用于 View 与 ViewModel 的挂接
> 官方文档：https://github.com/lbugnion/mvvmlight （源码与归档文档）

> [!origin] 由来背景
> MVVM Light 诞生于 WPF 早期（2008-2009 年），当时实践 MVVM 必须手写大量重复代码：`INotifyPropertyChanged` 基类、`ICommand` 实现、跨 VM 通信……Laurent Bugnion 在开发 Silverlight/WPF 应用时把这些通用部分抽出来开源，很快成为 .NET 生态最流行的 MVVM 库，2011 年左右被微软官方文档与 MVA 课程大量引用。
> 它的定位一直是"Light"：不做导航、不做容器、不强制架构，只解决 ViewModel 层的三个痛点——属性通知、命令、消息。2017 年起项目进入维护模式，官方推荐新项目迁移到 CommunityToolkit.Mvvm；但它的类名与用法（`Set<T>`、`Messenger.Default.Send`）仍是许多老上位机项目的基础设施。

> [!essentials] 核心要点
> - **三个核心件**：`ViewModelBase`（通知基类）、`RelayCommand`（命令）、`Messenger`（消息），90% 的日常只用这三个
> - **`Set<T>` 免写样板**：`Set(ref _count, value, nameof(Count))` 一行完成"判同→赋值→通知"，返回 bool 表示是否真的变了
> - **Messenger 是静态全局**：`Messenger.Default.Send(...)` 随处可发、`Register` 接收；用**强类型消息类**区分不同消息，而不是裸字符串
> - **`RelayCommand<T>` 处理带参**：`CommandParameter` 从 XAML 传入，泛型版本自动转型（示例 `+10` 按钮演示）
> - **ViewModelLocator 负责装配**：XAML 里 `DataContext="{Binding Source={StaticResource Locator}, Path=Main}"`，VM 由 Locator 统一创建（可配合 DI，见「di-在-mvvm-中的应用」）
> - **注意：库已进入维护模式**：新项目请优先 CommunityToolkit.Mvvm（见「communitytoolkitmvvm推荐」）；老代码迁移的主要成本是命名空间与 `[ObservableProperty]` 语法

> [!example] 完整示例
> **MVVM Light 风格演示：ViewModelBase（简化版）提供 Set 通知方法，RelayCommand 支持 CanExecute，操作日志用简化 Messenger 广播到状态栏（生产环境请引入 MvvmLight 包）：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="MVVM Light Toolkit" Height="360" Width="420"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <DockPanel Margin="15">
>         <TextBlock DockPanel.Dock="Top" Text="产品计数（MVVM Light 风格）" Foreground="#58A6FF"
>                    FontSize="16" FontWeight="Bold" Margin="0,0,0,15"/>
>         <Border DockPanel.Dock="Bottom" Background="#161B22" Padding="8" CornerRadius="4">
>             <TextBlock Text="{Binding StatusText}" Foreground="#8B949E" FontFamily="Consolas"/>
>         </Border>
>         <StackPanel>
>             <TextBlock Text="当前计数（件）" Foreground="#8B949E"/>
>             <TextBlock Text="{Binding Count}" Foreground="#58A6FF" FontSize="40"
>                        FontWeight="Bold" Margin="0,5,0,15"/>
>             <!-- 三个命令分别演示无参 / 带参 / CanExecute 三种用法 -->
>             <Button Content="+1（无参命令）" Command="{Binding AddCommand}" Padding="8"
>                     Margin="0,0,0,8" Background="#238636" Foreground="White"
>                     HorizontalAlignment="Left"/>
>             <Button Content="+10（带参命令）" Command="{Binding AddCommand}"
>                     CommandParameter="10" Padding="8" Margin="0,0,0,8"
>                     Background="#21262D" Foreground="White" HorizontalAlignment="Left"/>
>             <Button Content="清零（CanExecute 控制）" Command="{Binding ResetCommand}"
>                     Padding="8" Background="#DA3633" Foreground="White"
>                     HorizontalAlignment="Left"/>
>         </StackPanel>
>     </DockPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— ViewModelBase / Messenger 简化实现：**
> ```csharp
> using System;
> using System.ComponentModel;
> using System.Windows;
> using System.Windows.Input;
>
> namespace HmiDemo
> {
>     // 简化版 ViewModelBase：类似 MVVM Light 的基类，提供 Set<T> 通知方法
>     public abstract class ViewModelBase : INotifyPropertyChanged
>     {
>         public event PropertyChangedEventHandler PropertyChanged;
>         protected bool Set<T>(ref T field, T value, string name)
>         {
>             if (Equals(field, value)) return false;
>             field = value;
>             PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
>             return true;
>         }
>     }
>
>     // 简化版 Messenger：广播字符串消息到状态栏（类似 MVVM Light 的 Messenger.Default）
>     public static class Messenger
>     {
>         public static event Action<string> StatusChanged;
>         public static void Send(string message) => StatusChanged?.Invoke(message);
>     }
>
>     public class MainViewModel : ViewModelBase
>     {
>         private int _count;
>         private string _statusText = "就绪";
>
>         public int Count
>         {
>             get => _count;
>             private set => Set(ref _count, value, nameof(Count));
>         }
>
>         public string StatusText
>         {
>             get => _statusText;
>             private set => Set(ref _statusText, value, nameof(StatusText));
>         }
>
>         public ICommand AddCommand { get; }
>         public ICommand ResetCommand { get; }
>
>         public MainViewModel()
>         {
>             // 带参命令：RelayCommand<object> 接收 CommandParameter
>             AddCommand = new RelayCommand<object>(p =>
>             {
>                 var step = p == null ? 1 : Convert.ToInt32(p);
>                 Count += step;
>                 Messenger.Send("计数 +" + step + "，当前 " + Count);
>                 ResetCommand.RaiseCanExecuteChanged();
>             });
>             // CanExecute 命令：计数为 0 时"清零"按钮禁用
>             ResetCommand = new RelayCommand(() =>
>             {
>                 Count = 0;
>                 Messenger.Send("计数已清零");
>             }, () => Count > 0);
>
>             // 订阅 Messenger，自动更新状态栏
>             Messenger.StatusChanged += msg => StatusText = msg;
>         }
>     }
>
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
>     // 带参数版本
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
>             // 生产环境建议在 Loaded/Unloaded 中显式订阅与退订 Messenger
>             DataContext = new MainViewModel();
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 存量项目的维护与迁移：老上位机代码里随处可见 `ViewModelBase`/`Messenger.Default`，理解它才能维护
> ✅ 只需通知基类 + 命令 + 消息的轻量应用：不想引入 DI 容器/导航框架
> ✅ 学习 MVVM 框架原理的入门读物：类少、源码简单、一眼看穿
> ❌ 新项目从零开始：官方已推荐 CommunityToolkit.Mvvm，源生成器、弱引用消息更完善（见「communitytoolkitmvvm推荐」）
> ❌ 需要导航/模块化/容器集成的企业级应用：Prism 更合适（见「prism-企业级框架」）
> ❌ 需要响应式编程（Rx）的场景：ReactiveUI 是专门方案（见「reactiveui-响应式框架」）

> [!pitfall] 常见踩坑
> 坑 1：**`Messenger.Default` 订阅不退订 → 内存泄漏** → 静态事件永远强引用 VM。在 View 的 `Unloaded`/VM 的 `Deactivate` 里 `Unregister`（见「viewmodel-生命周期」）
>
> 坑 2：**误以为 MVVM Light 是微软官方框架** → 它是第三方开源库。资料中"微软推荐"指它被官方教程引用过，并非微软出品；官方现代推荐是 CommunityToolkit.Mvvm
>
> 坑 3：**`RelayCommand<T>` 与无参 `RelayCommand` 混用** → 绑定的命令与 `CommandParameter` 不匹配时 `Execute((T)parameter)` 转型失败抛异常。带参就统一用泛型版本
>
> 坑 4：**`Set<T>` 忘传属性名** → 无 `[CallerMemberName]` 的老版本里手写字符串，属性改名后通知静默失效。始终用 `nameof()`
>
> 坑 5：**新旧版本 API 混用** → `MvvmLightLibs`（.NET Framework）与 `MvvmLight`（.NET Core）命名空间/程序集有差异，升级大版本时注意 breaking changes

> [!best] 最佳实践
> - **新项目默认不选它**：除非维护老代码，新开发用 CommunityToolkit.Mvvm（微软官方维护、源生成器、弱引用消息），迁移指南见官方文档
> - **消息用强类型**：定义 `ProductCountChangedMessage` 类，而不是 `Messenger.Default.Send("count++")` 裸字符串——可读、可重构、可单测
> - **订阅与退订成对**：构造里 `Register`，`Deactivate`/`Unloaded` 里 `Unregister`（见「viewmodel-生命周期」）
> - **ViewModelLocator 只用做装配**：定位器里 new VM 并注入依赖，不要在定位器里写业务逻辑
> - **利用 `Set<T>` 的 bool 返回值**：`if (Set(ref _count, value, nameof(Count))) { /* 派生属性通知 */ }`——只在真正变化时联动，避免事件风暴
> - **迁移路线清晰化**：老代码迁移时按 `ViewModelBase`→`ObservableObject`、`RelayCommand`→`[RelayCommand]`、`Messenger`→`WeakReferenceMessenger` 三步走，逐步验证

> [!practice] 上手练习
> **Lv.1 复现验证**：运行示例，点"+1"看计数递增与状态栏"计数 +1"同步；点"+10"看参数如何经 `CommandParameter` 传入；计数为 0 时"清零"按钮置灰、计数 > 0 时点亮
> **Lv.2 拓展演练**：给 `Messenger` 增加第二类强类型消息（如"设备温度报警" `AlarmMessage`），由按钮触发发送，状态栏同时显示计数与报警两类消息——验证消息类型隔离
> **Lv.3 综合实战**：用 MVVM Light 风格改造一个真实小页面：`ViewModelBase` 派生"配方参数页"VM（配方号、下发按钮带 `CanExecute`），消息广播"配方已下发"，另一页面接收并显示
> **Lv.4 进阶挑战**：对比迁移：把同一 ViewModel 改写成 CommunityToolkit.Mvvm 的 `[ObservableProperty]` + `[RelayCommand]` + `WeakReferenceMessenger`，对照两版样板代码行数差异，写一篇迁移笔记

> [!related] 相关知识链接
> - ← 前置知识：[icommand-实现relaycommand-系列](./icommand-实现relaycommand-系列.md)（手写命令是理解 `RelayCommand` 的基石）；[inotifypropertychanged-实现](./inotifypropertychanged-实现.md)（`Set<T>` 就是通知样板的重构）
> - → 后续必学：[communitytoolkitmvvm推荐](./communitytoolkitmvvm推荐.md)（现代替代方案与迁移方向）；[viewmodel-间的通信](./viewmodel-间的通信.md)（Messenger 与事件聚合器是同一思想的两种实现）
> - ⇄ 关联概念：[什么是-mvvm](./什么是-mvvm.md)（框架解决的是 MVVM 的哪部分问题）；[prism-企业级框架](./prism-企业级框架.md)（重量级框架对比）
> - 📖 官方文档：https://github.com/lbugnion/mvvmlight （源码与归档文档）
