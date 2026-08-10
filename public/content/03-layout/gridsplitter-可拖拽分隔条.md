---
title: GridSplitter 可拖拽分隔条
section: 03-layout
parent: 3.2 Grid 网格布局
---

# GridSplitter 可拖拽分隔条

> [!plain] 白话理解
> GridSplitter 就是 Grid 行列之间的"可拖动分隔线"。想象 Windows 资源管理器——左侧导航树和右侧文件列表之间的那条竖线，你按住它左右拖动就能改变两侧的宽度比例。在 WPF 中，这玩意就是 `GridSplitter`。它不像你想象的那么"开箱即用"——你需要把它放在正确的行列里，设置正确的对齐方式，才能让它按你期望的方向拖动。

> [!def] 官方定义
> GridSplitter 是一个专门与 Grid 配合使用的控件，允许用户在运行时通过鼠标拖拽来调整 Grid 的行高或列宽。它通过 `ResizeDirection`（或自动推断）确定拖拽方向（Rows 或 Columns），通过 `ResizeBehavior` 控制调整行为——`PreviousAndNext`（同时调整两边）、`PreviousAndCurrent` 或 `CurrentAndNext`。拖拽时 `ShowsPreview` 决定是实时调整（False）还是拖拽时显示虚线预览（True）。

> [!origin] 由来背景
> WinForms 的 SplitContainer 是一个封装好的"左右/上下分栏 + 拖动分隔条"控件，用起来简单，但只能做二等分。如果你想做三等分（左面板 + 中间面板 + 右面板），就做不到了——SplitContainer 只能切一刀。WPF 的选择是把分隔条做成一个独立控件 GridSplitter，放进 Grid 的任意行/列之间，你可以在任意 Grid 中放任意个 GridSplitter，切任意刀。代价是——你需要手动管理它的位置和对齐。

> [!essentials] 核心要点
> - **独立占用一行/一列**：GridSplitter 必须放在单独的一行或一列中（通常宽/高设为 `Auto` 或 `5px`），不能和内容挤在同一个单元格里
> - **拖拽方向由 Alignment 决定**：`HorizontalAlignment="Stretch"` → 水平分隔条（拖拽改变行高）；`VerticalAlignment="Stretch"` → 垂直分隔条（拖拽改变列宽）
> - **ResizeBehavior 控制行为**：`PreviousAndNext`（默认，两边同时调整）、`PreviousAndCurrent`、`CurrentAndNext`
> - **ShowsPreview**：`True` → 拖拽时显示半透明虚线预览，松开后生效；`False` → 实时调整，视觉反馈好但对性能有要求
> - **DragIncrement**：拖拽的步进单位（像素），设为 `5` 可以让拖动有"按格对齐"的感觉
> - **必须有相邻的可伸缩行/列**：拖拽只能作用于 Star 或 Auto 尺寸的行/列，拖动 Pixel 尺寸的边界无效

