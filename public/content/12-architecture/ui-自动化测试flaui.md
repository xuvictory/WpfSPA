---
title: UI 自动化测试（FlaUI）
section: 12-architecture
parent: 12.8 测试
---

# UI 自动化测试（FlaUI）

> [!plain] 白话理解
> 单元测试管"逻辑"，UI 自动化测试管**"用户点按钮的全流程"**：启动程序、填参数、点启动、看界面状态对不对——手工一遍遍点很累，写脚本让电脑自己点。FlaUI 就是操作 Windows 桌面 UI 的"遥控器"：能找到按钮、输入框，能点击、能读文本。上位机发布前把"登录→采集→报警"主流程自动化跑一遍，回归不靠人肉。

> [!def] 官方定义
> **FlaUI** 是开源 .NET UI 自动化测试库（NuGet：`FlaUI.Core`、`FlaUI.UIA3`），基于微软 Windows UI Automation（UIA）规范驱动桌面应用（WPF/WinForms），提供元素查找（`By.Name`/`By.AutomationId`）、交互（`Click`/`Enter`/`SetText`）、断言（`Properties.Name`）能力：https://github.com/FlaUI/FlaUI 。它属第三方库；微软官方对 Windows 自动化提供 **UI Automation 规范**（`System.Windows.Automation`，`AutomationElement`）：https://learn.microsoft.com/zh-cn/dotnet/framework/ui-automation/ 。WPF 元素的 `AutomationProperties.AutomationId` 是为自动化测试预留的定位锚点。

> [!origin] 由来背景
> UI 自动化测试源于 1990 年代微软对"可访问性 + 可测试性"的双重追求：**Windows UI Automation（UIA，2007 年随 Vista 推出）** 统一了 UI 元素的可编程访问模型，最初服务屏幕阅读器，后被测试工具复用。FlaUI 诞生于 2016 年前后，弥补了微软官方 `UIAutomationClient` 易用性不足，成为 .NET 桌面 UI 测试的主流选择。上位机行业回归测试需求强（主流程不能坏），但真机依赖重，通常策略是：**关键界面流程用 FlaUI 自动化 + 硬件用模拟器/桩**，在 CI 上跑冒烟测试，兼顾覆盖与稳定。

> [!essentials] 核心要点
> - **核心 API**：`FlaUI.Core.Application.Launch(path)` 启动 → `app.GetMainWindow()` → `window.FindFirstDescendant(cf => cf.ByAutomationId("btnStart"))`
> - **定位锚点**：XAML 里给控件设 `AutomationProperties.AutomationId="btnStart"`，测试按 ID 找（稳定，不受文案/布局影响）
> - **交互与断言**：`Button.Click()`、`TextBox.Text = "80"`、`Assert.True(label.Text.Contains("运行中"))`
> - **等待策略**：UI 异步更新要 `WaitUntil`/轮询等待元素出现，别立即断言（见第 8 章异步）
> - **分层策略**：FlaUI 测"端到端主流程"，业务逻辑仍靠单元测试（见 `单元测试xunitmoq`）——UI 测试慢且脆，别用它测逻辑

