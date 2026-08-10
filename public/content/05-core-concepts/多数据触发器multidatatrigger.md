---
title: 多数据触发器 MultiDataTrigger
section: 05-core-concepts
parent: 5.9 触发器
---

# 多数据触发器 MultiDataTrigger

> [!plain] 白话理解
> DataTrigger 解决了"一个数据条件触发一个动作"，但真实场景经常需要"多个数据条件同时成立"才触发——比如"设备在线（IsOnline=True）**且**温度超标（Temp>80）"时才报警，"用户有修改权限（CanEdit=True）**且**当前在编辑模式（IsEditMode=True）"时才显示保存按钮。**MultiDataTrigger** 就是 DataTrigger 的"多条件版"——`Conditions` 集合里每个 Condition 都是一条 Binding（而非属性），所有 Binding 的值都匹配才触发动作。

> [!def] 官方定义
> `MultiDataTrigger` 继承自 `TriggerBase`，与 DataTrigger 类似但支持多个数据条件。它包含一个 `Conditions` 集合，每个 Condition 指定一个 `Binding`（绑定到数据源）和一个 `Value`（触发值）。当且仅当所有 Condition 的 Binding 返回值都等于对应的 Value 时，Setters 被应用。MultiDataTrigger 的 Binding 必须指定目标数据路径，否则无意义。

> [!origin] 由来背景
> 上位机中普遍存在"组合条件"判断——单个传感器超限不一定触发报警（可能是瞬态毛刺），需要"多个传感器同时超限"或"一个传感器超限 + 设备在线 + 未静音"才触发。MultiDataTrigger 让这种"数据端的且逻辑"能在 XAML 中声明式表达，而非在 C# 代码中写复杂的 if-else 判断，保持了 MVVM 的纯粹性。

> [!essentials] 核心要点
> - **Binding 条件**：每个 Condition 使用 Binding（`Binding="{Binding Status}"`）而非 Property
> - **所有条件 AND**：全部匹配才触发
> - **可以绑定不同数据源的属性**：每个 Condition 独立绑定到不同路径
> - **支持 Converter**：Binding 中可以使用 IValueConverter
> - **与 MultiTrigger 的区别**：MultiTrigger 监控控件属性，MultiDataTrigger 监控数据
> - **应用场景偏少**：大部分情况下可用 IValueConverter + DataTrigger 替代

> [!example] 完整示例
>
> 演示上位机中 MultiDataTrigger 的组合条件判断。

