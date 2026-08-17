---
title: PropertyChanged.Fody
section: 16-resources
parent: 16.1 GitHub 优质 WPF 开源项目
---

# PropertyChanged.Fody

> [!plain] 白话理解
> `communitytoolkitmvvm` 用"编译器帮你写代码"（源生成器），**PropertyChanged.Fody** 则是"编译完成后偷偷改程序集"（IL 编织）：你在属性上贴一个 `[AddINotifyPropertyChanged]` 特性，它就在编译产物里自动把该类的所有属性接上"变更通知"，连基类和 `SetProperty` 都省了。适合老项目改造——不想动现有大量普通 POCO 类，贴个特性就能让它们参与绑定。

> [!def] 官方定义
> **PropertyChanged.Fody** 是 **Fody** 插件体系中的一个**社区开源**的 IL 编织插件（GitHub：https://github.com/Fody/PropertyChanged ，NuGet：`PropertyChanged.Fody`），用于在**编译后修改 IL**，自动为标记了 `[AddINotifyPropertyChanged]` 的类注入 `INotifyPropertyChanged` 实现。它**不是微软官方库**，其底层框架 Fody（https://github.com/Fody/Fody ）是一个 .NET 编译后扩展框架，通过在 MSBuild 中挂钩改写程序集。与微软官方属性变更机制（`System.ComponentModel.INotifyPropertyChanged`，见 https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/data/ ）的区别在于：官方只是接口约定，实现要自己写；Fody 用工具自动生成实现，并且能处理依赖属性通知（如 `FullName` 依赖 `FirstName`/`LastName` 时自动通知 `FullName`）。

> [!origin] 由来背景
> Fody 由 Simon Cropp（新西兰 .NET 开发者）于 2012 年创建，最初是为了解决"每个属性都要手写属性变更样板代码"的问题。他开发的 Fody 核心框架 + 一系列插件（PropertyChanged、Costura 等）在 .NET 社区广受欢迎，PropertyChanged.Fody 是最常用的插件之一。其**理念与源生成器（Source Generator）互补**：源生成器在编译前生成源码，IL 编织在编译后改写程序集，两者都能消除样板代码，但 IL 编织对老式 C# 项目兼容更好。在上位机行业中，改造遗留代码时用 Fody 免去大规模改写，是一种实用技巧。

> [!essentials] 核心要点
> - **三步接入**：NuGet 安装 `PropertyChanged.Fody` → 类上加 `[AddINotifyPropertyChanged]` → 类的公开属性自动获得变更通知
> - **FodyWeavers.xml**：项目根目录生成 `FodyWeavers.xml`，在其中写入 `<PropertyChanged/>` 启用插件
> - **依赖属性通知**：`FullName` 由 `FirstName`+`LastName` 拼接时，`FullName` 的计算逻辑写在类里，Fody 会自动在 `FirstName` 变更时通知 `FullName`
> - **`[DoNotNotify]`**：属性上加此特性可跳过通知生成（如只读计算属性）
> - **`[DependsOn]`**：显式声明依赖（`[DependsOn(nameof(FirstName))]`），控制通知顺序
> - **适用范围**：普通类、ViewModel 均可；继承层级同样支持

