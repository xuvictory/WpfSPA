---
title: ItemContainerStyle 条目容器样式
section: 05-core-concepts
parent: 5.8 模板
---

# ItemContainerStyle 条目容器样式

> [!plain] 白话理解
> ItemsControl（包括 ListBox、ComboBox、DataGrid 等）在展示数据时，会为每条数据自动生成一个"容器"——ListBox 的容器是 `ListBoxItem`，TreeView 的是 `TreeViewItem`。`ItemTemplate` 管的是"容器里面显示什么"，而 `ItemContainerStyle` 管的是"容器本身长什么样"。容器负责选中效果、鼠标悬停背景、行高等外观设定。很多新手困惑"为什么设了 Background 不生效"——因为你设的是 ListBox 的 Background，但遮盖它的是 ListBoxItem 的 Background，需要用 ItemContainerStyle 来设。

> [!def] 官方定义
> `ItemContainerStyle` 是 ItemsControl 的属性，用于设置由 ItemsControl 自动生成的条目容器元素的 Style。该 Style 的 TargetType 必须与容器类型一致（如 ListBox 对应 `ListBoxItem`，TreeView 对应 `TreeViewItem`，DataGrid 对应 `DataGridRow`）。通过 ItemContainerStyle 可以控制容器的选中色、悬停色、行高、边框、布局等外观属性。它不替代 ItemTemplate——前者管容器，后者管内容。

> [!origin] 由来背景
> WPF 的 ItemsControl 在底层做了这样的工作：遍历 ItemsSource → 为每条数据创建一个容器对象（ListBoxItem/ComboBoxItem...）→ 把 DataTemplate 渲染的内容塞进容器 → 容器自己还有一套默认的外观（选中=蓝色、悬停=浅蓝）。如果不加控制，默认的"蓝色选中效果"会破坏深色 UI 的配色。ItemContainerStyle 就是专门用来定制这个"容器默认外观"的。

> [!essentials] 核心要点
> - **TargetType 是容器类型**：ListBox → ListBoxItem，DataGrid → DataGridRow，ComboBox → ComboBoxItem
> - **管容器，不管内容**：Background、BorderBrush、Height 等容器属性
> - **Selected/Highlight 效果在此定制**：用 Trigger（IsSelected、IsMouseOver）设选中色
> - **交替行颜色**：用 `AlternationCount` + `AlternationIndex` DataTrigger
> - **不可替代 ItemTemplate**：ItemTemplate 仍然控制内容布局
> - **可以继承和覆盖**：用 BasedOn 创建基础容器样式，各列表覆盖差异

> [!example] 完整示例
>
> 演示上位机设备列表中的 ItemContainerStyle——自定义选中色、交替行颜色。

