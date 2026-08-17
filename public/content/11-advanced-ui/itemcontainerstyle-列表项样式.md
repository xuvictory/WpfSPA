---
title: ItemContainerStyle 列表项样式
section: 11-advanced-ui
parent: 11.2 数据模板高级应用
---

# ItemContainerStyle 列表项样式

> [!plain] 白话理解
> 每条列表数据外面还套着一层"容器"（`ListBoxItem`），容器负责**选中、悬停、焦点**这些交互状态，数据模板只管内容长什么样。`ItemContainerStyle` 就是给这层容器定规矩：哪条底色深、哪条浅（斑马纹），鼠标悬停时高亮成什么色，选中时用什么强调色。示例里 `AlternationCount=2` 让容器轮流拿到编号 0/1，样式里按 `AlternationIndex` 涂两种底色——不用给每条数据加任何字段，全是容器层的"纯视觉"逻辑，和业务数据完全分离。

> [!def] 官方定义
> `ItemContainerStyle` 是 `ItemsControl` 的属性，值为 `Style`，用于设置**项容器（Item Container）**的样式。不同类型的 `ItemsControl` 对应不同容器：`ListBox`→`ListBoxItem`、`ComboBox`→`ComboBoxItem`、`TreeView`→`TreeViewItem`、`Menu`→`MenuItem`。容器负责呈现选中/悬停/焦点等交互状态，其属性可通过 `Trigger`（如 `IsSelected`、`IsMouseOver`）或 `DataTrigger`（绑定数据项）驱动。`AlternationCount` + `ItemsControl.AlternationIndex` 提供条带化（斑马纹）编号。详见官方文档：[ItemsControl.ItemContainerStyle](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.itemscontrol.itemcontainerstyle)、[AlternationCount](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.itemscontrol.alternationcount)。

> [!origin] 由来背景
> WPF（2006 年随 .NET Framework 3.0 发布）把列表项拆成"数据（`Item`）+ 内容呈现（`ItemTemplate`）+ 容器（Item Container）"三层。容器是列表交互的载体：没有容器，选中高亮、键盘导航、虚拟化都无法实现。早期 `ItemsControl` 的容器样式只能整站改默认 `Style`，无法针对单列表定制。`ItemContainerStyle` 就是为"单控件定制容器"而生的属性：它让开发者在一个列表内重定义容器的背景、边距、触发器，而不影响全局样式。它和 `ItemTemplate` 的分工成为 WPF 列表体系的标准范式：**容器管状态，模板管内容**。

> [!essentials] 核心要点
> - **样式目标类型**：`<Style TargetType="ListBoxItem">`，`ItemContainerStyle` 只作用于本列表的容器
> - **交互状态触发器**：`IsSelected`（选中）、`IsMouseOver`（悬停）、`IsKeyboardFocusWithin`（焦点）、`IsEnabled`（禁用）
> - **斑马纹**：`AlternationCount="2"` + `Trigger Property="ItemsControl.AlternationIndex" Value="0/1"`
> - **与 `ItemTemplate` 分工**：容器样式管选择/悬停外观，`ItemTemplate` 管数据内容呈现，两者叠加
> - **`ItemContainerStyleSelector`**：需要按数据/容器状态动态选样式时可换选择器（高级）
> - **`DataTrigger` 联动**：`ItemContainerStyle` 里可 `DataTrigger` 绑定数据项属性（如按状态改容器前景）

