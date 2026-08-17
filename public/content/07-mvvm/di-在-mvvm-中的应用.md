---
title: DI 在 MVVM 中的应用
section: 07-mvvm
parent: 7.6 依赖注入
---

# DI 在 MVVM 中的应用

> [!plain] 白话理解
> 没有 DI 的 MVVM 是"半套 MVVM"：View 不碰业务逻辑，但 ViewModel 里还塞着 `new`——`new Logger()`、`new SerialService()`，换硬件、加 Mock 都得翻 ViewModel。DI 补上这块拼图：**ViewModel 的构造函数列出它需要的一切服务，由装配处一次性喂进来**。
> 类比产线：ViewModel 是工位，服务是物料。不用 DI 时，每个工位自己开仓库领料（自己 new），换个批次物料要改工位；用 DI 后，物料由配送线（容器）统一送，工位只写"我要 X 型号物料"（构造函数参数）。界面只需一句 `Resolve<MainViewModel>()`，背后整棵依赖树自动搭好。

> [!def] 官方定义
> 在 MVVM 模式中，**ViewModel 负责将 View 的状态与行为转换为可绑定属性与命令**（见「mvvm-各层职责」），其服务依赖（日志、通信、数据访问等）通过 DI 注入，通常采用**构造函数注入**：`public MainViewModel(ILogger logger, IAlarmService alarm)`。
> 装配工作由**组合根（Composition Root）**承担——WPF 中通常位于 `App.xaml.cs` 或窗口创建处，它把"接口 → 实现 → 生命周期"登记进 `IServiceCollection`，再 `BuildServiceProvider()` 得到 `IServiceProvider`，最后 `GetRequiredService<MainViewModel>()` 解析出完整对象图。ViewModel 与 View 的绑定（`DataContext = vm`）由 `ViewModels 定位`或导航框架（Prism）在解析后自动完成。
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/architecture/modern-web-apps-azure/architectural-principles#dependency-inversion

> [!origin] 由来背景
> MVVM 自 2005 年提出以来，"ViewModel 怎么拿服务"一直靠 `new`：早期示例代码里 `new` 直接写在 VM 构造里，硬件实现换一个，VM 跟着改一遍；单元测试想验证 VM 逻辑，只能连真实设备。这正是依赖注入要解决的痛点。
> .NET 2017 年内置官方容器后，社区形成了标准套路：**`App.xaml.cs` 做组合根**，注册服务与 ViewModel，解析后赋给 `DataContext`；2019 年 `Microsoft.Extensions.Hosting` 普及后，又演进出 `Host.CreateDefaultBuilder` 托管 WPF 的写法，容器的创建、释放、日志配置全部交给 Host。至此，DI 成为 MVVM 工程化项目的事实标配——"VM 的构造函数就是它的依赖清单"成了共识。

> [!essentials] 核心要点
> - **ViewModel 只依赖接口**：`IAlarmService`、`ILogger`，不依赖 `DeviceAlarmService`、`ConsoleLogger` 具体类
> - **构造函数注入是首选**：`MainViewModel(IAlarmService alarm, ILogger logger)` —— 构造函数本身就成了"依赖清单"，可读性最好
> - **组合根负责装配**：`App.xaml.cs`（或引导类）中完成全部注册与首次解析，业务类不碰容器
> - **View 不参与 DI**：XAML 中 `DataContext` 通常由代码设置或 `Locator` 解析，View 只拿已组装好的 VM
> - **服务间的依赖同样靠注入**：`DeviceAlarmService(ILogger logger)` 说明服务层也可以（也应该）用构造注入
> - **换实现只改注册处**：`AddSingleton<IAlarmService, DeviceAlarmService>()` 换成 Mock 实现，VM 与 View 零改动

