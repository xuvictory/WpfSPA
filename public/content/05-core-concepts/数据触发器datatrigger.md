---
title: 数据触发器 DataTrigger
section: 05-core-concepts
parent: 5.9 触发器
---

# 数据触发器 DataTrigger

> [!plain] 白话理解
> Trigger 只能监控控件的属性（如 IsMouseOver、IsEnabled），但上位机中真正重要的是**数据驱动的状态**——"温度超过 85°C → 显示红色""设备状态是 Alarm → 边框闪烁""当前用户没有权限 → 禁用按钮"。这些都是 ViewModel 中的数据值，不是控件属性。**DataTrigger** 专为此而生——它不监控控件的属性，而是监控**Binding 绑定的数据值**。本质上就是把 Trigger 的 `Property` 换成 `Binding`：当绑定的数据值等于指定值时触发。

> [!def] 官方定义
> `DataTrigger` 继承自 `TriggerBase`，与 Trigger 不同之处在于使用 `Binding` 而非 `Property` 作为监控源。DataTrigger 通过 Binding 订阅数据源中某个属性的变化，当值等于 `Value` 时触发 Setters。Binding 默认以当前元素的 DataContext 为源。DataTrigger 放置在 `Style.Triggers`、`ControlTemplate.Triggers`、`DataTemplate.Triggers` 中，常与 DataTemplate 配合实现数据驱动的 UI 变化。

> [!origin] 由来背景
> WPF 引入 MVVM 模式后，大量交互逻辑从"控件事件"转移到了"数据变化"。传统的 Trigger 只能监控控件自身的依赖属性，但这与 MVVM "UI 只反映数据"的理念不匹配。DataTrigger 使触发器系统也"数据化"——它从 ViewModel 的数据变化中获取触发条件，真正做到"数据驱动 UI"。这是 WPF 触发器体系中最能体现 MVVM 哲学的部分。

> [!essentials] 核心要点
> - **使用 Binding 而非 Property**：`Binding="{Binding Status}"` 监控 ViewModel 中的 Status 属性
> - **默认 DataContext 为源**：Binding 路径相对于当前 DataContext
> - **值匹配触发**：和 Trigger 一样，等于 Value 则触发，不等则还原
> - **可配合 Converter**：Binding 中可使用 IValueConverter 转换后再比较
> - **最常用于 DataTemplate**：根据数据类型或状态切换颜色、字体、可见性
> - **Value 类型需一致**：Binding 返回值的类型必须和 DataTrigger 的 Value 兼容

> [!example] 完整示例
>
> 演示 DataTrigger 在上位机设备监控中的核心用法——状态色驱动、报警变色、权限控制。

