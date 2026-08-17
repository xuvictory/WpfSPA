---
title: Separator 分隔线
section: 04-controls
parent: 4.9 装饰与辅助控件
---

# Separator 分隔线

> [!plain] 白话理解
> Separator 就是界面里的「分隔线」：菜单里把「打开/保存」和「退出」隔开，工具栏里把「新建/打开」和「剪切/复制」隔开，一条细线就完成了功能分组。它不承载任何业务逻辑，纯粹是排版工具——就像档案柜里的分类隔板，让相邻的几类东西一眼就能分清边界。

> [!def] 官方定义
> `Separator`（全限定名 `System.Windows.Controls.Separator`）是一个用于视觉分组的线条元素，继承自 `Control`：它通常作为菜单（`MenuItem` 集合）和工具栏（`ToolBar` 内容）中的分隔项使用，也可放在布局容器里作水平或垂直分隔线，本身不产生交互。官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.separator

> [!origin] 由来背景
> 分隔线是图形界面最早的排版元素之一：早在菜单系统发明时，设计者就用横线把功能相近的命令分成若干组，方便用户扫读。WPF 在 .NET Framework 3.0 中把 `Separator` 作为标准控件提供，并让它自动适应所在容器——在 `Menu` / `ToolBar` 里自动变为竖向分隔，在 `StackPanel` 等容器里则按方向呈现横 / 竖线。它虽简单，却是界面「分组可读性」的基础组件。

> [!essentials] 核心要点
> - 在 `Menu` / `MenuItem` 中：直接作为子元素插入即可生成竖向分组线
> - 在 `ToolBar` 中：同样作为子元素插入，自动竖向分隔
> - 在布局容器（如 `StackPanel` / `Grid`）中：作为普通元素摆放，用 `Height` / `Width` 控制粗细、`Background` 控制颜色
> - 自身不触发事件、不接收焦点，纯展示元素
> - 分组密度以 3~5 个功能一组为宜，分隔线不宜过密

> [!example] 完整示例
> **菜单与工具栏中的分隔线演示：Separator 在菜单分组、工具栏分组中的使用：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="分隔线 - Separator" Height="360" Width="600"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <DockPanel>
>         <StackPanel DockPanel.Dock="Top" Background="#161B22">
>             <Menu Background="Transparent" Foreground="White">
>                 <MenuItem Header="文件">
>                     <MenuItem Header="打开"/>
>                     <MenuItem Header="保存"/>
>                     <!-- 菜单中的分隔线 -->
>                     <Separator/>
>                     <MenuItem Header="退出"/>
>                 </MenuItem>
>             </Menu>
>             <!-- 工具栏与菜单之间的横向分隔线 -->
>             <Separator Background="#2A4A6C" Height="1" Margin="0,2"/>
>             <ToolBarTray Background="Transparent">
>                 <ToolBar>
>                     <Button Content="新建"/>
>                     <Button Content="打开"/>
>                     <!-- 工具栏中的竖向分隔线 -->
>                     <Separator/>
>                     <Button Content="剪切"/>
>                     <Button Content="复制"/>
>                 </ToolBar>
>             </ToolBarTray>
>         </StackPanel>
>
>         <TextBlock Text="分隔线用于把功能分组，提升界面可读性。" Foreground="#8B949E"
>                    Margin="15" VerticalAlignment="Top"/>
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
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 菜单里把「文件操作」与「退出」等命令分组
> ✅ 工具栏中把「文件类」与「编辑类」按钮分组
> ✅ 设置面板中把不同类别的参数区块用细线隔开
> ✅ 窗口底部状态栏与内容区之间画一条分界线
> ❌ 需要可拖拽调整分区大小时（改用 [gridsplitter-网格分割条](gridsplitter-网格分割条)）
> ❌ 需要带标题的分组边框时（改用 [groupbox-分组框](groupbox-分组框)）

> [!pitfall] 常见踩坑
> 坑 1：**Separator 在 Grid 里变成一条粗黑块** → 现象：在 Grid 中放 Separator，它占满了整个单元格。原因：`Separator` 默认拉伸到所在单元格的完整尺寸。解决：显式设置 `Height="1"`（横向）或 `Width="1"`（竖向），并设置 `HorizontalAlignment` / `VerticalAlignment`。
> 
> 坑 2：**菜单里分隔线样式错乱，和主题不搭** → 现象：自定义了菜单模板后 Separator 显示异常。原因：Separator 在 Menu 中的样式由 `Menu` 的模板提供，模板替换后默认样式失效。解决：为 Separator 定义统一的 `Style` 资源，或复用系统主题模板。
>
> 坑 3：**深色主题下分隔线看不见** → 现象：深色背景上分隔线颜色几乎融进去。原因：未设置 `Background`，使用默认浅色。解决：显式设置 `Background="#2A4A6C"` 一类深色主题适配色，或定义全局样式。

> [!best] 最佳实践
> - 分隔线只做「同层级」功能分组，不要把层级关系不同的功能混在一起划线
> - 每个分组内的菜单项 / 按钮保持 3~5 个，超过 5 个考虑再拆一组
> - 在 Menu 和 ToolBar 中直接插 `<Separator/>` 即可，无需设置属性
> - 在布局容器中统一用全局样式控制分隔线颜色与粗细，保持全站一致
> - 分隔线前后可配合少量间距（Margin），视觉更透气

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例代码，观察菜单内、工具栏内、菜单栏下的三处分隔线差异
> **Lv.2 小试牛刀**：在「文件」菜单的「打开」「保存」之间再插入一个 Separator；给菜单栏下的横向分隔线加 `Margin="0,4"` 看间距变化
> **Lv.3 融会贯通**：在窗口内容区放两个 GroupBox，用一条 `Height="1"` 的 Separator 连接，调整 Background 颜色使其与深色主题协调
> **Lv.4 挑战进阶**：给整个应用的 Separator 定义一个全局 `Style`（颜色、粗细、Margin 统一），验证菜单、工具栏、布局容器三处分隔线自动套用同一风格

> [!related] 相关知识链接
> - ← 前置知识：先学本章「[menu-菜单栏](menu-菜单栏)」与「[toolbar-工具栏](toolbar-工具栏)」，Separator 是它们的分组工具
> - → 后续必学：本章「[gridsplitter-网格分割条](gridsplitter-网格分割条)」实现可拖拽的分区
> - ⇄ 关联概念：带标题分组用「[groupbox-分组框](groupbox-分组框)」，布局容器见第 3 章「布局」
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.separator
