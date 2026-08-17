---
title: FlaUI
section: 16-resources
parent: 16.1 GitHub 优质 WPF 开源项目
---

# FlaUI

> [!plain] 白话理解
> 上位机软件交付前要"回归测试"：启动、填参数、点按钮、看状态，几百个用例手动点一遍能累死。**FlaUI** 就是"自动替你点界面"的库——它通过 Windows 的 UI 自动化接口，找到窗口上的输入框、按钮，模拟输入和点击，再断言界面变化。相当于给测试脚本配了一双"能看见界面的眼睛和手"，让 WPF 界面的自动化验收成为可能。

> [!def] 官方定义
> **FlaUI** 是一个**社区开源**的 .NET UI 自动化库（GitHub：https://github.com/FlaUI/FlaUI ，NuGet：`FlaUI.Core` + `FlaUI.UIA3`/`FlaUI.UIA2`），由 Florian Kutscherauer（Roemer）等维护，其底层基于**微软官方 Windows UI Automation（UIA）框架**（https://learn.microsoft.com/zh-cn/windows/win32/winauto/entry-uiauto-win32 ）。FlaUI 本身不是微软官方库，而是对 UIA 的 .NET 封装：`FlaUI.Core` 提供统一的自动化对象模型，`FlaUI.UIA3` 基于托管 UIA3 实现（推荐），`FlaUI.UIA2` 基于 COM 版 UIA2。它通过控件属性（如 `AutomationId`、`Name`）定位元素并执行点击、输入、读取状态等操作，是 WPF 上位机界面自动化测试的主流选择（详见第 12 章 `ui-自动化测试flaui`）。

> [!origin] 由来背景
> FlaUI 的谱系可以追溯到 **White**（TestStack.White）——一个 2009 年前后流行的 .NET UI 自动化框架。White 后期维护停滞，社区在 2015 年前后陆续转向更贴合微软 UIA 的替代方案，**FlaUI** 正是其中代表，它重写了对象模型、修复了 White 的诸多问题，并持续跟随 UIA 演进（支持 WinForms/WPF/UWP）。2017 年起 FlaUI 被 .NET 测试生态广泛采用，与 xUnit/NUnit 配合做桌面端 UI 回归测试。上位机软件"交付即验收"的行业特性，让 FlaUI 成为保障界面功能回归的常用工具。

> [!essentials] 核心要点
> - **启动被测应用**：`Application.Launch(path)` 或 `Application.Attach(process)`；`application.GetMainWindow(app)` 获取主窗口
> - **元素定位**：`window.FindFirstDescendant(cf => cf.ByAutomationId("DeviceIdBox"))` 按 `AutomationId`（WPF 中即 `x:Name`）定位
> - **交互**：`textBox.Enter("DEV-001")` 输入、`button.Click()` 点击、`comboBox.Select("运行")` 选择
> - **断言读取**：`textBox.Text`、`element.Properties.Name` 读取控件状态用于断言
> - **等待**：`window.WaitUntilEnabled(element)` / 显式延时等待，避免 UI 异步刷新竞态
> - **x:Name 即 AutomationId**：WPF 控件默认 `x:Name` 会暴露为 `AutomationId`，测试脚本按此定位最稳定

