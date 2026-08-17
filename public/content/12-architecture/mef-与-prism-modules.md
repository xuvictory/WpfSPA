---
title: MEF 与 Prism Modules
section: 12-architecture
parent: 12.3 插件化架构
---

# MEF 与 Prism Modules

> [!plain] 白话理解
> "MEF 与 Prism Modules"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"MEF 与 Prism Modules"是一个重要的知识点。当项目从几百行代码增长到几万行、几十万行时，没有架构的代码会变成一团乱麻。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> MEF 与 Prism Modules是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> MEF 与 Prism Modules的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：当项目从几百行代码增长到几万行、几十万行时，没有架构的代码会变成一团乱麻。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"MEF 与 Prism Modules"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

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
> **Lv.3 融会贯通**：结合前面学过的知识，用"MEF 与 Prism Modules"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"MEF 与 Prism Modules"
> - → 后续必学：掌握"MEF 与 Prism Modules"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
