---
title: 单元测试（xUnit、Moq）
section: 12-architecture
parent: 12.8 测试
---

# 单元测试（xUnit、Moq）

> [!plain] 白话理解
> 单元测试是**给"最小代码单元"（一个方法/一个类）写"考题"**：输入什么、期望输出什么，每次跑一遍验证。上位机逻辑（阈值判断、协议解析、数据换算）改一次崩一次？先写好测试，改动后一键跑全部用例——绿了就放心。示例用 xUnit 框架 + Moq 模拟依赖（不连真 PLC 也能测协议解析），是上位机里"逻辑可靠性"的护身符。

> [!def] 官方定义
> **单元测试（Unit Test）**指对软件的最小可测试单元（方法/类）编写测试用例，验证其行为符合预期；**xUnit.net** 是 .NET 最主流的单元测试框架（NuGet：`xunit`、`xunit.runner.visualstudio`），核心特性 `[Fact]`（无参测试）与 `[Theory]`（参数化测试）：https://xunit.net/ ；**Moq** 是 .NET 最流行的 Mock 框架（NuGet：`Moq`），用 `Mock<T>` 动态创建接口/虚方法的替身并设置行为与断言调用：https://github.com/devlooped/moq 。二者属第三方开源库；微软官方文档给出 .NET 单元测试指南（AAA 模式、命名规范）：https://learn.microsoft.com/zh-cn/dotnet/core/testing/unit-testing-best-practices 。

> [!origin] 由来背景
> 单元测试思想源于 1970 年代"模块测试"，1997 年 Kent Beck 与 Erich Gamma 把"每写完一点就测一点"发展为 **JUnit**（Java），随后 xUnit（.NET）等移植到各语言，敏捷开发与 TDD（测试驱动开发）将其推向主流。Moq 诞生于 2007 年，解决"被测对象依赖接口/数据库/硬件时没法真测"的痛点——用动态代理在内存中生成替身。上位机行业早期"写代码不写测试"，但协议解析、报警判定、换算逻辑的高故障率让"测试思维"逐渐普及：没有真设备时用 Mock 模拟，回归测试保证改动安全，这正是 xUnit + Moq 在上位机流行的原因。

> [!essentials] 核心要点
> - **xUnit 基础**：`[Fact]` 单用例、`[Theory]` + `[InlineData]` 参数化多输入、断言 `Assert.Equal/True/Throws`
> - **AAA 模式**：Arrange（准备输入/依赖）→ Act（调用被测方法）→ Assert（验证结果）
> - **Moq 用法**：`var mock = new Mock<IDeviceReader>(); mock.Setup(m => m.Read()).Returns(42);` 注入替身
> - **验证调用**：`mock.Verify(m => m.Read(), Times.Once)` 断言"被调用了几次"
> - **测试目标**：业务逻辑层/解析/换算优先（不依赖 UI 与硬件）；界面与硬件通信留给集成/UI 测试（见 `ui-自动化测试flaui`）

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
> ✅ 业务逻辑测试：阈值判断、协议解析、数据换算——不依赖 UI 和硬件的纯逻辑（示例场景）
> ✅ 依赖外部资源时的测试：真设备/数据库/网络不可用，用 Mock 代替（示例 `Mock<IDeviceReader>`）
> ✅ 回归保护：改动代码后一键跑全部用例，确认没改坏旧功能
> ✅ 重构护航：`solid-设计原则` 重构后测试兜底，改得放心
> ❌ UI 布局/样式：单元测试不验证视觉效果，用 `ui-自动化测试flaui`
> ❌ 与硬件时序强相关的代码：真机集成测试才有效，单元测试管不了

> [!pitfall] 常见踩坑
> 坑 1：**测试依赖真实硬件/数据库** → 现象：没接 PLC 跑测试全挂 → 原因：被测类直接 `new` 硬件对象 → 解决：依赖接口 + 构造函数注入，测试传 Mock（示例 `DeviceReader` 注入 `IDeviceReader`）
> 
> 坑 2：**测试与实现耦合太紧** → 现象：改实现内部结构测试就挂 → 原因：断言了不该断言的内部细节 → 解决：只断言"公开行为"（返回值/异常/副作用），别断言私有方法/字段
>
> 坑 3：**Mock 设置过宽吞掉错误** → 现象：`Setup(m => m.Read()).Returns(0)` 让所有分支都走"正常路径"，异常分支测不到 → 原因：Mock 全部返回默认值 → 解决：显式设置边界值/抛异常：`Setup(...).Throws<TimeoutException>()` 测异常分支

> [!best] 最佳实践
> - 测试命名规范：`方法名_场景_期望结果`（如 `CalculateLimit_超限_返回真`），测试即文档
> - 一个用例只测一件事：断言数尽量少，失败时一眼定位原因
> - 优先测"边界与异常"：阈值临界值、空数据、超时、非法参数——最容易出 bug 的地方
> - 依赖全部注入接口：业务层不认识具体实现，Mock 才换得掉（见 `solid-设计原则` D、第 7 章 `什么是依赖注入`）
> - 测试与 CI 集成：提交代码自动跑全部用例，红灯不许合并（见 `工控软件测试要点`）

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例测试用例，观察 `[Fact]`/`[Theory]` 的执行与断言，改一个阈值让测试红再改回绿
> **Lv.2 小试牛刀**：给 `TempCalculator.CalculateLimit` 补边界用例：恰好等于阈值、低于阈值、NaN，用 `[Theory]` + `[InlineData]` 参数化
> **Lv.3 融会贯通**：用 Moq 测"超时异常分支"：`Mock<IDeviceReader>.Setup(m => m.Read()).Throws<TimeoutException>()`，验证业务层正确抛出/包装异常
> **Lv.4 拆层挑战**：把示例拆成"被测业务类 + 测试项目"两个项目，用构造函数注入 `IDeviceReader`，用 Moq 覆盖正常/异常/边界三种路径

> [!related] 相关知识链接
> - ← 前置知识：`solid-设计原则`（接口隔离便于 Mock）、第 7 章 `什么是依赖注入`
> - → 后续必学：`ui-自动化测试flaui`（UI 层测试）、`工控软件测试要点`（测试体系）
> - ⇄ 关联概念：`策略模式`/`状态模式`（逻辑可测性）、第 8 章（异步逻辑测试）
> - 📖 官方文档：.NET 单元测试最佳实践：https://learn.microsoft.com/zh-cn/dotnet/core/testing/unit-testing-best-practices ；xUnit：https://xunit.net/ ；Moq：https://github.com/devlooped/moq
