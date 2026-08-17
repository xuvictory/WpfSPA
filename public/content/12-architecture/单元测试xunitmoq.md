---
title: 单元测试（xUnit、Moq）
section: 12-architecture
parent: 12.8 测试
---

# 单元测试（xUnit、Moq）

> [!plain] 白话理解
> "单元测试（xUnit、Moq）"是 WPF 上位机开发中的一项重要知识。在学习 WPF 上位机开发的过程中，"单元测试（xUnit、Moq）"是一个重要的知识点。当项目从几百行代码增长到几万行、几十万行时，没有架构的代码会变成一团乱麻。掌握了它，你就能更好地构建工业级上位机应用程序。

> [!def] 官方定义
> 单元测试（xUnit、Moq）是 WPF / .NET 技术栈中由微软官方定义和实现的一个特性/概念/控件。它遵循 .NET 标准规范，为开发者提供了一套完整的编程接口（API）和最佳实践指南。详细定义请参考 Microsoft Docs 官方文档。

> [!origin] 由来背景
> 单元测试（xUnit、Moq）的诞生源于实际开发中的痛点。微软在设计 .NET 和 WPF 框架时，为了满足企业级应用（尤其是工业自动化、数据可视化等场景）的需求，引入了这一特性。它的设计理念参考了业界最佳实践，并在日后的版本迭代中不断优化。

> 本章节背景：当项目从几百行代码增长到几万行、几十万行时，没有架构的代码会变成一团乱麻。

> [!essentials] 核心要点
> - **概念理解**：首先搞清楚"单元测试（xUnit、Moq）"是什么，它解决了什么问题
> - **关键 API**：掌握最常用的属性和方法，能用代码表达你的意图
> - **使用模式**：了解惯用的写法套路，避免重复造轮子
> - **注意事项**：知道什么能做，什么不能做，踩坑前先看清路
> - **实战检验**：用一个小项目或练习来验证你真的理解了

> [!example] 完整示例
> **xUnit 单元测试演示：先给出被测业务类"产量统计器"，再用 xUnit 写断言测试，用 Moq 模拟数据源，体现"测试不依赖真实硬件"：**
>
> **被测业务类 TemperatureAlarm.cs（放在主项目）：**
> ```csharp
> namespace HmiDemo
> {
>     // 被测对象：温度超限判断
>     public class TemperatureAlarm
>     {
>         public bool ShouldAlarm(double current, double limit) => current > limit;
>         public string AlarmLevel(double current, double limit)
>             => current > limit * 1.2 ? "严重" : "一般";
>     }
> }
> ```
>
> **MainWindow.xaml（演示界面，显示测试概念）：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="单元测试演示" Height="340" Width="440"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="xUnit + Moq 单元测试" Foreground="#58A6FF" FontWeight="Bold"/>
>         <Button Content="运行内嵌断言（模拟测试）" Click="OnRun" Margin="0,12,0,0" Padding="8"
>                 Background="#21262D" Foreground="White"/>
>         <TextBlock x:Name="OutputText" Margin="0,12,0,0" Foreground="#8B949E" TextWrapping="Wrap"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码（演示断言流程）：**
> ```csharp
> using System.Windows;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         private readonly TemperatureAlarm _alarm = new TemperatureAlarm();
>
>         public MainWindow() => InitializeComponent();
>
>         private void OnRun(object sender, RoutedEventArgs e)
>         {
>             bool t1 = _alarm.ShouldAlarm(90, 85);             // 期望 true
>             bool t2 = !_alarm.ShouldAlarm(80, 85);            // 期望 true
>             string t3 = _alarm.AlarmLevel(120, 85);           // 期望"严重"
>             bool pass = t1 && t2 && t3 == "严重";
>
>             OutputText.Text = pass
>                 ? "3/3 断言全部通过 ✅\n可放心提交代码"
>                 : "存在失败断言 ❌ 请检查业务逻辑";
>             OutputText.Foreground = new SolidColorBrush(Color.FromRgb(
>                 pass ? 0x23 : 0xDA, pass ? 0x86 : 0x36, pass ? 0x36 : 0x33));
>         }
>     }
> }
> ```
>
> **TemperatureAlarmTests.cs（真实 xUnit 测试项目写法，随示例展示）：**
> ```csharp
> using HmiDemo;
> using Xunit;
>
> public class TemperatureAlarmTests
> {
>     private readonly TemperatureAlarm _alarm = new TemperatureAlarm();
>
>     [Fact]
>     public void 温度超过上限_应触发报警()
>     {
>         Assert.True(_alarm.ShouldAlarm(90, 85));
>     }
>
>     [Theory]
>     [InlineData(80, 85)]
>     [InlineData(85, 85)]
>     public void 温度未超限_不应报警(double current, double limit)
>     {
>         Assert.False(_alarm.ShouldAlarm(current, limit));
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
> **Lv.3 融会贯通**：结合前面学过的知识，用"单元测试（xUnit、Moq）"实现一个上位机中的小功能模块

> [!related] 相关知识链接
> - ← 前置知识：请确保你已经理解了本章节之前的内容，再学习"单元测试（xUnit、Moq）"
> - → 后续必学：掌握"单元测试（xUnit、Moq）"后，建议接着学习本章节的下一个知识点
> - ⇄ 关联概念：数据绑定、命令系统、MVVM 模式（WPF 开发的核心支柱）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/
