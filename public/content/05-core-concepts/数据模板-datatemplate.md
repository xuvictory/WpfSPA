---
title: 数据模板 DataTemplate
section: 05-core-concepts
parent: 5.8 模板
---

# 数据模板 DataTemplate

> [!plain] 白话理解
> 如果说 ControlTemplate 管的是"控件长什么样"，那 **DataTemplate（数据模板）** 管的就是"数据显示成什么样"。比如你有一个 `DeviceInfo` 对象（包含设备名、转速、温度），你把它放进 `ItemsControl` 或 `ListBox` 里，WPF 默认会给它显示 `ToString()`——也就是类名。DataTemplate 就是告诉 WPF："遇到 `DeviceInfo` 类型的数据，就按我设计的这个视觉卡片来渲染"。DataTemplate 不关心数据从哪来，只关心怎么展示。它是 MVVM 中的"数据可视化引擎"。

> [!def] 官方定义
> `DataTemplate` 定义了数据对象（Data Object）的可视化表现方式。它描述数据如何被渲染——使用 Binding 将数据属性映射到 UI 元素的属性。DataTemplate 可以通过 `DataType` 属性指定适用的数据类型（没有 DataType 时需通过 `x:Key` 显式引用）。它被 ItemsControl（ListBox、ComboBox、DataGrid 等）的 `ItemTemplate` 属性使用，或 ContentControl 的 `ContentTemplate` 属性使用。DataTemplate 内的 Binding 默认以 DataContext 为源。

> [!origin] 由来背景
> 传统 GUI 框架中，展示列表数据通常需要手写循环代码——遍历数据源，逐个创建 UI 元素，逐个赋值属性。WPF 通过 DataTemplate 把这个过程自动化了：你声明数据到 UI 的映射规则，ItemsControl 自动帮你完成"生成 UI → 绑定数据"的循环。这个设计让前端开发从"过程式模板生成"变成了"声明式模板定义"——代码量减少 70%，维护性提高数倍。

> [!essentials] 核心要点
> - **DataType**：指定模板适用的数据类型（如 `{x:Type local:DeviceInfo}`），实现自动匹配
> - **x:Key**：手动引用时的模板名称
> - **内部的 Binding**：默认以 DataContext 为源，表示当前数据项
> - **使用位置**：`ItemTemplate`（每条数据的外观）、`ContentTemplate`（单个数据的外观）
> - **自动应用规则**：设了 DataType 的 DataTemplate 在支持自动模板选择的控件中会自动生效
> - **HierarchicalDataTemplate**：DataTemplate 的扩展，用于 TreeView 等层级数据

> [!example] 完整示例
>
> 演示上位机中 DataTemplate 的多种使用方式——ItemTemplate、ContentTemplate、DataType 自动匹配。