> **MainWindow.xaml**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="ItemContainerStyle 演示" Height="550" Width="700"
>         WindowStartupLocation="CenterScreen">
>     <Window.Resources>
>         <SolidColorBrush x:Key="PageBg" Color="#0D1117"/>
>         <SolidColorBrush x:Key="CardBg" Color="#161B22"/>
>         
>         <!-- ===== DataTemplate：列表条目内容 ===== -->
>         <DataTemplate x:Key="DeviceRowTemplate">
>             <Grid Height="40">
>                 <Grid.ColumnDefinitions>
>                     <ColumnDefinition Width="Auto"/>
>                     <ColumnDefinition Width="Auto"/>
>                     <ColumnDefinition Width="*"/>
>                     <ColumnDefinition Width="Auto"/>
>                     <ColumnDefinition Width="Auto"/>
>                 </Grid.ColumnDefinitions>
>                 
>                 <!-- 序号 -->
>                 <TextBlock Grid.Column="0" Width="30"
>                            Text="{Binding Index}"
>                            Foreground="#999" FontSize="11"
>                            VerticalAlignment="Center"/>
>                 
>                 <!-- 状态灯 -->
>                 <Ellipse Grid.Column="1" Width="8" Height="8"
>                          Fill="{Binding StatusColor}"
>                          VerticalAlignment="Center" Margin="5,0,0,0"/>
>                 
>                 <!-- 设备名 -->
>                 <TextBlock Grid.Column="2"
>                            Text="{Binding Name}"
>                            Foreground="White"
>                            FontWeight="Bold" FontSize="13"
>                            VerticalAlignment="Center"
>                            Margin="10,0,0,0"/>
>                 
>                 <!-- 数值 -->
>                 <TextBlock Grid.Column="3"
>                            Text="{Binding ValueDisplay}"
>                            Foreground="#3FB950"
>                            FontFamily="Consolas" FontSize="14"
>                            FontWeight="Bold"
>                            VerticalAlignment="Center"/>
>                 
>                 <!-- 状态 -->
>                 <TextBlock Grid.Column="4" Width="50"
>                            Text="{Binding StatusText}"
>                            Foreground="{Binding StatusColor}"
>                            FontSize="11"
>                            VerticalAlignment="Center"
>                            HorizontalAlignment="Center"/>
>             </Grid>
>         </DataTemplate>
>         
>         <!-- ===== ItemContainerStyle：定制容器外观 ===== -->
>         <Style x:Key="DeviceRowContainerStyle" TargetType="ListBoxItem">
>             <!-- 默认背景透明（覆盖系统默认） -->
>             <Setter Property="Background" Value="Transparent"/>
>             <Setter Property="BorderThickness" Value="0"/>
>             <Setter Property="Padding" Value="8,0,8,0"/>
>             <Setter Property="HorizontalContentAlignment" Value="Stretch"/>
>             <Setter Property="Template">
>                 <Setter.Value>
>                     <ControlTemplate TargetType="ListBoxItem">
>                         <Border x:Name="ItemBorder"
>                                 Background="{TemplateBinding Background}"
>                                 BorderBrush="{TemplateBinding BorderBrush}"
>                                 BorderThickness="{TemplateBinding BorderThickness}"
>                                 Padding="{TemplateBinding Padding}"
>                                 CornerRadius="4">
>                             <ContentPresenter/>
>                         </Border>
>                     </ControlTemplate>
>                 </Setter.Value>
>             </Setter>
>             
>             <Style.Triggers>
>                 <!-- 鼠标悬停：卡片高亮 -->
>                 <Trigger Property="IsMouseOver" Value="True">
>                     <Setter Property="Background" Value="#1a2a3a"/>
>                     <Setter Property="BorderBrush" Value="#FF6B35"/>
>                     <Setter Property="BorderThickness" Value="1"/>
>                 </Trigger>
>                 
>                 <!-- 选中：橙色高亮 + 左边框 -->
>                 <Trigger Property="IsSelected" Value="True">
>                     <Setter Property="Background" Value="#2a1a0a"/>
>                     <Setter Property="BorderBrush" Value="#FF6B35"/>
>                     <Setter Property="BorderThickness" Value="0,0,0,0"/>
>                 </Trigger>
>             </Style.Triggers>
>         </Style>
>         
>         <!-- ===== DataGrid 行容器样式（交替行颜色） ===== -->
>         <Style x:Key="DataGridRowStyle" TargetType="DataGridRow">
>             <Setter Property="Background" Value="#161B22"/>
>             <Setter Property="Foreground" Value="#E6EDF3"/>
>             <Setter Property="BorderBrush" Value="#2A4A6C"/>
>             <Setter Property="BorderThickness" Value="0,0,0,1"/>
>             <Setter Property="Height" Value="36"/>
>             <Style.Triggers>
>                 <!-- 交替行颜色：偶数行稍亮 -->
>                 <Trigger Property="AlternationIndex" Value="1">
>                     <Setter Property="Background" Value="#1C2333"/>
>                 </Trigger>
>                 <!-- 选中行 -->
>                 <Trigger Property="IsSelected" Value="True">
>                     <Setter Property="Background" Value="#2a3a1a"/>
>                 </Trigger>
>                 <!-- 悬停 -->
>                 <Trigger Property="IsMouseOver" Value="True">
>                     <Setter Property="Background" Value="#1a2a3a"/>
>                 </Trigger>
>             </Style.Triggers>
>         </Style>
>     </Window.Resources>
>     
>     <Grid Background="{StaticResource PageBg}">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>         </Grid.RowDefinitions>
>         
>         <Border Grid.Row="0" Background="{StaticResource CardBg}"
>                 Padding="12,8" BorderBrush="#2A4A6C"
>                 BorderThickness="0,0,0,1">
>             <TextBlock Text="📋 设备列表（ListBox + ItemContainerStyle）"
>                        Foreground="#FF6B35" FontSize="14"
>                        FontWeight="Bold"/>
>         </Border>
>         
>         <!-- ListBox 演示 -->
>         <ListBox Grid.Row="1" Margin="15"
>                  ItemsSource="{Binding Devices}"
>                  ItemTemplate="{StaticResource DeviceRowTemplate}"
>                  ItemContainerStyle="{StaticResource DeviceRowContainerStyle}"
>                  Background="Transparent"
>                  BorderThickness="0"/>
>         
>         <Border Grid.Row="2" Background="{StaticResource CardBg}"
>                 Padding="12,8" BorderBrush="#2A4A6C"
>                 BorderThickness="0,0,0,1">
>             <TextBlock Text="📊 参数表（DataGrid + 交替行色）"
>                        Foreground="#FF6B35" FontSize="14"
>                        FontWeight="Bold"/>
>         </Border>
>         
>         <!-- DataGrid 演示：交替行颜色 -->
>         <DataGrid Grid.Row="3" Margin="15"
>                   ItemsSource="{Binding Devices}"
>                   RowStyle="{StaticResource DataGridRowStyle}"
>                   AlternationCount="2"
>                   AutoGenerateColumns="False"
>                   HeadersVisibility="Column"
>                   Background="{StaticResource CardBg}"
>                   RowBackground="Transparent"
>                   BorderBrush="#2A4A6C"
>                   GridLinesVisibility="None">
>             <DataGrid.Columns>
>                 <DataGridTextColumn Header="序号" Width="50"
>                                     Binding="{Binding Index}"/>
>                 <DataGridTextColumn Header="设备名称" Width="140"
>                                     Binding="{Binding Name}"/>
>                 <DataGridTextColumn Header="当前值" Width="100"
>                                     Binding="{Binding ValueDisplay}"/>
>                 <DataGridTextColumn Header="状态" Width="80"
>                                     Binding="{Binding StatusText}"/>
>             </DataGrid.Columns>
>             <!-- DataGrid 列头样式 -->
>             <DataGrid.ColumnHeaderStyle>
>                 <Style TargetType="DataGridColumnHeader">
>                     <Setter Property="Background" Value="#1a2a3a"/>
>                     <Setter Property="Foreground" Value="#FF6B35"/>
>                     <Setter Property="FontWeight" Value="Bold"/>
>                     <Setter Property="BorderBrush"
>                             Value="#2A4A6C"/>
>                     <Setter Property="BorderThickness"
>                             Value="0,0,0,1"/>
>                     <Setter Property="Padding" Value="8,4"/>
>                 </Style>
>             </DataGrid.ColumnHeaderStyle>
>         </DataGrid>
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
> 
>         var devices = new ObservableCollection<DeviceItem>();
>         devices.Add(new() { Index=1, Name="电机 M-101",
>             ValueDisplay="1480 rpm", StatusColor="#3FB950",
>             StatusText="正常" });
>         devices.Add(new() { Index=2, Name="变频器 VFD-01",
>             ValueDisplay="48.5 A", StatusColor="#CC2222",
>             StatusText="报警" });
>         devices.Add(new() { Index=3, Name="水泵 P-203",
>             ValueDisplay="320 m³/h", StatusColor="#3FB950",
>             StatusText="正常" });
>         devices.Add(new() { Index=4, Name="传感器 S-12",
>             ValueDisplay="23.5°C", StatusColor="#FFA726",
>             StatusText="警告" });
>         devices.Add(new() { Index=5, Name="PLC-CPU1",
>             ValueDisplay="12% CPU", StatusColor="#999",
>             StatusText="待机" });
>         devices.Add(new() { Index=6, Name="阀门 V-303",
>             ValueDisplay="75%", StatusColor="#3FB950",
>             StatusText="正常" });
> 
>         DataContext = new { Devices = devices };
>     }
> }
> 
> public class DeviceItem
> {
>     public int Index { get; set; }
>     public string Name { get; set; } = "";
>     public string ValueDisplay { get; set; } = "";
>     public string StatusColor { get; set; } = "#999";
>     public string StatusText { get; set; } = "";
> }
> ```
>
> ItemContainerStyle 控制的内容：
> | 效果 | 实现方式 |
> |------|---------|
> | 选中高亮 | `Trigger Property="IsSelected" Value="True"` |
> | 悬停效果 | `Trigger Property="IsMouseOver" Value="True"` |
> | 交替行颜色 | `Trigger Property="AlternationIndex" Value="1"` |
> | 自定义容器模板 | `ControlTemplate TargetType="ListBoxItem"` |

> [!scene] 适用场景
> - ✅ 设备列表——选中行橙色高亮替代系统蓝色
> - ✅ 数据表——交替行颜色提升可读性
> - ✅ 报警列表——选中的报警行用红色背景
> - ✅ TreeView 节点——自定义树节点的展开/折叠按钮和选中态
> - ✅ ComboBox 弹出项——自定义下拉项的悬停/选中色
> - ❌ 纯数据容器的内容——ItemTemplate 负责

> [!pitfall] 常见踩坑
> - **坑1：System Blue 选中色去不掉**。即使设了 `ItemContainerStyle` 的 `Background`，系统默认的选中蓝色仍然可能生效——因为系统默认隐式样式优先级可能覆盖。解决方案：直接替换 ControlTemplate（如示例中的 ListBoxItem ControlTemplate），彻底摆脱系统默认视觉。
> - **坑2：AlternationCount 设了但交替色不生效**。需要在 `ItemsControl` 上设 `AlternationCount="2"`（或其他值），否则 `AlternationIndex` 永远为 0。解决方案：确认 AlternationCount 已设置，且 DataGrid/ListBox 的 RowBackground 需要为 Transparent。
> - **坑3：ItemContainerStyle 和 ItemTemplate 的 Background 冲突**。容器和内容都有 Background 时，内容的 Background 优先显示（因为它在前）。解决方案：在 ItemContainerStyle 设颜色，ItemTemplate 内元素背景保持透明。

> [!best] 最佳实践
> - 上位机的 ListBox 一律覆盖默认选中蓝色——深色主题中用橙色/暗色替代
> - 数据表用 AlternationCount="2" 做斑马纹，配合浅色交替行（#161B22 / #1C2333）
> - ItemContainerStyle 中替换 ControlTemplate 时，一定要保留 `<ContentPresenter/>`——否则内容不显示
> - 选中态和悬停态的颜色对比度要足够（通常在 2:1 以上），方便触摸屏设备操作

> [!practice] 上手练习
> - **Lv.1 照猫画虎**：为一个设备 ListBox 定制 ItemContainerStyle——选中行橙色背景 + 左边框，悬停行深蓝背景
> - **Lv.2 小试牛刀**：创建一个"报警列表"——DataGrid 通过 ItemContainerStyle（RowStyle）实现：正常行=暗色背景、报警行=红色背景、已确认报警=黄色背景（用 DataTrigger 根据数据类型切换）
> - **Lv.3 融会贯通**：为 TreeView 定制全套 ItemContainerStyle——覆盖展开/折叠箭头（用自定义图标）、选中高亮、子节点缩进线、同级节点交替背景色

> [!related] 相关知识链接
> - ← 前置：HierarchicalDataTemplate 层级模板 — 与 ItemContainerStyle 配合控制 TreeView
> - → 后续：模板绑定语法 — 模板内部的绑定方式
> - ⇄ 关联：数据模板 DataTemplate — ItemTemplate 控制内容，ItemContainerStyle 控制容器
> - ⇄ 关联：ItemsControl — ItemContainerStyle 的宿主
> - 📖 官方文档：[ItemsControl.ItemContainerStyle Property](https://docs.microsoft.com/en-us/dotnet/api/system.windows.controls.itemscontrol.itemcontainerstyle)
