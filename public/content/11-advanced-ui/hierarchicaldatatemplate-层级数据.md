---
title: HierarchicalDataTemplate 层级数据
section: 11-advanced-ui
parent: 11.2 数据模板高级应用
---

# HierarchicalDataTemplate 层级数据

> [!plain] 白话理解
> 普通 `DataTemplate` 只能画一层，遇到"工厂 → 车间 → 设备"这种**套娃数据**就抓瞎。`HierarchicalDataTemplate` 相当于给模板装了个"递归扩展"：每个节点不但规定自己长什么样，还通过 `ItemsSource` 声明"我的下一层从哪来"。于是 `TreeView` 顺着 `站点.Lines` 展开出产线、再顺着 `产线.Devices` 展开出设备，一层套一层，数据有多少层它就能画多少层。示例里三层用了两个 `HierarchicalDataTemplate`（站点、产线）+ 一个叶子 `DataTemplate`（设备），结构一目了然。

> [!def] 官方定义
> `HierarchicalDataTemplate` 是 `System.Windows.HierarchicalDataTemplate`，继承自 `DataTemplate`，额外提供 `ItemsSource`（指定子级集合的绑定路径，如 `{Binding Lines}`）、`ItemTemplate`（指定子级使用的模板）等属性，使同一模板可以递归应用于树状数据。配合 `TreeView`/`Menu`/`ContextMenu` 等 `HeaderedItemsControl` 使用。若不指定 `ItemTemplate`，子级递归沿用同类型的隐式 `HierarchicalDataTemplate`（按 `DataType` 匹配）。详见官方文档：[HierarchicalDataTemplate 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.hierarchicaldatatemplate)。

> [!origin] 由来背景
> 树形控件（`TreeView`）是 WPF 2006 年发布时就内置的控件，但早期版本给树绑定数据很繁琐：要手写 `TreeViewItem` 递归，或用 `DataTemplate` 配一堆 `HierarchicalDataTemplate` 以外的 hack。WPF 团队在 .NET Framework 3.0 正式版中直接提供了 `HierarchicalDataTemplate`，把"层级关系"声明化：模板的 `ItemsSource` 告诉 `HeaderedItemsControl`"子项去哪取"，`ItemTemplate` 告诉它"子项长什么样"。此后递归树、级联菜单、组织架构图这类界面只需描述"每一层长啥样 + 下一层数据从哪来"，树的结构完全由数据驱动。

> [!essentials] 核心要点
> - **`ItemsSource` 绑定子级**：`ItemsSource="{Binding 子集合属性}"` 声明下一层数据源（示例 `Lines`/`Devices`）
> - **`DataType` 按类型匹配**：`DataType="{x:Type local:Site}"` 让模板自动应用于该类型节点，无需手动指定 `ItemTemplate`
> - **层级组合**：中间层用 `HierarchicalDataTemplate`，叶子层用普通 `DataTemplate`；`ItemTemplate` 可显式指定子层模板
> - **容器与宿主**：主要宿主是 `TreeView`，同样适用 `Menu`、`ContextMenu`、`TabControl` 等 `ItemsControl`
> - **叶子节点**：没有 `ItemsSource` 的节点自动呈现为叶子（不可展开）
> - **递归约束**：父子节点类型相同时可写一个模板递归匹配；类型不同则每层一个模板（示例三类型三模板）