> **MainWindow.xaml**
> ```xml
> <Window x:Class="HmiDemo.MainWindow"
>         xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
>         xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
>         Title="MultiDataTrigger 演示" Height="500" Width="700"
>         WindowStartupLocation="CenterScreen">
>     <Window.Resources>
>         <SolidColorBrush x:Key="PageBg" Color="#0D1117"/>
>         <SolidColorBrush x:Key="CardBg" Color="#161B22"/>
>         <SolidColorBrush x:Key="RunningColor" Color="#3FB950"/>
>         <SolidColorBrush x:Key="AlarmColor" Color="#CC2222"/>
>         <SolidColorBrush x:Key="WarningColor" Color="#FFA726"/>
>         
>         <!-- ===== DataTemplate：使用 MultiDataTrigger ===== -->
>         <DataTemplate x:Key="AlarmDeviceTemplate">
>             <Border x:Name="Card" CornerRadius="8"
>                     Padding="12" Margin="4" Width="210">
>                 <Border.Style>
>                     <Style TargetType="Border">
>                         <Setter Property="Background"
>                                 Value="{StaticResource CardBg}"/>
>                         <Setter Property="BorderBrush" Value="#444"/>
>                         <Setter Property="BorderThickness" Value="1"/>
>                         <Style.Triggers>
>                             <!-- 单独条件1：在线=正常 -->
>                             <DataTrigger Binding="{Binding IsOnline}"
>                                          Value="True">
>                                 <Setter Property="BorderBrush"
>                                         Value="{StaticResource RunningColor}"/>
>                             </DataTrigger>
>                             <!-- 单独条件2：温度超限 -->
>                             <DataTrigger Binding="{Binding IsOverTemp}"
>                                          Value="True">
>                                 <Setter Property="BorderBrush"
>                                         Value="{StaticResource WarningColor}"/>
>                                 <Setter Property="BorderThickness"
>                                         Value="1.5"/>
>                             </DataTrigger>
>                             <!-- ===== MultiDataTrigger：在线 + 温度超限 + 未静音 = 最严重报警 ===== -->
>                             <MultiDataTrigger>
>                                 <MultiDataTrigger.Conditions>
>                                     <Condition Binding="{Binding IsOnline}"
>                                                Value="True"/>
>                                     <Condition Binding="{Binding IsOverTemp}"
>                                                Value="True"/>
>                                     <Condition Binding="{Binding IsMuted}"
>                                                Value="False"/>
>                                 </MultiDataTrigger.Conditions>
>                                 <Setter Property="BorderBrush"
>                                         Value="{StaticResource AlarmColor}"/>
>                                 <Setter Property="BorderThickness"
>                                         Value="2.5"/>
>                                 <Setter Property="Background"
>                                         Value="#2a1515"/>
>                             </MultiDataTrigger>
>                         </Style.Triggers>
>                     </Style>
>                 </Border.Style>
>                 <StackPanel>
>                     <StackPanel Orientation="Horizontal">
>                         <Ellipse Width="10" Height="10"
>                                  VerticalAlignment="Center">
>                             <Ellipse.Style>
>                                 <Style TargetType="Ellipse">
>                                     <Setter Property="Fill" Value="#666"/>
>                                     <Style.Triggers>
>                                         <DataTrigger Binding="{Binding IsOnline}"
>                                                      Value="True">
>                                             <Setter Property="Fill"
>                                                     Value="{StaticResource RunningColor}"/>
>                                         </DataTrigger>
>                                         <MultiDataTrigger>
>                                             <MultiDataTrigger.Conditions>
>                                                 <Condition Binding="{Binding IsOnline}"
>                                                            Value="True"/>
>                                                 <Condition Binding="{Binding IsOverTemp}"
>                                                            Value="True"/>
>                                             </MultiDataTrigger.Conditions>
>                                             <Setter Property="Fill"
>                                                     Value="{StaticResource AlarmColor}"/>
>                                         </MultiDataTrigger>
>                                     </Style.Triggers>
>                                 </Style>
>                             </Ellipse.Style>
>                         </Ellipse>
>                         <TextBlock Text="{Binding Name}"
>                                    Foreground="White"
>                                    FontWeight="Bold" FontSize="14"
>                                    Margin="6,0,0,0"/>
>                     </StackPanel>
>                     <TextBlock Foreground="#3FB950" FontSize="18"
>                                FontWeight="Bold" FontFamily="Consolas"
>                                Margin="0,6,0,0">
>                         <Run Text="{Binding Temperature, StringFormat={}{0:F1}}"/>
>                         <Run Text=" °C" Foreground="#999" FontSize="12"/>
>                     </TextBlock>
>                     <TextBlock Text="{Binding StatusDescription}"
>                                FontSize="11" Margin="0,4,0,0">
>                         <TextBlock.Style>
>                             <Style TargetType="TextBlock">
>                                 <Setter Property="Foreground" Value="#3FB950"/>
>                                 <Style.Triggers>
>                                     <MultiDataTrigger>
>                                         <MultiDataTrigger.Conditions>
>                                             <Condition Binding="{Binding IsOnline}"
>                                                        Value="True"/>
>                                             <Condition Binding="{Binding IsOverTemp}"
>                                                        Value="True"/>
>                                         </MultiDataTrigger.Conditions>
>                                         <Setter Property="Foreground"
>                                                 Value="{StaticResource AlarmColor}"/>
>                                     </MultiDataTrigger>
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
>         </Grid.RowDefinitions>
>         
>         <Border Grid.Row="0" Background="{StaticResource CardBg}"
>                 Padding="12,8" BorderBrush="#2A4A6C"
>                 BorderThickness="0,0,0,1">
>             <StackPanel Orientation="Horizontal">
>                 <TextBlock Text="⚠ MultiDataTrigger 多数据条件演示"
>                            Foreground="#FF6B35" FontSize="16"
>                            FontWeight="Bold"/>
>                 <TextBlock Foreground="#999" FontSize="11"
>                            VerticalAlignment="Center"
>                            Margin="15,0,0,0">
>                     规则：在线 + 温度超限 + 未静音 = 严重报警
>                 </TextBlock>
>             </StackPanel>
>         </Border>
>         
>         <WrapPanel Grid.Row="1" Margin="15"
>                    ItemsSource="{Binding Devices}"
>                    ItemTemplate="{StaticResource AlarmDeviceTemplate}">
>             <WrapPanel.ItemsPanel>
>                 <ItemsPanelTemplate>
>                     <WrapPanel/>
>                 </ItemsPanelTemplate>
>             </WrapPanel.ItemsPanel>
>         </WrapPanel>
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
>         DataContext = new AlarmViewModel();
>     }
> }
> 
> public class AlarmViewModel
> {
>     public ObservableCollection<AlarmDeviceItem> Devices { get; } = new()
>     {
>         // 在线 + 温度正常 → 绿色边框
>         new() { Name="电机 M-101", Temperature=42.0, IsOnline=true,
>                 IsOverTemp=false, IsMuted=false,
>                 StatusDescription="运行正常" },
>         // 在线 + 超温 + 未静音 → 红色加粗边框（MultiDataTrigger 命中！）
>         new() { Name="变频器 VFD-01", Temperature=92.5, IsOnline=true,
>                 IsOverTemp=true, IsMuted=false,
>                 StatusDescription="⚠ 温度过高！请立即检查！" },
>         // 在线 + 超温 + 已静音 → 仅橙色边框（不命中 MultiDataTrigger）
>         new() { Name="水泵 P-203", Temperature=65.8, IsOnline=true,
>                 IsOverTemp=true, IsMuted=true,
>                 StatusDescription="⚠ 温度偏高（已静音）" },
>         // 离线 → 灰色
>         new() { Name="传感器 S-12", Temperature=0, IsOnline=false,
>                 IsOverTemp=false, IsMuted=false,
>                 StatusDescription="通讯中断" },
>     };
> }
> 
> public class AlarmDeviceItem
> {
>     public string Name { get; set; } = "";
>     public double Temperature { get; set; }
>     public bool IsOnline { get; set; }
>     public bool IsOverTemp { get; set; }
>     public bool IsMuted { get; set; }
>     public string StatusDescription { get; set; } = "";
> }
> ```
>
> MultiDataTrigger 的 AND 逻辑：
> | IsOnline | IsOverTemp | IsMuted | 触发结果 |
> |----------|-----------|---------|---------|
> | True | False | — | 仅 IsOnline DataTrigger → 绿色 |
> | True | True | False | **MultiDataTrigger 命中** → 红色 + 背景变深 |
> | True | True | True | 仅 IsOverTemp DataTrigger → 橙色（不命中 Multi） |
> | False | — | — | 默认灰色（无 DataTrigger 匹配） |

