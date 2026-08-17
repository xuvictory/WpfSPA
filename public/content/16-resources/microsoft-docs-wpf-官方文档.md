---
title: Microsoft Docs WPF 官方文档
section: 16-resources
parent: 16.4 在线教程与文档
---

# Microsoft Docs WPF 官方文档

> [!plain] 白话理解
> 学任何技术，**第一手资料永远是官方文档**。`learn.microsoft.com` 上的 WPF 文档就是微软自己写的"用户手册"：控件怎么用、属性是什么含义、数据绑定怎么配，都有最权威的说明和可直接复制的示例代码。社区教程可能过时、可能写错，但官方文档跟着版本更新。**遇到疑问先查官方文档**，是上位机工程师该有的第一习惯。

> [!def] 官方定义
> **Microsoft Docs WPF 官方文档**是**微软官方维护**的 WPF 技术文档，主站地址：**https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/** 。它不是第三方教程，而是 WPF 框架（微软官方桌面 UI 框架）的一手资料，涵盖：快速入门（创建第一个 WPF 应用）、概念体系（XAML、依赖属性、路由事件、数据绑定、样式与模板、命令）、控件库（`System.Windows.Controls` 全系列控件文档）、以及 API 参考（https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.window 等逐 API 页）。文档提供中英文多语言版本，与 .NET 版本同步更新，是最权威、最可靠的 WPF 知识源。

> [!origin] 由来背景
> WPF 文档自 **2006 年 WPF 随 .NET Framework 3.0 发布**时起随框架提供，早期位于 MSDN（Microsoft Developer Network）。**2018 年**微软将开发文档整体迁入新的 **docs.microsoft.com / learn.microsoft.com** 平台，文档以 GitHub 开源仓库维护（https://github.com/dotnet/docs ），开发者可直接提 PR 修正错误。其演进逻辑与 WPF 本身一致：从 .NET Framework 时代到 .NET Core 3.0 起 WPF 开源（https://github.com/dotnet/wpf ），文档也随之更新至现代 .NET。对上位机开发者来说，它是验证"某个 API 现在长什么样"的最终依据。

> [!essentials] 核心要点
> - **入口**：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/ —— 概念、控件、指南全覆盖
> - **快速入门**：页顶"创建新的 WPF 应用"教程，30 分钟跑通"Hello WPF"
> - **控件文档**：每个控件（`Button`、`DataGrid`、`Slider`…）都有属性/事件/示例页
> - **API 参考**：`System.Windows` 命名空间逐类型页，签名、继承、示例齐全
> - **迁移指南**：老 .NET Framework 项目升级到 .NET 8 的官方步骤
> - **多语言**：右上角切换中文/英文，术语对照查证方便

> [!example] 完整示例
> **微软官方文档典型控件演示：Slider 联动文本与进度条：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="官方文档控件演示" Height="360" Width="440"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="微软官方文档典型控件演示" Foreground="#58A6FF" FontWeight="Bold" Margin="0,0,0,10"/>
>         <TextBlock Text="文档地址：learn.microsoft.com/zh-cn/dotnet/desktop/wpf/"
>                    Foreground="#8B949E" TextWrapping="Wrap" Margin="0,0,0,10"/>
>         <StackPanel Orientation="Horizontal" Margin="0,0,0,8">
>             <TextBlock Text="转速：" Foreground="#8B949E" VerticalAlignment="Center"/>
>             <Slider x:Name="SpeedSlider" Minimum="0" Maximum="3000" Width="220"
>                     ValueChanged="OnSpeedChanged" VerticalAlignment="Center"/>
>             <TextBlock x:Name="SpeedText" Text="0" Foreground="#58A6FF" FontSize="18"
>                        Margin="10,0,0,0" Width="80"/>
>         </StackPanel>
>         <ProgressBar x:Name="SpeedBar" Height="12" Maximum="3000" Value="0"
>                      Foreground="#238636" Background="#21262D" Margin="0,0,0,10"/>
>         <TextBlock x:Name="StatusText" Foreground="#8B949E"/>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
> using System.Windows.Controls;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         private void OnSpeedChanged(object sender, RoutedPropertyChangedEventArgs<double> e)
>         {
>             // 官方文档常用控件的联动示例：Slider 驱动文本与进度条
>             SpeedText.Text = ((int)SpeedSlider.Value) + " RPM";
>             SpeedBar.Value = SpeedSlider.Value;
>             StatusText.Text = SpeedSlider.Value > 2400
>                 ? "转速过高，请注意设备安全"
>                 : "设备运行正常";
>         }
>     }
> }
> ```

> [!scene] 适用场景
> ✅ 查 API 签名、属性含义、事件用法的日常开发
> ✅ 遇到"社区教程说不清"的疑难，回官方文档核实
> ✅ 新版本发布后查新特性与迁移说明
> ✅ 团队规范要求"以官方文档为最终依据"
> ❌ 想系统通读学习（文档偏工具书，不适合当教材通读）
> ❌ 需要中文通俗讲解的场景（配合书籍/社区教程互补）

> [!pitfall] 常见踩坑
> 坑 1：**看错版本导致 API 对不上** → 现象：文档页面顶部 .NET 版本与项目版本不一致，复制代码报错 → 原因：文档会展示多个 .NET 版本示例，默认可能是最新版 → 解决：页面右上/左侧切换版本到项目所用 .NET 版本，再看示例
>
> 坑 2：**只查中文、不查英文** → 现象：中文文档示例缺失或术语翻译不一致 → 原因：部分页面中文翻译滞后于英文 → 解决：中文查不到/看不懂时切换英文页面，术语以英文 API 名为准
>
> 坑 3：**把文档当教材死啃** → 现象：刷文档刷到头晕，还是不会写界面 → 原因：文档是"字典"，不是"教材" → 解决：先跑示例代码，遇到疑问再查文档，形成"实践 → 查证"循环

> [!best] 最佳实践
> - 收藏几个高频入口：WPF 主页、控件库、数据绑定、迁移指南
> - 每个控件用前先扫一眼"备注"与"示例"，避免凭直觉用错属性
> - 复制文档示例时注意版本切换与命名空间（`using`）
> - 把官方文档当"最终裁判"：社区说法与官方冲突时，以官方为准
> - 文档页底部"反馈/编辑"入口可直接提问题或修正，遇到文档错误可顺手提交

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行本节示例，把 Slider 的 `Maximum` 改成 5000，观察进度条与提示逻辑
> **Lv.2 小试牛刀**：在官方文档查 `DataGrid` 控件页，给示例加一个只读 DataGrid 展示设备列表
> **Lv.3 融会贯通**：用文档"数据绑定概述"章节，把示例改成纯绑定实现（去掉 `ValueChanged` 事件）
> **Lv.4 拆层挑战**：对照文档完成"从 .NET Framework 迁移到 .NET 8"的可行性检查，整理一份项目迁移清单

> [!related] 相关知识链接
> - ← 前置知识：[`wpf-编程宝典`](wpf-编程宝典)（系统学习）、[`深入浅出-wpf`](深入浅出-wpf)（原理）
> - → 后续必学：[`microsoft-learn-wpf-学习路径`](microsoft-learn-wpf-学习路径)（结构化路径）
> - ⇄ 关联概念：[`stack-overflow`](stack-overflow)（社区答疑互补）
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/ ；.NET 文档主页：https://learn.microsoft.com/zh-cn/dotnet/
