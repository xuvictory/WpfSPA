---
title: ItemsControl 条目控件
section: 04-controls
parent: 4.1 控件内容模型
---

# ItemsControl 条目控件

> [!plain] 白话理解
> 设备清单、报警列表、产量趋势——上位机里到处是"一堆同结构的数据项"。WinForms 的做法是循环 `for` 往控件集合里 `Add`，每项还要自己拼标签。WPF 的思路完全不同：告诉 ItemsControl"数据源是什么、每项长什么样"，它自己遍历数据、逐项套模板。
> 你只需要做两件事：给 `ItemsSource` 绑定一个集合，写一个 `DataTemplate` 定义单项外观。集合里有 3 条就渲染 3 条、有 300 条就渲染 300 条，加数据不用改界面代码。它是 `ListBox`、`ListView`、`ComboBox` 等所有"列表族"控件的祖先。

> [!def] 官方定义
> ItemsControl 是 WPF 中所有"条目型控件"的基类，位于 `System.Windows.Controls` 命名空间。它通过 `ItemsSource`（`IEnumerable`）或 `Items`（集合）承载数据，由 `ItemTemplate`（`DataTemplate`）定义每条数据的呈现方式，并用 `ItemsPanel`（`ItemsPanelTemplate`）控制条目排列方向（纵向列表、横向、Wrap 等）。`ListBox`、`ListView`、`ComboBox`、`Menu`、`TreeView` 等均派生自它，它们都复用这套"数据 + 模板 + 面板"模型。
> 官方资料：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.itemscontrol

> [!origin] 由来背景
> 传统 WinForms 中，展示一组数据要手工循环创建控件（`new Label()`、`Controls.Add(...)`），数据一变就要重建整个界面，且每项外观逻辑散落在事件代码里。WPF 引入"ItemsControl 模型"：数据与呈现彻底分离——`ItemsSource` 只管数据，`ItemTemplate` 只管单项长相，`ItemsPanel` 只管排列方式。这一抽象让"数据驱动列表"成为声明式写法，也为后续 `ListBox` 的选择、`ListView` 的分组、`ComboBox` 的下拉等高级特性打下了统一地基。

> [!essentials] 核心要点
> - **ItemsSource 绑定集合**：数据源变化后，配合 `ObservableCollection<T>` 可实现增删自动刷新
> - **ItemTemplate 定义单项外观**：每条数据套同一个模板，模板里用 `{Binding}` 取数据字段
> - **ItemsPanel 控制排列**：默认纵向 `StackPanel`，可换成 `WrapPanel`、`UniformGrid` 等实现换行、网格
> - **不拦截选择**：裸 ItemsControl 不提供选择与滚动，轻量高效；要选择/滚动就用它的子类
> - **容器生成机制**：WPF 会为每条数据生成容器元素（可通过 `ItemContainerStyle` 定制容器样式）