> [!example] 完整示例
> **DI 在 MVVM 中的应用演示：ViewModel 通过构造函数同时注入日志服务与数据服务，MainWindow 用一行代码从简易容器解析出组装好的 ViewModel：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="DI 在 MVVM 中的应用" Height="360" Width="420"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="20">
>         <TextBlock Text="设备报警面板（DI 组装）" Foreground="#58A6FF"
>                    FontSize="16" FontWeight="Bold"/>
>         <TextBlock Text="最新报警" Foreground="#8B949E" Margin="0,15,0,4"/>
>         <TextBlock Text="{Binding AlarmText}" Foreground="#DA3633" FontSize="16"
>                    FontWeight="Bold" TextWrapping="Wrap"/>
>         <TextBlock Text="日志（由注入的日志服务记录）" Foreground="#8B949E" Margin="0,12,0,4"/>
>         <Border Background="#161B22" Padding="8" CornerRadius="4" Margin="0,0,0,15">
>             <TextBlock Text="{Binding LogText}" Foreground="#8B949E"
>                        FontFamily="Consolas" TextWrapping="Wrap"/>
>         </Border>
>         <Button Content="触发一次报警" Command="{Binding RaiseAlarmCommand}" Padding="8"
>                 Background="#21262D" Foreground="White" HorizontalAlignment="Left"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 服务注入与简易容器：**
> ```csharp
> using System;
> using System.Collections.Generic;
> using System.ComponentModel;
> using System.Windows;
> using System.Windows.Input;
>
> namespace HmiDemo
> {
>     // 日志服务
>     public interface ILogger { void Log(string message); }
>     public class ConsoleLogger : ILogger
>     {
>         public void Log(string message) { /* 生产环境写入文件/数据库 */ }
>     }
>
>     // 报警服务：依赖日志服务（服务之间的依赖也靠注入）
>     public interface IAlarmService { string GetLatestAlarm(); }
>     public class DeviceAlarmService : IAlarmService
>     {
>         private readonly ILogger _logger;
>         public DeviceAlarmService(ILogger logger) => _logger = logger;
>         public string GetLatestAlarm() => "电机过载（E-301），请检查负载";
>     }
>
>     public class MainViewModel : INotifyPropertyChanged
>     {
>         private readonly IAlarmService _alarmService;
>         private readonly ILogger _logger;
>         private string _alarmText = "无报警";
>         private string _logText = "系统初始化完成";
>
>         public MainViewModel(IAlarmService alarmService, ILogger logger)
>         {
>             _alarmService = alarmService;
>             _logger = logger;
>             RaiseAlarmCommand = new RelayCommand(RaiseAlarm);
>         }
>
>         public string AlarmText { get; private set; }
>         public string LogText { get; private set; }
>         public ICommand RaiseAlarmCommand { get; }
>
>         private void RaiseAlarm()
>         {
>             AlarmText = _alarmService.GetLatestAlarm();
>             LogText = _logger.GetType().Name + "：已记录报警 " + DateTime.Now.ToString("HH:mm:ss");
>             OnPropertyChanged(nameof(AlarmText));
>             OnPropertyChanged(nameof(LogText));
>         }
>
>         public event PropertyChangedEventHandler PropertyChanged;
>         private void OnPropertyChanged(string name) =>
>             PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
>     }
>
>     // 简易 IoC 容器：注册类型后按需解析并自动注入构造函数依赖
>     public class SimpleContainer
>     {
>         private readonly Dictionary<Type, Func<object>> _registrations =
>             new Dictionary<Type, Func<object>>();
>
>         public void Register<T>(Func<object> factory) =>
>             _registrations[typeof(T)] = factory;
>
>         public T Resolve<T>()
>         {
>             if (_registrations.TryGetValue(typeof(T), out var factory))
>                 return (T)factory();
>             throw new InvalidOperationException("未注册类型：" + typeof(T).Name);
>         }
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
>             // 容器组装：注册服务 → 解析 ViewModel（依赖自动注入）
>             var container = new SimpleContainer();
>             container.Register<ILogger>(() => new ConsoleLogger());
>             container.Register<IAlarmService>(() => new DeviceAlarmService(container.Resolve<ILogger>()));
>             container.Register<MainViewModel>(() => new MainViewModel(
>                 container.Resolve<IAlarmService>(), container.Resolve<ILogger>()));
>             DataContext = container.Resolve<MainViewModel>();
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ **ViewModel 依赖 2 个以上服务**的上位机页面：日志 + 通信 + 报警共同协作，构造注入让依赖一目了然
> ✅ **服务之间存在依赖链**：`DeviceAlarmService` 内部还要用 `ILogger`——DI 把整棵依赖树自动搭好
> ✅ **需要单元测试的业务逻辑**：测试时注入 `MockLogger`/`MockAlarmService`，验证 VM 的 `RaiseAlarm` 行为而不碰真实设备
> ✅ **同一 VM 复用不同实现**：调试环境用模拟报警源、生产环境用真实报警源，只改注册处一行
> ❌ 无服务依赖的纯展示 VM（绑定几个静态属性）：不需要 DI，`new` 即可
> ❌ 单窗口、单服务的教学 demo：DI 的样板代码超过其收益

> [!pitfall] 常见踩坑
> 坑 1：**在 XAML 里 `DataContext` 直接 `new` 服务或 VM** → 现象：界面能跑，但换实现要改 XAML、无法注入 Mock；原因：绕过了组合根，DI 形同虚设；解决：`DataContext` 一律由代码在组合根解析后赋值（或 ViewModelLocator 自动绑定）
>
> 坑 2：**VM 构造函数加了新依赖，忘了注册** → 现象：启动时 `InvalidOperationException: Unable to resolve service for type 'ILogger'`；原因：容器没有该服务的注册项；解决：注册集中在组合根，报错信息提示"哪个服务没注册"，对照提示补 `AddSingleton<I..., ...>()` 即可
>
> 坑 3：**把容器引用塞进 ViewModel** → 现象：VM 里出现 `container.Resolve<ILogger>()`；原因：VM 拿到的是容器而非依赖本身，测试时无法替换；解决：VM 只收服务实例，容器只在组合根出现

> [!best] 最佳实践
> - **组合根收拢到 `App.xaml.cs`**：注册 + 首次解析都在这一个文件里，项目里搜不到第二个容器引用
> - **VM 依赖全部写进构造函数**：用 `readonly` 字段接收，杜绝属性注入和"半初始化"状态
> - **注册顺序无关但命名清晰**：`AddSingleton<IAlarmService, DeviceAlarmService>()` 接口在前、实现在后，全项目统一这种写法
> - **服务生命周期遵循"共享需求"**：通信/日志/配置单例，页面级服务瞬时，数据库上下文按会话（见「容器组成与生命周期」）
> - **面向接口的回归测试**：为每个服务保留一个 Mock 实现类，单元测试注入 Mock，集成测试注入真实实现
> - **配合框架时走框架 API**：Prism 项目用 `RegisterTypes(IContainerRegistry)`，不要另起炉灶再建一套容器

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，点击"触发一次报警"，观察报警文本与日志行更新；把 `ConsoleLogger` 换成自写的 `FileLogger`（写一行文本文件），只改注册处，确认 VM 与 XAML 零改动
> **Lv.2 小试牛刀**：新增 `IDataService` 接口与 `PlcDataService` 实现（返回当前温度），让 `MainViewModel` 构造函数再注入它，页面新增一个 `TextBlock` 显示温度，点击按钮时一并刷新
> **Lv.3 融会贯通**：用 `Microsoft.Extensions.DependencyInjection` 重写组合根：`ServiceCollection` 注册 → `BuildServiceProvider` → `GetRequiredService<MainViewModel>()`，把容器生命周期接到 `Application.Exit` 上统一释放
> **Lv.4 拆层挑战**：引入 Prism（或模仿其思路）：实现一个极简 `ViewModelLocator`——按"VM 类型 → 对应窗口类型"约定自动解析并设置 `DataContext`，让 XAML 中完全看不到任何 `new` 和容器代码

> [!related] 相关知识链接
> - ← 前置知识：[mvvm-各层职责](./mvvm-各层职责.md)（VM 的职责边界）；[什么是依赖注入](./什么是依赖注入.md)（DI 三要素）；[容器组成与生命周期](./容器组成与生命周期.md)（容器的生命周期管理）
> - → 后续必学：[常用-di-容器](./常用-di-容器.md)（选型与高级特性）；[项目结构与目录规划](./项目结构与目录规划.md)（组合根在工程中的落位）
> - ⇄ 关联概念：[数据访问repository-模式](./数据访问repository-模式.md)（通常以服务注入 VM）；[日志服务集成](./日志服务集成.md)（注入 `ILogger` 的实战）
> - 📖 官方文档：[依赖注入指南](https://learn.microsoft.com/zh-cn/dotnet/core/extensions/dependency-injection)；[DI 设计原则（Microsoft Learn 架构指南）](https://learn.microsoft.com/zh-cn/dotnet/architecture/modern-web-apps-azure/architectural-principles#dependency-inversion)