> **MainWindow.xaml**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         xmlns:local="clr-namespace:HmiDemo"
>         Title="DataTemplate 演示" Height="550" Width="750"
>         WindowStartupLocation="CenterScreen">
>     <Window.Resources>
>         <SolidColorBrush x:Key="PageBg" Color="#0D1117"/>
>         <SolidColorBrush x:Key="CardBg" Color="#161B22"/>
>         
>         <!-- ===== DataTemplate 1：设备列表模板 ===== -->
>         <DataTemplate x:Key="DeviceItemTemplate">
>             <Border Background="{StaticResource CardBg}"
>                     CornerRadius="6" Padding="12"
>                     Margin="0,0,0,5"
>                     BorderBrush="{Binding StatusColor}"
>                     BorderThickness="1">
>                 <Grid>
>                     <Grid.ColumnDefinitions>
>                         <ColumnDefinition Width="Auto"/>
>                         <ColumnDefinition Width="*"/>
>                         <ColumnDefinition Width="Auto"/>
>                     </Grid.ColumnDefinitions>
>                     
>                     <!-- 状态灯 -->
>                     <Ellipse Grid.Column="0" Width="10" Height="10"
>                              Fill="{Binding StatusColor}"
>                              VerticalAlignment="Center"/>
>                     
>                     <!-- 信息 -->
>                     <StackPanel Grid.Column="1" Margin="8,0,0,0">
>                         <TextBlock Text="{Binding Name}"
>                                    Foreground="White"
>                                    FontWeight="Bold" FontSize="13"/>
>                         <TextBlock Margin="0,4,0,0" FontSize="11">
>                             <Run Text="{Binding ParamName}"
>                                  Foreground="#999"/>
>                             <Run Text=": " Foreground="#999"/>
>                             <Run Text="{Binding ValueDisplay}"
>                                  Foreground="#3FB950"/>
>                             <Run Text=" " Foreground="#999"/>
>                             <Run Text="{Binding Unit}" Foreground="#999"/>
>                         </TextBlock>
>                     </StackPanel>
>                     
>                     <!-- 状态标签 -->
>                     <Border Grid.Column="2" CornerRadius="4"
>                             Padding="8,2"
>                             Background="{Binding StatusColor}"
>                             Opacity="0.2">
>                         <TextBlock Text="{Binding StatusText}"
>                                    Foreground="{Binding StatusColor}"
>                                    FontSize="10" FontWeight="Bold"/>
>                     </Border>
>                 </Grid>
>             </Border>
>         </DataTemplate>
>         
>         <!-- ===== DataTemplate 2：使用 DataType 自动匹配 ===== -->
>         <DataTemplate DataType="{x:Type local:AlarmInfo}">
>             <Border Background="#2a1515" CornerRadius="6"
>                     Padding="12" Margin="0,0,0,5"
>                     BorderBrush="#CC2222" BorderThickness="1">
>                 <StackPanel Orientation="Horizontal">
>                     <TextBlock Text="⚠" Foreground="#CC2222"
>                                FontSize="18" VerticalAlignment="Center"/>
>                     <StackPanel Margin="8,0,0,0">
>                         <TextBlock Text="{Binding Message}"
>                                    Foreground="#CC2222"
>                                    FontWeight="Bold" FontSize="13"/>
>                         <TextBlock Text="{Binding Time}"
>                                    Foreground="#999" FontSize="11"/>
>                     </StackPanel>
>                 </StackPanel>
>             </Border>
>         </DataTemplate>
>         
>         <!-- ===== DataTemplate 3：ContentControl 专用 ===== -->
>         <DataTemplate x:Key="SelectedDeviceTemplate">
>             <Border Background="{StaticResource CardBg}"
>                     CornerRadius="8" Padding="20"
>                     BorderBrush="#FF6B35" BorderThickness="2">
>                 <StackPanel>
>                     <TextBlock Text="📍 当前选中设备"
>                                Foreground="#FF6B35"
>                                FontWeight="Bold" FontSize="14"/>
>                     <TextBlock Text="{Binding Name}"
>                                Foreground="White"
>                                FontSize="20" FontWeight="Bold"
>                                Margin="0,8,0,0"/>
>                     <Grid Margin="0,10,0,0">
>                         <Grid.ColumnDefinitions>
>                             <ColumnDefinition Width="*"/>
>                             <ColumnDefinition Width="*"/>
>                         </Grid.ColumnDefinitions>
>                         <StackPanel Grid.Column="0">
>                             <TextBlock Foreground="#999" FontSize="11"
>                                        Text="当前值"/>
>                             <TextBlock Foreground="#3FB950"
>                                        FontSize="24" FontWeight="Bold"
>                                        FontFamily="Consolas"
>                                        Text="{Binding ValueDisplay}"/>
>                         </StackPanel>
>                         <StackPanel Grid.Column="1">
>                             <TextBlock Foreground="#999" FontSize="11"
>                                        Text="单位"/>
>                             <TextBlock Foreground="White" FontSize="18"
>                                        Text="{Binding Unit}"/>
>                         </StackPanel>
>                     </Grid>
>                 </StackPanel>
>             </Border>
>         </DataTemplate>
>     </Window.Resources>
>     
>     <Grid Background="{StaticResource PageBg}">
>         <Grid.ColumnDefinitions>
>             <ColumnDefinition Width="*"/>
>             <ColumnDefinition Width="Auto"/>
>             <ColumnDefinition Width="280"/>
>         </Grid.ColumnDefinitions>
>         
>         <!-- 左：设备列表 -->
>         <Grid Grid.Column="0">
>             <Grid.RowDefinitions>
>                 <RowDefinition Height="Auto"/>
>                 <RowDefinition Height="*"/>
>             </Grid.RowDefinitions>
>             <Border Grid.Row="0" Background="{StaticResource CardBg}"
>                     Padding="12,8" BorderBrush="#2A4A6C"
>                     BorderThickness="0,0,0,1">
>                 <TextBlock Text="📋 设备列表"
>                            Foreground="#FF6B35" FontSize="14"
>                            FontWeight="Bold"/>
>             </Border>
>             <ListBox Grid.Row="1" Margin="10"
>                      ItemsSource="{Binding Devices}"
>                      ItemTemplate="{StaticResource DeviceItemTemplate}"
>                      Background="Transparent"
>                      BorderThickness="0"
>                      x:Name="DeviceListBox"/>
>         </Grid>
>         
>         <!-- 右：选中设备详情（ContentTemplate） -->
>         <Border Grid.Column="2" Background="#0a0e14"
>                 BorderBrush="#2A4A6C" BorderThickness="1,0,0,0"
>                 Padding="15">
>             <StackPanel>
>                 <TextBlock Text="📌 设备详情"
>                            Foreground="#FF6B35" FontSize="14"
>                            FontWeight="Bold" Margin="0,0,0,12"/>
>                 <ContentControl
>                     Content="{Binding SelectedItem, ElementName=DeviceListBox}"
>                     ContentTemplate="{StaticResource SelectedDeviceTemplate}"/>
>                 
>                 <!-- DataType 自动匹配的报警列表 -->
>                 <TextBlock Text="⚠ 最近报警"
>                            Foreground="#CC2222" FontSize="13"
>                            FontWeight="Bold"
>                            Margin="0,20,0,8"/>
>                 <ItemsControl ItemsSource="{Binding RecentAlarms}"/>
>             </StackPanel>
>         </Border>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs**
> ```csharp
> using System.Collections.ObjectModel;
> using System.Windows;
> 
> namespace HmiDemo;
> 
> public partial class MainWindow : Window
> {
>     public MainWindow()
>     {
>         InitializeComponent();
>         DataContext = new DeviceDataViewModel();
>     }
> }
> 
> public class DeviceDataViewModel
> {
>     public ObservableCollection<DeviceItem> Devices { get; } = new()
>     {
>         new() { Name="电机 M-101", ParamName="转速", ValueDisplay="1480",
>                 Unit="rpm", StatusColor="#3FB950", StatusText="正常" },
>         new() { Name="变频器 VFD-01", ParamName="电流", ValueDisplay="48.5",
>                 Unit="A", StatusColor="#CC2222", StatusText="报警" },
>         new() { Name="水泵 P-203", ParamName="流量", ValueDisplay="320",
>                 Unit="m³/h", StatusColor="#3FB950", StatusText="正常" },
>         new() { Name="传感器 S-12", ParamName="温度", ValueDisplay="23.5",
>                 Unit="°C", StatusColor="#FFA726", StatusText="警告" },
>     };
> 
>     public ObservableCollection<AlarmInfo> RecentAlarms { get; } = new()
>     {
>         new() { Message="变频器 VFD-01 过载", Time="08:32:15" },
>         new() { Message="传感器 S-12 温度偏高", Time="08:28:40" },
>     };
> }
> 
> public class DeviceItem
> {
>     public string Name { get; set; } = "";
>     public string ParamName { get; set; } = "";
>     public string ValueDisplay { get; set; } = "";
>     public string Unit { get; set; } = "";
>     public string StatusColor { get; set; } = "#999";
>     public string StatusText { get; set; } = "";
> }
> 
> public class AlarmInfo
> {
>     public string Message { get; set; } = "";
>     public string Time { get; set; } = "";
> }
> ```
>
> 三种 DataTemplate 用法：
> | 用途 | 方式 | 说明 |
> |------|------|------|
> | 设备列表 | `ListBox.ItemTemplate` | 每条数据用 DeviceItemTemplate 渲染 |
> | 报警列表 | `DataType="{x:Type AlarmInfo}"` | 自动匹配类型，不需在控件上指定 |
> | 设备详情 | `ContentControl.ContentTemplate` | 选中设备用大卡片展示 |