> [!example] 完整示例
> **FlaUI 自动化测试目标应用（AUT）：可被测试脚本定位与操作：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="被测应用" Height="360" Width="420"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="FlaUI 自动化测试目标应用" Foreground="#58A6FF" FontWeight="Bold" Margin="0,0,0,10"/>
>         <TextBlock Text="设备编号：" Foreground="#8B949E"/>
>         <TextBox x:Name="DeviceIdBox" Text="DEV-001" Margin="0,4,0,10" Padding="6"
>                  Background="#161B22" Foreground="White" BorderBrush="#21262D"/>
>         <TextBlock Text="目标转速：" Foreground="#8B949E"/>
>         <TextBox x:Name="SpeedBox" Text="1200" Margin="0,4,0,10" Padding="6"
>                  Background="#161B22" Foreground="White" BorderBrush="#21262D"/>
>         <Button Content="启动设备" Click="OnStartClick" Padding="8" Margin="0,0,0,8"
>                 Background="#238636" Foreground="White"/>
>         <Button Content="停止设备" Click="OnStopClick" Padding="8"
>                 Background="#DA3633" Foreground="White"/>
>         <TextBlock x:Name="StatusText" Foreground="#8B949E" Margin="0,10,0,0" TextWrapping="Wrap"/>
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
>     public partial class MainWindow : Window
>     {
>         // 本窗口作为 FlaUI 自动化测试的被测对象（AUT）。
>         // 测试脚本通过 AutomationId（x:Name）定位控件并模拟键盘输入与点击。
>         public MainWindow() => InitializeComponent();
>
>         private void OnStartClick(object sender, RoutedEventArgs e)
>         {
>             StatusText.Text = "设备 " + DeviceIdBox.Text + " 已启动，转速 " + SpeedBox.Text + " RPM";
>             StatusText.Foreground = Brushes.LimeGreen;
>         }
>
>         private void OnStopClick(object sender, RoutedEventArgs e)
>         {
>             StatusText.Text = "设备 " + DeviceIdBox.Text + " 已停止";
>             StatusText.Foreground = Brushes.OrangeRed;
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ WPF 上位机的界面回归测试（启动/参数/控制/状态全流程）
> ✅ 交付验收前自动跑冒烟用例，替代人工点点点
> ✅ 与 xUnit/NUnit 集成，把 UI 用例纳入 CI 流水线
> ✅ 第三方桌面工具的数据自动采集（读取/导出）
> ❌ 需要验证界面渲染像素/动画效果（FlaUI 只关心控件语义，不校验视觉）
> ❌ 逻辑层测试（用 `单元测试xunitmoq` 更快更稳，UI 测试应只覆盖界面交互）

> [!pitfall] 常见踩坑
> 坑 1：**找不到元素/自动化属性为空** → 现象：`FindFirstDescendant` 返回 null → 原因：控件没有暴露 `AutomationId`（如非 `x:Name` 命名的动态控件），或界面未加载完 → 解决：WPF 控件确保用 `x:Name` 命名；定位前 `WaitUntilEnabled` 或显式等待窗口就绪
>
> 坑 2：**测试偶发闪断** → 现象：用例时过时挂、报"element not connected" → 原因：界面刷新重建控件树，句柄失效 → 解决：重试定位（封装 `FindFirstDescendant` 重试 N 次），避免缓存元素引用
>
> 坑 3：**脚本窗口与测试窗口相互干扰** → 现象：自动化点击点到测试框架自己的窗口 → 原因：同时打开多个同名窗口，定位不精确 → 解决：用 `Application.Launch` 指定进程启动，通过 `GetMainWindow` 限定目标窗口

> [!best] 最佳实践
> - 界面元素统一用 `x:Name` 作为自动化定位的 `AutomationId`，测试脚本与控件命名对齐
> - UI 测试只验证"界面交互正确"，业务断言放到逻辑层单测（第 12 章分层）
> - 封装"等待-定位-重试"的工具方法，对抗异步刷新的时序抖动
> - 把冒烟用例（启动→登录→主界面元素齐备）纳入 CI，回归用例定期全量跑
> - 用无头/最小化运行或固定分辨率减少环境差异，保证现场与开发机结果一致

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例 AUT 程序，用 FlaUI 脚本定位"启动设备"按钮并点击
> **Lv.2 小试牛刀**：在脚本里往 `SpeedBox` 输入 1500 再点启动，断言 `StatusText` 显示 1500 RPM
> **Lv.3 融会贯通**：用 xUnit 把"启动→停止"写成完整用例，加入断言与等待
> **Lv.4 拆层挑战**：为一个多窗口上位机搭 UI 回归测试套件：登录→主界面→参数页→报警页全流程自动化，并接入 CI 定时执行

> [!related] 相关知识链接
> - ← 前置知识：第 12 章 [`ui-自动化测试flaui`](ui-自动化测试flaui)、[`单元测试xunitmoq`](单元测试xunitmoq)
> - → 后续必学：[`工控软件测试要点`](工控软件测试要点)（12，测试体系）
> - ⇄ 关联概念：`什么是-mvvm`（07，控件命名与绑定）、[`日志与工具类-nuget-包`](日志与工具类-nuget-包)
> - 📖 官方文档：https://github.com/FlaUI/FlaUI ；Windows UI Automation：https://learn.microsoft.com/zh-cn/windows/win32/winauto/entry-uiauto-win32