> [!example] 完整示例
> 用上位机中经典的"三栏设备管理面板"展示 GridSplitter 的用法：
>
> ```xml
> <!-- GridSplitterDemo.xaml -->
> <Window x:Class="HmiDemo.GridSplitterDemo"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="GridSplitter 演示 - 三栏设备管理面板" Height="520" Width="900"
>         Background="#0D1117">
>     <Grid Margin="8">
>         <!-- 顶部标题栏 -->
>         <Grid.RowDefinitions>
>             <RowDefinition Height="40"/>
>             <RowDefinition Height="6"/>
>             <RowDefinition Height="*"/>      <!-- 主内容区 -->
>             <RowDefinition Height="6"/>
>             <RowDefinition Height="Auto"/>   <!-- 状态栏 -->
>         </Grid.RowDefinitions>
>
>         <!-- 标题栏 -->
>         <Border Grid.Row="0" Background="#161B22" CornerRadius="4" Padding="10,0">
>             <StackPanel Orientation="Horizontal" VerticalAlignment="Center">
>                 <TextBlock Text="◆" Foreground="#FF6B35" FontSize="14" VerticalAlignment="Center"/>
>                 <TextBlock Text="  设备管理面板（拖动分栏线调整宽度）" 
>                            Foreground="#FF6B35" FontSize="14" FontWeight="Bold"
>                            VerticalAlignment="Center"/>
>             </StackPanel>
>         </Border>
>
>         <!-- 主内容区：三栏布局 + 两个 GridSplitter -->
>         <Grid Grid.Row="2">
>             <Grid.ColumnDefinitions>
>                 <!-- 左栏：设备树，MinWidth 防缩太小 -->
>                 <ColumnDefinition Width="1.5*" MinWidth="150"/>
>                 <!-- 分隔条列：固定 5px -->
>                 <ColumnDefinition Width="5"/>
>                 <!-- 中间栏：设备详情 -->
>                 <ColumnDefinition Width="2*" MinWidth="200"/>
>                 <!-- 分隔条列：固定 5px -->
>                 <ColumnDefinition Width="5"/>
>                 <!-- 右栏：实时参数 -->
>                 <ColumnDefinition Width="1.5*" MinWidth="150"/>
>             </Grid.ColumnDefinitions>
>
>             <!-- ====== 左栏：设备树 ====== -->
>             <Border Grid.Column="0" Background="#161B22" CornerRadius="4" Padding="10">
>                 <Grid>
>                     <Grid.RowDefinitions>
>                         <RowDefinition Height="Auto"/>
>                         <RowDefinition Height="*"/>
>                     </Grid.RowDefinitions>
>                     <TextBlock Text="📂 设备列表" Foreground="#3FB950" FontSize="13"
>                                FontWeight="Bold" Margin="0,0,0,8"/>
>                     <TreeView Grid.Row="1" Background="#0D1117" BorderThickness="0"
>                               Foreground="#C9D1D9">
>                         <TreeViewItem Header="生产线 A" IsExpanded="True">
>                             <TreeViewItem Header="PLC-001 (运行中)" Foreground="#3FB950"/>
>                             <TreeViewItem Header="PLC-002 (运行中)" Foreground="#3FB950"/>
>                             <TreeViewItem Header="CNC-001 (报警中)" Foreground="#FF6B35"/>
>                         </TreeViewItem>
>                         <TreeViewItem Header="生产线 B">
>                             <TreeViewItem Header="PLC-003 (运行中)" Foreground="#3FB950"/>
>                             <TreeViewItem Header="Robot-A1 (离线)" Foreground="#8B949E"/>
>                         </TreeViewItem>
>                         <TreeViewItem Header="生产线 C">
>                             <TreeViewItem Header="CNC-002 (维护中)" Foreground="#D29922"/>
>                         </TreeViewItem>
>                     </TreeView>
>                 </Grid>
>             </Border>
>
>             <!-- ====== 分隔条 1 ====== -->
>             <GridSplitter Grid.Column="1" Width="5" 
>                           HorizontalAlignment="Stretch"
>                           VerticalAlignment="Stretch"
>                           Background="#30363D"
>                           ShowsPreview="False"/>
>
>             <!-- ====== 中间栏：设备详情 ====== -->
>             <Border Grid.Column="2" Background="#161B22" CornerRadius="4" Padding="10">
>                 <Grid>
>                     <Grid.RowDefinitions>
>                         <RowDefinition Height="Auto"/>
>                         <RowDefinition Height="*"/>
>                         <RowDefinition Height="Auto"/>
>                         <RowDefinition Height="5"/>
>                         <RowDefinition Height="*"/>
>                     </Grid.RowDefinitions>
>
>                     <TextBlock Text="📋 设备详情" Foreground="#FF6B35" FontSize="13"
>                                FontWeight="Bold" Margin="0,0,0,8"/>
>
>                     <!-- 基本信息 -->
>                     <Border Grid.Row="1" Background="#21262D" CornerRadius="4" Padding="8">
>                         <Grid>
>                             <Grid.ColumnDefinitions>
>                                 <ColumnDefinition Width="Auto"/>
>                                 <ColumnDefinition Width="*"/>
>                             </Grid.ColumnDefinitions>
>                             <Grid.RowDefinitions>
>                                 <RowDefinition Height="Auto"/>
>                                 <RowDefinition Height="Auto"/>
>                                 <RowDefinition Height="Auto"/>
>                                 <RowDefinition Height="Auto"/>
>                             </Grid.RowDefinitions>
>
>                             <TextBlock Grid.Row="0" Grid.Column="0" Text="设备名：" Foreground="#8B949E"/>
>                             <TextBlock Grid.Row="0" Grid.Column="1" Text="CNC-001" Foreground="#C9D1D9" Margin="8,0,0,0"/>
>                             <TextBlock Grid.Row="1" Grid.Column="0" Text="IP地址：" Foreground="#8B949E"/>
>                             <TextBlock Grid.Row="1" Grid.Column="1" Text="192.168.1.100" Foreground="#C9D1D9" Margin="8,0,0,0"/>
>                             <TextBlock Grid.Row="2" Grid.Column="0" Text="型号：" Foreground="#8B949E"/>
>                             <TextBlock Grid.Row="2" Grid.Column="1" Text="FANUC Series 31i" Foreground="#C9D1D9" Margin="8,0,0,0"/>
>                             <TextBlock Grid.Row="3" Grid.Column="0" Text="状态：" Foreground="#8B949E"/>
>                             <TextBlock Grid.Row="3" Grid.Column="1" Text="● 运行中" Foreground="#3FB950" Margin="8,0,0,0"/>
>                         </Grid>
>                     </Border>
>
>                     <!-- 上方区域和下方区域之间也加一个水平分隔条 -->
>                     <GridSplitter Grid.Row="2" Height="5"
>                                   HorizontalAlignment="Stretch"
>                                   VerticalAlignment="Stretch"
>                                   Background="#30363D"
>                                   ShowsPreview="False"/>
>
>                     <!-- 报警列表 -->
>                     <Grid Grid.Row="4">
>                         <Grid.RowDefinitions>
>                             <RowDefinition Height="Auto"/>
>                             <RowDefinition Height="*"/>
>                         </Grid.RowDefinitions>
>                         <TextBlock Text="⚠ 近期报警 (此区域高度可拖拽)" Foreground="#FF6B35"
>                                    FontSize="12" Margin="0,0,0,4"/>
>                         <ListBox Grid.Row="1" Background="#21262D" BorderThickness="0"
>                                  Foreground="#C9D1D9">
>                             <ListBoxItem Content="14:30 - 主轴温度过高 (92.5°C)"/>
>                             <ListBoxItem Content="13:15 - 冷却液压力不足"/>
>                             <ListBoxItem Content="11:42 - 刀具磨损报警"/>
>                         </ListBox>
>                     </Grid>
>                 </Grid>
>             </Border>
>
>             <!-- ====== 分隔条 2 ====== -->
>             <GridSplitter Grid.Column="3" Width="5"
>                           HorizontalAlignment="Stretch"
>                           VerticalAlignment="Stretch"
>                           Background="#30363D"
>                           ShowsPreview="False"/>
>
>             <!-- ====== 右栏：实时参数 ====== -->
>             <Border Grid.Column="4" Background="#161B22" CornerRadius="4" Padding="10">
>                 <Grid>
>                     <Grid.RowDefinitions>
>                         <RowDefinition Height="Auto"/>
>                         <RowDefinition Height="*"/>
>                     </Grid.RowDefinitions>
>                     <TextBlock Text="📊 实时参数" Foreground="#58A6FF" FontSize="13"
>                                FontWeight="Bold" Margin="0,0,0,8"/>
>                     <WrapPanel Grid.Row="1">
>                         <Border Background="#21262D" CornerRadius="4" Padding="10" 
>                                 Width="110" Margin="0,0,6,6">
>                             <StackPanel>
>                                 <TextBlock Text="主轴转速" Foreground="#8B949E" FontSize="11"/>
>                                 <TextBlock Text="4500" Foreground="#3FB950" FontSize="22"
>                                            FontWeight="Bold"/>
>                                 <TextBlock Text="rpm" Foreground="#8B949E" FontSize="10"/>
>                             </StackPanel>
>                         </Border>
>                         <Border Background="#21262D" CornerRadius="4" Padding="10" 
>                                 Width="110" Margin="0,0,6,6">
>                             <StackPanel>
>                                 <TextBlock Text="进给速度" Foreground="#8B949E" FontSize="11"/>
>                                 <TextBlock Text="250" Foreground="#FF6B35" FontSize="22"
>                                            FontWeight="Bold"/>
>                                 <TextBlock Text="mm/min" Foreground="#8B949E" FontSize="10"/>
>                             </StackPanel>
>                         </Border>
>                         <Border Background="#21262D" CornerRadius="4" Padding="10" 
>                                 Width="110" Margin="0,0,0,6">
>                             <StackPanel>
>                                 <TextBlock Text="运行时间" Foreground="#8B949E" FontSize="11"/>
>                                 <TextBlock Text="128" Foreground="#C9D1D9" FontSize="22"
>                                            FontWeight="Bold"/>
>                                 <TextBlock Text="小时" Foreground="#8B949E" FontSize="10"/>
>                             </StackPanel>
>                         </Border>
>                     </WrapPanel>
>                 </Grid>
>             </Border>
>         </Grid>
>
>         <!-- 底部状态栏 -->
>         <Border Grid.Row="4" Background="#161B22" CornerRadius="4" Padding="10,4">
>             <StackPanel Orientation="Horizontal">
>                 <TextBlock Text="💡 提示：" Foreground="#8B949E" FontSize="11"/>
>                 <TextBlock Text="按住灰线拖拽可调整面板宽度；中间栏内也有水平分隔条可调区域高度" 
>                            Foreground="#8B949E" FontSize="11"/>
>             </StackPanel>
>         </Border>
>     </Grid>
> </Window>
> ```
>
> ```csharp
> // GridSplitterDemo.xaml.cs
> using System.Windows;
>
> namespace HmiDemo;
>
> public partial class GridSplitterDemo : Window
> {
>     public GridSplitterDemo()
>     {
>         InitializeComponent();
>     }
> }
> ```
>
> **GridSplitter 配置速查表：**
> | 属性 | 可选值 | 说明 |
> |------|--------|------|
> | `HorizontalAlignment` | `Stretch` | 水平拖动（改列宽） |
> | `VerticalAlignment` | `Stretch` | 垂直拖动（改行高） |
> | `ResizeBehavior` | `PreviousAndNext`（默认）/ `PreviousAndCurrent` / `CurrentAndNext` | 拖动时调整哪些行/列 |
> | `ShowsPreview` | `True` / `False` | 是否先预览虚线再生效 |
> | `DragIncrement` | 数字（如 `5`） | 拖动步进，0 为平滑 |
> | `Background` | 颜色 | 分隔条的视觉样式 |