> [!scene] 适用场景
> - ✅ Lists/Grids 数据展示——设备列表、报警列表、参数配置表
> - ✅ 数据驱动的卡片——设备状态卡、传感器数据卡
> - ✅ DataType 自动匹配——不同类型的数据用不同模板，构建异构列表
> - ✅ ContentControl 切换详情——选中不同数据项，右侧自动用对应模板展示详情
> - ✅ ComboBox 下拉项——不仅仅是文字，可以有颜色、图标、状态灯
> - ❌ 固定布局的结构——用普通的 Panel + 控件

> [!pitfall] 常见踩坑
> - **坑1：DataType 自动匹配不生效**。在 `ItemsControl` 中，自动匹配的 DataTemplate 必须放在控件的 `Resources` 或祖先容器中，且 ItemTemplate 不能被显式设置。解决方案：移除 ItemsControl 上的 `ItemTemplate` 属性，让 WPF 自动根据数据类型匹配。
> - **坑2：DataTemplate 内 Binding 路径写错但不报错**。WPF 默认对绑定错误静默处理（不抛异常），导致数据显示空白但不知原因。解决方案：在调试时开启 WPF 绑定追踪——`PresentationTraceSources.TraceLevel="High"`。
> - **坑3：DataTemplate 中使用了 ElementName 绑定**。DataTemplate 内的元素是运行时动态生成的，不在逻辑树中，ElementName 绑定可能找不到目标。解决方案：改用 `{RelativeSource FindAncestor}` 或通过 DataContext 传递。