> [!example] 完整示例
> **FlaUI UI 自动化演示：给出被测窗口（含输入框与按钮），再用 FlaUI 语法编写自动化脚本模拟"输入参数→点击启动→断言状态"：**
>
> **被测窗口 MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="FlaUI 被测窗口" Height="320" Width="420"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock x:Name="StatusText" Margin="0,0,0,10" FontSize="16" FontWeight="Bold"
>                    Foreground="#DA3633" Text="● 待机"/>
>         <TextBox x:Name="ParamBox" Margin="0,6,0,0" Padding="4"
>                  Background="#161B22" Foreground="#8B949E"/>
>         <Button x:Name="StartButton" Content="启动设备" Click="OnStart" Margin="0,10,0,0" Padding="8"
>                 Background="#21262D" Foreground="White"/>
>         <TextBlock x:Name="OutputText" Margin="0,12,0,0" Foreground="#8B949E" TextWrapping="Wrap"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 被测逻辑：**
> ```csharp
> using System.Windows;
> using System.Windows.Media;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         private void OnStart(object sender, RoutedEventArgs e)
>         {
>             bool ok = double.TryParse(ParamBox.Text, out double temp);
>             StatusText.Text = ok ? "● 运行中" : "● 参数错误";
>             StatusText.Foreground = new SolidColorBrush(Color.FromRgb(
>                 ok ? 0x23 : 0xDA, ok ? 0x86 : 0x36, ok ? 0x36 : 0x33));
>             OutputText.Text = ok ? $"已用 {temp}℃ 启动" : "请输入数字参数";
>         }
>     }
> }
> ```
>
> **FlaUI 自动化脚本（测试项目内，需安装 FlaUI.UIA3）：**
> ```csharp
> using FlaUI.Core;
> using FlaUI.Core.AutomationElements;
> using FlaUI.UIA3;
>
> public class HmiUiTests
> {
>     [Fact]
>     public void 输入参数点击启动_状态应变为运行中()
>     {
>         using var app = Application.Launch("HmiDemo.exe");
>         using var automation = new UIA3Automation();
>         var window = app.GetMainWindow(automation);
>
>         // 通过 AutomationId 定位控件并操作
>         window.FindFirstDescendant(x => x.ByAutomationId("ParamBox")).AsTextBox().Text = "80";
>         window.FindFirstDescendant(x => x.ByAutomationId("StartButton")).AsButton().Click();
>
>         var status = window.FindFirstDescendant(x => x.ByAutomationId("StatusText")).AsTextBox().Text;
>         Assert.Contains("运行中", status);
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 主流程回归：登录→采集→报警→导出 一键全自动跑（示例场景）
> ✅ 发布前冒烟测试：每次发版自动启动程序验证"能起、主界面正常"
> ✅ 跨窗口操作验证：多窗口/弹窗流程（配置窗口、报警窗口）
> ✅ 长时间稳定性辅助：UI 层面验证程序长时间运行界面不假死
> ❌ 业务逻辑测试：用单元测试更稳（见 `单元测试xunitmoq`）
> ❌ 强依赖真实硬件的全流程：设备数据用模拟器/桩注入，别让测试连真机

> [!pitfall] 常见踩坑
> 坑 1：**用文本/序号定位控件导致测试脆弱** → 现象：界面文案一改测试全挂 → 原因：`By.Name("启动")` 依赖文案 → 解决：XAML 给控件设 `AutomationProperties.AutomationId="btnStart"`，测试用 `ByAutomationId` 定位（稳定锚点）
> 
> 坑 2：**元素未出现就点击/断言** → 现象：偶发"找不到元素"、测试时好时坏 → 原因：UI 异步加载未完成（见第 8 章） → 解决：用 `WaitUntil`/`Retry` 等待元素出现（`retry.Until(() => window.FindFirst(...) != null)`）
>
> 坑 3：**测试与被测程序同进程/同目录** → 现象：启动被测试程序时互相干扰 → 原因：调试器/工作目录问题 → 解决：FlaUI 用 `Application.Launch` 起独立进程，测试项目独立目录，别在测试进程里宿主主程序

> [!best] 最佳实践
> - 全部关键控件设 `AutomationId`：从设计期就为自动化准备，测试稳定且不依赖语言文案
> - 主流程脚本化："登录→采集→报警→停止"，每个动作后等待界面状态稳定再下一步
> - 断言"业务状态"而非"坐标/颜色"：断言状态文本/数据，别断像素位置
> - 测试数据隔离：测试用专用配置文件（`test/appsettings.json`），不污染现场配置
> - 分层放测试：冒烟（能启动）→ 主流程（端到端）→ 集成（真实设备），层层递进（见 `工控软件测试要点`）

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例 FlaUI 测试，观察它启动示例程序、点击按钮、读取状态文本的完整流程
> **Lv.2 小试牛刀**：给示例程序加 `AutomationProperties.AutomationId="btnToggle"`，把测试改用 `ByAutomationId` 定位并点击
> **Lv.3 融会贯通**：写一个"主流程"测试：启动→输入阈值→点启动→等待→断言状态文本为"运行中"→点停止
> **Lv.4 拆层挑战**：给被测程序注入"模拟数据源"（配置文件指定 `Simulator` 数据提供者），让 FlaUI 测试不连真设备也能跑全流程

> [!related] 相关知识链接
> - ← 前置知识：`单元测试xunitmoq`（逻辑层测试）、第 7 章 `什么是-mvvm`（界面结构）
> - → 后续必学：`工控软件测试要点`（测试体系落地）
> - ⇄ 关联概念：第 8 章（异步等待策略）、`上位机日志场景`（测试日志）
> - 📖 官方文档：FlaUI：https://github.com/FlaUI/FlaUI ；Windows UI Automation：https://learn.microsoft.com/zh-cn/dotnet/framework/ui-automation/
