---
title: SOLID 设计原则
section: 12-architecture
parent: 12.1 上位机软件架构概述
---

# SOLID 设计原则

> [!plain] 白话理解
> SOLID 是**让代码经得起改动的五条"职业素养"**。上位机里最常见的痛苦是：加一台新设备要动主界面、改协议要把业务逻辑翻个底朝天——因为类都"长在一起"。SOLID 教你：一个类只干一件事（S）、对扩展开放对修改关闭（O）、能用父类的地方换子类不出错（L）、接口别做万能工具（I）、依赖抽象而不是依赖具体类（D）。示例里的报表导出就是 I+D 的活教材：界面只认 `IReportExporter`，加 CSV 还是 Excel 调用方都不用改。

> [!def] 官方定义
> SOLID 是五个面向对象设计原则的缩写，由 Robert C. Martin（Uncle Bob）提出并推广（2000 年论文《Design Principles and Design Patterns》），指：**S**ingle Responsibility（单一职责）、**O**pen-Closed（开闭原则）、**L**iskov Substitution（里氏替换）、**I**nterface Segregation（接口隔离）、**D**ependency Inversion（依赖倒置）。它是设计原则（design principles），不是微软控件或 .NET API，与 GoF 设计模式互为表里。微软在 .NET 架构指南中将其作为推荐设计准则：https://learn.microsoft.com/zh-cn/dotnet/architecture/modern-web-apps-azure/architectural-principles 。原典见 Robert C. Martin 官网：https://blog.cleancoder.com/uncle-bob/2020/10/18/Solid-Relevance.html 。

> [!origin] 由来背景
> 1990 年代，Robert C. Martin 在咨询和培训中反复观察到"需求一变动就改崩一大片"的现象，开始系统总结类设计准则。2000 年他将五个原则组合并以"SOLID"命名，之后经 Michael Feathers 等推广，成为敏捷开发与测试驱动开发（TDD）的基石。与四人组（GoF）23 种设计模式不同，SOLID 是"为什么"层面的原则，模式是"怎么做"的方案——先懂原则再套模式，代码才不会为了模式而模式。如今 .NET、Java、C++ 生态都把它作为代码评审的基本标尺。

> [!essentials] 核心要点
> - **单一职责（S）**：一个类只有一个改变理由——设备类别把"读数据"和"存数据库"混在一起
> - **开闭原则（O）**：对扩展开放、对修改关闭——新增协议实现接口即可，不回头改调用方
> - **里氏替换（L）**：子类必须能替换父类而不破坏行为——派生类别重写"取消父类约定"的方法
> - **接口隔离（I）**：接口小而专——`IReadable`/`IAlarmable` 比一个 `IDeviceAll` 更好用
> - **依赖倒置（D）**：依赖抽象不依赖实现——业务层面向接口编程，靠依赖注入装配（见第 7 章 `什么是依赖注入`）

