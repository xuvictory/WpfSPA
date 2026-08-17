---
title: StatusBar 状态栏
section: 04-controls
parent: 4.8 菜单与工具栏
---

# StatusBar 状态栏

> [!plain] 白话理解
> 上位机主界面底部那一条"系统运行中 | 通信：已连接 | 2026-08-18 14:30:00"，就是状态栏。它不承载主要操作，而是把"系统当前状态"随时可见地摆在用户眼前——设备是否在线、通信是否正常、当前时间。
> WPF 用 `StatusBar` 实现：里面放多个 `StatusBarItem` 分区，每个区显示一段信息，中间用 `Separator` 分隔。它是 `ItemsControl` 的子类（列表结构），所以能用绑定驱动"实时状态"，也可以放进度条等轻量控件。窗口缩放时它固定在底部，不抢主内容空间。

> [!def] 官方定义
> StatusBar 是 WPF 中用于"窗口底部状态信息展示"的控件，位于 `System.Windows.Controls` 命名空间，继承自 `HeaderedItemsControl`（可容纳多个条目）。子元素通常为 `StatusBarItem`（继承 `ContentControl`，每个承载一段状态内容），用 `Separator` 或 `StatusBarSeparator` 分隔。作为 ItemsControl 族，它支持 `ItemTemplate` 与数据绑定；固定方式一般通过 `DockPanel.Dock="Bottom"` 实现。
> 官方资料：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.statusbar

> [!origin] 由来背景
> 状态栏源于桌面应用"随时报告系统状态"的惯例：WinForms 的 StatusStrip/StatusBar 以索引方式（`statusBar.Items[0]`）访问分区，代码里写死位置，动态增删状态项非常别扭。WPF 的 StatusBar 直接继承 HeaderedItemsControl——本质上是一个"水平排列的条目列表"，用 `StatusBarItem` 承载每个状态分区，条目数量与内容都可以随状态动态变化；又因继承 ItemsControl，天然支持 `ItemTemplate` 与数据绑定。工业上位机的"运行状态、通信状态、时间、告警数"就是一组随时间变化的条目集合，StatusBar 恰好把"列表化状态区"做成标准控件。

> [!essentials] 核心要点
> - **StatusBarItem 分区**：每段状态信息包一个 `StatusBarItem`，语义清晰
> - **Separator 分隔**：`Separator`/`StatusBarSeparator` 区分相邻分区
> - **DockPanel.Dock="Bottom"**：配合 DockPanel 固定在窗口底部
> - **ItemsControl 家族**：支持绑定与 `ItemTemplate`，状态项可动态增删
> - **实时刷新**：`DispatcherTimer` 或数据绑定驱动（示例每秒刷新时间）
> - **可放轻量控件**：`ProgressBar`、`TextBlock` 等可直接作分区内容

> [!example] 完整示例
> **状态栏演示：StatusBarItem 分区显示运行状态、通信状态、当前时间（定时刷新）：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="状态栏 - StatusBar" Height="360" Width="680"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <DockPanel>
>         <TextBlock DockPanel.Dock="Top" Text="主内容区（示例）" Foreground="#8B949E"
>                    Margin="15" FontSize="20"/>
>
>         <!-- StatusBar 固定在窗口底部 -->
>         <StatusBar DockPanel.Dock="Bottom" Background="#161B22" Foreground="White">
>             <StatusBarItem>
>                 <TextBlock x:Name="lblRunState" Text="● 系统运行中" Foreground="#3FB950"/>
>             </StatusBarItem>
>             <Separator/>
>             <StatusBarItem>
>                 <TextBlock x:Name="lblComm" Text="通信：已连接" Foreground="#3FB950"/>
>             </StatusBarItem>
>             <Separator/>
>             <StatusBarItem HorizontalAlignment="Right">
>                 <TextBlock x:Name="lblTime"/>
>             </StatusBarItem>
>         </StatusBar>
>     </DockPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System;
> using System.Windows;
> using System.Windows.Threading;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow()
>         {
>             InitializeComponent();
>
>             // 每秒刷新状态栏时间（真实项目会随采集状态更新通信文本）
>             var timer = new DispatcherTimer { Interval = TimeSpan.FromSeconds(1) };
>             timer.Tick += (s, e) => lblTime.Text = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
>             timer.Start();
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 主窗口底部状态区：系统运行/停止状态、通信连接状态
> ✅ 实时信息：当前时间、用户/角色、当前工单
> ✅ 轻量进度：导入导出迷你进度条嵌入状态栏
> ✅ 版本/版权信息：底部常驻软件版本号
> ❌ 需要承载操作按钮（那是「toolbar-工具栏」的活）
> ❌ 状态信息条目极少（1-2 条时用普通 TextBlock 布局即可）

> [!pitfall] 常见踩坑
> 坑 1：**状态栏被内容挤压消失** → 内容区盖住状态栏。原因：未用 DockPanel.Dock。解决：`<DockPanel><StatusBar DockPanel.Dock="Bottom"/>...内容...</DockPanel>`（示例即此结构）
>
> 坑 2：**分区被压缩错位** → 右侧时间被挤出。原因：StatusBarItem 默认不弹性布局。解决：需要贴右的项目设 `HorizontalAlignment="Right"`（示例时间项），或设置固定宽度
>
> 坑 3：**状态文本不更新** → 通信断了界面还显示"已连接"。原因：文本未绑定状态源。解决：把状态绑定到 VM 属性（`INotifyPropertyChanged`），或统一由事件更新
>
> 坑 4：**误用 Button/操作控件进状态栏** → 交互混乱。原因：状态栏语义是"展示"非"操作"。解决：操作按钮放「toolbar-工具栏」/主内容区

> [!best] 最佳实践
> - 状态栏固定用 `DockPanel.Dock="Bottom"`，放 DockPanel 最后子元素确保在底部
> - 状态文本绑定 VM 属性，通信/运行状态变化时界面自动刷新
> - 分区用 `StatusBarItem` 包裹，`Separator` 分隔，语义清晰
> - 时间等高频刷新用 `DispatcherTimer`（每秒），低频状态用事件/绑定
> - 需要"操作入口"时用 ToolBar 而非 StatusBar，两者职责分明

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，观察时间每秒刷新与状态分区布局
> **Lv.2 小试牛刀**：新增"操作员"分区：显示当前登录用户名（代码里赋值一次）
> **Lv.3 融会贯通**：把"通信状态"绑定到 VM 属性：模拟连接/断开按钮切换，状态栏文字与颜色同步变化（连接绿/断开红）
> **Lv.4 挑战**：实现"状态栏 + 后台任务"：模拟下载固件，状态栏内嵌 ProgressBar 实时显示进度，完成时分区变绿

> [!related] 相关知识链接
> - ← 前置知识：「headereditemscontrol-带标题条目控件」是它的父类；「textblock-轻量文本」显示状态文字
> - → 后续必学：「toolbar-工具栏」承载操作按钮（与状态栏互补）；「menu-菜单栏」顶部导航
> - ⇄ 关联概念：「progressbar-进度条」内嵌迷你进度；「separator-分隔线」分区
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.statusbar