> [!scene] 适用场景
> - ✅ 设备状态组合判断——在线+报警+未确认=最高优先级
> - ✅ 权限 + 模式组合——可编辑+编辑模式=显示编辑按钮
> - ✅ 多传感器交叉验证——温度高+压力高=风险等级升级
> - ✅ UI 交互 + 数据状态——编辑模式+数据有变更+不脏=启用保存
> - ❌ 单一数据条件——用 DataTrigger 更简洁
> - ❌ 太多条件（> 4）——应抽取到 ViewModel 的计算属性中

> [!pitfall] 常见踩坑
> - **坑1：Conditions 中 Binding 路径写错不报错**。和普通 Binding 一样，路径错误 WPF 只会在 Output 窗口输出绑定错误，不会崩溃。解决方案：开启绑定追踪（`PresentationTraceSources.TraceLevel`）检查。
> - **坑2：忘了 Boolean 类型的 Value 在 XAML 中的写法**。写 `Value="True"` 是对的，写 `Value="true"` 就错了——XAML 中的布尔值区分大小写。解决方案：始终用 `True` / `False`（首字母大写）。
> - **坑3：MultiDataTrigger 的多个 Condition 绑定到同一个数据对象的不同属性，但对象更新不同步**。如果 IsOnline 和 IsOverTemp 分别通过不同时机更新，MultiDataTrigger 可能在数据"半新半旧"的状态下触发。解决方案：在 ViewModel 中原子化更新——通过一个方法同时设置所有相关属性。

> [!best] 最佳实践
> - 如果组合条件经常出现（如"在线+超温=严重"），在 ViewModel 中增加一个计算属性（如 `AlarmLevel`），然后用 DataTrigger 判断——比 MultiDataTrigger 逻辑更集中
> - MultiDataTrigger 适合"偶尔出现、组合数较少的 AND 条件"
> - 上位机报警逻辑用"数据 Condition 组合"表达：`设备在线 AND 值超限 AND 未确认` = 最高报警级别
> - Conditions 数量 ≤ 3——超过 3 个条件时，可读性和维护性急剧下降

> [!practice] 上手练习
> - **Lv.1 照猫画虎**：创建一个人员权限面板，用 MultiDataTrigger 判断"已登录 AND 是管理员"时显示系统配置按钮
> - **Lv.2 小试牛刀**：实现一个"PLC 通讯状态监控"——三个条件：连接状态（Connected/Disconnected）、通讯质量（Good/Poor）、错误计数（是否 > 10），用 MultiDataTrigger 实现 4 级状态指示（绿色/黄色/橙色/红色）
> - **Lv.3 融会贯通**：设计一个"设备保养预警系统"——综合设备运行时间、上次保养日期、当前状态（运行/停机）、部件磨损程度四个条件，用 MultiDataTrigger 实现保养预警的 UI 变色

> [!related] 相关知识链接
> - ← 前置：数据触发器 DataTrigger — 单数据条件触发器
> - → 后续：事件触发器 EventTrigger — 动画触发
> - ⇄ 关联：多条件触发器 MultiTrigger — 基于控件属性的多条件
> - ⇄ 关联：值转换器 IMultiValueConverter — 多值绑定的转换器
> - 📖 官方文档：[MultiDataTrigger Class](https://docs.microsoft.com/en-us/dotnet/api/system.windows.multidatatrigger)
