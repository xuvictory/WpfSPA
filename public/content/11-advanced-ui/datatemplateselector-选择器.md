---
title: DataTemplateSelector 选择器
section: 11-advanced-ui
parent: 11.2 数据模板高级应用
---

# DataTemplateSelector 选择器

> [!plain] 白话理解
> `DataTemplateSelector` 像车间里的**自动分拣员**：传送带上滚来不同的工件（数据对象），分拣员只看一眼标签（数据内容），就把它分到对应的包装线（模板）。没有它，一条列表只能用一种模板"统一样式"；有了它，同一个 `ListBox` 里"运行中的设备"走绿色模板、"停机的设备"走红色模板，全凭数据自己说话。示例里 `SelectTemplate` 就是分拣员的判断标准：`IsRunning` 为真去 `RunningTemplate`，否则去 `StoppedTemplate`。

> [!def] 官方定义
> `DataTemplateSelector` 是抽象类 `System.Windows.Controls.DataTemplateSelector` 的派生类，通过重写 `SelectTemplate(object item, DependencyObject container)` 方法，根据数据项内容返回对应的 `DataTemplate`，实现"同一条集合、多种呈现"的动态模板选择。宿主控件通过 `ItemsControl.ItemTemplateSelector`（列表）或 `ContentControl.ContentTemplateSelector`（单内容）挂载选择器实例。返回 `null` 时回退到 `ItemTemplate`。详见官方文档：[DataTemplateSelector 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.datatemplateselector)、[选择 DataTemplate](https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/data/data-templating-overview)。

> [!origin] 由来背景
> WPF 的数据模板机制（2006 年随 .NET Framework 3.0 发布）允许"数据 + 呈现"完全分离，但早期版本中"同一集合里不同类型/状态的数据要用不同模板"只能靠写多个控件或大量 `DataTrigger`。`DataTemplateSelector` 是框架提供的第一代"运行时选模板"入口：`SelectTemplate` 每次生成容器时被调用，用代码决定返回哪个模板。它解决的问题（数据驱动多样化呈现）后来逐渐被 `DataTemplate.Triggers`、`DataTemplate.DataType` 自动匹配、以及 .NET 4 之后的隐式 `DataTemplate` 覆盖一部分，但对"运行时根据数据内容跳转模板"这类动态场景，`DataTemplateSelector` 仍是最直接的方案。

> [!essentials] 核心要点
> - **继承与重写**：`class XxxSelector : DataTemplateSelector`，重写 `SelectTemplate(item, container)`，按 `item` 内容返回模板
> - **挂载方式**：列表控件设 `ItemTemplateSelector`；`ContentControl` 设 `ContentTemplateSelector`；`GridViewColumn` 有各自的 `CellTemplateSelector`
> - **模板注入**：选择器暴露 `DataTemplate` 类型公开属性，在 XAML 资源里把模板赋给它（示例 `RunningTemplate`/`StoppedTemplate`）
> - **`container` 参数**：`ItemsControl` 时为对应的 `ContentPresenter`/`ListBoxItem`，可用于按容器状态（如选中）附加选择
> - **回退规则**：返回 `null` 时使用 `ItemTemplate`；若也缺失则显示数据对象的 `ToString()`
> - **性能注意**：每次生成容器都会调用 `SelectTemplate`，判断逻辑要轻量，不要做 IO 或复杂计算