> [!example] 完整示例
> **设备列表演示：通过 ItemContainerStyle 为 ListBoxItem 设置斑马纹交替底色、悬停高亮与选中态样式（Trigger 联动）：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="ItemContainerStyle - 设备列表" Height="440" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="列表项样式：交替颜色 + 悬停高亮 + 选中状态"
>                    Foreground="#58A6FF" FontSize="14" FontWeight="Bold"/>
>         <ListBox x:Name="DeviceList" Grid.Row="1" Margin="0,12,0,0"
>                  AlternationCount="2" Background="#161B22" BorderBrush="#21262D"
>                  Foreground="#8B949E">
>             <!-- ItemContainerStyle 作用于每个列表项容器 ListBoxItem -->
>             <ListBox.ItemContainerStyle>
>                 <Style TargetType="ListBoxItem">
>                     <Setter Property="Padding" Value="10,7"/>
>                     <Style.Triggers>
>                         <!-- AlternationIndex 与 AlternationCount 配合实现斑马纹 -->
>                         <Trigger Property="ItemsControl.AlternationIndex" Value="0">
>                             <Setter Property="Background" Value="#161B22"/>
>                         </Trigger>
>                         <Trigger Property="ItemsControl.AlternationIndex" Value="1">
>                             <Setter Property="Background" Value="#1C2128"/>
>                         </Trigger>
>                         <!-- 鼠标悬停高亮 -->
>                         <Trigger Property="IsMouseOver" Value="True">
>                             <Setter Property="Background" Value="#21262D"/>
>                         </Trigger>
>                         <!-- 选中态：深色背景 + 强调蓝文字 -->
>                         <Trigger Property="IsSelected" Value="True">
>                             <Setter Property="Background" Value="#0D1117"/>
>                             <Setter Property="Foreground" Value="#58A6FF"/>
>                             <Setter Property="FontWeight" Value="Bold"/>
>                         </Trigger>
>                     </Style.Triggers>
>                 </Style>
>             </ListBox.ItemContainerStyle>
>             <ListBox.ItemTemplate>
>                 <DataTemplate>
>                     <StackPanel Orientation="Horizontal">
>                         <TextBlock Text="{Binding Name}" Width="180"/>
>                         <TextBlock Text="{Binding State}"/>
>                     </StackPanel>
>                 </DataTemplate>
>             </ListBox.ItemTemplate>
>         </ListBox>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Collections.Generic;
> using System.Windows;
> using System.Windows.Controls;
>
> namespace HmiDemo
> {
>     // 设备信息数据模型
>     public class DeviceInfo
>     {
>         public string Name { get; set; }
>         public string State { get; set; }
>     }
>
>     public partial class MainWindow : Window
>     {
>         public MainWindow()
>         {
>             InitializeComponent();
>             DeviceList.ItemsSource = new List<DeviceInfo>
>             {
>                 new DeviceInfo { Name = "1# 注塑机", State = "运行中" },
>                 new DeviceInfo { Name = "2# 注塑机", State = "已停止" },
>                 new DeviceInfo { Name = "3# 注塑机", State = "运行中" },
>                 new DeviceInfo { Name = "4# 注塑机", State = "检修中" },
>                 new DeviceInfo { Name = "5# 注塑机", State = "已停止" },
>             };
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 长列表需要斑马纹/悬停/选中三种状态的样式定制（示例场景）
> ✅ 选中项需要明显视觉反馈的操作列表（报警列表、设备清单、任务队列）
> ✅ 容器级交互：右键菜单绑定到 `ListBoxItem`、选中项随键盘导航高亮
> ✅ 同一数据在不同列表里复用，但容器交互样式不同的场景
> ❌ 只需改内容布局（`ItemTemplate` 就能完成，无需动容器）
> ❌ 需要对"容器内部结构"彻底重构（应改 `ControlTemplate`，`ItemContainerStyle` 只能设属性）

> [!pitfall] 常见踩坑
> 坑 1：**把 `ItemContainerStyle` 当成 `ItemTemplate` 用** → 现象：写了样式但内容布局没变化 → 原因：容器样式管的是选中/悬停等属性，不管内容呈现 → 解决：内容布局放 `ItemTemplate`，交互状态放 `ItemContainerStyle`，两者配合
> 
> 坑 2：**`Trigger Property="IsSelected"` 写法漏掉类型** → 现象：样式不生效或 XAML 报错 → 原因：在 `Style` 中直接用 `IsSelected` 需要 `TargetType="ListBoxItem"` 已设置；写在 `DataTemplate` 里则需 `RelativeSource` → 解决：确认 `Style TargetType` 正确，触发器属性属于容器
>
> 坑 3：**斑马纹与悬停触发器互相覆盖** → 现象：悬停时底色没变化 → 原因：触发器按声明顺序与优先级处理，后面的触发器可能覆盖前面的 → 解决：把悬停/选中触发器放在交替纹 `Trigger` 之后（后声明优先），或把交替色放进模板级样式而非容器

> [!best] 最佳实践
> - 交替色、悬停、选中三个状态写进同一 `ItemContainerStyle`，声明顺序：交替纹 → 悬停 → 选中（越特殊越靠后）
> - 选中态的视觉要明显区别于悬停态（背景加深 + 文字变色 + 加粗），方便操作员快速定位当前项
> - 容器样式里避免直接设置字体/布局类属性（那些应放模板）；容器只管背景、边框、前景等状态外观
> - 多条列表的公共容器样式抽成 `x:Key` 的 `Style` 资源，用 `BasedOn` 继承扩展
> - 需要按数据内容改容器时用 `DataTrigger`（如"报警"项容器标红），与业务数据联动

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，逐条悬停、点击查看底色与文字变化；把 `AlternationCount` 改成 3，观察第三组颜色
> **Lv.2 小试牛刀**：给 `DeviceInfo` 增加 `IsAlarm` 属性，在 `ItemContainerStyle` 里加 `DataTrigger`：报警项容器前景变红并在左侧加红色竖条
> **Lv.3 融会贯通**：把同一 `ItemContainerStyle` 通过 `BasedOn` 复用到第二个 `ListBox`（设备报警列表），观察样式一致性，再局部覆盖选中色
> **Lv.4 拆层挑战**：实现 `ItemContainerStyleSelector`：按 `DeviceInfo.State` 返回"运行"或"停机"两种容器样式，验证与 `DataTrigger` 方案的差异与适用边界

> [!related] 相关知识链接
> - ← 前置知识：「第 5 章·什么是样式」「什么是样式」（`Style`/`Trigger` 基础）、「第 5 章·数据模板」「数据模板-datatemplate」（内容呈现层）
> - → 后续必学：`资源字典组织主题`（把容器样式收进资源字典做主题）、`dynamicresourc` 相关（主题切换时样式联动）
> - ⇄ 关联概念：`datatemplateselector-选择器`（数据侧选择模板）、「第 5 章·控件模板」「控件模板-controltemplate」（容器内部结构的重构）
> - 📖 官方文档：[ItemsControl.ItemContainerStyle](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.itemscontrol.itemcontainerstyle)、[AlternationCount](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.itemscontrol.alternationcount)、[列表项容器样式概述](https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/controls/itemscontrol-styles-and-templates)
