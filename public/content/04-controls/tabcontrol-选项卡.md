---
title: TabControl 选项卡
section: 04-controls
parent: 4.7 容器与分组控件
---

# TabControl 选项卡

> [!plain] 白话理解
> TabControl 就像设备操作台上的「功能分页夹」。一台设备的维护界面要同时放基本参数、运行数据、报警记录，全部堆在一个窗口里既挤又容易误操作。TabControl 把界面按页分区：顶部一排页签，点哪个翻到哪页，一页只专注一类信息——就像多层文件抽屉，拉开哪层看哪层，互不干扰。

> [!def] 官方定义
> `TabControl`（全限定名 `System.Windows.Controls.TabControl`）是一个以页签形式组织内容的控件：它的 `Items` 集合中每个 `TabItem` 对应一个页签，用户点击页签头（`TabItem.Header`）即可在多个 `Content` 之间切换，同一时刻只显示一个页签的内容。它继承自 `ItemsControl`，可通过 `ItemsSource` 数据绑定动态生成页签。官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.tabcontrol

> [!origin] 由来背景
> TabControl 的前身是 Win32 时代的「属性页对话框」：Windows 早期系统设置把几十个选项拆成多页，避免一个对话框堆满控件。WPF 在 2006 年随 .NET Framework 3.0 发布时把它演进为通用容器控件 `TabControl`——不再局限于表单，支持任意内容、数据绑定和自定义页签头。上位机「一台设备一个配置窗口、按功能分区」的需求，恰好是它的典型应用场景。

> [!essentials] 核心要点
> - `SelectedIndex` / `SelectedItem`：读取或设置当前选中页，代码里可跳转（如启动默认定位到运行参数页）
> - `TabItem.Header`：页签标题，可放任意内容（文本、带图标或状态点的 StackPanel）
> - `SelectionChanged` 事件：切换页签时触发，常用于按页懒加载数据
> - 每个 `TabItem` 只能放一个 `Content` 子元素，页面内容多时用 `Grid` 等容器承载
> - 内容默认常驻可视化树：切页只改变可见性，不会重新创建内容（这与浏览器标签页不同）

> [!example] 完整示例
> **设备配置页演示：多 TabItem 分区、代码动态切换选中页、读取当前页：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="设备配置 - TabControl" Height="420" Width="560"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <TabControl x:Name="tabs" Margin="12">
>         <!-- 基本信息页 -->
>         <TabItem Header="基本信息">
>             <StackPanel Margin="15">
>                 <TextBlock Text="设备名称：主电机 M-101" Foreground="White" Margin="0,0,0,6"/>
>                 <TextBlock Text="额定功率：45 kW" Foreground="White" Margin="0,0,0,6"/>
>                 <TextBlock Text="投运日期：2024-03-12" Foreground="White"/>
>             </StackPanel>
>         </TabItem>
>         <!-- 运行参数页 -->
>         <TabItem Header="运行参数">
>             <StackPanel Margin="15">
>                 <TextBlock Text="当前转速：1500 RPM" Foreground="White" Margin="0,0,0,6"/>
>                 <TextBlock Text="当前温度：65 ℃" Foreground="White" Margin="0,0,0,6"/>
>                 <TextBlock Text="累计运行：128 小时" Foreground="White"/>
>             </StackPanel>
>         </TabItem>
>         <!-- 报警记录页 -->
>         <TabItem Header="报警记录">
>             <ListBox Background="#161B22" Foreground="#C9D1D9" BorderThickness="0">
>                 <ListBoxItem Content="[10:12] 电机过热报警"/>
>                 <ListBoxItem Content="[11:05] 通信中断恢复"/>
>             </ListBox>
>         </TabItem>
>     </TabControl>
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
>         public MainWindow()
>         {
>             InitializeComponent();
>
>             // 程序启动默认定位到"运行参数"页
>             tabs.SelectedIndex = 1;
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 设备配置窗口按「基本参数 / 运行参数 / 报警记录」分页组织
> ✅ 同一 HMI 界面在不同工位、不同配方之间切换显示
> ✅ 操作页、调试页、维护页用页签隔离，配合权限控制
> ✅ 日志 / 报表按类型分页浏览，每页对应一类记录
> ❌ 页面间需要自由跳转、有复杂层级导航时（改用 [frame-页面框架](frame-页面框架)）
> ❌ 需要同时对比查看多个分区内容时（TabControl 同一时刻只显示一页）

> [!pitfall] 常见踩坑
> 坑 1：**切换页签后数据不刷新** → 现象：切到「报警记录」页，列表还是旧数据。原因：WPF `TabControl` 的 `TabItem` 内容默认常驻可视化树，切页只改变可见性，不会重新加载。解决：在 `SelectionChanged` 事件里按 `SelectedIndex` 刷新对应页数据，或让列表绑定 `ObservableCollection` 由通知自动更新。
> 
> 坑 2：**页签多、页面重导致启动卡顿** → 现象：窗口一打开卡几秒，图表页、大表格页全部被初始化。原因：默认所有 `TabItem` 内容在窗口加载时就被实例化。解决：对重型页面做懒加载——首次选中时再创建内容（如在 `SelectionChanged` 中按需给 `Content` 赋值）。
>
> 坑 3：**深色主题下页签头文字看不清** → 现象：界面整体是深色，`TabItem` 页签头却是白底黑字。原因：页签头前景色继承系统默认主题。解决：在 `TabControl` 上统一设置 `Foreground` 与 `Background`，或自定义 `TabItem` 模板。

> [!best] 最佳实践
> - 页签数量控制在 3~6 个，超过 6 个说明窗口职责过重，考虑拆分为多个窗口或改用导航框架
> - 页签标题用「名词短语」（如「基本参数」），避免「设置 1」「设置 2」这种含糊命名
> - 数据量大的页签（如报警列表）在首次选中时才加载，避免启动时全量加载
> - 页签内需要自动刷新的数据一律走数据绑定，不要手动在切页事件里搬数据
> - 需要状态保持的监控页用数据绑定承载内容，切回时立即呈现最新状态

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例代码，逐个点击页签切换页面；修改 `tabs.SelectedIndex = 1` 的初始值，观察启动默认页变化
> **Lv.2 小试牛刀**：给「报警记录」`TabItem` 加 `IsSelected="True"` 让启动默认停在报警页；再新增一个「通信配置」页签并放入两个 TextBox
> **Lv.3 融会贯通**：把 `TabControl.ItemsSource` 绑定到一个设备集合，用 `ItemTemplate` 动态生成页签，实现「点选设备显示该设备的参数页」
> **Lv.4 挑战进阶**：实现页签懒加载 + 访问历史：记录用户本次会话点击过哪些页签，在「最近访问」页签里列出并可一键跳转

> [!related] 相关知识链接
> - ← 前置知识：先掌握本章「[contentcontrol-内容控件](contentcontrol-内容控件)」的内容模型，理解 TabItem 如何承载内容
> - → 后续必学：本章「[frame-页面框架](frame-页面框架)」提供页面级导航的另一种方案
> - ⇄ 关联概念：页内分区用「[groupbox-分组框](groupbox-分组框)」，折叠式分区用「[expander-折叠面板](expander-折叠面板)」
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.tabcontrol
