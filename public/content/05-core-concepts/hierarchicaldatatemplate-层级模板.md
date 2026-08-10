---
title: HierarchicalDataTemplate 层级模板
section: 05-core-concepts
parent: 5.8 模板
---

# HierarchicalDataTemplate 层级模板

> [!plain] 白话理解
> DataTemplate 只能渲染"扁平"的数据——一行一条记录。但如果你的数据有父子关系呢？比如：车间下面有产线，产线下面有设备，设备下面有传感器。这种树形/层级数据就需要 **HierarchicalDataTemplate（层级模板）**——它可以为每一层数据指定不同的展示模板。它和 DataTemplate 的核心区别是多了个 `ItemsSource` 属性——指向子集合的路径。TreeView 是它最常见的宿主控件。

> [!def] 官方定义
> `HierarchicalDataTemplate` 继承自 `DataTemplate`，专为层级数据设计。它额外提供三个关键属性：① `ItemsSource`：指定当前节点的子项数据源路径（Binding）；② `ItemTemplate`：子项使用的 DataTemplate（可继续嵌套 HierarchicalDataTemplate 实现多层）；③ `ItemContainerStyle`：子项容器的样式。主要用于 `TreeView`、`Menu` 等层级控件。每一层的 HierarchicalDataTemplate 可以完全不同——比如顶层车间用大图标，底层传感器用迷你显示。

> [!origin] 由来背景
> 工业上位机中树形结构非常常见：工厂→车间→产线→设备→参数。在 WinForms 中，填充 TreeView 需要手动遍历数据、创建 TreeNode、设置 Tag 属性……代码又长又容易出错。WPF 的 HierarchicalDataTemplate 把这个过程变成了纯声明式——你只需用 Binding 描述"数据→UI"和"数据→子数据"的映射，TreeView 自动完成递归创建。

> [!essentials] 核心要点
> - **继承 DataTemplate**：所有 DataTemplate 的特性它都有
> - **ItemsSource**：关键属性，指向子集合（如 `ItemsSource="{Binding Devices}"`）
> - **ItemTemplate**：子层使用的模板，可继续嵌套 HierarchicalDataTemplate
> - **多层支持**：每层可以有自己的 HierarchicalDataTemplate，通过 DataType 自动匹配
> - **ItemContainerStyle**：子项容器（如 TreeViewItem）的样式
> - **与 TreeView 标准配合**：`TreeView.ItemTemplate` 设根层模板

> [!example] 完整示例
>
> 演示上位机中工厂→车间→设备的层级树。

