---
title: 常用 DI 容器
section: 07-mvvm
parent: 7.6 依赖注入
---

# 常用 DI 容器

> [!plain] 白话理解
> "常用 DI 容器"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"常用 DI 容器"是一个重要的知识点。MVVM 是 WPF 开发的黄金标准。学好 MVVM，你的代码将变得清晰、可测试、可维护。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> 常用 DI 容器是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> 常用 DI 容器的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：MVVM 是 WPF 开发的黄金标准。学好 MVVM，你的代码将变得清晰、可测试、可维护。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"常用 DI 容器"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

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
> 

> [!scene] 适用场景
> ✅ 上位机数据展示与交互界面开发
> ✅ 工业自动化设备状态监控系统
> ✅ 需要高效数据绑定的实时数据处理场景
> ✅ 多窗口、多页面复杂导航的企业级应用
> ❌ 简单的控制台工具程序（用控制台更省事）
> ❌ 对性能要求极端苛刻的底层驱动开发（用 C++ 更合适）

> [!pitfall] 常见踩坑
> 坑 1：**概念理解不清就上手** → 建议先把本章节的前置知识点学完，理解基础原理后再动手写代码
> 
> 坑 2：**忽略了官方文档** → Microsoft Docs 上有最权威的说明和最完整的示例代码，遇到问题先查文档
>
> 坑 3：**代码写的太"一次性"** → 养成写可复用代码的习惯，以后项目中会反复用到这些知识

> [!best] 最佳实践
> - 编写代码时保持一致的命名规范（PascalCase 用于公共成员，_camelCase 用于私有字段）
> - 善用 Visual Studio 的智能提示和代码片段，提高开发效率
> - 每个关键代码块加上注释，解释"为什么这样写"而不仅仅是"写的是什么"
> - 遵循 SOLID 原则，尤其是单一职责原则：一个类只做一件事
> - 经常重构：写完功能后回头看看有没有更简洁的写法

> [!practice] 上手练习
> **Lv.1 照猫画虎**：阅读并运行本节示例代码，确保程序可以正常运行，修改一些参数观察效果变化
> **Lv.2 小试牛刀**：在示例代码的基础上，添加一个小功能或修改一项设置，观察程序的响应
> **Lv.3 融会贯通**：结合前面学过的知识，用"常用 DI 容器"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"常用 DI 容器"
> - → 后续必学：掌握"常用 DI 容器"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