> [!scene] 适用场景
> ✅ **资源管理器式三栏布局**：左侧导航树 + 中间列表 + 右侧详情，两条竖分隔线
> ✅ **上位机监控面板**：设备树 + 报警列表 + 参数面板，操作员可自由调整各区域大小
> ✅ **上下分栏**：上半区曲线图 + 下半区数据表格，水平分隔条拖拽调整高度比
> ✅ **代码编辑器风格**：文件树 + 编辑区 + 属性面板，全屏状态下的极致分栏体验
> ❌ **不需要用户调整的固定比例**：直接用 Star 比例即可，不需要 GridSplitter 增加交互复杂度

> [!pitfall] 常见踩坑
> 坑 1：**GridSplitter 没放在独立列/行中** → 如果 GridSplitter 和内容控件放在同一列，拖动时会挡住内容，且行为不可预测。必须给 GridSplitter 单独分配一列（`Width="5"`），并且给它设置 `HorizontalAlignment="Stretch"`。
>
> 坑 2：**忘记设 Stretch 导致方向错误** → GridSplitter 的拖拽方向由 `HorizontalAlignment` 和 `VerticalAlignment` 隐式决定。如果想水平拖拽（改列宽）但设了 `VerticalAlignment="Stretch"`，它会变成垂直拖动。简单记忆：**拉伸哪个方向 = 沿哪个方向分割**。
>
> 坑 3：**拖拽 Pixel 列无效** → GridSplitter 只能调整 Star 或 Auto 尺寸的行/列。如果被拖拽的两列都是固定像素，拖动不会有任何效果。确保至少一侧是 Star 列。