> [!example] 完整示例
> **设备列表演示：自定义 DeviceTemplateSelector 重写 SelectTemplate 方法，根据设备运行状态自动切换绿色/红色两种列表模板：**
>
> **MainWindow.xaml：**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         xmlns:local="clr-namespace:HmiDemo"
>         Title="DataTemplateSelector - 设备列表" Height="420" Width="460"
>         WindowStartupLocation="CenterScreen" Background="#0D1117">
>     <Grid Margin="15">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>         </Grid.RowDefinitions>
>         <TextBlock Text="设备列表（按运行状态自动选择模板）"
>                    Foreground="#58A6FF" FontSize="14" FontWeight="Bold"/>
>         <Grid.Resources>
>             <!-- 停止状态模板：红色圆点 + 设备信息 -->
>             <DataTemplate x:Key="StoppedTemplate">
>                 <StackPanel Orientation="Horizontal" Margin="4">
>                     <Ellipse Width="10" Height="10" Fill="#DA3633"
>                              VerticalAlignment="Center" Margin="0,0,8,0"/>
>                     <StackPanel>
>                         <TextBlock Text="{Binding Name}" Foreground="White" FontWeight="Bold"/>
>                         <TextBlock Text="{Binding State}" Foreground="#8B949E" FontSize="12"/>
>                     </StackPanel>
>                 </StackPanel>
>             </DataTemplate>
>             <!-- 运行状态模板：绿色圆点 + 设备信息 -->
>             <DataTemplate x:Key="RunningTemplate">
>                 <StackPanel Orientation="Horizontal" Margin="4">
>                     <Ellipse Width="10" Height="10" Fill="#238636"
>                              VerticalAlignment="Center" Margin="0,0,8,0"/>
>                     <StackPanel>
>                         <TextBlock Text="{Binding Name}" Foreground="#58A6FF" FontWeight="Bold"/>
>                         <TextBlock Text="{Binding State}" Foreground="#8B949E" FontSize="12"/>
>                     </StackPanel>
>                 </StackPanel>
>             </DataTemplate>
>             <!-- 选择器实例：两个模板分别赋给两个公开属性 -->
>             <local:DeviceTemplateSelector x:Key="DeviceSelector"
>                                           RunningTemplate="{StaticResource RunningTemplate}"
>                                           StoppedTemplate="{StaticResource StoppedTemplate}"/>
>         </Grid.Resources>
>         <ListBox x:Name="DeviceList" Grid.Row="1" Margin="0,12,0,0"
>                  ItemTemplateSelector="{StaticResource DeviceSelector}"
>                  Background="#161B22" BorderBrush="#21262D"/>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs —— 后台代码与选择器：**
> ```csharp
> using System.Collections.Generic;
> using System.Windows;
> using System.Windows.Controls;
>
> namespace HmiDemo
> {
>     // 设备数据模型
>     public class Device
>     {
>         public string Name { get; set; }
>         public string State { get; set; }
>         public bool IsRunning { get; set; }
>     }
>
>     // 选择器：核心是重写 SelectTemplate，按数据内容返回对应模板
>     public class DeviceTemplateSelector : DataTemplateSelector
>     {
>         public DataTemplate RunningTemplate { get; set; }
>         public DataTemplate StoppedTemplate { get; set; }
>
>         public override DataTemplate SelectTemplate(object item, DependencyObject container)
>         {
>             // 判断逻辑：运行中的设备用绿色模板，否则用红色模板
>             if (item is Device d && d.IsRunning) return RunningTemplate;
>             return StoppedTemplate;
>         }
>     }
>
>     public partial class MainWindow : Window
>     {
>         public MainWindow()
>         {
>             InitializeComponent();
>             DeviceList.ItemsSource = new List<Device>
>             {
>                 new Device { Name = "1# 注塑机", State = "运行中", IsRunning = true },
>                 new Device { Name = "2# 注塑机", State = "已停止", IsRunning = false },
>                 new Device { Name = "3# 注塑机", State = "运行中", IsRunning = true },
>                 new Device { Name = "4# 注塑机", State = "已停止", IsRunning = false },
>             };
>         }
>     }
> }
> ```
> 

> [!scene] 适用场景
> ✅ 同一列表中混合多种"形态"的数据：设备运行/停机/报警三种模板、任务已下发/执行中/完成三种进度样式
> ✅ 数据模型的类型或状态在运行时变化，需要切换整块呈现结构（不同控件组合、不同布局）的场景
> ✅ 网格报表中某列按值使用不同模板（`GridViewColumn.CellTemplateSelector`）
> ✅ 需要为同一数据提供"精简模式/详细模式"两种视图，切换时重选模板
> ❌ 只是改变颜色、字体、可见性等"属性级差异"（用 `DataTrigger` 更轻，无需选择器）
> ❌ 模板固定不变的简单列表（`ItemTemplate` 就够了，引入选择器反而增加复杂度）

