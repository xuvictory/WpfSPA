---
title: 多条件触发器 MultiTrigger
section: 05-core-concepts
parent: 5.9 触发器
---

# 多条件触发器 MultiTrigger

> [!plain] 白话理解
> 单个 Trigger 只能判断一个条件。但有时你需要"多个条件同时满足"才触发动作——比如"按钮既要悬停（IsMouseOver=True）又要被按下（IsPressed=True）"时才变暗，或者"设备既要在线（IsOnline=True）又要报警（IsAlarm=True）"时才显示红色闪烁边框。**MultiTrigger** 就是做这个的——它有一个 `Conditions` 集合，里面可以放多个条件（每个 Condition = 一个 Property + 一个 Value），所有条件全部满足时才触发 Setter 中的动作。

> [!def] 官方定义
> `MultiTrigger` 继承自 `TriggerBase`，与 Trigger 类似但支持多个条件。它包含一个 `Conditions` 集合（`ConditionCollection`），每个 Condition 指定一个 `Property`（依赖属性）和一个 `Value`（触发值）。当且仅当集合中**所有 Condition 都满足**时，MultiTrigger 的 `Setters` 才被应用。支持 `EnterActions` 和 `ExitActions` 来播放动画。MultiTrigger 放置在 `Style.Triggers`、`ControlTemplate.Triggers` 等集合中。

> [!origin] 由来背景
> WPF 设计者发现单个 Trigger 无法优雅地表达"且"（AND）逻辑——比如"鼠标悬停且控件获得焦点"、"设备在线且温度超限"。如果不用 MultiTrigger，开发者被迫用代码（事件处理器或转换器）来处理多条件逻辑，背离了 WPF "XAML 声明式"的设计理念。MultiTrigger 填补了这个空白，让多条件的"且"逻辑也能在 XAML 中纯声明式地表达。

> [!essentials] 核心要点
> - **Conditions 集合**：包含多个 Condition（Property + Value），全部满足才触发
> - **"且"逻辑**：所有条件是 AND 关系，不是 OR
> - **Setters**：触发后应用的属性值，和 Trigger 一样
> - **不支持"或"逻辑**：OR 逻辑需要多个独立的 Trigger，或用 DataTrigger + 多值转换器
> - **EnterActions / ExitActions**：同样支持动画
> - **与 Trigger 的共同限制**：只能监控依赖属性

> [!example] 完整示例
>
> 演示上位机中 MultiTrigger 的典型用法——设备状态多条件判断。

