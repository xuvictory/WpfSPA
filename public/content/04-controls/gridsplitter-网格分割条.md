---
title: GridSplitter 网格分割条
section: 04-controls
parent: 4.9 装饰与辅助控件
---

# GridSplitter 网格分割条

> [!plain] 白话理解
> GridSplitter 就是界面上那条可以「拖来拖去」的分隔条：设备列表、详情、日志三栏布局，用户把鼠标移到两栏交界处，按住左右一拖，两栏的宽度就跟着调整。它让每个操作工都能按自己的习惯调整界面比例——就像实验室的分液漏斗，中间的节流阀一拧，两边液面就重新分配。

> [!def] 官方定义
> `GridSplitter`（全限定名 `System.Windows.Controls.GridSplitter`）是用于交互式调整 `Grid` 行列尺寸的控件：它占用一个 `Grid` 单元格，通过 `ResizeBehavior` 指定调整相邻的列 / 行（如 `PreviousAndNext`），拖动时 `ShowsPreview` 控制是否实时显示效果，`ResizeDirection`（`Columns` / `Rows`）决定调整方向。官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.gridsplitter

> [!origin] 由来背景
> 可拖拽分栏最早出现在 1990 年代的集成开发环境与文件管理器（如 Windows 资源管理器的「文件夹 / 文件」双栏）。WPF 在 .NET Framework 3.0 中提供 `GridSplitter`，让开发者不用自己处理鼠标拖动、尺寸计算与最小宽度限制——只需在 Grid 里占一格，框架自动完成其余工作。上位机「设备树 | 详情 | 日志」这类固定三栏的监控布局，正是它的典型舞台。

> [!essentials] 核心要点
> - `ResizeDirection`：`Columns`（调列宽）或 `Rows`（调行高）
> - `ResizeBehavior`：`PreviousAndNext`（同时调相邻两栏）/ `Previous` / `Next`
> - `ShowsPreview`：`True` 时拖动先显示预览虚线，松开才生效
> - 相邻 `ColumnDefinition` / `RowDefinition` 要设 `MinWidth` / `MinHeight`，防止拖过头
> - `Width` / `Height` 与 `HorizontalAlignment` / `VerticalAlignment` 决定分割条形状（竖条宽 5~8、横条高 5~8）

> [!example] 完整示例
> **可拖拽分栏布局演示：GridSplitter 拖动调整列宽，实现"设备树 | 详情 | 日志"三栏：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="分栏布局 - GridSplitter" Height="460" Width="760"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="10">
>         <Grid.ColumnDefinitions>
>             <ColumnDefinition Width="2*" MinWidth="140"/>
>             <ColumnDefinition Width="Auto"/>
>             <ColumnDefinition Width="5*" MinWidth="220"/>
>             <ColumnDefinition Width="Auto"/>
>             <ColumnDefinition Width="3*" MinWidth="140"/>
>         </Grid.ColumnDefinitions>
>
>         <!-- 左栏：设备列表 -->
>         <ListBox Grid.Column="0" Background="#161B22" Foreground="White"
>                  BorderBrush="#2A4A6C" BorderThickness="1">
>             <ListBoxItem Content="电机 M-101"/>
>             <ListBoxItem Content="变频器 V-202"/>
>             <ListBoxItem Content="传感器 S-303"/>
>         </ListBox>
>
>         <!-- 第一个可拖拽分割条（Vertical 默认） -->
>         <GridSplitter Grid.Column="1" Width="6" HorizontalAlignment="Stretch"
>                       Background="#2A4A6C" ResizeBehavior="PreviousAndNext"
>                       ShowsPreview="True"/>
>
>         <!-- 中栏：设备详情 -->
>         <StackPanel Grid.Column="2" Background="#161B22" BorderBrush="#2A4A6C"
>                     BorderThickness="1" Padding="10">
>             <TextBlock Text="设备详情" FontWeight="Bold" Foreground="White"/>
>             <TextBlock Text="当前转速：1500 RPM" Foreground="#8B949E" Margin="0,10,0,0"/>
>         </StackPanel>
>
>         <!-- 第二个分割条 -->
>         <GridSplitter Grid.Column="3" Width="6" HorizontalAlignment="Stretch"
>                       Background="#2A4A6C" ResizeBehavior="PreviousAndNext"/>
>
>         <!-- 右栏：运行日志 -->
>         <TextBox Grid.Column="4" AcceptsReturn="True" TextWrapping="Wrap"
>                  IsReadOnly="True" Text="[10:12] 设备启动&#x0a;[10:15] 参数下发成功"
>                  Background="#161B22" Foreground="#C9D1D9" BorderBrush="#2A4A6C"
>                  BorderThickness="1" VerticalScrollBarVisibility="Auto"/>
>     </Grid>
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
> ✅ 「设备树 | 详情 | 日志」三栏可调布局
> ✅ 监控主界面「实时曲线 + 参数列表」左右分栏
> ✅ 报表编辑「编辑区 + 属性面板」左右分栏
> ✅ 需要让用户按习惯调整信息密度的多栏界面
> ❌ 需要固定比例、不允许用户改变布局时（直接用 `ColumnDefinition` 的 `*` 比例即可）
> ❌ 分区之间逻辑强关联、不能随意拉伸时（先考虑固定布局）