> [!best] 最佳实践
> - GridSplitter 放在独立的列（`Width="5"`）或行（`Height="5"`）中，不要复用内容区域
> - 给可拖动的面板设置 `MinWidth` / `MaxWidth`，防止用户拖到完全不可见的极端位置
> - `Background="#30363D"` 让分隔条有微妙的可见性，拖拽时鼠标变为双向箭头给用户暗示
> - `ShowsPreview="False"` 实时调整体验更好（除非面板内容特别重、实时拖动卡顿，才用 Preview 模式）
> - GridSplitter 的拖拽会触发 `DragStarted`、`DragDelta`、`DragCompleted` 事件，可在这些事件中保存用户的面板尺寸偏好到本地

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例程序，拖动两条灰线——观察左侧设备树和右侧参数面板宽度的变化，以及中间报警区域高度的变化
> **Lv.2 小试牛刀**：把其中一个 GridSplitter 的 `ShowsPreview` 改为 `True`，感受虚线预览 vs 实时拖动的区别；把 `DragIncrement` 设为 `20`，感受"按格拖动"的吸附感
> **Lv.3 融会贯通**：设计一个"上下左右全可分"的四面板布局：左上文件列表、右上编辑区、左下属性面板、右下输出日志，用 3 条 GridSplitter（1 竖 2 横）实现全部可拖动

> [!related] 相关知识链接
> - ← 前置知识：Grid 核心特点与属性（Grid 是 GridSplitter 的宿主）
> - ← 前置知识：尺寸模式详解（理解 Star/Auto/Pixel 列才能理解拖拽的作用对象）
> - → 后续必学：Grid 用法示例与最佳实践（嵌套 Grid 和 GridSplitter 的综合应用）
> - ⇄ 关联概念：ResizeBehavior 枚举、DragIncrement、DragStarted/DragCompleted 事件
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.gridsplitter