> [!example] 完整示例
> **工厂设备树演示：用两个 HierarchicalDataTemplate 绑定「站点 → 产线 → 设备」三层数据，叶子层用普通 DataTemplate 并配 DataTrigger 显示运行状态圆点：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         xmlns:local="clr-namespace:HmiDemo"
>         Title="HierarchicalDataTemplate - 设备树" Height="460" Width="420"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="工厂设备树（站点 → 产线 → 设备）"
>                    Foreground="#58A6FF" FontSize="14" FontWeight="Bold"/>
>         <Grid.Resources>
>             <!-- 站点层：节点文字显示站点名，展开后显示 Lines 集合 -->
>             <HierarchicalDataTemplate DataType="{x:Type local:Site}" ItemsSource="{Binding Lines}">
>                 <TextBlock Text="{Binding Name}" Foreground="#58A6FF" FontWeight="Bold"/>
>             </HierarchicalDataTemplate>
>             <!-- 产线层：节点文字显示产线名，展开后显示 Devices 集合 -->
>             <HierarchicalDataTemplate DataType="{x:Type local:Line}" ItemsSource="{Binding Devices}">
>                 <TextBlock Text="{Binding Name}" Foreground="#8B949E"/>
>             </HierarchicalDataTemplate>
>             <!-- 设备层：叶子节点，用普通 DataTemplate；圆点颜色随运行状态变化 -->
>             <DataTemplate DataType="{x:Type local:Device}">
>                 <StackPanel Orientation="Horizontal">
>                     <Ellipse Width="8" Height="8" VerticalAlignment="Center" Margin="0,0,6,0">
>                         <Ellipse.Style>
>                             <Style TargetType="Ellipse">
>                                 <Setter Property="Fill" Value="#DA3633"/>
>                                 <Style.Triggers>
>                                     <DataTrigger Binding="{Binding IsRunning}" Value="True">
>                                         <Setter Property="Fill" Value="#238636"/>
>                                     </DataTrigger>
>                                 </Style.Triggers>
>                             </Style>
>                         </Ellipse.Style>
>                     </Ellipse>
>                     <TextBlock Text="{Binding Name}" Foreground="#8B949E"/>
>                 </StackPanel>
>             </DataTemplate>
>         </Grid.Resources>
>         <TreeView x:Name="DeviceTree" Grid.Row="1" Margin="0,12,0,0"
>                   Background="#161B22" BorderBrush="#21262D" Foreground="#8B949E"/>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码与数据模型：**
> ```csharp
> using System.Collections.Generic;
> using System.Windows;
> using System.Windows.Controls;
>
> namespace HmiDemo
> {
>     // 站点 → 产线 → 设备 三层数据模型
>     public class Site
>     {
>         public string Name { get; set; }
>         public List<Line> Lines { get; set; }
>     }
>
>     public class Line
>     {
>         public string Name { get; set; }
>         public List<Device> Devices { get; set; }
>     }
>
>     public class Device
>     {
>         public string Name { get; set; }
>         public bool IsRunning { get; set; }
>     }
>
>     public partial class MainWindow : Window
>     {
>         public MainWindow()
>         {
>             InitializeComponent();
>             DeviceTree.ItemsSource = BuildTree();
>         }
>
>         // 构造三层树形数据：工厂站点、下属产线、产线下设备
>         private static List<Site> BuildTree()
>         {
>             return new List<Site>
>             {
>                 new Site
>                 {
>                     Name = "华东工厂",
>                     Lines = new List<Line>
>                     {
>                         new Line
>                         {
>                             Name = "一号车间",
>                             Devices = new List<Device>
>                             {
>                                 new Device { Name = "1# 注塑机", IsRunning = true },
>                                 new Device { Name = "2# 注塑机", IsRunning = false },
>                                 new Device { Name = "3# 注塑机", IsRunning = true },
>                             }
>                         },
>                         new Line
>                         {
>                             Name = "二号车间",
>                             Devices = new List<Device>
>                             {
>                                 new Device { Name = "4# 注塑机", IsRunning = true },
>                             }
>                         }
>                     }
>                 },
>                 new Site
>                 {
>                     Name = "华南工厂",
>                     Lines = new List<Line>
>                     {
>                         new Line
>                         {
>                             Name = "三号车间",
>                             Devices = new List<Device>
>                             {
>                                 new Device { Name = "5# 注塑机", IsRunning = false },
>                             }
>                         }
>                     }
>                 }
>             };
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 设备/工位/车间/工厂的层级导航树（示例场景）、工艺路线树、物料 BOM 树
> ✅ 级联菜单与右键菜单（`Menu`/`ContextMenu` 同样支持 `HierarchicalDataTemplate`）
> ✅ 报警信息按"区域 → 设备 → 报警"分组展示
> ✅ 组织结构图、权限树、数据字典的多级浏览
> ❌ 数据层级固定只有一层（用普通 `DataTemplate` 即可）
> ❌ 层级非常深、每层结构差异巨大的场景（模板数量爆炸，考虑数据扁平化或自定义控件）

> [!pitfall] 常见踩坑
> 坑 1：**子集合属性拼写或绑定路径错** → 现象：节点出现但无法展开、展开无子项 → 原因：`ItemsSource="{Binding Lines}"` 路径与模型属性不一致，或集合为 `null` → 解决：检查模型属性名与集合初始化；在 `Site` 构造里先 `new List<Line>()`
> 
> 坑 2：**不同层类型相同导致模板串用** → 现象：子层节点样式和父层一样、层级关系混乱 → 原因：父子类型相同时模板递归匹配到同一模板，`ItemsSource` 绑错 → 解决：用 `DataType` 区分类型，或显式给每层 `ItemTemplate` 指定子层模板
>
> 坑 3：**深层次递归导致性能下降** → 现象：上千节点时展开卡顿 → 原因：每层都生成完整 `TreeViewItem` 可视化树，未虚拟化 → 解决：控制节点数量、懒加载子集（按需填充 `Children`）、必要时自定义虚拟化树

> [!best] 最佳实践
> - 每层一个 `DataType` 模板，让 `TreeView` 自动按类型匹配，`ItemsSource` 只声明"下一层从哪来"
> - 数据模型用"自引用集合"（`Children` 属性）可让同一模板递归到底，适合深度未知的树
> - 子级集合在模型构造时初始化（`Lines = new List<Line>()`），避免运行时 `null` 导致无法展开
> - 大树的节点展开做成懒加载：`TreeViewItem.Expanded` 时再从数据源拉取子级
> - 节点状态（运行/停机）用 `DataTrigger` 表达，别在模型里塞视觉属性

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，展开"华东工厂 → 一号车间"，观察三层结构与设备圆点颜色；折叠后重新展开
> **Lv.2 小试牛刀**：给 `Site` 增加 `Location` 属性（如"上海市"），在站点模板里显示为灰色小字；再增加第四层"工位"（`Station`），补一个 `HierarchicalDataTemplate`
> **Lv.3 融会贯通**：给设备树绑定 `TreeView.SelectedItem`，选中设备后在右侧面板显示其信息（名称、状态、所属产线），体会树选择与数据上下文联动
> **Lv.4 拆层挑战**：把 `BuildTree()` 改为从 `JsonSerializer` 反序列化（模拟从后台加载设备树），并实现"按设备名称搜索并自动展开定位"功能

> [!related] 相关知识链接
> - ← 前置知识：「第 5 章·数据模板」「数据模板-datatemplate」（模板基础）、`datatemplateselector-选择器`（同层多种模板的选择）
> - → 后续必学：`itemcontainerstyle-列表项样式`（`TreeViewItem` 容器样式定制）、`datatemplate-中的事件绑定`（树节点交互事件）
> - ⇄ 关联概念：「第 4 章·treeview-树控件」「treeview-树控件」（宿主控件）、「第 5 章·样式触发器」「什么是样式」（`DataTrigger` 应用）
> - 📖 官方文档：[HierarchicalDataTemplate 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.hierarchicaldatatemplate)、[TreeView 数据模板化](https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/controls/treeview-styles-and-templates)、[数据模板化概述](https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/data/data-templating-overview)
