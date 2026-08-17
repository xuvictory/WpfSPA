---
title: Prism 模块划分
section: 14-projects
parent: 14.4 项目四：智能仓储管理系统 WMS（中高级）
---

# Prism 模块划分

> [!plain] 白话理解
> 仓储管理系统包含的功能不止一个：货品库位维护、出入库作业、统计报表……如果全部塞进一个窗体、一个项目，改一处动全身，几个开发同时改一个文件还容易冲突。Prism 的答案是**模块化**：把系统按功能切成一个个独立"模块"（Module），每个模块有自己独立的界面和逻辑，各自编译、各自维护，最后在壳程序（Shell）里像拼积木一样装配起来。
> 示例用 TabControl 模拟了三个模块（仓储/出入库/报表），每个 Tab 对应一个独立模块视图，底部状态栏显示当前激活模块。真实 Prism 项目里，这个"切换"由 RegionManager 在界面区域（Region）中完成，模块还可以**按需加载**——用哪个功能才加载哪个程序集，启动更快、故障隔离。理解了"功能切分 + 独立注册 + 区域导航"，就抓住了 Prism 模块化的骨架。

> [!def] 官方定义
> **Prism** 是微软 Patterns & Practices 团队推出的 WPF/Xamarin 框架，围绕 **MVVM**、**依赖注入（DI）**、**模块化（Modularity）** 与**区域导航（Region Navigation）**四大主题组织复合应用。模块化核心概念：
> - **Module（模块）**：一个独立程序集，通过 `IModule` 的 `RegisterTypes`/`OnInitialized` 注册服务与视图；
> - **Region（区域）**：界面上由 `RegionManager` 管理的占位区域，视图按需注入/切换；
> - **Shell（壳）**：承载区域的主窗口，负责模块装配。
> 官方文档见 https://prismlibrary.github.io/docs/wpf/ 及微软归档页 https://learn.microsoft.com/zh-cn/previous-versions/msp-n-p/ff921074(v=pandp.40)

> [!origin] 由来背景
> Prism 的模块化思想源自 2000 年代大型复合应用（Composite Applications）的工程挑战：微软在开发 Smart Client（智能客户端）时发现，桌面应用做到几十个功能模块、多团队并行时，"单体程序集 + 全局耦合"会让开发与发布寸步难行。微软 Patterns & Practices 团队于是推出 Prism（2008 年首版），借鉴复合 UI 模式（Composite UI Application Block 的前身 CAB 的教训），提出"模块 = 独立程序集 + 按需加载 + 区域装配"的架构。
> 对 WMS 这类系统，模块化意味着：仓储模块、出入库模块、报表模块可以由不同人并行开发；发布新版本只更新改动的模块；一个模块崩溃不影响整个壳。本篇用 Tab 模拟了"区域切换"的直观效果，真正接入 Prism 时，把 Tab 换成 `Region`、把按钮换成 `IRegionManager.RequestNavigate` 即可平滑升级。

> [!essentials] 核心要点
> - **功能切分**：按业务域拆模块（仓储/出入库/报表），模块间低耦合，各自独立编译
> - **区域导航**：Prism 用 Region 承载视图，切换模块 = 在区域内 RequestNavigate，示例以 TabControl 模拟
> - **独立注册**：每个模块通过 `IModule.RegisterTypes` 向 DI 容器注册自己的服务与视图，壳不感知细节
> - **按需加载**：模块可配置为延迟加载（用到才加载程序集），启动快、故障隔离
> - **界面即模块映射**：示例中"Tab 切换 + 状态栏提示"直观呈现"当前模块 = 当前功能"的对应关系

