---
title: MEF 与 Prism Modules
section: 12-architecture
parent: 12.3 插件化架构
---

# MEF 与 Prism Modules

> [!plain] 白话理解
> 插件化架构是"理论"，MEF 和 Prism Modules 是"官方现成的插槽零件"。**MEF** 像插座板：你用 `[Export]` 声明"我这个类能提供 XX 服务"，用 `[Import]` 声明"我需要 XX 服务"，MEF 容器自动帮你配对插好，零手工接线。**Prism Modules** 则是 Prism 框架自带的"模块间"——把界面和功能打包成独立 Module，由框架按目录加载注册。示例用 MEF 的 `[Export]`/`[ImportMany]` 演示：容器一组合，报警、趋势两个模块自动注入宿主。

> [!def] 官方定义
> **MEF（Managed Extensibility Framework）** 是微软随 .NET Framework 4.0 提供的官方扩展框架，基于**特性化编程**：用 `[Export]` 标注可提供的部件（Part），用 `[Import]`/`[ImportMany]` 声明需求，`CompositionContainer` + `DirectoryCatalog`/`AssemblyCatalog` 完成发现与组合。官方文档：https://learn.microsoft.com/zh-cn/dotnet/framework/mef/ 。
> **Prism** 是微软 Patterns & Practices 团队（现为社区维护）的 WPF/XAML 框架，其 **Module（模块化）** 特性允许把独立功能打包为 Module 类，由 `ModuleCatalog` 注册、`ModuleInitializer` 按需加载，并常与 MEF 或 Unity 容器配合完成依赖注入。文档：https://prismlibrary.github.io/docs/wpf/Modularity.html 。

> [!origin] 由来背景
> MEF 诞生背景：2000 年代微软在 Visual Studio、Office 等大型产品中发现"扩展点越加越乱"，需要一个统一的扩展机制，于是 2008-2010 年间开发 MEF（.NET 4.0 正式发布），使宿主无需预先知道扩展就能发现并组合部件。Prism 则源自微软 Prism 框架（2008 年起，为复合 WPF 应用而设计），其 Modularity 目标与 MEF 类似但面向"MVVM 大应用分模块开发"，二者常配合使用（MEF 做组合容器、Prism 做导航与模块生命周期）。至今 .NET 生态又出现 `System.Composition`（MEF Core，跨平台）与社区 DI 容器，但 MEF 思想仍是标准参考。

> [!essentials] 核心要点
> - **MEF 三个核心**：`[Export]`（我能提供）、`[Import]/[ImportMany]`（我需要）、`CompositionContainer`（组合装配）
> - **MEF 目录**：`AssemblyCatalog`（当前程序集）、`DirectoryCatalog`（插件目录）、`AggregateCatalog`（合并）
> - **Prism Module**：`IModule` 接口 + `RegisterTypes()`/`OnInitialized()`，`ModuleCatalog` 按名/按路径注册
> - **组合时机**：容器 `ComposeParts(this)` 一次性填充所有 `[Import]`；重复组合会抛 `CompositionException`
> - **搭配 MVVM**：Prism 负责 Region/导航/Module 生命周期，MEF 或 Unity 负责实例装配（见第 7 章 `prism-企业级框架`、`什么是依赖注入`）