> [!pitfall] 常见踩坑
> 坑 1：**`SelectTemplate` 返回 `null` 时列表全空白** → 现象：列表能显示数量但不显示内容 → 原因：选择器实例的模板属性没赋值，或 Key 引用错了资源 → 解决：XAML 里给选择器属性赋 `StaticResource` 模板；返回前断点确认 `RunningTemplate`/`StoppedTemplate` 非空
> 
> 坑 2：**模板属性忘记定义 setter** → 现象：XAML 赋值报错"无法设置只读属性" → 原因：选择器里 `public DataTemplate XxxTemplate { get; set; }` 缺 setter → 解决：补齐 `{ get; set; }`
>
> 坑 3：**数据变化后模板不切换** → 现象：设备从运行变停机，列表项模板没变 → 原因：`SelectTemplate` 在容器生成时调用一次，`IsRunning` 变化不会自动重新选择；`DataTemplateSelector` 只按"创建时"的数据决定 → 解决：数据状态变化用 `DataTrigger` 处理属性级变化；结构性切换（类型变化）才适合选择器

> [!best] 最佳实践
> - 选择器只做"分派"，模板资源统一放在 `Resources` 中，用 `x:Key` 管理，保持选择器代码极简
> - 判断条件用强类型模式匹配（`item is Device d`）而非字符串比较，编译器帮你兜底
> - 模板之间若有公共部分，抽成嵌套模板或复用样式，避免三套模板三份重复 XAML
> - 状态类差异（颜色、文字）优先 `DataTrigger`；结构类差异（布局完全不同）才用选择器
> - 为选择器提供"兜底模板"：`SelectTemplate` 最后 `return FallbackTemplate ?? base.SelectTemplate(...)`，防止新状态漏配模板

> [!practice] 上手练习
> **Lv.1 照猫画虎**：运行示例，观察运行/停止设备使用不同模板；把 `IsRunning` 值改两个再运行，看模板跟着切换
> **Lv.2 小试牛刀**：新增"报警"状态（`IsAlarm` 属性），添加一个橙色报警模板，在 `SelectTemplate` 里优先返回报警模板
> **Lv.3 融会贯通**：用 `DataTrigger` 在运行模板里让状态文字随"是否选中"变亮，验证"属性级变化用触发器、结构级变化用选择器"的分工
> **Lv.4 拆层挑战**：把设备集合改为 `ObservableCollection<Device>`，运行时添加/删除设备观察列表自动刷新；再为列表实现"按状态分组"的 `CollectionViewSource`，配合选择器展示分组头

> [!related] 相关知识链接
> - ← 前置知识：「第 5 章·数据模板」「数据模板-datatemplate」、「第 5 章·数据绑定」「什么是数据绑定」（模板内 `{Binding}` 的上下文）、`itemcontainerstyle-列表项样式`（容器样式与模板的分工）
> - → 后续必学：`hierarchicaldatatemplate-层级数据`（多级模板的嵌套选择）、`datatemplate-中的事件绑定`（模板内交互事件）
> - ⇄ 关联概念：「第 5 章·控件模板」「控件模板-controltemplate」（模板的数据侧与视觉侧分工）、「第 5 章·样式触发器」「什么是样式」（`DataTrigger` 与选择器的选用边界）
> - 📖 官方文档：[DataTemplateSelector 类](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.datatemplateselector)、[数据模板化概述](https://learn.microsoft.com/zh-cn/dotnet/desktop/wpf/data/data-templating-overview)、[ItemsControl.ItemTemplateSelector](https://learn.microsoft.com/zh-cn/dotnet/api/system.windows.controls.itemscontrol.itemtemplateselector)
