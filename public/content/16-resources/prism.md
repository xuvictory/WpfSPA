---
title: Prism
section: 16-resources
parent: 16.1 GitHub 优质 WPF 开源项目
---

# Prism

> [!plain] 白话理解
> 小项目用 `communitytoolkitmvvm` 就够了，但上位机软件一旦变成"主界面 + 多个功能模块 + 参数配置 + 用户权限 + 设备管理"这种规模，界面之间互相跳转、数据互相传递就容易乱成一锅粥。**Prism** 就是给这种"大工程"设计的框架：它帮你把界面切成一个个**模块（Module）**，用**区域（Region）**管理界面挂载点，用**导航（Navigation）**规范页面切换，用**事件聚合器（EventAggregator）**让模块之间"隔空喊话"，还内置了依赖注入容器。相当于给项目装上"交通指挥系统"。

> [!def] 官方定义
> **Prism** 是一个用于构建松散耦合、可维护、可测试的 WPF/XAML 应用的**开源框架**（GitHub：https://github.com/PrismLibrary/Prism ，NuGet：`Prism.Wpf` / `Prism.DryIoc` / `Prism.Unity`）。它的起源是微软 Patterns & Practices 团队在 **2008 年发布的 Composite Application Guidance for WPF**（俗称 Prism 4），用于指导企业级复合应用的模块化开发；**Prism 6 起由社区接管维护**（Brian Lagunas 等维护者），目前仍是 .NET 社区事实标准的 WPF 企业框架之一。它**不是微软官方维护的产品**（微软只在官网文档中引用过这套指导：https://learn.microsoft.com/zh-cn/previous-versions/msp-n-p/ff648465(v=pandp.10)），核心能力包括：MVVM 基类（`BindableBase`）、依赖注入（DryIoc/Unity 容器抽象）、`Region` 区域导航、`EventAggregator` 弱引用事件、`IDialogService` 对话框服务、模块化加载（`IModule`）。

> [!origin] 由来背景
> Prism 诞生于 2008 年，微软 Patterns & Practices 团队在银光与 WPF 时代为"大型复合应用"推出的指导方案，目的解决大团队并行开发时界面强耦合、难以测试的问题。后来微软逐步收缩该类项目，**Prism 6 之后（2016 年起）转由社区维护**，Brian Lagunas 等核心成员主导演进，支持 .NET Core/.NET 5+、DryIoc 容器、`RegionAdapter` 扩展等现代特性。在上位机行业，Prism 常用于**大型产线级管理软件**（多工位、多工序、模块化插件式架构），而单机小工具则倾向轻量方案。

> [!essentials] 核心要点
> - **Shell + Module**：`App` 用 `PrismApplication`，`RegisterTypes` 注册服务，`CreateShell` 返回主窗口；功能模块实现 `IModule.RegisterTypes/OnInitialized`
> - **Region 区域**：`<ContentControl prism:RegionManager.RegionName="MainRegion"/>` 定义挂载点，`_regionManager.RequestNavigate("MainRegion", "DeviceView")` 切换内容
> - **导航**：`INavigationAware` 接口（`OnNavigatedTo/OnNavigatedFrom`）管理页面生命周期，导航参数用 `NavigationParameters`
> - **事件聚合器**：`IEventAggregator.GetEvent<TEvent>().Publish(payload)` / `.Subscribe(...)`，模块间解耦通信
> - **对话框**：`IDialogService.ShowDialog("DeviceEditDialog", param, callback)` 统一管理弹窗，替代直接 `new Window`
> - **DI 容器**：默认 DryIoc（`Prism.DryIoc`），构造函数注入服务，便于单元测试替换

