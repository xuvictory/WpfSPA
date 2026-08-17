---
title: CommunityToolkit.Mvvm
section: 16-resources
parent: 16.1 GitHub 优质 WPF 开源项目
---

# CommunityToolkit.Mvvm

> [!plain] 白话理解
> 写 MVVM 最烦的就是"重复劳动"：每个属性都要写 `INotifyPropertyChanged` 的 `SetProperty`，每个按钮都要手写 `ICommand` 类。**CommunityToolkit.Mvvm** 帮你把这些样板代码全部消灭——你只需写一句 `[ObservableProperty]` 或 `[RelayCommand]`，编译器自动帮你生成对应的属性和命令。它就像"语法糖"大礼包，让 ViewModel 清爽得像写普通类一样。

> [!def] 官方定义
> **CommunityToolkit.Mvvm**（旧称 Microsoft.Toolkit.Mvvm）是**微软官方维护**的 .NET MVVM 工具包（GitHub：https://github.com/CommunityToolkit/dotnet ，NuGet：`CommunityToolkit.Mvvm`），是 .NET Community Toolkit 的一部分，基于**源生成器（Source Generator）**技术在编译期生成 `INotifyPropertyChanged` 与 `ICommand` 的实现代码。它**不是独立框架**，而是与 WPF 官方绑定机制（https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/data/ ）配合的工具类库：`ObservableObject`、`RelayCommand`、`[ObservableProperty]`、`[RelayCommand]`、`ObservableValidator` 等。官方文档：https://learn.microsoft.com/zh-cn/dotnet/communitytoolkit/mvvm/ 。由于是微软官方出品且零运行时依赖，它已成为现代 WPF/上位机项目 MVVM 绑定的首选。

> [!origin] 由来背景
> 社区工具包源于微软 2018 年前后启动的 **Windows Community Toolkit** 系列，最初覆盖 UWP/WinUI，后扩展出 .NET 平台工具包。其中 MVVM 部分吸收了社区对 `MVVMLight`（Laurent Bugnion 维护，后停止更新）的沉淀，于 2020 年更名为 CommunityToolkit.Mvvm 并加入源生成器支持。**关键转折是 MVVMLight 在 2021 年宣布不再维护**，大量 WPF 开发者迁移到 CommunityToolkit.Mvvm，使它成为 .NET 生态 MVVM 绑定的事实标准。上位机项目用它做 ViewModel，配合 `handycontrol` 等控件库已成为主流组合。

> [!essentials] 核心要点
> - **`ObservableObject`**：基类，内置 `SetProperty`/`OnPropertyChanged`，继承后属性通知开箱即用
> - **`[ObservableProperty]`**：字段加特性自动生成属性；`partial` 方法 `OnXxxChanged` 可钩子式处理变更
> - **`[RelayCommand]`**：方法加特性自动生成 `ICommand` 属性；支持 `AsyncRelayCommand` 直接处理异步命令
> - **`RelayCommand<T>`**：带参数命令，如 `[RelayCommand] void Start(int deviceId)`
> - **`ObservableValidator`**：内置 `INotifyDataErrorInfo` 支持，配合 `[Validation]` 特性做表单校验
> - **`Messenger`**：`WeakReferenceMessenger.Default.Send/Register` 实现解耦通信（轻量版事件聚合器）
> - **零依赖**：不依赖 WPF，纯 .NET 库，可在测试项目中直接使用