> [!example] 完整示例
> **Prism 模块化划分演示：用 TabControl 模拟 WMS 的三个功能模块（仓储管理 / 出入库作业 / 统计报表），每个 Tab 即一个模块视图，底部状态栏实时显示当前激活模块，体现"按功能拆分、独立注册、按需导航"的模块化思想：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="Prism 模块划分" Height="380" Width="540"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="WMS 模块化划分（Tab 模拟 Prism 模块导航）" Foreground="#58A6FF"
>                    FontSize="14" FontWeight="Bold" Margin="0,0,0,10"/>
>         <TabControl Grid.Row="1" x:Name="TabHost" SelectionChanged="OnTabChanged"
>                     Background="#161B22" BorderThickness="0">
>             <TabItem Header="仓储管理">
>                 <StackPanel Margin="14">
>                     <TextBlock Text="库位 / 货品基础数据维护" Foreground="#8B949E"/>
>                     <TextBlock Text="Module: WarehouseModule" Foreground="#58A6FF"
>                                FontFamily="Consolas" Margin="0,10,0,0"/>
>                 </StackPanel>
>             </TabItem>
>             <TabItem Header="出入库作业">
>                 <StackPanel Margin="14">
>                     <TextBlock Text="RFID 扫描、入库 / 出库登记" Foreground="#8B949E"/>
>                     <TextBlock Text="Module: OperationModule" Foreground="#58A6FF"
>                                FontFamily="Consolas" Margin="0,10,0,0"/>
>                 </StackPanel>
>             </TabItem>
>             <TabItem Header="统计报表">
>                 <StackPanel Margin="14">
>                     <TextBlock Text="库存台账 / 周转率报表" Foreground="#8B949E"/>
>                     <TextBlock Text="Module: ReportModule" Foreground="#58A6FF"
>                                FontFamily="Consolas" Margin="0,10,0,0"/>
>                 </StackPanel>
>             </TabItem>
>         </TabControl>
>         <TextBlock Grid.Row="2" x:Name="StatusText" Text="当前模块：仓储管理"
>                    Foreground="#8B949E" Margin="0,10,0,0"/>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
> using System.Windows.Controls;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         // 模块切换：Prism 中通过 RegionManager 在区域中切换 ModuleView
>         private void OnTabChanged(object sender, SelectionChangedEventArgs e)
>         {
>             if (TabHost.SelectedItem is TabItem tab)
>             {
>                 StatusText.Text = $"当前模块：{tab.Header}";
>                 // 每个模块独立编译、独立维护，互不耦合
>                 StatusText.Foreground = new SolidColorBrush(Color.FromRgb(0x8B, 0x94, 0x9E));
>             }
>         }
>     }
> }
> ```
> 
> 

> [!scene] 适用场景
> ✅ 功能多、团队并行的系统：WMS 的仓储/出入库/报表模块由不同小组并行开发，模块化互不阻塞
> ✅ 需要按功能独立发版的应用：发布时只更新改动的模块 DLL，无需整包重发
> ✅ 插件化平台：上位机平台 + 设备插件/工艺插件，第三方按模块规范扩展
> ✅ 启动速度敏感的场景：按需加载模块，首屏只载入核心功能
> ❌ 单一功能小工具：为两个窗体引入 Prism 模块体系，复杂度远大于收益
> ❌ 模块间强耦合的业务（如核心数据全程共享）：强行切模块会导致大量跨模块调用，先梳理好依赖再切

> [!pitfall] 常见踩坑
> 坑 1：**模块间直接引用对方类型** → 模块间互相 `using`，耦合比不分模块还严重，改一处联动一串 → 模块间通信只走接口/事件聚合器（`IEventAggregator`），服务经 DI 容器注册
>
> 坑 2：**视图与服务注册位置混乱** → 有的在模块注册、有的在壳里注册，运行时"服务找不到" → 每模块自己的服务/视图一律在本模块 `RegisterTypes` 注册，壳只注册全局基础设施
>
> 坑 3：**把"切 Tab"当成真模块化** → 所有代码仍在一个项目里，只是界面切了页 → 模块化的本质是"独立程序集 + 独立注册"，界面切换只是表现，务必落实到工程拆分
>
> 坑 4：**模块加载顺序依赖**（模块 A 依赖 B 已注册）→ 按需加载顺序不对时崩溃 → 模块间不隐式依赖；确有必要时通过模块目录（ModuleCatalog）显式声明依赖顺序

> [!best] 最佳实践
> - 模块划分以"业务域"为边界：一个业务域一个模块（仓储/作业/报表），不按"窗体/控件"切
> - 模块内自足：自己的 View + ViewModel + 服务 + 资源都在模块内，壳不感知模块内部细节
> - 跨模块通信统一走 `IEventAggregator`（弱耦合事件）或共享接口（由基础设施程序集定义）
> - 模块清单（`IModuleCatalog`）集中管理：哪些模块启动加载、哪些按需加载、加载顺序
> - 大项目按"解决方案分层 + 多项目"组织：`App`（壳）、`Modules.Warehouse`、`Modules.Operation`、`Modules.Report`、`Infrastructure`（共享接口）
> - 先跑通"一个壳 + 两个模块"的最小 Prism 工程，再逐步把功能搬进模块，避免一次性大改造

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，点击三个 Tab 观察状态栏"当前模块"切换，体会"功能→模块"的对应关系
> **Lv.2 小试牛刀**：新增第四个 Tab"系统管理"（权限/日志），并给每个 Tab 的 TextBlock 加上对应模块的说明
> **Lv.3 融会贯通**：用 NuGet 引入 Prism.Wpf，把示例改造成真正的模块化工程：壳窗口 + Region + 两个 Module 项目，用 `RequestNavigate` 实现区域导航
> **Lv.4 挑战**：实现"按需加载"：报表模块不随启动加载，点击"打开报表"按钮时才 `LoadModule`，并在状态栏输出加载耗时；再为两个模块配置独立的 DI 服务注册

> [!related] 相关知识链接
> - ← 前置知识：MVVM 与命令是 Prism 的地基，见第 7 章「什么是-mvvm」「mvvm-各层职责」；模块化与架构思想见第 12 章「架构设计重要性与类型」「mef-与-prism-modules」
> - → 后续必学：模块边界划好后实现核心业务，见「库存管理与-rfid-集成」「库位可视化展示」
> - ⇄ 关联概念：同章「需求与数据库设计」确定模块的业务内容；14.7「scada-系统架构」把模块化应用于大型监控平台；「mef-与-prism-modules」对比 MEF 与 Prism 两种模块化方案
> - 📖 官方文档：https://prismlibrary.github.io/docs/wpf/