> [!example] 完整示例
> **设备清单演示：ItemsSource 绑定数据源 + DataTemplate 定制每条目外观：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="设备清单 - ItemsControl" Height="450" Width="700"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <StackPanel Margin="15">
>         <TextBlock Text="设备清单" FontWeight="Bold" Foreground="White" Margin="0,0,0,8"/>
>
>         <ItemsControl x:Name="DeviceList">
>             <ItemsControl.ItemTemplate>
>                 <DataTemplate>
>                     <Border Margin="0,4" Padding="8" Background="#21262D" CornerRadius="4">
>                         <StackPanel Orientation="Horizontal">
>                             <TextBlock Text="{Binding Name}" Foreground="White" Width="160"/>
>                             <TextBlock Text="{Binding Status}" Foreground="#3FB950"/>
>                         </StackPanel>
>                     </Border>
>                 </DataTemplate>
>             </ItemsControl.ItemTemplate>
>         </ItemsControl>
>     </StackPanel>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码：**
> ```csharp
> using System.Collections.Generic;
> using System.Windows;
>
> namespace HmiDemo
> {
>     public partial class MainWindow : Window
>     {
>         public MainWindow()
>         {
>             InitializeComponent();
>
>             // ItemsControl 负责"遍历数据 + 套用模板"，数据源可以是任意集合
>             DeviceList.ItemsSource = new List<Device>
>             {
>                 new Device { Name = "电机 M-101", Status = "运行中" },
>                 new Device { Name = "变频器 V-202", Status = "运行中" },
>                 new Device { Name = "传感器 S-303", Status = "待机" }
>             };
>         }
>     }
>
>     public class Device
>     {
>         public string Name { get; set; }
>         public string Status { get; set; }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 只读数据列表：设备清单、报警记录、参数表——只需要展示、不需要选中交互
> ✅ 高性能长列表：数据量大且无选择需求时，裸 ItemsControl 比 ListBox 更轻
> ✅ 自定义布局列表：用 `ItemsPanel` 换成 `WrapPanel` 做标签云、`UniformGrid` 做网格卡片
> ✅ 数据驱动面板：传感器状态、通道列表等"集合数据"的声明式展示
> ❌ 需要用户选择/多选、需要滚动条的场景（用「listbox-列表框」「listview-列表视图」）
> ❌ 需要列头、分组等表格能力的数据展示（用 `ListView` 或 DataGrid）

> [!pitfall] 常见踩坑
> 坑 1：**直接给 `Items` 循环 Add 数据** → 能显示但数据更新不自动刷新。原因：`Items` 不通知变更。解决：绑定 `ObservableCollection<T>` 到 `ItemsSource`，增删自动同步
>
> 坑 2：**DataTemplate 里绑定路径写错** → 每项空白或显示类名。原因：`{Binding}` 默认绑定到当前数据项，路径需与数据字段一致。解决：确认绑定源是数据对象而非控件自身，路径用 `nameof()` 防止拼错
>
> 坑 3：**滚动卡顿、内存飙高** → 大数据量（上万条）全部实例化。原因：裸 ItemsControl 没有虚拟化。解决：改用支持虚拟化的 `ListBox`/`ListView`（`VirtualizingStackPanel`）
>
> 坑 4：**修改 `ItemsSource` 后界面没变化** → 直接 `= new List<>()` 重新赋值不通知。原因：`ItemsSource` 属性需要通知。解决：用 `ObservableCollection` 原地增删，或重新赋值后确保属性触发 `PropertyChanged`

> [!best] 最佳实践
> - 数据源一律用 `ObservableCollection<T>`，把"数据变了界面跟着变"交给框架，别手工刷新
> - 单项外观统一写在 `ItemTemplate`（或 `DataTemplate` 资源）里，不要在代码里拼 `TextBlock`
> - 需要换行排列（标签、卡片）时设置 `ItemsPanel` 为 `WrapPanel`，不要嵌套多层 StackPanel 硬凑
> - 自定义 Item 的边距/背景用 `ItemContainerStyle` 中的 `Padding`/`Margin`，而不是塞进模板内容
> - 纯展示且数据可能上万条时，优先 `ListView`（自带虚拟化）而非裸 ItemsControl

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，往 `Device` 列表里手动增加 2 个设备对象，观察列表自动多出两条记录
> **Lv.2 小试牛刀**：把示例中的 `List<Device>` 换成 `ObservableCollection<Device>`，在按钮事件里 `Add` 一条新设备，验证界面即时刷新
> **Lv.3 融会贯通**：将 `ItemsPanel` 换成 `WrapPanel`，把示例改造成"设备卡片墙"，每条显示名称+状态
> **Lv.4 挑战**：自定义一个带虚拟化的数据列表：用 `ListView` 的 `VirtualizingStackPanel` 一次性绑定 5 万条假数据，打开任务管理器对比虚拟化前后的内存占用

> [!related] 相关知识链接
> - ← 前置知识：「contentcontrol-内容控件」了解单内容模型；第 5 章「什么是数据绑定」掌握 `ItemsSource` 绑定
> - → 后续必学：「headereditemscontrol-带标题条目控件」增加标题；「listbox-列表框」「listview-列表视图」是带选择/滚动的高级形态
> - ⇄ 关联概念：「combobox-下拉选择框」「menu-菜单栏」都是 ItemsControl 的子类，共享数据+模板模型
> - 📖 官方文档：https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.itemscontrol