> [!best] 最佳实践
> - 异构列表用 DataType 自动匹配——同一 ItemsControl 中混合显示设备项、报警项、分隔线项
> - DataTemplate 在 Resources 中定义并设 DataType，在 XAML 中的 ItemsControl 上不写 ItemTemplate——让 WPF 自动选择
> - 复杂 DataTemplate 放在独立资源字典文件中，保持页面 XAML 简洁
> - 上位机的设备卡片的 DataTemplate 通过 DataTrigger 根据设备状态自动切换样式

> [!practice] 上手练习
> - **Lv.1 照猫画虎**：为上位机传感器列表创建一个 DataTemplate，每条显示传感器名称、实时值（大字号等宽字体）、单位、状态灯
> - **Lv.2 小试牛刀**：用 DataType 自动匹配实现一个复合日志列表——普通日志用灰色模板、警告日志用黄色模板、错误日志用红色模板
> - **Lv.3 融会贯通**：设计一个"设备面板编辑器"——左侧 DataGrid 用 DataTemplate 显示设备属性，右侧 Design Canvas 用 DataTemplate 将设备拖拽布局，选中的设备用 ContentTemplate 展示详细参数

> [!related] 相关知识链接
> - ← 前置：控件模板 ControlTemplate — 管控件外观的模板
> - → 后续：HierarchicalDataTemplate 层级模板 — TreeView 的多级数据显示
> - ⇄ 关联：ItemContainerStyle — ItemsControl 容器的样式
> - ⇄ 关联：DataContext — DataTemplate 内 Binding 的数据源
> - 📖 官方文档：[Data Templating Overview](https://docs.microsoft.com/en-us/dotnet/desktop/wpf/data/data-templating-overview)