> [!example] 完整示例
> **MEF 用法演示：用 System.ComponentModel.Composition 的特性（[Export]/[Import]）实现插件组合——容器自动把已导出的模块注入到宿主，模拟 MEF 的发现与组合机制：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="MEF 组合演示" Height="340" Width="440"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="MEF 导出 / 导入机制" Foreground="#58A6FF" FontWeight="Bold"/>
>         <Button Content="组合目录并执行所有模块" Click="OnCompose" Margin="0,12,0,0" Padding="8"
>                 Background="#21262D" Foreground="White"/>
>         <TextBlock x:Name="OutputText" Margin="0,12,0,0" Foreground="#8B949E" TextWrapping="Wrap"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Collections.Generic;
> using System.ComponentModel.Composition;
> using System.ComponentModel.Composition.Hosting;
> using System.Reflection;
> using System.Windows;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     // 模块契约
>     public interface IHmiModule
>     {
>         string Name { get; }
>         string Run();
>     }
>
>     // [Export]：声明"我可以被容器发现"
>     [Export(typeof(IHmiModule))]
>     public class AlarmModule : IHmiModule
>     {
>         public string Name => "报警模块";
>         public string Run() => "当前 2 条未确认报警";
>     }
>
>     [Export(typeof(IHmiModule))]
>     public class TrendModule : IHmiModule
>     {
>         public string Name => "趋势曲线模块";
>         public string Run() => "已加载 24 小时温度曲线";
>     }
>
>     public partial class MainWindow : Window
>     {
>         // [ImportMany]：声明"我需要所有 IHmiModule"
>         [ImportMany]
>         public IEnumerable<IHmiModule> Modules { get; set; }
>
>         public MainWindow()
>         {
>             InitializeComponent();
>             Compose(); // 启动时自动组合
>         }
>
>         private void Compose()
>         {
>             // 创建组合容器：扫描当前程序集并填充所有 [Import] 属性
>             var catalog = new AssemblyCatalog(Assembly.GetExecutingAssembly());
>             var container = new CompositionContainer(catalog);
>             container.ComposeParts(this);
>         }
>
>         private void OnCompose(object sender, RoutedEventArgs e)
>         {
>             string text = $"发现并组合 {Count(Modules)} 个模块：\n";
>             foreach (var m in Modules) text += $"【{m.Name}】{m.Run()}\n";
>             OutputText.Text = text;
>             OutputText.Foreground = new SolidColorBrush(Color.FromRgb(0x23, 0x86, 0x36));
>         }
>
>         private static int Count(IEnumerable<IHmiModule> modules)
>         {
>             int n = 0;
>             foreach (var m in modules) n++;
>             return n;
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 上位机功能模块化：报警、趋势、报表各自一个 Module，按需加载
> ✅ 团队并行开发：每个开发者只写自己的 `[Export]` 部件，容器自动装配
> ✅ 按配置加载插件：`DirectoryCatalog` 扫插件目录，新协议/新界面即放即用
> ✅ Prism 复合应用：Region + Module 组合导航与视图，适合大型上位机
> ❌ 只有两三个类的项目：MEF 的反射组合反而带来启动开销
> ❌ 需要精细生命周期控制（卸载/回收）：MEF 默认组合不卸载，需额外设计

> [!pitfall] 常见踩坑
> 坑 1：**`[Import]` 没被填充就使用** → 现象：运行到模块调用时抛 `NullReferenceException` → 原因：忘了 `ComposeParts(this)` 或组合顺序不对 → 解决：启动时统一 `container.ComposeParts(this)`，用 `[Import(RequiredCreationPolicy = CreationPolicy.Shared)]` 明确共享
> 
> 坑 2：**循环依赖导致组合失败** → 现象：`ComposeParts` 抛 `CompositionException`，A 部件 import B、B 又 import A → 原因：部件互相依赖 → 解决：通过宿主中转或把依赖方向收敛到单向（见 `各层职责与交互` 依赖规则）
>
> 坑 3：**误把 `[ImportMany]` 当 `[Import]`** → 现象：只期望一个部件，结果容器注入全部匹配项 → 原因：语义混用 → 解决：多实例用 `[ImportMany]` 并逐个遍历；单实例用 `[Import]` 并保证唯一导出

> [!best] 最佳实践
> - 契约放独立程序集：`Contracts.dll` 只放接口，宿主与插件都引用它，避免程序集强耦合
> - 用 `DirectoryCatalog` 做插件目录：新增插件 dll 放进目录即被发现，主程序零改动
> - 组合失败早暴露：启动即 `ComposeParts`，配日志输出 `CompositionException` 明细（见 12.6 `全局异常捕获与记录`）
> - Prism 场景：Module 的 `RegisterTypes` 用容器注册服务，`OnInitialized` 里注册 Region 视图
> - 版本与兼容性管理：契约接口变更走"新增方法"而非"修改签名"，旧插件不崩（见 12.7 `增量更新与版本管理`）

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例代码，新增一个 `[Export(typeof(IHmiModule))]` 的"配方模块"，容器自动发现并组合
> **Lv.2 小试牛刀**：改用 `DirectoryCatalog` 加载 `Plugins` 目录：把模块类放进单独项目编译成 dll 放目录，验证即放即用
> **Lv.3 融会贯通**：给模块接口加 `[Import]` 的日志服务依赖，观察 MEF 如何把日志自动注入模块
> **Lv.4 拆层挑战**：用 Prism 搭一个空壳：`ModuleCatalog` 注册两个 Module，每个 Module 在 `OnInitialized` 向 Region 注册一个 View，完成"模块化界面"

> [!related] 相关知识链接
> - ← 前置知识：`什么是插件化架构`（原理）、第 7 章 `什么是依赖注入`（容器思想）
> - → 后续必学：`上位机插件化场景`（上位机落地案例）
> - ⇄ 关联概念：`工厂模式`（按需创建部件）、12.8 `单元测试xunitmoq`（契约接口便于 Mock）
> - 📖 官方文档：MEF（System.ComponentModel.Composition）：https://learn.microsoft.com/zh-cn/dotnet/framework/mef/ ；Prism Modularity：https://prismlibrary.github.io/docs/wpf/Modularity.html
