---
title: 常用 DI 容器
section: 07-mvvm
parent: 7.6 依赖注入
---

# 常用 DI 容器

> [!plain] 白话理解
> 选容器就像选工具箱：官方工具箱（`Microsoft.Extensions.DependencyInjection`）**轻、免费、随 .NET 出厂**，日常螺丝刀扳手够用；Autofac 是**功能更全的重型工具箱**，能按名称注册、按模块批量装配、动态代理拦截，大工程才用得上；Prism 则直接**把容器内嵌进框架**，跟着它的导航/模块系统一起走。
> 对绝大多数上位机项目，**官方容器就够了**：注册、解析、三种生命周期样样都有，而且零第三方依赖、社区文档最多。别一上来就上重型容器——等到确实需要"按名称解析""自动装配程序集"这类功能时再升级，代价只是改一处容器封装。

> [!def] 官方定义
> DI 容器（IoC Container）是负责**服务注册、依赖解析与实例生命周期管理**的库，核心 API 以 `IServiceCollection`（注册）和 `IServiceProvider`（解析）为骨架。常用容器及归属：
> - **Microsoft.Extensions.DependencyInjection**：.NET 官方内置容器，NuGet 包 `Microsoft.Extensions.DependencyInjection`；支持三种生命周期，`AddSingleton/AddScoped/AddTransient` 注册，`BuildServiceProvider()` 得到 `IServiceProvider`
> - **Autofac**：第三方重量级容器，NuGet 包 `Autofac`；独有按名称注册、程序集自动装配、动态代理（`Castle.Core` 拦截）等高级特性
> - **Unity**：微软模式与实践团队早期出品（现已停止更新维护，建议迁移）
> - **Prism**：WPF MVVM 框架内置容器（默认 DryIoc），也可替换为 Unity/Autofac/官方容器（见「prism-企业级框架」）
> 官方文档：https://learn.microsoft.com/zh-cn/dotnet/core/extensions/dependency-injection

> [!origin] 由来背景
> 2004 年依赖注入被正式命名后，Java 生态的 Spring 首先把"容器"做成了事实标准。.NET 早期则百花齐放：2008 年前后 Unity（微软模式与实践团队）、Autofac、Castle Windsor、Ninject 相继出现，各具特色——Autofac 以优雅的 Lambda 注册和模块化著称，Ninject 以极简语法闻名。
> 转折点是 2017 年 ASP.NET Core 的发布：官方把一套轻量容器内置进 `Microsoft.Extensions.DependencyInjection`，注册 API（`AddSingleton` 等）成为全 .NET 生态通用惯例。虽然它刻意保持朴素（不支持属性注入、按名称注册、拦截），但"零依赖 + 官方背书"让它成为默认选择；需要高级特性的项目仍会引入 Autofac 等容器，形成了"**先用官方，不够再升级**"的主流格局。

> [!essentials] 核心要点
> - **官方容器**（`Microsoft.Extensions.DependencyInjection`）：`AddSingleton/AddScoped/AddTransient` 注册 → `BuildServiceProvider()` → `GetRequiredService<T>()` 解析；不支持属性注入、按名称注册、拦截
> - **Autofac**：`ContainerBuilder` 构建，`RegisterType<T>().As<I>().SingleInstance()`；支持**按名称注册**、**程序集自动装配**（`RegisterAssemblyTypes`）、**属性注入**、**Castle 动态代理拦截**
> - **Prism 内置容器**：`RegisterTypes(IContainerRegistry)`，默认 DryIoc，可替换为 Unity/Autofac/Microsoft 容器，配 `Resolve<T>()`
> - **Scoped 支持差异**：官方容器原生支持 Scoped；Autofac 用 `InstancePerLifetimeScope()` 实现，Prism 中常以"区域/会话"创建子作用域
> - **性能**：解析性能上官方容器与 Autofac 均满足上位机需求；极高频解析（每帧数千次）才需关注，一般场景可忽略
> - **集成方式**：WPF 项目通常用 `Microsoft.Extensions.Hosting` 托管生命周期，或由框架（如 Prism）直接管理容器