> [!pitfall] 常见踩坑
> 坑 1：**GridSplitter 拖不动或鼠标样式不变** → 现象：分割条摆好了，鼠标移上去没有「左右拉伸」光标，拖不动。原因：分割条所在列宽是 `Auto` 或没占满，导致它宽度为 0 或被隐藏。解决：给分割条所在列设 `Width="Auto"`，并为分割条显式设 `Width="6"` + `HorizontalAlignment="Stretch"`（竖向），保证可命中鼠标。
> 
> 坑 2：**拖动时把某栏拖没了，内容挤压变形** → 现象：一直拖到某栏宽度为 0，内容被裁掉。原因：目标列没有最小宽度限制。解决：给每个 `ColumnDefinition` 设 `MinWidth`（如 140），并用 `ResizeBehavior="PreviousAndNext"` 让两侧同时调整、不会单向清零。
>
> 坑 3：**ShowsPreview=True 时松手位置和预期不一致** → 现象：拖动后预览线位置与最终结果对不上。原因：`ShowsPreview` 只是预览，最终位置由鼠标松开的坐标决定。解决：需要精确对齐时配合方向键微调，或对大数据列表保持 `True`（避免拖动过程频繁重绘）并接受预览偏差。

> [!best] 最佳实践
> - 分割条宽度设为 5~8px，两侧留出视觉间距，深色主题下用 `#2A4A6C` 一类描边色
> - 每个可调列 / 行都要设 `MinWidth` / `MinHeight`，防止内容被压没
> - 三栏布局用两个 GridSplitter，`ResizeBehavior="PreviousAndNext"` 保持总宽度不变
> - 主监控界面建议 `ShowsPreview="True"`，避免拖动过程中频繁重绘大数据列表
> - 布局比例可持久化：在拖动结束事件里保存 `ColumnDefinition.Width` 到配置，下次启动恢复

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例代码，拖动两个分割条调整三栏宽度，观察各栏内容随宽度变化
> **Lv.2 小试牛刀**：把第二个分割条的 `ShowsPreview` 改为 `True`，对比拖动体验；把三栏初始比例改为 3* / 4* / 3*
> **Lv.3 融会贯通**：实现纵向分割：在窗口下部加一行横向 GridSplitter，把「参数区」与「日志区」上下分隔并支持拖高调整
> **Lv.4 挑战进阶**：实现布局持久化：在 `DragCompleted` 事件中把各 `ColumnDefinition.Width` 保存到配置文件，程序启动时读取并恢复上次布局

> [!related] 相关知识链接
> - ← 前置知识：先学第 3 章「布局」中的 Grid 列宽比例与 `ColumnDefinition`，再学 GridSplitter 的动态调整
> - → 后续必学：本章「[expander-折叠面板](expander-折叠面板)」的收起展开可与分栏配合节省空间
> - ⇄ 关联概念：静态分隔用「[separator-分隔线](separator-分隔线)」，带标题分区用「[groupbox-分组框](groupbox-分组框)」
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.gridsplitter