> [!example] 完整示例
> **CommunityToolkit.Mvvm 源生成器：设备启停 ViewModel：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="CommunityToolkit.Mvvm 演示" Height="300" Width="420"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="20">
>         <TextBlock Text="设备启停控制（源生成器 MVVM）" Foreground="#58A6FF"
>                    FontWeight="Bold" Margin="0,0,0,15"/>
>         <TextBlock Text="{Binding DeviceName}" Foreground="White" FontSize="18" Margin="0,0,0,10"/>
>         <TextBlock Text="{Binding StatusText}" Foreground="#8B949E" Margin="0,0,0,15"/>
>         <Button Content="启动" Command="{Binding StartCommand}" Width="120"
>                 Padding="8" Margin="0,0,0,8"/>
>         <Button Content="停止" Command="{Binding StopCommand}" Width="120"
>                 Padding="8"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow()
>         {
>             InitializeComponent();
>             // 需通过 NuGet 安装 CommunityToolkit.Mvvm 包
>             DataContext = new DeviceViewModel();
>         }
>     }
> }
> ```
>
> **DeviceViewModel.cs —— 源生成器 ViewModel：**
> ```csharp
> using CommunityToolkit.Mvvm.ComponentModel;
> using CommunityToolkit.Mvvm.Input;
>
> namespace HmiDemo
> {
>     public partial class DeviceViewModel : ObservableObject
>     {
>         [ObservableProperty]
>         private string _deviceName = "1 号水泵";
>
>         [ObservableProperty]
>         private string _statusText = "待机";
>
>         [RelayCommand]
>         private void Start()
>         {
>             StatusText = "运行中";
>         }
>
>         [RelayCommand]
>         private void Stop()
>         {
>             StatusText = "已停止";
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 所有需要 MVVM 绑定的 WPF 项目（中小型主力方案）
> ✅ 与 `handycontrol`、`materialdesigninxaml` 等控件库自由搭配
> ✅ 需要表单校验（`ObservableValidator`）的参数配置界面
> ✅ 需要单元测试 ViewModel（零 WPF 依赖，可直接 new）
> ❌ 需要模块化、区域导航等企业级能力的大型项目（选 `prism` 更合适）
> ❌ 团队坚持手写 `INotifyPropertyChanged` 且不接受代码生成的场景

> [!pitfall] 常见踩坑
> 坑 1：**`[ObservableProperty]` 不生成属性** → 现象：XAML 绑定 `DeviceName` 编译不通过或运行不更新 → 原因：类必须 `partial` 且继承 `ObservableObject`，且项目需 C# 8+/.NET Standard 2.1 以上 → 解决：确认 `public partial class` + 继承基类，检查 `LangVersion`
>
> 坑 2：**`[RelayCommand]` 生成命令名与预期不符** → 现象：方法叫 `StartAsync`，生成的命令名是 `StartAsyncCommand` 而不是期望的 `StartCommand` → 原因：命令命名规则是"方法名 + Command" → 解决：用 `[RelayCommand(CommandName = "StartCommand")]` 显式指定，或按默认规则引用
>
> 坑 3：**后台线程改属性界面不刷新/异常** → 现象：通信线程直接给属性赋值，UI 偶发异常 → 原因：`SetProperty` 在非 UI 线程调用 → 解决：数据采集回调里用 `Dispatcher` 或 `AsyncRelayCommand` 切线程（第 8 章异步有详细方案）

> [!best] 最佳实践
> - ViewModel 一律继承 `ObservableObject`，字段命名 `_camelCase`，交给源生成器统一处理
> - 异步操作（启动/停止/采集）用 `AsyncRelayCommand`，它自带执行中禁用的 `CanExecute` 逻辑
> - 表单校验用 `ObservableValidator` + `[Validation]`，配合 `BindValidation` 模板显示错误
> - 模块间简单通信用 `WeakReferenceMessenger.Default`，避免强引用事件导致的内存泄漏
> - 保持 ViewModel 不引用 `System.Windows`，让单测与 UI 分离（第 12 章可测试架构）

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行本节示例，给 `DeviceName` 加一个运行时修改按钮，观察绑定自动刷新
> **Lv.2 小试牛刀**：给 `StopCommand` 增加 `CanExecute` 条件（设备未启动时停止按钮禁用）
> **Lv.3 融会贯通**：把 `Start()` 改成 `AsyncRelayCommand`，模拟 2 秒启动延时并显示"启动中…"
> **Lv.4 拆层挑战**：用 `ObservableValidator` 做一个带必填、范围校验的设备参数表单，并用 `WeakReferenceMessenger` 把保存结果通知主界面

> [!related] 相关知识链接
> - ← 前置知识：[`什么是-mvvm`](什么是-mvvm)、[`inotifypropertychanged-实现`](inotifypropertychanged-实现)、[`icommand-实现relaycommand-系列`](icommand-实现relaycommand-系列)（07）
> - → 后续必学：[`prism`](prism)（大型项目的框架化方案）
> - ⇄ 关联概念：[`propertychangedfody`](propertychangedfody)（IL 编织方案对比）、[`handycontrol`](handycontrol)（界面搭配）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/communitytoolkit/mvvm/ ；GitHub：https://github.com/CommunityToolkit/dotnet
