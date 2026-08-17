---
title: ToolBar 工具栏
section: 04-controls
parent: 4.8 菜单与工具栏
---

# ToolBar 工具栏

> [!plain] 白话理解
> ToolBar 就是上位机窗口顶部那一排「快捷按钮」：开始采集、停止采集、导出数据，一个按钮一个动作，点一下立即执行。菜单栏是全量命令的「目录」，工具栏则是高频命令的「快捷面板」——就像汽车中控台，方向盘上放常用的几个按键，其余功能都收在屏幕菜单里。

> [!def] 官方定义
> `ToolBar`（全限定名 `System.Windows.Controls.ToolBar`）是一个用于放置快捷操作按钮的横向容器，继承自 `HeaderedItemsControl`：内部可放 Button、ToggleButton、ComboBox、Separator 等任意元素，多个 `ToolBar` 由 `ToolBarTray`（`System.Windows.Controls.ToolBarTray`）组织成一行并支持拖动重排。官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.toolbar

> [!origin] 由来背景
> 工具栏源自 1990 年代 Windows 应用的「快捷按钮条」，最初就是菜单命令的图形化快捷键。WPF 在 .NET Framework 3.0 中提供 `ToolBar` + `ToolBarTray`，比 WinForms 更进一步：支持拖动重排、溢出收纳（空间不足时多余按钮折叠进下拉箭头）、以及 `Command` 命令绑定。上位机中「启动 / 停止 / 导出」这类一秒钟就要点到的操作，正是工具栏存在的意义。

> [!essentials] 核心要点
> - `ToolBarTray`：承载多个 `ToolBar`，支持拖动、换行（`IsLocked` 可禁用拖动）
> - 按钮与菜单共用 `Command`：工具栏按钮绑定与菜单项相同的命令
> - 溢出机制：空间不足时自动把多余元素收进「>>」溢出菜单
> - 可放置任意控件：ToggleButton（报警静音）、ComboBox（采样周期）等
> - `Separator` 分隔逻辑分组；按钮可用 `ToolTip` 提示功能

> [!example] 完整示例
> **工具栏演示：ToolBarTray 承载多组 ToolBar、工具栏按钮 + 分隔条 + 开关控件：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="工具栏 - ToolBar" Height="380" Width="680"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <DockPanel>
>         <!-- ToolBarTray 可以容纳多组 ToolBar，并支持拖动换行 -->
>         <ToolBarTray DockPanel.Dock="Top" Background="#161B22">
>             <ToolBar>
>                 <Button Content="开始采集" Click="OnStart"/>
>                 <Button Content="停止采集" Click="OnStop"/>
>                 <Separator/>
>                 <Button Content="导出数据" Click="OnExport"/>
>             </ToolBar>
>             <ToolBar>
>                 <!-- 工具栏里也能放 ToggleButton / ComboBox 等控件 -->
>                 <ToggleButton x:Name="chkAlarm" Content="报警静音"/>
>                 <Separator/>
>                 <ComboBox Width="90" SelectedIndex="0" IsEditable="False">
>                     <ComboBoxItem Content="1 秒"/>
>                     <ComboBoxItem Content="5 秒"/>
>                     <ComboBoxItem Content="10 秒"/>
>                 </ComboBox>
>             </ToolBar>
>         </ToolBarTray>
>
>         <TextBlock x:Name="tipText" Foreground="#8B949E" Margin="15" TextWrapping="Wrap"/>
>     </DockPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow() => InitializeComponent();
>
>         private void OnStart(object sender, RoutedEventArgs e) => tipText.Text = "采集已启动";
>         private void OnStop(object sender, RoutedEventArgs e) => tipText.Text = "采集已停止";
>         private void OnExport(object sender, RoutedEventArgs e) => tipText.Text = "正在导出数据…";
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 主窗口顶部高频命令区：开始 / 停止采集、导出数据
> ✅ 与菜单栏配合：菜单放全量命令，工具栏放高频命令
> ✅ 需要常驻显示状态开关（报警静音、自动刷新）的快捷操作区
> ✅ 多组工具并存时用 `ToolBarTray` 分行组织，允许用户拖动调整
> ❌ 命令只有一两个时（直接放 [button-按钮](button-按钮) 更简单）
> ❌ 命令数量很多、需要完整分类时（改用 [menu-菜单栏](menu-菜单栏)）

> [!pitfall] 常见踩坑
> 坑 1：**工具栏按钮被自动「溢出」隐藏，用户找不到** → 现象：窗口变窄后按钮消失，只在「>>」里出现。原因：`ToolBar` 默认开启溢出，空间不足自动折叠。解决：给关键按钮设置固定 `Width` 或关闭溢出行为，或用 `ToolBarTray` 多行布局保证按钮可见。
> 
> 坑 2：**工具栏拖动后布局乱了** → 现象：用户拖动 ToolBar 到奇怪位置，界面布局错乱。原因：`ToolBarTray` 允许自由拖动与换行。解决：固定场景设 `IsLocked="True"` 禁止拖动，或拖动后自动保存布局状态。
>
> 坑 3：**工具栏按钮与菜单命令逻辑重复** → 现象：采集按钮和菜单「启动采集」各写一份事件代码，一处改了另一处忘。原因：没有统一命令。解决：定义 `RoutedCommand`，工具栏按钮与菜单项绑定同一命令。

> [!best] 最佳实践
> - 工具栏只放高频命令，按钮配 `ToolTip` 文字提示；图标 + 文本或纯图标风格保持一致
> - 按钮与菜单项绑定同一 `Command`，避免逻辑重复
> - 用 `Separator` 把按钮分成 3~5 个一组，视觉层次清晰
> - 现场部署界面设 `IsLocked="True"` 防止误拖动；开发调试时放开便于调整
> - 状态型工具（报警静音）用 `ToggleButton` 并绑定 `IsChecked` 到 ViewModel，视觉上明确「开 / 关」

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例代码，点击各工具栏按钮观察提示；拖动 ToolBarTray 里的工具条体验重排
> **Lv.2 小试牛刀**：给「开始采集」按钮加 `ToolTip="开始采集 (Ctrl+R)"`；在第二个 ToolBar 里新增一个「保存配置」按钮
> **Lv.3 融会贯通**：用 `RoutedCommand` 重构示例：菜单「启动采集」与工具栏「开始采集」绑定同一命令，验证两处入口逻辑一致
> **Lv.4 挑战进阶**：把「报警静音」ToggleButton 绑定到 ViewModel 的 `bool` 属性，实现静音状态持久化；再为窗口设置 `MinWidth` 验证按钮溢出收纳行为，并对比 `IsLocked` 开启前后拖动行为差异

> [!related] 相关知识链接
> - ← 前置知识：先学本章「[button-按钮](button-按钮)」与「[menu-菜单栏](menu-菜单栏)」，工具栏按钮与菜单项使用相同命令模型
> - → 后续必学：第 7 章「什么是-MVVM」中用命令绑定把工具栏按钮接入 ViewModel
> - ⇄ 关联概念：状态开关见「[togglebutton-切换按钮](togglebutton-切换按钮)」，分组分隔见「[separator-分隔线](separator-分隔线)」
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.toolbar