> [!example] 完整示例
> **Prism 区域导航 + 事件聚合：设备列表跳转到设备详情：**
>
> **App.xaml.cs —— 程序入口：**
> ```csharp
> using System.Windows;
> using Prism.DryIoc;
> using Prism.Ioc;
> using Prism.Modularity;
> using Prism.Regions;
>
> namespace HmiDemo
> {
>     public partial class App : PrismApplication
>     {
>         // 需通过 NuGet 安装 Prism.DryIoc 包（Install-Package Prism.DryIoc）
>         protected override Window CreateShell() => Container.Resolve<MainWindow>();
>
>         protected override void RegisterTypes(IContainerRegistry containerRegistry)
>         {
>             containerRegistry.RegisterForNavigation<DeviceListView>();
>             containerRegistry.RegisterForNavigation<DeviceDetailView>();
>         }
>
>         protected override void ConfigureModuleCatalog(IModuleCatalog moduleCatalog)
>         {
>             // 模块化加载：设备模块独立成册，可热插拔
>             moduleCatalog.AddModule<DeviceModule>();
>         }
>     }
> }
> ```
>
> **DeviceListView.xaml.cs —— 列表页导航跳转：**
> ```csharp
> using System.Windows;
> using Prism.Regions;
>
> namespace HmiDemo
> {
>     public partial class DeviceListView
>     {
>         private readonly IRegionManager _regionManager;
>
>         public DeviceListView(IRegionManager regionManager)
>         {
>             _regionManager = regionManager;
>             InitializeComponent();
>         }
>
>         private void OnOpenDetail(object sender, RoutedEventArgs e)
>         {
>             // 带参数跳转到设备详情页
>             var parameters = new NavigationParameters { { "deviceId", 1001 } };
>             _regionManager.RequestNavigate("MainRegion", "DeviceDetailView", parameters);
>         }
>     }
> }
> ```
>
> **DeviceDetailView.xaml.cs —— 详情页接收参数：**
> ```csharp
> using System.Windows;
> using Prism.Mvvm;
> using Prism.Regions;
>
> namespace HmiDemo
> {
>     public partial class DeviceDetailView : Window, INavigationAware
>     {
>         public DeviceDetailView() => InitializeComponent();
>
>         public void OnNavigatedTo(NavigationContext navigationContext)
>         {
>             if (navigationContext.Parameters.TryGetValue("deviceId", out int deviceId))
>             {
>                 Title = "设备详情 #" + deviceId;
>             }
>         }
>
>         public bool IsNavigationTarget(NavigationContext navigationContext) => false;
>         public void OnNavigatedFrom(NavigationContext navigationContext) { }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 产线级管理软件：多模块（设备/生产/质量/报表）并行开发与独立发布
> ✅ 界面需要"区域复用"：同一区域按导航切换不同页面（左导航 + 右内容）
> ✅ 需要模块间解耦通信：报警模块通知主界面弹窗
> ✅ 大项目需要统一依赖注入、可测试架构
> ❌ 单机小工具、两三个界面的项目（引入 Prism 反而增加学习与启动成本）
> ❌ 团队无 DI/模块化经验且工期紧的项目（可先用 `communitytoolkitmvvm` 过渡）

> [!pitfall] 常见踩坑
> 坑 1：**ViewModel 拿不到 Region 相关服务** → 现象：`IRegionManager` 注入为 null 或导航不生效 → 原因：视图没有通过容器解析（直接 `new View()`），或未在 `RegisterTypes` 里 `RegisterForNavigation` → 解决：导航目标必须用 `RegisterForNavigation<TView>()` 注册，且通过容器获取视图
>
> 坑 2：**Region 反复导航后界面越来越多** → 现象：每次 `RequestNavigate` 后 Region 里堆叠多个视图 → 原因：目标视图未实现 `INavigationAware`/未让 Region 复用，或 `KeepAlive` 配置不当 → 解决：统一实现 `INavigationAware` 并正确返回 `IsNavigationTarget`，用 `NavigationParameters` 传参而不是反复创建
>
> 坑 3：**Prism 7 升级到 8/9 后 `PrismApplication` 行为差异** → 现象：升级后启动或模块加载异常 → 原因：8+ 调整了模块初始化与容器注册 API → 解决：升级前阅读官方迁移指南（https://prismlibrary.github.io/docs/wpf/legacy/migrating-to-prism-8.html ），并锁版本管理

> [!best] 最佳实践
> - 用 `RegisterForNavigation` 统一注册导航视图，避免视图被直接 `new` 破坏依赖注入
> - 模块间通信优先 `EventAggregator`，不要直接持有对方模块的引用
> - 导航参数用强类型对象或 `NavigationParameters`，避免魔法字符串满天飞
> - 弹窗统一走 `IDialogService`，保证 Dialog 也能走 DI 与导航
> - 大项目按模块拆 `IModule`，用 `ModuleCatalog` 控制加载与发布边界

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行本节示例，把设备详情标题改成显示设备名称而不是编号
> **Lv.2 小试牛刀**：新增一个"报警列表"导航页，从主界面按钮跳转过去
> **Lv.3 融会贯通**：用 `EventAggregator` 实现"报警发生时主界面自动弹出 Growl 通知"
> **Lv.4 拆层挑战**：把一个既有小项目改造为 Prism 模块化架构：Shell + 设备模块 + 报表模块，模块间零强引用

> [!related] 相关知识链接
> - ← 前置知识：[`什么是-mvvm`](什么是-mvvm)、[`什么是依赖注入`](什么是依赖注入)（07）
> - → 后续必学：[`communitytoolkitmvvm`](communitytoolkitmvvm)（轻量替代方案对比）
> - ⇄ 关联概念：[`mef-与-prism-modules`](mef-与-prism-modules)（12，插件式架构）
> - 📖 官方文档：https://prismlibrary.github.io/docs/ ；GitHub：https://github.com/PrismLibrary/Prism