> [!example] 完整示例
> **SOLID 演示：以"报表导出"为例，接口隔离 + 依赖倒置——MainWindow 依赖 IReportExporter 接口而非具体类，切换 CSV/Excel 导出器无需改动调用代码：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="SOLID 原则演示" Height="340" Width="420"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="接口隔离 + 依赖倒置" Foreground="#58A6FF" FontWeight="Bold"/>
>         <ComboBox x:Name="FormatBox" Margin="0,12,0,0" Padding="4"
>                   Background="#161B22" Foreground="#8B949E">
>             <ComboBoxItem Content="导出 CSV" IsSelected="True"/>
>             <ComboBoxItem Content="导出 Excel"/>
>         </ComboBox>
>         <Button Content="导出生产报表" Click="OnExport" Margin="0,10,0,0" Padding="8"
>                 Background="#21262D" Foreground="White"/>
>         <TextBlock x:Name="OutputText" Margin="0,12,0,0" Foreground="#8B949E" TextWrapping="Wrap"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     // 依赖倒置：上层依赖抽象接口，而不是具体实现
>     public interface IReportExporter
>     {
>         string Export(string data);
>     }
>
>     // 单一职责：每个类只做一件事
>     public class CsvExporter : IReportExporter
>     {
>         public string Export(string data) => $"CSV 已导出：{data} 行数据 → report.csv";
>     }
>
>     public class ExcelExporter : IReportExporter
>     {
>         public string Export(string data) => $"Excel 已导出：{data} 行数据 → report.xlsx";
>     }
>
>     public partial class MainWindow : Window
>     {
>         private readonly string _data = "1280"; // 模拟报表数据
>
>         public MainWindow() => InitializeComponent();
>
>         private void OnExport(object sender, RoutedEventArgs e)
>         {
>             // 通过接口使用不同实现，新增导出格式时调用方代码零修改
>             IReportExporter exporter = FormatBox.SelectedIndex == 0
>                 ? new CsvExporter()
>                 : new ExcelExporter();
>             OutputText.Text = exporter.Export(_data);
>             OutputText.Foreground = new SolidColorBrush(Color.FromRgb(0x23, 0x86, 0x36));
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 设备种类多、协议多的上位机：接口隔离 + 依赖倒置让"加新设备只加类"
> ✅ 多人协作的中大型项目：单一职责让每个人的改动互不干扰
> ✅ 需求频繁变动的产线软件：开闭原则让扩展点稳定、改动集中
> ✅ 写单元测试（见 12.8 `单元测试xunitmoq`）：依赖接口才好 Mock 替身
> ❌ 一次性脚本、纯算法代码：强套 SOLID 反而增加无谓抽象
> ❌ 团队没有统一规范时强行贯彻：成员各写一套接口，比不写更乱

> [!pitfall] 常见踩坑
> 坑 1：**为了"开闭"疯狂加接口** → 现象：一个只有两个实现的小功能也要抽象接口 + 工厂，代码膨胀 → 原因：教条式套用原则 → 解决：接口只加在"确实会变"的边界（协议、导出、存储），用 YAGNI 过滤
> 
> 坑 2：**里氏替换被"特化"破坏** → 现象：子类把父类方法改成抛异常或悄悄改变返回值含义，运行时崩 → 原因：继承关系破坏父类约定 → 解决：多态场景优先用接口组合而非继承，子类绝不弱化父类能力
>
> 坑 3：**接口膨胀成"万能接口"** → 现象：`IDevice` 里既有 `Read()` 又有 `Print()`，不用的实现也要空实现 → 原因：违反接口隔离 → 解决：按调用方拆分 `IReadable`、`IPrintable`，用 `[ImportMany]`/DI 按需注入（见 `mef-与-prism-modules`）

> [!best] 最佳实践
> - 先写调用方再定义接口：从"界面/业务需要什么能力"倒推接口形状，接口自然小而专
> - 依赖方向全部朝向抽象：业务层只引用接口，具体实现通过构造函数注入（见第 7 章 `什么是依赖注入`）
> - 一个类一个文件、一个类一件事：类名就是职责声明（`ModbusDeviceReader` 不写界面逻辑）
> - 改动类时先问"违反了哪条原则"：改不动往往是 S 或 D 出了问题
> - 用测试保护重构：SOLID 改善的是"改得动"，没有测试兜底改错了没人知道（见 12.8 `单元测试xunitmoq`）

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例代码，给 `IReportExporter` 再加一个 `JsonExporter` 实现，观察调用方 `OnExport` 零修改
> **Lv.2 小试牛刀**：把示例改成"报警推送"：接口 `IAlarmNotifier` 含 `Notify(string)`，实现 `LogNotifier` 与 `MessageBoxNotifier`，界面用下拉框切换
> **Lv.3 融会贯通**：把你自己写的设备读取类拆成 `IDeviceReader` 接口 + 具体实现，业务层只依赖接口，在窗口构造函数里注入
> **Lv.4 拆层挑战**：为你的设备层分别定义 `IReadable`（读数据）与 `IWritable`（写参数），两个类各自只实现所需接口，体会接口隔离带来的收益

> [!related] 相关知识链接
> - ← 前置知识：第 7 章 `什么是依赖注入`（D 的落地工具）、`架构设计重要性与类型`（架构总览）
> - → 后续必学：`工厂模式`、`适配器模式`（把 SOLID 落地的经典模式）
> - ⇄ 关联概念：`各层职责与交互`（单一职责在层间的体现）、12.8 `单元测试xunitmoq`（接口便于 Mock）
> - 📖 官方文档：.NET 架构原则：https://learn.microsoft.com/zh-cn/dotnet/architecture/modern-web-apps-azure/architectural-principles ；Uncle Bob 关于 SOLID 的原文：https://blog.cleancoder.com/uncle-bob/2020/10/18/Solid-Relevance.html