> **MainWindow.xaml**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         xmlns:local="clr-namespace:HmiDemo"
>         Title="层级模板演示" Height="550" Width="800"
>         WindowStartupLocation="CenterScreen">
>     <Window.Resources>
>         <SolidColorBrush x:Key="PageBg" Color="#0D1117"/>
>         <SolidColorBrush x:Key="CardBg" Color="#161B22"/>
>         
>         <!-- ===== 第3层：传感器模板（DataTemplate） ===== -->
>         <DataTemplate DataType="{x:Type local:SensorItem}">
>             <Border Background="#0d1520" CornerRadius="4"
>                     Padding="6,3" Margin="2,1">
>                 <StackPanel Orientation="Horizontal">
>                     <Ellipse Width="7" Height="7"
>                              Fill="{Binding StatusColor}"
>                              VerticalAlignment="Center"/>
>                     <TextBlock Text="{Binding Name}"
>                                Foreground="#999" FontSize="11"
>                                Margin="5,0,0,0"/>
>                     <TextBlock Foreground="#3FB950" FontSize="11"
>                                FontFamily="Consolas" Margin="10,0,0,0">
>                         <Run Text="{Binding Value, StringFormat={}{0:F1}}"/>
>                         <Run Text=" "/>
>                         <Run Text="{Binding Unit}"/>
>                     </TextBlock>
>                 </StackPanel>
>             </Border>
>         </DataTemplate>
>         
>         <!-- ===== 第2层：设备模板（HierarchicalDataTemplate） ===== -->
>         <HierarchicalDataTemplate DataType="{x:Type local:DeviceNode}"
>                                   ItemsSource="{Binding Sensors}">
>             <Border Background="{StaticResource CardBg}"
>                     CornerRadius="4" Padding="8,5" Margin="0,1">
>                 <StackPanel Orientation="Horizontal">
>                     <Ellipse Width="9" Height="9"
>                              Fill="{Binding StatusColor}"
>                              VerticalAlignment="Center"/>
>                     <TextBlock Text="{Binding Name}"
>                                Foreground="White"
>                                FontWeight="Bold" FontSize="13"
>                                Margin="6,0,0,0"/>
>                     <TextBlock Foreground="#999" FontSize="10"
>                                Margin="10,0,0,0"
>                                VerticalAlignment="Center">
>                         <Run Text="{Binding SensorCount}"/>
>                         <Run Text=" 个传感器"/>
>                     </TextBlock>
>                 </StackPanel>
>             </Border>
>         </HierarchicalDataTemplate>
>         
>         <!-- ===== 第1层：车间模板（HierarchicalDataTemplate） ===== -->
>         <HierarchicalDataTemplate DataType="{x:Type local:WorkshopNode}"
>                                   ItemsSource="{Binding Devices}">
>             <Border Background="#1a2a3a" CornerRadius="6"
>                     Padding="10,6" Margin="0,2">
>                 <StackPanel Orientation="Horizontal">
>                     <TextBlock Text="🏭" FontSize="16"
>                                VerticalAlignment="Center"/>
>                     <StackPanel Margin="8,0,0,0">
>                         <TextBlock Text="{Binding Name}"
>                                    Foreground="#FF6B35"
>                                    FontWeight="Bold" FontSize="14"/>
>                         <TextBlock Foreground="#999" FontSize="10">
>                             <Run Text="{Binding DeviceCount}"/>
>                             <Run Text=" 台设备 | "/>
>                             <Run Text="{Binding RunningCount}"/>
>                             <Run Text=" 台运行中"/>
>                         </TextBlock>
>                     </StackPanel>
>                 </StackPanel>
>             </Border>
>         </HierarchicalDataTemplate>
>         
>         <!-- ===== 根模板（工厂根节点） ===== -->
>         <HierarchicalDataTemplate DataType="{x:Type local:PlantNode}"
>                                   ItemsSource="{Binding Workshops}">
>             <Border Background="#2a1a0a" CornerRadius="8"
>                     Padding="12,8" BorderBrush="#FF6B35"
>                     BorderThickness="1">
>                 <StackPanel Orientation="Horizontal">
>                     <TextBlock Text="⚙️" FontSize="20"
>                                VerticalAlignment="Center"/>
>                     <StackPanel Margin="8,0,0,0">
>                         <TextBlock Text="{Binding Name}"
>                                    Foreground="#FF6B35"
>                                    FontWeight="Bold" FontSize="16"/>
>                         <TextBlock Foreground="#999" FontSize="11">
>                             <Run Text="{Binding WorkshopCount}"/>
>                             <Run Text=" 个车间 · 共 "/>
>                             <Run Text="{Binding TotalDevices}"/>
>                             <Run Text=" 台设备"/>
>                         </TextBlock>
>                     </StackPanel>
>                 </StackPanel>
>             </Border>
>         </HierarchicalDataTemplate>
>     </Window.Resources>
>     
>     <Grid Background="{StaticResource PageBg}">
>         <Grid.ColumnDefinitions>
>             <ColumnDefinition Width="320"/>
>             <ColumnDefinition Width="*"/>
>         </Grid.ColumnDefinitions>
>         
>         <!-- 左侧：树形导航 -->
>         <Border Grid.Column="0" Margin="8"
>                 Background="{StaticResource CardBg}"
>                 CornerRadius="8" Padding="8">
>             <StackPanel>
>                 <TextBlock Text="🌳 工厂结构"
>                            Foreground="#FF6B35"
>                            FontWeight="Bold" FontSize="14"
>                            Margin="0,0,0,10"/>
>                 <!-- TreeView 自动根据 DataType 匹配模板 -->
>                 <TreeView ItemsSource="{Binding Plants}"
>                           Background="Transparent"
>                           BorderThickness="0">
>                     <TreeView.ItemContainerStyle>
>                         <Style TargetType="TreeViewItem">
>                             <Setter Property="IsExpanded" Value="True"/>
>                             <Setter Property="Foreground" Value="White"/>
>                             <Setter Property="Background" Value="Transparent"/>
>                         </Style>
>                     </TreeView.ItemContainerStyle>
>                 </TreeView>
>             </StackPanel>
>         </Border>
>         
>         <!-- 右侧：选中节点详情 -->
>         <Border Grid.Column="1" Margin="8"
>                 Background="{StaticResource CardBg}"
>                 CornerRadius="8" Padding="15">
>             <StackPanel>
>                 <TextBlock Text="📌 节点详情"
>                            Foreground="#FF6B35"
>                            FontWeight="Bold" FontSize="14"
>                            Margin="0,0,0,10"/>
>                 <ContentControl
>                     Content="{Binding SelectedItem,
>                             ElementName=PlantTreeView}"
>                     x:Name="DetailPresenter">
>                     <ContentControl.Resources>
>                         <DataTemplate DataType="{x:Type local:PlantNode}">
>                             <StackPanel>
>                                 <TextBlock Text="工厂总览"
>                                            Foreground="White" FontSize="18"
>                                            FontWeight="Bold"/>
>                                 <TextBlock Foreground="#999" FontSize="12"
>                                            Margin="0,8,0,0"
>                                            Text="点击展开可查看车间和设备"/>
>                             </StackPanel>
>                         </DataTemplate>
>                         <DataTemplate DataType="{x:Type local:WorkshopNode}">
>                             <StackPanel>
>                                 <TextBlock Text="{Binding Name}"
>                                            Foreground="White" FontSize="18"
>                                            FontWeight="Bold"/>
>                                 <TextBlock Foreground="#3FB950" FontSize="13"
>                                            Text="运行状态：正常"/>
>                             </StackPanel>
>                         </DataTemplate>
>                         <DataTemplate DataType="{x:Type local:DeviceNode}">
>                             <StackPanel>
>                                 <TextBlock Text="{Binding Name}"
>                                            Foreground="White" FontSize="18"
>                                            FontWeight="Bold"/>
>                                 <TextBlock Foreground="#999" FontSize="13"
>                                            Margin="0,4,0,0">
>                                     <Run Text="传感器数量: "/>
>                                     <Run Text="{Binding SensorCount}"/>
>                                 </TextBlock>
>                             </StackPanel>
>                         </DataTemplate>
>                     </ContentControl.Resources>
>                 </ContentControl>
>             </StackPanel>
>         </Border>
>     </Grid>
> </Window>
> ```
>
> **MainWindow.xaml.cs**
> ```csharp
> using System.Collections.ObjectModel;
> using System.Linq;
> using System.Windows;
> 
> namespace HmiDemo;
> 
> public partial class MainWindow : Window
> {
>     public MainWindow()
>     {
>         InitializeComponent();
>         
>         // 构建层级数据
>         var plants = new ObservableCollection<PlantNode>
>         {
>             new PlantNode
>             {
>                 Name = "第一工厂",
>                 Workshops = new ObservableCollection<WorkshopNode>
>                 {
>                     new WorkshopNode
>                     {
>                         Name = "装配车间",
>                         Devices = new ObservableCollection<DeviceNode>
>                         {
>                             new DeviceNode
>                             {
>                                 Name = "电机 M-101", StatusColor = "#3FB950",
>                                 Sensors = new ObservableCollection<SensorItem>
>                                 {
>                                     new() { Name="轴承温度", Value=42.3,
>                                             Unit="°C", StatusColor="#3FB950"},
>                                     new() { Name="转速", Value=1480,
>                                             Unit="rpm", StatusColor="#3FB950"},
>                                 }
>                             },
>                             new DeviceNode
>                             {
>                                 Name = "变频器 VFD-01", StatusColor = "#CC2222",
>                                 Sensors = new ObservableCollection<SensorItem>
>                                 {
>                                     new() { Name="输出电流", Value=48.5,
>                                             Unit="A", StatusColor="#CC2222"},
>                                     new() { Name="频率", Value=50,
>                                             Unit="Hz", StatusColor="#3FB950"},
>                                 }
>                             },
>                         }
>                     },
>                     new WorkshopNode
>                     {
>                         Name = "注塑车间",
>                         Devices = new ObservableCollection<DeviceNode>
>                         {
>                             new DeviceNode
>                             {
>                                 Name = "注塑机 J-201", StatusColor = "#3FB950",
>                                 Sensors = new ObservableCollection<SensorItem>
>                                 {
>                                     new() { Name="模具温度", Value=185,
>                                             Unit="°C", StatusColor="#FFA726"},
>                                 }
>                             },
>                         }
>                     },
>                 }
>             },
>         };
> 
>         DataContext = new { Plants = plants };
>     }
> }
> 
> public class PlantNode
> {
>     public string Name { get; set; } = "";
>     public ObservableCollection<WorkshopNode> Workshops { get; set; } = new();
>     public int WorkshopCount => Workshops.Count;
>     public int TotalDevices => Workshops.Sum(w => w.DeviceCount);
> }
> 
> public class WorkshopNode
> {
>     public string Name { get; set; } = "";
>     public ObservableCollection<DeviceNode> Devices { get; set; } = new();
>     public int DeviceCount => Devices.Count;
>     public int RunningCount => Devices.Count(d => d.StatusColor == "#3FB950");
> }
> 
> public class DeviceNode
> {
>     public string Name { get; set; } = "";
>     public string StatusColor { get; set; } = "#999";
>     public ObservableCollection<SensorItem> Sensors { get; set; } = new();
>     public int SensorCount => Sensors.Count;
> }
> 
> public class SensorItem
> {
>     public string Name { get; set; } = "";
>     public double Value { get; set; }
>     public string Unit { get; set; } = "";
>     public string StatusColor { get; set; } = "#999";
> }
> ```
>
> 层级映射关系：
> ```
> PlantNode         → 工厂模板（橙色边框大卡片）
>   ├─ WorkshopNode → 车间模板（深蓝背景）
>   │   ├─ DeviceNode   → 设备模板（卡片）
>   │   │   ├─ SensorItem → 传感器模板（迷你显示）
>   │   │   └─ SensorItem
>   │   └─ DeviceNode
>   └─ WorkshopNode
>       └─ ...
> ```

> [!scene] 适用场景
> - ✅ 工厂/车间/产线/设备的层级导航树——上位机最常见的树形结构
> - ✅ 菜单系统——主菜单→子菜单→菜单项，每层不同样式
> - ✅ 文件浏览器——驱动器→文件夹→文件
> - ✅ PLC 项目树——PLC→程序块→功能块→变量
> - ✅ 组织结构图——公司→部门→小组→人员
> - ❌ 简单的扁平列表——用 DataTemplate 即可

> [!pitfall] 常见踩坑
> - **坑1：漏了 ItemsSource 导致子节点不显示**。HierarchicalDataTemplate 不设 ItemsSource 就退化成了普通 DataTemplate，子项永远不会显示。解决方案：确保每一层的 HierarchicalDataTemplate 都正确设置了 `ItemsSource="{Binding 子集合属性}"`。
> - **坑2：多层嵌套时 DataType 冲突**。如果两个不同层级的节点类名相同，WPF 会错误地应用第一层模板。解决方案：确保每层数据类型（类名）不同；或为每层显式指定 `ItemTemplate` 而不依赖 DataType 自动匹配。
> - **坑3：TreeViewItem 样式影响子项渲染**。在 TreeView 的 ItemContainerStyle 中设了固定高度 ← 所有层级的节点都受限制。解决方案：让 ItemContainerStyle 保持最小干预；各层通过模板自身控制尺寸。

> [!best] 最佳实践
> - 每层节点用不同的类（PlantNode / WorkshopNode / DeviceNode），利用 DataType 自动匹配
> - 工厂层级的 HierarchicalDataTemplate 展示聚合信息（车间数、设备总数）
> - 使用 TreeView 的 ItemContainerStyle 默认展开第一层（`IsExpanded="True"`）
> - 数据量大时（> 1000 个节点），启用 TreeView 的虚拟化：`VirtualizingStackPanel.IsVirtualizing="True"`

> [!practice] 上手练习
> - **Lv.1 照猫画虎**：创建一个"公司组织架构"TreeView——公司→部门→小组→员工，每层用不同的 HierarchicalDataTemplate 展示不同信息
> - **Lv.2 小试牛刀**：创建一个"PLC 变量浏览器"——PLC→数据块→变量组→变量，叶节点的变量显示当前值、数据类型、地址，用不同图标区分 BOOL/INT/REAL 类型
> - **Lv.3 融会贯通**：实现一个"实时设备拓扑图"——TreeView 和右侧详情面板联动，选中不同层级的节点，右侧自动切换对应的 ControlTemplate 展示详细信息（工厂→统计面板 / 设备→实时数据 / 传感器→趋势图）

> [!related] 相关知识链接
> - ← 前置：数据模板 DataTemplate — HierarchicalDataTemplate 的父类
> - → 后续：ItemContainerStyle — TreeViewItem 容器的样式
> - ⇄ 关联：TreeView 控件 — 层级模板最常用的宿主
> - ⇄ 关联：模板绑定语法 — 绑定在模板内的使用
> - 📖 官方文档：[HierarchicalDataTemplate Class](https://docs.microsoft.com/en-us/dotnet/api/system.windows.hierarchicaldatatemplate)