> **MainWindow.xaml**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="MultiTrigger 演示" Height="500" Width="700"
>         WindowStartupLocation="CenterScreen">
>     <Window.Resources>
>         <SolidColorBrush x:Key="PageBg" Color="#0D1117"/>
>         <SolidColorBrush x:Key="CardBg" Color="#161B22"/>
>         
>         <!-- ===== MultiTrigger 1：设备卡片——悬停+选中时特殊高亮 ===== -->
>         <Style x:Key="DeviceCardItemStyle" TargetType="ListBoxItem">
>             <Setter Property="Background" Value="Transparent"/>
>             <Setter Property="Padding" Value="4"/>
>             <Setter Property="Template">
>                 <Setter.Value>
>                     <ControlTemplate TargetType="ListBoxItem">
>                         <Border x:Name="ItemBorder"
>                                 Background="{TemplateBinding Background}"
>                                 Padding="{TemplateBinding Padding}"
>                                 CornerRadius="6"
>                                 BorderThickness="1"
>                                 BorderBrush="Transparent">
>                             <ContentPresenter/>
>                         </Border>
>                         <ControlTemplate.Triggers>
>                             <Trigger Property="IsMouseOver" Value="True">
>                                 <Setter TargetName="ItemBorder"
>                                         Property="Background" Value="#1a2a3a"/>
>                             </Trigger>
>                             <Trigger Property="IsSelected" Value="True">
>                                 <Setter TargetName="ItemBorder"
>                                         Property="BorderBrush" Value="#FF6B35"/>
>                                 <Setter TargetName="ItemBorder"
>                                         Property="Background" Value="#2a1a0a"/>
>                             </Trigger>
>                             <!-- MultiTrigger：既悬停又选中 → 更亮的高亮色 -->
>                             <MultiTrigger>
>                                 <MultiTrigger.Conditions>
>                                     <Condition Property="IsMouseOver"
>                                                Value="True"/>
>                                     <Condition Property="IsSelected"
>                                                Value="True"/>
>                                 </MultiTrigger.Conditions>
>                                 <Setter TargetName="ItemBorder"
>                                         Property="Background" Value="#3a2a10"/>
>                                 <Setter TargetName="ItemBorder"
>                                         Property="BorderBrush" Value="#FF8C55"/>
>                             </MultiTrigger>
>                         </ControlTemplate.Triggers>
>                     </ControlTemplate>
>                 </Setter.Value>
>             </Setter>
>         </Style>
>         
>         <!-- ===== ItemTemplate ===== -->
>         <DataTemplate x:Key="DeviceRowTemplate">
>             <Grid Height="44">
>                 <Grid.ColumnDefinitions>
>                     <ColumnDefinition Width="Auto"/>
>                     <ColumnDefinition Width="*"/>
>                     <ColumnDefinition Width="Auto"/>
>                 </Grid.ColumnDefinitions>
>                 <Ellipse Grid.Column="0" Width="10" Height="10"
>                          Fill="{Binding StatusColor}"
>                          VerticalAlignment="Center"/>
>                 <StackPanel Grid.Column="1" Margin="10,0,0,0"
>                             VerticalAlignment="Center">
>                     <TextBlock Text="{Binding Name}"
>                                Foreground="White"
>                                FontWeight="Bold" FontSize="13"/>
>                     <TextBlock Text="{Binding ValueDisplay}"
>                                Foreground="#999" FontSize="11"/>
>                 </StackPanel>
>                 <TextBlock Grid.Column="2"
>                            Text="{Binding StatusText}"
>                            Foreground="{Binding StatusColor}"
>                            FontSize="11" FontWeight="SemiBold"
>                            VerticalAlignment="Center"/>
>             </Grid>
>         </DataTemplate>
>         
>         <!-- ===== MultiTrigger 2：按钮——获得焦点+悬停 ===== -->
>         <Style x:Key="SmartButtonStyle" TargetType="Button">
>             <Setter Property="Background" Value="#333"/>
>             <Setter Property="Foreground" Value="White"/>
>             <Setter Property="BorderBrush" Value="#555"/>
>             <Setter Property="Padding" Value="12,6"/>
>             <Setter Property="FontSize" Value="12"/>
>             <Setter Property="Cursor" Value="Hand"/>
>             <Setter Property="Margin" Value="3"/>
>             <Style.Triggers>
>                 <Trigger Property="IsMouseOver" Value="True">
>                     <Setter Property="Background" Value="#444"/>
>                 </Trigger>
>                 <Trigger Property="IsFocused" Value="True">
>                     <Setter Property="BorderBrush" Value="#58A6FF"/>
>                 </Trigger>
>                 <!-- MultiTrigger：悬停+聚焦 → 最强高亮 -->
>                 <MultiTrigger>
>                     <MultiTrigger.Conditions>
>                         <Condition Property="IsMouseOver" Value="True"/>
>                         <Condition Property="IsFocused" Value="True"/>
>                     </MultiTrigger.Conditions>
>                     <Setter Property="Background" Value="#FF6B35"/>
>                     <Setter Property="BorderBrush" Value="#FF6B35"/>
>                 </MultiTrigger>
>             </Style.Triggers>
>         </Style>
>     </Window.Resources>
>     
>     <Grid Background="{StaticResource PageBg}">
>         <Grid.RowDefinitions>
>             <RowDefinition Height="Auto"/>
>             <RowDefinition Height="*"/>
>             <RowDefinition Height="Auto"/>
>         </Grid.RowDefinitions>
>         
>         <Border Grid.Row="0" Background="{StaticResource CardBg}"
>                 Padding="12,8" BorderBrush="#2A4A6C"
>                 BorderThickness="0,0,0,1">
>             <TextBlock Text="📎 MultiTrigger 多条件触发器演示"
>                        Foreground="#FF6B35" FontSize="16"
>                        FontWeight="Bold"/>
>         </Border>
>         
>         <!-- 设备列表 -->
>         <ListBox Grid.Row="1" Margin="15"
>                  ItemsSource="{Binding Devices}"
>                  ItemTemplate="{StaticResource DeviceRowTemplate}"
>                  ItemContainerStyle="{StaticResource DeviceCardItemStyle}"
>                  Background="Transparent"
>                  BorderThickness="0"/>
>         
>         <!-- 底部按钮 -->
>         <StackPanel Grid.Row="2" Orientation="Horizontal"
>                     HorizontalAlignment="Center" Margin="0,0,0,15">
>             <Button Content="启动设备"
>                     Style="{StaticResource SmartButtonStyle}"/>
>             <Button Content="停止设备"
>                     Style="{StaticResource SmartButtonStyle}"/>
>             <Button Content="参数配置"
>                     Style="{StaticResource SmartButtonStyle}"/>
>             <Button Content="诊断模式"
>                     Style="{StaticResource SmartButtonStyle}"/>
>         </StackPanel>
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
>         DataContext = new DeviceListViewModel();
>     }
> }
> 
> public class DeviceListViewModel
> {
>     public ObservableCollection<DeviceItem> Devices { get; } = new()
>     {
>         new() { Name="电机 M-101", ValueDisplay="1480 rpm",
>                 StatusColor="#3FB950", StatusText="正常" },
>         new() { Name="变频器 VFD-01", ValueDisplay="48.5 A",
>                 StatusColor="#CC2222", StatusText="报警" },
>         new() { Name="水泵 P-203", ValueDisplay="320 m³/h",
>                 StatusColor="#3FB950", StatusText="正常" },
>         new() { Name="传感器 S-12", ValueDisplay="23.5°C",
>                 StatusColor="#FFA726", StatusText="警告" },
>         new() { Name="PLC-CPU1", ValueDisplay="12% CPU",
>                 StatusColor="#999", StatusText="待机" },
>     };
> }
> 
> public class DeviceItem
> {
>     public string Name { get; set; } = "";
>     public string ValueDisplay { get; set; } = "";
>     public string StatusColor { get; set; } = "#999";
>     public string StatusText { get; set; } = "";
> }
> ```
>
> MultiTrigger 行为：
> | 场景 | 条件 | 效果 |
> |------|------|------|
> | 列表项悬停 | IsMouseOver=True | 浅蓝背景 |
> | 列表项选中 | IsSelected=True | 橙色边框 |
> | 列表项悬停+选中 | 两者都True | **更亮**的橙色背景 + 亮橙色边框 |
> | 按钮悬停 | IsMouseOver=True | 稍亮 |
> | 按钮聚焦 | IsFocused=True | 蓝色边框 |
> | 按钮悬停+聚焦 | 两者都True | **橙色**背景+边框（最强高亮） |

> [!scene] 适用场景
> - ✅ 列表项的"悬停+选中"双重高亮——悬停但没选中的项不要高亮
> - ✅ 按钮的"悬停+聚焦"态——表示"当前操作的按钮"
> - ✅ 控件的"启用+数据有效"同时判断——都满足才显示可交互外观
> - ✅ 设备的"在线+报警"——两个条件同时成立才闪烁
> - ✅ 导航菜单的"展开+选中"——子菜单打开且当前页匹配时才高亮
> - ❌ OR 逻辑——需要多个独立 Trigger 或 DataTrigger 配合

> [!pitfall] 常见踩坑
> - **坑1：MultiTrigger 和普通 Trigger 同时设同一个属性**。如 Trigger（IsMouseOver=True）设 Background=#444，MultiTrigger（IsMouseOver=True + IsFocused=True）设 Background=Orange。只要两个条件都满足，MultiTrigger 覆盖 Trigger。但如果 MultiTrigger 的条件之一不满足了（如失去焦点），它退出，Trigger 重新生效。解决方案：理解优先级——多个 Trigger 同时激活时，后声明的生效。
> - **坑2：Conditions 中写了超出控件范围的条件**。如 Condition Property="IsOpen" Value="True"——这是 ComboBox 的属性，用在 Button 上没有意义。解决方案：确认目标控件是否有此属性。
> - **坑3：忘了 Condition 的 Value 类型必须匹配**。Value="True" 对 bool 型属性是对的，但 Property 如果是枚举值需要写完整的枚举名。解决方案：依赖属性的类型就是 Condition.Value 需要的类型。

> [!best] 最佳实践
> - 代码注释中明确 MultiTrigger 的意图——"AND 逻辑：xxx 且 xxx 时触发"
> - MultiTrigger 通常作为"普通 Trigger 的扩展版本"——基础交互用 Trigger，复合交互用 MultiTrigger
> - 上位机中常用 MultiTrigger 表达"设备组合状态"——用户选中了设备 + 设备处于报警态 = 红色闪烁
> - 保持 Conditions 数量在 2-3 个以内——太多条件会让逻辑难以理解，考虑用代码后备

> [!practice] 上手练习
> - **Lv.1 照猫画虎**：为 ListBoxItem 创建 MultiTrigger——同时满足"选中+悬停"时显示深色背景
> - **Lv.2 小试牛刀**：创建"设备编辑模式指示器"——用 CheckBox 控制编辑模式（IsEditMode），用 TextBox 的 IsFocused 表示当前编辑项，MultiTrigger 表达"编辑模式开启+当前控件聚焦"时显示橙色发光边框
> - **Lv.3 融会贯通**：实现一个"动态工作表盘"——用 Slider 的值 + ToggleButton 的 IsChecked + 控件的 IsEnabled 三个条件组成 MultiTrigger，控制在特定条件下表盘的配色方案

> [!related] 相关知识链接
> - ← 前置：属性触发器 Trigger — 单条件触发器
> - → 后续：数据触发器 DataTrigger — 根据数据值触发
> - ⇄ 关联：MultiDataTrigger — 多条件数据触发器（基于绑定的多条件）
> - ⇄ 关联：各触发器适用场景对比 — 选择合适触发器的决策指南
> - 📖 官方文档：[MultiTrigger Class](https://docs.microsoft.com/en-us/dotnet/api/system.windows.multitrigger)