> [!example] 完整示例
> **简易 DI 容器演示：模仿主流容器的核心 API（Register / Resolve / 单例与瞬时生命周期），注册通信服务后解析界面所需的 ViewModel。生产环境请使用 Microsoft.Extensions.DependencyInjection 或 Prism 自带容器：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="常用 DI 容器" Height="340" Width="420"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="20">
>         <TextBlock Text="容器解析结果" Foreground="#58A6FF" FontSize="16" FontWeight="Bold"/>
>         <TextBlock Text="通信服务实例（单例）" Foreground="#8B949E" Margin="0,15,0,4"/>
>         <TextBlock Text="{Binding CommInfo}" Foreground="White" FontSize="16"/>
>         <TextBlock Text="ViewModel 实例（瞬时）" Foreground="#8B949E" Margin="0,12,0,4"/>
>         <TextBlock Text="{Binding VmInfo}" Foreground="White" FontSize="16"/>
>         <TextBlock Text="{Binding Tip}" Foreground="#238636" Margin="0,12,0,0"
>                    TextWrapping="Wrap"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 支持生命周期的简易容器：**
> ```csharp
> using System;
> using System.Collections.Generic;
> using System.ComponentModel;
> using System.Windows;
>
> namespace HmiDemo
> {
>     // 通信服务：模拟串口/以太网与 PLC 通信
>     public class CommunicationService
>     {
>         public string PortName { get; set; } = "COM3";
>         public string GetInfo() => "串口 " + PortName + " 已连接（实例创建于 "
>                                     + CreatedTime.ToString("HH:mm:ss") + "）";
>         public DateTime CreatedTime { get; } = DateTime.Now;
>     }
>
>     // 简易容器：支持"单例"（Singleton）与"瞬时"（Transient）两种生命周期
>     public class MiniContainer
>     {
>         private readonly Dictionary<Type, Func<object>> _factories =
>             new Dictionary<Type, Func<object>>();
>         private readonly Dictionary<Type, object> _singletons =
>             new Dictionary<Type, object>();
>
>         // 单例：整个应用共享同一个实例（适合通信、配置等服务）
>         public void RegisterSingleton<T>(Func<object> factory) =>
>             _factories[typeof(T)] = () =>
>             {
>                 if (!_singletons.ContainsKey(typeof(T)))
>                     _singletons[typeof(T)] = factory();
>                 return _singletons[typeof(T)];
>             };
>
>         // 瞬时：每次解析都创建新实例（适合 ViewModel）
>         public void RegisterTransient<T>(Func<object> factory) =>
>             _factories[typeof(T)] = factory;
>
>         public T Resolve<T>() => (T)_factories[typeof(T)]();
>     }
>
>     public class MainViewModel : INotifyPropertyChanged
>     {
>         private readonly CommunicationService _comm;
>         public MainViewModel(CommunicationService comm) => _comm = comm;
>
>         public string CommInfo => _comm.GetInfo();
>         public string VmInfo => "当前 ViewModel 编号：" + GetHashCode();
>         public string Tip => "单例服务共享同一实例；瞬时 ViewModel 每次解析都是新的";
>
>         public event PropertyChangedEventHandler PropertyChanged;
>     }
>
>     public partial class MainWindow : Window
>     {
>         public MainWindow()
>         {
>             InitializeComponent();
>             // 组装容器并解析
>             var container = new MiniContainer();
>             container.RegisterSingleton<CommunicationService>(() => new CommunicationService());
>             container.RegisterTransient<MainViewModel>(() => new MainViewModel(container.Resolve<CommunicationService>()));
>
>             var vm = container.Resolve<MainViewModel>();
>             DataContext = vm;
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ **中小型上位机**：官方容器 + `Microsoft.Extensions.Hosting` 即可覆盖绝大多数注册/解析需求，够用且零额外依赖
> ✅ **需要程序集批量装配**（几十个服务按约定自动注册）：Autofac 的 `RegisterAssemblyTypes` 一行扫完，官方容器要逐条写
> ✅ **按名称注册同一接口多实现**（如多品牌 PLC 协议处理器）：Autofac `Named<T>`/`Keyed<T>` 注册是官方容器做不到的
> ✅ **Prism 框架项目**：用其内置容器（默认 DryIoc）与导航/模块系统无缝协作
> ❌ 三五个服务的教学 demo：手写组装甚至直接 `new` 即可，任何容器都是过度设计
> ❌ 需要 AOP 拦截（日志/事务横切）但不引入 Castle 的成本敏感项目：先用官方容器 + 手动装饰器模式

> [!pitfall] 常见踩坑
> 坑 1：**官方容器不支持按名称注册，硬塞字符串 key** → 现象：想解析"三菱协议"与"西门子协议"两个实现，官方容器 `AddSingleton<IProtocol>()` 会互相覆盖；原因：官方容器仅按类型注册；解决：改用 Autofac `Named<T>` 按名称注册，或用"注册字典/工厂"模式（`Func<string, IProtocol>`）
>
> 坑 2：**Prism 里混用两套容器 API** → 现象：`RegisterTypes` 里注册了，`IoC.Container` 却解析不到；原因：Prism 容器与外部 `ServiceCollection` 是两套体系，没有互通；解决：统一走 `IContainerRegistry`/`IContainerProvider` 接口，或显式做容器适配
>
> 坑 3：**解析放在组合根之外** → 现象：ViewModel 或服务类里直接 `container.Resolve<X>()`，测试时无法替换，容器引用满天飞；原因：把容器当服务定位器；解决：所有解析集中在启动处，业务对象一律构造函数注入

> [!best] 最佳实践
> - **默认官方容器**：从 `Microsoft.Extensions.DependencyInjection` + `Microsoft.Extensions.Hosting` 起步，文档多、零依赖，满足 80% 场景
> - **封装容器为"组合根"**：写一个 `AppServices`/`Bootstrapper` 类集中注册，后续切换容器只改这一处
> - **按需升级 Autofac**：需要按名称注册、自动装配、拦截时再引入，API 迁移成本低（注册语法相似）
> - **Prism 用内置容器**：`RegisterTypes` + `Resolve`，不要为省事绕开容器直接 `new`，否则导航与模块化会失效
> - **注册尽量用接口**：`services.AddSingleton<ICommunicationService, SerialCommunicationService>()`，消费方只认接口
> - **测试友好**：组合根之外不出现容器 API，单元测试直接 `new` 目标类并注入 Mock，不碰容器

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，看"通信服务实例"与"ViewModel 实例"的差异；把 `RegisterSingleton` 改成 `RegisterTransient`，重跑观察创建时间变化
> **Lv.2 小试牛刀**：给 `MiniContainer` 增加 `RegisterScoped<T>`（作用域：同一作用域内共享），并在两个窗口各建一个作用域，验证 `CommunicationService` 在窗口内唯一、窗口间不同
> **Lv.3 融会贯通**：引入 `Microsoft.Extensions.DependencyInjection` NuGet 包，用 `ServiceCollection` 重写示例（`AddSingleton`/`AddTransient`/`BuildServiceProvider`），体会两套 API 的对应关系
> **Lv.4 拆层挑战**：引入 Autofac，用 `ContainerBuilder` 注册两个实现了 `IProtocol` 的不同类并**按名称解析**（`ResolveKeyed`），模拟"切换三菱/西门子 PLC 协议"，比较官方容器做不到的地方

> [!related] 相关知识链接
> - ← 前置知识：[什么是依赖注入](./什么是依赖注入.md)（DI 思想与三要素）；[容器组成与生命周期](./容器组成与生命周期.md)（容器如何管理生命周期）
> - → 后续必学：[di-在-mvvm-中的应用](./di-在-mvvm-中的应用.md)（容器在 MVVM 项目中的完整装配）
> - ⇄ 关联概念：[prism-企业级框架](./prism-企业级框架.md)（Prism 内置容器用法）；[配置服务](./配置服务.md)（配置通常注册为单例服务）
> - 📖 官方文档：[Microsoft.Extensions.DependencyInjection](https://learn.microsoft.com/zh-cn/dotnet/core/extensions/dependency-injection) ；Autofac 官方文档 https://autofac.readthedocs.io/