> **MainWindow.xaml**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="DataTrigger 演示" Height="550" Width="750"
>         WindowStartupLocation="CenterScreen">
>     <Window.Resources>
>         <SolidColorBrush x:Key="PageBg" Color="#0D1117"/>
>         <SolidColorBrush x:Key="CardBg" Color="#161B22"/>
>         <SolidColorBrush x:Key="RunningColor" Color="#3FB950"/>
>         <SolidColorBrush x:Key="AlarmColor" Color="#CC2222"/>
>         <SolidColorBrush x:Key="WarningColor" Color="#FFA726"/>
>         <SolidColorBrush x:Key="OfflineColor" Color="#666"/>
>         
>         <!-- ===== DataTemplate + DataTrigger：设备卡片 ===== -->
>         <DataTemplate x:Key="DeviceCardWithDataTrigger">
>             <Border x:Name="Card" Width="210" Margin="4"
>                     CornerRadius="8" Padding="12">
>                 <Border.Style>
>                     <Style TargetType="Border">
>                         <Setter Property="Background"
>                                 Value="{StaticResource CardBg}"/>
>                         <Setter Property="BorderBrush" Value="#444"/>
>                         <Setter Property="BorderThickness" Value="1"/>
>                         <Style.Triggers>
>                             <!-- DataTrigger1：正常运行 → 绿色边框 -->
>                             <DataTrigger Binding="{Binding Status}"
>                                          Value="Running">
>                                 <Setter Property="BorderBrush"
>                                         Value="{StaticResource RunningColor}"/>
>                             </DataTrigger>
>                             <!-- DataTrigger2：报警 → 红色边框加粗 -->
>                             <DataTrigger Binding="{Binding Status}"
>                                          Value="Alarm">
>                                 <Setter Property="BorderBrush"
>                                         Value="{StaticResource AlarmColor}"/>
>                                 <Setter Property="BorderThickness"
>                                         Value="2"/>
>                             </DataTrigger>
>                             <!-- DataTrigger3：警告 → 橙色边框 -->
>                             <DataTrigger Binding="{Binding Status}"
>                                          Value="Warning">
>                                 <Setter Property="BorderBrush"
>                                         Value="{StaticResource WarningColor}"/>
>                             </DataTrigger>
>                         </Style.Triggers>
>                     </Style>
>                 </Border.Style>
>                 <StackPanel>
>                     <StackPanel Orientation="Horizontal">
>                         <Ellipse Width="10" Height="10"
>                                  VerticalAlignment="Center">
>                             <Ellipse.Style>
>                                 <Style TargetType="Ellipse">
>                                     <Setter Property="Fill"
>                                             Value="{StaticResource OfflineColor}"/>
>                                     <Style.Triggers>
>                                         <DataTrigger Binding="{Binding Status}"
>                                                      Value="Running">
>                                             <Setter Property="Fill"
>                                                     Value="{StaticResource RunningColor}"/>
>                                         </DataTrigger>
>                                         <DataTrigger Binding="{Binding Status}"
>                                                      Value="Alarm">
>                                             <Setter Property="Fill"
>                                                     Value="{StaticResource AlarmColor}"/>
>                                         </DataTrigger>
>                                     </Style.Triggers>
>                                 </Style>
>                             </Ellipse.Style>
>                         </Ellipse>
>                         <TextBlock Text="{Binding Name}"
>                                    Foreground="White"
>                                    FontWeight="Bold" FontSize="14"
>                                    Margin="6,0,0,0"/>
>                     </StackPanel>
>                     <TextBlock Margin="0,8,0,0"
>                                FontFamily="Consolas" FontSize="18"
>                                FontWeight="Bold">
>                         <Run Text="{Binding Value, StringFormat={}{0:F1}}"
>                              Foreground="#3FB950"/>
>                         <Run Text=" " Foreground="#999"/>
>                         <Run Text="{Binding Unit}" Foreground="#999"
>                              FontSize="12"/>
>                     </TextBlock>
>                     
>                     <!-- 状态文字 + DataTrigger 驱动颜色 -->
>                     <TextBlock Text="{Binding StatusText}"
>                                FontSize="11" Margin="0,4,0,0">
>                         <TextBlock.Style>
>                             <Style TargetType="TextBlock">
>                                 <Setter Property="Foreground" Value="#999"/>
>                                 <Style.Triggers>
>                                     <DataTrigger Binding="{Binding Status}"
>                                                  Value="Running">
>                                         <Setter Property="Foreground"
>                                                 Value="#3FB950"/>
>                                     </DataTrigger>
>                                     <DataTrigger Binding="{Binding Status}"
>                                                  Value="Alarm">
>                                         <Setter Property="Foreground"
>                                                 Value="#CC2222"/>
>                                     </DataTrigger>
>                                     <DataTrigger Binding="{Binding Status}"
>                                                  Value="Warning">
>                                         <Setter Property="Foreground"
>                                                 Value="#FFA726"/>
>                                     </DataTrigger>
>                                 </Style.Triggers>
>                             </Style>
>                         </TextBlock.Style>
>                     </TextBlock>
>                 </StackPanel>
>             </Border>
>         </DataTemplate>
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
>             <TextBlock Text="📊 DataTrigger 数据触发演示"
>                        Foreground="#FF6B35" FontSize="16"
>                        FontWeight="Bold"/>
>         </Border>
>         
>         <!-- 设备卡片：DataTrigger 根据 Status 自动变色 -->
>         <WrapPanel Grid.Row="1" Margin="15"
>                    ItemsSource="{Binding Devices}"
>                    ItemTemplate="{StaticResource DeviceCardWithDataTrigger}">
>             <WrapPanel.ItemsPanel>
>                 <ItemsPanelTemplate>
>                     <WrapPanel/>
>                 </ItemsPanelTemplate>
>             </WrapPanel.ItemsPanel>
>         </WrapPanel>
>         
>         <!-- 权限控制演示：DataTrigger 控制按钮可见性 -->
>         <Border Grid.Row="2" Background="{StaticResource CardBg}"
>                 Padding="12,8">
>             <StackPanel Orientation="Horizontal"
>                         HorizontalAlignment="Center">
>                 <Button Content="🔄 刷新"
>                         Background="#333" Foreground="White"
>                         Margin="3" Width="90"/>
>                 <!-- 管理员按钮：DataTrigger 根据 IsAdmin 数据控制可见 -->
>                 <Button x:Name="AdminBtn" Content="🔧 管理员配置"
>                         Background="#662222" Foreground="White"
>                         Margin="3" Width="120">
>                     <Button.Style>
>                         <Style TargetType="Button">
>                             <Setter Property="Visibility"
>                                     Value="Collapsed"/>
>                             <Style.Triggers>
>                                 <DataTrigger
>                                     Binding="{Binding IsAdmin}"
>                                     Value="True">
>                                     <Setter Property="Visibility"
>                                             Value="Visible"/>
>                                 </DataTrigger>
>                             </Style.Triggers>
>                         </Style>
>                     </Button.Style>
>                 </Button>
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
>         DataContext = new MonitorViewModel();
>     }
> }
> 
> public class MonitorViewModel
> {
>     public bool IsAdmin { get; set; } = true;
> 
>     public ObservableCollection<DeviceItem> Devices { get; } = new()
>     {
>         new() { Name="电机 M-101", Value=1480.0, Unit="rpm",
>                 Status="Running", StatusText="运行中" },
>         new() { Name="变频器 VFD-01", Value=48.5, Unit="A",
>                 Status="Alarm", StatusText="过载报警" },
>         new() { Name="水泵 P-203", Value=320.5, Unit="m³/h",
>                 Status="Running", StatusText="运行中" },
>         new() { Name="传感器 S-12", Value=85.3, Unit="°C",
>                 Status="Warning", StatusText="温度偏高" },
>         new() { Name="PLC-CPU1", Value=12.0, Unit="%",
>                 Status="Offline", StatusText="离线" },
>         new() { Name="阀门 V-303", Value=75.0, Unit="%",
>                 Status="Running", StatusText="运行中" },
>     };
> }
> 
> public class DeviceItem
> {
>     public string Name { get; set; } = "";
>     public double Value { get; set; }
>     public string Unit { get; set; } = "";
>     public string Status { get; set; } = "Offline";
>     public string StatusText { get; set; } = "";
> }
> ```
>
> DataTrigger 驱动的视觉效果：
> | 设备状态 | 边框色 | 状态灯 | 文字色 |
> |---------|--------|--------|--------|
> | Running | #3FB950 绿色 | 绿色 | 绿色 |
> | Alarm | #CC2222 红色加粗 | 红色 | 红色 |
> | Warning | #FFA726 橙色 | 绿色 | 橙色 |
> | Offline | #444 灰色 | 灰色 | 灰色 |

> [!scene] 适用场景
> - ✅ 设备状态驱动的配色——正常运行=绿色、报警=红色、警告=橙色
> - ✅ 权限控制——根据用户角色显示/隐藏功能按钮
> - ✅ 数据有效性指示——输入值超出范围时自动变色
> - ✅ 温度/压力等模拟量阈值指示——值 > 上限 → 红色
> - ✅ 枚举值映射外观——根据枚举值选择不同图标/颜色
> - ❌ 需要复杂的数值范围判断——如 0-50=绿色、50-80=黄色、80-100=红色（应使用 IValueConverter）

> [!pitfall] 常见踩坑
> - **坑1：DataTrigger 的 Value 是"精确匹配"而非"范围判断"**。`Value="Alarm"` 只匹配 Status 属性恰好等于字符串 "Alarm"，不能写 `Value=">80"` 来匹配数值范围。解决方案：数值范围判断用 IValueConverter 将数值转为离散状态（如 Normal/Warning/Danger），再用 DataTrigger 匹配。
> - **坑2：DataTrigger 的 Value 类型和 Binding 返回类型不一致**。如 Binding 返回枚举值（`MyEnum.Alarm`），但 Value 写成了字符串 `"Alarm"`。解决方案：确保类型一致；枚举值用 `Value="{x:Static local:MyEnum.Alarm}"`。
> - **坑3：在 ControlTemplate 中用 DataTrigger 不生效**。ControlTemplate 内部的 DataContext 可能不是 ViewModel。解决方案：确认模板内元素的 DataContext 正确；必要时用 `RelativeSource` 找到模板级 DataContext。

> [!best] 最佳实践
> - 上位机中设备状态的"四色标准"用 DataTrigger 实现——Running=绿、Warning=橙、Alarm=红、Offline=灰
> - 大规模设备列表用 DataTrigger 而非每个单元格设值转换器——DataTrigger 只需要一套 Style，性能更好
> - 将颜色的 DataTrigger 集中在控件的 Style 中，不要散落在 Binding 的 Converter 里——更容易维护
> - 对于频繁变化的数据（如实时温度），DataTrigger 的触发频率 = 数据刷新频率，注意性能

> [!practice] 上手练习
> - **Lv.1 照猫画虎**：创建 5 台设备的监控面板，用 DataTrigger 根据 Status 属性自动切换每个卡片的边框色和状态灯颜色
> - **Lv.2 小试牛刀**：实现一个"温度仪表盘"——温度 < 30°C 蓝色、30~60°C 绿色、60~80°C 橙色、> 80°C 红色。用 IValueConverter 将温度转为状态字符串，再用 DataTrigger 切换颜色
> - **Lv.3 融会贯通**：设计一个"报警级别矩阵"——用 DataTrigger 驱动整个 DataGrid 的样式，根据每行数据的报警级别自动切换行背景色、文字色、图标、操作按钮的可用状态

> [!related] 相关知识链接
> - ← 前置：MultiTrigger — 多条件属性触发器
> - → 后续：多数据触发器 MultiDataTrigger — 多个数据条件同时满足
> - ⇄ 关联：值转换器 IValueConverter — DataTrigger 配合 Converter 做数值范围判断
> - ⇄ 关联：DataTemplate — DataTrigger 最常用的场景
> - 📖 官方文档：[DataTrigger Class](https://docs.microsoft.com/en-us/dotnet/api/system.windows.datatrigger)