> [!example] 完整示例
> **PropertyChanged.Fody 自动属性通知：设备信息编辑：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="PropertyChanged.Fody 演示" Height="300" Width="420"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="20">
>         <TextBlock Text="设备信息（自动属性通知）" Foreground="#58A6FF"
>                    FontWeight="Bold" Margin="0,0,0,15"/>
>         <TextBlock Text="设备名称：" Foreground="#8B949E"/>
>         <TextBox Text="{Binding DeviceName, UpdateSourceTrigger=PropertyChanged}" Margin="0,2,0,10"/>
>         <TextBlock Text="厂商型号：" Foreground="#8B949E"/>
>         <TextBox Text="{Binding Model, UpdateSourceTrigger=PropertyChanged}" Margin="0,2,0,10"/>
>         <TextBlock Text="完整标识：" Foreground="#8B949E"/>
>         <TextBlock Text="{Binding FullName}" Foreground="White" FontSize="16"
>                    Margin="0,2,0,15"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
> using PropertyChanged;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow()
>         {
>             InitializeComponent();
>             // 需通过 NuGet 安装 PropertyChanged.Fody 包，并在 FodyWeavers.xml 启用
>             DataContext = new DeviceInfo();
>         }
>     }
>
>     [AddINotifyPropertyChanged]   // 编译后自动为属性注入通知
>     public class DeviceInfo
>     {
>         public string DeviceName { get; set; } = "1 号水泵";
>         public string Model { get; set; } = "Pump-2000";
>
>         [DependsOn(nameof(DeviceName), nameof(Model))]
>         public string FullName => $"{DeviceName} ({Model})";
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 老项目改造：现有大量 POCO/实体类需要绑定，不想逐类重写
> ✅ 需要"依赖属性自动通知"的复杂计算属性（`FullName`、`Total` 等）
> ✅ 与 `communitytoolkitmvvm` 混用：实体层用 Fody，ViewModel 用源生成器
> ✅ 团队熟悉 IL 编织、希望零运行时开销
> ❌ 全新项目且追求编译期可见性（源生成器更直观、可调试）
> ❌ 对"黑盒改写 IL"有疑虑、需要精确控制生成的场景

> [!pitfall] 常见踩坑
> 坑 1：**特性不生效，属性不触发通知** → 现象：XAML 绑定后值不变 → 原因：忘了在 `FodyWeavers.xml` 中启用 `<PropertyChanged/>`，或类不是 `public`/属性不是 virtual 可覆盖场景 → 解决：确认 `FodyWeavers.xml` 正确配置并重新编译；检查类可见性
>
> 坑 2：**计算属性更新不及时** → 现象：`FullName` 在 `DeviceName` 改变后没刷新 → 原因：Fody 依赖属性通知对复杂表达式（方法调用、索引器等）识别不全 → 解决：用 `[DependsOn(nameof(DeviceName), nameof(Model))]` 显式声明依赖
>
> 坑 3：**与源生成器类混用时冲突** → 现象：同时用 `[ObservableProperty]` 与 `[AddINotifyPropertyChanged]` 的类行为异常 → 原因：两套机制都会注入 `PropertyChanged` 事件，重复定义 → 解决：同一类只选一种方案，实体层与 ViewModel 层分开用

> [!best] 最佳实践
> - 老项目改造：给实体类批量加 `[AddINotifyPropertyChanged]`，一行一个类，迁移成本极低
> - 计算属性一律用 `[DependsOn]` 显式声明，避免依赖 Fody 的自动推断
> - 与源生成器分工：实体/配置类用 Fody，ViewModel 用 `communitytoolkitmvvm`，各取所长
> - 升级 Fody 版本前检查 `FodyWeavers.xml` 语法与插件兼容性（Fody 5+ 配置有调整）
> - 注意 IL 编织对单元测试的影响：测试项目同样要能执行编织后的程序集（默认即可）

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行本节示例，把 `FullName` 的格式从"名称 (型号)"改成"型号-名称"
> **Lv.2 小试牛刀**：新增一个"功率(KW)"属性，让另一个"总功率"属性自动依赖并通知刷新
> **Lv.3 融会贯通**：把示例类放到单独实体层，用 `[DoNotNotify]` 标记不需要通知的只读字段
> **Lv.4 拆层挑战**：改造一个 200 行以上的老实体类为 Fody 方案，并写单元测试验证"改 A 属性后 B 计算属性触发 PropertyChanged"

> [!related] 相关知识链接
> - ← 前置知识：[`什么是-mvvm`](什么是-mvvm)、[`inotifypropertychanged-实现`](inotifypropertychanged-实现)（07）
> - ⇄ 关联概念：[`communitytoolkitmvvm`](communitytoolkitmvvm)（源生成器方案对比）、[`什么是样式`](什么是样式)（05）
> - 📖 官方文档：https://github.com/Fody/PropertyChanged ；Fody 框架：https://github.com/Fody/Fody
